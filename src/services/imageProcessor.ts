// Image processing service for MXW01 thermal printer
// Simplified to use modular dithering and transformation utilities

import { getDitherAlgorithm } from "./dithering";
import {
  rgbaBytesToGray,
  grayToRgba,
  rotate,
  flip,
} from "./imageTransforms";
import type { DitherMethod } from "./dithering";
import type { PrinterImageData } from "../core/types";
import type { RgbaImage } from "../core/print-types";

// Re-export for backward compatibility
export type { DitherMethod };

/**
 * Image processor options
 */
export interface ImageProcessorOptions {
  dither: DitherMethod;
  rotate: 0 | 90 | 180 | 270;
  flip: "none" | "h" | "v" | "both";
  brightness: number;
}

const SUPPORTED_DITHER_METHODS: readonly DitherMethod[] = ["threshold", "steinberg", "bayer", "atkinson", "pattern"];
const SUPPORTED_ROTATIONS: readonly number[] = [0, 90, 180, 270];
const SUPPORTED_FLIPS: readonly string[] = ["none", "h", "v", "both"];
const MAX_IMAGE_PIXELS = 2_000_000;

/**
 * Process an image for thermal printer
 * @param imageData Source image data
 * @param options Processing options
 * @returns Processed image data and binary rows for printing
 */
export function processImageForPrinter(
  imageData: PrinterImageData | RgbaImage,
  options: ImageProcessorOptions,
  targetWidth = 384
): {
  processedData: Uint32Array;
  width: number;
  height: number;
  binaryRows: boolean[][];
} {
  const width = imageData.width;
  const height = imageData.height;

  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0 || width * height > MAX_IMAGE_PIXELS) {
    throw new Error(`Image dimensions must be positive safe integers within ${MAX_IMAGE_PIXELS} pixels, got ${width}x${height}`);
  }
  if (!SUPPORTED_DITHER_METHODS.includes(options.dither) || !SUPPORTED_ROTATIONS.includes(options.rotate) || !SUPPORTED_FLIPS.includes(options.flip)) {
    throw new Error("Unsupported image processing option");
  }
  if (!Number.isInteger(options.brightness) || options.brightness < 0 || options.brightness > 255) {
    throw new Error("Image brightness must be an integer between 0 and 255");
  }
  if (!Number.isSafeInteger(targetWidth) || targetWidth <= 0) {
    throw new Error("Target width must be a positive safe integer");
  }

  if ("pixelFormat" in imageData && imageData.pixelFormat !== "rgba8888") {
    throw new Error(`Unsupported pixel format: ${imageData.pixelFormat}`);
  }

  if (width <= 0 || height <= 0) {
    throw new Error(`Image dimensions must be greater than zero, got ${width}x${height}`);
  }

  const expectedRowBytes = width * 4;
  const strideBytes = imageData.strideBytes ?? expectedRowBytes;
  if (!Number.isSafeInteger(strideBytes) || strideBytes < expectedRowBytes) {
    throw new Error(
      `Image stride must be at least ${expectedRowBytes} bytes, got ${strideBytes}`
    );
  }

  const expectedLength = strideBytes * height;
  if (imageData.data.length < expectedLength) {
    throw new Error(
      `Image data is shorter than its dimensions require: expected ${expectedLength}, got ${imageData.data.length}`
    );
  }

  // Normalize padded rows to tightly packed RGBA before rendering.
  const rgbaData = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * strideBytes;
    const targetOffset = y * expectedRowBytes;
    rgbaData.set(
      imageData.data.subarray(sourceOffset, sourceOffset + expectedRowBytes),
      targetOffset
    );
  }

  // Convert to grayscale with brightness adjustment. Reading explicit bytes
  // avoids the host-endianness assumption of Uint32Array pixel conversion.
  let mono = rgbaBytesToGray(rgbaData, options.brightness, true);

  // Apply dithering
  const ditherAlgorithm = getDitherAlgorithm(options.dither);
  mono = ditherAlgorithm.apply(mono, width, height);

  // Apply flip transformation
  mono = flip(mono, width, height, options.flip);

  // Apply rotation and determine final dimensions
  let finalWidth = width;
  let finalHeight = height;

  // Always pass input dimensions to rotate function
  mono = rotate(mono, width, height, options.rotate);
  
  // For 90° and 270° rotations, dimensions are swapped in the output
  if (options.rotate === 90 || options.rotate === 270) {
    finalWidth = height;
    finalHeight = width;
  }

  // Convert to RGBA for display
  const processedData = grayToRgba(mono, true);

  // Create binary rows array for printing. Rows are padded or clipped to the
  // selected profile width; the raster packer applies the wire bit order.
  const binaryRows: boolean[][] = [];

  for (let y = 0; y < finalHeight; y++) {
    const row: boolean[] = [];
    
    // Add actual image pixels that fit the printer profile.
    for (let x = 0; x < Math.min(finalWidth, targetWidth); x++) {
      const idx = y * finalWidth + x;
      const lum = mono[idx];
      row.push(lum < 128); // true = black (print), false = white
    }
    
    // Pad with white pixels to reach the profile width if needed.
    while (row.length < targetWidth) {
      row.push(false); // false = white (no print)
    }
    
    binaryRows.push(row);
  }

  return {
    processedData,
    width: finalWidth,
    height: finalHeight,
    binaryRows,
  };
}
