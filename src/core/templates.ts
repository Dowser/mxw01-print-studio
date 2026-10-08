import type {
  FortuneNode,
  PrintDocument,
  PrintNode,
  RenderDiagnostic,
} from "./document";
import { validatePrintDocument } from "./document";
import { layoutPrintDocument } from "./documentLayout";

export const PRINT_TEMPLATE_SCHEMA = "mxw01.print-template" as const;
export const PRINT_TEMPLATE_VERSION = 1 as const;
export const PRINT_BATCH_SCHEMA = "mxw01.print-batch" as const;
export const PRINT_BATCH_VERSION = 1 as const;

export type TemplateVariableType = "text" | "sequence" | "date";

export interface TemplateVariable {
  readonly type: TemplateVariableType;
  readonly label?: string;
  readonly defaultValue?: string;
  readonly start?: number;
  readonly step?: number;
  readonly padding?: number;
  readonly prefix?: string;
  readonly suffix?: string;
}

export interface PrintTemplate {
  readonly schema: typeof PRINT_TEMPLATE_SCHEMA;
  readonly version: typeof PRINT_TEMPLATE_VERSION;
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly preferredMediaProfileId?: string;
  readonly variables?: Readonly<Record<string, TemplateVariable>>;
  readonly document: PrintDocument;
}

export interface PrintBatchJob {
  readonly schema: typeof PRINT_BATCH_SCHEMA;
  readonly version: typeof PRINT_BATCH_VERSION;
  readonly templateId?: string;
  /** Stable client-generated id used to correlate a multi-request print job. */
  readonly jobId?: string;
  /** Zero-based item index when the job is transported one label at a time. */
  readonly index?: number;
  /** Fingerprint of the unresolved template document, stable across sequence items. */
  readonly templateFingerprint?: string;
  /** Unresolved template snapshot used to verify each resolved batch item. */
  readonly templateDocument?: PrintDocument;
  readonly count: number;
  readonly intervalMs?: number;
  readonly confirmEach?: boolean;
  readonly onError?: "pause" | "retry" | "skip" | "stop";
  readonly values?: Readonly<Record<string, string>>;
  readonly rows?: readonly (Readonly<Record<string, string>>)[];
  readonly sequence?: Readonly<{
    readonly variable: string;
    readonly start: number;
    readonly step?: number;
    readonly padding?: number;
    readonly prefix?: string;
    readonly suffix?: string;
  }>;
}

const TOKEN_PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_.-]{0,63})\s*\}\}/g;

const VARIABLE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function templateTokens(document: unknown): readonly string[] {
  const tokens = new Set<string>();
  const collect = (value: string): void => {
    for (const match of value.matchAll(TOKEN_PATTERN)) {
      if (match[1]) tokens.add(match[1]);
    }
  };
  const nodes = isRecord(document) && Array.isArray(document.nodes) ? document.nodes : [];
  for (const candidate of nodes) {
    if (!isRecord(candidate)) continue;
    if ((candidate.kind === "text" || candidate.kind === "fortune") && typeof candidate.text === "string") collect(candidate.text);
    else if ((candidate.kind === "barcode" || candidate.kind === "qr") && typeof candidate.value === "string") collect(candidate.value);
    else if (candidate.kind === "checklist" && Array.isArray(candidate.items)) {
      for (const item of candidate.items) {
        if (isRecord(item) && typeof item.text === "string") collect(item.text);
      }
    }
  }
  return [...tokens];
}

function replaceTokens(value: string, values: Readonly<Record<string, string>>): string {
  return value.replace(TOKEN_PATTERN, (token, key: string) => values[key] ?? token);
}

function replaceNodeTokens(node: PrintNode, values: Readonly<Record<string, string>>): PrintNode {
  switch (node.kind) {
    case "text":
    case "fortune":
      return { ...node, text: replaceTokens(node.text, values) };
    case "barcode":
    case "qr":
      return { ...node, value: replaceTokens(node.value, values) };
    case "checklist":
      return {
        ...node,
        items: node.items.map((item) => ({ ...item, text: replaceTokens(item.text, values) })),
      };
    default:
      return node;
  }
}

export function resolveTemplateDocument(
  document: PrintDocument,
  values: Readonly<Record<string, string>> = {}
): PrintDocument {
  return layoutPrintDocument({
    ...document,
    nodes: document.nodes.map((node) => replaceNodeTokens(node, values)),
  });
}

/** Applies declared default values without inventing values for unresolved tokens. */
export function templateValues(
  template: Pick<PrintTemplate, "variables">,
  overrides: Readonly<Record<string, string>> = {}
): Readonly<Record<string, string>> {
  const values: Record<string, string> = { ...overrides };
  for (const [name, variable] of Object.entries(template.variables ?? {})) {
    if (values[name] === undefined && typeof variable.defaultValue === "string") {
      values[name] = variable.defaultValue;
    }
  }
  return values;
}

