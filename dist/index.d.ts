export declare type AlphaMode = "straight" | "premultiplied";

export declare function asPrinterError(error: unknown, fallbackCode?: PrinterErrorCode): PrinterError;

export declare interface BarcodeNode extends DocumentNodeFrame {
    readonly kind: "barcode";
    readonly format: "code128" | "ean13" | "upca";
    readonly value: string;
    readonly showText?: boolean;
}

export declare function batchValues(batch: PrintBatchJob, index: number): Readonly<Record<string, string>>;

export declare type BitOrder = "lsb-first" | "msb-first";

/**
 * Abstract interface for Bluetooth adapters
 * Implementations can use Web Bluetooth API, Noble, or other BLE libraries
 */
export declare interface BluetoothAdapter {
    /**
     * Request a Bluetooth device with printer services
     */
    requestDevice(): Promise<BluetoothDevice_2>;
    /**
     * Connect to a Bluetooth device and get service characteristics
     */
    connect(device: BluetoothDevice_2): Promise<BluetoothConnection & BluetoothServiceInfo>;
    /**
     * Check if Bluetooth is available in the current environment
     */
    isAvailable(): boolean;
}

export declare interface BluetoothCharacteristic {
    writeValueWithoutResponse(data: Uint8Array): Promise<void>;
    startNotifications(): Promise<void>;
    stopNotifications(): Promise<void>;
    addEventListener(event: string, callback: (event: BluetoothNotificationEvent) => void): void;
    removeEventListener(event: string, callback: (event: BluetoothNotificationEvent) => void): void;
}

export declare interface BluetoothConnection {
    device: BluetoothDevice_2;
    disconnect(): Promise<void>;
    /** Optional adapter-level notification for an unexpected physical disconnect. */
    onDisconnect?(listener: (error?: Error) => void): () => void;
}

declare interface BluetoothDevice_2 {
    id: string;
    name?: string;
}
export { BluetoothDevice_2 as BluetoothDevice }

/** Platform-neutral notification payload passed from a Bluetooth adapter. */
export declare interface BluetoothNotificationEvent {
    readonly value: Uint8Array;
}

export declare interface BluetoothServiceInfo {
    controlCharacteristic: BluetoothCharacteristic;
    dataCharacteristic: BluetoothCharacteristic;
    notifyCharacteristic: BluetoothCharacteristic;
}

/** A small byte-oriented transport contract suitable for BLE or a fake. */
export declare interface ByteTransport {
    readonly maxWriteBytes: number;
    open(): Promise<void>;
    close(): Promise<void>;
    write(endpoint: TransportEndpoint, data: Uint8Array): Promise<void>;
    onBytes(listener: (data: Uint8Array) => void): () => void;
    onDisconnect(listener: (error?: Error) => void): () => void;
}

export declare type ByteWriteFunction = (data: BufferSource) => Promise<void>;

/**
 * Adapts the original pair of characteristic write functions to the new
 * byte-oriented transport boundary. It is intentionally small and can be
 * replaced by Web Bluetooth, Noble or CoreBluetooth implementations.
 */
export declare class CallbackByteTransport implements ByteTransport {
    private readonly controlWrite;
    private readonly dataWrite;
    readonly maxWriteBytes: number;
    private readonly disconnectListeners;
    private readonly byteListeners;
    constructor(controlWrite: ByteWriteFunction, dataWrite: ByteWriteFunction, maxWriteBytes?: number);
    open(): Promise<void>;
    close(): Promise<void>;
    write(endpoint: TransportEndpoint, data: Uint8Array): Promise<void>;
    onBytes(listener: (data: Uint8Array) => void): () => void;
    onDisconnect(listener: (error?: Error) => void): () => void;
    /** Useful for adapter bridges and deterministic transport tests. */
    emitBytes(data: Uint8Array): void;
    /** Useful for adapter bridges and deterministic transport tests. */
    emitDisconnect(error?: Error): void;
}

export declare interface ChecklistItem {
    readonly text: string;
    readonly checked?: boolean;
}

