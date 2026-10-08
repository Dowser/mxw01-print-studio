import type {
  BarcodeNode,
  ChecklistNode,
  FrameStyle,
  IconId,
  IconNode,
  ImageNode,
  PrintDocument,
  PrintNode,
  QrCodeNode,
  RenderDiagnostic,
  RenderResult,
  RuleNode,
  TextFontId,
  TextNode,
  FortuneNode,
} from "../core/document";
import {
  fingerprintPrintDocument,
  validatePrintDocument,
} from "../core/document";
import { FONT_AWESOME_ICON_PATHS } from "../core/iconShapes";
import { VECTOR_TEXT_GLYPHS } from "../core/textGlyphs";
import type {
  TextGlyphPoint,
  TextGlyphStroke,
} from "../core/textGlyphs";
import type {
  DitherMethod,
  PrinterProfile,
} from "../core/types";
import { MXW01_PRINTER_PROFILE } from "../core/printerProfiles";
import { layoutPrintDocument } from "../core/documentLayout";
import { packMonoRaster } from "./raster";
import { processImageForPrinter } from "./imageProcessor";
import { scaleImageData } from "./imageTransforms";

/** Bump when the same document can produce different pixels. */
export const DOCUMENT_RENDERER_VERSION = "bitmap-5x7-qr1-v6";

export interface DocumentRenderOptions {
  readonly dither?: DitherMethod;
  readonly brightness?: number;
}

type MonoRows = boolean[][];

const FONT_5X7: Readonly<Record<string, readonly string[]>> = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "#": ["01010", "11111", "01010", "01010", "11111", "01010", "01010"],
  "%": ["11001", "11010", "00100", "01000", "01011", "10011", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
  "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
  "*": ["00000", "00100", "10101", "01110", "10101", "00100", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00110", "00100", "01000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  ";": ["00000", "00110", "00110", "00000", "00110", "00100", "01000"],
  "=": ["00000", "11111", "00000", "11111", "00000", "00000", "00000"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "Ä": ["01010", "00000", "01110", "10001", "11111", "10001", "10001"],
  "Å": ["00100", "00000", "01110", "10001", "11111", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "Ö": ["01010", "00000", "01110", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
] as const;

const EAN_L_PATTERNS = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
] as const;
const EAN_G_PATTERNS = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
] as const;
const EAN_R_PATTERNS = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
] as const;
const EAN_PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
] as const;

const QR_SIZE = 21;
const QR_DATA_CODEWORDS = 19;
const QR_ECC_CODEWORDS = 7;

export function renderPrintDocument(
  document: PrintDocument,
  profile: PrinterProfile = MXW01_PRINTER_PROFILE,
  options: DocumentRenderOptions = {}
): RenderResult {
  const laidOutDocument = layoutPrintDocument(document);
  const diagnostics = validatePrintDocument(laidOutDocument);
  let documentFingerprint = "fnv1a32-00000000";
  try {
    documentFingerprint = fingerprintPrintDocument(laidOutDocument);
  } catch (_error) {
    diagnostics.push({
      severity: "error",
      code: "document.fingerprint",
      message: "Document fingerprinting requires JSON-safe finite values.",
    });
  }
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return {
      pages: [],
      diagnostics,
      rendererVersion: DOCUMENT_RENDERER_VERSION,
      profileId: profile.id,
      canPrint: false,
      documentFingerprint,
    };
  }

  if (laidOutDocument.nodes.length === 0) {
    diagnostics.push({
      severity: "warning",
      code: "document.empty",
      message: "Add at least one printable object before sending this document to a printer.",
    });
  }

  if (laidOutDocument.page.widthDots > profile.widthDots) {
    diagnostics.push({
      severity: "error",
      code: "render.page-too-wide",
      message: `Document width ${laidOutDocument.page.widthDots} exceeds profile width ${profile.widthDots}.`,
    });
    return {
      pages: [],
      diagnostics,
      rendererVersion: DOCUMENT_RENDERER_VERSION,
      profileId: profile.id,
      canPrint: false,
      documentFingerprint,
    };
  }

  const rows = Array.from(
    { length: laidOutDocument.page.heightDots },
    () => new Array<boolean>(profile.widthDots).fill(false)
  );

  if (laidOutDocument.page.frame) {
    drawPageFrame(laidOutDocument.page.frame, laidOutDocument.page.widthDots, laidOutDocument.page.heightDots, rows);
  }

  for (const node of laidOutDocument.nodes) {
    try {
      renderNode(node, rows, profile, options, diagnostics);
    } catch (error) {
      diagnostics.push({
        severity: "error",
        code: `render.${node.kind}`,
        message: error instanceof Error ? error.message : String(error),
        nodeId: node.id,
      });
    }
  }

  const raster = packMonoRaster(rows, profile);
  return {
    pages: [raster],
    diagnostics,
    rendererVersion: DOCUMENT_RENDERER_VERSION,
    profileId: profile.id,
    canPrint: diagnostics.every((diagnostic) => diagnostic.severity === "info"),
    documentFingerprint,
  };
}

function renderNode(
  node: PrintNode,
  rows: MonoRows,
  profile: PrinterProfile,
  options: DocumentRenderOptions,
  diagnostics: RenderDiagnostic[]
): void {
  if (node.rotation !== undefined && node.rotation !== 0) {
    diagnostics.push({
      severity: "warning",
      code: "render.rotation-ignored",
      message: "Document node rotation is not supported by renderer v1.",
      nodeId: node.id,
    });
  }

  switch (node.kind) {
    case "text":
      drawText(node, rows, diagnostics);
      return;
    case "image":
      drawImage(node, rows, profile, options);
      return;
    case "rule":
      drawRule(node, rows);
      return;
    case "barcode":
      drawBarcode(node, rows, diagnostics);
      return;
    case "qr":
      drawQr(node, rows);
      return;
    case "checklist":
      drawChecklist(node, rows, diagnostics);
      return;
    case "fortune":
      drawFortune(node, rows, diagnostics);
      return;
    case "icon":
      drawIcon(node, rows);
      return;
  }
}

interface TextLayoutLine {
  readonly text: string;
  readonly width: number;
}

