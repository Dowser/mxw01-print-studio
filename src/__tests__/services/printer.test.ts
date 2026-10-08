import { describe, expect, it } from "vitest";
import { MXW01Printer } from "../../services/printer";
import { Command, makeCommand } from "../../services/protocol";

describe("services/printer", () => {
  it("accepts fragmented strict notifications and resolves the matching status wait", async () => {
    const printer = new MXW01Printer(
      async () => undefined,
      async () => undefined
    );
    const payload = Uint8Array.of(0, 0, 0, 0, 0, 0, 0);
    const frame = makeCommand(Command.GetStatus, payload);
    const responsePromise = printer.requestStatus();

    expect(printer.notifyStrict(frame.slice(0, 4))).toBe(false);
    expect(printer.notifyStrict(frame.slice(4))).toBe(true);
    await expect(responsePromise).resolves.toEqual(payload);

    printer.dispose();
  });

  it("accepts legacy complete notifications without a CRC trailer", async () => {
    const printer = new MXW01Printer(
      async () => undefined,
      async () => undefined
    );
    const payload = Uint8Array.of(0, 0, 0, 0, 0, 0, 0);
    const legacyFrame = Uint8Array.of(
      0x22,
      0x21,
      Command.GetStatus,
      0x00,
      payload.length,
      0x00,
      ...payload
    );
    const responsePromise = printer.requestStatus();

    expect(printer.notifyStrict(legacyFrame)).toBe(true);
    await expect(responsePromise).resolves.toEqual(payload);

    printer.dispose();
  });

  it("rejects invalid data chunk sizes before entering the send loop", async () => {
    const printer = new MXW01Printer(async () => undefined, async () => undefined);

    await expect(printer.sendDataChunks(Uint8Array.of(1, 2), Number.NaN)).rejects.toMatchObject({ code: "protocol" });
    await expect(printer.sendDataChunks(Uint8Array.of(1, 2), 0)).rejects.toMatchObject({ code: "protocol" });

    printer.dispose();
  });

  it("rejects invalid intensity values before writing a command", async () => {
    const printer = new MXW01Printer(async () => undefined, async () => undefined);

    await expect(printer.setIntensity(Number.NaN)).rejects.toMatchObject({ code: "protocol" });
    await expect(printer.setIntensity(-1)).rejects.toMatchObject({ code: "protocol" });
    await expect(printer.setIntensity(256)).rejects.toMatchObject({ code: "protocol" });

    printer.dispose();
  });
});