export function formatSequenceValue(
  value: number,
  sequence: Pick<NonNullable<PrintBatchJob["sequence"]>, "padding" | "prefix" | "suffix">
): string {
  const raw = String(Math.trunc(value));
  const padding = Math.max(0, Math.min(32, Math.trunc(sequence.padding ?? 0)));
  const sign = raw.startsWith("-") ? "-" : "";
  const digits = sign ? raw.slice(1) : raw;
  return `${sequence.prefix ?? ""}${sign}${digits.padStart(padding, "0")}${sequence.suffix ?? ""}`;
}

export function batchValues(
  batch: PrintBatchJob,
  index: number
): Readonly<Record<string, string>> {
  const values: Record<string, string> = { ...(batch.values ?? {}) };
  if (batch.rows?.[index]) Object.assign(values, batch.rows[index]);
  if (batch.sequence) {
    const value = batch.sequence.start + index * (batch.sequence.step ?? 1);
    values[batch.sequence.variable] = formatSequenceValue(value, batch.sequence);
  }
  return values;
}

export function validatePrintTemplate(value: unknown): RenderDiagnostic[] {
  const diagnostics: RenderDiagnostic[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [{ severity: "error", code: "template.type", message: "Template must be an object." }];
  }
  const template = value as Partial<PrintTemplate>;
  if (template.schema !== PRINT_TEMPLATE_SCHEMA) {
    diagnostics.push({ severity: "error", code: "template.schema", message: "Unsupported template schema." });
  }
  if (template.version !== PRINT_TEMPLATE_VERSION) {
    diagnostics.push({ severity: "error", code: "template.version", message: "Unsupported template version." });
  }
  if (typeof template.id !== "string" || template.id.length === 0 || template.id.length > 128) {
    diagnostics.push({ severity: "error", code: "template.id", message: "Template id is invalid." });
  }
  if (typeof template.name !== "string" || template.name.trim().length === 0 || template.name.length > 128) {
    diagnostics.push({ severity: "error", code: "template.name", message: "Template name is invalid." });
  }
  if (template.description !== undefined && (typeof template.description !== "string" || template.description.length > 512)) {
    diagnostics.push({ severity: "error", code: "template.description", message: "Template description is invalid." });
  }
  if (template.preferredMediaProfileId !== undefined && (
    typeof template.preferredMediaProfileId !== "string" ||
    template.preferredMediaProfileId.length === 0 ||
    template.preferredMediaProfileId.length > 128
  )) {
    diagnostics.push({ severity: "error", code: "template.media-profile", message: "preferredMediaProfileId is invalid." });
  }
  if (template.variables !== undefined) {
    if (!template.variables || typeof template.variables !== "object" || Array.isArray(template.variables)) {
      diagnostics.push({ severity: "error", code: "template.variables", message: "Template variables must be an object." });
    } else {
      for (const [name, variable] of Object.entries(template.variables)) {
        if (!VARIABLE_NAME_PATTERN.test(name) || !variable || typeof variable !== "object" || Array.isArray(variable)) {
          diagnostics.push({ severity: "error", code: "template.variable", message: `Variable "${name}" is invalid.` });
          continue;
        }
        const candidate = variable as Partial<TemplateVariable>;
        if (candidate.type !== "text" && candidate.type !== "sequence" && candidate.type !== "date") {
          diagnostics.push({ severity: "error", code: "template.variable-type", message: `Variable "${name}" has an unsupported type.` });
        }
        for (const field of ["defaultValue", "label", "prefix", "suffix"] as const) {
          if (candidate[field] !== undefined && (typeof candidate[field] !== "string" || candidate[field].length > 256)) {
            diagnostics.push({ severity: "error", code: "template.variable-value", message: `Variable "${name}" has an invalid ${field}.` });
          }
        }
        for (const field of ["start", "step", "padding"] as const) {
          if (candidate[field] !== undefined && (!Number.isInteger(candidate[field]) || !Number.isFinite(candidate[field]))) {
            diagnostics.push({ severity: "error", code: "template.variable-number", message: `Variable "${name}" has an invalid ${field}.` });
          }
        }
      }
    }
  }
  if (!template.document) {
    diagnostics.push({ severity: "error", code: "template.document", message: "Template has no document." });
  } else {
    diagnostics.push(...validatePrintDocument(template.document));
    const variables = template.variables && typeof template.variables === "object" && !Array.isArray(template.variables)
      ? template.variables
      : {};
    for (const token of templateTokens(template.document)) {
      if (!(token in variables)) {
        diagnostics.push({
          severity: "error",
          code: "template.unbound-variable",
          message: `Document token "{{${token}}}" has no variable definition.`,
        });
      }
    }
  }
  return diagnostics;
}

