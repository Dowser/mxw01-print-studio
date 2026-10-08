import { describe, expect, it } from "vitest";
import {
  PRINT_BATCH_SCHEMA,
  PRINT_BATCH_VERSION,
  PRINT_TEMPLATE_SCHEMA,
  PRINT_TEMPLATE_VERSION,
  batchValues,
  formatSequenceValue,
  resolveTemplateDocument,
  templateTokens,
  templateValues,
  validatePrintTemplate,
  validatePrintBatchJob,
} from "../../core/templates";
import type { PrintDocument } from "../../core/document";

const document: PrintDocument = {
  schema: "mxw01.print-document",
  version: 1,
  page: {
    widthDots: 384,
    heightDots: 120,
    margins: { top: 4, right: 4, bottom: 4, left: 4 },
  },
  nodes: [
    { id: "text", kind: "text", text: "Biljett {{ticketNumber}}", x: 4, y: 4, width: 300, height: 16 },
    { id: "code", kind: "barcode", format: "code128", value: "T-{{ticketNumber}}", x: 4, y: 30, width: 200, height: 40 },
  ],
};

describe("core/templates", () => {
  it("formats and expands deterministic sequence values", () => {
    const batch = {
      schema: PRINT_BATCH_SCHEMA,
      version: PRINT_BATCH_VERSION,
      count: 3,
      sequence: { variable: "ticketNumber", start: 7, step: 2, padding: 4, prefix: "T-" },
    } as const;

    expect(formatSequenceValue(-7, { padding: 3, prefix: "N" })).toBe("N-007");
    expect(batchValues(batch, 2)).toEqual({ ticketNumber: "T-0011" });
    expect(resolveTemplateDocument(document, batchValues(batch, 1)).nodes).toEqual([
      expect.objectContaining({ text: "Biljett T-0009" }),
      expect.objectContaining({ value: "T-T-0009" }),
    ]);
  });

  it("rejects unsafe batch counts and accepts the versioned shape", () => {
    expect(validatePrintBatchJob({ schema: PRINT_BATCH_SCHEMA, version: PRINT_BATCH_VERSION, count: 4 })).toEqual([]);
    expect(validatePrintBatchJob({ schema: PRINT_BATCH_SCHEMA, version: PRINT_BATCH_VERSION, count: 0 })).toEqual([
      expect.objectContaining({ code: "batch.count" }),
    ]);
    expect(PRINT_TEMPLATE_SCHEMA).toBe("mxw01.print-template");
    expect(PRINT_TEMPLATE_VERSION).toBe(1);
  });

  it("rejects malformed nested batch sequence values", () => {
    const diagnostics = validatePrintBatchJob({
      schema: PRINT_BATCH_SCHEMA,
      version: PRINT_BATCH_VERSION,
      count: 2,
      sequence: { variable: "ticketNumber", start: 1, step: null, padding: -1, prefix: 7 },
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "batch.sequence",
      "batch.sequence-padding",
      "batch.sequence-affix",
    ]);
  });

  it("reports undeclared template tokens", () => {
    expect(templateTokens(document)).toEqual(["ticketNumber"]);
    const diagnostics = validatePrintTemplate({
      schema: PRINT_TEMPLATE_SCHEMA,
      version: PRINT_TEMPLATE_VERSION,
      id: "ticket",
      name: "Ticket",
      document,
      variables: {},
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({ code: "template.unbound-variable", severity: "error" }),
    ]);
  });

  it("returns diagnostics instead of throwing for malformed template nodes", () => {
    expect(() => validatePrintTemplate({
      schema: PRINT_TEMPLATE_SCHEMA,
      version: PRINT_TEMPLATE_VERSION,
      id: "broken",
      name: "Broken",
      document: { ...document, nodes: null },
      variables: {},
    })).not.toThrow();
    expect(validatePrintTemplate({
      schema: PRINT_TEMPLATE_SCHEMA,
      version: PRINT_TEMPLATE_VERSION,
      id: "broken",
      name: "Broken",
      document: { ...document, nodes: [null] },
      variables: {},
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "document.node-size", severity: "error" }),
    ]));
  });

  it("applies declared template defaults", () => {
    expect(templateValues({ variables: { guest: { type: "text", defaultValue: "Gäst" } } }, {})).toEqual({ guest: "Gäst" });
  });

  it("merges per-label rows before applying the sequence value", () => {
    const batch = {
      schema: PRINT_BATCH_SCHEMA,
      version: PRINT_BATCH_VERSION,
      count: 2,
      rows: [{ guest: "Ada" }, { guest: "Grace" }],
      sequence: { variable: "ticketNumber", start: 10 },
      onError: "retry",
    } as const;
    expect(batchValues(batch, 1)).toEqual({ guest: "Grace", ticketNumber: "11" });
    expect(validatePrintBatchJob(batch)).toEqual([]);
  });
});
