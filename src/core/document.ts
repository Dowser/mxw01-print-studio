import type { RasterPage } from "./print-types";
import type { DitherMethod } from "./types";
import { findMediaProfile } from "./mediaProfiles";

export const PRINT_DOCUMENT_SCHEMA = "mxw01.print-document" as const;
export const PRINT_DOCUMENT_VERSION = 1 as const;

export interface DocumentMargins {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export type MediaKind = "continuous" | "die-cut" | "black-mark";
export type MediaColor =
  | "white"
  | "yellow"
  | "blue"
  | "pink"
  | "green"
  | "orange"
  | "red"
  | "transparent";

/** Physical media hints. Rendering remains monochrome; color is preview metadata. */
export interface DocumentMedia {
  readonly kind: MediaKind;
  readonly color: MediaColor;
  readonly labelHeightDots?: number;
  readonly gapDots?: number;
  readonly profileId?: string;
}

export type FrameStyle = "solid" | "double" | "dashed" | "dotted" | "rounded";

export interface PageFrame {
  readonly insetDots: number;
  readonly thicknessDots: number;
  readonly style?: FrameStyle;
}

export type TextFontId =
  | "mxw-vector"
  | "mxw-5x7"
  | "mxw-mono"
  | "mxw-condensed"
  | "mxw-wide"
  | "mxw-bold"
  | "mxw-proportional"
  | "mxw-serif"
  | "mxw-rounded";

export type IconId =
  | "fa-star"
  | "fa-heart"
  | "fa-check"
  | "fa-xmark"
  | "fa-print"
  | "fa-camera"
  | "fa-image"
  | "fa-ticket"
  | "fa-tag"
  | "fa-circle-info"
  | "fa-triangle-exclamation"
  | "fa-bell"
  | "fa-user"
  | "fa-calendar-check"
  | "fa-barcode"
  | "fa-qrcode";

export interface DocumentNodeFrame {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation?: 0 | 90 | 180 | 270;
}

export interface TextNode extends DocumentNodeFrame {
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

export interface ImageNode extends DocumentNodeFrame {
  readonly kind: "image";
  /** Base64-encoded RGBA8888 data keeps the document JSON/Codable-friendly. */
  readonly image: {
    readonly width: number;
    readonly height: number;
    readonly dataBase64: string;
  };
}

export interface RuleNode extends DocumentNodeFrame {
  readonly kind: "rule";
  readonly thicknessDots?: number;
}

export interface BarcodeNode extends DocumentNodeFrame {
  readonly kind: "barcode";
  readonly format: "code128" | "ean13" | "upca";
  readonly value: string;
  readonly showText?: boolean;
}

export interface QrCodeNode extends DocumentNodeFrame {
  readonly kind: "qr";
  readonly value: string;
  readonly errorCorrection?: "low" | "medium" | "quartile" | "high";
}

export interface ChecklistItem {
  readonly text: string;
  readonly checked?: boolean;
}

export interface ChecklistNode extends DocumentNodeFrame {
  readonly kind: "checklist";
  readonly items: readonly ChecklistItem[];
  /** Editors grow checklist rows and the containing node when enabled; false keeps a fixed frame. */
  readonly autoHeight?: boolean;
  readonly itemHeightDots?: number;
  readonly fontId?: TextFontId;
  readonly fontSizeDots?: number;
}

export interface FortuneNode extends DocumentNodeFrame {
  readonly kind: "fortune";
  readonly text: string;
  readonly autoHeight?: boolean;
  readonly fontId?: TextFontId;
  readonly fontSizeDots?: number;
  readonly align?: "left" | "center" | "right";
}

export interface IconNode extends DocumentNodeFrame {
  readonly kind: "icon";
  /** A stable Font Awesome free-solid icon identity shared by web and native clients. */
  readonly iconId: IconId;
}

export type PrintNode =
  | TextNode
  | ImageNode
  | RuleNode
  | BarcodeNode
  | QrCodeNode
  | ChecklistNode
  | FortuneNode
  | IconNode;

/** Versioned, JSON-safe document model shared by web and future native UIs. */
export interface PrintDocument {
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

export interface RenderRequest {
  readonly document: PrintDocument;
  readonly profileId: string;
  readonly rendererVersion: string;
  readonly options?: {
    readonly dither?: DitherMethod;
    readonly brightness?: number;
  };
}

export interface RenderDiagnostic {
  readonly severity: "info" | "warning" | "error";
  readonly code: string;
  readonly message: string;
  readonly nodeId?: string;
}

/** Metadata that binds a rendered preview to a subsequent print request. */
export interface RenderPreflight {
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

export interface RenderResult {
  readonly pages: readonly RasterPage[];
  readonly diagnostics: readonly RenderDiagnostic[];
  readonly rendererVersion: string;
  readonly profileId: string;
  /** True only when the result is safe to send to the selected printer. */
  readonly canPrint: boolean;
  /** Stable identity of the semantic document used to produce this result. */
  readonly documentFingerprint: string;
}

const MAX_PAGE_DIMENSION = 4096;
const MAX_PAGE_PIXELS = 2_000_000;
const MAX_NODE_COUNT = 256;
const MAX_NODE_ID_LENGTH = 128;
const MAX_TEXT_LENGTH = 2048;
const MAX_IMAGE_PIXELS = 1_000_000;
const MAX_IMAGE_BYTES = MAX_IMAGE_PIXELS * 4;
const MAX_METADATA_ENTRIES = 32;
const MAX_METADATA_VALUE_LENGTH = 256;
const MAX_CHECKLIST_ITEMS = 64;
const MAX_CHECKLIST_ITEM_LENGTH = 256;
const MEDIA_COLORS: readonly MediaColor[] = [
  "white",
  "yellow",
  "blue",
  "pink",
  "green",
  "orange",
  "red",
  "transparent",
];
const FONT_IDS: readonly TextFontId[] = [
  "mxw-vector",
  "mxw-5x7",
  "mxw-mono",
  "mxw-condensed",
  "mxw-wide",
  "mxw-bold",
  "mxw-proportional",
  "mxw-serif",
  "mxw-rounded",
];
const FRAME_STYLES: readonly FrameStyle[] = ["solid", "double", "dashed", "dotted", "rounded"];
const ICON_IDS: readonly IconId[] = [
  "fa-star",
  "fa-heart",
  "fa-check",
  "fa-xmark",
  "fa-print",
  "fa-camera",
  "fa-image",
  "fa-ticket",
  "fa-tag",
  "fa-circle-info",
  "fa-triangle-exclamation",
  "fa-bell",
  "fa-user",
  "fa-calendar-check",
  "fa-barcode",
  "fa-qrcode",
];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function base64ByteLength(value: string): number | null {
  if (value.length === 0 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    return null;
  }
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.floor(value.length * 3 / 4) - padding;
}

function eanChecksum(firstTwelveDigits: string): number {
  let sum = 0;
  for (let index = 0; index < firstTwelveDigits.length; index += 1) {
    const digit = Number(firstTwelveDigits[index]);
    sum += index % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

function isValidEan13(value: string): boolean {
  if (!/^\d{12,13}$/.test(value)) {
    return false;
  }
  const body = value.slice(0, 12);
  return value.length === 12 || Number(value[12]) === eanChecksum(body);
}

function isValidUpca(value: string): boolean {
  if (!/^\d{11,12}$/.test(value)) {
    return false;
  }
  const body = value.slice(0, 11);
  return value.length === 11 || Number(value[11]) === eanChecksum(`0${body}`);
}

function pushDiagnostic(
  diagnostics: RenderDiagnostic[],
  severity: RenderDiagnostic["severity"],
  code: string,
  message: string,
  nodeId?: string
): void {
  diagnostics.push({ severity, code, message, ...(nodeId ? { nodeId } : {}) });
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, canonicalize(value[key])])
    );
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Fingerprint input must contain only finite numbers.");
    return Object.is(value, -0) ? 0 : value;
  }
  return value;
}

/**
 * Produce a small stable fingerprint for a JSON-safe document.
 *
 * This intentionally uses a platform-neutral FNV-1a hash over canonical UTF-8
 * JSON so a future Swift implementation can reproduce it without depending on
 * a JavaScript runtime or a cryptography library.
 */
export function fingerprintPrintDocument(value: unknown): string {
  const serialized = JSON.stringify(canonicalize(value));
  const bytes = new TextEncoder().encode(serialized);
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/** Runtime validation for documents crossing a storage or native boundary. */
export function validatePrintDocument(
  document: unknown
): RenderDiagnostic[] {
  const diagnostics: RenderDiagnostic[] = [];
  if (!isRecord(document)) {
    return [
      {
        severity: "error",
        code: "document.type",
        message: "Document must be an object.",
      },
    ];
  }

  const candidate = document as Partial<PrintDocument> & UnknownRecord;

  if (candidate.schema !== PRINT_DOCUMENT_SCHEMA) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.schema",
      `Unsupported document schema: ${String(candidate.schema)}`
    );
  }