interface TextLayout {
  readonly lines: readonly TextLayoutLine[];
  readonly scale: number;
  readonly lineHeight: number;
  readonly horizontalOverflow: boolean;
}

function measureGlyphLine(line: string, fontId: TextFontId, scale: number): number {
  const characters = [...line];
  if (characters.length === 0) return 0;
  return characters.reduce((width, character, index) => {
    const glyph = glyphFor(fontId, character);
    return width + glyph.advance * scale - (index === characters.length - 1 ? glyph.spacing * scale : 0);
  }, 0);
}

function splitTextToken(token: string, maxWidth: number, fontId: TextFontId, scale: number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const character of [...token]) {
    const candidate = `${current}${character}`;
    if (current && measureGlyphLine(candidate, fontId, scale) > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current || chunks.length === 0) chunks.push(current);
  return chunks;
}

function wrapTextLine(line: string, maxWidth: number, fontId: TextFontId, scale: number): TextLayoutLine[] {
  if (line.length === 0) return [{ text: "", width: 0 }];
  const tokens = line.match(/\s+|\S+/gu) ?? [line];
  const wrapped: TextLayoutLine[] = [];
  let current = "";
  for (const token of tokens) {
    const candidate = `${current}${token}`;
    if (current && measureGlyphLine(candidate, fontId, scale) > maxWidth) {
      const trimmed = current.replace(/\s+$/u, "");
      wrapped.push({ text: trimmed, width: measureGlyphLine(trimmed, fontId, scale) });
      current = token.replace(/^\s+/u, "");
    } else {
      current = candidate;
    }

    if (measureGlyphLine(current, fontId, scale) > maxWidth) {
      const chunks = splitTextToken(current, maxWidth, fontId, scale);
      chunks.slice(0, -1).forEach((chunk) => wrapped.push({
        text: chunk,
        width: measureGlyphLine(chunk, fontId, scale),
      }));
      current = chunks[chunks.length - 1] ?? "";
    }
  }
  const trimmed = current.replace(/\s+$/u, "");
  wrapped.push({ text: trimmed, width: measureGlyphLine(trimmed, fontId, scale) });
  return wrapped;
}

function layoutText(node: TextNode, scale: number): TextLayout {
  const fontId = node.fontId ?? "mxw-vector";
  const requestedScale = Math.max(1, Math.trunc(node.fontSizeDots ?? 1));
  const frameWidth = Math.max(0, Math.trunc(node.width));
  const lineHeight = Math.max(
    1,
    Math.trunc((node.lineHeightDots ?? 8 * requestedScale) * scale / requestedScale)
  );
  const lines = node.text
    .split("\n")
    .flatMap((line) => wrapTextLine(line, frameWidth, fontId, scale));
  return {
    lines,
    scale,
    lineHeight,
    horizontalOverflow: lines.some((line) => line.width > frameWidth),
  };
}

function drawText(
  node: TextNode,
  rows: MonoRows,
  diagnostics: RenderDiagnostic[] = [],
  diagnosticNodeId = node.id,
): void {
  const requestedScale = Math.max(1, Math.trunc(node.fontSizeDots ?? 1));
  let layout = layoutText(node, requestedScale);
  const frameX = Math.trunc(node.x);
  const frameY = Math.trunc(node.y);
  const frameWidth = Math.max(0, Math.trunc(node.width));
  const frameHeight = Math.max(0, Math.trunc(node.height));
  while (
    layout.scale > 1 &&
    (layout.lines.length * layout.lineHeight > frameHeight || layout.horizontalOverflow)
  ) {
    layout = layoutText(node, layout.scale - 1);
  }
  const clip = {
    x: frameX,
    y: frameY,
    width: frameWidth,
    height: frameHeight,
  };

  const fontId = node.fontId ?? "mxw-vector";
  const bold = node.fontWeight === "bold" || fontId === "mxw-bold";
  const visibleLineCount = Math.max(0, Math.ceil(frameHeight / Math.max(1, layout.lineHeight)));
  const glyphHeight = 7 * layout.scale;
  const fullyVisibleLineCount = frameHeight >= glyphHeight
    ? Math.floor((frameHeight - glyphHeight) / Math.max(1, layout.lineHeight)) + 1
    : 0;
  if (layout.horizontalOverflow || layout.lines.length > fullyVisibleLineCount) {
    diagnostics.push({
      severity: "warning",
      code: "render.text-overflow",
      message: "Text does not fit inside its node bounds after wrapping and automatic scaling.",
      nodeId: diagnosticNodeId,
    });
  }

  layout.lines.forEach((line, lineIndex) => {
    if (lineIndex >= visibleLineCount) return;
    let startX = frameX;
    if (node.align === "center") {
      startX = frameX + Math.trunc((frameWidth - line.width) / 2);
    } else if (node.align === "right") {
      startX = frameX + frameWidth - line.width;
    }

    const startY = frameY + lineIndex * layout.lineHeight;
    let glyphX = startX;
    for (const character of line.text) {
      const glyph = glyphFor(fontId, character);
      drawGlyph(glyph, glyphX, startY, layout.scale, rows, bold, clip);
      glyphX += glyph.advance * layout.scale;
    }
  });
}

interface RenderGlyph {
  readonly rows?: readonly string[];
  readonly strokes?: readonly TextGlyphStroke[];
  readonly dots?: readonly TextGlyphPoint[];
  readonly width: number;
  readonly advance: number;
  readonly spacing: number;
  readonly strokeWidth?: number;
}

function glyphFor(fontId: TextFontId, character: string): RenderGlyph {
  if (fontId !== "mxw-5x7") {
    return vectorGlyphFor(fontId, character);
  }

  const base = FONT_5X7[character.toUpperCase()] ?? FONT_5X7["?"];
  return { rows: base, width: 5, advance: 6, spacing: 1 };
}

