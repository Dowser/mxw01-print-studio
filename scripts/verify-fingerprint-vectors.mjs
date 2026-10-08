#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fingerprintPrintDocument } from "../dist/index.js";

const fixture = JSON.parse(
  await readFile(new URL("../spec/test-vectors/fingerprint.json", import.meta.url), "utf8")
);

for (const vector of fixture.vectors) {
  const actual = fingerprintPrintDocument(vector.document);
  if (actual !== vector.fingerprint) {
    throw new Error(`${vector.name}: expected ${vector.fingerprint}, got ${actual}`);
  }
  console.log(`fingerprint ok: ${vector.name}`);
}