  if (candidate.version !== PRINT_DOCUMENT_VERSION) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.version",
      `Unsupported document version: ${String(candidate.version)}`
    );
  }

  const page = candidate.page;
  if (
    !isRecord(page) ||
    !isFiniteInteger(page.widthDots) ||
    !isFiniteInteger(page.heightDots) ||
    page.widthDots <= 0 ||
    page.heightDots <= 0 ||
    page.widthDots > MAX_PAGE_DIMENSION ||
    page.heightDots > MAX_PAGE_DIMENSION ||
    page.widthDots * page.heightDots > MAX_PAGE_PIXELS
  ) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.page-size",
      `Page dimensions must be positive finite integers no larger than ${MAX_PAGE_DIMENSION} dots.`
    );
  }

  const margins = isRecord(page) ? page.margins : undefined;
  const pageDimensionsAreValid =
    isRecord(page) &&
    isFiniteInteger(page.widthDots) &&
    isFiniteInteger(page.heightDots) &&
    page.widthDots > 0 &&
    page.heightDots > 0;
  if (
    !isRecord(margins) ||
    !("top" in margins) ||
    !("right" in margins) ||
    !("bottom" in margins) ||
    !("left" in margins) ||
    !isFiniteInteger(margins.top) ||
    !isFiniteInteger(margins.right) ||
    !isFiniteInteger(margins.bottom) ||
    !isFiniteInteger(margins.left) ||
    margins.top < 0 ||
    margins.right < 0 ||
    margins.bottom < 0 ||
    margins.left < 0 ||
    (pageDimensionsAreValid && margins.left + margins.right >= page.widthDots) ||
    (pageDimensionsAreValid && margins.top + margins.bottom >= page.heightDots)
  ) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.page-margins",
      "Page margins must be non-negative finite integers inside the page."
    );
  }

  const media = isRecord(page) ? page.media : undefined;
  if (media !== undefined) {
    if (!isRecord(media)) {
      pushDiagnostic(diagnostics, "error", "document.media", "Document media must be an object.");
    } else {
      validateMedia(
        media,
        diagnostics,
        pageDimensionsAreValid ? { widthDots: page.widthDots, heightDots: page.heightDots } : undefined
      );
    }
  }

  const frame = isRecord(page) ? page.frame : undefined;
  if (frame !== undefined) {
    if (!isRecord(frame)) {
      pushDiagnostic(diagnostics, "error", "document.frame", "Document frame must be an object.");
    } else {
      validatePageFrame(
        frame,
        diagnostics,
        pageDimensionsAreValid ? { widthDots: page.widthDots, heightDots: page.heightDots } : undefined
      );
    }
  }

  if (isRecord(candidate.metadata)) {
    const entries = Object.entries(candidate.metadata);
    if (entries.length > MAX_METADATA_ENTRIES) {
      pushDiagnostic(
        diagnostics,
        "error",
        "document.metadata",
        `Document metadata may contain at most ${MAX_METADATA_ENTRIES} entries.`
      );
    }
    for (const [key, value] of entries) {
      if (
        key.length > MAX_METADATA_VALUE_LENGTH ||
        typeof value !== "string" ||
        value.length > MAX_METADATA_VALUE_LENGTH
      ) {
        pushDiagnostic(
          diagnostics,
          "error",
          "document.metadata",
          `Metadata keys and values must be strings no longer than ${MAX_METADATA_VALUE_LENGTH} characters.`
        );
        break;
      }
    }
  } else if (candidate.metadata !== undefined) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.metadata",
      "Document metadata must be a string map."
    );
  }

  if (!Array.isArray(candidate.nodes)) {
    pushDiagnostic(diagnostics, "error", "document.nodes", "Document nodes must be an array.");
    return diagnostics;
  }
  if (candidate.nodes.length > MAX_NODE_COUNT) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.node-count",
      `A document may contain at most ${MAX_NODE_COUNT} nodes.`
    );
  }

  const nodeIds = new Set<string>();
  const pageIsValid =
    isRecord(page) &&
    isFiniteInteger(page.widthDots) &&
    isFiniteInteger(page.heightDots) &&
    page.widthDots > 0 &&
    page.heightDots > 0;
  const contentBox =
    pageIsValid && isRecord(margins) &&
    isFiniteInteger(margins.top) && isFiniteInteger(margins.right) &&
    isFiniteInteger(margins.bottom) && isFiniteInteger(margins.left)
      ? {
          left: margins.left,
          top: margins.top,
          right: page.widthDots - margins.right,
          bottom: page.heightDots - margins.bottom,
        }
      : null;

  for (const node of candidate.nodes) {
    if (!isRecord(node)) {
      pushDiagnostic(
        diagnostics,
        "error",
        "document.node-size",
        "A document node has an invalid dimension or id."
      );
      continue;
    }

    const nodeId = typeof node.id === "string" ? node.id : undefined;
    if (
      !nodeId ||
      nodeId.length > MAX_NODE_ID_LENGTH ||
      !isFiniteInteger(node.x) ||
      !isFiniteInteger(node.y) ||
      !isFiniteInteger(node.width) ||
      !isFiniteInteger(node.height) ||
      node.width <= 0 ||
      node.height <= 0 ||
      node.width > MAX_PAGE_DIMENSION ||
      node.height > MAX_PAGE_DIMENSION ||
      node.width * node.height > MAX_PAGE_PIXELS
    ) {
      pushDiagnostic(
        diagnostics,
        "error",
        "document.node-size",
        `A document node must have a non-empty id and positive finite integer dimensions no larger than ${MAX_PAGE_DIMENSION} dots.`,
        nodeId
      );
      continue;
    }

    if (nodeIds.has(nodeId)) {
      pushDiagnostic(
        diagnostics,
        "error",
        "document.duplicate-node-id",
        `Node id "${nodeId}" is used more than once.`,
        nodeId
      );
    }
    nodeIds.add(nodeId);

    if (node.rotation !== undefined && ![0, 90, 180, 270].includes(node.rotation as number)) {
      pushDiagnostic(
        diagnostics,
        "error",
        "document.rotation",
        "Node rotation must be 0, 90, 180 or 270 degrees.",
        nodeId
      );
    }

    if (pageIsValid && (node.x < 0 || node.y < 0 || node.x + node.width > page.widthDots || node.y + node.height > page.heightDots)) {
      pushDiagnostic(
        diagnostics,
        "error",
        "document.node-out-of-bounds",
        "Node extends beyond the printable page.",
        nodeId
      );
    }
    if (contentBox && (node.x < contentBox.left || node.y < contentBox.top || node.x + node.width > contentBox.right || node.y + node.height > contentBox.bottom)) {
      pushDiagnostic(
        diagnostics,
        "warning",
        "document.node-outside-margins",
        "Node extends into the configured page margins.",
        nodeId
      );
    }

    switch (node.kind) {
      case "text":
        validateTextNode(node, diagnostics, nodeId);
        break;
      case "image":
        validateImageNode(node, diagnostics, nodeId);
        break;
      case "rule":
        validateRuleNode(node, diagnostics, nodeId);
        break;
      case "barcode":
        validateBarcodeNode(node, diagnostics, nodeId);
        break;
      case "qr":
        validateQrNode(node, diagnostics, nodeId);
        break;
      case "checklist":
        validateChecklistNode(node, diagnostics, nodeId);
        break;
      case "fortune":
        validateFortuneNode(node, diagnostics, nodeId);
        break;
      case "icon":
        validateIconNode(node, diagnostics, nodeId);
        break;
      default:
        pushDiagnostic(
          diagnostics,
          "error",
          "document.node-kind",
          `Unsupported node kind: ${String(node.kind)}`,
          nodeId
        );
    }
  }

  return diagnostics;
}