export declare interface ChecklistNode extends DocumentNodeFrame {
    readonly kind: "checklist";
    readonly items: readonly ChecklistItem[];
    /** Editors grow checklist rows and the containing node when enabled; false keeps a fixed frame. */
    readonly autoHeight?: boolean;
    readonly itemHeightDots?: number;
    readonly fontId?: TextFontId;
    readonly fontSizeDots?: number;
}

/**
 * MXW01 Printer command identifiers
 */
export declare const Command: {
    readonly GetStatus: 161;
    readonly SetIntensity: 162;
    readonly PrintRequest: 169;
    readonly FlushData: 173;
    readonly PrintComplete: 170;
};

export declare const DEFAULT_LAYOUT_BOTTOM_PADDING = 12;

/**
 * Options for image processing
 */
export declare type DitherMethod = "threshold" | "steinberg" | "bayer" | "atkinson" | "pattern";

/**
 * Dithering method type
 */
declare type DitherMethod_2 = "threshold" | "steinberg" | "bayer" | "atkinson" | "pattern";

/** Bump when the same document can produce different pixels. */
export declare const DOCUMENT_RENDERER_VERSION = "bitmap-5x7-qr1-v6";

export declare interface DocumentMargins {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
}

/** Physical media hints. Rendering remains monochrome; color is preview metadata. */
export declare interface DocumentMedia {
    readonly kind: MediaKind;
    readonly color: MediaColor;
    readonly labelHeightDots?: number;
    readonly gapDots?: number;
    readonly profileId?: string;
}

export declare interface DocumentNodeFrame {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly rotation?: 0 | 90 | 180 | 270;
}

export declare interface DocumentRenderOptions {
    readonly dither?: DitherMethod;
    readonly brightness?: number;
}

/**
 * Encode a row of boolean pixels to binary format
 */
export declare function encode1bppRow(rowBool: readonly boolean[], profile?: PrinterProfile): Uint8Array;

export declare function findMediaProfile(profileId: string): LabelMediaProfile | undefined;

/**
 * Produce a small stable fingerprint for a JSON-safe document.
 *
 * This intentionally uses a platform-neutral FNV-1a hash over canonical UTF-8
 * JSON so a future Swift implementation can reproduce it without depending on
 * a JavaScript runtime or a cryptography library.
 */
export declare function fingerprintPrintDocument(value: unknown): string;

/**
 * Font Awesome free-solid 6.7.2 paths, expressed in their original viewBox.
 * Icons are CC BY 4.0; see web/vendor/fontawesome/LICENSE.txt.
 */
export declare const FONT_AWESOME_ICON_PATHS: Readonly<Record<IconId, FontAwesomeIconPath>>;

/**
 * The source geometry for the Font Awesome free-solid icons used by the
 * document model.  Keeping the original viewBox and path data in the
 * platform-neutral core means web and native clients can rasterize the same
 * icon without depending on a browser font.
 */
export declare interface FontAwesomeIconPath {
    readonly width: number;
    readonly height: number;
    readonly path: string;
}

export declare function formatSequenceValue(value: number, sequence: Pick<NonNullable<PrintBatchJob["sequence"]>, "padding" | "prefix" | "suffix">): string;

export declare interface FortuneNode extends DocumentNodeFrame {
    readonly kind: "fortune";
    readonly text: string;
    readonly autoHeight?: boolean;
    readonly fontId?: TextFontId;
    readonly fontSizeDots?: number;
    readonly align?: "left" | "center" | "right";
}

/**
 * Incremental decoder for notifications fragmented across BLE packets.
 * It only emits fully framed, checksum-verified protocol packets.
 */
export declare class FrameDecoder {
    private readonly options;
    private buffer;
    constructor(options?: ParseFrameOptions);
    feed(chunk: Uint8Array): ParsedFrame[];
    reset(): void;
    private findHeader;
}

export declare type FrameStyle = "solid" | "double" | "dashed" | "dotted" | "rounded";

export declare type IconId = "fa-star" | "fa-heart" | "fa-check" | "fa-xmark" | "fa-print" | "fa-camera" | "fa-image" | "fa-ticket" | "fa-tag" | "fa-circle-info" | "fa-triangle-exclamation" | "fa-bell" | "fa-user" | "fa-calendar-check" | "fa-barcode" | "fa-qrcode";