function vectorGlyphFor(fontId: TextFontId, character: string): RenderGlyph {
  const definition = VECTOR_TEXT_GLYPHS[character.toUpperCase()] ?? VECTOR_TEXT_GLYPHS["?"];
  const xScale = fontId === "mxw-condensed" ? 0.66 : fontId === "mxw-wide" ? 2 : 1;
  const fixedWidth = fontId === "mxw-vector" || fontId === "mxw-mono" ||
    fontId === "mxw-bold" || fontId === "mxw-serif" || fontId === "mxw-rounded";
  const width = fixedWidth ? 5 : definition.width * xScale;
  const strokes = definition.strokes.map((points) => points.map(([x, y]) => [x * xScale, y] as const));
  const dots = (definition.dots ?? []).map(([x, y]) => [x * xScale, y] as const);
  const styledStrokes = fontId === "mxw-serif"
    ? [...strokes, ...serifStrokes(strokes, xScale)]
    : strokes;
  const advance = fontId === "mxw-condensed"
    ? 4
    : fontId === "mxw-wide"
      ? 11
      : fixedWidth
        ? 6
      : Math.ceil(width) + 1;
  return {
    strokes: styledStrokes,
    dots,
    width,
    advance,
    spacing: 1,
    strokeWidth: fontId === "mxw-bold" ? 1.15 : fontId === "mxw-rounded" ? 0.95 : 0.85,
  };
}

function serifStrokes(strokes: readonly TextGlyphStroke[], xScale: number): readonly TextGlyphStroke[] {
  const result: TextGlyphStroke[] = [];
  for (const points of strokes) {
    if (points.length !== 2 || Math.abs(points[0][0] - points[1][0]) > 0.08) continue;
    const [first, second] = points;
    if (Math.abs(second[1] - first[1]) < 2) continue;
    for (const point of [first, second]) {
      result.push([
        [point[0] - 0.35 * xScale, point[1]],
        [point[0] + 0.35 * xScale, point[1]],
      ]);
    }
  }
  return result;
}

interface IconPoint {
  readonly x: number;
  readonly y: number;
}

interface ParsedIconPath {
  readonly subpaths: readonly (readonly IconPoint[])[];
}

type IconPathToken = string | number;

const ICON_SAMPLE_GRID = 4;
const ICON_PATH_CACHE = new Map<IconId, ParsedIconPath>();
const ICON_PATH_TOKEN_PATTERN = /([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)|([a-zA-Z])/g;

/**
 * Parse and flatten the small SVG path subset used by Font Awesome.  This is
 * intentionally kept in the platform-neutral renderer instead of using
 * Path2D, so a future Swift/CoreGraphics renderer can reproduce the exact
 * same paths and pixels.
 */
function parseIconPath(path: string): ParsedIconPath {
  const tokens: IconPathToken[] = [];
  for (const match of path.matchAll(ICON_PATH_TOKEN_PATTERN)) {
    tokens.push(match[1] === undefined ? match[2] : Number(match[1]));
  }

  const subpaths: IconPoint[][] = [];
  let tokenIndex = 0;
  let command: string | undefined;
  let previousCommand: string | undefined;
  let current: IconPoint = { x: 0, y: 0 };
  let subpathStart: IconPoint = current;
  let currentSubpath: IconPoint[] | undefined;
  let lastCubicControl: IconPoint | undefined;
  let lastQuadraticControl: IconPoint | undefined;

  const readNumbers = (count: number): number[] | undefined => {
    if (tokenIndex + count > tokens.length) return undefined;
    const values = tokens.slice(tokenIndex, tokenIndex + count);
    if (values.some((value) => typeof value !== "number")) return undefined;
    tokenIndex += count;
    return values as number[];
  };

  const pointFrom = (x: number, y: number, relative: boolean): IconPoint => ({
    x: relative ? current.x + x : x,
    y: relative ? current.y + y : y,
  });

  const appendPoint = (point: IconPoint): void => {
    if (!currentSubpath) {
      currentSubpath = [current];
      subpaths.push(currentSubpath);
    }
    currentSubpath.push(point);
  };

  while (tokenIndex < tokens.length) {
    if (typeof tokens[tokenIndex] === "string") {
      command = tokens[tokenIndex] as string;
      tokenIndex += 1;
    }
    if (!command) break;

    const upperCommand = command.toUpperCase();
    const relative = command !== upperCommand;

    if (upperCommand === "Z") {
      if (currentSubpath && currentSubpath.length > 1) {
        currentSubpath.push(subpathStart);
      }
      current = subpathStart;
      currentSubpath = undefined;
      command = undefined;
      previousCommand = undefined;
      lastCubicControl = undefined;
      lastQuadraticControl = undefined;
      continue;
    }

    if (upperCommand === "M") {
      const values = readNumbers(2);
      if (!values) break;
      current = pointFrom(values[0], values[1], relative);
      subpathStart = current;
      currentSubpath = [current];
      subpaths.push(currentSubpath);
      command = relative ? "l" : "L";
      previousCommand = "M";
      lastCubicControl = undefined;
      lastQuadraticControl = undefined;
      continue;
    }

    if (upperCommand === "L") {
      const values = readNumbers(2);
      if (!values) break;
      current = pointFrom(values[0], values[1], relative);
      appendPoint(current);
      previousCommand = "L";
      lastCubicControl = undefined;
      lastQuadraticControl = undefined;
      continue;
    }

    if (upperCommand === "H") {
      const values = readNumbers(1);
      if (!values) break;
      current = { x: relative ? current.x + values[0] : values[0], y: current.y };
      appendPoint(current);
      previousCommand = "H";
      lastCubicControl = undefined;
      lastQuadraticControl = undefined;
      continue;
    }

    if (upperCommand === "V") {
      const values = readNumbers(1);
      if (!values) break;
      current = { x: current.x, y: relative ? current.y + values[0] : values[0] };
      appendPoint(current);
      previousCommand = "V";
      lastCubicControl = undefined;
      lastQuadraticControl = undefined;
      continue;
    }

    if (upperCommand === "C") {
      const values = readNumbers(6);
      if (!values) break;
      const control1 = pointFrom(values[0], values[1], relative);
      const control2 = pointFrom(values[2], values[3], relative);
      const endpoint = pointFrom(values[4], values[5], relative);
      appendCubicPoints(current, control1, control2, endpoint, appendPoint);
      current = endpoint;
      previousCommand = "C";
      lastCubicControl = control2;
      lastQuadraticControl = undefined;
      continue;
    }

    if (upperCommand === "S") {
      const values = readNumbers(4);
      if (!values) break;
      const control1 = previousCommand === "C" || previousCommand === "S"
        ? reflectPoint(current, lastCubicControl ?? current)
        : current;
      const control2 = pointFrom(values[0], values[1], relative);
      const endpoint = pointFrom(values[2], values[3], relative);
      appendCubicPoints(current, control1, control2, endpoint, appendPoint);
      current = endpoint;
      previousCommand = "S";
      lastCubicControl = control2;
      lastQuadraticControl = undefined;
      continue;
    }

    if (upperCommand === "Q") {
      const values = readNumbers(4);
      if (!values) break;
      const control = pointFrom(values[0], values[1], relative);
      const endpoint = pointFrom(values[2], values[3], relative);
      appendQuadraticPoints(current, control, endpoint, appendPoint);
      current = endpoint;
      previousCommand = "Q";
      lastCubicControl = undefined;
      lastQuadraticControl = control;
      continue;
    }

    if (upperCommand === "T") {
      const values = readNumbers(2);
      if (!values) break;
      const control = previousCommand === "Q" || previousCommand === "T"
        ? reflectPoint(current, lastQuadraticControl ?? current)
        : current;
      const endpoint = pointFrom(values[0], values[1], relative);
      appendQuadraticPoints(current, control, endpoint, appendPoint);
      current = endpoint;
      previousCommand = "T";
      lastCubicControl = undefined;
      lastQuadraticControl = control;
      continue;
    }

    if (upperCommand === "A") {
      const values = readNumbers(7);
      if (!values) break;
      const endpoint = pointFrom(values[5], values[6], relative);
      appendArcPoints(
        current,
        values[0],
        values[1],
        values[2],
        values[3] !== 0,
        values[4] !== 0,
        endpoint,
        appendPoint
      );
      current = endpoint;
      previousCommand = "A";
      lastCubicControl = undefined;
      lastQuadraticControl = undefined;
      continue;
    }

    break;
  }

  return { subpaths };
}

function reflectPoint(point: IconPoint, around: IconPoint): IconPoint {
  return { x: 2 * point.x - around.x, y: 2 * point.y - around.y };
}

function distanceBetween(first: IconPoint, second: IconPoint): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function appendCubicPoints(
  start: IconPoint,
  control1: IconPoint,
  control2: IconPoint,
  endpoint: IconPoint,
  append: (point: IconPoint) => void
): void {
  const length = distanceBetween(start, control1) + distanceBetween(control1, control2) + distanceBetween(control2, endpoint);
  const steps = Math.max(4, Math.ceil(length / 16));
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const inverse = 1 - t;
    append({
      x: inverse ** 3 * start.x + 3 * inverse ** 2 * t * control1.x + 3 * inverse * t ** 2 * control2.x + t ** 3 * endpoint.x,
      y: inverse ** 3 * start.y + 3 * inverse ** 2 * t * control1.y + 3 * inverse * t ** 2 * control2.y + t ** 3 * endpoint.y,
    });
  }
}

