import type {
  ByteTransport,
  TransportEndpoint,
} from "../core/print-types";

export type ByteWriteFunction = (data: BufferSource) => Promise<void>;

/**
 * Adapts the original pair of characteristic write functions to the new
 * byte-oriented transport boundary. It is intentionally small and can be
 * replaced by Web Bluetooth, Noble or CoreBluetooth implementations.
 */
export class CallbackByteTransport implements ByteTransport {
  readonly maxWriteBytes: number;
  private readonly disconnectListeners = new Set<(error?: Error) => void>();
  private readonly byteListeners = new Set<(data: Uint8Array) => void>();

  constructor(
    private readonly controlWrite: ByteWriteFunction,
    private readonly dataWrite: ByteWriteFunction,
    maxWriteBytes = 48
  ) {
    this.maxWriteBytes = maxWriteBytes;
  }

  async open(): Promise<void> {
    // The legacy adapter owns the actual connection lifecycle.
  }

  async close(): Promise<void> {
    // The legacy adapter owns the actual connection lifecycle.
  }

  async write(endpoint: TransportEndpoint, data: Uint8Array): Promise<void> {
    const write = endpoint === "control" ? this.controlWrite : this.dataWrite;
    await write(data as unknown as BufferSource);
  }

  onBytes(listener: (data: Uint8Array) => void): () => void {
    this.byteListeners.add(listener);
    return () => this.byteListeners.delete(listener);
  }

  onDisconnect(listener: (error?: Error) => void): () => void {
    this.disconnectListeners.add(listener);
    return () => this.disconnectListeners.delete(listener);
  }

  /** Useful for adapter bridges and deterministic transport tests. */
  emitBytes(data: Uint8Array): void {
    this.byteListeners.forEach((listener) => listener(data));
  }

  /** Useful for adapter bridges and deterministic transport tests. */
  emitDisconnect(error?: Error): void {
    this.disconnectListeners.forEach((listener) => listener(error));
  }
}