export declare interface IconNode extends DocumentNodeFrame {
    readonly kind: "icon";
    /** A stable Font Awesome free-solid icon identity shared by web and native clients. */
    readonly iconId: IconId;
}

export declare interface ImageNode extends DocumentNodeFrame {
    readonly kind: "image";
    /** Base64-encoded RGBA8888 data keeps the document JSON/Codable-friendly. */
    readonly image: {
        readonly width: number;
        readonly height: number;
        readonly dataBase64: string;
    };
}

export declare interface ImageProcessorOptions {
    dither: DitherMethod;
    rotate: 0 | 90 | 180 | 270;
    flip: "none" | "h" | "v" | "both";
    brightness: number;
}

/**
 * Image processor options
 */
declare interface ImageProcessorOptions_2 {
    dither: DitherMethod_2;
    rotate: 0 | 90 | 180 | 270;
    flip: "none" | "h" | "v" | "both";
    brightness: number;
}

export declare interface LabelMediaProfile {
    readonly id: string;
    readonly name: string;
    readonly kind: MediaKind;
    readonly color: MediaColor;
    readonly widthDots: number;
    readonly heightDots: number;
    readonly gapDots: number;
    readonly widthMm: number;
    readonly heightMm?: number;
}

/**
 * Expands editor-managed nodes before validation/rendering.
 * Fixed-height nodes remain fixed when autoHeight is explicitly false.
 */
export declare function layoutPrintDocument(document: PrintDocument): PrintDocument;

/**
 * Build a command packet for the MXW01 printer
 * @param command Command identifier
 * @param payload Command payload data
 * @returns Complete command packet with header, payload, CRC, and terminator
 */
export declare function makeCommand(command: number, payload: Uint8Array): Uint8Array;

export declare function makeFortuneNode(id: string, text: string, frame: Pick<FortuneNode, "x" | "y" | "width" | "height">): FortuneNode;

/** The web editor and native clients use the same bounded continuous-label layout. */
export declare const MAX_LAYOUT_PAGE_HEIGHT = 4000;

export declare type MediaColor = "white" | "yellow" | "blue" | "pink" | "green" | "orange" | "red" | "transparent";

export declare type MediaKind = "continuous" | "die-cut" | "black-mark";

export declare function mediaProfileToDocumentMedia(profile: LabelMediaProfile): DocumentMedia;

export declare const MIN_DATA_BYTES: number;

/**
 * Media choices are deliberately independent of the Bluetooth printer
 * profile. The MXW01 still prints a monochrome bitmap; color is substrate
 * metadata used by the preview and contrast guidance.
 */
export declare const MXW01_MEDIA_PROFILES: readonly LabelMediaProfile[];

/**
 * Profile for the MXW01 firmware exercised by this package.
 *
 * The 90-row minimum is a wire-format constraint observed by the existing
 * implementation. It is intentionally a profile value rather than a global
 * renderer assumption so other printer protocols can make their own choice.
 */
export declare const MXW01_PRINTER_PROFILE: PrinterProfile;

/**
 * MXW01 Thermal Printer Controller
 * Simplified class that delegates to protocol and state management modules
 */
export declare class MXW01Printer {
    private readonly transport;
    private readonly profileDefinition;
    private stateManager;
    private readonly frameDecoder;
    private readonly notificationFrameDecoder;
    private readonly unsubscribeBytes;
    private readonly unsubscribeDisconnect;
    private disposed;
    private statusRequestPromise;
    constructor(transport: ByteTransport, profile?: PrinterProfile);
    constructor(controlWrite: WriteFunction, dataWrite: WriteFunction, profile?: PrinterProfile);
    get profile(): PrinterProfile;
    dispose(): void;
    /**
     * Get current printer state
     */
    get state(): PrinterState_2;
    /**
     * Process incoming notification from printer
     */
    notify(message: Uint8Array): void;
    /**
     * Process a complete, checksum-verified notification from a production
     * Bluetooth adapter. `notify` remains permissive for legacy integrations.
     */
    notifyStrict(message: Uint8Array): boolean;
    /**
     * Set print intensity (darkness)
     */
    setIntensity(intensity?: number): Promise<void>;
    /**
     * Request current printer status
     */
    requestStatus(timeoutMs?: number): Promise<Uint8Array>;
    private requestStatusInternal;
    /**
     * Send print request with number of lines
     */
    printRequest(lines: number, mode?: number): Promise<Uint8Array>;
    /**
     * Flush data to printer
     */
    flushData(): Promise<void>;
    /**
     * Send data chunks to printer
     */
    sendDataChunks(data: Uint8Array, chunkSize?: number, onProgress?: (sentBytes: number, totalBytes: number) => void): Promise<void>;
    /** Arm the completion latch before a print request is sent. */
    prepareForPrint(): number;
    /** Wait for print completion without clearing an already received response. */
    waitForPrintComplete(timeoutMs?: number, afterSequence?: number): Promise<void>;
}

