#!/usr/bin/env node

import { createServer } from "node:http";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { mkdir, readFile, rename, rmdir, unlink, writeFile } from "node:fs/promises";
import { rmdirSync, unlinkSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOCUMENT_RENDERER_VERSION,
  MXW01_PRINTER_PROFILE,
  NodeBluetoothAdapter,
  ThermalPrinterClient,
  batchValues,
  fingerprintPrintDocument,
  renderPrintDocument,
  resolveTemplateDocument,
  findMediaProfile,
  validatePrintBatchJob,
  validatePrintDocument,
  templateTokens,
} from "../dist/index.js";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webRoot = resolve(projectRoot, "web");
const batchStateDirectory = resolve(projectRoot, "output");
const batchStatePath = resolve(batchStateDirectory, "local-web-batch-state.json");
const batchStateLockPath = resolve(batchStateDirectory, "local-web-batch-state.lock");
const defaultHost = "127.0.0.1";
const defaultPort = 4173;
// Leaves room for JSON/base64 overhead around the core's 4 MiB RGBA limit.
const maxBodyBytes = 6 * 1024 * 1024;
const maxBatchCount = 1000;
const batchJobTtlMs = 30 * 60 * 1000;
const batchJobRetentionMs = 24 * 60 * 60 * 1000;
const webpageFetchTimeoutMs = 12_000;
const webpageMaxBytes = 2 * 1024 * 1024;
const webpageMaxRedirects = 3;

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument?.startsWith("--")) {
    args.set(argument.slice(2), process.argv[index + 1] ?? true);
    index += 1;
  }
}

const host = String(args.get("host") || defaultHost);
const port = Number(args.get("port") || defaultPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid port: ${port}`);
}
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  throw new Error("MXW01 Local Terminal binds to loopback only; omit --host or use 127.0.0.1.");
}

function assertLocalOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) {
    return;
  }
  const loopbackOrigins = new Set([
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    `http://[::1]:${port}`,
  ]);
  if (!loopbackOrigins.has(origin)) {
    throw new HttpError(403, "Förfrågan kommer från en otillåten webbadress.");
  }
}

function requireJsonContentType(request) {
  const contentType = request.headers["content-type"] ?? "";
  if (contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new HttpError(415, "API-rutten kräver Content-Type: application/json.");
  }
}

function isPrivateAddress(address) {
  const ipVersion = isIP(address);
  if (ipVersion === 4) {
    const octets = address.split(".").map(Number);
    const [first, second] = octets;
    return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168) || (first === 100 && second >= 64 && second <= 127) || (first === 198 && (second === 18 || second === 19)) || first >= 224;
  }
  if (ipVersion === 6) {
    const normalized = address.toLowerCase();
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.");
  }
  return true;
}

async function assertSafeWebpageUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_error) {
    throw new HttpError(422, "Webbadressen är ogiltig.");
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new HttpError(422, "Endast http- och https-adresser utan inloggningsuppgifter stöds.");
  }
  const isOwnLoopback = ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname) && Number(parsed.port || (parsed.protocol === "https:" ? 443 : 80)) === port;
  if (isOwnLoopback) return parsed;
  let addresses;
  try {
    addresses = (await lookup(parsed.hostname, { all: true, verbatim: true })).map((entry) => entry.address);
  } catch (_error) {
    throw new HttpError(422, "Webbadressens värd kunde inte hittas.");
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new HttpError(403, "Webbsidesimport blockerar lokala och privata nätverksadresser.");
  }
  return parsed;
}

function decodeHtmlEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/giu, (entity, name) => {
    if (name.toLowerCase().startsWith("#x")) return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    if (name.startsWith("#")) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
    return named[name.toLowerCase()] ?? entity;
  });
}