function validateTextNode(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  nodeId: string
): void {
  if (typeof node.text !== "string" || node.text.length > MAX_TEXT_LENGTH) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.text",
      `Text must be a string no longer than ${MAX_TEXT_LENGTH} characters.`,
      nodeId
    );
  } else if (node.text.length === 0) {
    pushDiagnostic(diagnostics, "warning", "document.text-empty", "Text node is empty.", nodeId);
  }
  if (node.autoHeight !== undefined && typeof node.autoHeight !== "boolean") {
    pushDiagnostic(diagnostics, "error", "document.text-auto-height", "autoHeight must be boolean.", nodeId);
  }
  if (node.fontFamily !== undefined && typeof node.fontFamily !== "string") {
    pushDiagnostic(diagnostics, "error", "document.text-font", "fontFamily must be a string.", nodeId);
  } else if (typeof node.fontFamily === "string" && node.fontFamily.length > 64) {
    pushDiagnostic(diagnostics, "error", "document.text-font", "fontFamily is too long.", nodeId);
  } else if (node.fontFamily) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "document.font-family-ignored",
      "The deterministic renderer uses its built-in 5x7 font; fontFamily is ignored.",
      nodeId
    );
  }
  if (node.fontId !== undefined && !FONT_IDS.includes(node.fontId as TextFontId)) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.text-font-id",
      `Unsupported fontId: ${String(node.fontId)}.`,
      nodeId
    );
  }
  if (node.fontSizeDots !== undefined && (!isFiniteInteger(node.fontSizeDots) || node.fontSizeDots < 1 || node.fontSizeDots > 16)) {
    pushDiagnostic(diagnostics, "error", "document.text-font-size", "fontSizeDots must be an integer from 1 to 16.", nodeId);
  }
  if (node.lineHeightDots !== undefined && (!isFiniteInteger(node.lineHeightDots) || node.lineHeightDots < 1 || node.lineHeightDots > 128)) {
    pushDiagnostic(diagnostics, "error", "document.text-line-height", "lineHeightDots must be an integer from 1 to 128.", nodeId);
  }
  if (node.fontWeight !== undefined && node.fontWeight !== "normal" && node.fontWeight !== "bold") {
    pushDiagnostic(diagnostics, "error", "document.text-font-weight", "fontWeight must be normal or bold.", nodeId);
  }
  if (node.align !== undefined && node.align !== "left" && node.align !== "center" && node.align !== "right") {
    pushDiagnostic(diagnostics, "error", "document.text-align", "align must be left, center or right.", nodeId);
  }
}

