import type {
  ChecklistNode,
  PrintDocument,
  PrintNode,
  TextFontId,
  TextNode,
} from "./document";
import { VECTOR_TEXT_GLYPHS } from "./textGlyphs";

/** The web editor and native clients use the same bounded continuous-label layout. */
export const MAX_LAYOUT_PAGE_HEIGHT = 4000;
export const DEFAULT_LAYOUT_BOTTOM_PADDING = 12;

function isContinuousDocument(document: PrintDocument): boolean {
  return document.page.media?.kind === undefined || document.page.media.kind === "continuous";
}

function fontAdvance(fontId: TextFontId, character: string): number {
  if (fontId === "mxw-condensed") return 4;
  if (fontId === "mxw-wide") return 11;
  if (fontId === "mxw-5x7") return 6;
  const glyph = VECTOR_TEXT_GLYPHS[character.toUpperCase()] ?? VECTOR_TEXT_GLYPHS["?"];
  if (fontId === "mxw-proportional") return Math.ceil(glyph.width) + 1;
  return 6;
}

function lineWidth(line: string, fontId: TextFontId, scale: number): number {
  const characters = [...line];
  if (characters.length === 0) return 0;
  return characters.reduce(
    (width, character, index) => width + fontAdvance(fontId, character) * scale - (index === characters.length - 1 ? scale : 0),
    0,
  );
}

function splitToken(token: string, maxWidth: number, fontId: TextFontId, scale: number): readonly string[] {
  const chunks: string[] = [];
  let current = "";
  for (const character of [...token]) {
    const candidate = `${current}${character}`;
    if (current && lineWidth(candidate, fontId, scale) > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current || chunks.length === 0) chunks.push(current);
  return chunks;
}

function wrappedLineCount(line: string, maxWidth: number, fontId: TextFontId, scale: number): number {
  if (line.length === 0) return 1;
  const tokens = line.match(/\s+|\S+/gu) ?? [line];
  let count = 0;
  let current = "";
  for (const token of tokens) {
    const candidate = `${current}${token}`;
    if (current && lineWidth(candidate, fontId, scale) > maxWidth) {
      count += 1;
      current = token.replace(/^\s+/u, "");
    } else {
      current = candidate;
    }
    if (lineWidth(current, fontId, scale) > maxWidth) {
      const chunks = splitToken(current, maxWidth, fontId, scale);
      count += Math.max(0, chunks.length - 1);
      current = chunks[chunks.length - 1] ?? "";
    }
  }
  return count + 1;
}

export function requiredTextHeight(node: Pick<TextNode, "text" | "width" | "fontId" | "fontSizeDots" | "lineHeightDots">): number {
  const scale = Math.max(1, Math.trunc(Number(node.fontSizeDots) || 1));
  const fontId = node.fontId ?? "mxw-vector";
  const lineHeight = Math.max(1, Math.trunc(Number(node.lineHeightDots) || 8 * scale));
  const width = Math.max(1, Math.trunc(Number(node.width) || 1));
  const lineCount = String(node.text ?? "")
    .split("\n")
    .reduce((count, line) => count + wrappedLineCount(line, width, fontId, scale), 0);
  return Math.max(1, 7 * scale + Math.max(0, lineCount - 1) * lineHeight);
}

function checklistLayout(node: ChecklistNode): { height: number; itemHeightDots: number } {
  const scale = Math.max(1, Math.trunc(node.fontSizeDots ?? 1));
  const baseItemHeight = Math.max(8, Math.trunc(node.itemHeightDots ?? 10 * scale));
  const rowHeight = node.items.reduce((height, item) => Math.max(height, requiredTextHeight({
    text: `${item.checked ? "[X]" : "[ ]"} ${item.text}`,
    width: node.width,
    fontId: node.fontId,
    fontSizeDots: node.fontSizeDots,
    lineHeightDots: 8 * scale,
  })), baseItemHeight);
  return {
    height: Math.max(1, rowHeight * node.items.length),
    itemHeightDots: rowHeight,
  };
}

function minimumPageHeight(node: Pick<PrintNode, "y" | "height">, page: PrintDocument["page"]): number {
  const bottomPadding = Math.max(DEFAULT_LAYOUT_BOTTOM_PADDING, Number(page.margins?.bottom) || 0);
  return Math.max(1, Math.trunc(node.y) + Math.max(1, Math.trunc(node.height)) + bottomPadding);
}

function pageWithHeight(document: PrintDocument, height: number): PrintDocument["page"] {
  const nextHeight = Math.max(1, Math.min(MAX_LAYOUT_PAGE_HEIGHT, Math.trunc(height)));
  return {
    ...document.page,
    heightDots: nextHeight,
    ...(document.page.media?.kind === "continuous"
      ? { media: { ...document.page.media, labelHeightDots: nextHeight } }
      : {}),
  };
}

/**
 * Expands editor-managed nodes before validation/rendering.
 * Fixed-height nodes remain fixed when autoHeight is explicitly false.
 */
export function layoutPrintDocument(document: PrintDocument): PrintDocument {
  if (!document || typeof document !== "object" || !document.page || typeof document.page !== "object" || !Array.isArray(document.nodes)) return document;

  let page = document.page;
  let changed = false;
  const nodes = document.nodes.map((node) => {
    if (!node || typeof node !== "object") return node;
    let nextNode = node;
    if ((node.kind === "text" || node.kind === "fortune") && node.autoHeight !== false) {
      const requiredHeight = requiredTextHeight(node);
      if (requiredHeight > node.height) nextNode = { ...node, height: requiredHeight };
    } else if (node.kind === "checklist" && node.autoHeight !== false) {
      const layout = checklistLayout(node);
      if (layout.height > node.height || layout.itemHeightDots !== (node.itemHeightDots ?? layout.itemHeightDots)) {
        nextNode = { ...node, height: Math.max(node.height, layout.height), itemHeightDots: layout.itemHeightDots };
      }
    }

    if (nextNode !== node) {
      changed = true;
      if (isContinuousDocument({ ...document, page })) {
        const requestedHeight = minimumPageHeight(nextNode, page);
        if (requestedHeight > page.heightDots) page = pageWithHeight({ ...document, page }, requestedHeight);
      } else if (nextNode.y + nextNode.height > page.heightDots) {
        nextNode = { ...nextNode, height: Math.max(1, page.heightDots - nextNode.y) };
      }
    }
    return nextNode;
  });

  if (!changed && page === document.page) return document;
  return { ...document, page, nodes };
}