function appendQuadraticPoints(
  start: IconPoint,
  control: IconPoint,
  endpoint: IconPoint,
  append: (point: IconPoint) => void
): void {
  const length = distanceBetween(start, control) + distanceBetween(control, endpoint);
  const steps = Math.max(4, Math.ceil(length / 16));
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const inverse = 1 - t;
    append({
      x: inverse ** 2 * start.x + 2 * inverse * t * control.x + t ** 2 * endpoint.x,
      y: inverse ** 2 * start.y + 2 * inverse * t * control.y + t ** 2 * endpoint.y,
    });
  }
}

function appendArcPoints(
  start: IconPoint,
  radiusX: number,
  radiusY: number,
  rotationDegrees: number,
  largeArc: boolean,
  sweep: boolean,
  endpoint: IconPoint,
  append: (point: IconPoint) => void
): void {
  let rx = Math.abs(radiusX);
  let ry = Math.abs(radiusY);
  if (rx === 0 || ry === 0 || (start.x === endpoint.x && start.y === endpoint.y)) {
    append(endpoint);
    return;
  }

  const rotation = rotationDegrees * Math.PI / 180;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const deltaX = (start.x - endpoint.x) / 2;
  const deltaY = (start.y - endpoint.y) / 2;
  const transformedX = cosine * deltaX + sine * deltaY;
  const transformedY = -sine * deltaX + cosine * deltaY;
  const radiiScale = transformedX ** 2 / rx ** 2 + transformedY ** 2 / ry ** 2;
  if (radiiScale > 1) {
    const scale = Math.sqrt(radiiScale);
    rx *= scale;
    ry *= scale;
  }

  const denominator = rx ** 2 * transformedY ** 2 + ry ** 2 * transformedX ** 2;
  const numerator = Math.max(0, rx ** 2 * ry ** 2 - denominator);
  const factor = (largeArc === sweep ? -1 : 1) * Math.sqrt(denominator === 0 ? 0 : numerator / denominator);
  const centerXPrime = factor * rx * transformedY / ry;
  const centerYPrime = factor * -ry * transformedX / rx;
  const center = {
    x: cosine * centerXPrime - sine * centerYPrime + (start.x + endpoint.x) / 2,
    y: sine * centerXPrime + cosine * centerYPrime + (start.y + endpoint.y) / 2,
  };
  const vectorStart = { x: (transformedX - centerXPrime) / rx, y: (transformedY - centerYPrime) / ry };
  const vectorEnd = { x: (-transformedX - centerXPrime) / rx, y: (-transformedY - centerYPrime) / ry };
  const startAngle = Math.atan2(vectorStart.y, vectorStart.x);
  let deltaAngle = Math.atan2(vectorStart.x * vectorEnd.y - vectorStart.y * vectorEnd.x, vectorStart.x * vectorEnd.x + vectorStart.y * vectorEnd.y);
  if (!sweep && deltaAngle > 0) deltaAngle -= 2 * Math.PI;
  if (sweep && deltaAngle < 0) deltaAngle += 2 * Math.PI;
  const steps = Math.max(4, Math.ceil(Math.abs(deltaAngle) * Math.max(rx, ry) / 16));

  for (let step = 1; step <= steps; step += 1) {
    const angle = startAngle + deltaAngle * step / steps;
    const localX = rx * Math.cos(angle);
    const localY = ry * Math.sin(angle);
    append({
      x: center.x + cosine * localX - sine * localY,
      y: center.y + sine * localX + cosine * localY,
    });
  }
}