function validateImageNode(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  nodeId: string
): void {
  if (!isRecord(node.image)) {
    pushDiagnostic(diagnostics, "error", "document.image", "Image data must be an object.", nodeId);
    return;
  }
  const image = node.image;
  if (!isFiniteInteger(image.width) || !isFiniteInteger(image.height) || image.width <= 0 || image.height <= 0 || image.width * image.height > MAX_IMAGE_PIXELS) {
    pushDiagnostic(diagnostics, "error", "document.image-size", `Image dimensions must be positive integers within ${MAX_IMAGE_PIXELS} pixels.`, nodeId);
  }
  if (typeof image.dataBase64 !== "string") {
    pushDiagnostic(diagnostics, "error", "document.image-data", "Image dataBase64 must be a base64 string.", nodeId);
    return;
  }
  const byteLength = base64ByteLength(image.dataBase64);
  if (byteLength === null || byteLength > MAX_IMAGE_BYTES) {
    pushDiagnostic(diagnostics, "error", "document.image-data", "Image dataBase64 is invalid or too large.", nodeId);
  } else if (isFiniteInteger(image.width) && isFiniteInteger(image.height) && byteLength !== image.width * image.height * 4) {
    pushDiagnostic(diagnostics, "error", "document.image-data", `RGBA image data must contain ${image.width * image.height * 4} bytes, got ${byteLength}.`, nodeId);
  }
}

