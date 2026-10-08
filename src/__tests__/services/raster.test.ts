import { describe, expect, it } from "vitest";
import { packMonoRaster, unpackMonoRaster } from "../../services/raster";
import type { PrinterProfile } from "../../core/print-types";

const testProfile: PrinterProfile = {
  id: "test",
  protocolRevision: "test-v1",
  widthDots: 16,
  bytesPerRow: 2,
  minimumRows: 2,
  bitOrder: "lsb-first",
  blackIsOne: true,
  dataChunkSize: 2,
  dataChunkDelayMs: 0,
  capabilities: {
    status: false,
    intensity: false,
    raster: true,
    cancellation: false,
    maxPagesPerJob: 1,
  },
};

describe("services/raster", () => {
  it("packs boundary pixels and keeps content height separate from wire padding", () => {
    const row = Array.from({ length: 16 }, (_, index) =>
      index === 0 || index === 7 || index === 8
    );
    const raster = packMonoRaster([row], testProfile);

    expect(raster.contentHeightRows).toBe(1);
    expect(raster.wireHeightRows).toBe(2);
    expect(raster.data).toEqual(new Uint8Array([0x81, 0x01, 0x00, 0x00]));
    expect(unpackMonoRaster(raster)).toEqual([row]);
    expect(unpackMonoRaster(raster, true)[1]).toEqual(new Array(16).fill(false));
  });

  it("supports MSB-first profiles", () => {
    const raster = packMonoRaster(
      [[true, false, false, false, false, false, false, false]],
      { ...testProfile, widthDots: 8, bytesPerRow: 1, bitOrder: "msb-first" }
    );

    expect(raster.data[0]).toBe(0x80);
  });

  it("rejects rows with a width different from the printer profile", () => {
    expect(() => packMonoRaster([[true]], testProfile)).toThrow(/exactly 16 pixels/);
  });
});