/**
 * Node.js Bluetooth adapter using Noble
 * Provides native Bluetooth access for Node.js and Bun environments
 *
 * @example
 * ```typescript
 * import { ThermalPrinterClient } from 'react-mxw01-printer';
 * import { NodeBluetoothAdapter } from 'react-mxw01-printer/adapters/node';
 *
 * const adapter = new NodeBluetoothAdapter();
 * const printer = new ThermalPrinterClient(adapter);
 * ```
 *
 * @requires @stoprocent/noble
 */
export declare class NodeBluetoothAdapter implements BluetoothAdapter {
    private noble;
    private readonly nobleModule;
    private readonly peripherals;
    private activePeripheral;
    private scanPromise;
    private characteristics;
    constructor();
    private loadNobleModule;
    private ensureNoble;
    /**
     * Check if Bluetooth is available (Noble is loaded)
     * The powered on state is checked during requestDevice()
     */
    isAvailable(): boolean;
    /**
     * Scan for and request a Bluetooth printer device
     * Automatically finds devices with MXW01 printer service UUID
     */
    requestDevice(): Promise<BluetoothDevice_2>;
    /**
     * Connect to a Bluetooth device and get printer service characteristics
     */
    connect(device: BluetoothDevice_2): Promise<BluetoothConnection & BluetoothServiceInfo>;
}

/** Pack boolean rows into the profile's explicit 1-bit wire representation. */
export declare function packMonoRaster(rows: readonly (readonly boolean[])[], profile?: PrinterProfile): RasterPage;

export declare interface PageFrame {
    readonly insetDots: number;
    readonly thicknessDots: number;
    readonly style?: FrameStyle;
}

export declare interface ParsedFrame {
    readonly cmdId: number;
    readonly payload: Uint8Array;
    readonly crc?: number;
    readonly hasTerminator: boolean;
}

/**
 * Parse a complete protocol frame.
 *
 * Some firmware notifications observed in the wild omit the CRC/terminator,
 * so the default is deliberately compatible with those legacy notifications.
 * New transports should use `FrameDecoder`, which enables both checks.
 */
export declare function parseFrame(message: Uint8Array, options?: ParseFrameOptions): ParsedFrame | null;

export declare interface ParseFrameOptions {
    /** Require the CRC byte and validate it against the payload. */
    readonly requireChecksum?: boolean;
    /** Require the final 0xff terminator byte. */
    readonly requireTerminator?: boolean;
}

/**
 * Parse notification message from printer
 * @param message Raw notification data
 * @returns Parsed command ID and payload, or null if invalid
 */
export declare function parseNotification(message: Uint8Array): {
    cmdId: number;
    payload: Uint8Array;
} | null;

/**
 * Value types shared by renderers, protocol drivers and platform adapters.
 *
 * These types deliberately contain no DOM, Bluetooth or Node.js objects. They
 * are the boundary that a future Swift package can mirror with Foundation
 * value types and Codable models.
 */
export declare type PixelFormat = "rgba8888";

/** Prepare image rows and apply profile-specific wire padding. */
export declare function prepareImageDataBuffer(imageRowsBool: readonly (readonly boolean[])[], profile?: PrinterProfile): Uint8Array;

export declare const PRINT_BATCH_SCHEMA: "mxw01.print-batch";

export declare const PRINT_BATCH_VERSION: 1;

export declare const PRINT_DOCUMENT_SCHEMA: "mxw01.print-document";

export declare const PRINT_DOCUMENT_VERSION: 1;