function parsedIconPath(iconId: IconId): ParsedIconPath {
  const cached = ICON_PATH_CACHE.get(iconId);
  if (cached) return cached;
  const definition = FONT_AWESOME_ICON_PATHS[iconId] ?? FONT_AWESOME_ICON_PATHS["fa-star"];
  const parsed = parseIconPath(definition.path);
  ICON_PATH_CACHE.set(iconId, parsed);
  return parsed;
}

/** SVG's default non-zero winding fill rule, evaluated at a raster sample. */
function iconPathContains(path: ParsedIconPath, x: number, y: number): boolean {
  let winding = 0;
  for (const subpath of path.subpaths) {
    if (subpath.length < 3) continue;
    for (let index = 0; index < subpath.length; index += 1) {
      const first = subpath[index];
      const second = subpath[(index + 1) % subpath.length];
      if (first.y <= y) {
        if (second.y > y && (second.x - first.x) * (y - first.y) - (x - first.x) * (second.y - first.y) > 0) winding += 1;
      } else if (second.y <= y && (second.x - first.x) * (y - first.y) - (x - first.x) * (second.y - first.y) < 0) {
        winding -= 1;
      }
    }
  }
  return winding !== 0;
}

function drawIcon(node: IconNode, rows: MonoRows): void {
  const definition = FONT_AWESOME_ICON_PATHS[node.iconId] ?? FONT_AWESOME_ICON_PATHS["fa-star"];
  const path = parsedIconPath(node.iconId);
  const frameWidth = Math.max(1, Math.trunc(node.width));
  const frameHeight = Math.max(1, Math.trunc(node.height));
  const scale = Math.min(frameWidth / definition.width, frameHeight / definition.height);
  if (!(scale > 0)) return;

  const drawnWidth = definition.width * scale;
  const drawnHeight = definition.height * scale;
  const originX = Math.trunc(node.x) + (frameWidth - drawnWidth) / 2;
  const originY = Math.trunc(node.y) + (frameHeight - drawnHeight) / 2;
  const firstX = Math.max(0, Math.floor(originX));
  const lastX = Math.min(rows[0]?.length ?? 0, Math.ceil(originX + drawnWidth));
  const firstY = Math.max(0, Math.floor(originY));
  const lastY = Math.min(rows.length, Math.ceil(originY + drawnHeight));
  const sampleCount = ICON_SAMPLE_GRID * ICON_SAMPLE_GRID;

  for (let pixelY = firstY; pixelY < lastY; pixelY += 1) {
    for (let pixelX = firstX; pixelX < lastX; pixelX += 1) {
      let coveredSamples = 0;
      for (let sampleY = 0; sampleY < ICON_SAMPLE_GRID; sampleY += 1) {
        for (let sampleX = 0; sampleX < ICON_SAMPLE_GRID; sampleX += 1) {
          const sourceX = (pixelX + (sampleX + 0.5) / ICON_SAMPLE_GRID - originX) / scale;
          const sourceY = (pixelY + (sampleY + 0.5) / ICON_SAMPLE_GRID - originY) / scale;
          if (iconPathContains(path, sourceX, sourceY)) coveredSamples += 1;
        }
      }
      if (coveredSamples * 2 >= sampleCount) setBlack(rows, pixelX, pixelY);
    }
  }
}

function drawGlyph(
  glyph: RenderGlyph,
  x: number,
  y: number,
  scale: number,
  rows: MonoRows,
  bold: boolean,
  clip: { x: number; y: number; width: number; height: number }
): void {
  if (glyph.strokes) {
    drawVectorGlyph(glyph, x, y, scale, rows, bold, clip);
    return;
  }

  const bitmap = glyph.rows ?? [];
  for (let glyphY = 0; glyphY < bitmap.length; glyphY += 1) {
    for (let glyphX = 0; glyphX < bitmap[glyphY].length; glyphX += 1) {
      if (bitmap[glyphY][glyphX] !== "1") continue;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          setBlack(rows, x + glyphX * scale + dx, y + glyphY * scale + dy, clip);
          if (bold) setBlack(rows, x + glyphX * scale + dx + 1, y + glyphY * scale + dy, clip);
        }
      }
    }
  }
}

const TEXT_SAMPLE_GRID = 4;

function drawVectorGlyph(
  glyph: RenderGlyph,
  x: number,
  y: number,
  scale: number,
  rows: MonoRows,
  bold: boolean,
  clip: { x: number; y: number; width: number; height: number }
): void {
  const strokeWidth = (glyph.strokeWidth ?? 0.85) + (bold ? 0.25 : 0);
  const strokeRadius = strokeWidth / 2;
  const extent = strokeRadius * scale + 1;
  const firstX = Math.max(clip.x, Math.floor(x - extent));
  const lastX = Math.min(clip.x + clip.width, Math.ceil(x + glyph.width * scale + extent));
  const firstY = Math.max(clip.y, Math.floor(y - extent));
  const lastY = Math.min(clip.y + clip.height, Math.ceil(y + 7 * scale + extent));
  const sampleCount = TEXT_SAMPLE_GRID * TEXT_SAMPLE_GRID;

  for (let pixelY = firstY; pixelY < lastY; pixelY += 1) {
    for (let pixelX = firstX; pixelX < lastX; pixelX += 1) {
      let coveredSamples = 0;
      for (let sampleY = 0; sampleY < TEXT_SAMPLE_GRID; sampleY += 1) {
        for (let sampleX = 0; sampleX < TEXT_SAMPLE_GRID; sampleX += 1) {
          const sourceX = (pixelX + (sampleX + 0.5) / TEXT_SAMPLE_GRID - x) / scale;
          const sourceY = (pixelY + (sampleY + 0.5) / TEXT_SAMPLE_GRID - y) / scale;
          if (vectorGlyphContains(glyph, sourceX, sourceY, strokeWidth)) coveredSamples += 1;
        }
      }
      if (coveredSamples * 2 >= sampleCount) setBlack(rows, pixelX, pixelY, clip);
    }
  }
}

