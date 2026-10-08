// MXW01 Thermal Printer - Simplified with delegated responsibilities

import { delay } from "../utils/helpers";
import {
  FrameDecoder,
  makeCommand,
  parseNotification,
  Command,
} from "./protocol";
import { PrinterStateManager } from "./printerState";
import type { PrinterState } from "./printerState";
import type { ByteTransport, PrinterProfile } from "../core/print-types";
import { MXW01_PRINTER_PROFILE } from "../core/printerProfiles";
import { PrinterError } from "../core/errors";
import { CallbackByteTransport } from "./transport";
import type { ByteWriteFunction } from "./transport";
import { packMonoRaster } from "./raster";

export const PRINTER_WIDTH = MXW01_PRINTER_PROFILE.widthDots;
export const PRINTER_WIDTH_BYTES = MXW01_PRINTER_PROFILE.bytesPerRow;
export const MIN_DATA_BYTES =
  MXW01_PRINTER_PROFILE.minimumRows * MXW01_PRINTER_PROFILE.bytesPerRow;

// Re-export for backward compatibility
export { Command, type PrinterState };
export { MXW01_PRINTER_PROFILE } from "../core/printerProfiles";
export type { PrinterProfile } from "../core/print-types";

// Type for Bluetooth write functions
export type WriteFunction = ByteWriteFunction;

/**
 * MXW01 Thermal Printer Controller
 * Simplified class that delegates to protocol and state management modules
 */
export class MXW01Printer {
  private readonly transport: ByteTransport;
  private readonly profileDefinition: PrinterProfile;
  private stateManager: PrinterStateManager;
  private readonly frameDecoder = new FrameDecoder();
  private readonly notificationFrameDecoder = new FrameDecoder();
  private readonly unsubscribeBytes: (() => void) | null;
  private readonly unsubscribeDisconnect: (() => void) | null;
  private disposed = false;
  private statusRequestPromise: Promise<Uint8Array> | null = null;

  constructor(transport: ByteTransport, profile?: PrinterProfile);
  constructor(
    controlWrite: WriteFunction,
    dataWrite: WriteFunction,
    profile?: PrinterProfile
  );
  constructor(
    transportOrControlWrite: ByteTransport | WriteFunction,
    dataWriteOrProfile?: WriteFunction | PrinterProfile,
    profileArgument?: PrinterProfile
  ) {
    this.stateManager = new PrinterStateManager();

    if (typeof transportOrControlWrite === "function") {
      if (typeof dataWriteOrProfile !== "function") {
        throw new Error("A data characteristic writer is required");
      }

      const profile = profileArgument ?? MXW01_PRINTER_PROFILE;
      this.transport = new CallbackByteTransport(
        transportOrControlWrite,
        dataWriteOrProfile,
        profile.dataChunkSize
      );
      this.profileDefinition = profile;
      this.unsubscribeBytes = null;
      this.unsubscribeDisconnect = null;
    } else {
      this.transport = transportOrControlWrite;
      this.profileDefinition =
        typeof dataWriteOrProfile === "function" || dataWriteOrProfile === undefined
          ? profileArgument ?? MXW01_PRINTER_PROFILE
          : dataWriteOrProfile;
      this.unsubscribeBytes = this.transport.onBytes((data) => {
        const frames = this.frameDecoder.feed(data);
        frames.forEach((frame) => {
          this.stateManager.processNotification(frame.cmdId, frame.payload);
        });
      });
      this.unsubscribeDisconnect = this.transport.onDisconnect((error) => {
        this.stateManager.rejectPending(
          error ?? new PrinterError("transport", "Printer transport disconnected", {
            recoverable: true,
          })
        );
      });
    }
  }

  get profile(): PrinterProfile {
    return this.profileDefinition;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.unsubscribeBytes?.();
    this.unsubscribeDisconnect?.();
    this.stateManager.rejectPending(
      new PrinterError("cancelled", "Printer controller disposed")
    );
    this.frameDecoder.reset();
    this.notificationFrameDecoder.reset();
  }

  /**
   * Get current printer state
   */
  get state(): PrinterState {
    return this.stateManager.getState();
  }

  /**
   * Process incoming notification from printer
   */
  notify(message: Uint8Array): void {
    const parsed = parseNotification(message);
    if (!parsed) {
      console.warn("Ignoring unexpected notification format");
      return;
    }

    this.stateManager.processNotification(parsed.cmdId, parsed.payload);
  }

  /**
   * Process a complete, checksum-verified notification from a production
   * Bluetooth adapter. `notify` remains permissive for legacy integrations.
   */
  notifyStrict(message: Uint8Array): boolean {
    // Some MXW01 firmware revisions send complete notifications without the
    // optional CRC/terminator trailer. `parseNotification` still validates the
    // header and declared payload length, and `parseFrame` rejects malformed
    // trailers when they are present.
    const compatibleFrame = parseNotification(message);
    if (compatibleFrame) {
      this.stateManager.processNotification(
        compatibleFrame.cmdId,
        compatibleFrame.payload
      );
      return true;
    }

    const frames = this.notificationFrameDecoder.feed(message);
    if (frames.length === 0 && message.length > 0) {
      return false;
    }
    frames.forEach((frame) => {
      this.stateManager.processNotification(frame.cmdId, frame.payload);
    });
    return frames.length > 0;
  }

  /**
   * Set print intensity (darkness)
   */
  async setIntensity(intensity = 0x5d): Promise<void> {
    if (!Number.isInteger(intensity) || !Number.isFinite(intensity) || intensity < 0 || intensity > 255) {
      throw new PrinterError("protocol", `Print intensity must be an integer between 0 and 255, got ${intensity}`);
    }
    const command = makeCommand(Command.SetIntensity, Uint8Array.of(intensity));
    await this.transport.write("control", command);
    await delay(50);
  }