export declare const PRINT_TEMPLATE_SCHEMA: "mxw01.print-template";

export declare const PRINT_TEMPLATE_VERSION: 1;

export declare interface PrintBatchJob {
    readonly schema: typeof PRINT_BATCH_SCHEMA;
    readonly version: typeof PRINT_BATCH_VERSION;
    readonly templateId?: string;
    /** Stable client-generated id used to correlate a multi-request print job. */
    readonly jobId?: string;
    /** Zero-based item index when the job is transported one label at a time. */
    readonly index?: number;
    /** Fingerprint of the unresolved template document, stable across sequence items. */
    readonly templateFingerprint?: string;
    /** Unresolved template snapshot used to verify each resolved batch item. */
    readonly templateDocument?: PrintDocument;
    readonly count: number;
    readonly intervalMs?: number;
    readonly confirmEach?: boolean;
    readonly onError?: "pause" | "retry" | "skip" | "stop";
    readonly values?: Readonly<Record<string, string>>;
    readonly rows?: readonly (Readonly<Record<string, string>>)[];
    readonly sequence?: Readonly<{
        readonly variable: string;
        readonly start: number;
        readonly step?: number;
        readonly padding?: number;
        readonly prefix?: string;
        readonly suffix?: string;
    }>;
}

/** Versioned, JSON-safe document model shared by web and future native UIs. */
export declare interface PrintDocument {
    readonly schema: typeof PRINT_DOCUMENT_SCHEMA;
    readonly version: typeof PRINT_DOCUMENT_VERSION;
    readonly page: {
        readonly widthDots: number;
        readonly heightDots: number;
        readonly margins: DocumentMargins;
        readonly media?: DocumentMedia;
        readonly frame?: PageFrame;
    };
    readonly nodes: readonly PrintNode[];
    readonly metadata?: Readonly<Record<string, string>>;
}

export declare const PRINTER_WIDTH: number;

export declare const PRINTER_WIDTH_BYTES: number;

export declare interface PrinterCapabilities {
    readonly status: boolean;
    readonly intensity: boolean;
    readonly raster: boolean;
    readonly cancellation: boolean;
    readonly maxPagesPerJob: number;
}

/** Stable, serializable error category for web and native clients. */
export declare class PrinterError extends Error {
    readonly code: PrinterErrorCode;
    readonly recoverable: boolean;
    readonly cause?: unknown;
    constructor(code: PrinterErrorCode, message: string, options?: PrinterErrorOptions);
}

export declare type PrinterErrorCode = "bluetooth-unavailable" | "not-connected" | "connection-failed" | "transport" | "protocol" | "printer-rejected" | "printer-fault" | "busy" | "timeout" | "cancelled" | "unknown";

export declare interface PrinterErrorOptions {
    readonly recoverable?: boolean;
    readonly cause?: unknown;
}

/**
 * Event types emitted by ThermalPrinterClient
 */
export declare type PrinterEvent = {
    type: "connected";
    device: BluetoothDevice_2;
} | {
    type: "disconnected";
} | {
    type: "stateChange";
    state: PrinterState;
} | {
    type: "printProgress";
    progress: number;
    phase?: PrintJobPhase;
    sentBytes?: number;
    totalBytes?: number;
} | {
    type: "error";
    error: Error;
};

export declare type PrinterEventListener<T extends PrinterEventType = PrinterEventType> = (event: Extract<PrinterEvent, {
    type: T;
}>) => void;

export declare type PrinterEventType = PrinterEvent["type"];

/**
 * Image data interface - compatible with both Canvas and Node.js
 * Renamed to avoid conflict with DOM ImageData
 */
export declare interface PrinterImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    /** Optional source stride; omitted means tightly packed RGBA rows. */
    strideBytes?: number;
}

/**
 * Hardware-specific facts used by the renderer and driver.
 *
 * Keep this separate from a Bluetooth adapter: the same profile can be used
 * by Web Bluetooth, Noble and CoreBluetooth transports.
 */