function validateRuleNode(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  nodeId: string
): void {
  if (node.thicknessDots !== undefined && (!isFiniteInteger(node.thicknessDots) || node.thicknessDots < 1 || node.thicknessDots > 64)) {
    pushDiagnostic(diagnostics, "error", "document.rule-thickness", "thicknessDots must be an integer from 1 to 64.", nodeId);
  }
}

function validateBarcodeNode(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  nodeId: string
): void {
  if (node.format !== "code128" && node.format !== "ean13" && node.format !== "upca") {
    pushDiagnostic(diagnostics, "error", "document.barcode-format", "Unsupported barcode format.", nodeId);
  }
  if (typeof node.value !== "string" || node.value.length === 0 || node.value.length > 256) {
    pushDiagnostic(diagnostics, "error", "document.barcode-value", "Barcode value must be a non-empty string no longer than 256 characters.", nodeId);
  } else if (node.format === "code128" && [...node.value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) > 126)) {
    pushDiagnostic(diagnostics, "error", "document.barcode-value", "Code 128 supports printable ASCII only.", nodeId);
  } else if (node.format === "ean13" && !isValidEan13(node.value)) {
    pushDiagnostic(diagnostics, "error", "document.barcode-value", "EAN-13 must contain 12 digits or 13 digits with a valid checksum.", nodeId);
  } else if (node.format === "upca" && !isValidUpca(node.value)) {
    pushDiagnostic(diagnostics, "error", "document.barcode-value", "UPC-A must contain 11 digits or 12 digits with a valid checksum.", nodeId);
  }
  if (node.showText !== undefined && typeof node.showText !== "boolean") {
    pushDiagnostic(diagnostics, "error", "document.barcode-show-text", "showText must be boolean.", nodeId);
  }
}

