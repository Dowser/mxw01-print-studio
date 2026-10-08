#!/usr/bin/env node

import { NodeBluetoothAdapter, ThermalPrinterClient } from "../dist/index.js";

const args = process.argv.slice(2);
const confirm = args.includes("--confirm");
const deviceIdIndex = args.indexOf("--device-id");
const expectedDeviceId = deviceIdIndex >= 0 ? args[deviceIdIndex + 1] : undefined;

if (!confirm) {
  console.error("Refusing to print. Re-run with --confirm to send the hardware test page.");
  console.error("Optional: --device-id <id> restricts the print to one known device.");
  process.exit(2);
}

if (deviceIdIndex >= 0 && (!expectedDeviceId || expectedDeviceId.startsWith("--"))) {
  console.error("--device-id requires a non-empty device id.");
  process.exit(2);
}

const width = 384;
const height = 90;
const data = new Uint8ClampedArray(width * height * 4);

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const border = x < 2 || x >= width - 2 || y < 2 || y >= height - 2;
    const bars = x >= 24 && x < 32 || x >= 64 && x < 72 || x >= 104 && x < 112;
    const bands = (y >= 28 && y < 34 || y >= 56 && y < 62) && x >= 24 && x < 136;
    const checker =
      ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) &&
      x >= 160 && x < 224 && y >= 16 && y < 74;
    const black = border || (bars && y >= 12 && y < 78) || bands || checker;
    const offset = (y * width + x) * 4;
    const value = black ? 0 : 255;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  }
}

const adapter = new NodeBluetoothAdapter();
const client = new ThermalPrinterClient(adapter);
let lastPhase = "";
let exitCode = 0;

client.on("connected", (event) => {
  console.log(`Connected to ${event.device.name ?? "MXW01"} (${event.device.id})`);
});
client.on("printProgress", (event) => {
  if (event.phase !== lastPhase) {
    lastPhase = event.phase ?? "";
    console.log(`Print phase: ${lastPhase} (${Math.round(event.progress)}%)`);
  }
});

try {
  await client.connect();
  if (expectedDeviceId && client.connectedDevice?.id !== expectedDeviceId) {
    throw new Error(`Found ${client.connectedDevice?.id ?? "unknown"}, expected ${expectedDeviceId}; no data was printed.`);
  }
  await client.print(
    { data, width, height },
    { dither: "threshold", brightness: 128, intensity: 93 }
  );
  console.log("Hardware test print completed.");
} catch (error) {
  exitCode = 1;
  console.error(error instanceof Error ? error.message : String(error));
} finally {
  await client.dispose();
}

// Noble keeps its adapter event loop alive after disconnect on macOS.
process.exit(exitCode);