function htmlText(html) {
  const blockTags = /<\/?(?:address|article|aside|blockquote|br|dd|div|dl|dt|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)[^>]*>/giu;
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/gu, " ")
    .replace(/<\s*(?:script|style|noscript|template|svg)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|noscript|template|svg)\s*>/giu, " ")
    .replace(blockTags, "\n")
    .replace(/<[^>]+>/gu, " ");
  return decodeHtmlEntities(withoutNoise)
    .replace(/\u00a0/gu, " ")
    .split(/\r?\n/gu)
    .map((line) => line.replace(/[ \t]+/gu, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function firstHtmlMatch(html, expression) {
  const match = expression.exec(html);
  return match?.[1] ? decodeHtmlEntities(match[1].replace(/<[^>]+>/gu, " ").trim()) : "";
}

function splitWebpageText(value, maxLength = 1800) {
  const chunks = [];
  let remaining = value.trim();
  while (remaining.length > maxLength) {
    const candidate = remaining.slice(0, maxLength + 1);
    const boundary = Math.max(candidate.lastIndexOf("\n"), candidate.lastIndexOf(" "));
    const splitAt = boundary > Math.floor(maxLength * 0.6) ? boundary : maxLength;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks.length ? chunks : [""];
}

function documentFromWebpage({ url, html, title, maxCharacters = 14000 }) {
  const description = firstHtmlMatch(html, /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["'][^>]*>/iu);
  const content = htmlText(html).replace(/\{\{/gu, "{ {").replace(/\}\}/gu, "} }").slice(0, maxCharacters);
  const bodyText = content || description || "Webbsidan innehåller ingen läsbar text.";
  const safeTitle = (title || firstHtmlMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/iu) || url).slice(0, 256);
  const bodyChunks = splitWebpageText(bodyText);
  const bodyStartY = 80;
  const bodyBlockHeight = 480;
  const nodes = [
    { id: "web-title", kind: "text", text: safeTitle, x: 24, y: 18, width: 336, height: 18, autoHeight: true, fontId: "mxw-bold", fontSizeDots: 2, align: "center", lineHeightDots: 16 },
    { id: "web-url", kind: "text", text: url, x: 24, y: 47, width: 336, height: 12, autoHeight: true, fontId: "mxw-condensed", fontSizeDots: 1, align: "center" },
    { id: "web-rule", kind: "rule", x: 24, y: 67, width: 336, height: 2, thicknessDots: 2 },
    ...bodyChunks.map((chunk, index) => ({
      id: `web-body-${index + 1}`,
      kind: "text",
      text: chunk,
      x: 24,
      y: bodyStartY + index * bodyBlockHeight,
      width: 336,
      height: bodyBlockHeight - 20,
      autoHeight: true,
      fontId: "mxw-proportional",
      fontSizeDots: 1,
      lineHeightDots: 9,
    })),
  ];
  const pageHeight = Math.min(4000, bodyStartY + bodyChunks.length * bodyBlockHeight + 20);
  return {
    schema: "mxw01.print-document",
    version: 1,
    page: {
      widthDots: 384,
      heightDots: pageHeight,
      margins: { top: 12, right: 16, bottom: 12, left: 16 },
      media: { kind: "continuous", color: "white", labelHeightDots: pageHeight, gapDots: 0, profileId: "mxw01-continuous-white" },
    },
    nodes,
    metadata: { source: "mxw01-webpage-import", url, title: safeTitle },
  };
}

async function fetchWebpageDocument(rawUrl, maxCharacters) {
  let url = rawUrl;
  for (let redirect = 0; redirect <= webpageMaxRedirects; redirect += 1) {
    const parsed = await assertSafeWebpageUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), webpageFetchTimeoutMs);
    let response;
    try {
      response = await fetch(parsed, {
        redirect: "manual",
        signal: controller.signal,
        headers: { accept: "text/html,application/xhtml+xml", "user-agent": "MXW01-Local-Terminal/1.0" },
      });
    } catch (error) {
      if (error?.name === "AbortError") throw new HttpError(504, "Webbsidan svarade inte inom tidsgränsen.");
      throw new HttpError(502, `Webbsidan kunde inte hämtas: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      clearTimeout(timer);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === webpageMaxRedirects) throw new HttpError(502, "Webbsidan hade för många omdirigeringar.");
      url = new URL(location, parsed).href;
      continue;
    }
    if (!response.ok) throw new HttpError(502, `Webbsidan svarade med HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/iu.test(contentType)) throw new HttpError(415, "Adressen innehåller inte en HTML-sida.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > webpageMaxBytes) throw new HttpError(413, "Webbsidan är större än 2 MB och kan inte importeras lokalt.");
    const html = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const title = firstHtmlMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/iu);
    return { url: parsed.href, title, document: documentFromWebpage({ url: parsed.href, html, title, maxCharacters }) };
  }
  throw new HttpError(502, "Webbsidan kunde inte hämtas.");
}

const adapter = new NodeBluetoothAdapter();
const client = new ThermalPrinterClient(adapter);
let connectPromise = null;
let printInFlight = false;
let activePrintPromise = null;
let lastProgress = null;
let lastError = null;
const batchJobs = new Map();
let activeBatchLease = null;
let batchStateWrite = Promise.resolve();
let batchStateHealthy = true;
let batchStateRecoveryRequired = false;
let batchStateError = null;
let batchStateLockHeld = false;
let statusRefreshPromise = null;

async function acquireBatchStateLock() {
  await mkdir(batchStateDirectory, { recursive: true });
  try {
    await mkdir(batchStateLockPath);
    await writeFile(resolve(batchStateLockPath, "pid"), `${process.pid}\n`, { encoding: "utf8", mode: 0o600 });
    batchStateLockHeld = true;
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    let ownerPid = null;
    try {
      ownerPid = Number.parseInt(await readFile(resolve(batchStateLockPath, "pid"), "utf8"), 10);
    } catch (_readError) {
      throw new Error("En annan MXW01-server använder batchstatusen; låsfilens ägare kunde inte läsas.");
    }
    if (!Number.isInteger(ownerPid) || ownerPid <= 0) {
      throw new Error("En annan MXW01-server använder batchstatusen; låsfilen har ett ogiltigt process-ID.");
    }
    try {
      process.kill(ownerPid, 0);
      throw new Error("En annan MXW01-server använder batchstatusen; starta inte två instanser samtidigt.");
    } catch (probeError) {
      if (probeError?.code !== "ESRCH") throw probeError;
      try {
        await unlink(resolve(batchStateLockPath, "pid"));
      } catch (unlinkError) {
        if (unlinkError?.code !== "ENOENT") throw unlinkError;
      }
      await rmdir(batchStateLockPath);
      return acquireBatchStateLock();
    }
  }
}

async function releaseBatchStateLock() {
  if (!batchStateLockHeld) return;
  batchStateLockHeld = false;
  try {
    try {
      await unlink(resolve(batchStateLockPath, "pid"));
    } catch (unlinkError) {
      if (unlinkError?.code !== "ENOENT") throw unlinkError;
    }
    await rmdir(batchStateLockPath);
  } catch (error) {
    if (error?.code !== "ENOENT") console.error(`[web] kunde inte släppa batchstatuslåset: ${error.message}`);
  }
}

process.once("exit", () => {
  if (!batchStateLockHeld) return;
  try {
    unlinkSync(resolve(batchStateLockPath, "pid"));
    rmdirSync(batchStateLockPath);
  } catch (_error) {
    // Best effort only; the next process can recover a stale lock by PID.
  }
});

function persistedBatchState() {
  return {
    version: 1,
    jobs: [...batchJobs.entries()],
    lease: activeBatchLease,
  };
}

function persistBatchState() {
  const serialized = JSON.stringify(persistedBatchState());
  const temporaryPath = `${batchStatePath}.${process.pid}.tmp`;
  batchStateWrite = batchStateWrite
    .catch(() => undefined)
    .then(async () => {
      await mkdir(batchStateDirectory, { recursive: true });
      await writeFile(temporaryPath, serialized, { encoding: "utf8", mode: 0o600 });
      await rename(temporaryPath, batchStatePath);
    })
    .then(() => {
      batchStateHealthy = true;
      batchStateError = null;
    })
    .catch((error) => {
      batchStateHealthy = false;
      batchStateError = error instanceof Error ? error.message : String(error);
      console.error(`[web] kunde inte spara batchstatus: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    });
  return batchStateWrite;
}

async function loadBatchState() {
  try {
    const raw = await readFile(batchStatePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.jobs)) throw new Error("ogiltigt batchstatusformat");
    let recovered = false;
    let invalidEntry = false;
    for (const entry of parsed.jobs) {
      if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || !entry[1] || typeof entry[1] !== "object") {
        invalidEntry = true;
        continue;
      }
      const job = entry[1];
      if (typeof job.jobId !== "string" || job.jobId !== entry[0] || !Number.isInteger(job.count) || job.count < 1 || job.count > maxBatchCount || !Number.isInteger(job.nextIndex) || job.nextIndex < 0 || !Number.isFinite(job.updatedAt) || !["printing", "ready", "complete", "cancelled", "unknown", "expired"].includes(job.state)) {
        invalidEntry = true;
        continue;
      }
      if (job.state === "printing") {
        job.state = "unknown";
        job.updatedAt = Date.now();
        recovered = true;
      }
      batchJobs.set(entry[0], job);
    }
    if (invalidEntry) throw new Error("batchstatusen innehåller en ogiltig jobbpost");
    const persistedLease = parsed.lease;
    if (
      persistedLease &&
      typeof persistedLease.jobId === "string" &&
      Number.isFinite(persistedLease.expiresAt) &&
      persistedLease.expiresAt > Date.now() &&
      batchJobs.get(persistedLease.jobId)?.state === "ready"
    ) {
      activeBatchLease = persistedLease;
    }
    if (recovered) await persistBatchState();
  } catch (error) {
    if (error?.code === "ENOENT") {
      await persistBatchState();
    } else {
      batchJobs.clear();
      activeBatchLease = null;
      batchStateRecoveryRequired = true;
      batchStateError = error instanceof Error ? error.message : String(error);
      console.error(`[web] kunde inte läsa batchstatus: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

await acquireBatchStateLock();
const batchStateReady = loadBatchState();

const statusTranslations = new Map([
  ["Ready to connect printer", "Redo att ansluta skrivare"],
  ["Printer disconnected", "Skrivaren är frånkopplad"],
  ["Printer connected", "Skrivaren är ansluten"],
  ["Printer connected; status unavailable", "Skrivaren är ansluten · status kunde inte läsas ännu"],
  ["Printer not connected", "Skrivaren är inte ansluten"],
  ["Status updated", "Status uppdaterad"],
  ["Printer state updated", "Skrivarstatus uppdaterad"],
]);

client.on("printProgress", (event) => {
  lastProgress = {
    phase: event.phase ?? "unknown",
    progress: event.progress,
    sentBytes: event.sentBytes ?? 0,
    totalBytes: event.totalBytes ?? 0,
  };
});

client.on("error", (error) => {
  lastError = error.message;
});

client.on("connected", () => {
  lastError = null;
  lastProgress = null;
});

client.on("disconnected", () => {
  lastProgress = null;
});

function currentStatus() {
  const device = client.connectedDevice;
  return {
    ok: true,
    connected: client.isConnected,
    printing: client.isPrinting,
    statusMessage: statusTranslations.get(client.statusMessage) ?? (client.statusMessage || "Redo"),
    device: device ? { id: device.id, name: device.name ?? "MXW01" } : null,
    printerState: client.printerState,
    statusVerified: client.statusVerified,
    printReady: client.isPrintReady,
    progress: lastProgress,
    error: lastError,
    profile: {
      id: MXW01_PRINTER_PROFILE.id,
      widthDots: MXW01_PRINTER_PROFILE.widthDots,
      mediaWidthMm: MXW01_PRINTER_PROFILE.mediaWidthMm,
      minimumRows: MXW01_PRINTER_PROFILE.minimumRows,
    },
    rendererVersion: DOCUMENT_RENDERER_VERSION,
    batchState: {
      healthy: batchStateHealthy,
      recoveryRequired: batchStateRecoveryRequired,
      error: batchStateError,
    },
  };
}

async function readJsonBody(request) {
  request.setTimeout(15_000, () => request.destroy());
  const contentLength = Number(request.headers["content-length"] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    throw new HttpError(413, "Förfrågan är för stor.");
  }
  let received = 0;
  const chunks = [];
  for await (const chunk of request) {
    received += chunk.length;
    if (received > maxBodyBytes) {
      throw new HttpError(413, "Förfrågan är för stor.");
    }
    chunks.push(chunk);
  }

  if (received === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (_error) {
    throw new HttpError(400, "Förfrågan innehåller ogiltig JSON.");
  }
}

function cleanBatchJobs() {
  const cutoff = Date.now() - batchJobTtlMs;
  const retentionCutoff = Date.now() - batchJobRetentionMs;
  let changed = false;
  for (const [jobId, job] of batchJobs) {
    if (job.updatedAt < retentionCutoff && ["complete", "cancelled", "expired"].includes(job.state)) {
      batchJobs.delete(jobId);
      changed = true;
      continue;
    }
    if (job.updatedAt < cutoff && !["complete", "cancelled", "unknown", "expired"].includes(job.state)) {
      job.state = job.state === "printing" ? "unknown" : "expired";
      job.updatedAt = Date.now();
      changed = true;
    }
  }
  if (activeBatchLease && activeBatchLease.expiresAt < Date.now()) {
    const expired = batchJobs.get(activeBatchLease.jobId);
    if (expired && expired.state === "printing") {
      expired.state = "unknown";
      expired.updatedAt = Date.now();
    } else if (expired && expired.state !== "complete" && expired.state !== "cancelled") {
      expired.state = "expired";
      expired.updatedAt = Date.now();
    }
    activeBatchLease = null;
    changed = true;
  }
  if (changed) void persistBatchState().catch(() => undefined);
}

async function refreshPrinterStatus() {
  if (!client.isConnected || client.isPrinting || printInFlight) return;
  if (statusRefreshPromise) return statusRefreshPromise;
  statusRefreshPromise = client.getStatus(false, 1800, false)
    .catch(() => null)
    .finally(() => {
      statusRefreshPromise = null;
    });
  return statusRefreshPromise;
}

function pageReadyError(error) {
  if (error?.code === "timeout") return "Skrivarens status kunde inte verifieras; utskrift är blockerad.";
  if (error?.code === "printer-fault") return error.message;
  if (error?.code === "not-connected") return "Anslut skrivaren innan du skriver ut.";
  return error instanceof Error ? error.message : String(error);
}

function assertBatchStateWritable() {
  if (batchStateRecoveryRequired) {
    throw new HttpError(503, "Batchstatusfilen kan inte läsas. Utskrift är blockerad tills statusen har återställts manuellt.");
  }
  if (!batchStateHealthy) {
    throw new HttpError(503, "Batchstatusen kunde inte sparas säkert. Utskrift är blockerad tills lagringen fungerar igen.", {
      batchStateError,
    });
  }
}

function assertNoUnknownBatch(exceptJobId = null) {
  for (const pending of batchJobs.values()) {
    if (pending.state === "unknown" && pending.jobId !== exceptJobId) {
      throw new HttpError(409, "En batch har okänd fysisk status och måste hanteras manuellt innan en ny utskrift kan startas.");
    }
  }
}

function readBatchJob(value) {
  if (value === undefined) return null;
  const diagnostics = validatePrintBatchJob(value);
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  if (errors.length > 0) {
    throw new HttpError(422, "Utskriftsjobbet är ogiltigt.", { diagnostics });
  }
  if (!value.jobId || value.index === undefined) {
    throw new HttpError(422, "Ett batchjobb måste ha jobId och index.");
  }
  if (!value.templateDocument || typeof value.templateDocument !== "object" || Array.isArray(value.templateDocument)) {
    throw new HttpError(422, "Ett batchjobb måste bära den oförändrade mallens dokument.");
  }
  const templateDiagnostics = validatePrintDocument(value.templateDocument);
  if (templateDiagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    throw new HttpError(422, "Batchens mall är ogiltig.", { diagnostics: templateDiagnostics });
  }
  if (value.templateFingerprint !== fingerprintPrintDocument(value.templateDocument)) {
    throw new HttpError(422, "Batchens mallfingerprint stämmer inte med mallens dokument.");
  }
  if (value.count > maxBatchCount) {
    throw new HttpError(422, `Batchen får innehålla högst ${maxBatchCount} etiketter.`);
  }
  return value;
}

async function reserveBatchItem(job, binding) {
  assertBatchStateWritable();
  if (!job) {
    assertNoUnknownBatch();
    return null;
  }
  cleanBatchJobs();
  const now = Date.now();
  assertNoUnknownBatch(job.jobId);
  if (activeBatchLease && activeBatchLease.jobId !== job.jobId) {
    throw new HttpError(409, "En annan batch har skrivarleasen tills den är klar, avbruten eller löpt ut.");
  }
  const existing = batchJobs.get(job.jobId);
  if (!existing) {
    if (job.index !== 0) throw new HttpError(409, "Batchjobbet måste börja med etikett 1.");
    const created = { jobId: job.jobId, count: job.count, nextIndex: 0, state: "printing", cancelRequested: false, binding, updatedAt: now };
    batchJobs.set(job.jobId, created);
    if (job.count > 1) activeBatchLease = { jobId: job.jobId, expiresAt: now + batchJobTtlMs };
    await persistBatchState();
    return created;
  }
  if (existing.count !== job.count) throw new HttpError(409, "Batchjobbets antal kan inte ändras under körning.");
  if (JSON.stringify(existing.binding) !== JSON.stringify(binding)) throw new HttpError(409, "Batchjobbet försöker fortsätta med ett annat dokument eller en annan sekvens.");
  if (existing.state === "unknown") throw new HttpError(409, "Batchjobbets senaste utskrift har okänd status och måste hanteras manuellt.");
  if (existing.state === "cancelled") throw new HttpError(409, "Batchjobbet är avbrutet.");
  if (existing.state === "expired") throw new HttpError(409, "Batchjobbet har löpt ut och måste startas om.");
  if (existing.state === "complete") throw new HttpError(409, "Batchjobbet är redan klart.");
  if (existing.state === "printing") throw new HttpError(409, "Batchjobbets aktuella etikett skrivs redan ut.");
  if (existing.cancelRequested) throw new HttpError(409, "Batchjobbet håller på att avbrytas.");
  if (existing.nextIndex !== job.index) throw new HttpError(409, `Nästa tillåtna batchindex är ${existing.nextIndex}.`);
  existing.state = "printing";
  existing.updatedAt = now;
  if (job.count > 1) activeBatchLease = { jobId: job.jobId, expiresAt: now + batchJobTtlMs };
  await persistBatchState();
  return existing;
}

async function completeBatchItem(job, record) {
  if (!job || !record) return;
  record.nextIndex = job.index + 1;
  record.state = record.cancelRequested ? "cancelled" : record.nextIndex >= record.count ? "complete" : "ready";
  record.updatedAt = Date.now();
  if (record.state === "complete" || record.state === "cancelled") activeBatchLease = null;
  else if (job.count > 1) activeBatchLease = { jobId: job.jobId, expiresAt: record.updatedAt + batchJobTtlMs };
  await persistBatchState();
}

async function markBatchUnknown(record) {
  if (!record) return;
  record.state = "unknown";
  record.updatedAt = Date.now();
  await persistBatchState();
}

function batchJobBinding(job, result, mediaProfileId, intensity, options) {
  return {
    templateFingerprint: job ? fingerprintPrintDocument(job.templateDocument) : null,
    rendererVersion: result.rendererVersion,
    mediaProfileId: mediaProfileId ?? null,
    sequence: JSON.stringify(job?.sequence ?? null),
    values: JSON.stringify(job?.values ?? {}),
    rows: JSON.stringify(job?.rows ?? []),
    intensity,
    dither: options.dither ?? "steinberg",
    brightness: options.brightness ?? 128,
  };
}

class HttpError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

function sendText(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": contentType,
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

function makeRasterResponse(result) {
  return {
    rendererVersion: result.rendererVersion,
    profileId: result.profileId,
    canPrint: result.canPrint,
    documentFingerprint: result.documentFingerprint,
    diagnostics: result.diagnostics,
    pages: result.pages.map((page) => ({
      widthDots: page.widthDots,
      heightDots: page.heightDots,
      contentHeightRows: page.contentHeightRows,
      wireHeightRows: page.wireHeightRows,
      bytesPerRow: page.bytesPerRow,
      bitOrder: page.bitOrder,
      blackIsOne: page.blackIsOne,
      dataBase64: Buffer.from(page.data).toString("base64"),
    })),
  };
}

function renderDocument(document, options = {}) {
  if (!document || typeof document !== "object") {
    throw new HttpError(400, "Dokumentet måste vara ett objekt.");
  }
  if (
    !document.page ||
    !Number.isInteger(document.page.widthDots) ||
    !Number.isInteger(document.page.heightDots) ||
    document.page.widthDots <= 0 ||
    document.page.heightDots <= 0
  ) {
    throw new HttpError(422, "Dokumentet måste ha positiva heltalsdimensioner.");
  }
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new HttpError(422, "Renderingsalternativen måste vara ett objekt.");
  }
  const allowedDither = new Set(["threshold", "steinberg", "bayer", "atkinson", "pattern"]);
  if (options.dither !== undefined && typeof options.dither !== "string") {
    throw new HttpError(422, "Dithermetod måste vara en sträng.");
  }
  if (!allowedDither.has(options.dither ?? "steinberg")) {
    throw new HttpError(422, "Okänd dithermetod.");
  }
  if (options.brightness !== undefined && (typeof options.brightness !== "number" || !Number.isInteger(options.brightness))) {
    throw new HttpError(422, "Ljusstyrka måste vara ett heltal mellan 0 och 255.");
  }
  const brightness = options.brightness ?? 128;
  if (brightness < 0 || brightness > 255) {
    throw new HttpError(422, "Ljusstyrka måste vara ett heltal mellan 0 och 255.");
  }
  if (document.page.heightDots > 4000) {
    throw new HttpError(422, "Dokumenthöjden måste vara högst 4000 punkter.");
  }
  const mediaProfileId = document.page.media?.profileId;
  if (mediaProfileId !== undefined) {
    const mediaProfile = findMediaProfile(mediaProfileId);
    if (!mediaProfile) {
      throw new HttpError(422, "Dokumentet hänvisar till en okänd mediaprofil.");
    }
    if (
      mediaProfile.kind !== document.page.media.kind ||
      mediaProfile.color !== document.page.media.color ||
      mediaProfile.widthDots !== document.page.widthDots ||
      (mediaProfile.kind !== "continuous" && mediaProfile.heightDots !== document.page.heightDots) ||
      (document.page.media.gapDots ?? 0) !== mediaProfile.gapDots
    ) {
      throw new HttpError(422, "Dokumentets mediaprofil stämmer inte med sidans geometri.");
    }
  }

  return renderPrintDocument(document, MXW01_PRINTER_PROFILE, {
    dither: options.dither ?? "steinberg",
    brightness,
  });
}

function resolveBatchDocument(job) {
  const resolved = resolveTemplateDocument(
    job.templateDocument,
    { ...(job.values ?? {}), ...batchValues(job, job.index) }
  );
  if (templateTokens(resolved).length > 0) {
    throw new HttpError(422, "Batchens mall innehåller oupplösta mallvariabler.");
  }
  return resolved;
}

async function handleApi(request, response, pathname) {
  await batchStateReady;
  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, {
      ok: batchStateHealthy && !batchStateRecoveryRequired,
      service: "mxw01-local-web-terminal",
      rendererVersion: DOCUMENT_RENDERER_VERSION,
      batchState: {
        healthy: batchStateHealthy,
        recoveryRequired: batchStateRecoveryRequired,
      },
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/status") {
    await refreshPrinterStatus();
    sendJson(response, 200, currentStatus());
    return;
  }

  if (request.method === "GET" && pathname === "/api/readiness") {
    await refreshPrinterStatus();
    const status = currentStatus();
    const ready = status.batchState.healthy && !status.batchState.recoveryRequired && status.connected && status.statusVerified && status.printReady;
    sendJson(response, ready ? 200 : 503, { ...status, ready });
    return;
  }

  if (request.method === "POST" && pathname === "/api/connect") {
    assertLocalOrigin(request);
    if (client.isConnected) {
      sendJson(response, 200, currentStatus());
      return;
    }
    if (!connectPromise) {
      connectPromise = client.connect();
    }
    const operation = connectPromise;
    try {
      await operation;
      sendJson(response, 200, currentStatus());
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      sendJson(response, 502, {
        ok: false,
        error: lastError,
        status: currentStatus(),
      });
    } finally {
      if (connectPromise === operation) {
        connectPromise = null;
      }
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/disconnect") {
    assertLocalOrigin(request);
    cleanBatchJobs();
    if (activeBatchLease) throw new HttpError(409, "En batch har skrivarleasen tills den är klar eller avbruten.");
    try {
      await client.disconnect();
    } catch (error) {
      if (error?.code === "busy") {
        throw new HttpError(409, error.message);
      }
      throw error;
    }
    sendJson(response, 200, currentStatus());
    return;
  }

  if (request.method === "GET" && pathname === "/api/batch/list") {
    assertLocalOrigin(request);
    cleanBatchJobs();
    sendJson(response, 200, {
      ok: true,
      jobs: [...batchJobs.values()]
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map(({ cancelRequested, ...job }) => ({ ...job, cancelRequested: cancelRequested === true })),
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/batch/reconcile") {
    assertLocalOrigin(request);
    requireJsonContentType(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Batchhantering kräver ett JSON-objekt.");
    assertBatchStateWritable();
    if (typeof body.jobId !== "string" || body.jobId.length === 0 || body.jobId.length > 128) {
      throw new HttpError(422, "jobId saknas eller är ogiltigt.");
    }
    const job = batchJobs.get(body.jobId);
    if (!job) throw new HttpError(404, "Batchjobbet hittades inte.");
    if (!["cancel", "forget"].includes(body.action)) throw new HttpError(422, "Batchhantering kräver action cancel eller forget.");
    if (["printing", "unknown"].includes(job.state) && body.confirmedPhysicalState !== true) {
      throw new HttpError(409, "Kontrollera skrivaren fysiskt och bekräfta dess status innan jobbet hanteras.");
    }
    if (body.action === "forget") {
      batchJobs.delete(body.jobId);
      if (activeBatchLease?.jobId === body.jobId) activeBatchLease = null;
    } else {
      job.state = "cancelled";
      job.cancelRequested = false;
      job.updatedAt = Date.now();
      if (activeBatchLease?.jobId === body.jobId) activeBatchLease = null;
    }
    await persistBatchState();
    sendJson(response, 200, { ok: true, action: body.action, jobId: body.jobId, state: body.action === "forget" ? "forgotten" : "cancelled" });
    return;
  }

  if (request.method === "POST" && pathname === "/api/batch/cancel") {
    assertLocalOrigin(request);
    requireJsonContentType(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Batchavbrytning kräver ett JSON-objekt.");
    assertBatchStateWritable();
    if (typeof body.jobId !== "string" || body.jobId.length === 0 || body.jobId.length > 128) {
      throw new HttpError(422, "jobId saknas eller är ogiltigt.");
    }
    const job = batchJobs.get(body.jobId);
    if (!job) throw new HttpError(404, "Batchjobbet hittades inte.");
    if (job.state === "printing") {
      job.cancelRequested = true;
      job.updatedAt = Date.now();
      await persistBatchState();
      sendJson(response, 202, { ok: true, jobId: body.jobId, state: "cancelling", nextIndex: job.nextIndex, count: job.count });
      return;
    }
    if (job.state === "complete") {
      sendJson(response, 200, { ok: true, jobId: body.jobId, state: job.state, nextIndex: job.nextIndex, count: job.count });
      return;
    }
    if (job.state === "unknown" && body.confirmedPhysicalState !== true) {
      throw new HttpError(409, "Bekräfta att du har kontrollerat skrivaren innan ett jobb med okänd fysisk status glöms.");
    }
    job.state = "cancelled";
    job.updatedAt = Date.now();
    if (activeBatchLease?.jobId === body.jobId) activeBatchLease = null;
    await persistBatchState();
    sendJson(response, 200, { ok: true, jobId: body.jobId, state: job.state, nextIndex: job.nextIndex, count: job.count });
    return;
  }

  if (request.method === "POST" && pathname === "/api/batch/skip") {
    assertLocalOrigin(request);
    requireJsonContentType(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Batchhopp kräver ett JSON-objekt.");
    assertBatchStateWritable();
    if (typeof body.jobId !== "string" || body.jobId.length === 0 || body.jobId.length > 128) {
      throw new HttpError(422, "jobId saknas eller är ogiltigt.");
    }
    if (!Number.isInteger(body.index) || body.index < 0 || body.index >= maxBatchCount) {
      throw new HttpError(422, "Batchindex saknas eller är ogiltigt.");
    }
    const job = batchJobs.get(body.jobId);
    if (!job) throw new HttpError(404, "Batchjobbet hittades inte.");
    if (job.state !== "ready") throw new HttpError(409, "Batchjobbet kan bara hoppa över en etikett när nästa etikett väntar.");
    if (job.nextIndex !== body.index) throw new HttpError(409, `Nästa tillåtna batchindex är ${job.nextIndex}.`);
    job.nextIndex += 1;
    job.state = job.nextIndex >= job.count ? "complete" : "ready";
    job.updatedAt = Date.now();
    if (job.state === "complete") activeBatchLease = null;
    else activeBatchLease = { jobId: job.jobId, expiresAt: job.updatedAt + batchJobTtlMs };
    await persistBatchState();
    sendJson(response, 200, { ok: true, jobId: job.jobId, index: body.index, state: job.state, nextIndex: job.nextIndex, count: job.count });
    return;
  }

  if (request.method === "POST" && pathname === "/api/batch/status") {
    assertLocalOrigin(request);
    requireJsonContentType(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Batchstatus kräver ett JSON-objekt.");
    cleanBatchJobs();
    if (typeof body.jobId !== "string" || body.jobId.length === 0 || body.jobId.length > 128) {
      throw new HttpError(422, "jobId saknas eller är ogiltigt.");
    }
    const job = batchJobs.get(body.jobId);
    if (!job) throw new HttpError(404, "Batchjobbet hittades inte.");
    sendJson(response, 200, {
      ok: true,
      jobId: body.jobId,
      state: job.state,
      nextIndex: job.nextIndex,
      count: job.count,
      cancelRequested: job.cancelRequested === true,
      leased: activeBatchLease?.jobId === body.jobId,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/webpage") {
    assertLocalOrigin(request);
    requireJsonContentType(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Webbsidesimport kräver ett JSON-objekt.");
    if (typeof body.url !== "string" || body.url.length < 8 || body.url.length > 2048) throw new HttpError(422, "Ange en giltig webbadress.");
    const maxCharacters = body.maxCharacters === undefined ? 14000 : Number(body.maxCharacters);
    if (!Number.isInteger(maxCharacters) || maxCharacters < 1000 || maxCharacters > 20000) throw new HttpError(422, "maxCharacters måste vara 1000–20000.");
    const imported = await fetchWebpageDocument(body.url, maxCharacters);
    sendJson(response, 200, { ok: true, ...imported });
    return;
  }

  if (request.method === "POST" && pathname === "/api/preview") {
    assertLocalOrigin(request);
    requireJsonContentType(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Förhandsvisningen kräver ett JSON-objekt.");
    const result = renderDocument(body.document, body.options);
    sendJson(response, 200, makeRasterResponse(result));
    return;
  }

  if (request.method === "POST" && pathname === "/api/print") {
    assertLocalOrigin(request);
    requireJsonContentType(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Utskriften kräver ett JSON-objekt.");
    const batchJob = readBatchJob(body.job);
    cleanBatchJobs();
    assertNoUnknownBatch(batchJob?.jobId ?? null);
    if (activeBatchLease && activeBatchLease.jobId !== batchJob?.jobId) {
      throw new HttpError(409, "En annan batch har skrivarleasen tills den är klar, avbruten eller löpt ut.");
    }
    if (printInFlight || client.isPrinting) {
      throw new HttpError(409, "En utskrift pågår redan.");
    }
    if (!client.isConnected) {
      throw new HttpError(409, "Anslut skrivaren innan du skriver ut.");
    }
    try {
      await client.ensurePrintReady(2500);
    } catch (error) {
      throw new HttpError(409, pageReadyError(error), { status: currentStatus() });
    }

    printInFlight = true;
    let batchJobRecord = null;
    try {
      const result = renderDocument(body.document, body.options);
      if (!result.canPrint || result.pages.length !== 1) {
        throw new HttpError(422, "Dokumentet är inte utskriftsklart.", {
          diagnostics: result.diagnostics,
          canPrint: result.canPrint,
          documentFingerprint: result.documentFingerprint,
        });
      }
      if (batchJob && fingerprintPrintDocument(resolveBatchDocument(batchJob)) !== result.documentFingerprint) {
        throw new HttpError(409, "Batchens dokument skiljer sig från den signerade mallens nästa etikett.");
      }
      const requestedOptions = {
        dither: body.options?.dither ?? "steinberg",
        brightness: body.options?.brightness ?? 128,
      };
      const preflight = body.preflight;
      const mediaProfileId = result.documentFingerprint && body.document?.page?.media?.profileId;
      if (
        !preflight ||
        preflight.canPrint !== true ||
        preflight.documentFingerprint !== result.documentFingerprint ||
        preflight.rendererVersion !== result.rendererVersion ||
        preflight.profileId !== result.profileId ||
        (mediaProfileId !== undefined && preflight.mediaProfileId !== mediaProfileId) ||
        preflight.options?.dither !== requestedOptions.dither ||
        preflight.options?.brightness !== requestedOptions.brightness
      ) {
        throw new HttpError(409, "Förhandsvisningen är inaktuell. Rendera dokumentet igen innan utskrift.", {
          canPrint: result.canPrint,
          documentFingerprint: result.documentFingerprint,
          rendererVersion: result.rendererVersion,
          profileId: result.profileId,
          ...(mediaProfileId !== undefined ? { mediaProfileId } : {}),
          diagnostics: result.diagnostics,
        });
      }

      const page = result.pages[0];
      if (body.intensity !== undefined && (typeof body.intensity !== "number" || !Number.isInteger(body.intensity))) {
        throw new HttpError(422, "Intensitet måste vara ett heltal mellan 0 och 255.");
      }
      const intensity = body.intensity ?? 93;
      if (intensity < 0 || intensity > 255) {
        throw new HttpError(422, "Intensitet måste vara ett heltal mellan 0 och 255.");
      }

      batchJobRecord = await reserveBatchItem(batchJob, batchJobBinding(batchJob, result, mediaProfileId, intensity, body.options ?? {}));

      lastError = null;
      try {
        // The renderer already applied the requested brightness and dither.
        // Send that exact raster so physical output matches the preflight.
        const printOperation = client.printRaster(page, { intensity });
        activePrintPromise = printOperation;
        await printOperation;
      } catch (error) {
        await markBatchUnknown(batchJobRecord);
        if (error?.code === "busy") {
          throw new HttpError(409, error.message);
        }
        throw error;
      } finally {
        activePrintPromise = null;
      }
      await completeBatchItem(batchJob, batchJobRecord);
      sendJson(response, 200, {
        ok: true,
        status: currentStatus(),
        diagnostics: result.diagnostics,
        preflight: {
          canPrint: result.canPrint,
          documentFingerprint: result.documentFingerprint,
          rendererVersion: result.rendererVersion,
          profileId: result.profileId,
          ...(mediaProfileId !== undefined ? { mediaProfileId } : {}),
          options: requestedOptions,
        },
        ...(batchJob ? { job: { jobId: batchJob.jobId, index: batchJob.index, count: batchJob.count, state: batchJobRecord?.state ?? "complete", nextIndex: batchJobRecord?.nextIndex ?? 1 } } : {}),
        page: {
          widthDots: page.widthDots,
          contentHeightRows: page.contentHeightRows,
          wireHeightRows: page.wireHeightRows,
        },
      });
    } finally {
      printInFlight = false;
    }
    return;
  }

  throw new HttpError(404, "API-rutten finns inte.");
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function serveStatic(response, pathname, method = "GET") {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = resolve(webRoot, relativePath);
  if (filePath !== webRoot && !filePath.startsWith(`${webRoot}/`)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    const contentType = contentTypes[extname(filePath)] ?? "application/octet-stream";
    response.writeHead(200, {
      "cache-control": "no-cache",
      "content-security-policy": "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
      "content-type": contentType,
      "content-length": body.length,
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
    });
    response.end(method === "HEAD" ? undefined : body);
  } catch (error) {
    if (error?.code === "ENOENT") {
      sendText(response, 404, "Not found");
      return;
    }
    throw error;
  }
}

const server = createServer(async (request, response) => {
  try {
    const urlHost = host.includes(":") ? `[${host}]` : host;
    const url = new URL(request.url ?? "/", `http://${urlHost}:${port}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname);
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      throw new HttpError(405, "Metoden stöds inte.");
    }
    await serveStatic(response, url.pathname, request.method);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : String(error);
    if (status >= 500) {
      console.error(`[web] ${message}`);
    }
    if (!response.headersSent) {
      sendJson(response, status, { ok: false, error: message, ...(error instanceof HttpError ? error.details : {}) });
    } else {
      response.end();
    }
  }
});
server.requestTimeout = 20_000;
server.headersTimeout = 10_000;
server.keepAliveTimeout = 5_000;

server.listen(port, host, () => {
  console.log(`[web] MXW01 Local Terminal: http://${host}:${port}/`);
  console.log(`[web] Bluetooth stays local to this Node process; no LAN bind by default.`);
});

async function shutdown(signal) {
  console.log(`[web] ${signal}: shutting down`);
  const closePromise = new Promise((resolve) => server.close(() => resolve()));
  try {
    if (activePrintPromise) {
      await Promise.race([
        activePrintPromise.catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]);
    }
    await batchStateWrite;
    await Promise.all([closePromise, client.dispose()]);
  } finally {
    await releaseBatchStateLock();
    process.exit(0);
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
