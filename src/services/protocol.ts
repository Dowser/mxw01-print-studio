// MXW01 Printer Protocol - Command building and parsing

import { crc8 } from "../utils/helpers";

/**
 * MXW01 Printer command identifiers
 */
export const Command = {
  GetStatus: 0xa1,
  SetIntensity: 0xa2,
  PrintRequest: 0xa9,
  FlushData: 0xad,
  PrintComplete: 0xaa,
} as const;

/**
 * Protocol constants
 */
export const PROTOCOL = {
  HEADER_BYTE_1: 0x22,
  HEADER_BYTE_2: 0x21,
  TERMINATOR: 0xff,
} as const;

/**
 * Build a command packet for the MXW01 printer
 * @param command Command identifier
 * @param payload Command payload data
 * @returns Complete command packet with header, payload, CRC, and terminator
 */
export function makeCommand(command: number, payload: Uint8Array): Uint8Array {
  const len = payload.length;
  const header = new Uint8Array([
    PROTOCOL.HEADER_BYTE_1,
    PROTOCOL.HEADER_BYTE_2,
    command,
    0x00,
    len & 0xff,
    (len >> 8) & 0xff,
  ]);

  // Concatenate header and payload
  const cmdWithPayload = new Uint8Array(header.length + payload.length);
  cmdWithPayload.set(header);
  cmdWithPayload.set(payload, header.length);

  // Calculate CRC on payload only
  const crcValue = crc8(payload);

  // Final command: header + payload + CRC + terminator
  const result = new Uint8Array(cmdWithPayload.length + 2);
  result.set(cmdWithPayload);
  result[result.length - 2] = crcValue;
  result[result.length - 1] = PROTOCOL.TERMINATOR;

  return result;
}

export interface ParsedFrame {
  readonly cmdId: number;
  readonly payload: Uint8Array;
  readonly crc?: number;
  readonly hasTerminator: boolean;
}

export interface ParseFrameOptions {
  /** Require the CRC byte and validate it against the payload. */
  readonly requireChecksum?: boolean;
  /** Require the final 0xff terminator byte. */
  readonly requireTerminator?: boolean;
}

/**
 * Parse a complete protocol frame.
 *
 * Some firmware notifications observed in the wild omit the CRC/terminator,
 * so the default is deliberately compatible with those legacy notifications.
 * New transports should use `FrameDecoder`, which enables both checks.
 */
export function parseFrame(
  message: Uint8Array,
  options: ParseFrameOptions = {}
): ParsedFrame | null {
  if (
    message.length < 6 ||
    message[0] !== PROTOCOL.HEADER_BYTE_1 ||
    message[1] !== PROTOCOL.HEADER_BYTE_2
  ) {
    return null;
  }

  const payloadLength = message[4] | (message[5] << 8);
  const payloadEnd = 6 + payloadLength;
  if (message.length < payloadEnd) {
    return null;
  }

  const hasTrailer = message.length >= payloadEnd + 2;
  const hasTerminator = hasTrailer && message[payloadEnd + 1] === PROTOCOL.TERMINATOR;
  const hasChecksum = hasTrailer;

  if (options.requireTerminator && !hasTerminator) {
    return null;
  }

  if (options.requireChecksum) {
    if (!hasChecksum || message[payloadEnd] !== crc8(message.slice(6, payloadEnd))) {
      return null;
    }
  } else if (hasTrailer && (!hasTerminator || message[payloadEnd] !== crc8(message.slice(6, payloadEnd)))) {
    // If a caller supplied two trailer bytes, do not silently accept a bad
    // checksum. Exact legacy frames with no trailer remain supported.
    return null;
  }

  return {
    cmdId: message[2],
    payload: message.slice(6, payloadEnd),
    crc: hasChecksum ? message[payloadEnd] : undefined,
    hasTerminator,
  };
}

/**
 * Incremental decoder for notifications fragmented across BLE packets.
 * It only emits fully framed, checksum-verified protocol packets.
 */
export class FrameDecoder {
  private buffer = new Uint8Array(0);

  constructor(private readonly options: ParseFrameOptions = {
    requireChecksum: true,
    requireTerminator: true,
  }) {}

  feed(chunk: Uint8Array): ParsedFrame[] {
    if (chunk.length === 0) {
      return [];
    }

    const combined = new Uint8Array(this.buffer.length + chunk.length);
    combined.set(this.buffer);
    combined.set(chunk, this.buffer.length);
    this.buffer = combined;

    const frames: ParsedFrame[] = [];
    while (this.buffer.length > 0) {
      const headerIndex = this.findHeader();
      if (headerIndex < 0) {
        // Retain a possible first header byte for the next fragment.
        this.buffer = this.buffer[this.buffer.length - 1] === PROTOCOL.HEADER_BYTE_1
          ? this.buffer.slice(-1)
          : new Uint8Array(0);
        break;
      }

      if (headerIndex > 0) {
        this.buffer = this.buffer.slice(headerIndex);
      }

      if (this.buffer.length < 6) {
        break;
      }

      const payloadLength = this.buffer[4] | (this.buffer[5] << 8);
      const frameLength = 6 + payloadLength + 2;
      if (this.buffer.length < frameLength) {
        break;
      }

      const candidate = this.buffer.slice(0, frameLength);
      const parsed = parseFrame(candidate, this.options);
      if (!parsed) {
        // Drop one byte and resynchronise on the next header.
        this.buffer = this.buffer.slice(1);
        continue;
      }

      frames.push(parsed);
      this.buffer = this.buffer.slice(frameLength);
    }

    return frames;
  }

  reset(): void {
    this.buffer = new Uint8Array(0);
  }

  private findHeader(): number {
    for (let index = 0; index < this.buffer.length - 1; index += 1) {
      if (
        this.buffer[index] === PROTOCOL.HEADER_BYTE_1 &&
        this.buffer[index + 1] === PROTOCOL.HEADER_BYTE_2
      ) {
        return index;
      }
    }
    return -1;
  }
}

/**
 * Parse notification message from printer
 * @param message Raw notification data
 * @returns Parsed command ID and payload, or null if invalid
 */
export function parseNotification(
  message: Uint8Array
): { cmdId: number; payload: Uint8Array } | null {
  const parsed = parseFrame(message);
  if (!parsed) {
    return null;
  }

  return { cmdId: parsed.cmdId, payload: parsed.payload };
}
