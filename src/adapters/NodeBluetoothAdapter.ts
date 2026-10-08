// Node.js Bluetooth adapter using Noble
// Requires: @stoprocent/noble

import { BLUETOOTH_UUIDS } from "../utils/bluetooth";
import { BaseCharacteristicWrapper } from "./BaseCharacteristicWrapper";
import type {
  BluetoothAdapter,
  BluetoothDevice as PrinterBluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
  BluetoothNotificationEvent,
} from "../core/types";

/**
 * Wrapper for Noble characteristic to match our interface
 */
class NobleCharacteristicWrapper extends BaseCharacteristicWrapper {
  private characteristic: any;

  constructor(characteristic: any) {
    super();
    this.characteristic = characteristic;
  }

  async writeValueWithoutResponse(data: Uint8Array): Promise<void> {
    const buffer = Buffer.from(data);
    await this.characteristic.writeAsync(buffer, true);
  }

  async startNotifications(): Promise<void> {
    await this.characteristic.subscribeAsync();
  }

  async stopNotifications(): Promise<void> {
    await this.characteristic.unsubscribeAsync();
  }

  addEventListener(event: string, callback: (event: BluetoothNotificationEvent) => void): void {
    if (event === "characteristicvaluechanged") {
      const dataListener = (data: Buffer) => {
        callback({ value: new Uint8Array(data.buffer, data.byteOffset, data.byteLength) });
      };

      this.dataListeners.set(callback, dataListener);
      this.characteristic.on("data", dataListener);
    }
  }

  removeEventListener(event: string, callback: (event: BluetoothNotificationEvent) => void): void {
    if (event === "characteristicvaluechanged") {
      const dataListener = this.dataListeners.get(callback);
      if (dataListener) {
        this.characteristic.removeListener("data", dataListener);
        this.dataListeners.delete(callback);
      }
    }
  }
}

/**
 * Node.js Bluetooth adapter using Noble
 * Provides native Bluetooth access for Node.js and Bun environments
 *
 * @example
 * ```typescript
 * import { ThermalPrinterClient } from 'react-mxw01-printer';
 * import { NodeBluetoothAdapter } from 'react-mxw01-printer/adapters/node';
 *
 * const adapter = new NodeBluetoothAdapter();
 * const printer = new ThermalPrinterClient(adapter);
 * ```
 *
 * @requires @stoprocent/noble
 */
export class NodeBluetoothAdapter implements BluetoothAdapter {
  private noble: any = null;
  private readonly nobleModule: Promise<any | null>;
  private readonly peripherals = new Map<string, any>();
  private activePeripheral: any = null;
  private scanPromise: Promise<PrinterBluetoothDevice> | null = null;
  private characteristics: {
    control?: any;
    notify?: any;
    data?: any;
  } = {};

  constructor() {
    // `require()` is not available in an ESM package. Keep the optional
    // dependency out of the static bundle and resolve it only when the Node
    // adapter is used.
    this.nobleModule = this.loadNobleModule();
  }

  private async loadNobleModule(): Promise<any | null> {
    try {
      const dynamicImport = new Function(
        "specifier",
        "return import(specifier);"
      ) as (specifier: string) => Promise<any>;
      const loaded = await dynamicImport("@stoprocent/noble");
      return loaded.default ?? loaded;
    } catch (_error) {
      return null;
    }
  }

  private async ensureNoble(): Promise<void> {
    if (this.noble) {
      return;
    }

    this.noble = await this.nobleModule;
    if (!this.noble) {
      throw new Error(
        "Noble is not installed. Please run: npm install @stoprocent/noble"
      );
    }
  }

  /**
   * Check if Bluetooth is available (Noble is loaded)
   * The powered on state is checked during requestDevice()
   */
  isAvailable(): boolean {
    // Loading is asynchronous in ESM; requestDevice() performs the definitive
    // availability check before scanning.
    return true;
  }

