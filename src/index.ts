// Main entry point for mxw01-thermal-printer library
// Platform-agnostic core library

// ============================================================================
// CORE (Platform-agnostic client)
// ============================================================================
export { ThermalPrinterClient } from "./core/ThermalPrinterClient";
export { PrintJob } from "./core/PrintJob";
export type {
  BluetoothAdapter,
  BluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
  BluetoothCharacteristic,
  BluetoothNotificationEvent,
  PrinterState,
  PrinterEvent,
  PrinterEventType,
  PrinterEventListener,
  PrinterImageData,
  PrintOptions,
  DitherMethod,
  ImageProcessorOptions,
  AlphaMode,
  BitOrder,
  ByteTransport,
  PrintJobPhase,
  PrintJobProgress,
  PrinterCapabilities,
  PrinterProfile,
  PixelFormat,
  RasterPage,
  RgbaImage,
  TransportEndpoint,
} from "./core/types";
export {
  PrinterError,
  asPrinterError,
} from "./core/errors";
export type {
  PrinterErrorCode,
  PrinterErrorOptions,
} from "./core/errors";
export {
  PRINT_DOCUMENT_SCHEMA,
  PRINT_DOCUMENT_VERSION,
  fingerprintPrintDocument,
  validatePrintDocument,
} from "./core/document";
export {
  DEFAULT_LAYOUT_BOTTOM_PADDING,
  MAX_LAYOUT_PAGE_HEIGHT,
  layoutPrintDocument,
  requiredTextHeight,
} from "./core/documentLayout";
export type {
  BarcodeNode,
  ChecklistItem,
  ChecklistNode,
  DocumentMargins,
  DocumentMedia,
  DocumentNodeFrame,
  FrameStyle,
  FortuneNode,
  ImageNode,
  IconId,
  IconNode,
  MediaColor,
  MediaKind,
  PageFrame,
  PrintDocument,
  PrintNode,
  QrCodeNode,
  RenderDiagnostic,
  RenderPreflight,
  RenderRequest,
  RenderResult,
  RuleNode,
  TextNode,
  TextFontId,
} from "./core/document";
export { FONT_AWESOME_ICON_PATHS } from "./core/iconShapes";
export type { FontAwesomeIconPath } from "./core/iconShapes";
export { VECTOR_TEXT_GLYPHS } from "./core/textGlyphs";
export type { TextGlyphDefinition, TextGlyphPoint, TextGlyphStroke } from "./core/textGlyphs";
export { MXW01_PRINTER_PROFILE } from "./core/printerProfiles";
export {
  MXW01_MEDIA_PROFILES,
  findMediaProfile,
  mediaProfileToDocumentMedia,
} from "./core/mediaProfiles";
export type { LabelMediaProfile } from "./core/mediaProfiles";
export {
  PRINT_BATCH_SCHEMA,
  PRINT_BATCH_VERSION,
  PRINT_TEMPLATE_SCHEMA,
  PRINT_TEMPLATE_VERSION,
  batchValues,
  formatSequenceValue,
  makeFortuneNode,
  resolveTemplateDocument,
  templateTokens,
  templateValues,
  validatePrintBatchJob,
  validatePrintTemplate,
} from "./core/templates";
export type {
  PrintBatchJob,
  PrintTemplate,
  TemplateVariable,
  TemplateVariableType,
} from "./core/templates";

// ============================================================================
// ADAPTERS
// ============================================================================
export { WebBluetoothAdapter } from "./adapters/WebBluetoothAdapter";
export { NodeBluetoothAdapter } from "./adapters/NodeBluetoothAdapter";

// ============================================================================
// SERVICES (Existing exports - backward compatible)
// ============================================================================
export {
  MXW01Printer,
  PRINTER_WIDTH,
  PRINTER_WIDTH_BYTES,
  MIN_DATA_BYTES,
  Command,
  encode1bppRow,
  prepareImageDataBuffer,
} from "./services/printer";
export type { WriteFunction } from "./services/printer";
export { CallbackByteTransport } from "./services/transport";
export type { ByteWriteFunction } from "./services/transport";
export { packMonoRaster, unpackMonoRaster } from "./services/raster";

export { processImageForPrinter } from "./services/imageProcessor";
export { rgbaBytesToGray } from "./services/imageTransforms";
export {
  DOCUMENT_RENDERER_VERSION,
  renderPrintDocument,
} from "./services/documentRenderer";
export type { DocumentRenderOptions } from "./services/documentRenderer";
export {
  FrameDecoder,
  makeCommand,
  parseFrame,
  parseNotification,
  PROTOCOL,
} from "./services/protocol";
export type {
  ParsedFrame,
  ParseFrameOptions,
} from "./services/protocol";