function vectorGlyphContains(
  glyph: RenderGlyph,
  x: number,
  y: number,
  strokeWidth: number
): boolean {
  const radius = strokeWidth / 2;
  for (const points of glyph.strokes ?? []) {
    for (let index = 1; index < points.length; index += 1) {
      if (pointToSegmentDistance(x, y, points[index - 1], points[index]) <= radius) return true;
    }
  }
  for (const [dotX, dotY] of glyph.dots ?? []) {
    if (Math.hypot(x - dotX, y - dotY) <= radius * 1.1) return true;
  }
  return false;
}

function pointToSegmentDistance(
  x: number,
  y: number,
  first: TextGlyphPoint,
  second: TextGlyphPoint
): number {
  const deltaX = second[0] - first[0];
  const deltaY = second[1] - first[1];
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  if (lengthSquared === 0) return Math.hypot(x - first[0], y - first[1]);
  const projection = Math.max(
    0,
    Math.min(1, ((x - first[0]) * deltaX + (y - first[1]) * deltaY) / lengthSquared),
  );
  return Math.hypot(
    x - (first[0] + projection * deltaX),
    y - (first[1] + projection * deltaY),
  );
}

function drawPageFrame(
  frame: { readonly insetDots: number; readonly thicknessDots: number; readonly style?: FrameStyle },
  pageWidth: number,
  pageHeight: number,
  rows: MonoRows
): void {
  const inset = Math.max(0, Math.trunc(frame.insetDots));
  const thickness = Math.max(1, Math.trunc(frame.thicknessDots));
  const style = frame.style ?? "solid";
  const rings = style === "double" ? [0, Math.max(2, thickness + 1)] : Array.from({ length: thickness }, (_, index) => index);
  for (const ring of rings) {
    const left = inset + ring;
    const top = inset + ring;
    const frameRight = pageWidth - inset - ring - 1;
    const frameBottom = pageHeight - inset - ring - 1;
    if (left > frameRight || top > frameBottom) continue;
    const draw = (distance: number): boolean => {
      if (style === "dashed") return distance % 8 < 4;
      if (style === "dotted") return distance % 3 === 0;
      return true;
    };
    for (let x = left; x <= frameRight; x += 1) {
      const distance = x - left;
      if (style === "rounded" && (x === left || x === frameRight)) continue;
      if (draw(distance)) {
        setBlack(rows, x, top);
        setBlack(rows, x, frameBottom);
      }
    }
    for (let y = top; y <= frameBottom; y += 1) {
      const distance = y - top;
      if (style === "rounded" && (y === top || y === frameBottom)) continue;
      if (draw(distance)) {
        setBlack(rows, left, y);
        setBlack(rows, frameRight, y);
      }
    }
    if (style === "rounded") {
      for (const [x, y] of [[left + 1, top], [frameRight - 1, top], [left + 1, frameBottom], [frameRight - 1, frameBottom], [left, top + 1], [frameRight, top + 1], [left, frameBottom - 1], [frameRight, frameBottom - 1]]) {
        setBlack(rows, x, y);
      }
    }
  }
}

function drawChecklist(node: ChecklistNode, rows: MonoRows, diagnostics: RenderDiagnostic[]): void {
  const scale = Math.max(1, Math.trunc(node.fontSizeDots ?? 1));
  const itemHeight = Math.max(8, Math.trunc(node.itemHeightDots ?? 10 * scale));
  const requiredHeight = node.items.length * itemHeight;
  if (requiredHeight > node.height) {
    diagnostics.push({
      severity: "warning",
      code: "render.checklist-overflow",
      message: "Checklist rows extend beyond the node bounds.",
      nodeId: node.id,
    });
  }
  node.items.forEach((item, index) => {
    const y = Math.trunc(node.y) + index * itemHeight;
    if (y >= node.y + node.height) return;
    drawText(
      {
        id: `${node.id}-${index}`,
        kind: "text",
        text: `${item.checked ? "[X]" : "[ ]"} ${item.text}`,
        x: node.x,
        y,
        width: node.width,
        height: Math.min(itemHeight, node.y + node.height - y),
        fontId: node.fontId,
        fontSizeDots: node.fontSizeDots,
        lineHeightDots: 8 * scale,
      },
      rows,
      diagnostics,
      node.id,
    );
  });
}

function drawFortune(node: FortuneNode, rows: MonoRows, diagnostics: RenderDiagnostic[]): void {
  drawText(
    {
      id: node.id,
      kind: "text",
      text: node.text,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      fontId: node.fontId,
      fontSizeDots: node.fontSizeDots,
      align: node.align,
    },
    rows,
    diagnostics,
    node.id,
  );
}

function drawImage(
  node: ImageNode,
  rows: MonoRows,
  profile: PrinterProfile,
  options: DocumentRenderOptions
): void {
  const sourceWidth = Math.trunc(node.image.width);
  const sourceHeight = Math.trunc(node.image.height);
  const imageBytes = decodeBase64(node.image.dataBase64);
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Image dimensions must be greater than zero");
  }
  if (imageBytes.length !== sourceWidth * sourceHeight * 4) {
    throw new Error(
      `RGBA image data must contain ${sourceWidth * sourceHeight * 4} bytes, got ${imageBytes.length}`
    );
  }

  const targetWidth = Math.max(1, Math.trunc(node.width));
  const targetHeight = Math.max(1, Math.trunc(node.height));
  if (targetWidth > profile.widthDots) {
    throw new Error(`Image width ${targetWidth} exceeds profile width ${profile.widthDots}`);
  }
  if (targetHeight > rows.length) {
    throw new Error(`Image height ${targetHeight} exceeds page height ${rows.length}`);
  }
  const scaled = scaleImageData(
    {
      data: new Uint8ClampedArray(imageBytes),
      width: sourceWidth,
      height: sourceHeight,
    },
    targetWidth,
    targetHeight
  );
  const processed = processImageForPrinter(
    scaled,
    {
      dither: options.dither ?? "steinberg",
      brightness: options.brightness ?? 128,
      flip: "none",
      rotate: 0,
    },
    targetWidth
  );

  for (let y = 0; y < processed.binaryRows.length; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      if (processed.binaryRows[y][x]) {
        setBlack(rows, Math.trunc(node.x) + x, Math.trunc(node.y) + y);
      }
    }
  }
}