  /**
   * Scan for and request a Bluetooth printer device
   * Automatically finds devices with MXW01 printer service UUID
   */
  async requestDevice(): Promise<PrinterBluetoothDevice> {
    await this.ensureNoble();

    if (this.scanPromise) {
      return this.scanPromise;
    }

    const operation = new Promise<PrinterBluetoothDevice>((resolve, reject) => {
      let settled = false;
      let stateListener: ((state: string) => void) | null = null;
      const timeout = setTimeout(() => {
        fail(new Error("Device scan timeout (30s)"));
      }, 30000);

      const cleanup = (stopScanning: boolean): void => {
        clearTimeout(timeout);
        this.noble.removeListener("discover", onDiscover);
        if (stateListener) {
          this.noble.removeListener("stateChange", stateListener);
          stateListener = null;
        }
        if (stopScanning) {
          try {
            this.noble.stopScanning();
          } catch (_error) {
            // Noble may already have stopped scanning after a disconnect.
          }
        }
      };

      const fail = (error: Error): void => {
        if (settled) return;
        settled = true;
        cleanup(true);
        reject(error);
      };

      const onDiscover = (peripheral: any): void => {
        if (settled) return;
        const id = peripheral.id || peripheral.uuid;
        if (!id) return;
        settled = true;
        this.peripherals.set(id, peripheral);
        cleanup(true);
        resolve({
          id,
          name: peripheral.advertisement?.localName || "MXW01 Printer",
        });
      };

      this.noble.on("discover", onDiscover);

      const startScanning = (): void => {
        console.log("Scanning for MXW01 printer...");
        try {
          this.noble.startScanning(
            [BLUETOOTH_UUIDS.PRINTER_SERVICE, BLUETOOTH_UUIDS.PRINTER_SERVICE_ALT],
            false
          );
        } catch (error) {
          fail(error instanceof Error ? error : new Error(String(error)));
        }
      };

      if (this.noble.state === "poweredOn") {
        startScanning();
      } else {
        stateListener = (state: string): void => {
          if (state === "poweredOn") {
            if (stateListener) {
              this.noble.removeListener("stateChange", stateListener);
              stateListener = null;
            }
            startScanning();
          }
        };
        this.noble.on("stateChange", stateListener);
      }
    });

    this.scanPromise = operation;
    try {
      return await operation;
    } finally {
      if (this.scanPromise === operation) {
        this.scanPromise = null;
      }
    }
  }

  /**
   * Connect to a Bluetooth device and get printer service characteristics
   */
  async connect(
    device: PrinterBluetoothDevice
  ): Promise<BluetoothConnection & BluetoothServiceInfo> {
    await this.ensureNoble();

    const peripheral = this.peripherals.get(device.id);
    if (!peripheral) {
      throw new Error("No matching peripheral found. Call requestDevice() first.");
    }

    try {
      // Connect to peripheral
      await peripheral.connectAsync();
      console.log("Connected to peripheral");

      // Discover all services and characteristics (Noble works better without filters)
      const { characteristics } =
        await peripheral.discoverAllServicesAndCharacteristicsAsync();

      console.log(`Found ${characteristics.length} characteristics`);

      // Find the required characteristics by short UUID (Noble uses short format)
      this.characteristics.control = characteristics.find(
        (c: any) => c.uuid === BLUETOOTH_UUIDS.CONTROL_SHORT
      );
      this.characteristics.notify = characteristics.find(
        (c: any) => c.uuid === BLUETOOTH_UUIDS.NOTIFY_SHORT
      );
      this.characteristics.data = characteristics.find(
        (c: any) => c.uuid === BLUETOOTH_UUIDS.DATA_SHORT
      );

      console.log("Control:", this.characteristics.control ? "✅" : "❌");
      console.log("Notify:", this.characteristics.notify ? "✅" : "❌");
      console.log("Data:", this.characteristics.data ? "✅" : "❌");

      // Verify all required characteristics are found
      if (
        !this.characteristics.control ||
        !this.characteristics.notify ||
        !this.characteristics.data
      ) {
        throw new Error(
          `Missing required characteristics. Found: ${Object.keys(
            this.characteristics
          ).join(", ")}`
        );
      }

      this.activePeripheral = peripheral;

      return {
        device,
        disconnect: async () => {
          if (peripheral && peripheral.state === "connected") {
            await peripheral.disconnectAsync();
            console.log("Disconnected from peripheral");
          }
          if (this.activePeripheral === peripheral) {
            this.activePeripheral = null;
          }
          this.peripherals.delete(device.id);
          this.characteristics = {};
        },
        onDisconnect: (listener) => {
          const onDisconnect = (error?: Error) => {
            if (this.activePeripheral === peripheral) {
              this.activePeripheral = null;
            }
            this.peripherals.delete(device.id);
            listener(error);
          };
          peripheral.on("disconnect", onDisconnect);
          return () => peripheral.removeListener("disconnect", onDisconnect);
        },
        controlCharacteristic: new NobleCharacteristicWrapper(
          this.characteristics.control
        ),
        dataCharacteristic: new NobleCharacteristicWrapper(
          this.characteristics.data
        ),
        notifyCharacteristic: new NobleCharacteristicWrapper(
          this.characteristics.notify
        ),
      };
    } catch (error) {
      // Ensure we disconnect on error
      if (peripheral && peripheral.state === "connected") {
        try {
          await peripheral.disconnectAsync();
        } catch (disconnectError) {
          console.error("Error disconnecting:", disconnectError);
        }
      }
      this.peripherals.delete(device.id);
      throw new Error(
        `Failed to connect to device: ${(error as Error).message}`
      );
    }
  }
}
