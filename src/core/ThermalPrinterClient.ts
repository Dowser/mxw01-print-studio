// Platform-agnostic thermal printer client
// Simplified with delegated responsibilities

import { MXW01Printer } from "../services/printer";
import { EventEmitter } from "./EventEmitter";
import { ClientState } from "./ClientState";
import { PrintJob } from "./PrintJob";
import { PrinterError, asPrinterError } from "./errors";
import type {
  BluetoothAdapter,
  BluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
  BluetoothNotificationEvent,
  PrinterState,
  PrinterEventType,
  PrinterEventListener,
  PrinterImageData,
  PrintOptions,
  ImageProcessorOptions,
} from "./types";
import type { PrintJobPhase, RasterPage } from "./print-types";
import type { PrinterProfile } from "./print-types";
import { MXW01_PRINTER_PROFILE } from "./printerProfiles";

function bufferSourceToUint8Array(data: BufferSource): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new TypeError("Unsupported Bluetooth write buffer");
}

/**
 * Platform-agnostic thermal printer client
 * Works with any BluetoothAdapter implementation (Web Bluetooth, Noble, etc.)
 */
export class ThermalPrinterClient {
  private adapter: BluetoothAdapter;
  private printer: MXW01Printer | null = null;
  private connection: (BluetoothConnection & BluetoothServiceInfo) | null = null;
  private device: BluetoothDevice | null = null;
  private eventEmitter: EventEmitter;
  private state: ClientState;
  private readonly profile: PrinterProfile;
  private connectPromise: Promise<void> | null = null;
  private disconnectRequested = false;
  private connectionGeneration = 0;
  private notificationListener: ((event: BluetoothNotificationEvent) => void) | null = null;
  private connectionDisconnectUnsubscribe: (() => void) | null = null;
  private handlingUnexpectedDisconnect = false;
  private activePrintToken: symbol | null = null;
  private activePrintPromise: Promise<void> | null = null;

  constructor(
    adapter: BluetoothAdapter,
    profile: PrinterProfile = MXW01_PRINTER_PROFILE
  ) {
    if (!adapter.isAvailable()) {
      throw new PrinterError(
        "bluetooth-unavailable",
        "Bluetooth is not available in this environment"
      );
    }
    this.adapter = adapter;
    this.eventEmitter = new EventEmitter();
    this.state = new ClientState();
    this.profile = profile;
  }

  get printerProfile(): PrinterProfile {
    return this.profile;
  }

  get connectedDevice(): BluetoothDevice | null {
    return this.device;
  }

  // Public getters delegated to state
  get isConnected(): boolean {
    return this.state.isConnected;
  }

  get isPrinting(): boolean {
    return this.state.isPrinting;
  }

  get printerState(): PrinterState | null {
    return this.state.printerState;
  }

  get statusVerified(): boolean {
    return this.state.statusVerified;
  }

  get isPrintReady(): boolean {
    const status = this.printerState;
    return this.state.isConnected && this.state.statusVerified && status !== null && !status.printing && !status.paper_jam && !status.out_of_paper && !status.cover_open && !status.battery_low && !status.overheat;
  }

  get statusMessage(): string {
    return this.state.statusMessage;
  }

  get ditherMethod(): ImageProcessorOptions["dither"] {
    return this.state.ditherMethod;
  }

  get printIntensity(): number {
    return this.state.printIntensity;
  }

  // Public setters delegated to state
  setDitherMethod(method: ImageProcessorOptions["dither"]): void {
    this.state.setDitherMethod(method);
  }

  setPrintIntensity(intensity: number): void {
    this.state.setPrintIntensity(intensity);
  }

  /**
   * Subscribe to events
   */
  on<T extends PrinterEventType>(
    eventType: T,
    listener: PrinterEventListener<T>
  ): () => void {
    return this.eventEmitter.on(eventType, listener);
  }