function validateQrNode(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  nodeId: string
): void {
  if (typeof node.value !== "string" || node.value.length === 0) {
    pushDiagnostic(diagnostics, "error", "document.qr-value", "QR value must be a non-empty string.", nodeId);
  } else if (new TextEncoder().encode(node.value).length > 17) {
    pushDiagnostic(diagnostics, "error", "document.qr-value", "QR renderer v1 supports at most 17 UTF-8 bytes.", nodeId);
  }
  if (node.errorCorrection !== undefined && node.errorCorrection !== "low") {
    pushDiagnostic(diagnostics, "error", "document.qr-error-correction", "QR renderer v1 supports low error correction only.", nodeId);
  }
}

function validateMedia(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  page?: { readonly widthDots: number; readonly heightDots: number }
): void {
  if (node.kind !== "continuous" && node.kind !== "die-cut" && node.kind !== "black-mark") {
    pushDiagnostic(diagnostics, "error", "document.media-kind", "Unsupported media kind.");
  }
  if (!MEDIA_COLORS.includes(node.color as MediaColor)) {
    pushDiagnostic(diagnostics, "error", "document.media-color", "Unsupported media color.");
  }
  for (const key of ["labelHeightDots", "gapDots"] as const) {
    if (node[key] !== undefined && (!isFiniteInteger(node[key]) || node[key] < 0 || node[key] > MAX_PAGE_DIMENSION)) {
      pushDiagnostic(diagnostics, "error", "document.media-dimensions", `${key} must be a non-negative integer within the page limits.`);
    }
  }
  if (node.kind === "die-cut" && typeof node.labelHeightDots === "number" && node.labelHeightDots <= 0) {
    pushDiagnostic(diagnostics, "error", "document.media-dimensions", "Die-cut media must have a positive label height.");
  }
  if (
    page &&
    isFiniteInteger(node.labelHeightDots) &&
    node.labelHeightDots !== page.heightDots
  ) {
    pushDiagnostic(diagnostics, "error", "document.media-height-mismatch", "Media labelHeightDots must match page heightDots.");
  }
  if (node.kind === "black-mark") {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.media-black-mark-unsupported",
      "Black-mark media requires a calibrated mark sensor and is not supported by the current MXW01 transport."
    );
  }
  if (node.kind === "die-cut" && node.profileId === undefined) {
    pushDiagnostic(diagnostics, "error", "document.media-profile-required", "Die-cut media must select a known media profile before printing.");
  }
  if (node.kind === "die-cut" && isFiniteInteger(node.gapDots) && node.gapDots > 0) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.media-gap-unsupported",
      "Die-cut media gaps are metadata only until a calibrated feed operation is implemented; physical printing is blocked."
    );
  }
  if (node.profileId !== undefined && (typeof node.profileId !== "string" || node.profileId.length > 128)) {
    pushDiagnostic(diagnostics, "error", "document.media-profile", "Media profile id must be a short string.");
  }
  if (typeof node.profileId === "string") {
    const profile = findMediaProfile(node.profileId);
    if (!profile) {
      pushDiagnostic(diagnostics, "error", "document.media-profile-unknown", `Unknown media profile id: ${node.profileId}.`);
    } else {
      if (profile.kind !== node.kind || profile.color !== node.color) {
        pushDiagnostic(diagnostics, "error", "document.media-profile-mismatch", "Media profile kind and color do not match the document media.");
      }
      if (page && profile.widthDots !== page.widthDots) {
        pushDiagnostic(diagnostics, "error", "document.media-profile-width", "Media profile width does not match page width.");
      }
      if (profile.kind !== "continuous" && page && profile.heightDots !== page.heightDots) {
        pushDiagnostic(diagnostics, "error", "document.media-profile-height", "Media profile height does not match page height.");
      }
      if (isFiniteInteger(node.gapDots) && profile.kind !== "continuous" && node.gapDots !== profile.gapDots) {
        pushDiagnostic(diagnostics, "error", "document.media-profile-gap", "Media profile gap does not match the selected profile.");
      }
    }
  }
}

