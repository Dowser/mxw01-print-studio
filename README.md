# MXW01 Print Studio

Public downstream fork of [`clementvp/mxw01-thermal-printer`](https://github.com/clementvp/mxw01-thermal-printer), extended with a deterministic document model, WYSIWYG web terminal, shared TypeScript/Swift boundaries and guarded local printing workflows.

The repository is intentionally named **MXW01 Print Studio** while the npm
package name remains `mxw01-thermal-printer` for compatibility with the
upstream API and existing consumers. The fork relationship, preserved commit
history and attribution chain are documented in [`UPSTREAM.md`](UPSTREAM.md)
and [`NOTICE.md`](NOTICE.md).

Framework-agnostic library for MXW01 thermal printer with support for browsers, Node.js, Bun, and more.

## Features

- 🎯 **Framework-agnostic** - Pure TypeScript core, works everywhere
- 🌐 **Multi-platform** - Browsers (Web Bluetooth), Node.js, Bun
- 📦 **Zero framework dependencies** - Use with React, Vue, Svelte, or vanilla JS
- 🖨️ **Advanced image processing** - Multiple dithering algorithms (Floyd-Steinberg, Bayer, Atkinson, etc.)
- 🔌 **Extensible adapters** - Web Bluetooth, Noble (Node.js), custom adapters
- 🔄 **Event-driven** - Subscribe to printer events
- 🧱 **Deterministic documents** - Versioned JSON model with preflight diagnostics
- 🛡️ **Safe local terminal** - Loopback-only API with strict document and request validation
- 📘 **Full TypeScript** - Complete type safety
- 📚 **Examples included** - React, Vue, Node/Bun implementations provided

## Installation

```bash
npm install mxw01-thermal-printer
```

### Optional Dependencies

**For Node.js/Bun (Bluetooth):**
```bash
npm install --no-save @stoprocent/noble
```

**For Node.js/Bun (Canvas):**
```bash
npm install canvas
```

**For Node.js/Bun (Fabric):**
```bash
npm install fabric
```

## Quick Start

### Browser (Vanilla JavaScript)

```typescript
import { ThermalPrinterClient, WebBluetoothAdapter } from 'mxw01-thermal-printer';

// Create client
const adapter = new WebBluetoothAdapter();
const printer = new ThermalPrinterClient(adapter);

// Connect
await printer.connect();

// Print from canvas
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

await printer.print(imageData, {
  dither: 'steinberg',
  brightness: 128,
  intensity: 93
});

// Disconnect
await printer.disconnect();
```

### Node.js / Bun

```typescript
import { ThermalPrinterClient, NodeBluetoothAdapter } from 'mxw01-thermal-printer';
import { createCanvas } from 'canvas';

// Create client
const adapter = new NodeBluetoothAdapter();
const printer = new ThermalPrinterClient(adapter);

// Connect
await printer.connect();

// Create image
const canvas = createCanvas(384, 200);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 384, 200);
ctx.fillStyle = 'black';
ctx.font = '30px Arial';
ctx.fillText('Hello from Node.js!', 20, 100);

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Print
await printer.print(imageData);

// Disconnect
await printer.disconnect();
```

## Framework Integration

The library provides a framework-agnostic core that can be easily integrated with any framework. **Example implementations are included** in the `examples/` directory:

### React Hook Example

See [`examples/react-hook.tsx`](examples/react-hook.tsx) for a complete React hook implementation.

```tsx
import { useThermalPrinter } from './examples/react-hook';
import { useRef, useEffect } from 'react';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, connectPrinter, printCanvas } = useThermalPrinter();
  
  // Draw on canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 384, 200);
    
    // Black text
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText('Hello from React!', 20, 100);
    
    // Draw a rectangle
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 364, 180);
  }, []);
  
  const handlePrint = async () => {
    if (canvasRef.current) {
      await printCanvas(canvasRef.current);
    }
  };
  
  return (
    <div>
      <canvas 
        ref={canvasRef} 
        width={384} 
        height={200}
        style={{ border: '1px solid #ccc' }}
      />
      <div>
        <button onClick={connectPrinter} disabled={isConnected}>
          Connect
        </button>
        <button onClick={handlePrint} disabled={!isConnected}>
          Print
        </button>
      </div>
    </div>
  );
}
```

### Vue 3 Composable Example

See [`examples/vue-composable.ts`](examples/vue-composable.ts) for a complete Vue composable implementation.

```vue
<script setup lang="ts">
import { useThermalPrinter } from './examples/vue-composable';
import { ref, onMounted } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const { isConnected, connectPrinter, printCanvas } = useThermalPrinter();

// Draw on canvas when component mounts
onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 384, 200);
  
  // Black text
  ctx.fillStyle = 'black';
  ctx.font = '30px Arial';
  ctx.fillText('Hello from Vue!', 20, 100);
  
  // Draw a rectangle
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 364, 180);
});

const handlePrint = async () => {
  if (canvasRef.value) {
    await printCanvas(canvasRef.value);
  }
};
</script>

<template>
  <div>
    <canvas 
      ref="canvasRef" 
      width="384" 
      height="200"
      style="border: 1px solid #ccc;"
    />
    <div>
      <button @click="connectPrinter" :disabled="isConnected">
        Connect
      </button>
      <button @click="handlePrint" :disabled="!isConnected">
        Print
      </button>
    </div>
  </div>
</template>
```

## Core API

### ThermalPrinterClient

The main client class for interacting with the printer.

```typescript
import { ThermalPrinterClient, WebBluetoothAdapter } from 'mxw01-thermal-printer';

const adapter = new WebBluetoothAdapter();
const printer = new ThermalPrinterClient(adapter);
```

#### Methods

- `connect(): Promise<void>` - Connect to the printer
- `disconnect(): Promise<void>` - Disconnect from the printer
- `print(imageData: ImageData, options?: PrintOptions): Promise<void>` - Print an image
- `getStatus(): Promise<PrinterState | null>` - Get printer status
- `setDitherMethod(method: DitherMethod): void` - Set dithering algorithm
- `setPrintIntensity(intensity: number): void` - Set print intensity (0-255)
- `on(eventType, listener): () => void` - Subscribe to events
- `dispose(): Promise<void>` - Clean up resources

#### Properties

- `isConnected: boolean` - Connection status
- `isPrinting: boolean` - Printing status
- `printerState: PrinterState | null` - Current printer state
- `statusVerified: boolean` - A live status response has been received
- `isPrintReady: boolean` - Connection, live status and fault flags all allow printing
- `statusMessage: string` - Current status message
- `ditherMethod: DitherMethod` - Current dithering method
- `printIntensity: number` - Current print intensity

#### Events

```typescript
printer.on('connected', (event) => {
  console.log('Connected to:', event.device.name);
});

printer.on('disconnected', () => {
  console.log('Disconnected');
});

printer.on('stateChange', (event) => {
  console.log('Printer state:', event.state);
});

printer.on('printProgress', (event) => {
  console.log(`${event.phase}: ${event.progress}%`);
});

printer.on('error', (event) => {
  console.error('Error:', event.error);
});
```

## Configuration

### Print Options

```typescript
interface PrintOptions {
  dither?: DitherMethod;           // Dithering algorithm
  rotate?: 0 | 90 | 180 | 270;    // Rotation angle
  flip?: 'none' | 'h' | 'v' | 'both'; // Flip direction
  brightness?: number;              // Image brightness (0-255, default: 128)
  intensity?: number;               // Print intensity (0-255, default: 93)
}
```

### Dithering Methods

| Method       | Best For              | Description                    |
| ------------ | --------------------- | ------------------------------ |
| `threshold`  | Text, simple graphics | Basic black/white conversion   |
| `steinberg`  | Photos, general use   | Floyd-Steinberg (recommended)  |
| `bayer`      | Patterns, textures    | Ordered dithering              |
| `atkinson`   | Comics, illustrations | Atkinson dithering             |
| `pattern`    | Special effects       | Pattern-based dithering        |

### Understanding Parameters

#### `brightness` - Image Pre-processing

- **Range**: 0-255 (default: 128)
- **Effect**: Adjusts image lightness before printing
  - Lower values (0-127): Darker image (more black pixels)
  - 128: Normal (recommended)
  - Higher values (129-255): Lighter image (fewer black pixels)

#### `intensity` - Print Head Heat

- **Range**: 0-255 (default: 93)
- **Effect**: Controls thermal print head temperature
  - 50-80: Light printing
  - 80-100: Normal printing (recommended)
  - 100-150: Dark printing
  - 150-255: Very dark (risk of paper damage)

### Recommended Settings

| Use Case    | brightness | intensity | Description        |
| ----------- | ---------- | --------- | ------------------ |
| Normal text | 128        | 93        | Balanced, readable |
| Photos      | 140        | 100       | Good contrast      |
| Barcodes/QR | 128        | 110       | High contrast      |
| Light draft | 150        | 70        | Saves heat         |
| Dark/bold   | 110        | 120       | Maximum darkness   |

## Examples

Complete working examples are provided in the `examples/` directory:

- **[`nodejs-canvas-example.ts`](examples/nodejs-canvas-example.ts)** - Basic Node.js/Bun implementation
- **[`nodejs-fabric-example.ts`](examples/nodejs-fabric-example.ts)** - Node.js/Bun with Fabric.js for advanced graphics
- **[`react-hook.tsx`](examples/react-hook.tsx)** - React hook implementation
- **[`vue-composable.ts`](examples/vue-composable.ts)** - Vue 3 composable implementation

These examples show how to integrate the core library with different frameworks. You can copy and adapt them to your project.

### Local web terminal

The repository includes a local, Node-backed web terminal for trying the
document renderer and printing against a nearby MXW01 device. It follows the
same useful flow as the reference web terminal—templates, live preview,
connection status and one-click printing—but keeps the Bluetooth connection in
the local Node process. By default the server binds to loopback only.

Install the optional Noble adapter once, then start the terminal:

```bash
npm install --no-save @stoprocent/noble
npm run web:dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Choose a template or add
text, rules, barcodes, QR codes and images. The preview is generated by the
same deterministic renderer used by the library. Connect the printer from the
header and use **Skriv ut etikett** when the preview is ready. The editor also
supports editable label height, local draft autosave, undo/redo, layer order,
duplicate, JSON import/export, a local saved-label library and a mobile-friendly
preview-first workflow. Text, fortune-cookie fields and checklists grow their
layout automatically when wrapping requires more rows; uncheck the automatic
height option when a deliberately fixed frame is needed. The WYSIWYG handles
also support keyboard selection and arrow-key movement.

The first status response from some MXW01 firmware can arrive late after a
Bluetooth connection is established. The client retries the initial status
request and keeps a usable connection as **status unavailable** if the printer
does not answer; a later status poll can still populate the printer flags. A
physical print is fail-closed until a live status response confirms that the
printer is ready; paper jams, an open cover, missing paper, low battery and
overheating are surfaced before the job touches the printer.

The server intentionally refuses non-loopback `--host` values. This terminal is
for local development; exposing it on a LAN requires a separate authenticated
deployment boundary.

The local server exposes only the following loopback API:

- `GET /api/status` — connection, printer state and print progress
- `GET /api/readiness` — readiness/liveness split; returns 503 while printing is unsafe
- `POST /api/connect` / `POST /api/disconnect` — manage the Noble connection
- `POST /api/preview` — render a versioned `PrintDocument` to a packed raster
- `POST /api/print` — re-run preflight and send the document to the connected printer
- `POST /api/webpage` — safely fetch a public HTML page and turn it into editable text blocks
- `GET /api/batch/list`, `POST /api/batch/reconcile` and `POST /api/batch/skip` — inspect and recover persisted batch state

Preview responses include `canPrint`, `documentFingerprint`, `profileId` and
`rendererVersion`. A print request must echo those values together with the
render options in `preflight`; the server rejects a stale or mismatched preview
before touching Bluetooth. `canPrint` is deliberately conservative: validation
errors, warnings and empty documents are previewable but not printable. The
fingerprint is a stable, non-cryptographic FNV-1a identity for the canonical
document; it is an artefact guard, not an authentication token.

The browser never receives Bluetooth credentials or talks directly to Noble;
this boundary is intentional so the same `PrintDocument` and renderer contract
can be reused by the Swift package in [`swift/`](swift/), with a separate
CoreBluetooth adapter target.



## Platform Support

| Platform     | Support | Adapter                  | Notes                              |
| ------------ | ------- | ------------------------ | ---------------------------------- |
| Browser      | ✅      | WebBluetoothAdapter      | Requires Web Bluetooth API         |
| Node.js      | ✅      | NodeBluetoothAdapter     | Requires @stoprocent/noble         |
| Bun          | ✅      | NodeBluetoothAdapter     | Same as Node.js                    |
| Swift/iOS    | 🧱      | MXW01CoreBluetooth       | Codable core, framing and raster boundary; renderer/transport still under development |

### Browser Compatibility

Web Bluetooth API is supported in:

- ✅ Chrome/Edge 56+
- ✅ Opera 43+
- ✅ Chrome for Android

Not supported in:

- ❌ Firefox
- ❌ Safari (as of 2024)

## Architecture

```
UI / framework integration
          │
PrintDocument → renderer → RasterPage → MXW01Printer
                                      │
                           protocol codec → ByteTransport → adapter
```

The library is designed with clear separation of concerns:

- **Core value types** - Versioned documents, printer profiles, raster pages,
  job phases and stable error categories. These are deliberately free of DOM
  and Bluetooth objects and are mirrored by `MXW01Core` in the Swift package.
- **Renderer and raster layer** - Explicit RGBA normalization and packed
  1-bit output. `contentHeightRows` is kept separate from the profile-specific
  wire padding (`wireHeightRows`).
- **Protocol and transport** - Framing/CRC validation is separate from the
  Bluetooth adapter. `FrameDecoder` handles fragmented notifications and
  `ByteTransport` can be implemented with Web Bluetooth, Noble or
  CoreBluetooth.
- **Client** - Backwards-compatible image printing facade with typed errors and
  progress events.
- **Examples** - Reference implementations for different frameworks

### Cross-platform document model

`PrintDocument` is a versioned, JSON-safe model for text, images, rules,
barcodes and QR codes. Text has stable `TextFontId` values; the default
high-resolution glyph table is platform-neutral and exported as
`VECTOR_TEXT_GLYPHS`, so the TypeScript and Swift implementations can
share the same outlines, layout metrics and rasterization rules. The
`layoutPrintDocument` helper grows editor-managed continuous labels before
rendering and is part of the cross-platform contract. The legacy 5×7 bitmap
remains available as an explicit compatibility font. Shared conformance vectors live
in [`spec/test-vectors/`](spec/test-vectors/) and should be used by both
implementations.

```typescript
import {
  PRINT_DOCUMENT_SCHEMA,
  PRINT_DOCUMENT_VERSION,
  validatePrintDocument,
  type PrintDocument,
} from 'mxw01-thermal-printer';

const document: PrintDocument = {
  schema: PRINT_DOCUMENT_SCHEMA,
  version: PRINT_DOCUMENT_VERSION,
  page: {
    widthDots: 384,
    heightDots: 120,
    margins: { top: 4, right: 4, bottom: 4, left: 4 },
  },
  nodes: [],
};

const diagnostics = validatePrintDocument(document);
```

The current client remains the compatibility facade. New applications should
keep rendering and transport behind the public value-type boundaries. The
Swift package currently covers Codable document values, canonical fingerprints,
MXW01 framing/CRC and LSB-first raster packing; its CoreBluetooth target is the
platform adapter seam that will host discovery and characteristic mapping.

```bash
swift test --scratch-path /Volumes/External2TB/AppData/codex/tmp/mxw01/swift
```

### Quality gates

The local web terminal has both API smoke tests and a real-browser flow. The
browser test uses the Playwright CLI wrapper when the Codex skill is present,
and falls back to the package from npm in CI:

```bash
npm run lint
npm test -- --run
npm run test:conformance
npm run web:dev       # keep running in another terminal
npm run web:smoke
npm run web:e2e
```

### Deterministic document rendering

The first renderer is available through `renderPrintDocument`. It uses a
bundled high-resolution vector stroke font with 4×4 supersampling, while
retaining the deterministic 5×7 bitmap font as an explicit option. It also
supports RGBA image nodes, Code 128/EAN-13/UPC-A barcodes and QR version 1-L.
The renderer version is explicit because changing glyphs, sampling, encoding
or QR masks changes printed pixels.

```typescript
import {
  MXW01_PRINTER_PROFILE,
  renderPrintDocument,
} from 'mxw01-thermal-printer';

const rendered = renderPrintDocument(document, MXW01_PRINTER_PROFILE);
if (!rendered.canPrint) {
  throw new Error(rendered.diagnostics.map((item) => item.message).join('\n'));
}

const raster = rendered.pages[0];
```

When a document renderer has already produced a `RasterPage`, send that exact
raster with `ThermalPrinterClient.printRaster(raster, { intensity })`. This
keeps selected brightness and dithering identical between preview and physical
output; the legacy `print(imageData, options)` facade remains available for
callers that start from RGBA pixels.

Cross-language rendering vectors are maintained in
[`spec/test-vectors/rendering.json`](spec/test-vectors/rendering.json). Swift
should implement these vectors before it is used for production output.

### Hardware smoke test

The repository includes a guarded end-to-end print command. It requires the
optional Noble dependency and an explicit confirmation flag so a normal test
run cannot print accidentally:

```bash
npm install --no-save @stoprocent/noble
npm run hardware:test-print -- --confirm --device-id <known-device-id>
```

Without `--device-id`, the command prints the first MXW01 device discovered
after `--confirm`. It sends only the 384×90-pixel diagnostic pattern used to
validate connection, status, raster transfer and print completion.

## Advanced Usage

### Creating Custom Adapters

You can create custom Bluetooth adapters for other platforms:

```typescript
import type { BluetoothAdapter } from 'mxw01-thermal-printer';

class MyCustomAdapter implements BluetoothAdapter {
  isAvailable(): boolean {
    // Check if Bluetooth is available
  }

  async requestDevice(): Promise<BluetoothDevice> {
    // Request device from user
  }

  async connect(device: BluetoothDevice): Promise<BluetoothConnection> {
    // Connect and return connection with characteristics
  }
}

// Use your custom adapter
const printer = new ThermalPrinterClient(new MyCustomAdapter());
```

### Direct Protocol Access

For advanced use cases, you can use the low-level protocol directly:

```typescript
import { MXW01Printer, prepareImageDataBuffer, encode1bppRow } from 'mxw01-thermal-printer';

// Create printer instance
const printer = new MXW01Printer(controlWrite, dataWrite);

// Set intensity
await printer.setIntensity(93);

// Request status
await printer.requestStatus();

// Print image
const imageBuffer = prepareImageDataBuffer(binaryRows);
await printer.printRequest(binaryRows.length, 0);
await printer.sendDataChunks(imageBuffer);
await printer.flushData();
await printer.waitForPrintComplete();
```

## Troubleshooting

### Connection Issues

- Ensure Bluetooth is enabled on your device
- Make sure the printer is charged and turned on
- Try disconnecting and reconnecting
- Check that no other application is connected to the printer

### Print Quality Issues

- Adjust `brightness` and `intensity` settings
- Try different dithering algorithms
- Check that the thermal paper is properly loaded
- Clean the thermal print head if necessary

### Node.js Issues

- Ensure `@stoprocent/noble` is properly installed
- On Linux, you may need to grant Bluetooth permissions
- On Windows, ensure Bluetooth drivers are up to date
- Check that no other Bluetooth service is using the adapter

## TypeScript Support

The library is written in TypeScript and provides complete type definitions:

```typescript
import type {
  ThermalPrinterClient,
  PrinterState,
  PrintOptions,
  DitherMethod,
  BluetoothAdapter,
  PrinterEvent
} from 'mxw01-thermal-printer';
```

## Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md)
before opening an issue or pull request. In particular, keep the TypeScript
and Swift value-model fixtures in sync and preserve the license of any
third-party code or assets that are added.

## License

The original library and the downstream project code are released under the
MIT License. See [`LICENSE`](LICENSE) for the complete terms and
[`NOTICE.md`](NOTICE.md) for upstream, protocol-reference and bundled-asset
attribution. Font Awesome is a separately licensed third-party asset; its
license is also included at [`web/vendor/fontawesome/LICENSE.txt`](web/vendor/fontawesome/LICENSE.txt).

## Credits

The original TypeScript library and its initial MXW01 implementation are by
[Clément Van Peuter](https://github.com/clementvp). The protocol research chain
also includes [dropalltables/catprinter](https://github.com/dropalltables/catprinter)
and [jeremy46231/MXW01-catprinter](https://github.com/jeremy46231/MXW01-catprinter);
the exact relationship and license boundaries are recorded in
[`NOTICE.md`](NOTICE.md).

The Print Studio extensions are maintained by the Dowser contributors.