  /**
   * Update status message and emit state change if needed
   */
  private updateStatus(message: string, newPrinterState?: PrinterState): void {
    this.state.setStatusMessage(message);

    if (newPrinterState) {
      this.state.setPrinterState(newPrinterState);
      this.eventEmitter.emit({ type: "stateChange", state: newPrinterState });
    }
  }

  /**
   * Connect to printer via Bluetooth
   */
  async connect(): Promise<void> {
    if (this.state.isConnected) {
      return;
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.disconnectRequested = false;
    const operation = this.connectInternal();
    this.connectPromise = operation;
    try {
      await operation;
    } finally {
      if (this.connectPromise === operation) {
        this.connectPromise = null;
      }
    }
  }

  private async connectInternal(): Promise<void> {
    try {
      this.updateStatus("Connecting to printer...");

      // Request and connect to device
      this.device = await this.adapter.requestDevice();
      this.connection = await this.adapter.connect(this.device);
      const generation = ++this.connectionGeneration;
      if (this.disconnectRequested) {
        throw new PrinterError("cancelled", "Connection cancelled");
      }
      this.connectionDisconnectUnsubscribe = this.connection.onDisconnect?.(
        (error) => void this.handleUnexpectedDisconnect(error)
      ) ?? null;

      // Initialize printer
      const bluetoothConnection = this.connection;
      if (!bluetoothConnection) {
        throw new PrinterError("connection-failed", "Bluetooth connection disappeared during setup");
      }
      this.printer = new MXW01Printer(
        async (data) => {
          await bluetoothConnection.controlCharacteristic.writeValueWithoutResponse(bufferSourceToUint8Array(data));
        },
        async (data) => {
          await bluetoothConnection.dataCharacteristic.writeValueWithoutResponse(bufferSourceToUint8Array(data));
        },
        this.profile
      );

      // Setup notifications
      await this.setupNotifications();
      this.assertConnectionSession(generation);

      // A few MXW01 firmware versions do not answer the first status request
      // immediately after notifications are enabled. Retry briefly before
      // accepting the connection; a missing status must not discard a usable
      // Bluetooth link, but it is reported honestly to the caller.
      const initialState = await this.verifyInitialStatus(generation);
      this.assertConnectionSession(generation);
      this.state.setConnected(true);
      this.state.setStatusVerified(initialState !== null);
      this.updateStatus(initialState ? "Printer connected" : "Printer connected; status unavailable");
      this.eventEmitter.emit({ type: "connected", device: this.device });
    } catch (error) {
      this.state.reset();
      await this.cleanupConnection();
      const err = asPrinterError(error, "connection-failed");
      this.updateStatus(`Error: ${err.message}`);
      this.eventEmitter.emit({ type: "error", error: err });
      throw err;
    }
  }

  /**
   * Setup notification listener
   */
  private async setupNotifications(): Promise<void> {
    if (!this.connection || !this.printer) {
      throw new Error("No connection or printer available");
    }

    const notifier = (event: { readonly value: Uint8Array }) => {
      if (event.value && this.printer) {
        if (this.printer.notifyStrict(event.value)) {
          this.state.setStatusVerified(true);
          this.updateStatus("Printer state updated", { ...this.printer.state });
        }
      }
    };

    await this.connection.notifyCharacteristic.startNotifications();
    this.connection.notifyCharacteristic.addEventListener(
      "characteristicvaluechanged",
      notifier
    );
    this.notificationListener = notifier;
  }

  private async handleUnexpectedDisconnect(error?: Error): Promise<void> {
    if (this.handlingUnexpectedDisconnect || (!this.connection && !this.state.isConnected)) {
      return;
    }
    this.handlingUnexpectedDisconnect = true;
    try {
      await this.cleanupConnection();
      this.state.reset();
      this.updateStatus(error ? `Error: ${error.message}` : "Printer disconnected");
      if (error) {
        this.eventEmitter.emit({ type: "error", error: asPrinterError(error, "transport") });
      }
      this.eventEmitter.emit({ type: "disconnected" });
    } finally {
      this.handlingUnexpectedDisconnect = false;
    }
  }

  /**
   * Get current printer status
   */
  async getStatus(allowConnecting = false, timeoutMs = 5000, emitError = true): Promise<PrinterState | null> {
    if (!this.printer || (!this.state.isConnected && !allowConnecting)) {
      this.updateStatus("Printer not connected");
      return null;
    }

    try {
      const response = await this.printer.requestStatus(timeoutMs);
      if (response.length < 7) {
        throw new PrinterError("protocol", "Printer status response is too short", {
          recoverable: true,
        });
      }
      const newState = { ...this.printer.state };
      this.state.setStatusVerified(true);
      this.updateStatus("Status updated", newState);
      return newState;
    } catch (error) {
      const err = asPrinterError(error, "transport");
      this.state.setStatusVerified(false);
      this.state.setPrinterState(null);
      this.updateStatus(`Error: ${err.message}`);
      if (emitError) this.eventEmitter.emit({ type: "error", error: err });
      return null;
    }
  }

  private async verifyInitialStatus(generation: number): Promise<PrinterState | null> {
    const attempts = 3;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      this.assertConnectionSession(generation);
      const status = await this.getStatus(true, 1800, false);
      if (status) return status;
      if (attempt < attempts - 1) {
        this.updateStatus(`Waiting for printer status (${attempt + 2}/${attempts})...`);
        await new Promise<void>((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
    return null;
  }

  /** Refresh status and fail closed when the physical printer is not safe to use. */
  async ensurePrintReady(timeoutMs = 3000): Promise<PrinterState> {
    if (!this.printer || !this.state.isConnected) {
      throw new PrinterError("not-connected", "Printer not connected");
    }
    const status = await this.getStatus(false, timeoutMs, false);
    if (!status) {
      throw new PrinterError("timeout", "Printer status could not be verified", { recoverable: true });
    }
    const faults: string[] = [];
    if (status.printing) faults.push("printer is already printing");
    if (status.paper_jam) faults.push("paper jam");
    if (status.out_of_paper) faults.push("out of paper");
    if (status.cover_open) faults.push("cover open");
    if (status.battery_low) faults.push("battery low");
    if (status.overheat) faults.push("overheated");
    if (faults.length > 0) {
      throw new PrinterError("printer-fault", `Printer is not ready: ${faults.join(", ")}`, { recoverable: true });
    }
    return status;
  }

  private emitPrintProgress(
    phase: PrintJobPhase,
    progress: number,
    sentBytes = 0,
    totalBytes = 0
  ): void {
    this.eventEmitter.emit({
      type: "printProgress",
      phase,
      progress: Math.max(0, Math.min(100, progress)),
      sentBytes,
      totalBytes,
    });
  }

  /**
   * Print from image data
   */
  async print(
    imageData: PrinterImageData,
    options: PrintOptions = {}
  ): Promise<void> {
    const operation = this.printInternal(imageData, options);
    this.activePrintPromise = operation;
    try {
      await operation;
    } finally {
      if (this.activePrintPromise === operation) {
        this.activePrintPromise = null;
      }
    }
  }

  /**
   * Send a raster that has already been rendered for this printer profile.
   *
   * Document renderers can apply brightness and dithering before this method
   * is called. Keeping that raster intact is important: processing it again
   * would make the physical output differ from the preview and would apply
   * dithering twice.
   */
  async printRaster(
    raster: RasterPage,
    options: Pick<PrintOptions, "intensity"> = {}
  ): Promise<void> {
    const intensity = options.intensity ?? this.state.printIntensity;
    this.validateRaster(raster);
    if (!Number.isInteger(intensity) || !Number.isFinite(intensity) || intensity < 0 || intensity > 255) {
      throw new PrinterError("protocol", `Print intensity must be an integer between 0 and 255, got ${intensity}`);
    }
    const operation = this.printRasterInternal(raster, intensity);
    this.activePrintPromise = operation;
    try {
      await operation;
    } finally {
      if (this.activePrintPromise === operation) {
        this.activePrintPromise = null;
      }
    }
  }

  private async printInternal(
    imageData: PrinterImageData,
    options: PrintOptions = {}
  ): Promise<void> {
    const printJob = new PrintJob(imageData, options, this.profile);
    const { raster } = printJob.prepare(this.state.ditherMethod);
    const intensity = printJob.getIntensity(this.state.printIntensity);
    await this.printRasterInternal(raster, intensity);
  }

  private validateRaster(raster: RasterPage): void {
    const expectedBytes = raster
      ? raster.wireHeightRows * raster.bytesPerRow
      : Number.NaN;
    if (
      !raster ||
      raster.widthDots !== this.profile.widthDots ||
      raster.bytesPerRow !== this.profile.bytesPerRow ||
      raster.heightDots !== raster.contentHeightRows ||
      !Number.isSafeInteger(raster.contentHeightRows) ||
      raster.contentHeightRows <= 0 ||
      raster.contentHeightRows > 0xffff ||
      !Number.isSafeInteger(raster.wireHeightRows) ||
      raster.wireHeightRows < this.profile.minimumRows ||
      raster.wireHeightRows < raster.contentHeightRows ||
      raster.wireHeightRows > 0xffff ||
      raster.bitOrder !== this.profile.bitOrder ||
      raster.blackIsOne !== this.profile.blackIsOne ||
      !Number.isSafeInteger(expectedBytes) ||
      !(raster.data instanceof Uint8Array) ||
      raster.data.length !== expectedBytes
    ) {
      throw new PrinterError("protocol", "Raster does not match the printer profile");
    }
  }

  private async printRasterInternal(
    raster: RasterPage,
    intensity: number
  ): Promise<void> {
    this.validateRaster(raster);
    const printer = this.printer;
    const generation = this.connectionGeneration;
    if (!printer || !this.state.isConnected) {
      throw new PrinterError("not-connected", "Printer not connected");
    }
    if (this.state.isPrinting) {
      throw new PrinterError(
        "busy",
        "Another print job is already running",
        { recoverable: true }
      );
    }

    const imageBuffer = raster.data;
    const numLines = raster.contentHeightRows;
    let lastProgress = 0;
    const printToken = Symbol("print-job");
    this.activePrintToken = printToken;
    try {
      this.assertActiveSession(printer, generation);
      // Fail closed before mutating printer settings or reserving the physical job.
      await this.ensurePrintReady();
      this.assertActiveSession(printer, generation);
      this.state.setPrinting(true);
      this.emitPrintProgress("queued", 0);
      this.updateStatus("Preparing to print...");
      this.emitPrintProgress("preparing", 2);

      // Configure printer
      this.updateStatus("Configuring printer...");
      this.emitPrintProgress("configuring", 10, 0, imageBuffer.length);
      await printer.setIntensity(intensity);
      this.assertActiveSession(printer, generation);

      // Send print request
      this.updateStatus("Sending data...");
      this.emitPrintProgress("sending", 15, 0, imageBuffer.length);
      const printGeneration = printer.prepareForPrint();
      const ack = await printer.printRequest(numLines, 0);
      this.assertActiveSession(printer, generation);
      if (!ack || ack[0] !== 0) {
        throw new PrinterError(
          "printer-rejected",
          "Print request rejected",
          { recoverable: true }
        );
      }

      // Send the already-rendered raster without applying image processing again.
      await printer.sendDataChunks(imageBuffer, undefined, (sent, total) => {
        lastProgress = 15 + (sent / Math.max(total, 1)) * 65;
        this.emitPrintProgress("sending", lastProgress, sent, total);
      });
      this.assertActiveSession(printer, generation);
      await printer.flushData();

      // Wait for completion
      this.updateStatus("Printing...");
      lastProgress = 85;
      this.emitPrintProgress("printing", lastProgress, imageBuffer.length, imageBuffer.length);
      await printer.waitForPrintComplete(20000, printGeneration);
      this.assertActiveSession(printer, generation);

      this.updateStatus("Print completed");
      this.emitPrintProgress("completed", 100, imageBuffer.length, imageBuffer.length);
      await this.getStatus();
    } catch (error) {
      const err = asPrinterError(error);
      this.updateStatus(`Error: ${err.message}`);
      this.emitPrintProgress(
        err.code === "cancelled" ? "cancelled" : "failed",
        lastProgress
      );
      this.eventEmitter.emit({ type: "error", error: err });
      throw err;
    } finally {
      if (this.activePrintToken === printToken) {
        this.activePrintToken = null;
        this.state.setPrinting(false);
      }
    }
  }

  private assertConnectionSession(generation: number): void {
    if (
      this.connectionGeneration !== generation ||
      !this.connection ||
      this.disconnectRequested
    ) {
      throw new PrinterError("cancelled", "The printer connection changed during setup", {
        recoverable: true,
      });
    }
  }

  private assertActiveSession(
    printer: MXW01Printer,
    generation: number
  ): void {
    if (
      this.printer !== printer ||
      this.connectionGeneration !== generation ||
      !this.state.isConnected
    ) {
      throw new PrinterError("cancelled", "The printer connection changed during the print job", { recoverable: true });
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    this.disconnectRequested = true;
    if (this.connectPromise) {
      try {
        await this.connectPromise;
      } catch (_error) {
        // The requested disconnect still cleans up any partial connection.
      }
    }
    if (this.state.isPrinting) {
      throw new PrinterError(
        "busy",
        "Cannot disconnect while a print job is running",
        { recoverable: true }
      );
    }

    await this.cleanupConnection();
    this.state.reset();
    this.updateStatus("Printer disconnected");
    this.eventEmitter.emit({ type: "disconnected" });
  }

  private async cleanupConnection(): Promise<void> {
    this.connectionGeneration += 1;
    this.activePrintToken = null;
    const connection = this.connection;
    const listener = this.notificationListener;
    const disconnectUnsubscribe = this.connectionDisconnectUnsubscribe;
    this.notificationListener = null;
    this.connectionDisconnectUnsubscribe = null;
    this.connection = null;

    disconnectUnsubscribe?.();

    if (connection?.notifyCharacteristic && listener) {
      try {
        connection.notifyCharacteristic.removeEventListener(
          "characteristicvaluechanged",
          listener
        );
      } catch (error) {
        console.warn("Error removing notifications:", error);
      }
    }

    if (connection?.notifyCharacteristic) {
      try {
        await connection.notifyCharacteristic.stopNotifications();
      } catch (error) {
        console.warn("Error stopping notifications:", error);
      }
    }

    if (connection) {
      try {
        await connection.disconnect();
      } catch (error) {
        console.warn("Error disconnecting:", error);
      }
    }

    this.printer?.dispose();
    this.printer = null;
    this.device = null;
  }

  /**
   * Dispose of the client and clean up resources
   */
  async dispose(): Promise<void> {
    this.disconnectRequested = true;
    if (this.connectPromise) {
      try {
        await this.connectPromise;
      } catch (_error) {
        // Continue with best-effort cleanup below.
      }
    }
    if (this.state.isPrinting || this.activePrintPromise) {
      await this.cleanupConnection();
      this.state.reset();
    } else {
      await this.disconnect();
    }
    if (this.activePrintPromise) {
      await Promise.race([
        this.activePrintPromise.catch(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
      ]);
    }
    this.eventEmitter.clear();
  }
}