function validatePageFrame(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  page?: { readonly widthDots: number; readonly heightDots: number }
): void {
  if (!isFiniteInteger(node.insetDots) || node.insetDots < 0 || node.insetDots > MAX_PAGE_DIMENSION) {
    pushDiagnostic(diagnostics, "error", "document.frame-inset", "Frame inset must be a non-negative integer.");
  }
  if (!isFiniteInteger(node.thicknessDots) || node.thicknessDots < 1 || node.thicknessDots > 64) {
    pushDiagnostic(diagnostics, "error", "document.frame-thickness", "Frame thickness must be an integer from 1 to 64.");
  }
  if (node.style !== undefined && (typeof node.style !== "string" || !FRAME_STYLES.includes(node.style as FrameStyle))) {
    pushDiagnostic(diagnostics, "error", "document.frame-style", `Unsupported frame style: ${String(node.style)}.`);
  }
  if (
    page &&
    isFiniteInteger(node.insetDots) &&
    isFiniteInteger(node.thicknessDots) &&
    2 * (node.insetDots + node.thicknessDots) >= Math.min(page.widthDots, page.heightDots)
  ) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.frame-out-of-bounds",
      "Frame inset and thickness must leave at least one printable dot inside the frame."
    );
  }
}

function validateChecklistNode(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  nodeId: string
): void {
  if (!Array.isArray(node.items) || node.items.length === 0 || node.items.length > MAX_CHECKLIST_ITEMS) {
    pushDiagnostic(diagnostics, "error", "document.checklist-items", `Checklist must contain 1–${MAX_CHECKLIST_ITEMS} items.`, nodeId);
    return;
  }
  for (const item of node.items) {
    if (!isRecord(item) || typeof item.text !== "string" || item.text.length > MAX_CHECKLIST_ITEM_LENGTH) {
      pushDiagnostic(diagnostics, "error", "document.checklist-item", "Checklist item text is invalid or too long.", nodeId);
      break;
    }
    if (item.checked !== undefined && typeof item.checked !== "boolean") {
      pushDiagnostic(diagnostics, "error", "document.checklist-item", "Checklist item checked must be boolean.", nodeId);
      break;
    }
  }
  if (node.autoHeight !== undefined && typeof node.autoHeight !== "boolean") {
    pushDiagnostic(diagnostics, "error", "document.checklist-auto-height", "autoHeight must be boolean.", nodeId);
  }
  if (node.itemHeightDots !== undefined && (!isFiniteInteger(node.itemHeightDots) || node.itemHeightDots < 8 || node.itemHeightDots > 128)) {
    pushDiagnostic(diagnostics, "error", "document.checklist-height", "Checklist item height must be an integer from 8 to 128.", nodeId);
  }
  if (node.fontId !== undefined && !FONT_IDS.includes(node.fontId as TextFontId)) {
    pushDiagnostic(diagnostics, "error", "document.checklist-font-id", `Unsupported fontId: ${String(node.fontId)}.`, nodeId);
  }
  if (node.fontSizeDots !== undefined && (!isFiniteInteger(node.fontSizeDots) || node.fontSizeDots < 1 || node.fontSizeDots > 16)) {
    pushDiagnostic(diagnostics, "error", "document.checklist-font-size", "fontSizeDots must be an integer from 1 to 16.", nodeId);
  }
}

