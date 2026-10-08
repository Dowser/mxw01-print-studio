import type { PrinterProfile } from "./print-types";

/**
 * Profile for the MXW01 firmware exercised by this package.
 *
 * The 90-row minimum is a wire-format constraint observed by the existing
 * implementation. It is intentionally a profile value rather than a global
 * renderer assumption so other printer protocols can make their own choice.
 */
export const MXW01_PRINTER_PROFILE: PrinterProfile = {
  id: "mxw01",
  protocolRevision: "mxw01-ble-v1",
  widthDots: 384,
  bytesPerRow: 48,
  minimumRows: 90,
  bitOrder: "lsb-first",
  blackIsOne: true,
  dataChunkSize: 48,
  dataChunkDelayMs: 15,
  mediaWidthMm: 58,
  capabilities: {
    status: true,
    intensity: true,
    raster: true,
    cancellation: false,
    maxPagesPerJob: 1,
  },
};