export declare interface PrinterProfile {
    readonly id: string;
    readonly protocolRevision: string;
    readonly widthDots: number;
    readonly bytesPerRow: number;
    readonly minimumRows: number;
    readonly bitOrder: BitOrder;
    readonly blackIsOne: boolean;
    readonly dataChunkSize: number;
    readonly dataChunkDelayMs: number;
    readonly dpi?: number;
    readonly mediaWidthMm?: number;
    readonly capabilities: PrinterCapabilities;
}

export declare interface PrinterState {
    printing: boolean;
    paper_jam: boolean;
    out_of_paper: boolean;
    cover_open: boolean;
    battery_low: boolean;
    overheat: boolean;
}

/**
 * Printer state interface
 */
declare interface PrinterState_2 {
    printing: boolean;
    paper_jam: boolean;
    out_of_paper: boolean;
    cover_open: boolean;
    battery_low: boolean;
    overheat: boolean;
}

/**
 * Encapsulates a print job with image processing and preparation
 */
export declare class PrintJob {
    private imageData;
    private options;
    private profile;
    constructor(imageData: PrinterImageData, options?: PrintOptions, profile?: PrinterProfile);
    /**
     * Process and prepare image for printing
     * @param defaultDither Default dithering method
     * @returns Prepared image buffer and metadata
     */
    prepare(defaultDither: ImageProcessorOptions_2["dither"]): {
        imageBuffer: Uint8Array;
        numLines: number;
        wireLines: number;
        raster: RasterPage;
    };
    /**
     * Get print intensity from options or default
     * @param defaultIntensity Default intensity value
     * @returns Print intensity
     */
    getIntensity(defaultIntensity: number): number;
}

export declare type PrintJobPhase = "queued" | "preparing" | "configuring" | "sending" | "printing" | "completed" | "failed" | "cancelled";

export declare interface PrintJobProgress {
    readonly phase: PrintJobPhase;
    readonly progress: number;
    readonly sentBytes: number;
    readonly totalBytes: number;
}

export declare type PrintNode = TextNode | ImageNode | RuleNode | BarcodeNode | QrCodeNode | ChecklistNode | FortuneNode | IconNode;

/**
 * Print options
 */
export declare interface PrintOptions extends Partial<ImageProcessorOptions> {
    intensity?: number;
}

export declare interface PrintTemplate {
    readonly schema: typeof PRINT_TEMPLATE_SCHEMA;
    readonly version: typeof PRINT_TEMPLATE_VERSION;
    readonly id: string;
    readonly name: string;
    readonly description?: string;
    readonly preferredMediaProfileId?: string;
    readonly variables?: Readonly<Record<string, TemplateVariable>>;
    readonly document: PrintDocument;
}

/**
 * Process an image for thermal printer
 * @param imageData Source image data
 * @param options Processing options
 * @returns Processed image data and binary rows for printing
 */
export declare function processImageForPrinter(imageData: PrinterImageData | RgbaImage, options: ImageProcessorOptions_2, targetWidth?: number): {
    processedData: Uint32Array;
    width: number;
    height: number;
    binaryRows: boolean[][];
};

/**
 * Protocol constants
 */
export declare const PROTOCOL: {
    readonly HEADER_BYTE_1: 34;
    readonly HEADER_BYTE_2: 33;
    readonly TERMINATOR: 255;
};

export declare interface QrCodeNode extends DocumentNodeFrame {
    readonly kind: "qr";
    readonly value: string;
    readonly errorCorrection?: "low" | "medium" | "quartile" | "high";
}

/**
 * A monochrome raster ready for a printer transport.
 *
 * `heightDots` and `contentHeightRows` describe the rendered content. The
 * wire buffer may contain additional rows, exposed explicitly through
 * `wireHeightRows`, because MXW01 devices currently require a minimum payload
 * size. This prevents protocol padding from being mistaken for document
 * content by another implementation.
 */
export declare interface RasterPage {
    readonly widthDots: number;
    readonly heightDots: number;
    readonly contentHeightRows: number;
    readonly wireHeightRows: number;
    readonly bytesPerRow: number;
    readonly bitOrder: BitOrder;
    readonly blackIsOne: boolean;
    readonly data: Uint8Array;
}

export declare interface RenderDiagnostic {
    readonly severity: "info" | "warning" | "error";
    readonly code: string;
    readonly message: string;
    readonly nodeId?: string;
}