function validateFortuneNode(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  nodeId: string
): void {
  if (typeof node.text !== "string" || node.text.length === 0 || node.text.length > MAX_TEXT_LENGTH) {
    pushDiagnostic(diagnostics, "error", "document.fortune-text", `Fortune text must be 1–${MAX_TEXT_LENGTH} characters.`, nodeId);
  }
  if (node.autoHeight !== undefined && typeof node.autoHeight !== "boolean") {
    pushDiagnostic(diagnostics, "error", "document.fortune-auto-height", "autoHeight must be boolean.", nodeId);
  }
  if (node.fontId !== undefined && !FONT_IDS.includes(node.fontId as TextFontId)) {
    pushDiagnostic(diagnostics, "error", "document.fortune-font-id", `Unsupported fontId: ${String(node.fontId)}.`, nodeId);
  }
  if (node.fontSizeDots !== undefined && (!isFiniteInteger(node.fontSizeDots) || node.fontSizeDots < 1 || node.fontSizeDots > 16)) {
    pushDiagnostic(diagnostics, "error", "document.fortune-font-size", "fontSizeDots must be an integer from 1 to 16.", nodeId);
  }
  if (node.align !== undefined && node.align !== "left" && node.align !== "center" && node.align !== "right") {
    pushDiagnostic(diagnostics, "error", "document.fortune-align", "align must be left, center or right.", nodeId);
  }
}

function validateIconNode(
  node: UnknownRecord,
  diagnostics: RenderDiagnostic[],
  nodeId: string
): void {
  if (typeof node.iconId !== "string" || !ICON_IDS.includes(node.iconId as IconId)) {
    pushDiagnostic(
      diagnostics,
      "error",
      "document.icon-id",
      `Unsupported Font Awesome icon: ${String(node.iconId)}.`,
      nodeId
    );
  }
}
