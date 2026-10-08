// Core types for thermal printer client

import type { PrintJobPhase } from "./print-types";

export interface PrinterState {
  printing: boolean;
  paper_jam: boolean;
  out_of_paper: boolean;
  cover_open: boolean;
  battery_low: boolean;
  overheat: boolean;
}

export interface BluetoothDevice {
  id: string;
  name?: string;
}

export interface BluetoothConnection {
  device: BluetoothDevice;
  disconnect(): Promise<void>;
  /** Optional adapter-level notification for an unexpected physical disconnect. */
  onDisconnect?(listener: (error?: Error) => void): () => void;
}

export interface BluetoothCharacteristic {
  writeValueWithoutResponse(data: Uint8Array): Promise<void>;
  startNotifications(): Promise<void>;
  stopNotifications(): Promise<void>;
  addEventListener(event: string, callback: (event: BluetoothNotificationEvent) => void): void;
  removeEventListener(event: string, callback: (event: BluetoothNotificationEvent) => void): void;
}

/** Platform-neutral notification payload passed from a Bluetooth adapter. */
export interface BluetoothNotificationEvent {
  readonly value: Uint8Array;
}

export interface BluetoothServiceInfo {
  controlCharacteristic: BluetoothCharacteristic;
  dataCharacteristic: BluetoothCharacteristic;
  notifyCharacteristic: BluetoothCharacteristic;
}

/**
 * Abstract interface for Bluetooth adapters
 * Implementations can use Web Bluetooth API, Noble, or other BLE libraries
 */
export interface BluetoothAdapter {
  /**
   * Request a Bluetooth device with printer services
   */
  requestDevice(): Promise<BluetoothDevice>;

  /**
   * Connect to a Bluetooth device and get service characteristics
   */
  connect(
    device: BluetoothDevice
  ): Promise<BluetoothConnection & BluetoothServiceInfo>;

  /**
   * Check if Bluetooth is available in the current environment
   */
  isAvailable(): boolean;
}

/**
 * Event types emitted by ThermalPrinterClient
 */
export type PrinterEvent =
  | { type: "connected"; device: BluetoothDevice }
  | { type: "disconnected" }
  | { type: "stateChange"; state: PrinterState }
  | {
      type: "printProgress";
      progress: number;
      phase?: PrintJobPhase;
      sentBytes?: number;
      totalBytes?: number;
    }
  | { type: "error"; error: Error };

export type PrinterEventType = PrinterEvent["type"];

export type PrinterEventListener<
  T extends PrinterEventType = PrinterEventType
> = (event: Extract<PrinterEvent, { type: T }>) => void;

/**
 * Options for image processing
 */
export type DitherMethod =
  | "threshold"
  | "steinberg"
  | "bayer"
  | "atkinson"
  | "pattern";

export interface ImageProcessorOptions {
  dither: DitherMethod;
  rotate: 0 | 90 | 180 | 270;
  flip: "none" | "h" | "v" | "both";
  brightness: number;
}

/**
 * Image data interface - compatible with both Canvas and Node.js
 * Renamed to avoid conflict with DOM ImageData
 */
export interface PrinterImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  /** Optional source stride; omitted means tightly packed RGBA rows. */
  strideBytes?: number;
}

/**
 * Print options
 */
export interface PrintOptions extends Partial<ImageProcessorOptions> {
  intensity?: number;
}

export type {
  AlphaMode,
  BitOrder,
  ByteTransport,
  PrintJobPhase,
  PrintJobProgress,
  PrinterCapabilities,
  PrinterProfile,
  PixelFormat,
  RasterPage,
  RgbaImage,
  TransportEndpoint,
} from "./print-types";
