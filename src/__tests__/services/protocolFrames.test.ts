import { describe, expect, it } from "vitest";
import {
  FrameDecoder,
  makeCommand,
  parseFrame,
  Command,
} from "../../services/protocol";

describe("services/protocol frame decoder", () => {
  it("decodes a checksum-protected frame split across fragments", () => {
    const frame = makeCommand(Command.GetStatus, new Uint8Array([0x10, 0x20]));
    const decoder = new FrameDecoder();

    expect(decoder.feed(frame.slice(0, 3))).toEqual([]);
    expect(decoder.feed(frame.slice(3, 8))).toEqual([]);
    const result = decoder.feed(frame.slice(8));

    expect(result).toHaveLength(1);
    expect(result[0].cmdId).toBe(Command.GetStatus);
    expect(result[0].payload).toEqual(new Uint8Array([0x10, 0x20]));
    expect(result[0].hasTerminator).toBe(true);
  });

  it("rejects a bad checksum and can resynchronise on the next frame", () => {
    const invalid = makeCommand(Command.GetStatus, new Uint8Array([0x01]));
    invalid[invalid.length - 2] ^= 0xff;
    const valid = makeCommand(Command.PrintComplete, new Uint8Array());
    const decoder = new FrameDecoder();

    expect(decoder.feed(new Uint8Array([...invalid, ...valid]))).toEqual([
      expect.objectContaining({ cmdId: Command.PrintComplete }),
    ]);
  });

  it("can strictly parse a complete frame", () => {
    const frame = makeCommand(Command.SetIntensity, new Uint8Array([0x5d]));
    expect(
      parseFrame(frame, { requireChecksum: true, requireTerminator: true })
    ).toEqual(
      expect.objectContaining({
        cmdId: Command.SetIntensity,
        payload: new Uint8Array([0x5d]),
      })
    );
  });
});
