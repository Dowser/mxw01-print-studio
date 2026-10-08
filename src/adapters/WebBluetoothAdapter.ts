// Web Bluetooth API adapter for browser environments

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
 * Wrapper for Web Bluetooth API characteristic to match our interface
 */
class WebBluetoothCharacteristicWrapper extends BaseCharacteristicWrapper {
  private readonly nativeListeners = new Map<(event: BluetoothNotificationEvent) => void, EventListener>();

  constructor(private characteristic: BluetoothRemoteGATTCharacteristic) {
    super();
  }

  async writeValueWithoutResponse(data: Uint8Array): Promise<void> {
    await this.characteristic.writeValueWithoutResponse(data as unknown as BufferSource);
  }

  async startNotifications(): Promise<void> {
    await this.characteristic.startNotifications();
  }

  async stopNotifications(): Promise<void> {
    await this.characteristic.stopNotifications();
  }

  addEventListener(event: string, callback: (event: BluetoothNotificationEvent) => void): void {
    const nativeListener: EventListener = (nativeEvent) => {
      const value = (nativeEvent.target as BluetoothRemoteGATTCharacteristic | null)?.value;
      if (value) callback({ value: new Uint8Array(value.buffer, value.byteOffset, value.byteLength) });
    };
    this.nativeListeners.set(callback, nativeListener);
    this.characteristic.addEventListener(event, nativeListener);
  }

  removeEventListener(event: string, callback: (event: BluetoothNotificationEvent) => void): void {
    const nativeListener = this.nativeListeners.get(callback);
    if (nativeListener) {
      this.characteristic.removeEventListener(event, nativeListener);
      this.nativeListeners.delete(callback);
    }
  }
}

/**
 * Web Bluetooth adapter for browser environments
 * Uses the Web Bluetooth API to connect to Bluetooth devices
 */
export class WebBluetoothAdapter implements BluetoothAdapter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  /**
   * Check if Web Bluetooth is available
   */
  isAvailable(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.bluetooth !== "undefined"
    );
  }

  /**
   * Request a Bluetooth device with printer services
   */
  async requestDevice(): Promise<PrinterBluetoothDevice> {
    if (!this.isAvailable()) {
      throw new Error("Web Bluetooth API is not available in this browser");
    }

    try {
      // Request Bluetooth device with support for both standard and macOS UUIDs
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLUETOOTH_UUIDS.PRINTER_SERVICE] },
          { services: [BLUETOOTH_UUIDS.PRINTER_SERVICE_ALT] },
        ],
        optionalServices: [
          BLUETOOTH_UUIDS.PRINTER_SERVICE,
          BLUETOOTH_UUIDS.PRINTER_SERVICE_ALT,
        ],
      });

      return {
        id: this.device.id,
        name: this.device.name,
      };
    } catch (error) {
      this.device = null;
      throw new Error(
        `Failed to request Bluetooth device: ${(error as Error).message}`
      );
    }
  }

  /**
   * Connect to a Bluetooth device and get service characteristics
   */
  async connect(
    device: PrinterBluetoothDevice
  ): Promise<BluetoothConnection & BluetoothServiceInfo> {
    if (!this.device || this.device.id !== device.id) {
      throw new Error("Device not found. Please request device first.");
    }

    try {
      // Connect to GATT server
      const gatt = this.device.gatt;
      if (!gatt) {
        throw new Error("GATT not available on device");
      }
      this.server = await gatt.connect();
      if (!this.server) {
        throw new Error("Failed to connect to GATT server");
      }

      // Access printer service - try standard UUID first, then macOS alternate
      let service: BluetoothRemoteGATTService;
      try {
        service = await this.server.getPrimaryService(
          BLUETOOTH_UUIDS.PRINTER_SERVICE
        );
      } catch (error) {
        console.log("Trying alternate UUID for macOS compatibility...");
        service = await this.server.getPrimaryService(
          BLUETOOTH_UUIDS.PRINTER_SERVICE_ALT
        );
      }

      // Get characteristics
      const [controlChar, notifyChar, dataChar] = await Promise.all([
        service.getCharacteristic(BLUETOOTH_UUIDS.CONTROL),
        service.getCharacteristic(BLUETOOTH_UUIDS.NOTIFY),
        service.getCharacteristic(BLUETOOTH_UUIDS.DATA),
      ]);

      const nativeDevice = this.device;
      const disconnectListeners = new Set<(error?: Error) => void>();
      const nativeDisconnectHandler = () => {
        disconnectListeners.forEach((listener) => listener(new Error("Bluetooth device disconnected")));
      };
      nativeDevice.addEventListener("gattserverdisconnected", nativeDisconnectHandler);

      return {
        device,
        disconnect: async () => {
          nativeDevice.removeEventListener("gattserverdisconnected", nativeDisconnectHandler);
          disconnectListeners.clear();
          if (this.server?.connected) {
            this.server.disconnect();
          }
          this.device = null;
          this.server = null;
        },
        onDisconnect: (listener) => {
          disconnectListeners.add(listener);
          return () => disconnectListeners.delete(listener);
        },
        controlCharacteristic: new WebBluetoothCharacteristicWrapper(
          controlChar
        ),
        dataCharacteristic: new WebBluetoothCharacteristicWrapper(dataChar),
        notifyCharacteristic: new WebBluetoothCharacteristicWrapper(notifyChar),
      };
    } catch (error) {
      if (this.server?.connected) {
        this.server.disconnect();
      }
      this.server = null;
      this.device = null;
      throw new Error(
        `Failed to connect to device: ${(error as Error).message}`
      );
    }
  }
}