/** Metadata that binds a rendered preview to a subsequent print request. */
export declare interface RenderPreflight {
    readonly canPrint: boolean;
    readonly documentFingerprint: string;
    readonly rendererVersion: string;
    readonly profileId: string;
    /** Optional explicit binding for clients that support media profiles. */
    readonly mediaProfileId?: string;
    readonly options?: {
        readonly dither?: DitherMethod;
        readonly brightness?: number;
    };
}

export declare function renderPrintDocument(document: PrintDocument, profile?: PrinterProfile, options?: DocumentRenderOptions): RenderResult;

export declare interface RenderRequest {
    readonly document: PrintDocument;
    readonly profileId: string;
    readonly rendererVersion: string;
    readonly options?: {
        readonly dither?: DitherMethod;
        readonly brightness?: number;
    };
}

export declare interface RenderResult {
    readonly pages: readonly RasterPage[];
    readonly diagnostics: readonly RenderDiagnostic[];
    readonly rendererVersion: string;
    readonly profileId: string;
    /** True only when the result is safe to send to the selected printer. */
    readonly canPrint: boolean;
    /** Stable identity of the semantic document used to produce this result. */
    readonly documentFingerprint: string;
}

export declare function requiredTextHeight(node: Pick<TextNode, "text" | "width" | "fontId" | "fontSizeDots" | "lineHeightDots">): number;

export declare function resolveTemplateDocument(document: PrintDocument, values?: Readonly<Record<string, string>>): PrintDocument;

/**
 * Convert explicit RGBA bytes to grayscale without relying on host endianness.
 * This is the cross-platform path used by the renderer boundary.
 */
export declare function rgbaBytesToGray(rgba: Uint8Array | Uint8ClampedArray, brightness?: number, alphaAsWhite?: boolean): Uint8ClampedArray;

/** A tightly packed row-major RGBA image. */
export declare interface RgbaImage {
    readonly width: number;
    readonly height: number;
    readonly strideBytes: number;
    readonly pixelFormat: PixelFormat;
    readonly alpha: AlphaMode;
    readonly data: Uint8Array;
}

export declare interface RuleNode extends DocumentNodeFrame {
    readonly kind: "rule";
    readonly thicknessDots?: number;
}

export declare function templateTokens(document: unknown): readonly string[];

/** Applies declared default values without inventing values for unresolved tokens. */
export declare function templateValues(template: Pick<PrintTemplate, "variables">, overrides?: Readonly<Record<string, string>>): Readonly<Record<string, string>>;

export declare interface TemplateVariable {
    readonly type: TemplateVariableType;
    readonly label?: string;
    readonly defaultValue?: string;
    readonly start?: number;
    readonly step?: number;
    readonly padding?: number;
    readonly prefix?: string;
    readonly suffix?: string;
}

export declare type TemplateVariableType = "text" | "sequence" | "date";

export declare type TextFontId = "mxw-vector" | "mxw-5x7" | "mxw-mono" | "mxw-condensed" | "mxw-wide" | "mxw-bold" | "mxw-proportional" | "mxw-serif" | "mxw-rounded";

export declare interface TextGlyphDefinition {
    /** Width before the inter-glyph spacing is added. The nominal height is 7. */
    readonly width: number;
    readonly strokes: readonly TextGlyphStroke[];
    readonly dots?: readonly TextGlyphPoint[];
}

/** A normalized point in the high-resolution text glyph coordinate system. */
export declare type TextGlyphPoint = readonly [number, number];

export declare type TextGlyphStroke = readonly TextGlyphPoint[];

export declare interface TextNode extends DocumentNodeFrame {
    readonly kind: "text";
    readonly text: string;
    /** Editors grow the node when text wraps by default; false keeps a fixed frame. */
    readonly autoHeight?: boolean;
    /** Stable bundled font identity shared by web and future native clients. */
    readonly fontId?: TextFontId;
    /** @deprecated Use fontId. Kept for backwards-compatible imports. */
    readonly fontFamily?: string;
    readonly fontSizeDots?: number;
    readonly fontWeight?: "normal" | "bold";
    readonly align?: "left" | "center" | "right";
    readonly lineHeightDots?: number;
}