function drawRule(node: RuleNode, rows: MonoRows): void {
  const thickness = Math.max(1, Math.trunc(node.thicknessDots ?? 1));
  for (let y = 0; y < thickness; y += 1) {
    for (let x = 0; x < Math.trunc(node.width); x += 1) {
      setBlack(rows, Math.trunc(node.x) + x, Math.trunc(node.y) + y);
    }
  }
}

function drawBarcode(node: BarcodeNode, rows: MonoRows, diagnostics: RenderDiagnostic[]): void {
  const modules = barcodeModules(node.format, node.value);
  const textBandHeight = node.showText && node.height >= 18 ? 10 : 0;
  const barHeight = node.height - textBandHeight;
  drawModuleGraphic(modules, node.x, node.y, node.width, barHeight, rows);

  if (textBandHeight > 0) {
    drawText(
      {
        id: `${node.id}-text`,
        kind: "text",
        text: node.value,
        x: node.x,
        y: node.y + barHeight + 1,
        width: node.width,
        height: 8,
        align: "center",
        fontSizeDots: 1,
      },
      rows,
      diagnostics,
      node.id,
    );
  }
}

function drawQr(node: QrCodeNode, rows: MonoRows): void {
  if (node.errorCorrection && node.errorCorrection !== "low") {
    throw new Error("QR renderer v1 supports low error correction only");
  }
  const matrix = createQrMatrix(new TextEncoder().encode(node.value));
  const withQuietZone = matrix.length + 8;
  const modules: boolean[] = [];
  for (let y = 0; y < withQuietZone; y += 1) {
    for (let x = 0; x < withQuietZone; x += 1) {
      modules.push(
        y >= 4 && y < withQuietZone - 4 &&
          x >= 4 && x < withQuietZone - 4 &&
          matrix[y - 4][x - 4]
      );
    }
  }
  drawModuleGraphic(modules, node.x, node.y, node.width, node.height, rows, withQuietZone);
}

function drawModuleGraphic(
  modules: readonly boolean[],
  x: number,
  y: number,
  width: number,
  height: number,
  rows: MonoRows,
  moduleWidth?: number
): void {
  const targetWidth = Math.max(1, Math.trunc(width));
  const targetHeight = Math.max(1, Math.trunc(height));
  const sourceWidth = moduleWidth ?? modules.length;
  const sourceHeight = moduleWidth ?? 1;
  const originX = Math.trunc(x);
  const originY = Math.trunc(y);

  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    const sourceY = moduleWidth
      ? Math.min(sourceHeight - 1, Math.floor((targetY * sourceHeight) / targetHeight))
      : 0;
    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor((targetX * sourceWidth) / targetWidth));
      const index = moduleWidth ? sourceY * sourceWidth + sourceX : sourceX;
      if (modules[index]) {
        setBlack(rows, originX + targetX, originY + targetY);
      }
    }
  }
}

function barcodeModules(
  format: BarcodeNode["format"],
  value: string
): boolean[] {
  switch (format) {
    case "code128":
      return code128Modules(value);
    case "ean13":
      return ean13Modules(value);
    case "upca":
      return ean13Modules(`0${value}`);
  }
}

function code128Modules(value: string): boolean[] {
  const codes = [104];
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 || code > 126) {
      throw new Error("Code128 renderer supports printable ASCII only");
    }
    codes.push(code - 32);
  }
  const checksum = codes.reduce((sum, code, index) => sum + code * (index === 0 ? 1 : index), 0) % 103;
  codes.push(checksum, 106);

  return codes.flatMap((code) => patternToModules(CODE128_PATTERNS[code]));
}

function ean13Modules(value: string): boolean[] {
  let digits = value;
  if (!/^\d+$/.test(digits)) {
    throw new Error("EAN/UPC barcode values must contain digits only");
  }
  if (digits.length === 12) {
    digits += String(eanChecksum(digits));
  }
  if (digits.length !== 13 || eanChecksum(digits.slice(0, 12)) !== Number(digits[12])) {
    throw new Error("EAN-13 barcode must contain 12 digits plus a valid checksum");
  }

  const modules = [..."0000000000", ..."101"];
  const parity = EAN_PARITY[Number(digits[0])];
  for (let index = 1; index <= 6; index += 1) {
    const digit = Number(digits[index]);
    modules.push(...(parity[index - 1] === "L" ? EAN_L_PATTERNS[digit] : EAN_G_PATTERNS[digit]));
  }
  modules.push(..."01010");
  for (let index = 7; index < 13; index += 1) {
    modules.push(...EAN_R_PATTERNS[Number(digits[index])]);
  }
  modules.push(..."101", ..."0000000000");
  return modules.map((value) => value === "1");
}

