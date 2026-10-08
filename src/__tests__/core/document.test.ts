import { describe, expect, it } from "vitest";
import {
  PRINT_DOCUMENT_SCHEMA,
  PRINT_DOCUMENT_VERSION,
  validatePrintDocument,
} from "../../core/document";
import type { PrintDocument } from "../../core/document";

const document: PrintDocument = {
  schema: PRINT_DOCUMENT_SCHEMA,
  version: PRINT_DOCUMENT_VERSION,
  page: {
    widthDots: 384,
    heightDots: 120,
    margins: { top: 4, right: 4, bottom: 4, left: 4 },
  },
  nodes: [
    {
      id: "title",
      kind: "text",
      x: 4,
      y: 4,
      width: 376,
      height: 24,
      text: "MXW01",
    },
  ],
};

describe("core/document", () => {
  it("accepts a valid versioned document", () => {
    expect(validatePrintDocument(document)).toEqual([]);
  });

  it("reports schema, page and node errors", () => {
    const diagnostics = validatePrintDocument({
      ...document,
      schema: "wrong.schema" as typeof PRINT_DOCUMENT_SCHEMA,
      page: { ...document.page, widthDots: 0 },
      nodes: [{ ...document.nodes[0], width: -1 }],
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "document.schema",
      "document.page-size",
      "document.node-size",
    ]);
  });

  it("rejects unsafe shapes and duplicate ids before rendering", () => {
    const diagnostics = validatePrintDocument({
      ...document,
      page: { ...document.page, widthDots: Number.NaN },
      nodes: [
        { ...document.nodes[0], id: "same", x: 0 },
        { ...document.nodes[0], id: "same", kind: "unsupported" },
      ],
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "document.page-size",
      "document.duplicate-node-id",
      "document.node-kind",
    ]);
  });

  it("validates barcode, QR and image payloads", () => {
    const diagnostics = validatePrintDocument({
      ...document,
      nodes: [
        { ...document.nodes[0], kind: "barcode", format: "ean13", value: "123" },
        { ...document.nodes[0], id: "qr", kind: "qr", value: "01234567890123456789" },
        {
          ...document.nodes[0],
          id: "image",
          kind: "image",
          image: { width: 1, height: 1, dataBase64: "AAAA" },
        },
      ],
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "document.barcode-value",
      "document.qr-value",
      "document.image-data",
    ]);
  });

  it("accepts media, page frames, checklists and deterministic font ids", () => {
    const diagnostics = validatePrintDocument({
      ...document,
      page: {
        ...document.page,
        media: { kind: "continuous", color: "white", labelHeightDots: 120, gapDots: 0, profileId: "mxw01-continuous-white" },
        frame: { insetDots: 2, thicknessDots: 1, style: "double" },
      },
      nodes: [
        { id: "list", kind: "checklist", items: [{ text: "Kaffe", checked: true }], x: 4, y: 4, width: 200, height: 16, fontId: "mxw-serif" },
        { id: "fortune", kind: "fortune", text: "Lycka till", x: 4, y: 30, width: 200, height: 16, fontId: "mxw-wide" },
        { id: "icon", kind: "icon", iconId: "fa-star", x: 280, y: 4, width: 24, height: 24 },
      ],
    });

    expect(diagnostics).toEqual([]);
  });

  it("rejects a frame that cannot fit inside the page", () => {
    const diagnostics = validatePrintDocument({
      ...document,
      page: { ...document.page, heightDots: 40, frame: { insetDots: 18, thicknessDots: 3 } },
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({ code: "document.frame-out-of-bounds", severity: "error" }),
    ]);
  });

  it("rejects unsupported black-mark media", () => {
    const diagnostics = validatePrintDocument({
      ...document,
      page: { ...document.page, media: { kind: "black-mark", color: "white", labelHeightDots: 120, gapDots: 8 } },
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({ code: "document.media-black-mark-unsupported", severity: "error" }),
    ]);
  });

  it("blocks die-cut gaps until transport feed support exists", () => {
    const diagnostics = validatePrintDocument({
      ...document,
      page: {
        ...document.page,
        heightDots: 200,
        media: { kind: "die-cut", color: "yellow", labelHeightDots: 200, gapDots: 8, profileId: "mxw01-die-cut-yellow" },
      },
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({ code: "document.media-gap-unsupported", severity: "error" }),
    ]);
  });

  it("rejects null media and frame values at the boundary", () => {
    const diagnostics = validatePrintDocument({
      ...document,
      page: { ...document.page, media: null, frame: null },
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "document.media",
      "document.frame",
    ]);
  });
});
