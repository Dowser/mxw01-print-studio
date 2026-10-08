#!/usr/bin/env node

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const baseUrl = process.env.MXW01_WEB_URL ?? "http://127.0.0.1:4173";
const projectRoot = new URL("..", import.meta.url).pathname.replace(/\/$/u, "");
const taskTemp = "/Volumes/External2TB/AppData/codex/tmp/mxw01";
const artifactDir = process.env.PLAYWRIGHT_ARTIFACT_DIR ?? join(projectRoot, "output", "playwright", `web-e2e-${new Date().toISOString().replace(/[:.]/gu, "-")}`);
mkdirSync(taskTemp, { recursive: true });
mkdirSync(artifactDir, { recursive: true });

const codexHome = process.env.CODEX_HOME ?? `${process.env.HOME}/.codex`;
const skillCli = join(codexHome, "skills", "playwright", "scripts", "playwright_cli.sh");
const cli = existsSync(skillCli) ? skillCli : "npx";
const cliPrefix = existsSync(skillCli) ? [] : ["--yes", "--package", "@playwright/cli", "playwright-cli"];
const env = {
  ...process.env,
  CODEX_HOME: codexHome,
  PLAYWRIGHT_CLI_SESSION: `mxw01-web-e2e-${Date.now()}`,
  TMPDIR: taskTemp,
  TMP: taskTemp,
  TEMP: taskTemp,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args, { allowFailure = false } = {}) {
  const result = spawnSync(cli, [...cliPrefix, ...args], { cwd: artifactDir, env, encoding: "utf8" });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (!allowFailure && result.status !== 0) {
    throw new Error(`playwright-cli ${args.join(" ")} failed:\n${output}`);
  }
  return output;
}

function evaluate(expression) {
  const output = run(["eval", expression]);
  const match = output.match(/### Result\n([\s\S]*?)(?:\n### Ran Playwright code|$)/u);
  assert(match, `Could not read eval result:\n${output}`);
  const raw = match[1].trim();
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return raw.replace(/^"|"$/gu, "");
  }
}

let opened = false;
try {
  run(["open", `${baseUrl}/`]);
  opened = true;
  run(["snapshot"]);
  const initialSize = evaluate('async () => { await new Promise((resolve) => setTimeout(resolve, 700)); return document.querySelector("#preview-size")?.textContent ?? ""; }');
  assert(String(initialSize).includes("384"), `Initial preview did not render: ${initialSize}`);

  run(["click", '[data-template="ticket"]']);
  run(["snapshot"]);
  const ticketSize = evaluate('() => document.querySelector("#preview-size")?.textContent ?? ""');
  const ticketHeight = Number(String(ticketSize).match(/×\s*(\d+)/u)?.[1] ?? 0);
  assert(ticketHeight >= 200, `Ticket template was cropped unexpectedly: ${ticketSize}`);

  run(["click", "#webpage-button"]);
  run(["snapshot"]);
  run(["fill", "#webpage-url-input", `${baseUrl}/`]);
  run(["click", '#webpage-dialog-form button[type="submit"]']);
  const imported = evaluate('async () => { await new Promise((resolve) => setTimeout(resolve, 800)); return JSON.stringify({ open: document.querySelector("#webpage-dialog")?.open, imported: document.querySelector("#json-editor")?.value.includes("mxw01-webpage-import"), bodyNodes: document.querySelectorAll("[aria-label^=\\"Flytta text: \\"]").length }); }');
  const importedState = typeof imported === "string" ? JSON.parse(imported) : imported;
  assert(importedState.open === false, "Webpage dialog remained open after import.");
  assert(importedState.imported === true, "Webpage import did not replace the document.");

  run(["click", "#batch-details summary"]);
  run(["select", "#batch-on-error-input", "retry"]);
  assert(evaluate('() => document.querySelector("#batch-on-error-input")?.value') === "retry", "Batch error policy did not update.");

  const screenshot = join(artifactDir, "web-terminal.png");
  run(["screenshot", "--filename", screenshot, "--full-page"]);
  console.log(`web e2e ok: ${baseUrl} · ticket ${ticketSize} · screenshot ${screenshot}`);
} finally {
  if (opened) run(["close"], { allowFailure: true });
}