/**
 * Platform-agnostic thermal printer client
 * Works with any BluetoothAdapter implementation (Web Bluetooth, Noble, etc.)
 */
export declare class ThermalPrinterClient {
    private adapter;
    private printer;
    private connection;
    private device;
    private eventEmitter;
    private state;
    private readonly profile;
    private connectPromise;
    private disconnectRequested;
    private connectionGeneration;
    private notificationListener;
    private connectionDisconnectUnsubscribe;
    private handlingUnexpectedDisconnect;
    private activePrintToken;
    private activePrintPromise;
    constructor(adapter: BluetoothAdapter, profile?: PrinterProfile);
    get printerProfile(): PrinterProfile;
    get connectedDevice(): BluetoothDevice_2 | null;
    get isConnected(): boolean;
    get isPrinting(): boolean;
    get printerState(): PrinterState | null;
    get statusVerified(): boolean;
    get isPrintReady(): boolean;
    get statusMessage(): string;
    get ditherMethod(): ImageProcessorOptions["dither"];
    get printIntensity(): number;
    setDitherMethod(method: ImageProcessorOptions["dither"]): void;
    setPrintIntensity(intensity: number): void;
    /**
     * Subscribe to events
     */
    on<T extends PrinterEventType>(eventType: T, listener: PrinterEventListener<T>): () => void;
    /**
     * Update status message and emit state change if needed
     */
    private updateStatus;
    /**
     * Connect to printer via Bluetooth
     */
    connect(): Promise<void>;
    private connectInternal;
    /**
     * Setup notification listener
     */
    private setupNotifications;
    private handleUnexpectedDisconnect;
    /**
     * Get current printer status
     */
    getStatus(allowConnecting?: boolean, timeoutMs?: number, emitError?: boolean): Promise<PrinterState | null>;
    private verifyInitialStatus;
    /** Refresh status and fail closed when the physical printer is not safe to use. */
    ensurePrintReady(timeoutMs?: number): Promise<PrinterState>;
    private emitPrintProgress;
    /**
     * Print from image data
     */
    print(imageData: PrinterImageData, options?: PrintOptions): Promise<void>;
    /**
     * Send a raster that has already been rendered for this printer profile.
     *
     * Document renderers can apply brightness and dithering before this method
     * is called. Keeping that raster intact is important: processing it again
     * would make the physical output differ from the preview and would apply
     * dithering twice.
     */
    printRaster(raster: RasterPage, options?: Pick<PrintOptions, "intensity">): Promise<void>;
    private printInternal;
    private validateRaster;
    private printRasterInternal;
    private assertConnectionSession;
    private assertActiveSession;
    /**
     * Disconnect from printer
     */
    disconnect(): Promise<void>;
    private cleanupConnection;
    /**
     * Dispose of the client and clean up resources
     */
    dispose(): Promise<void>;
}

export declare type TransportEndpoint = "control" | "data";

/** Expand a packed raster into booleans for test vectors and diagnostics. */
export declare function unpackMonoRaster(raster: RasterPage, includePaddingRows?: boolean): boolean[][];

export declare function validatePrintBatchJob(value: unknown): RenderDiagnostic[];

/** Runtime validation for documents crossing a storage or native boundary. */
export declare function validatePrintDocument(document: unknown): RenderDiagnostic[];

export declare function validatePrintTemplate(value: unknown): RenderDiagnostic[];

/** Public, stable vector glyph table shared by platform renderers. */
export declare const VECTOR_TEXT_GLYPHS: Readonly<Record<string, TextGlyphDefinition>>;

/**
 * Web Bluetooth adapter for browser environments
 * Uses the Web Bluetooth API to connect to Bluetooth devices
 */
export declare class WebBluetoothAdapter implements BluetoothAdapter {
    private device;
    private server;
    /**
     * Check if Web Bluetooth is available
     */
    isAvailable(): boolean;
    /**
     * Request a Bluetooth device with printer services
     */
    requestDevice(): Promise<BluetoothDevice_2>;
    /**
     * Connect to a Bluetooth device and get service characteristics
     */
    connect(device: BluetoothDevice_2): Promise<BluetoothConnection & BluetoothServiceInfo>;
}

export declare type WriteFunction = ByteWriteFunction;

export { }
