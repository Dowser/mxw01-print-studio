import { describe, expect, it } from "vitest";
import type { PrintDocument } from "../../core/document";
import { layoutPrintDocument } from "../../core/documentLayout";
import { resolveTemplateDocument } from "../../core/templates";

function document(nodes: PrintDocument["nodes"], height = 60): PrintDocument {
  return {
    schema: "mxw01.print-document",
    version: 1,
    page: {
      widthDots: 384,
      heightDots: height,
      margins: { top: 4, right: 4, bottom: 4, left: 4 },
      media: { kind: "continuous", color: "white", labelHeightDots: height, gapDots: 0 },
    },
    nodes,
  };
}

describe("core/documentLayout", () => {
  it("grows a continuous page for wrapped auto-height text", () => {
    const result = layoutPrintDocument(document([
      { id: "body", kind: "text", text: "A\nB\nC", x: 8, y: 45, width: 8, height: 7, autoHeight: true },
    ]));

    expect(result.nodes[0]).toEqual(expect.objectContaining({ height: 23 }));
    expect(result.page.heightDots).toBeGreaterThan(60);
    expect(result.page.media?.labelHeightDots).toBe(result.page.heightDots);
  });

  it("keeps explicitly fixed text frames fixed", () => {
    const result = layoutPrintDocument(document([
      { id: "body", kind: "text", text: "A\nB\nC", x: 8, y: 8, width: 8, height: 7, autoHeight: false },
    ]));

    expect(result).toEqual(expect.objectContaining({ page: expect.objectContaining({ heightDots: 60 }) }));
    expect(result.nodes[0]).toEqual(expect.objectContaining({ height: 7 }));
  });

  it("lays out substituted template values before rendering", () => {
    const result = resolveTemplateDocument(document([
      { id: "body", kind: "text", text: "{{message}}", x: 8, y: 8, width: 12, height: 7, autoHeight: true },
    ]), { message: "A very long value that wraps" });

    expect(result.nodes[0].height).toBeGreaterThan(7);
    expect(result.page.heightDots).toBeGreaterThan(60);
  });

  it("grows checklist rows when an item wraps", () => {
    const result = layoutPrintDocument(document([
      {
        id: "list",
        kind: "checklist",
        items: [{ text: "A long checklist item that needs more than one line" }],
        x: 8,
        y: 8,
        width: 24,
        height: 8,
        itemHeightDots: 8,
        autoHeight: true,
      },
    ]));

    expect(result.nodes[0]).toEqual(expect.objectContaining({ itemHeightDots: expect.any(Number) }));
    expect((result.nodes[0] as { height: number }).height).toBeGreaterThan(8);
  });
});