  /**
   * Request current printer status
   */
  async requestStatus(timeoutMs = 5000): Promise<Uint8Array> {
    if (this.statusRequestPromise) {
      return this.statusRequestPromise;
    }

    const operation = this.requestStatusInternal(timeoutMs);
    this.statusRequestPromise = operation;
    try {
      return await operation;
    } finally {
      if (this.statusRequestPromise === operation) {
        this.statusRequestPromise = null;
      }
    }
  }

  private async requestStatusInternal(timeoutMs: number): Promise<Uint8Array> {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 250 || timeoutMs > 30_000) {
      throw new PrinterError("protocol", "Status timeout must be an integer between 250 and 30000 ms.");
    }
    const command = makeCommand(Command.GetStatus, Uint8Array.of(0x00));
    const response = this.stateManager.waitForNotification(Command.GetStatus, timeoutMs);
    try {
      await this.transport.write("control", command);
      return await response;
    } catch (error) {
      this.stateManager.cancelNotification(Command.GetStatus, response);
      throw error;
    }
  }

  /**
   * Send print request with number of lines
   */
  async printRequest(lines: number, mode = 0): Promise<Uint8Array> {
    if (!Number.isInteger(lines) || lines < 0 || lines > 0xffff) {
      throw new PrinterError(
        "protocol",
        `Print line count must be an integer between 0 and 65535, got ${lines}`
      );
    }

    const payload = new Uint8Array(4);
    payload[0] = lines & 0xff;
    payload[1] = (lines >> 8) & 0xff;
    payload[2] = 0x30;
    payload[3] = mode;

    const command = makeCommand(Command.PrintRequest, payload);
    const response = this.stateManager.waitForNotification(Command.PrintRequest, 5000);
    try {
      await this.transport.write("control", command);
      return await response;
    } catch (error) {
      this.stateManager.cancelNotification(Command.PrintRequest, response);
      throw error;
    }
  }

  /**
   * Flush data to printer
   */
  async flushData(): Promise<void> {
    const command = makeCommand(Command.FlushData, Uint8Array.of(0x00));
    await this.transport.write("control", command);
    await delay(50);
  }

  /**
   * Send data chunks to printer
   */
  async sendDataChunks(
    data: Uint8Array,
    chunkSize = Math.min(this.profileDefinition.dataChunkSize, this.transport.maxWriteBytes),
    onProgress?: (sentBytes: number, totalBytes: number) => void
  ): Promise<void> {
    if (!Number.isFinite(chunkSize) || chunkSize <= 0) {
      throw new PrinterError("protocol", `Data chunk size must be a positive finite number, got ${chunkSize}`);
    }
    const effectiveChunkSize = Math.max(1, Math.floor(chunkSize));
    let pos = 0;
    while (pos < data.length) {
      const chunk = data.slice(
        pos,
        Math.min(pos + effectiveChunkSize, data.length)
      );
      await this.transport.write("data", chunk);
      pos += chunk.length;
      onProgress?.(pos, data.length);
      await delay(this.profileDefinition.dataChunkDelayMs);
    }
  }

  /** Arm the completion latch before a print request is sent. */
  prepareForPrint(): number {
    this.stateManager.resetPrintComplete();
    return this.stateManager.getPrintCompleteSequence();
  }

  /** Wait for print completion without clearing an already received response. */
  async waitForPrintComplete(timeoutMs = 20000, afterSequence?: number): Promise<void> {
    const startTime = Date.now();

    while (
      !this.disposed &&
      (afterSequence === undefined
        ? !this.stateManager.isPrintComplete()
        : this.stateManager.getPrintCompleteSequence() <= afterSequence) &&
      Date.now() - startTime < timeoutMs
    ) {
      await delay(100);
    }

    if (this.disposed) {
      throw new PrinterError("cancelled", "Printer controller disposed", {
        recoverable: true,
      });
    }
    const complete = afterSequence === undefined
      ? this.stateManager.isPrintComplete()
      : this.stateManager.getPrintCompleteSequence() > afterSequence;
    if (!complete) {
      throw new PrinterError(
        "timeout",
        "Print timeout: Did not receive completion notification",
        { recoverable: true }
      );
    }
  }
}

/**
 * Encode a row of boolean pixels to binary format
 */
export function encode1bppRow(
  rowBool: readonly boolean[],
  profile: PrinterProfile = MXW01_PRINTER_PROFILE
): Uint8Array {
  if (rowBool.length !== profile.widthDots) {
    throw new Error(
      `Row length must be ${profile.widthDots}, got ${rowBool.length}`
    );
  }

  const rowBytes = new Uint8Array(profile.bytesPerRow);
  for (let x = 0; x < profile.widthDots; x += 1) {
    const black = rowBool[x] === true;
    const bitValue = black === profile.blackIsOne ? 1 : 0;
    const byteIndex = Math.floor(x / 8);
    const bitIndex = profile.bitOrder === "lsb-first" ? x % 8 : 7 - (x % 8);
    rowBytes[byteIndex] |= bitValue << bitIndex;
  }

  return rowBytes;
}

/** Prepare image rows and apply profile-specific wire padding. */
export function prepareImageDataBuffer(
  imageRowsBool: readonly (readonly boolean[])[],
  profile: PrinterProfile = MXW01_PRINTER_PROFILE
): Uint8Array {
  return packMonoRaster(imageRowsBool, profile).data;
}
