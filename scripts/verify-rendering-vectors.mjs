#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { renderPrintDocument } from "../dist/index.js";
import { DOCUMENT_RENDERER_VERSION } from "../dist/index.js";

const fixturePath = new URL("../spec/test-vectors/rendering.json", import.meta.url);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

if (fixture.rendererVersion !== DOCUMENT_RENDERER_VERSION) {
  throw new Error(`Fixture renderer version ${fixture.rendererVersion} does not match ${DOCUMENT_RENDERER_VERSION}`);
}

function hex(data) {
  return Array.from(data, (byte) => byte.toString(16).padStart(2, "0")).join(" ");
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

for (const vector of fixture.vectors) {
  const profile = {
    ...vector.profile,
    dataChunkSize: vector.profile.bytesPerRow,
    dataChunkDelayMs: 0,
    capabilities: {
      status: false,
      intensity: false,
      raster: true,
      cancellation: false,
      maxPagesPerJob: 1,
    },
  };
  // Keep the historical vectors stable while the public default favours
  // grayscale-friendly Floyd–Steinberg output.
  const result = renderPrintDocument(vector.document, profile, {
    dither: "threshold",
    brightness: 128,
  });
  const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  if (errors.length > 0) {
    throw new Error(`${vector.name}: ${errors.map((diagnostic) => diagnostic.message).join("; ")}`);
  }

  const raster = result.pages[0];
  if (vector.raster.dataHex && hex(raster.data) !== vector.raster.dataHex) {
    throw new Error(`${vector.name}: complete raster bytes differ`);
  }
  if (vector.raster.firstRowHex && hex(raster.data.slice(0, profile.bytesPerRow)) !== vector.raster.firstRowHex) {
    throw new Error(`${vector.name}: first raster row differs`);
  }
  if (vector.raster.sha256 && sha256(raster.data) !== vector.raster.sha256) {
    throw new Error(`${vector.name}: SHA-256 differs`);
  }
  if (raster.contentHeightRows !== vector.raster.contentHeightRows || raster.wireHeightRows !== vector.raster.wireHeightRows) {
    throw new Error(`${vector.name}: raster dimensions differ`);
  }
  console.log(`conformance ok: ${vector.name}`);
}
