import type { PrinterProfile, RasterPage } from "../core/print-types";
import { MXW01_PRINTER_PROFILE } from "../core/printerProfiles";

/** Pack boolean rows into the profile's explicit 1-bit wire representation. */
export function packMonoRaster(
  rows: readonly (readonly boolean[])[],
  profile: PrinterProfile = MXW01_PRINTER_PROFILE
): RasterPage {
  const minimumBytesPerRow = Math.ceil(profile.widthDots / 8);
  if (
    profile.widthDots <= 0 ||
    !Number.isInteger(profile.widthDots) ||
    profile.bytesPerRow < minimumBytesPerRow ||
    profile.minimumRows < 0 ||
    !Number.isInteger(profile.bytesPerRow) ||
    !Number.isInteger(profile.minimumRows)
  ) {
    throw new Error("Printer profile has invalid raster dimensions");
  }

  const contentHeightRows = rows.length;
  const wireHeightRows = Math.max(contentHeightRows, profile.minimumRows);
  const data = new Uint8Array(wireHeightRows * profile.bytesPerRow);

  for (let rowIndex = 0; rowIndex < contentHeightRows; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!row || row.length !== profile.widthDots) {
      throw new Error(`Raster row ${rowIndex} must contain exactly ${profile.widthDots} pixels`);
    }
    const rowOffset = rowIndex * profile.bytesPerRow;

    for (let x = 0; x < profile.widthDots; x += 1) {
      const black = row[x] === true;
      const bitValue = black === profile.blackIsOne ? 1 : 0;
      const byteIndex = Math.floor(x / 8);
      const bitIndex = profile.bitOrder === "lsb-first" ? x % 8 : 7 - (x % 8);
      data[rowOffset + byteIndex] |= bitValue << bitIndex;
    }
  }

  return {
    widthDots: profile.widthDots,
    heightDots: contentHeightRows,
    contentHeightRows,
    wireHeightRows,
    bytesPerRow: profile.bytesPerRow,
    bitOrder: profile.bitOrder,
    blackIsOne: profile.blackIsOne,
    data,
  };
}

/** Expand a packed raster into booleans for test vectors and diagnostics. */
export function unpackMonoRaster(
  raster: RasterPage,
  includePaddingRows = false
): boolean[][] {
  const rowCount = includePaddingRows ? raster.wireHeightRows : raster.contentHeightRows;
  const rows: boolean[][] = [];

  for (let y = 0; y < rowCount; y += 1) {
    const row: boolean[] = [];
    const rowOffset = y * raster.bytesPerRow;
    for (let x = 0; x < raster.widthDots; x += 1) {
      const byteIndex = Math.floor(x / 8);
      const bitIndex = raster.bitOrder === "lsb-first" ? x % 8 : 7 - (x % 8);
      const storedBit = (raster.data[rowOffset + byteIndex] >> bitIndex) & 1;
      row.push(raster.blackIsOne ? storedBit === 1 : storedBit === 0);
    }
    rows.push(row);
  }

  return rows;
}
