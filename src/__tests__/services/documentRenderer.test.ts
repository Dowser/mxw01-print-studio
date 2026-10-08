import { describe, expect, it } from "vitest";
import {
  DOCUMENT_RENDERER_VERSION,
  renderPrintDocument,
} from "../../services/documentRenderer";
import {
  PRINT_DOCUMENT_SCHEMA,
  PRINT_DOCUMENT_VERSION,
} from "../../core/document";
import type { PrintDocument } from "../../core/document";
import type { PrinterProfile } from "../../core/print-types";
import { unpackMonoRaster } from "../../services/raster";

function profile(width: number): PrinterProfile {
  return {
    id: `test-${width}`,
    protocolRevision: "test-v1",
    widthDots: width,
    bytesPerRow: Math.ceil(width / 8),
    minimumRows: 1,
    bitOrder: "lsb-first",
    blackIsOne: true,
    dataChunkSize: Math.ceil(width / 8),
    dataChunkDelayMs: 0,
    capabilities: {
      status: false,
      intensity: false,
      raster: true,
      cancellation: false,
      maxPagesPerJob: 1,
    },
  };
}

function document(
  width: number,
  height: number,
  nodes: PrintDocument["nodes"]
): PrintDocument {
  return {
    schema: PRINT_DOCUMENT_SCHEMA,
    version: PRINT_DOCUMENT_VERSION,
    page: {
      widthDots: width,
      heightDots: height,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    nodes,
  };
}

function hex(data: Uint8Array): string {
  return Array.from(data, (byte) => byte.toString(16).padStart(2, "0")).join(" ");
}

describe("services/documentRenderer", () => {
  it("renders the deterministic 5x7 text font", () => {
    const result = renderPrintDocument(
      document(16, 8, [
        { id: "title", kind: "text", text: "A", x: 0, y: 0, width: 5, height: 7, fontId: "mxw-5x7" },
      ]),
      profile(16)
    );

    expect(result.rendererVersion).toBe(DOCUMENT_RENDERER_VERSION);
    expect(result.diagnostics).toEqual([]);
    expect(result.canPrint).toBe(true);
    expect(result.documentFingerprint).toMatch(/^fnv1a32-[0-9a-f]{8}$/);
    expect(hex(result.pages[0].data)).toBe(
      "0e 00 11 00 11 00 1f 00 11 00 11 00 11 00 00 00"
    );
  });

  it("renders default text with high-resolution vector sampling", () => {
    const result = renderPrintDocument(
      document(40, 32, [
        {
          id: "vector-title",
          kind: "text",
          text: "A",
          x: 2,
          y: 2,
          width: 28,
          height: 28,
          fontId: "mxw-vector",
          fontSizeDots: 3,
        },
      ]),
      profile(40)
    );

    const rows = unpackMonoRaster(result.pages[0]);
    const occupiedRows = rows.filter((row) => row.some(Boolean));
    const rowWidths = occupiedRows.map((row) => row.filter(Boolean).length);
    expect(result.diagnostics).toEqual([]);
    expect(result.canPrint).toBe(true);
    expect(occupiedRows.length).toBeGreaterThan(12);
    expect(new Set(rowWidths).size).toBeGreaterThan(4);
  });

  it("renders Font Awesome paths at native dot resolution", () => {
    const iconIds = [
      "fa-star", "fa-heart", "fa-check", "fa-xmark", "fa-print", "fa-camera", "fa-image", "fa-ticket",
      "fa-tag", "fa-circle-info", "fa-triangle-exclamation", "fa-bell", "fa-user", "fa-calendar-check",
      "fa-barcode", "fa-qrcode",
    ] as const;

    for (const iconId of iconIds) {
      const result = renderPrintDocument(
        document(64, 64, [{ id: iconId, kind: "icon", iconId, x: 8, y: 8, width: 48, height: 48 }]),
        profile(64)
      );
      const rows = unpackMonoRaster(result.pages[0]);
      const occupiedRows = rows.filter((row) => row.some(Boolean));
      expect(result.diagnostics, iconId).toEqual([]);
      expect(occupiedRows.length, iconId).toBeGreaterThan(16);
    }

    const star = renderPrintDocument(
      document(64, 64, [{ id: "star", kind: "icon", iconId: "fa-star", x: 8, y: 8, width: 48, height: 48 }]),
      profile(64)
    );
    const starRows = unpackMonoRaster(star.pages[0]).map((row) => row.filter(Boolean).length).filter((count) => count > 0);
    expect(new Set(starRows).size).toBeGreaterThan(8);
  });

  it("wraps text, scales it down when possible, and warns when it still overflows", () => {
    const wrapped = renderPrintDocument(
      document(16, 16, [
        { id: "wrapped", kind: "text", text: "AB", x: 0, y: 0, width: 6, height: 16 },
      ]),
      profile(16)
    );

    expect(wrapped.diagnostics).toEqual([]);
    expect(wrapped.canPrint).toBe(true);
    expect(wrapped.pages[0].data.slice(0, 2).some((byte) => byte !== 0)).toBe(true);
    expect(wrapped.pages[0].data.slice(16, 18).some((byte) => byte !== 0)).toBe(true);

    const scaled = renderPrintDocument(
      document(16, 8, [
        { id: "scaled", kind: "text", text: "A", x: 0, y: 0, width: 6, height: 8, fontSizeDots: 3 },
      ]),
      profile(16)
    );
    expect(scaled.diagnostics).toEqual([]);

    const scaledToFitWidth = renderPrintDocument(
      document(16, 30, [
        { id: "narrow", kind: "text", text: "A", x: 0, y: 0, width: 6, height: 30, fontSizeDots: 3 },
      ]),
      profile(16)
    );
    expect(scaledToFitWidth.diagnostics).toEqual([]);

    const overflow = renderPrintDocument(
      document(16, 7, [
        { id: "overflow", kind: "fortune", text: "A\nB", x: 0, y: 0, width: 6, height: 7, autoHeight: false },
      ]),
      profile(16)
    );
    expect(overflow.canPrint).toBe(false);
    expect(overflow.diagnostics).toEqual([
      expect.objectContaining({ code: "render.text-overflow", severity: "warning", nodeId: "overflow" }),
    ]);
  });

  it("renders RGBA image nodes with deterministic nearest-neighbour scaling", () => {
    const result = renderPrintDocument(
      document(8, 2, [
        {
          id: "image",
          kind: "image",
          x: 0,
          y: 0,
          width: 2,
          height: 2,
          image: {
            width: 2,
            height: 2,
            dataBase64: "AAAA////////////AAAA/w==",
          },
        },
      ]),
      profile(8)
    );

    expect(result.diagnostics).toEqual([]);
    expect(hex(result.pages[0].data)).toBe("01 02");
  });

  it("renders Code 128 and QR version 1-L nodes", () => {
    const barcode = renderPrintDocument(
      document(64, 10, [
        {
          id: "barcode",
          kind: "barcode",
          format: "code128",
          value: "A",
          x: 0,
          y: 0,
          width: 64,
          height: 10,
        },
      ]),
      profile(64)
    );
    const barcodeRow = "27 02 09 87 a0 c3 e1 cb";
    expect(hex(barcode.pages[0].data)).toBe(
      Array.from({ length: 10 }, () => barcodeRow).join(" ")
    );

    const qr = renderPrintDocument(
      document(32, 29, [
        {
          id: "qr",
          kind: "qr",
          value: "A",
          x: 0,
          y: 0,
          width: 29,
          height: 29,
        },
      ]),
      profile(32)
    );
    expect(qr.diagnostics).toEqual([]);
    expect(qr.pages[0].data).toHaveLength(29 * 4);
    const qrBytes = hex(qr.pages[0].data).split(" ");
    expect(qrBytes.slice(0, 16)).toEqual(new Array(16).fill("00"));
    expect(qrBytes.slice(16, 22).join(" ")).toBe("f0 a7 fd 01 10 e4");
  });

  it("returns a renderer diagnostic instead of producing an oversized QR", () => {
    const result = renderPrintDocument(
      document(32, 29, [
        {
          id: "qr",
          kind: "qr",
          value: "This value is longer than version one",
          x: 0,
          y: 0,
          width: 29,
          height: 29,
        },
      ]),
      profile(32)
    );

    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: "document.qr-value", severity: "error", nodeId: "qr" }),
    ]);
    expect(result.pages).toEqual([]);
  });

  it("returns diagnostics instead of throwing for non-finite document values", () => {
    const result = renderPrintDocument({
      ...document(16, 8, []),
      page: { widthDots: Number.NaN, heightDots: 8, margins: { top: 0, right: 0, bottom: 0, left: 0 } },
    } as unknown as PrintDocument, profile(16));

    expect(result.canPrint).toBe(false);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "document.page-size", severity: "error" }),
      expect.objectContaining({ code: "document.fingerprint", severity: "error" }),
    ]));
  });

  it("blocks print when a document has a warning or no printable objects", () => {
    const outside = renderPrintDocument(
      {
        ...document(16, 8, [
          { id: "title", kind: "text", text: "A", x: 0, y: 0, width: 5, height: 7 },
        ]),
        page: { widthDots: 16, heightDots: 8, margins: { top: 2, right: 0, bottom: 0, left: 0 } },
      },
      profile(16)
    );
    expect(outside.canPrint).toBe(false);
    expect(outside.diagnostics).toEqual([
      expect.objectContaining({ code: "document.node-outside-margins", severity: "warning" }),
    ]);

    const empty = renderPrintDocument(document(16, 8, []), profile(16));
    expect(empty.canPrint).toBe(false);
    expect(empty.diagnostics).toEqual([
      expect.objectContaining({ code: "document.empty", severity: "warning" }),
    ]);
  });

  it("renders page frames, checklist rows and alternate bundled fonts", () => {
    const result = renderPrintDocument(
      {
        ...document(48, 32, [
          { id: "list", kind: "checklist", items: [{ text: "OK", checked: true }, { text: "JA" }], x: 4, y: 4, width: 40, height: 20, itemHeightDots: 10 },
          { id: "wide", kind: "text", text: "A", x: 4, y: 24, width: 20, height: 7, fontId: "mxw-wide" },
        ]),
        page: { widthDots: 48, heightDots: 32, margins: { top: 0, right: 0, bottom: 0, left: 0 }, frame: { insetDots: 1, thicknessDots: 1, style: "dashed" } },
      },
      profile(48)
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.canPrint).toBe(true);
    expect(result.pages[0].data.some((byte) => byte !== 0)).toBe(true);
  });
});
