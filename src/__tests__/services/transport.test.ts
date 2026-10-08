import { describe, expect, it } from "vitest";
import { CallbackByteTransport } from "../../services/transport";

describe("services/transport", () => {
  it("routes control and data writes through the byte boundary", async () => {
    const control: Uint8Array[] = [];
    const data: Uint8Array[] = [];
    const transport = new CallbackByteTransport(
      async (bytes) => {
        control.push(new Uint8Array(bytes as ArrayBuffer));
      },
      async (bytes) => {
        data.push(new Uint8Array(bytes as ArrayBuffer));
      },
      8
    );

    await transport.write("control", Uint8Array.of(0xa1));
    await transport.write("data", Uint8Array.of(0x01, 0x02));

    expect(transport.maxWriteBytes).toBe(8);
    expect(control).toEqual([Uint8Array.of(0xa1)]);
    expect(data).toEqual([Uint8Array.of(0x01, 0x02)]);
  });

  it("supports byte and disconnect subscriptions", () => {
    const transport = new CallbackByteTransport(
      async () => undefined,
      async () => undefined
    );
    const received: Uint8Array[] = [];
    const errors: (Error | undefined)[] = [];
    transport.onBytes((bytes) => received.push(bytes));
    transport.onDisconnect((error) => errors.push(error));

    transport.emitBytes(Uint8Array.of(0x22));
    const error = new Error("gone");
    transport.emitDisconnect(error);

    expect(received).toEqual([Uint8Array.of(0x22)]);
    expect(errors).toEqual([error]);
  });
});
