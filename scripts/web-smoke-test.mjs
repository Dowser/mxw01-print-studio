#!/usr/bin/env node

const baseUrl = process.env.MXW01_WEB_URL ?? "http://127.0.0.1:4173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonRequest(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const payload = await response.json();
  assert(response.ok, `${path} returned HTTP ${response.status}: ${payload.error ?? "unknown error"}`);
  return payload;
}

const health = await jsonRequest("/api/health");
assert(health.ok === true, "Local server health is not ok.");
const status = await jsonRequest("/api/status");
assert(status.connected === false || status.connected === true, "Status response has no connection state.");
const readinessResponse = await fetch(`${baseUrl}/api/readiness`);
const readiness = await readinessResponse.json();
assert([200, 503].includes(readinessResponse.status), `Unexpected readiness HTTP ${readinessResponse.status}.`);
assert(typeof readiness.ready === "boolean", "Readiness response has no ready flag.");
if (!status.connected) assert(readinessResponse.status === 503, "Disconnected printer must not report readiness.");

const importedPage = await jsonRequest("/api/webpage", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ url: baseUrl, maxCharacters: 2000 }),
});
assert(importedPage.document?.metadata?.source === "mxw01-webpage-import", "Webpage import did not return a source-tagged document.");
assert(importedPage.document.nodes?.some((node) => String(node.id).startsWith("web-body-")), "Webpage import did not return a body node.");

const batchList = await jsonRequest("/api/batch/list");
assert(Array.isArray(batchList.jobs), "Batch list response has no jobs array.");

const document = {
  schema: "mxw01.print-document",
  version: 1,
  page: {
    widthDots: 384,
    heightDots: 60,
    margins: { top: 4, right: 4, bottom: 4, left: 4 },
    media: { kind: "continuous", color: "white", labelHeightDots: 60, gapDots: 0 },
  },
  nodes: [{
    id: "smoke-text",
    kind: "text",
    text: "A long value that must wrap into more than two rows in the smoke test",
    x: 8,
    y: 8,
    width: 24,
    height: 7,
    autoHeight: true,
  }],
};

const preview = await jsonRequest("/api/preview", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ document, options: { dither: "steinberg", brightness: 128 } }),
});
const page = preview.pages?.[0];
assert(preview.canPrint === true, "Auto-height smoke document is not printable.");
assert(page?.heightDots > document.page.heightDots, "Auto-height did not grow the continuous page.");
assert(!preview.diagnostics?.some((item) => item.severity === "error"), "Auto-height preview returned an error.");

console.log(`web smoke ok: ${baseUrl} · ${page.widthDots}×${page.heightDots} dots · ${health.rendererVersion}`);