function eanChecksum(firstTwelveDigits: string): number {
  let sum = 0;
  for (let index = 0; index < firstTwelveDigits.length; index += 1) {
    const digit = Number(firstTwelveDigits[index]);
    sum += index % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

function patternToModules(pattern: string): boolean[] {
  const modules: boolean[] = [];
  let black = true;
  for (const width of pattern) {
    for (let index = 0; index < Number(width); index += 1) {
      modules.push(black);
    }
    black = !black;
  }
  return modules;
}

function createQrMatrix(bytes: Uint8Array): boolean[][] {
  if (bytes.length > 17) {
    throw new Error("QR renderer v1 supports at most 17 UTF-8 bytes");
  }

  const codewords = qrCodewords(bytes);
  const modules: (boolean | null)[][] = Array.from(
    { length: QR_SIZE },
    () => new Array<boolean | null>(QR_SIZE).fill(null)
  );
  const functionModules = Array.from(
    { length: QR_SIZE },
    () => new Array<boolean>(QR_SIZE).fill(false)
  );
  const setFunction = (row: number, column: number, value: boolean): void => {
    if (row >= 0 && row < QR_SIZE && column >= 0 && column < QR_SIZE) {
      modules[row][column] = value;
      functionModules[row][column] = true;
    }
  };

  const drawFinder = (top: number, left: number): void => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const black =
          dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6 &&
          (dy === 0 || dy === 6 || dx === 0 || dx === 6 ||
            (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4));
        setFunction(top + dy, left + dx, black);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, QR_SIZE - 7);
  drawFinder(QR_SIZE - 7, 0);

  for (let index = 8; index < QR_SIZE - 8; index += 1) {
    if (!functionModules[6][index]) {
      setFunction(6, index, index % 2 === 0);
    }
    if (!functionModules[index][6]) {
      setFunction(index, 6, index % 2 === 0);
    }
  }
  setFunction(QR_SIZE - 8, 8, true);

  const formatBits = qrFormatBits(0x1, 0);
  for (let index = 0; index < 15; index += 1) {
    const bit = ((formatBits >>> index) & 1) !== 0;
    if (index < 6) {
      setFunction(index, 8, bit);
    } else if (index < 8) {
      setFunction(index + 1, 8, bit);
    } else if (index < 9) {
      setFunction(8, 15 - index, bit);
    } else {
      setFunction(8, 15 - index, bit);
    }
    if (index < 8) {
      setFunction(8, QR_SIZE - 1 - index, bit);
    } else {
      setFunction(8, QR_SIZE - 15 + index, bit);
    }
  }

  const allBits: boolean[] = [];
  for (const codeword of codewords) {
    for (let bit = 7; bit >= 0; bit -= 1) {
      allBits.push(((codeword >>> bit) & 1) !== 0);
    }
  }

  let bitIndex = 0;
  let upward = true;
  for (let right = QR_SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right -= 1;
    }
    for (let offset = 0; offset < QR_SIZE; offset += 1) {
      const row = upward ? QR_SIZE - 1 - offset : offset;
      for (let column = right; column >= right - 1; column -= 1) {
        if (functionModules[row][column]) {
          continue;
        }
        const dataBit = allBits[bitIndex] ?? false;
        bitIndex += 1;
        const masked = dataBit !== ((row + column) % 2 === 0);
        modules[row][column] = masked;
      }
    }
    upward = !upward;
  }

  return modules.map((row) => row.map((value) => value ?? false));
}

function qrCodewords(bytes: Uint8Array): number[] {
  const bits: boolean[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  for (const byte of bytes) {
    appendBits(bits, byte, 8);
  }
  for (let index = 0; index < Math.min(4, QR_DATA_CODEWORDS * 8 - bits.length); index += 1) {
    bits.push(false);
  }
  while (bits.length % 8 !== 0) {
    bits.push(false);
  }

  const data: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    data.push(bitsToByte(bits.slice(index, index + 8)));
  }
  const pads = [0xec, 0x11];
  let padIndex = 0;
  while (data.length < QR_DATA_CODEWORDS) {
    data.push(pads[padIndex % 2]);
    padIndex += 1;
  }
  return [...data, ...qrEcc(data)];
}

function appendBits(target: boolean[], value: number, bitCount: number): void {
  for (let bit = bitCount - 1; bit >= 0; bit -= 1) {
    target.push(((value >>> bit) & 1) !== 0);
  }
}

function bitsToByte(bits: readonly boolean[]): number {
  return bits.reduce((value, bit) => (value << 1) | (bit ? 1 : 0), 0);
}

function qrEcc(data: readonly number[]): number[] {
  const exp = new Uint16Array(512);
  const log = new Int16Array(256);
  let value = 1;
  for (let index = 0; index < 255; index += 1) {
    exp[index] = value;
    log[value] = index;
    value <<= 1;
    if ((value & 0x100) !== 0) {
      value ^= 0x11d;
    }
  }
  for (let index = 255; index < exp.length; index += 1) {
    exp[index] = exp[index - 255];
  }
  const multiply = (left: number, right: number): number => {
    if (left === 0 || right === 0) {
      return 0;
    }
    return exp[log[left] + log[right]];
  };

  let generator = [1];
  for (let index = 0; index < QR_ECC_CODEWORDS; index += 1) {
    const next = new Array<number>(generator.length + 1).fill(0);
    for (let coefficient = 0; coefficient < generator.length; coefficient += 1) {
      next[coefficient] ^= generator[coefficient];
      next[coefficient + 1] ^= multiply(generator[coefficient], exp[index]);
    }
    generator = next;
  }

  const remainder = new Array<number>(QR_ECC_CODEWORDS).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let index = 0; index < QR_ECC_CODEWORDS; index += 1) {
      remainder[index] ^= multiply(generator[index + 1], factor);
    }
  }
  return remainder;
}

function qrFormatBits(errorCorrection: number, mask: number): number {
  const data = (errorCorrection << 3) | mask;
  let remainder = data << 10;
  for (let bit = 14; bit >= 10; bit -= 1) {
    if (((remainder >>> bit) & 1) !== 0) {
      remainder ^= 0x537 << (bit - 10);
    }
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

function setBlack(
  rows: MonoRows,
  x: number,
  y: number,
  clip?: { x: number; y: number; width: number; height: number }
): void {
  const targetX = Math.trunc(x);
  const targetY = Math.trunc(y);
  if (
    clip &&
    (targetX < clip.x || targetY < clip.y ||
      targetX >= clip.x + clip.width || targetY >= clip.y + clip.height)
  ) {
    return;
  }
  if (
    targetY >= 0 && targetY < rows.length &&
    targetX >= 0 && targetX < rows[targetY].length
  ) {
    rows[targetY][targetX] = true;
  }
}

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 === 1) {
    throw new Error("Invalid base64 image data");
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes: number[] = [];
  for (let index = 0; index < normalized.length; index += 4) {
    const a = alphabet.indexOf(normalized[index]);
    const b = alphabet.indexOf(normalized[index + 1]);
    const c = normalized[index + 2] === "=" ? 0 : alphabet.indexOf(normalized[index + 2]);
    const d = normalized[index + 3] === "=" ? 0 : alphabet.indexOf(normalized[index + 3]);
    if (a < 0 || b < 0 || c < 0 || d < 0) {
      throw new Error("Invalid base64 image data");
    }
    const combined = (a << 18) | (b << 12) | (c << 6) | d;
    bytes.push((combined >>> 16) & 0xff);
    if (normalized[index + 2] !== "=") {
      bytes.push((combined >>> 8) & 0xff);
    }
    if (normalized[index + 3] !== "=") {
      bytes.push(combined & 0xff);
    }
  }
  return new Uint8Array(bytes);
}
