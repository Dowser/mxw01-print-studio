/**
 * Value types shared by renderers, protocol drivers and platform adapters.
 *
 * These types deliberately contain no DOM, Bluetooth or Node.js objects. They
 * are the boundary that a future Swift package can mirror with Foundation
 * value types and Codable models.
 */

export type PixelFormat = "rgba8888";
export type AlphaMode = "straight" | "premultiplied";
export type BitOrder = "lsb-first" | "msb-first";

/** A tightly packed row-major RGBA image. */
export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  readonly strideBytes: number;
  readonly pixelFormat: PixelFormat;
  readonly alpha: AlphaMode;
  readonly data: Uint8Array;
}

/**
 * A monochrome raster ready for a printer transport.
 *
 * `heightDots` and `contentHeightRows` describe the rendered content. The
 * wire buffer may contain additional rows, exposed explicitly through
 * `wireHeightRows`, because MXW01 devices currently require a minimum payload
 * size. This prevents protocol padding from being mistaken for document
 * content by another implementation.
 */
export interface RasterPage {
  readonly widthDots: number;
  readonly heightDots: number;
  readonly contentHeightRows: number;
  readonly wireHeightRows: number;
  readonly bytesPerRow: number;
  readonly bitOrder: BitOrder;
  readonly blackIsOne: boolean;
  readonly data: Uint8Array;
}

export interface PrinterCapabilities {
  readonly status: boolean;
  readonly intensity: boolean;
  readonly raster: boolean;
  readonly cancellation: boolean;
  readonly maxPagesPerJob: number;
}

/**
 * Hardware-specific facts used by the renderer and driver.
 *
 * Keep this separate from a Bluetooth adapter: the same profile can be used
 * by Web Bluetooth, Noble and CoreBluetooth transports.
 */
export interface PrinterProfile {
  readonly id: string;
  readonly protocolRevision: string;
  readonly widthDots: number;
  readonly bytesPerRow: number;
  readonly minimumRows: number;
  readonly bitOrder: BitOrder;
  readonly blackIsOne: boolean;
  readonly dataChunkSize: number;
  readonly dataChunkDelayMs: number;
  readonly dpi?: number;
  readonly mediaWidthMm?: number;
  readonly capabilities: PrinterCapabilities;
}

export type TransportEndpoint = "control" | "data";

/** A small byte-oriented transport contract suitable for BLE or a fake. */
export interface ByteTransport {
  readonly maxWriteBytes: number;
  open(): Promise<void>;
  close(): Promise<void>;
  write(endpoint: TransportEndpoint, data: Uint8Array): Promise<void>;
  onBytes(listener: (data: Uint8Array) => void): () => void;
  onDisconnect(listener: (error?: Error) => void): () => void;
}

export type PrintJobPhase =
  | "queued"
  | "preparing"
  | "configuring"
  | "sending"
  | "printing"
  | "completed"
  | "failed"
  | "cancelled";

export interface PrintJobProgress {
  readonly phase: PrintJobPhase;
  readonly progress: number;
  readonly sentBytes: number;
  readonly totalBytes: number;
}