export function validatePrintBatchJob(value: unknown): RenderDiagnostic[] {
  const diagnostics: RenderDiagnostic[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [{ severity: "error", code: "batch.type", message: "Batch job must be an object." }];
  }
  const batch = value as Partial<PrintBatchJob>;
  if (batch.schema !== PRINT_BATCH_SCHEMA || batch.version !== PRINT_BATCH_VERSION) {
    diagnostics.push({ severity: "error", code: "batch.schema", message: "Unsupported batch job schema." });
  }
  if (batch.jobId !== undefined && (typeof batch.jobId !== "string" || batch.jobId.length === 0 || batch.jobId.length > 128)) {
    diagnostics.push({ severity: "error", code: "batch.job-id", message: "jobId must be a short non-empty string." });
  }
  if (batch.templateFingerprint !== undefined && (typeof batch.templateFingerprint !== "string" || !/^fnv1a32-[0-9a-f]{8}$/.test(batch.templateFingerprint))) {
    diagnostics.push({ severity: "error", code: "batch.template-fingerprint", message: "templateFingerprint must be a canonical FNV-1a fingerprint." });
  }
  if (batch.index !== undefined && (!Number.isInteger(batch.index) || batch.index < 0 || batch.index >= (batch.count ?? 0))) {
    diagnostics.push({ severity: "error", code: "batch.index", message: "index must identify an item within the batch." });
  }
  if (!Number.isInteger(batch.count) || (batch.count ?? 0) < 1 || (batch.count ?? 0) > 1000) {
    diagnostics.push({ severity: "error", code: "batch.count", message: "Batch count must be an integer from 1 to 1000." });
  }
  if (batch.intervalMs !== undefined && (!Number.isInteger(batch.intervalMs) || batch.intervalMs < 0 || batch.intervalMs > 60000)) {
    diagnostics.push({ severity: "error", code: "batch.interval", message: "Batch interval must be 0–60000 ms." });
  }
  if (batch.confirmEach !== undefined && typeof batch.confirmEach !== "boolean") {
    diagnostics.push({ severity: "error", code: "batch.confirm", message: "confirmEach must be boolean." });
  }
  if (batch.onError !== undefined && !["pause", "retry", "skip", "stop"].includes(batch.onError)) {
    diagnostics.push({ severity: "error", code: "batch.on-error", message: "onError must be pause, retry, skip or stop." });
  }
  if (batch.values !== undefined && (!batch.values || typeof batch.values !== "object" || Array.isArray(batch.values))) {
    diagnostics.push({ severity: "error", code: "batch.values", message: "values must be a string map." });
  } else if (batch.values) {
    for (const [name, value] of Object.entries(batch.values)) {
      if (!VARIABLE_NAME_PATTERN.test(name) || typeof value !== "string" || value.length > 256) {
        diagnostics.push({ severity: "error", code: "batch.values", message: `Value for "${name}" is invalid.` });
      }
    }
  }
  if (batch.rows !== undefined && (!Array.isArray(batch.rows) || batch.rows.length > 1000)) {
    diagnostics.push({ severity: "error", code: "batch.rows", message: "rows must contain at most 1000 data rows." });
  } else if (batch.rows) {
    batch.rows.forEach((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row) || Object.entries(row).some(([name, value]) => !VARIABLE_NAME_PATTERN.test(name) || typeof value !== "string" || value.length > 256)) {
        diagnostics.push({ severity: "error", code: "batch.rows", message: "Each batch row must be a string map." });
      }
    });
  }
  if (batch.sequence !== undefined && (!batch.sequence || typeof batch.sequence !== "object" || Array.isArray(batch.sequence))) {
    diagnostics.push({ severity: "error", code: "batch.sequence", message: "sequence must be an object." });
  } else if (batch.sequence) {
    const sequence = batch.sequence;
    if (typeof sequence.variable !== "string" || !VARIABLE_NAME_PATTERN.test(sequence.variable)) {
      diagnostics.push({ severity: "error", code: "batch.sequence", message: "Sequence variable is required." });
    }
    if (
      !Number.isInteger(sequence.start) ||
      !Number.isFinite(sequence.start) ||
      (sequence.step !== undefined && (!Number.isInteger(sequence.step) || !Number.isFinite(sequence.step)))
    ) {
      diagnostics.push({ severity: "error", code: "batch.sequence", message: "Sequence start and step must be integers." });
    }
    if (sequence.padding !== undefined && (!Number.isInteger(sequence.padding) || sequence.padding < 0 || sequence.padding > 32)) {
      diagnostics.push({ severity: "error", code: "batch.sequence-padding", message: "Sequence padding must be an integer from 0 to 32." });
    }
    for (const field of ["prefix", "suffix"] as const) {
      if (sequence[field] !== undefined && (typeof sequence[field] !== "string" || sequence[field].length > 64)) {
        diagnostics.push({ severity: "error", code: "batch.sequence-affix", message: `Sequence ${field} is invalid.` });
      }
    }
  }
  return diagnostics;
}

export function makeFortuneNode(
  id: string,
  text: string,
  frame: Pick<FortuneNode, "x" | "y" | "width" | "height">
): FortuneNode {
  return { id, kind: "fortune", text, ...frame, align: "center", fontId: "mxw-wide", fontSizeDots: 2 };
}
