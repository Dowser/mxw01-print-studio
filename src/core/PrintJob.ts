// Print job encapsulation for ThermalPrinterClient

import { packMonoRaster } from "../services/raster";
import { processImageForPrinter } from "../services/imageProcessor";
import { cropImageData } from "../services/imageTransforms";
import type { PrinterImageData, PrintOptions } from "./types";
import type { ImageProcessorOptions } from "../services/imageProcessor";
import type { PrinterProfile, RasterPage } from "./print-types";
import { MXW01_PRINTER_PROFILE } from "./printerProfiles";

/**
 * Encapsulates a print job with image processing and preparation
 */
export class PrintJob {
  private imageData: PrinterImageData;
  private options: PrintOptions;
  private profile: PrinterProfile;

  constructor(
    imageData: PrinterImageData,
    options: PrintOptions = {},
    profile: PrinterProfile = MXW01_PRINTER_PROFILE
  ) {
    this.imageData = imageData;
    this.options = options;
    this.profile = profile;
  }

  /**
   * Process and prepare image for printing
   * @param defaultDither Default dithering method
   * @returns Prepared image buffer and metadata
   */
  prepare(defaultDither: ImageProcessorOptions["dither"]): {
    imageBuffer: Uint8Array;
    numLines: number;
    wireLines: number;
    raster: RasterPage;
  } {
    // Default processing options
    const processingOptions: ImageProcessorOptions = {
      dither: this.options.dither ?? defaultDither,
      brightness: this.options.brightness ?? 128,
      flip: this.options.flip ?? "none",
      rotate: this.options.rotate ?? 0,
    };

    // If width exceeds the selected profile, crop to its printable width.
    let processedImage = this.imageData;
    
    if (this.imageData.width > this.profile.widthDots) {
      processedImage = cropImageData(
        this.imageData,
        this.profile.widthDots,
        this.imageData.height
      );
    }

    // Process image for printing (rotation is applied here on the content)
    const { binaryRows } = processImageForPrinter(
      processedImage,
      processingOptions,
      this.profile.widthDots
    );

    // Pack the content and apply profile-specific wire padding. `numLines`
    // remains the content height for compatibility with the existing MXW01
    // command; `wireLines` makes the distinction explicit for new drivers.
    const raster = packMonoRaster(binaryRows, this.profile);

    return {
      imageBuffer: raster.data,
      numLines: raster.contentHeightRows,
      wireLines: raster.wireHeightRows,
      raster,
    };
  }

  /**
   * Get print intensity from options or default
   * @param defaultIntensity Default intensity value
   * @returns Print intensity
   */
  getIntensity(defaultIntensity: number): number {
    const intensity = this.options.intensity ?? defaultIntensity;
    if (!Number.isInteger(intensity) || !Number.isFinite(intensity) || intensity < 0 || intensity > 255) {
      throw new Error("Print intensity must be an integer between 0 and 255");
    }
    return intensity;
  }
}
