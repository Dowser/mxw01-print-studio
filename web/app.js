const PROFILE_WIDTH = 384;
const DEFAULT_HEIGHT = 240;
const MIN_PAGE_HEIGHT = 40;
const MAX_PAGE_HEIGHT = 4000;
const AUTO_PAGE_BOTTOM_PADDING = 12;
const IMAGE_CONTENT_WIDTH = PROFILE_WIDTH - 48;
const IMAGE_PAGE_PADDING = 40;
const FRAME_ELEMENT_ID = "__page-frame__";
const FRAME_STYLES = [
  { value: "solid", label: "Hel linje" },
  { value: "double", label: "Dubbel linje" },
  { value: "dashed", label: "Streckad" },
  { value: "dotted", label: "Prickad" },
  { value: "rounded", label: "Mjukade hörn" },
];
const FONT_CATALOG = [
  { value: "mxw-vector", label: "Högupplöst sans", group: "Högupplösta" },
  { value: "mxw-5x7", label: "Pixel 5×7", group: "Termiskt optimerade" },
  { value: "mxw-mono", label: "Monospace", group: "Termiskt optimerade" },
  { value: "mxw-condensed", label: "Kompakt", group: "Termiskt optimerade" },
  { value: "mxw-wide", label: "Bred", group: "Termiskt optimerade" },
  { value: "mxw-bold", label: "Pixel fet", group: "Termiskt optimerade" },
  { value: "mxw-proportional", label: "Proportionell", group: "Mer uttrycksfulla" },
  { value: "mxw-serif", label: "Serifliknande", group: "Mer uttrycksfulla" },
  { value: "mxw-rounded", label: "Mjuk pixel", group: "Mer uttrycksfulla" },
];
const ICON_CATALOG = [
  { value: "fa-star", label: "Stjärna", faClass: "fa-star", fallback: "☆" },
  { value: "fa-heart", label: "Hjärta", faClass: "fa-heart", fallback: "♥" },
  { value: "fa-check", label: "Bock", faClass: "fa-check", fallback: "✓" },
  { value: "fa-xmark", label: "Kryss", faClass: "fa-xmark", fallback: "×" },
  { value: "fa-print", label: "Skrivare", faClass: "fa-print", fallback: "▣" },
  { value: "fa-camera", label: "Kamera", faClass: "fa-camera", fallback: "◉" },
  { value: "fa-image", label: "Bild", faClass: "fa-image", fallback: "▧" },
  { value: "fa-ticket", label: "Biljett", faClass: "fa-ticket", fallback: "▥" },
  { value: "fa-tag", label: "Etikett", faClass: "fa-tag", fallback: "▱" },
  { value: "fa-circle-info", label: "Information", faClass: "fa-circle-info", fallback: "ⓘ" },
  { value: "fa-triangle-exclamation", label: "Varning", faClass: "fa-triangle-exclamation", fallback: "⚠" },
  { value: "fa-bell", label: "Klocka", faClass: "fa-bell", fallback: "♢" },
  { value: "fa-user", label: "Person", faClass: "fa-user", fallback: "●" },
  { value: "fa-calendar-check", label: "Kalender", faClass: "fa-calendar-check", fallback: "▣" },
  { value: "fa-barcode", label: "Streckkod", faClass: "fa-barcode", fallback: "▥" },
  { value: "fa-qrcode", label: "QR-kod", faClass: "fa-qrcode", fallback: "⌗" },
];
const MEDIA_PROFILES = [
  { id: "mxw01-continuous-white", label: "Vit · kontinuerlig", kind: "continuous", color: "white", heightDots: 240, gapDots: 0 },
  { id: "mxw01-die-cut-white", label: "Vit · stansad 58 × 30 mm", kind: "die-cut", color: "white", heightDots: 200, gapDots: 8 },
  { id: "mxw01-die-cut-yellow", label: "Gul · stansad 58 × 30 mm", kind: "die-cut", color: "yellow", heightDots: 200, gapDots: 8 },
  { id: "mxw01-die-cut-blue", label: "Blå · stansad 58 × 30 mm", kind: "die-cut", color: "blue", heightDots: 200, gapDots: 8 },
  { id: "mxw01-die-cut-pink", label: "Rosa · stansad 58 × 30 mm", kind: "die-cut", color: "pink", heightDots: 200, gapDots: 8 },
  { id: "mxw01-die-cut-green", label: "Grön · stansad 58 × 30 mm", kind: "die-cut", color: "green", heightDots: 200, gapDots: 8 },
  { id: "mxw01-die-cut-orange", label: "Orange · stansad 58 × 30 mm", kind: "die-cut", color: "orange", heightDots: 200, gapDots: 8 },
  { id: "mxw01-die-cut-red", label: "Röd · stansad 58 × 30 mm", kind: "die-cut", color: "red", heightDots: 200, gapDots: 8 },
];
const PAPER_COLORS = {
  white: [246, 245, 239],
  yellow: [255, 237, 153],
  blue: [174, 214, 246],
  pink: [255, 191, 211],
  green: [190, 235, 192],
  orange: [255, 211, 151],
  red: [248, 182, 184],
  transparent: [225, 231, 238],
};
const FORTUNES = [
  "Små steg tar dig längre än du tror.",
  "Någon uppskattar din noggrannhet idag.",
  "Det oväntade blir dagens bästa idé.",
  "Gör plats för lite nyfikenhet.",
  "Du har redan det viktigaste verktyget: tålamod.",
];
const MAX_IMAGE_FILE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 1_000_000;
const MAX_IMPORT_FILE_BYTES = 8 * 1024 * 1024;
const MAX_LOCAL_STORAGE_BYTES = 2_000_000;
const DEFAULT_DITHER = "steinberg";
const FONT_IDS = new Set(FONT_CATALOG.map((font) => font.value));
const ICON_IDS = new Set(ICON_CATALOG.map((icon) => icon.value));
const MEDIA_COLORS = new Set(Object.keys(PAPER_COLORS));

const state = {
  document: createTestDocument(),
  selectedNodeId: "title",
  activeTemplate: "test",
  preview: null,
  renderTimer: null,
  previewController: null,
  previewRequestId: 0,
  documentRevision: 0,
  previewRevision: -1,
  previewReady: false,
  previewMode: "fit",
  intensity: 93,
  dither: DEFAULT_DITHER,
  ditherExplicit: false,
  previewHasErrors: false,
  diagnostics: [],
  statusTimer: null,
  statusInFlight: false,
  statusRequestId: 0,
  serverAvailable: true,
  connected: false,
  statusVerified: false,
  printReady: false,
  printerState: null,
  printing: false,
  connecting: false,
  job: {
    active: false,
    id: null,
    index: 0,
    nextIndex: 0,
    count: 0,
    cancelRequested: false,
    cancelResult: null,
    transportStarted: false,
    transportUncertain: false,
    snapshot: null,
  },
  controlsBeforeJob: null,
  history: [],
  future: [],
  savedLabels: [],
  batch: {
    count: 1,
    intervalMs: 0,
    confirmEach: false,
    variable: "ticketNumber",
    start: 1,
    step: 1,
    padding: 0,
    prefix: "",
    suffix: "",
    onError: "stop",
  },
  batchRows: [],
  templateValues: {},
  pendingBatchJob: null,
  wysiwygDrag: null,
};

const elements = {
  nodeCount: document.querySelector("#node-count"),
  nodeList: document.querySelector("#node-list"),
  inspector: document.querySelector("#inspector"),
  inspectorTitle: document.querySelector("#inspector-title"),
  deleteNode: document.querySelector("#delete-node-button"),
  duplicateNode: document.querySelector("#duplicate-node-button"),
  moveNodeUp: document.querySelector("#move-node-up-button"),
  moveNodeDown: document.querySelector("#move-node-down-button"),
  jsonEditor: document.querySelector("#json-editor"),
  previewCanvas: document.querySelector("#preview-canvas"),
  previewOverlay: document.querySelector("#preview-overlay"),
  previewSize: document.querySelector("#preview-size"),
  rendererVersion: document.querySelector("#renderer-version"),
  previewLoading: document.querySelector("#preview-loading"),
  paperStage: document.querySelector(".paper-stage"),
  previewEmpty: document.querySelector("#preview-empty"),
  previewOverflowHint: document.querySelector("#preview-overflow-hint"),
  fitPreview: document.querySelector("#fit-preview-button"),
  nativePreview: document.querySelector("#native-preview-button"),
  diagnostic: document.querySelector("#diagnostic-message"),
  connectionPill: document.querySelector("#connection-pill"),
  connectionLabel: document.querySelector("#connection-label"),
  connect: document.querySelector("#connect-button"),
  disconnect: document.querySelector("#disconnect-button"),
  print: document.querySelector("#print-button"),
  printStatus: document.querySelector("#print-status"),
  bluetoothState: document.querySelector("#bluetooth-state"),
  printerState: document.querySelector("#printer-state"),
  progressBar: document.querySelector("#progress-bar"),
  progressTrack: document.querySelector(".progress-track"),
  progressLabel: document.querySelector("#progress-label"),
  bytesLabel: document.querySelector("#bytes-label"),
  intensity: document.querySelector("#intensity-input"),
  intensityValue: document.querySelector("#intensity-value"),
  dither: document.querySelector("#dither-select"),
  imageInput: document.querySelector("#image-input"),
  webpageButton: document.querySelector("#webpage-button"),
  webpageDialog: document.querySelector("#webpage-dialog"),
  webpageDialogForm: document.querySelector("#webpage-dialog-form"),
  webpageUrl: document.querySelector("#webpage-url-input"),
  webpageDialogCancel: document.querySelector("#webpage-dialog-cancel"),
  toastRegion: document.querySelector("#toast-region"),
  undo: document.querySelector("#undo-button"),
  redo: document.querySelector("#redo-button"),
  exportJson: document.querySelector("#export-json-button"),
  importJson: document.querySelector("#import-json-button"),
  documentFileInput: document.querySelector("#document-file-input"),
  draftStatus: document.querySelector("#draft-status"),
  saveLabelForm: document.querySelector("#save-label-form"),
  labelName: document.querySelector("#label-name-input"),
  savedLabelList: document.querySelector("#saved-label-list"),
  pageHeight: document.querySelector("#page-height-input"),
  mediaProfile: document.querySelector("#media-profile-input"),
  mediaGap: document.querySelector("#media-gap-input"),
  frameInset: document.querySelector("#frame-inset-input"),
  frameThickness: document.querySelector("#frame-thickness-input"),
  frameStyle: document.querySelector("#frame-style-input"),
  mediaNote: document.querySelector("#media-note"),
  pasteImage: document.querySelector("#paste-image-button"),
  exportTemplate: document.querySelector("#export-template-button"),
  importTemplate: document.querySelector("#import-template-button"),
  templateFileInput: document.querySelector("#template-file-input"),
  templateDialog: document.querySelector("#template-dialog"),
  templateDialogForm: document.querySelector("#template-dialog-form"),
  templateDialogTitle: document.querySelector("#template-dialog-title"),
  templateDialogDescription: document.querySelector("#template-dialog-description"),
  templateNameField: document.querySelector("#template-name-field"),
  templateNameInput: document.querySelector("#template-name-input"),
  templateVariableFields: document.querySelector("#template-variable-fields"),
  templateDialogCancel: document.querySelector("#template-dialog-cancel"),
  cancelBatch: document.querySelector("#cancel-batch-button"),
  removeFrame: document.querySelector("#remove-frame-button"),
  batchCount: document.querySelector("#batch-count-input"),
  batchInterval: document.querySelector("#batch-interval-input"),
  batchStart: document.querySelector("#batch-start-input"),
  batchStep: document.querySelector("#batch-step-input"),
  batchPadding: document.querySelector("#batch-padding-input"),
  batchPrefix: document.querySelector("#batch-prefix-input"),
  batchSuffix: document.querySelector("#batch-suffix-input"),
  batchVariable: document.querySelector("#batch-variable-input"),
  batchData: document.querySelector("#batch-data-input"),
  batchOnError: document.querySelector("#batch-on-error-input"),
  batchConfirm: document.querySelector("#batch-confirm-input"),
  batchTokenHelp: document.querySelector("#batch-token-help"),
  batchStatus: document.querySelector("#batch-status"),
  resumeBatch: document.querySelector("#resume-batch-button"),
  discardBatch: document.querySelector("#discard-batch-button"),
  reconcileBatch: document.querySelector("#reconcile-batch-button"),
  batchResumeStatus: document.querySelector("#batch-resume-status"),
  mobileAction: document.querySelector("#mobile-action-button"),
  mobileActionHint: document.querySelector("#mobile-action-hint"),
  flowSteps: document.querySelectorAll("[data-step]"),
};

function createDocument(nodes, height = DEFAULT_HEIGHT) {
  return {
    schema: "mxw01.print-document",
    version: 1,
    page: {
      widthDots: PROFILE_WIDTH,
      heightDots: height,
      margins: { top: 12, right: 16, bottom: 12, left: 16 },
      media: { kind: "continuous", color: "white", labelHeightDots: height, gapDots: 0, profileId: "mxw01-continuous-white" },
    },
    nodes,
    metadata: { source: "mxw01-local-terminal" },
  };
}

function defaultBatchSettings() {
  return {
    count: 1,
    intervalMs: 0,
    confirmEach: false,
    variable: "ticketNumber",
    start: 1,
    step: 1,
    padding: 0,
    prefix: "",
    suffix: "",
    onError: "stop",
  };
}

function createTestDocument() {
  return createDocument([
    { id: "title", kind: "text", text: "MXW01 TEST", x: 24, y: 20, width: 336, height: 30, fontSizeDots: 3, fontWeight: "bold", align: "center", lineHeightDots: 26 },
    { id: "rule", kind: "rule", x: 24, y: 62, width: 336, height: 2, thicknessDots: 2 },
    { id: "body", kind: "text", text: "THERMAL PRINT CHECK", x: 24, y: 81, width: 336, height: 17, fontSizeDots: 2, align: "center", lineHeightDots: 16 },
    { id: "barcode", kind: "barcode", format: "code128", value: "MXW01-TEST", showText: true, x: 69, y: 116, width: 246, height: 74 },
    { id: "footer", kind: "text", text: "384 DOTS / LOCAL NODE", x: 24, y: 211, width: 336, height: 12, fontSizeDots: 1, align: "center" },
  ]);
}

function createPriceDocument() {
  return createDocument([
    { id: "product", kind: "text", text: "KAFFE", x: 24, y: 19, width: 336, height: 28, fontSizeDots: 3, fontWeight: "bold", align: "center" },
    { id: "details", kind: "text", text: "MELLANROST · 250 G", x: 24, y: 57, width: 336, height: 14, fontSizeDots: 1, align: "center" },
    { id: "rule", kind: "rule", x: 24, y: 79, width: 336, height: 2, thicknessDots: 2 },
    { id: "price", kind: "text", text: "89 KR", x: 24, y: 96, width: 336, height: 43, fontSizeDots: 4, fontWeight: "bold", align: "center" },
    { id: "barcode", kind: "barcode", format: "ean13", value: "735012345678", showText: true, x: 74, y: 155, width: 236, height: 64 },
  ], 240);
}

function createQrDocument() {
  return createDocument([
    { id: "title", kind: "text", text: "SKANNA MIG", x: 24, y: 18, width: 336, height: 24, fontSizeDots: 2, fontWeight: "bold", align: "center" },
    { id: "qr", kind: "qr", value: "mxw01.local", errorCorrection: "low", x: 126, y: 50, width: 132, height: 132 },
    { id: "caption", kind: "text", text: "MXW01 LOCAL TEST", x: 24, y: 201, width: 336, height: 14, fontSizeDots: 1, align: "center" },
  ], 230);
}

function createBlankDocument() {
  return createDocument([], 180);
}

function createReceiptDocument() {
  return createDocument([
    { id: "receipt-title", kind: "text", text: "KVITTO", x: 24, y: 18, width: 336, height: 24, fontId: "mxw-bold", fontSizeDots: 2, align: "center" },
    { id: "receipt-rule", kind: "rule", x: 24, y: 49, width: 336, height: 2, thicknessDots: 2 },
    { id: "receipt-body", kind: "text", text: "Kaffe                 89 KR\nSmörgås               45 KR", x: 24, y: 63, width: 336, height: 34, fontId: "mxw-mono", fontSizeDots: 1, lineHeightDots: 14 },
    { id: "receipt-total", kind: "text", text: "TOTAL                 134 KR", x: 24, y: 113, width: 336, height: 16, fontId: "mxw-bold", fontSizeDots: 1 },
    { id: "receipt-footer", kind: "text", text: "TACK FÖR BESÖKET", x: 24, y: 158, width: 336, height: 16, fontId: "mxw-wide", fontSizeDots: 1, align: "center" },
  ], 190);
}

function createTicketDocument() {
  return createDocument([
    { id: "ticket-title", kind: "text", text: "INPASSERING", x: 24, y: 18, width: 336, height: 24, fontId: "mxw-bold", fontSizeDots: 2, align: "center" },
    { id: "ticket-number", kind: "text", text: "NR {{ticketNumber}}", x: 24, y: 53, width: 336, height: 22, fontId: "mxw-wide", fontSizeDots: 2, align: "center" },
    { id: "ticket-rule", kind: "rule", x: 24, y: 84, width: 336, height: 2, thicknessDots: 2 },
    { id: "ticket-barcode", kind: "barcode", format: "code128", value: "T-{{ticketNumber}}", showText: true, x: 55, y: 103, width: 274, height: 68 },
    { id: "ticket-footer", kind: "text", text: "GÄLLER EN ENTRÉ", x: 24, y: 184, width: 336, height: 14, fontId: "mxw-vector", fontSizeDots: 1, align: "center" },
  ], 215);
}

function createParkingDocument() {
  return createDocument([
    { id: "parking-title", kind: "text", text: "PARKERINGSANMÄRKNING", x: 24, y: 18, width: 336, height: 24, autoHeight: true, fontId: "mxw-bold", fontSizeDots: 2, align: "center" },
    { id: "parking-rule", kind: "rule", x: 24, y: 52, width: 336, height: 2, thicknessDots: 2 },
    { id: "parking-date", kind: "text", text: "Datum: {{date}}", x: 24, y: 68, width: 336, height: 16, autoHeight: true, fontId: "mxw-mono", fontSizeDots: 1 },
    { id: "parking-vehicle", kind: "text", text: "Fordon: {{vehicle}}", x: 24, y: 91, width: 336, height: 16, autoHeight: true, fontId: "mxw-mono", fontSizeDots: 1 },
    { id: "parking-reason", kind: "text", text: "Orsak: {{reason}}", x: 24, y: 114, width: 336, height: 30, autoHeight: true, fontId: "mxw-proportional", fontSizeDots: 1, lineHeightDots: 9 },
    { id: "parking-number", kind: "barcode", format: "code128", value: "P-{{ticketNumber}}", showText: true, x: 55, y: 170, width: 274, height: 68 },
    { id: "parking-footer", kind: "text", text: "LÖPENR: {{ticketNumber}}", x: 24, y: 254, width: 336, height: 16, autoHeight: true, fontId: "mxw-vector", fontSizeDots: 1, align: "center" },
  ], 290);
}

function createAttendanceDocument() {
  return createDocument([
    { id: "attendance-title", kind: "text", text: "NÄRVARO", x: 24, y: 18, width: 336, height: 24, fontId: "mxw-bold", fontSizeDots: 2, align: "center" },
    { id: "attendance-date", kind: "text", text: "Datum: __________", x: 24, y: 52, width: 336, height: 14, fontId: "mxw-mono", fontSizeDots: 1 },
    { id: "attendance-list", kind: "checklist", items: [{ text: "Anna" }, { text: "Beata" }, { text: "Calle" }, { text: "David" }], x: 34, y: 78, width: 316, height: 80, itemHeightDots: 18, fontId: "mxw-vector", fontSizeDots: 1 },
  ], 190);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const DRAFT_STORAGE_KEY = "mxw01-local-terminal:draft:v1";
const SAVED_LABELS_STORAGE_KEY = "mxw01-local-terminal:saved-labels:v1";
const BATCH_JOB_STORAGE_KEY = "mxw01-local-terminal:batch-job:v1";
const MAX_SAVED_LABELS = 24;

function documentSnapshot() {
  return {
    document: clone(state.document),
    selectedNodeId: state.selectedNodeId,
  };
}

function documentSignature() {
  return JSON.stringify(state.document);
}

function isDocumentCandidate(candidate) {
  return Boolean(
    candidate &&
    typeof candidate === "object" &&
    candidate.schema === "mxw01.print-document" &&
    candidate.version === 1 &&
    candidate.page &&
    Array.isArray(candidate.nodes)
  );
}

function documentValidationError(candidate) {
  if (!isDocumentCandidate(candidate)) return "Dokumentet måste vara ett mxw01.print-document v1-dokument.";
  const page = candidate.page;
  if (!Number.isSafeInteger(page.widthDots) || page.widthDots !== PROFILE_WIDTH || !Number.isSafeInteger(page.heightDots) || page.heightDots < 40 || page.heightDots > 4000) {
    return "Etiketten måste vara 384 punkter bred och 40–4000 punkter hög.";
  }
  if (!page.margins || typeof page.margins !== "object" || Array.isArray(page.margins)) return "Dokumentet saknar giltiga marginaler.";
  const margins = page.margins;
  if (!["top", "right", "bottom", "left"].every((key) => Number.isSafeInteger(margins[key]) && margins[key] >= 0)) {
    return "Dokumentets marginaler måste vara icke-negativa heltal.";
  }
  if (margins.left + margins.right >= page.widthDots || margins.top + margins.bottom >= page.heightDots) {
    return "Dokumentets marginaler lämnar ingen utskrivbar yta.";
  }
  if (page.media !== undefined) {
    const media = page.media;
    if (!media || typeof media !== "object" || Array.isArray(media)) return "Dokumentets mediaprofil är ogiltig.";
    if (!["continuous", "die-cut", "black-mark"].includes(media.kind)) return "Dokumentet har en okänd mediatyp.";
    if (!MEDIA_COLORS.has(media.color)) return "Dokumentet har en okänd pappersfärg.";
    if (media.kind === "black-mark") return "Black-mark-media stöds inte av den nuvarande MXW01-transporten.";
    if (media.profileId !== undefined) {
      const profile = MEDIA_PROFILES.find((candidateProfile) => candidateProfile.id === media.profileId);
      if (!profile) return "Dokumentet hänvisar till en okänd mediaprofil.";
      if (profile.kind !== media.kind || profile.color !== media.color) return "Mediaprofilens typ och färg stämmer inte med dokumentet.";
    }
    for (const key of ["labelHeightDots", "gapDots"]) {
      if (media[key] !== undefined && (!Number.isSafeInteger(media[key]) || media[key] < 0 || media[key] > 4096)) {
        return "Mediaprofilens mått måste vara icke-negativa heltal.";
      }
    }
    if (media.labelHeightDots !== undefined && media.labelHeightDots !== page.heightDots) {
      return "Mediaprofilens etiketthöjd måste stämma med sidans höjd.";
    }
  }
  if (page.frame !== undefined) {
    const frame = page.frame;
    if (!frame || typeof frame !== "object" || Array.isArray(frame) || !Number.isSafeInteger(frame.insetDots) || frame.insetDots < 0 || !Number.isSafeInteger(frame.thicknessDots) || frame.thicknessDots < 1) {
      return "Ramens inset och tjocklek måste vara giltiga heltal.";
    }
    if (frame.style !== undefined && !FRAME_STYLES.some((candidate) => candidate.value === frame.style)) return "Ramen har en okänd stil.";
    if (2 * (frame.insetDots + frame.thicknessDots) >= Math.min(page.widthDots, page.heightDots)) {
      return "Ramen får inte fylla hela etiketten.";
    }
  }
  if (candidate.nodes.length > 256) return "Dokumentet får innehålla högst 256 objekt.";
  const ids = new Set();
  for (const node of candidate.nodes) {
    if (!node || typeof node !== "object") return "Ett objekt i dokumentet är ogiltigt.";
    if (typeof node.id !== "string" || node.id.length === 0 || node.id.length > 128 || ids.has(node.id)) return "Objekten måste ha unika, icke-tomma id:n.";
    ids.add(node.id);
    if (!["text", "image", "rule", "barcode", "qr", "checklist", "fortune", "icon"].includes(node.kind)) return `Objekttypen ${String(node.kind)} stöds inte.`;
    if (!["x", "y", "width", "height"].every((key) => Number.isSafeInteger(node[key]))) return `Objektet ${node.id} har ogiltig placering eller storlek.`;
    if (node.width <= 0 || node.height <= 0 || node.width > 4096 || node.height > 4096) return `Objektet ${node.id} har ogiltig storlek.`;
    if (node.x < 0 || node.y < 0 || node.x + node.width > page.widthDots || node.y + node.height > page.heightDots) return `Objektet ${node.id} hamnar utanför etiketten.`;
    if (node.rotation !== undefined && ![0, 90, 180, 270].includes(node.rotation)) return `Objektet ${node.id} har en ogiltig rotation.`;
    if (node.kind === "text" && (typeof node.text !== "string" || node.text.length > 2048)) return `Textobjektet ${node.id} är för långt eller ogiltigt.`;
    if ((node.kind === "text" || node.kind === "fortune") && node.autoHeight !== undefined && typeof node.autoHeight !== "boolean") return `Objektet ${node.id} har ett ogiltigt läge för automatisk höjd.`;
    if (node.kind === "text" && node.fontId !== undefined && !FONT_IDS.has(node.fontId)) return `Textobjektet ${node.id} har ett okänt typsnitt.`;
    if (node.kind === "text" && node.fontSizeDots !== undefined && (!Number.isSafeInteger(node.fontSizeDots) || node.fontSizeDots < 1 || node.fontSizeDots > 16)) return `Textobjektet ${node.id} har en ogiltig textstorlek.`;
    if (node.kind === "fortune" && (typeof node.text !== "string" || node.text.length === 0 || node.text.length > 2048)) return `Fortune-cookie-objektet ${node.id} saknar text.`;
    if (node.kind === "fortune" && node.fontId !== undefined && !FONT_IDS.has(node.fontId)) return `Fortune-cookie-objektet ${node.id} har ett okänt typsnitt.`;
    if (node.kind === "icon" && !ICON_IDS.has(node.iconId)) return `FontAwesome-objektet ${node.id} har en okänd ikon.`;
    if (node.kind === "checklist" && (!Array.isArray(node.items) || node.items.length === 0 || node.items.length > 64)) return `Checklistan ${node.id} måste innehålla 1–64 rader.`;
    if (node.kind === "checklist" && node.items.some((item) => !item || typeof item !== "object" || typeof item.text !== "string" || item.text.length > 256 || (item.checked !== undefined && typeof item.checked !== "boolean"))) return `Checklistan ${node.id} innehåller en ogiltig rad.`;
    if (node.kind === "checklist" && node.fontId !== undefined && !FONT_IDS.has(node.fontId)) return `Checklistan ${node.id} har ett okänt typsnitt.`;
    if ((node.kind === "barcode" || node.kind === "qr") && (typeof node.value !== "string" || node.value.length === 0)) return `Kodobjektet ${node.id} saknar ett värde.`;
    if (node.kind === "barcode" && !["code128", "ean13", "upca"].includes(node.format)) return `Streckkoden ${node.id} har ett okänt format.`;
    if (node.kind === "barcode" && node.showText !== undefined && typeof node.showText !== "boolean") return `Streckkoden ${node.id} har ett ogiltigt textläge.`;
    if (node.kind === "qr" && node.errorCorrection !== undefined && node.errorCorrection !== "low") return `QR-koden ${node.id} använder en felkorrigering som inte stöds.`;
    if (node.kind === "image" && (!node.image || typeof node.image !== "object" || !Number.isSafeInteger(node.image.width) || !Number.isSafeInteger(node.image.height) || node.image.width <= 0 || node.image.height <= 0 || node.image.width * node.image.height > MAX_IMAGE_PIXELS || typeof node.image.dataBase64 !== "string" || base64ByteLength(node.image.dataBase64) !== node.image.width * node.image.height * 4)) return `Bildobjektet ${node.id} har ogiltig eller för stor RGBA-data.`;
  }
  return null;
}

function pendingBatchValidationError(record) {
  if (!record || record.version !== 1 || typeof record.jobId !== "string" || record.jobId.length === 0 || record.jobId.length > 128) return "Checkpointets jobb-id är ogiltigt.";
  if (!record.snapshot || typeof record.snapshot !== "object" || documentValidationError(record.snapshot.document)) return "Checkpointets dokument är ogiltigt.";
  const batch = record.snapshot.batch;
  if (!batch || typeof batch !== "object" || !Number.isInteger(batch.count) || batch.count < 1 || batch.count > 1000) return "Checkpointets antal är ogiltigt.";
  if (!Number.isInteger(record.nextIndex) || record.nextIndex < 0 || record.nextIndex > batch.count) return "Checkpointets nästa index är ogiltigt.";
  if (!Number.isInteger(batch.intervalMs) || batch.intervalMs < 0 || batch.intervalMs > 60000 || batch.confirmEach !== Boolean(batch.confirmEach)) return "Checkpointets paus eller bekräftelse är ogiltig.";
  if (typeof batch.variable !== "string" || !/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(batch.variable)) return "Checkpointets sekvensfält är ogiltigt.";
  if (batch.onError !== undefined && !["stop", "retry", "skip"].includes(batch.onError)) return "Checkpointets felhantering är ogiltig.";
  if (!Number.isSafeInteger(batch.start) || !Number.isSafeInteger(batch.step) || !Number.isInteger(batch.padding) || batch.padding < 0 || batch.padding > 12) return "Checkpointets sekvens är ogiltig.";
  if (typeof batch.prefix !== "string" || batch.prefix.length > 32 || typeof batch.suffix !== "string" || batch.suffix.length > 32) return "Checkpointets prefix eller suffix är ogiltigt.";
  if (!Number.isInteger(record.snapshot.intensity) || record.snapshot.intensity < 0 || record.snapshot.intensity > 255) return "Checkpointets intensitet är ogiltig.";
  if (!["threshold", "steinberg", "bayer", "atkinson", "pattern"].includes(record.snapshot.dither)) return "Checkpointets dithering är ogiltig.";
  if (typeof record.snapshot.templateFingerprint !== "string" || !/^fnv1a32-[0-9a-f]{8}$/.test(record.snapshot.templateFingerprint)) return "Checkpointets mallfingerprint är ogiltig.";
  if (record.snapshot.templateValues !== undefined && (
    !record.snapshot.templateValues || typeof record.snapshot.templateValues !== "object" || Array.isArray(record.snapshot.templateValues) ||
    Object.entries(record.snapshot.templateValues).some(([name, value]) => !/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name) || typeof value !== "string" || value.length > 256)
  )) return "Checkpointets mallvärden är ogiltiga.";
  return null;
}

function updateHistoryUi() {
  elements.undo.disabled = state.history.length === 0;
  elements.redo.disabled = state.future.length === 0;
}

function invalidatePreview() {
  state.documentRevision += 1;
  state.previewReady = false;
  state.previewRevision = -1;
  state.previewHasErrors = true;
  updatePrintAvailability();
}

function saveDraft() {
  try {
    const serialized = JSON.stringify({
      version: 1,
      activeTemplate: state.activeTemplate,
      document: state.document,
      selectedNodeId: state.selectedNodeId,
      previewMode: state.previewMode,
      printOptions: {
        intensity: state.intensity,
        dither: state.dither,
      },
      ditherExplicit: state.ditherExplicit,
      batch: state.batch,
      batchRows: state.batchRows,
      templateValues: state.templateValues,
    });
    if (new TextEncoder().encode(serialized).length > MAX_LOCAL_STORAGE_BYTES) {
      throw new Error("draft-too-large");
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
    elements.draftStatus.textContent = "Lokalt utkast sparat";
    elements.draftStatus.classList.add("saved");
  } catch (_error) {
    elements.draftStatus.textContent = "Kunde inte spara lokalt utkast";
    elements.draftStatus.classList.remove("saved");
  }
}

function loadSavedLabels() {
  try {
    const raw = localStorage.getItem(SAVED_LABELS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    state.savedLabels = Array.isArray(parsed)
      ? parsed.filter((label) => label && typeof label === "object" && typeof label.id === "string" && typeof label.name === "string" && !documentValidationError(label.document)).slice(0, MAX_SAVED_LABELS)
      : [];
  } catch (_error) {
    state.savedLabels = [];
  }
}

function persistSavedLabels() {
  try {
    const serialized = JSON.stringify(state.savedLabels);
    if (new TextEncoder().encode(serialized).length > MAX_LOCAL_STORAGE_BYTES) {
      throw new Error("labels-too-large");
    }
    localStorage.setItem(SAVED_LABELS_STORAGE_KEY, serialized);
    return true;
  } catch (_error) {
    showToast("Kunde inte spara etikettbiblioteket lokalt.", true);
    return false;
  }
}

function savePendingBatchJob(record) {
  try {
    const serialized = JSON.stringify(record);
    if (new TextEncoder().encode(serialized).length > MAX_LOCAL_STORAGE_BYTES) throw new Error("batch-too-large");
    localStorage.setItem(BATCH_JOB_STORAGE_KEY, serialized);
    state.pendingBatchJob = record;
    syncPendingBatchUi();
    return true;
  } catch (_error) {
    showToast("Batchens checkpoint kunde inte sparas lokalt.", true);
    return false;
  }
}

function clearPendingBatchJob() {
  state.pendingBatchJob = null;
  try { localStorage.removeItem(BATCH_JOB_STORAGE_KEY); } catch (_error) { /* storage may be unavailable */ }
  syncPendingBatchUi();
}

function loadPendingBatchJob() {
  try {
    const raw = localStorage.getItem(BATCH_JOB_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (pendingBatchValidationError(parsed)) {
      localStorage.removeItem(BATCH_JOB_STORAGE_KEY);
      return;
    }
    state.pendingBatchJob = parsed;
  } catch (_error) {
    state.pendingBatchJob = null;
  }
  syncPendingBatchUi();
}

function syncPendingBatchUi() {
  const pending = state.pendingBatchJob;
  const visible = Boolean(pending) && !state.job.active;
  if (elements.resumeBatch) elements.resumeBatch.hidden = !visible;
  if (elements.discardBatch) elements.discardBatch.hidden = !visible;
  if (elements.batchResumeStatus) {
    elements.batchResumeStatus.hidden = !visible;
    elements.batchResumeStatus.textContent = visible
      ? `Sparat jobb: etikett ${(pending.nextIndex ?? 0) + 1} av ${pending.snapshot.batch.count}. Kontrollera status innan du återupptar.`
      : "";
  }
}

function checkpointActiveBatch(status, nextIndex, errorMessage) {
  const snapshot = state.job.snapshot;
  if (!snapshot || !state.job.id) return false;
  return savePendingBatchJob({
    version: 1,
    jobId: state.job.id,
    status,
    nextIndex,
    error: errorMessage ?? null,
    snapshot: {
      document: snapshot.document,
      batch: snapshot.batch,
      batchRows: snapshot.batchRows,
      templateValues: snapshot.templateValues,
      intensity: snapshot.intensity,
      dither: snapshot.dither,
      templateFingerprint: snapshot.templateFingerprint,
    },
    updatedAt: new Date().toISOString(),
  });
}

function renderSavedLabels() {
  if (state.savedLabels.length === 0) {
    elements.savedLabelList.innerHTML = '<p class="empty-list">Inga sparade etiketter ännu.</p>';
    return;
  }
  elements.savedLabelList.innerHTML = state.savedLabels.map((label) => `
    <div class="saved-label-item">
      <button class="saved-label-load" data-label-id="${escapeAttribute(label.id)}" type="button">
        <strong>${escapeHtml(label.name)}</strong><small>${new Date(label.updatedAt ?? label.createdAt ?? Date.now()).toLocaleDateString("sv-SE")}</small>
      </button>
      <button class="icon-button danger saved-label-delete" data-delete-label-id="${escapeAttribute(label.id)}" type="button" aria-label="Ta bort ${escapeAttribute(label.name)}" title="Ta bort sparad etikett">×</button>
    </div>
  `).join("");
  elements.savedLabelList.querySelectorAll("[data-label-id]").forEach((button) => {
    button.addEventListener("click", () => loadSavedLabel(button.dataset.labelId));
  });
  elements.savedLabelList.querySelectorAll("[data-delete-label-id]").forEach((button) => {
    button.addEventListener("click", () => deleteSavedLabel(button.dataset.deleteLabelId));
  });
}

function saveCurrentLabel(name) {
  const trimmedName = name.trim().slice(0, 80);
  if (!trimmedName) {
    showToast("Ange ett namn på etiketten.", true);
    return;
  }
  const now = new Date().toISOString();
  const existing = state.savedLabels.find((label) => label.name.toLocaleLowerCase("sv-SE") === trimmedName.toLocaleLowerCase("sv-SE"));
  const label = {
    id: existing?.id ?? uniqueId("label"),
    name: trimmedName,
    document: clone(state.document),
    selectedNodeId: state.selectedNodeId,
    activeTemplate: state.activeTemplate,
    previewMode: state.previewMode,
    printOptions: { intensity: state.intensity, dither: state.dither },
    profileId: state.preview?.profileId ?? "mxw01",
    rendererVersion: state.preview?.rendererVersion ?? "pending",
    documentFingerprint: state.preview?.documentFingerprint ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  state.savedLabels = [label, ...state.savedLabels.filter((item) => item.id !== label.id)].slice(0, MAX_SAVED_LABELS);
  if (persistSavedLabels()) {
    renderSavedLabels();
    elements.labelName.value = "";
    showToast(existing ? "Den sparade etiketten uppdaterades." : "Etiketten sparades.");
  }
}

function loadSavedLabel(labelId) {
  const label = state.savedLabels.find((item) => item.id === labelId);
  if (!label || documentValidationError(label.document)) {
    showToast("Den sparade etiketten är inte längre giltig.", true);
    return;
  }
  state.activeTemplate = typeof label.activeTemplate === "string" ? label.activeTemplate : "custom";
  state.previewMode = label.previewMode === "native" ? "native" : "fit";
  state.intensity = Number.isInteger(label.printOptions?.intensity) ? label.printOptions.intensity : 93;
  state.dither = ["threshold", "steinberg", "bayer", "atkinson", "pattern"].includes(label.printOptions?.dither) ? label.printOptions.dither : DEFAULT_DITHER;
  state.ditherExplicit = true;
  elements.intensity.value = String(state.intensity);
  elements.intensityValue.textContent = String(state.intensity);
  elements.dither.value = state.dither;
  setDocument(label.document, label.document.nodes.some((node) => node.id === label.selectedNodeId) ? label.selectedNodeId : label.document.nodes[0]?.id ?? null);
  document.querySelectorAll(".mode-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.template === state.activeTemplate));
  updateModeAria();
  setPreviewMode(state.previewMode);
  renderAll();
  showToast(`Laddade: ${label.name}`);
}

function deleteSavedLabel(labelId) {
  const label = state.savedLabels.find((item) => item.id === labelId);
  if (!label) return;
  state.savedLabels = state.savedLabels.filter((item) => item.id !== labelId);
  if (persistSavedLabels()) {
    renderSavedLabels();
    showToast(`Tog bort: ${label.name}`);
  }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (documentValidationError(saved?.document)) return false;
    state.document = autoGrowTextDocument(saved.document);
    state.activeTemplate = typeof saved.activeTemplate === "string" ? saved.activeTemplate : "test";
    state.selectedNodeId = state.document.nodes.some((node) => node.id === saved.selectedNodeId)
      ? saved.selectedNodeId
      : state.document.nodes[0]?.id ?? null;
    state.previewMode = saved.previewMode === "native" ? "native" : "fit";
    const savedPrintOptions = saved.printOptions && typeof saved.printOptions === "object" ? saved.printOptions : {};
    state.intensity = Number.isInteger(savedPrintOptions.intensity) && savedPrintOptions.intensity >= 0 && savedPrintOptions.intensity <= 255
      ? savedPrintOptions.intensity
      : 93;
    const savedDither = savedPrintOptions.dither;
    const migratedLegacyDither = saved.ditherExplicit !== true && savedDither === "threshold";
    state.dither = !migratedLegacyDither && ["threshold", "steinberg", "bayer", "atkinson", "pattern"].includes(savedDither)
      ? savedDither
      : DEFAULT_DITHER;
    state.ditherExplicit = saved.ditherExplicit === true;
    const savedBatch = saved.batch && typeof saved.batch === "object" ? saved.batch : {};
    state.batch = {
      count: Number.isInteger(savedBatch.count) ? Math.max(1, Math.min(1000, savedBatch.count)) : 1,
      intervalMs: Number.isInteger(savedBatch.intervalMs) ? Math.max(0, Math.min(60000, savedBatch.intervalMs)) : 0,
      confirmEach: savedBatch.confirmEach === true,
      variable: typeof savedBatch.variable === "string" && savedBatch.variable.length <= 64 ? savedBatch.variable : "ticketNumber",
      start: Number.isInteger(savedBatch.start) ? savedBatch.start : 1,
      step: Number.isInteger(savedBatch.step) ? savedBatch.step : 1,
      padding: Number.isInteger(savedBatch.padding) ? Math.max(0, Math.min(12, savedBatch.padding)) : 0,
      prefix: typeof savedBatch.prefix === "string" ? savedBatch.prefix.slice(0, 32) : "",
      suffix: typeof savedBatch.suffix === "string" ? savedBatch.suffix.slice(0, 32) : "",
      onError: ["stop", "retry", "skip"].includes(savedBatch.onError) ? savedBatch.onError : "stop",
    };
    state.batchRows = Array.isArray(saved.batchRows)
      ? saved.batchRows.filter((row) => row && typeof row === "object" && !Array.isArray(row)).slice(0, 1000).map((row) => Object.fromEntries(Object.entries(row).filter(([name, value]) => /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name) && typeof value === "string").slice(0, 64)))
      : [];
    state.templateValues = saved.templateValues && typeof saved.templateValues === "object" && !Array.isArray(saved.templateValues)
      ? Object.fromEntries(Object.entries(saved.templateValues).filter(([name, value]) => /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name) && typeof value === "string").slice(0, 64))
      : {};
    state.documentRevision += 1;
    document.querySelectorAll(".mode-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.template === state.activeTemplate));
    updateModeAria();
    elements.intensity.value = String(state.intensity);
    elements.intensityValue.textContent = String(state.intensity);
    elements.dither.value = state.dither;
    if (migratedLegacyDither) saveDraft();
    elements.draftStatus.textContent = "Lokalt utkast återställt";
    elements.draftStatus.classList.add("saved");
    return true;
  } catch (_error) {
    return false;
  }
}

function setDocument(nextDocument, selectedNodeId = state.selectedNodeId) {
  const next = autoGrowTextDocument(clone(nextDocument));
  if (JSON.stringify(next) === JSON.stringify(state.document)) {
    state.selectedNodeId = selectedNodeId;
    saveDraft();
    return;
  }
  state.history.push(documentSnapshot());
  if (state.history.length > 50) state.history.shift();
  state.future = [];
  state.document = next;
  state.selectedNodeId = selectedNodeId;
  invalidatePreview();
  updateHistoryUi();
  saveDraft();
  updatePrintAvailability();
}

function undo() {
  const previous = state.history.pop();
  if (!previous) return;
  state.future.push(documentSnapshot());
  state.document = clone(previous.document);
  state.selectedNodeId = previous.selectedNodeId;
  invalidatePreview();
  updateHistoryUi();
  saveDraft();
  renderAll();
  showToast("Ändringen ångrades.");
}

function redo() {
  const next = state.future.pop();
  if (!next) return;
  state.history.push(documentSnapshot());
  state.document = clone(next.document);
  state.selectedNodeId = next.selectedNodeId;
  invalidatePreview();
  updateHistoryUi();
  saveDraft();
  renderAll();
  showToast("Ändringen gjordes om.");
}

function selectedNode() {
  return state.document.nodes.find((node) => node.id === state.selectedNodeId) ?? null;
}

function previewCanvasSize() {
  return {
    width: Math.max(1, Number(elements.previewCanvas.width) || state.document.page.widthDots || PROFILE_WIDTH),
    height: Math.max(1, Number(elements.previewCanvas.height) || state.document.page.heightDots || DEFAULT_HEIGHT),
  };
}

function isContinuousMedia(documentValue = state.document) {
  const kind = documentValue?.page?.media?.kind;
  return kind ? kind === "continuous" : currentMediaProfile().kind === "continuous";
}

function pageWithHeight(page, height) {
  const nextHeight = Math.max(MIN_PAGE_HEIGHT, Math.min(MAX_PAGE_HEIGHT, Math.trunc(height)));
  const nextPage = { ...page, heightDots: nextHeight };
  if (page.media?.kind === "continuous") {
    nextPage.media = { ...page.media, labelHeightDots: nextHeight };
  }
  return nextPage;
}

function minimumPageHeightForNode(node, y = node.y, page = state.document.page) {
  const bottom = Math.max(0, Math.trunc(Number(y) || 0)) + Math.max(1, Math.trunc(Number(node.height) || 1));
  const bottomPadding = Math.max(AUTO_PAGE_BOTTOM_PADDING, Number(page.margins?.bottom) || 0);
  return bottom + bottomPadding;
}

function minimumPageHeightForDocument(documentValue = state.document) {
  let minimum = Math.max(MIN_PAGE_HEIGHT, Number(documentValue.page.margins?.top) || 0, Number(documentValue.page.margins?.bottom) || 0);
  for (const node of documentValue.nodes) {
    minimum = Math.max(minimum, minimumPageHeightForNode(node, node.y, documentValue.page));
  }
  const frame = documentValue.page.frame;
  if (frame) {
    minimum = Math.max(minimum, 2 * (Math.max(0, frame.insetDots) + Math.max(1, frame.thicknessDots)) + 1);
  }
  return Math.min(MAX_PAGE_HEIGHT, minimum);
}

function textGlyphAdvanceForAutoHeight(fontId, character, scale) {
  if (fontId === "mxw-condensed") return 4 * scale;
  if (fontId === "mxw-wide") return 11 * scale;
  if (fontId !== "mxw-proportional") return 6 * scale;

  const normalized = character.toUpperCase();
  let width = 5;
  if (normalized === " ") width = 3;
  else if (["!", ",", ".", ":", ";", "·"].includes(normalized)) width = 2;
  else if (["(", ")", "[", "]", "1", "I"].includes(normalized)) width = 3;
  else if (normalized === "-") width = 4;
  return (width + 1) * scale;
}

function textLineWidthForAutoHeight(line, fontId, scale) {
  const characters = [...line];
  if (characters.length === 0) return 0;
  return characters.reduce((width, character, index) => (
    width + textGlyphAdvanceForAutoHeight(fontId, character, scale) - (index === characters.length - 1 ? scale : 0)
  ), 0);
}

function splitTextTokenForAutoHeight(token, maxWidth, fontId, scale) {
  const chunks = [];
  let current = "";
  for (const character of [...token]) {
    const candidate = `${current}${character}`;
    if (current && textLineWidthForAutoHeight(candidate, fontId, scale) > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current || chunks.length === 0) chunks.push(current);
  return chunks;
}

function wrappedLineCountForAutoHeight(line, maxWidth, fontId, scale) {
  if (line.length === 0) return 1;
  const tokens = line.match(/\s+|\S+/gu) ?? [line];
  let count = 0;
  let current = "";
  for (const token of tokens) {
    const candidate = `${current}${token}`;
    if (current && textLineWidthForAutoHeight(candidate, fontId, scale) > maxWidth) {
      count += 1;
      current = token.replace(/^\s+/u, "");
    } else {
      current = candidate;
    }
    if (textLineWidthForAutoHeight(current, fontId, scale) > maxWidth) {
      const chunks = splitTextTokenForAutoHeight(current, maxWidth, fontId, scale);
      count += Math.max(0, chunks.length - 1);
      current = chunks.at(-1) ?? "";
    }
  }
  return count + 1;
}

function textNodeRequiredHeight(node) {
  if (!node || (node.kind !== "text" && node.kind !== "fortune")) return 0;
  const scale = Math.max(1, Math.trunc(Number(node.fontSizeDots) || (node.kind === "fortune" ? 2 : 1)));
  const fontId = node.fontId ?? "mxw-vector";
  const lineHeight = Math.max(1, Math.trunc(Number(node.lineHeightDots) || 8 * scale));
  const width = Math.max(1, Math.trunc(Number(node.width) || 1));
  const lineCount = String(node.text ?? "")
    .split("\n")
    .reduce((count, line) => count + wrappedLineCountForAutoHeight(line, width, fontId, scale), 0);
  return Math.max(1, 7 * scale + Math.max(0, lineCount - 1) * lineHeight);
}

function checklistNodeRequiredLayout(node) {
  if (!node || node.kind !== "checklist") return { height: 0, itemHeightDots: 0 };
  const scale = Math.max(1, Math.trunc(Number(node.fontSizeDots) || 1));
  const baseItemHeight = Math.max(8, Math.trunc(Number(node.itemHeightDots) || 10 * scale));
  const rowHeight = (node.items ?? []).reduce((height, item) => Math.max(height, textNodeRequiredHeight({
    kind: "text",
    text: `${item.checked ? "[X]" : "[ ]"} ${item.text ?? ""}`,
    width: node.width,
    fontId: node.fontId,
    fontSizeDots: node.fontSizeDots,
    lineHeightDots: 8 * scale,
  })), baseItemHeight);
  return {
    height: Math.max(1, rowHeight * Math.max(1, node.items?.length ?? 0)),
    itemHeightDots: rowHeight,
  };
}

function autoGrowTextDocument(documentValue) {
  let page = documentValue.page;
  let changed = false;
  const nodes = documentValue.nodes.map((node) => {
    let nextNode = node;
    if ((node.kind === "text" || node.kind === "fortune") && node.autoHeight !== false) {
      const requiredHeight = textNodeRequiredHeight(node);
      if (requiredHeight > node.height) nextNode = { ...node, height: requiredHeight };
    } else if (node.kind === "checklist" && node.autoHeight !== false) {
      const layout = checklistNodeRequiredLayout(node);
      if (layout.height > node.height || layout.itemHeightDots !== (node.itemHeightDots ?? layout.itemHeightDots)) {
        nextNode = { ...node, height: Math.max(node.height, layout.height), itemHeightDots: layout.itemHeightDots };
      }
    }
    if (nextNode === node) return node;
    changed = true;
    const continuous = isContinuousMedia({ ...documentValue, page });
    const height = continuous
      ? nextNode.height
      : Math.min(nextNode.height, Math.max(1, page.heightDots - nextNode.y));
    nextNode = { ...nextNode, height };
    if (continuous) {
      page = pageWithHeight(page, minimumPageHeightForNode(nextNode, nextNode.y, page));
    }
    return nextNode;
  });
  if (isContinuousMedia({ ...documentValue, page }) ) {
    const minimumHeight = minimumPageHeightForDocument({ ...documentValue, page, nodes });
    if (minimumHeight > page.heightDots) {
      page = pageWithHeight(page, minimumHeight);
      changed = true;
    }
  }
  if (!changed && page === documentValue.page) return documentValue;
  return { ...documentValue, page, nodes };
}

function pageHeightForNode(node, y = node.y, page = state.document.page) {
  if (!isContinuousMedia({ ...state.document, page })) return page.heightDots;
  return Math.max(page.heightDots, Math.min(MAX_PAGE_HEIGHT, minimumPageHeightForNode(node, y, page)));
}

function expandPreviewCanvasPlaceholder(height) {
  const canvas = elements.previewCanvas;
  const currentHeight = Math.max(1, Number(canvas.height) || 1);
  const nextHeight = Math.max(currentHeight, Math.min(MAX_PAGE_HEIGHT, Math.trunc(height)));
  if (nextHeight <= currentHeight) return false;
  const context = canvas.getContext("2d");
  let existingPixels = null;
  if (context) {
    try {
      existingPixels = context.getImageData(0, 0, canvas.width, currentHeight);
    } catch (_error) {
      existingPixels = null;
    }
  }
  canvas.height = nextHeight;
  if (existingPixels) canvas.getContext("2d")?.putImageData(existingPixels, 0, 0);
  return true;
}

function syncWysiwygOverlayGeometry() {
  const overlay = elements.previewOverlay;
  if (!overlay || !elements.previewCanvas || !elements.paperStage) return;
  const geometry = previewCanvasGeometry();
  overlay.style.left = `${geometry.left}px`;
  overlay.style.top = `${geometry.top}px`;
  overlay.style.width = `${geometry.width}px`;
  overlay.style.height = `${geometry.height}px`;
}

function clampNodePosition(node, x, y, pageHeight = state.document.page.heightDots) {
  const pageWidth = Math.max(1, Number(state.document.page.widthDots) || PROFILE_WIDTH);
  const boundedPageHeight = Math.max(1, Number(pageHeight) || DEFAULT_HEIGHT);
  const nodeWidth = Math.max(1, Number(node.width) || 1);
  const nodeHeight = Math.max(1, Number(node.height) || 1);
  const maxX = Math.max(0, pageWidth - nodeWidth);
  const maxY = Math.max(0, boundedPageHeight - nodeHeight);
  return {
    x: Math.round(Math.max(0, Math.min(maxX, Number(x) || 0))),
    y: Math.round(Math.max(0, Math.min(maxY, Number(y) || 0))),
  };
}

function previewNodePosition(node) {
  if (state.wysiwygDrag?.nodeId === node.id) {
    return { x: state.wysiwygDrag.currentX, y: state.wysiwygDrag.currentY };
  }
  return clampNodePosition(node, node.x, node.y);
}

function previewCanvasGeometry() {
  const canvasRect = elements.previewCanvas.getBoundingClientRect();
  const stageRect = elements.paperStage.getBoundingClientRect();
  const canvasSize = previewCanvasSize();
  return {
    left: canvasRect.left - stageRect.left + elements.paperStage.scrollLeft - elements.paperStage.clientLeft,
    top: canvasRect.top - stageRect.top + elements.paperStage.scrollTop - elements.paperStage.clientTop,
    width: canvasRect.width,
    height: canvasRect.height,
    documentWidth: canvasSize.width,
    documentHeight: canvasSize.height,
  };
}

function positionPreviewHandle(handle, node, position = previewNodePosition(node)) {
  const geometry = previewCanvasGeometry();
  const scaleX = geometry.width / geometry.documentWidth;
  const scaleY = geometry.height / geometry.documentHeight;
  handle.style.left = `${position.x * scaleX}px`;
  handle.style.top = `${position.y * scaleY}px`;
  handle.style.width = `${Math.max(4, node.width * scaleX)}px`;
  handle.style.height = `${Math.max(4, node.height * scaleY)}px`;
}

function syncInspectorPosition(x, y) {
  const xInput = elements.inspector.querySelector('[data-field="x"]');
  const yInput = elements.inspector.querySelector('[data-field="y"]');
  if (xInput) xInput.value = String(x);
  if (yInput) yInput.value = String(y);
}

function focusPreviewHandle(nodeId) {
  const handle = [...elements.previewOverlay.querySelectorAll(".preview-node-handle")].find((candidate) => candidate.dataset.nodeId === nodeId);
  handle?.focus({ preventScroll: true });
}

function renderWysiwygOverlay() {
  const overlay = elements.previewOverlay;
  if (!overlay || !elements.previewCanvas || !elements.paperStage) return;
  const geometry = previewCanvasGeometry();
  overlay.replaceChildren();
  const frame = state.document.page.frame;
  overlay.hidden = (state.document.nodes.length === 0 && !frame) || geometry.width < 2 || geometry.height < 2;
  if (overlay.hidden) return;
  syncWysiwygOverlayGeometry();
  if (frame) {
    const inset = Math.max(0, Number(frame.insetDots) || 0);
    const frameNode = {
      x: inset,
      y: inset,
      width: Math.max(1, state.document.page.widthDots - inset * 2),
      height: Math.max(1, state.document.page.heightDots - inset * 2),
    };
    const frameHandle = document.createElement("button");
    frameHandle.type = "button";
    frameHandle.className = `preview-node-handle frame-handle${state.selectedNodeId === FRAME_ELEMENT_ID ? " selected" : ""}`;
    frameHandle.dataset.nodeId = FRAME_ELEMENT_ID;
    frameHandle.dataset.nodeKind = "ram";
    frameHandle.setAttribute("aria-label", `Välj ram: ${frameStyleLabel(frame.style)}`);
    frameHandle.title = "Klicka för att välja ram";
    frameHandle.disabled = state.job.active || state.printing;
    positionPreviewHandle(frameHandle, frameNode, frameNode);
    frameHandle.addEventListener("pointerdown", handleWysiwygPointerDown);
    frameHandle.addEventListener("click", handleWysiwygClick);
    frameHandle.addEventListener("keydown", handleWysiwygKeydown);
    overlay.append(frameHandle);
  }
  state.document.nodes.forEach((node) => {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = `preview-node-handle${node.id === state.selectedNodeId ? " selected" : ""}`;
    handle.dataset.nodeId = node.id;
    handle.dataset.nodeKind = node.kind;
    handle.setAttribute("aria-label", `Flytta ${node.kind}: ${nodeLabel(node)}`);
    handle.setAttribute("aria-keyshortcuts", "Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight");
    handle.title = "Klicka för att välja · dra för att flytta";
    handle.disabled = state.job.active || state.printing;
    positionPreviewHandle(handle, node);
    handle.addEventListener("pointerdown", handleWysiwygPointerDown);
    handle.addEventListener("click", handleWysiwygClick);
    handle.addEventListener("keydown", handleWysiwygKeydown);
    overlay.append(handle);
  });
}

function commitWysiwygPosition(nodeId, x, y, focus = false, requestedPageHeight = state.document.page.heightDots) {
  const node = state.document.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return;
  const requestedPage = isContinuousMedia()
    ? pageWithHeight(state.document.page, requestedPageHeight)
    : state.document.page;
  const pageHeight = Math.max(
    state.document.page.heightDots,
    pageHeightForNode(node, y, requestedPage),
  );
  const page = pageWithHeight(state.document.page, pageHeight);
  const position = clampNodePosition(node, x, y, page.heightDots);
  if (position.x === node.x && position.y === node.y && page.heightDots === state.document.page.heightDots) return;
  setDocument({
    ...state.document,
    page,
    nodes: state.document.nodes.map((candidate) => candidate.id === nodeId ? { ...candidate, ...position } : candidate),
  }, nodeId);
  renderAll();
  if (focus) window.requestAnimationFrame(() => focusPreviewHandle(nodeId));
}

function handleWysiwygPointerDown(event) {
  if (event.button !== 0 || state.job.active || state.printing) return;
  const handle = event.currentTarget;
  const nodeId = handle.dataset.nodeId;
  if (nodeId === FRAME_ELEMENT_ID) {
    event.preventDefault();
    selectNode(FRAME_ELEMENT_ID, { focusInspector: false, renderPreview: false });
    elements.previewOverlay.querySelectorAll(".preview-node-handle.selected").forEach((candidate) => candidate.classList.remove("selected"));
    handle.classList.add("selected");
    handle.focus({ preventScroll: true });
    return;
  }
  const node = state.document.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return;
  event.preventDefault();
  selectNode(nodeId, { focusInspector: false, renderPreview: false });
  elements.previewOverlay.querySelectorAll(".preview-node-handle.selected").forEach((candidate) => candidate.classList.remove("selected"));
  const position = clampNodePosition(node, node.x, node.y);
  const geometry = previewCanvasGeometry();
  state.wysiwygDrag = {
    nodeId,
    pointerId: event.pointerId,
    handle,
    startClientX: event.clientX,
    startClientY: event.clientY,
    originalX: position.x,
    originalY: position.y,
    currentX: position.x,
    currentY: position.y,
    scaleX: geometry.width / Math.max(1, geometry.documentWidth),
    scaleY: geometry.height / Math.max(1, geometry.documentHeight),
    pendingPageHeight: state.document.page.heightDots,
    moved: false,
  };
  handle.classList.add("selected", "dragging");
  handle.focus({ preventScroll: true });
  try { handle.setPointerCapture(event.pointerId); } catch (_error) { /* Pointer capture is optional. */ }
}

function handleWysiwygClick(event) {
  if (state.job.active || state.printing) return;
  const nodeId = event.currentTarget.dataset.nodeId;
  if (nodeId === FRAME_ELEMENT_ID) {
    selectNode(FRAME_ELEMENT_ID, { focusInspector: false });
    return;
  }
  if (state.document.nodes.some((node) => node.id === nodeId)) {
    selectNode(nodeId, { focusInspector: false });
  }
}

function handleWysiwygPointerMove(event) {
  const drag = state.wysiwygDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const node = state.document.nodes.find((candidate) => candidate.id === drag.nodeId);
  if (!node) return;
  const requestedX = drag.originalX + (event.clientX - drag.startClientX) / Math.max(0.0001, drag.scaleX);
  const requestedY = drag.originalY + (event.clientY - drag.startClientY) / Math.max(0.0001, drag.scaleY);
  const nextPageHeight = pageHeightForNode(node, requestedY, state.document.page);
  if (nextPageHeight > drag.pendingPageHeight) {
    drag.pendingPageHeight = nextPageHeight;
    if (expandPreviewCanvasPlaceholder(nextPageHeight)) syncWysiwygOverlayGeometry();
  }
  const next = clampNodePosition(
    node,
    requestedX,
    requestedY,
    drag.pendingPageHeight,
  );
  if (next.x === drag.currentX && next.y === drag.currentY) return;
  drag.currentX = next.x;
  drag.currentY = next.y;
  drag.moved = true;
  positionPreviewHandle(drag.handle, node, next);
  syncInspectorPosition(next.x, next.y);
}

function finishWysiwygDrag(cancelled = false) {
  const drag = state.wysiwygDrag;
  if (!drag) return;
  state.wysiwygDrag = null;
  try { drag.handle.releasePointerCapture?.(drag.pointerId); } catch (_error) { /* Pointer capture is optional. */ }
  if (!cancelled && drag.moved) {
    commitWysiwygPosition(drag.nodeId, drag.currentX, drag.currentY, true, drag.pendingPageHeight);
    return;
  }
  if (cancelled && drag.pendingPageHeight > state.document.page.heightDots) {
    elements.previewCanvas.height = state.document.page.heightDots;
  }
  renderWysiwygOverlay();
}

function handleWysiwygPointerUp(event) {
  if (!state.wysiwygDrag || event.pointerId !== state.wysiwygDrag.pointerId) return;
  finishWysiwygDrag(false);
}

function handleWysiwygPointerCancel(event) {
  if (!state.wysiwygDrag || event.pointerId !== state.wysiwygDrag.pointerId) return;
  finishWysiwygDrag(true);
}

function handleWysiwygKeydown(event) {
  const nodeId = event.currentTarget.dataset.nodeId;
  if (["Enter", " "].includes(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    if (nodeId === FRAME_ELEMENT_ID) selectNode(FRAME_ELEMENT_ID, { focusInspector: false });
    else selectNode(nodeId, { focusInspector: false });
    return;
  }
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) || event.metaKey || event.ctrlKey || event.altKey) return;
  const node = state.document.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return;
  event.preventDefault();
  selectNode(nodeId, { focusInspector: false, renderPreview: false });
  const step = event.shiftKey ? 10 : 1;
  const delta = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  }[event.key];
  const requestedPageHeight = pageHeightForNode(node, node.y + delta[1], state.document.page);
  commitWysiwygPosition(nodeId, node.x + delta[0], node.y + delta[1], true, requestedPageHeight);
}

function nodeLabel(node) {
  if (node.kind === "text") return node.text || "Tom text";
  if (node.kind === "barcode") return `${node.format.toUpperCase()} · ${node.value}`;
  if (node.kind === "qr") return node.value || "QR-kod";
  if (node.kind === "image") return "Bild";
  if (node.kind === "rule") return "Avdelare";
  if (node.kind === "checklist") return `${node.items?.length ?? 0} rader`;
  if (node.kind === "fortune") return node.text || "Fortune cookie";
  if (node.kind === "icon") return `FontAwesome · ${iconLabel(node.iconId)}`;
  return node.kind;
}

function iconLabel(iconId) {
  return ICON_CATALOG.find((icon) => icon.value === iconId)?.label ?? iconId;
}

function faIconMarkup(faClass, fallback = "•") {
  return `<i class="fa-solid ${escapeAttribute(faClass)}" data-fallback="${escapeAttribute(fallback)}" aria-hidden="true"></i>`;
}

function iconMarkup(iconId) {
  const icon = ICON_CATALOG.find((candidate) => candidate.value === iconId) ?? ICON_CATALOG[0];
  return faIconMarkup(icon.faClass, icon.fallback);
}

function frameStyleLabel(style = "solid") {
  return FRAME_STYLES.find((candidate) => candidate.value === style)?.label ?? "Hel linje";
}

function fontOptions(selectedFontId) {
  const selected = selectedFontId ?? "mxw-vector";
  const groups = [...new Set(FONT_CATALOG.map((font) => font.group))];
  return groups.map((group) => `<optgroup label="${escapeAttribute(group)}">${FONT_CATALOG.filter((font) => font.group === group).map((font) => `<option ${font.value === selected ? "selected" : ""} value="${escapeAttribute(font.value)}">${escapeHtml(font.label)}</option>`).join("")}</optgroup>`).join("");
}

function nodeIcon(kind) {
  const icons = {
    text: ["fa-font", "T"],
    rule: ["fa-minus", "―"],
    barcode: ["fa-barcode", "▥"],
    qr: ["fa-qrcode", "⌗"],
    image: ["fa-image", "▧"],
    checklist: ["fa-list-check", "☑"],
    fortune: ["fa-wand-magic-sparkles", "✦"],
    frame: ["fa-border-all", "□"],
    icon: ["fa-shapes", "✦"],
  }[kind] ?? ["fa-circle", "·"];
  return faIconMarkup(icons[0], icons[1]);
}

function renderNodeList() {
  const hasFrame = Boolean(state.document.page.frame);
  elements.nodeCount.textContent = String(state.document.nodes.length + (hasFrame ? 1 : 0));
  if (state.document.nodes.length === 0 && !hasFrame) {
    elements.nodeList.innerHTML = '<p class="empty-list">Lägg till ett objekt med knapparna ovan.</p>';
    return;
  }
  const frameMarkup = hasFrame ? `
    <button class="node-item ${state.selectedNodeId === FRAME_ELEMENT_ID ? "active" : ""}" data-node-id="${FRAME_ELEMENT_ID}" type="button" role="option" aria-selected="${state.selectedNodeId === FRAME_ELEMENT_ID}">
      <span class="node-item-icon" aria-hidden="true">${nodeIcon("frame")}</span>
      <span class="node-item-copy"><strong>ram</strong><small>${escapeHtml(frameStyleLabel(state.document.page.frame.style))}</small></span>
    </button>` : "";
  elements.nodeList.innerHTML = frameMarkup + state.document.nodes.map((node) => `
    <button class="node-item ${node.id === state.selectedNodeId ? "active" : ""}" data-node-id="${escapeAttribute(node.id)}" type="button" role="option" aria-selected="${node.id === state.selectedNodeId}">
      <span class="node-item-icon" aria-hidden="true">${nodeIcon(node.kind)}</span>
      <span class="node-item-copy"><strong>${escapeHtml(node.kind === "icon" ? "FontAwesome" : node.kind)}</strong><small>${escapeHtml(nodeLabel(node))}</small></span>
    </button>
  `).join("");
  elements.nodeList.querySelectorAll("[data-node-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectNode(button.dataset.nodeId);
    });
  });
}

function handleNodeListKeydown(event) {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const current = target?.closest("[data-node-id]");
  if (!current || !elements.nodeList.contains(current)) return;
  const options = [...elements.nodeList.querySelectorAll("[data-node-id]")];
  const index = options.indexOf(current);
  if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowUp" ? -1 : 1)));
  const next = options[nextIndex];
  if (!next) return;
  next.focus();
  selectNode(next.dataset.nodeId, { focusInspector: false });
}

function renderInspector() {
  const node = selectedNode();
  const frameSelected = state.selectedNodeId === FRAME_ELEMENT_ID && Boolean(state.document.page.frame);
  elements.deleteNode.disabled = !node;
  const nodeIndex = node ? state.document.nodes.findIndex((candidate) => candidate.id === node.id) : -1;
  elements.duplicateNode.disabled = !node;
  elements.moveNodeUp.disabled = nodeIndex <= 0;
  elements.moveNodeDown.disabled = nodeIndex < 0 || nodeIndex >= state.document.nodes.length - 1;
  if (frameSelected) {
    const frame = state.document.page.frame;
    elements.inspectorTitle.textContent = "Ram";
    elements.inspector.className = "inspector";
    elements.inspector.innerHTML = `
      <p class="inspector-note frame-inspector-note">Ramen är ett sidobjekt och följer etikettens ytterkant. Välj stil och mått här.</p>
      <div class="field-grid field-grid-spaced">
        <label class="field full"><span class="field-label">Ramtyp</span><select class="select-input" data-frame-field="style">${FRAME_STYLES.map((style) => `<option ${style.value === (frame.style ?? "solid") ? "selected" : ""} value="${style.value}">${escapeHtml(style.label)}</option>`).join("")}</select></label>
        <label class="field"><span class="field-label">Inset</span><input class="text-input" data-frame-field="insetDots" type="number" min="0" max="64" value="${escapeAttribute(frame.insetDots)}"></label>
        <label class="field"><span class="field-label">Tjocklek</span><input class="text-input" data-frame-field="thicknessDots" type="number" min="1" max="16" value="${escapeAttribute(frame.thicknessDots)}"></label>
      </div>`;
    elements.inspector.querySelectorAll("[data-frame-field]").forEach((input) => {
      input.addEventListener("change", () => updateFrameField(input));
    });
    return;
  }
  if (!node) {
    elements.inspectorTitle.textContent = "Välj ett objekt";
    elements.inspector.className = "inspector empty-inspector";
    elements.inspector.innerHTML = "<p>Välj ett lager till vänster för att ändra innehåll, placering och storlek.</p>";
    return;
  }

  elements.inspectorTitle.textContent = node.kind === "text" ? "Text" : node.kind === "barcode" ? "Streckkod" : node.kind === "qr" ? "QR-kod" : node.kind === "rule" ? "Linje" : node.kind === "checklist" ? "Checklista" : node.kind === "fortune" ? "Fortune cookie" : node.kind === "icon" ? "FontAwesome" : "Bild";
  elements.inspector.className = "inspector";
  const common = `
    <div class="field-grid">
      <label class="field"><span class="field-label">X</span><input class="text-input" data-field="x" type="number" value="${escapeAttribute(node.x)}"></label>
      <label class="field"><span class="field-label">Y</span><input class="text-input" data-field="y" type="number" value="${escapeAttribute(node.y)}"></label>
      <label class="field"><span class="field-label">Bredd</span><input class="text-input" data-field="width" type="number" min="1" value="${escapeAttribute(node.width)}"></label>
      <label class="field"><span class="field-label">Höjd</span><input class="text-input" data-field="height" type="number" min="1" value="${escapeAttribute(node.height)}"></label>
    </div>`;
  let specific = "";
  if (node.kind === "text") {
    specific = `
      <div class="field-grid field-grid-spaced">
        <label class="field full"><span class="field-label">Text</span><textarea class="text-input" data-field="text">${escapeHtml(node.text)}</textarea></label>
        <label class="field full"><span class="field-label">Typsnitt</span><select class="select-input" data-field="fontId">${fontOptions(node.fontId)}</select></label>
        <label class="field"><span class="field-label">Storlek</span><input class="text-input" data-field="fontSizeDots" type="number" min="1" max="8" value="${escapeAttribute(node.fontSizeDots ?? 1)}"></label>
        <label class="field"><span class="field-label">Radavstånd</span><input class="text-input" data-field="lineHeightDots" type="number" min="1" value="${escapeAttribute(node.lineHeightDots ?? 8 * (node.fontSizeDots ?? 1))}"></label>
        <label class="field"><span class="field-label">Justering</span><select class="select-input" data-field="align"><option ${node.align === "left" ? "selected" : ""} value="left">Vänster</option><option ${node.align === "center" ? "selected" : ""} value="center">Centrerad</option><option ${node.align === "right" ? "selected" : ""} value="right">Höger</option></select></label>
        <label class="field"><span class="field-label">Vikt</span><select class="select-input" data-field="fontWeight"><option ${node.fontWeight === "normal" ? "selected" : ""} value="normal">Normal</option><option ${node.fontWeight === "bold" ? "selected" : ""} value="bold">Fet</option></select></label>
        <label class="checkbox-field full"><input type="checkbox" data-field="autoHeight" ${node.autoHeight !== false ? "checked" : ""}><span>Anpassa höjden automatiskt efter radbrytning</span></label>
      </div>`;
  } else if (node.kind === "checklist") {
    const itemsText = node.items.map((item) => `${item.checked ? "[x] " : "[ ] "}${item.text}`).join("\n");
    specific = `
      <div class="field-grid field-grid-spaced">
        <label class="field full"><span class="field-label">Rader · [x] markerar klar</span><textarea class="text-input" data-field="itemsText">${escapeHtml(itemsText)}</textarea></label>
        <label class="field full"><span class="field-label">Typsnitt</span><select class="select-input" data-field="fontId">${fontOptions(node.fontId)}</select></label>
        <label class="field"><span class="field-label">Storlek</span><input class="text-input" data-field="fontSizeDots" type="number" min="1" max="8" value="${escapeAttribute(node.fontSizeDots ?? 1)}"></label>
        <label class="field"><span class="field-label">Radhöjd</span><input class="text-input" data-field="itemHeightDots" type="number" min="8" max="128" value="${escapeAttribute(node.itemHeightDots ?? 12)}"></label>
        <label class="checkbox-field full"><input type="checkbox" data-field="autoHeight" ${node.autoHeight !== false ? "checked" : ""}><span>Anpassa rader och höjd automatiskt efter text</span></label>
      </div>`;
  } else if (node.kind === "fortune") {
    specific = `
      <div class="field-grid field-grid-spaced">
        <label class="field full"><span class="field-label">Budskap</span><textarea class="text-input" data-field="text">${escapeHtml(node.text)}</textarea></label>
        <label class="field full"><span class="field-label">Typsnitt</span><select class="select-input" data-field="fontId">${fontOptions(node.fontId)}</select></label>
        <label class="field"><span class="field-label">Storlek</span><input class="text-input" data-field="fontSizeDots" type="number" min="1" max="8" value="${escapeAttribute(node.fontSizeDots ?? 2)}"></label>
        <label class="field"><span class="field-label">Justering</span><select class="select-input" data-field="align"><option ${node.align === "left" ? "selected" : ""} value="left">Vänster</option><option ${!node.align || node.align === "center" ? "selected" : ""} value="center">Centrerad</option><option ${node.align === "right" ? "selected" : ""} value="right">Höger</option></select></label>
        <label class="checkbox-field full"><input type="checkbox" data-field="autoHeight" ${node.autoHeight !== false ? "checked" : ""}><span>Anpassa höjden automatiskt efter radbrytning</span></label>
      </div>`;
  } else if (node.kind === "barcode") {
    specific = `
      <div class="field-grid field-grid-spaced">
        <label class="field"><span class="field-label">Format</span><select class="select-input" data-field="format"><option ${node.format === "code128" ? "selected" : ""} value="code128">Code 128</option><option ${node.format === "ean13" ? "selected" : ""} value="ean13">EAN-13</option><option ${node.format === "upca" ? "selected" : ""} value="upca">UPC-A</option></select></label>
        <label class="field"><span class="field-label">Vis text</span><select class="select-input" data-field="showText"><option ${node.showText ? "selected" : ""} value="true">Ja</option><option ${!node.showText ? "selected" : ""} value="false">Nej</option></select></label>
        <label class="field full"><span class="field-label">Värde</span><input class="text-input" data-field="value" value="${escapeAttribute(node.value)}"></label>
      </div>`;
  } else if (node.kind === "qr") {
    specific = `
      <div class="field-grid field-grid-spaced">
        <label class="field full"><span class="field-label">Värde (max 17 UTF-8 bytes)</span><input class="text-input" data-field="value" value="${escapeAttribute(node.value)}"></label>
        <label class="field"><span class="field-label">Felkorrigering</span><select class="select-input" data-field="errorCorrection"><option selected value="low">Låg (v1)</option></select></label>
      </div>`;
  } else if (node.kind === "rule") {
    specific = `<div class="field-grid field-grid-spaced"><label class="field"><span class="field-label">Tjocklek</span><input class="text-input" data-field="thicknessDots" type="number" min="1" max="12" value="${escapeAttribute(node.thicknessDots ?? 1)}"></label></div>`;
  } else if (node.kind === "image") {
    specific = `<p class="inspector-note">Bilden renderas deterministiskt från inbäddad RGBA-data. Ändra storlek och placering ovan.</p>`;
  } else if (node.kind === "icon") {
    specific = `
      <div class="field-grid field-grid-spaced">
        <label class="field full"><span class="field-label">FontAwesome-ikon</span><select class="select-input" data-field="iconId">${ICON_CATALOG.map((icon) => `<option ${icon.value === node.iconId ? "selected" : ""} value="${escapeAttribute(icon.value)}">${escapeHtml(icon.label)} · ${escapeHtml(icon.value)}</option>`).join("")}</select></label>
        <p class="inspector-note full">Ikonen rasteriseras deterministiskt i samma dokumentmodell som framtida Swift-klienter kan använda.</p>
      </div>`;
  }
  elements.inspector.innerHTML = common + specific;
  elements.inspector.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", () => updateNodeField(node, input));
    input.addEventListener("change", () => updateNodeField(node, input));
  });
}

function setInspectorFieldError(input, message = "") {
  const field = input.dataset.field ?? "value";
  const errorId = `inspector-error-${field}`;
  const wrapper = input.parentElement;
  if (!wrapper) return;
  let error = wrapper.querySelector(".field-error");
  if (message) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-errormessage", errorId);
    if (!error) {
      error = document.createElement("small");
      error.id = errorId;
      error.className = "field-error";
      wrapper.append(error);
    }
    error.textContent = message;
    return;
  }
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-errormessage");
  error?.remove();
}

function updateNodeField(node, input) {
  const field = input.dataset.field;
  if (!field) return;
  const numericField = input.type === "number";
  let numericValue = Number(input.value);
  if (numericField) {
    const raw = input.value.trim();
    const min = input.min === "" ? Number.NEGATIVE_INFINITY : Number(input.min);
    const max = input.max === "" ? Number.POSITIVE_INFINITY : Number(input.max);
    if (!raw || !Number.isFinite(numericValue)) {
      setInspectorFieldError(input, "Ange ett heltal.");
      return;
    }
    if (numericValue < min || numericValue > max) {
      setInspectorFieldError(input, `Värdet måste vara mellan ${min} och ${max}.`);
      return;
    }
    setInspectorFieldError(input);
    numericValue = Math.trunc(numericValue);
  }
  const value = input.type === "checkbox" ? input.checked : numericField ? numericValue : input.value;
  const nextNode = { ...node };
  if (field === "itemsText") {
    nextNode.items = String(input.value).split("\n").map((line) => {
      const trimmed = line.trim();
      const checked = /^\[x\]\s*/i.test(trimmed);
      return { text: trimmed.replace(/^\[[ xX]\]\s*/, ""), checked };
    }).filter((item) => item.text.length > 0);
    delete nextNode.itemsText;
  }
  nextNode[field] = field === "showText" ? value === "true" : value;
  if (field === "height" && (node.kind === "text" || node.kind === "fortune")) nextNode.autoHeight = false;
  if (field === "x" || field === "y" || field === "width" || field === "height" || field === "fontSizeDots" || field === "lineHeightDots" || field === "thicknessDots" || field === "itemHeightDots") {
    nextNode[field] = numericValue;
  }
  if (field === "itemsText") delete nextNode.itemsText;
  const nextPageHeight = pageHeightForNode(nextNode, nextNode.y, state.document.page);
  const nextPage = pageWithHeight(state.document.page, nextPageHeight);
  const position = clampNodePosition(nextNode, nextNode.x, nextNode.y, nextPage.heightDots);
  nextNode.x = position.x;
  nextNode.y = position.y;
  const pageExpanded = nextPage.heightDots > state.document.page.heightDots;
  setDocument({
    ...state.document,
    page: nextPage,
    nodes: state.document.nodes.map((candidate) => candidate.id === node.id ? nextNode : candidate),
  });
  if (pageExpanded) expandPreviewCanvasPlaceholder(nextPage.heightDots);
  const committedNode = state.document.nodes.find((candidate) => candidate.id === node.id);
  const committedHeightField = elements.inspector.querySelector('[data-field="height"]');
  if (committedNode && committedHeightField) committedHeightField.value = String(committedNode.height);
  elements.pageHeight.value = String(state.document.page.heightDots);
  if (field === "x" || field === "y") input.value = String(nextNode[field]);
  syncMediaControls();
  syncJson();
  renderNodeList();
  renderWysiwygOverlay();
  schedulePreview();
}

function updateFrameField(input) {
  if (!state.document.page.frame) return;
  const field = input.dataset.frameField;
  if (!field) return;
  const frame = { ...state.document.page.frame };
  if (field === "style" && FRAME_STYLES.some((candidate) => candidate.value === input.value)) frame.style = input.value;
  if (field === "insetDots") frame.insetDots = Math.max(0, Math.min(64, Math.trunc(Number(input.value) || 0)));
  if (field === "thicknessDots") frame.thicknessDots = Math.max(1, Math.min(16, Math.trunc(Number(input.value) || 1)));
  setDocument({ ...state.document, page: { ...state.document.page, frame } }, FRAME_ELEMENT_ID);
  renderAll();
}

function addNode(kind) {
  if (kind === "frame") {
    setDocument({
      ...state.document,
      page: { ...state.document.page, frame: { insetDots: 4, thicknessDots: 2, style: "solid" } },
    }, FRAME_ELEMENT_ID);
    renderAll();
    showToast("En ram lades till runt etiketten.");
    return;
  }
  const index = state.document.nodes.length;
  const y = Math.min(220, 22 + index * 30);
  const nodes = [...state.document.nodes];
  let node;
  if (kind === "text") node = { id: uniqueId("text"), kind, text: "NY TEXT", x: 24, y, width: 336, height: 18, autoHeight: true, fontSizeDots: 2, align: "center" };
  if (kind === "rule") node = { id: uniqueId("rule"), kind, x: 24, y, width: 336, height: 2, thicknessDots: 2 };
  if (kind === "barcode") node = { id: uniqueId("barcode"), kind, format: "code128", value: "TEST-123", showText: true, x: 72, y, width: 240, height: 58 };
  if (kind === "qr") node = { id: uniqueId("qr"), kind, value: "mxw01.local", errorCorrection: "low", x: 142, y, width: 100, height: 100 };
  if (kind === "checklist") node = { id: uniqueId("checklist"), kind, items: [{ text: "Första punkten" }, { text: "Andra punkten" }], x: 32, y, width: 320, height: 48, autoHeight: true, itemHeightDots: 18, fontId: "mxw-vector", fontSizeDots: 1 };
  if (kind === "fortune") node = { id: uniqueId("fortune"), kind, text: FORTUNES[Math.floor(Math.random() * FORTUNES.length)], x: 24, y, width: 336, height: 32, autoHeight: true, fontId: "mxw-wide", fontSizeDots: 1, align: "center" };
  if (kind === "icon") node = { id: uniqueId("icon"), kind, iconId: "fa-star", x: 166, y: Math.max(0, Math.min(Math.max(0, state.document.page.heightDots - 52), y)), width: 52, height: 52 };
  if (!node) return;
  nodes.push(node);
  setDocument({ ...state.document, nodes }, node.id);
  state.selectedNodeId = node.id;
  renderAll();
}

function uniqueId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function imageDimensionsForCanvas(sourceWidth, sourceHeight, maxHeight = MAX_PAGE_HEIGHT - IMAGE_PAGE_PADDING) {
  const sourcePixels = sourceWidth * sourceHeight;
  const scale = Math.min(
    1,
    IMAGE_CONTENT_WIDTH / sourceWidth,
    maxHeight / sourceHeight,
    Math.sqrt(MAX_IMAGE_PIXELS / sourcePixels),
  );
  let width = Math.max(1, Math.round(sourceWidth * scale));
  let height = Math.max(1, Math.round(sourceHeight * scale));

  // Rounding can put the result a few pixels above the cap. Correct only the
  // rounded dimension so the image remains as close as possible to its aspect ratio.
  while (width * height > MAX_IMAGE_PIXELS) {
    if (width / sourceWidth >= height / sourceHeight) width -= 1;
    else height -= 1;
  }
  return {
    width,
    height,
    sourcePixels,
    pixelLimitApplied: sourcePixels > MAX_IMAGE_PIXELS,
  };
}

async function decodeImageSource(file) {
  if (typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close?.(),
      };
    } catch (_error) {
      // Some browsers cannot create an ImageBitmap from clipboard blobs but can still load them in <img>.
    }
  }

  const loadImageElement = (source, cleanup = () => {}) => new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve({
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup,
    });
    image.onerror = () => {
      cleanup();
      reject(new Error("image-decode-failed"));
    };
    image.src = source;
  });

  const sourceUrl = URL.createObjectURL(file);
  try {
    return await loadImageElement(sourceUrl, () => URL.revokeObjectURL(sourceUrl));
  } catch (_error) {
    URL.revokeObjectURL(sourceUrl);
  }

  // A data URL is a useful second path for pasted SVGs and browser-created clipboard blobs
  // whose object URL cannot be decoded by the current engine.
  if (typeof FileReader === "function") {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("image-decode-failed"));
      reader.readAsDataURL(file);
    });
    return loadImageElement(dataUrl);
  }
  throw new Error("image-decode-failed");
}

async function addImage(file) {
  if (!file) return;
  if (file.type && !file.type.startsWith("image/")) {
    showToast("Välj en bildfil, till exempel PNG, JPEG eller WebP.", true);
    return false;
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    showToast("Bilden är för stor. Maximal filstorlek är 8 MB.", true);
    return false;
  }
  let decoded = null;
  try {
    decoded = await decodeImageSource(file);
    const sourcePixels = decoded.width * decoded.height;
    if (!Number.isSafeInteger(decoded.width) || !Number.isSafeInteger(decoded.height) || decoded.width <= 0 || decoded.height <= 0 || !Number.isFinite(sourcePixels) || sourcePixels <= 0) {
      throw new Error("Bildens dimensioner kunde inte läsas.");
    }
    const maxImageHeight = isContinuousMedia(state.document)
      ? MAX_PAGE_HEIGHT - IMAGE_PAGE_PADDING
      : Math.max(1, state.document.page.heightDots - 20);
    const dimensions = imageDimensionsForCanvas(decoded.width, decoded.height, maxImageHeight);
    const { width, height } = dimensions;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Bildens arbetsyta kunde inte skapas.");
    context.drawImage(decoded.source, 0, 0, width, height);
    const rgba = context.getImageData(0, 0, width, height).data;
    const node = { id: uniqueId("image"), kind: "image", x: Math.trunc((PROFILE_WIDTH - width) / 2), y: 20, width, height, image: { width, height, dataBase64: bytesToBase64(rgba) } };
    const nextPageHeight = Math.max(state.document.page.heightDots, height + IMAGE_PAGE_PADDING);
    setDocument({ ...state.document, nodes: [...state.document.nodes, node], page: pageWithHeight(state.document.page, nextPageHeight) }, node.id);
    renderAll();
    if (dimensions.pixelLimitApplied) {
      showToast(`Bilden skalades proportionellt till ${width} × ${height} bildpunkter (max 1 000 000).`);
    }
    showToast("Bilden lades till i dokumentet.");
    return true;
  } catch (error) {
    const message = error instanceof Error && error.message !== "image-decode-failed"
      ? error.message
      : "Bildformatet kunde inte avkodas. Prova PNG, JPEG eller WebP.";
    showToast(message, true);
    return false;
  } finally {
    decoded?.cleanup();
  }
}

async function pasteImageFromClipboard() {
  try {
    if (!navigator.clipboard?.read) throw new Error("clipboard-read-unavailable");
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = item.types.find((candidate) => candidate.startsWith("image/"));
      if (type) {
        const blob = await item.getType(type);
        await addImage(new File([blob], "clipboard-image", { type }));
        return;
      }
    }
    throw new Error("no-image");
  } catch (error) {
    if (error?.message === "no-image") showToast("Urklippet innehåller ingen bild.", true);
    else showToast("Tillåt läsning av urklipp eller tryck Ctrl/Cmd+V efter att du kopierat en bild.", true);
  }
}

async function handlePaste(event) {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
  const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) => item.type.startsWith("image/"));
  if (!imageItem) return;
  const file = imageItem.getAsFile();
  if (!file) return;
  event.preventDefault();
  await addImage(file);
}

function removeSelectedNode() {
  if (!selectedNode()) return;
  const nodes = state.document.nodes.filter((node) => node.id !== state.selectedNodeId);
  setDocument({ ...state.document, nodes }, nodes.at(-1)?.id ?? null);
  renderAll();
}

function renderAll() {
  renderNodeList();
  renderInspector();
  renderWysiwygOverlay();
  elements.pageHeight.value = String(state.document.page.heightDots);
  syncMediaControls();
  syncBatchControls();
  syncJson();
  schedulePreview();
}

function populateMediaProfiles() {
  elements.mediaProfile.innerHTML = MEDIA_PROFILES.map((profile) => `<option value="${escapeAttribute(profile.id)}">${escapeHtml(profile.label)}</option>`).join("");
}

function currentMediaProfile() {
  const profileId = state.document.page.media?.profileId ?? "mxw01-continuous-white";
  return MEDIA_PROFILES.find((profile) => profile.id === profileId) ?? MEDIA_PROFILES[0];
}

function syncMediaControls() {
  const profile = currentMediaProfile();
  elements.mediaProfile.value = profile.id;
  elements.mediaGap.value = String(state.document.page.media?.gapDots ?? profile.gapDots ?? 0);
  elements.pageHeight.disabled = profile.kind !== "continuous";
  elements.mediaGap.disabled = state.job.active || profile.kind !== "continuous";
  elements.frameInset.value = String(state.document.page.frame?.insetDots ?? 0);
  elements.frameThickness.value = String(state.document.page.frame?.thicknessDots ?? 1);
  if (elements.frameStyle) elements.frameStyle.value = state.document.page.frame?.style ?? "solid";
  const mediaColor = PAPER_COLORS[profile.color] ?? PAPER_COLORS.white;
  const heightNote = profile.kind === "continuous"
    ? "fri höjd · växer automatiskt när objekt flyttas nedåt"
    : `etiketthöjd ${profile.heightDots} punkter`;
  elements.mediaNote.textContent = `${profile.label} · ${heightNote}. Gapet är metadata och fysisk utskrift är blockerad tills matningen är kalibrerad.`;
  elements.previewCanvas.style.setProperty("--paper-r", String(mediaColor[0]));
  elements.previewCanvas.style.setProperty("--paper-g", String(mediaColor[1]));
  elements.previewCanvas.style.setProperty("--paper-b", String(mediaColor[2]));
}

function updateMediaProfile() {
  const profile = MEDIA_PROFILES.find((candidate) => candidate.id === elements.mediaProfile.value);
  if (!profile) return;
  const nextHeight = profile.kind === "continuous" ? state.document.page.heightDots : profile.heightDots;
  setDocument({
    ...state.document,
    page: {
      ...state.document.page,
      heightDots: nextHeight,
      media: {
        kind: profile.kind,
        color: profile.color,
        labelHeightDots: nextHeight,
        gapDots: profile.gapDots,
        profileId: profile.id,
      },
    },
  });
  renderAll();
}

function updateMediaGap() {
  const gapDots = Math.max(0, Math.min(256, Math.trunc(Number(elements.mediaGap.value) || 0)));
  const profile = currentMediaProfile();
  setDocument({
    ...state.document,
    page: {
      ...state.document.page,
      media: { kind: profile.kind, color: profile.color, labelHeightDots: profile.kind === "continuous" ? state.document.page.heightDots : profile.heightDots, gapDots, profileId: profile.id },
    },
  });
  renderAll();
}

function updateFrameFromControls() {
  const insetDots = Math.max(0, Math.min(64, Math.trunc(Number(elements.frameInset.value) || 0)));
  const thicknessDots = Math.max(1, Math.min(16, Math.trunc(Number(elements.frameThickness.value) || 1)));
  const style = FRAME_STYLES.some((candidate) => candidate.value === elements.frameStyle?.value) ? elements.frameStyle.value : "solid";
  setDocument({
    ...state.document,
    page: { ...state.document.page, frame: { insetDots, thicknessDots, style } },
  }, state.document.page.frame ? state.selectedNodeId : FRAME_ELEMENT_ID);
  renderAll();
}

function removeFrame() {
  if (!state.document.page.frame) return;
  const page = { ...state.document.page };
  delete page.frame;
  setDocument({ ...state.document, page }, state.document.nodes.at(-1)?.id ?? null);
  renderAll();
  showToast("Ramen togs bort.");
}

function syncBatchControls() {
  elements.batchCount.value = String(state.batch.count);
  elements.batchInterval.value = String(state.batch.intervalMs / 1000);
  elements.batchStart.value = String(state.batch.start);
  elements.batchStep.value = String(state.batch.step);
  elements.batchPadding.value = String(state.batch.padding);
  elements.batchPrefix.value = state.batch.prefix;
  elements.batchSuffix.value = state.batch.suffix;
  elements.batchVariable.value = state.batch.variable;
  elements.batchConfirm.checked = state.batch.confirmEach;
  if (elements.batchOnError) elements.batchOnError.value = state.batch.onError ?? "stop";
  const suffix = state.batch.count === 1 ? "En etikett" : `${state.batch.count} etiketter`;
  const token = `{{${state.batch.variable}}}`;
  const hasSequenceToken = collectTemplateTokens(state.document).includes(state.batch.variable);
  if (elements.batchTokenHelp) {
    elements.batchTokenHelp.innerHTML = `Använd <code>${escapeHtml(token)}</code> i en text-, streckkods- eller QR-nod för löpnummer.`;
  }
  elements.batchStatus.textContent = `${suffix}${state.batch.intervalMs ? ` · ${state.batch.intervalMs / 1000} s paus` : ""}${state.batch.confirmEach ? " · bekräftelse före varje" : ""}${state.batchRows.length ? ` · ${state.batchRows.length} datarader` : ""}${state.batch.count > 1 && !hasSequenceToken ? " · inget löpnummer i mallen" : ""}`;
  elements.print.textContent = state.batch.count > 1 ? `Skriv ut ${state.batch.count} etiketter` : "Skriv ut etikett";
}

function updateBatchFromControls() {
  state.batch.count = Math.max(1, Math.min(1000, Math.trunc(Number(elements.batchCount.value) || 1)));
  state.batch.intervalMs = Math.max(0, Math.min(60000, Math.round((Number(elements.batchInterval.value) || 0) * 1000)));
  state.batch.start = Math.trunc(Number(elements.batchStart.value) || 0);
  state.batch.step = Math.trunc(Number(elements.batchStep.value) || 1);
  state.batch.padding = Math.max(0, Math.min(12, Math.trunc(Number(elements.batchPadding.value) || 0)));
  state.batch.prefix = String(elements.batchPrefix.value || "").slice(0, 32);
  state.batch.suffix = String(elements.batchSuffix.value || "").slice(0, 32);
  state.batch.variable = String(elements.batchVariable.value || "ticketNumber").trim().slice(0, 64) || "ticketNumber";
  state.batch.confirmEach = Boolean(elements.batchConfirm.checked);
  state.batch.onError = ["stop", "retry", "skip"].includes(elements.batchOnError?.value) ? elements.batchOnError.value : "stop";
  saveDraft();
  invalidatePreview();
  syncBatchControls();
  schedulePreview();
}

function updatePageHeight() {
  const raw = elements.pageHeight.value.trim();
  if (!raw) return;
  const requested = Math.trunc(Number(raw));
  if (!Number.isFinite(requested) || requested < MIN_PAGE_HEIGHT) return;
  const height = Math.max(minimumPageHeightForDocument(state.document), Math.min(MAX_PAGE_HEIGHT, requested));
  if (!isContinuousMedia()) {
    syncMediaControls();
    return;
  }
  const page = pageWithHeight(state.document.page, height);
  setDocument({
    ...state.document,
    page,
  });
  expandPreviewCanvasPlaceholder(height);
  renderAll();
}

function syncJson() {
  elements.jsonEditor.value = JSON.stringify(state.document, null, 2);
}

function schedulePreview() {
  window.clearTimeout(state.renderTimer);
  state.renderTimer = window.setTimeout(() => void requestPreview(), 120);
}

function sequenceValue(batch, index) {
  const value = batch.start + index * batch.step;
  const raw = String(value);
  const sign = raw.startsWith("-") ? "-" : "";
  const digits = sign ? raw.slice(1) : raw;
  return `${batch.prefix ?? ""}${sign}${digits.padStart(batch.padding, "0")}${batch.suffix ?? ""}`;
}

function collectTemplateTokens(printDocument) {
  const tokens = new Set();
  const collect = (value) => {
    if (typeof value !== "string") return;
    for (const match of value.matchAll(/\{\{\s*([A-Za-z][A-Za-z0-9_.-]{0,63})\s*\}\}/g)) tokens.add(match[1]);
  };
  for (const node of printDocument?.nodes ?? []) {
    if (node.kind === "text" || node.kind === "fortune") collect(node.text);
    else if (node.kind === "barcode" || node.kind === "qr") collect(node.value);
    else if (node.kind === "checklist") node.items?.forEach((item) => collect(item.text));
  }
  return [...tokens];
}

function resolvedDocumentForIndex(snapshot, index) {
  const values = { ...(snapshot.templateValues ?? {}), ...(snapshot.batchRows?.[index] ?? {}), [snapshot.batch.variable]: sequenceValue(snapshot.batch, index) };
  const replace = (value) => String(value).replace(/\{\{\s*([A-Za-z][A-Za-z0-9_.-]{0,63})\s*\}\}/g, (token, key) => values[key] ?? token);
  return autoGrowTextDocument({
    ...snapshot.document,
    nodes: snapshot.document.nodes.map((node) => {
      if (["text", "fortune"].includes(node.kind)) return { ...node, text: replace(node.text) };
      if (["barcode", "qr"].includes(node.kind)) return { ...node, value: replace(node.value) };
      if (node.kind === "checklist") return { ...node, items: node.items.map((item) => ({ ...item, text: replace(item.text) })) };
      return node;
    }),
  });
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(cell); cell = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += character;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows.shift().map((header, index) => {
    const normalized = header.trim().replace(/\s+/gu, "_").replace(/[^A-Za-z0-9_.-]/gu, "");
    return /^[A-Za-z]/u.test(normalized) ? normalized.slice(0, 64) : `column${index + 1}`;
  });
  return rows.slice(0, 1000).map((values) => Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? "").slice(0, 256)])));
}

async function importBatchData(file) {
  if (!file) return;
  try {
    if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error("Datafilen är för stor. Maxgränsen är 8 MB.");
    const text = await file.text();
    let rows;
    if (file.name.toLocaleLowerCase("sv-SE").endsWith(".json")) {
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : parsed?.rows;
      if (!Array.isArray(rows)) throw new Error("JSON-filen måste innehålla en array med objekt.");
      rows = rows.slice(0, 1000).map((row) => Object.fromEntries(Object.entries(row ?? {}).filter(([name, value]) => /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/u.test(name) && typeof value !== "object").map(([name, value]) => [name, String(value ?? "").slice(0, 256)])));
    } else {
      rows = parseCsvRows(text);
    }
    if (!rows.length) throw new Error("Datafilen innehåller inga rader.");
    state.batchRows = rows;
    state.batch.count = rows.length;
    saveDraft();
    syncBatchControls();
    invalidatePreview();
    schedulePreview();
    showToast(`${rows.length} batchrader laddades.`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  } finally {
    elements.batchData.value = "";
  }
}

function openWebpageDialog() {
  if (!elements.webpageDialog) return;
  if (typeof elements.webpageDialog.showModal === "function") elements.webpageDialog.showModal();
  else elements.webpageDialog.setAttribute("open", "");
  window.setTimeout(() => elements.webpageUrl?.focus(), 0);
}

async function importWebPage() {
  const url = elements.webpageUrl?.value.trim();
  if (!url) return;
  const submit = elements.webpageDialogForm?.querySelector('button[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    const response = await fetch("/api/webpage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, maxCharacters: 14000 }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Webbsidan kunde inte hämtas.");
    const validationError = documentValidationError(payload.document);
    if (validationError) throw new Error(`Webbsidan gav ett ogiltigt dokument: ${validationError}`);
    state.activeTemplate = "custom";
    state.batch = defaultBatchSettings();
    state.batchRows = [];
    state.templateValues = {};
    setDocument(payload.document, payload.document.nodes[0]?.id ?? null);
    document.querySelectorAll(".mode-tab").forEach((tab) => tab.classList.remove("active"));
    updateModeAria();
    renderAll();
    saveDraft();
    showToast(`Webbsidan importerades${payload.title ? `: ${payload.title}` : "."}`);
    elements.webpageDialog?.close?.();
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  } finally {
    if (submit) submit.disabled = false;
  }
}

async function reconcileBatchJobs() {
  try {
    const response = await fetch("/api/batch/list", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Batchjobben kunde inte läsas.");
    const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
    if (!jobs.length) {
      showToast("Det finns inga kvarvarande batchjobb att hantera.");
      return;
    }
    const job = jobs.find((candidate) => ["unknown", "printing", "ready"].includes(candidate.state)) ?? jobs[0];
    const requiresPhysicalCheck = ["unknown", "printing"].includes(job.state);
    const question = requiresPhysicalCheck
      ? `Batch ${job.jobId} är i läget ${job.state}. Kontrollera skrivaren fysiskt och bekräfta att jobbet får avbrytas.`
      : `Batch ${job.jobId} är i läget ${job.state}. Vill du rensa den lokala batchposten?`;
    if (!window.confirm(question)) return;
    const action = requiresPhysicalCheck ? "cancel" : "forget";
    const reconcileResponse = await fetch("/api/batch/reconcile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: job.jobId, action, confirmedPhysicalState: requiresPhysicalCheck }),
    });
    const result = await reconcileResponse.json();
    if (!reconcileResponse.ok) throw new Error(result.error ?? "Batchjobbet kunde inte hanteras.");
    if (state.pendingBatchJob?.jobId === job.jobId) clearPendingBatchJob();
    showToast(action === "cancel" ? "Batchjobbet markerades som avbrutet." : "Batchposten rensades.");
    await refreshStatus();
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  }
}

async function skipBatchItem(jobId, index) {
  const response = await fetch("/api/batch/skip", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId, index }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Batchetiketten kunde inte hoppas över säkert.");
  return payload;
}

function makePrintJob(snapshot, index) {
  return {
    schema: "mxw01.print-batch",
    version: 1,
    jobId: snapshot.jobId,
    templateFingerprint: snapshot.templateFingerprint,
    templateDocument: snapshot.document,
    values: snapshot.templateValues,
    rows: snapshot.batchRows,
    index,
    count: snapshot.batch.count,
    intervalMs: snapshot.batch.intervalMs,
    confirmEach: snapshot.batch.confirmEach,
    onError: snapshot.batch.onError,
    sequence: {
      variable: snapshot.batch.variable,
      start: snapshot.batch.start,
      step: snapshot.batch.step,
      padding: snapshot.batch.padding,
      prefix: snapshot.batch.prefix,
      suffix: snapshot.batch.suffix,
    },
  };
}

async function requestPreviewForDocument(printDocument, signal, options = {}) {
  const unresolved = collectTemplateTokens(printDocument);
  if (unresolved.length) {
    throw new Error(`Mallen saknar värden för: ${unresolved.map((name) => `{{${name}}}`).join(", ")}.`);
  }
  const response = await fetch("/api/preview", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal,
    body: JSON.stringify({ document: printDocument, options: { dither: options.dither ?? state.dither, brightness: 128 } }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Renderingen misslyckades.");
  return payload;
}

async function requestPreview() {
  state.previewController?.abort();
  const controller = new AbortController();
  const requestId = state.previewRequestId + 1;
  const revision = state.documentRevision;
  state.previewRequestId = requestId;
  state.previewController = controller;
  state.previewReady = false;
  updatePrintAvailability();
  elements.previewLoading.hidden = false;
  try {
    const payload = await requestPreviewForDocument(resolvedDocumentForIndex({ document: state.document, batch: state.batch, batchRows: state.batchRows, templateValues: state.templateValues }, 0), controller.signal);
    if (requestId !== state.previewRequestId || revision !== state.documentRevision) return;
    state.preview = payload;
    state.previewRevision = revision;
    state.previewReady = true;
    state.previewHasErrors = payload.canPrint === false || !payload.pages?.length;
    drawPreview(payload);
    showDiagnostics(payload.diagnostics);
    updatePrintAvailability();
    updateMobileAction();
  } catch (error) {
    if (error?.name === "AbortError") return;
    state.previewReady = false;
    state.previewHasErrors = true;
    showDiagnostics([{ severity: "error", message: error instanceof Error ? error.message : String(error) }]);
    updatePrintAvailability();
    updateMobileAction();
  } finally {
    if (requestId === state.previewRequestId) elements.previewLoading.hidden = true;
  }
}

function drawPreview(payload) {
  const page = payload.pages?.[0];
  elements.previewEmpty.hidden = state.document.nodes.length > 0;
  if (!page) {
    elements.previewCanvas.width = 1;
    elements.previewCanvas.height = 1;
    elements.previewCanvas.getContext("2d")?.clearRect(0, 0, 1, 1);
    elements.previewSize.textContent = "Ingen giltig förhandsvisning";
    elements.rendererVersion.textContent = payload.rendererVersion ?? "renderer —";
    renderWysiwygOverlay();
    return;
  }
  const bytes = base64ToBytes(page.dataBase64);
  const canvas = elements.previewCanvas;
  const paper = PAPER_COLORS[currentMediaProfile().color] ?? PAPER_COLORS.white;
  canvas.style.backgroundColor = `rgb(${paper[0]} ${paper[1]} ${paper[2]})`;
  canvas.width = page.widthDots;
  canvas.height = page.contentHeightRows;
  const context = canvas.getContext("2d");
  const image = context.createImageData(page.widthDots, page.contentHeightRows);
  for (let y = 0; y < page.contentHeightRows; y += 1) {
    for (let x = 0; x < page.widthDots; x += 1) {
      const byte = bytes[y * page.bytesPerRow + Math.floor(x / 8)] ?? 0;
      const bit = page.bitOrder === "lsb-first" ? x % 8 : 7 - (x % 8);
      const black = (((byte >> bit) & 1) === 1) === page.blackIsOne;
      const offset = (y * page.widthDots + x) * 4;
      image.data[offset] = black ? 24 : paper[0];
      image.data[offset + 1] = black ? 24 : paper[1];
      image.data[offset + 2] = black ? 24 : paper[2];
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  elements.previewSize.textContent = `${page.widthDots} × ${page.contentHeightRows} punkter`;
  elements.rendererVersion.textContent = payload.rendererVersion;
  renderWysiwygOverlay();
}

function setPreviewMode(mode) {
  const native = mode === "native";
  state.previewMode = native ? "native" : "fit";
  elements.previewCanvas.classList.toggle("native-size", native);
  elements.fitPreview.classList.toggle("active", !native);
  elements.nativePreview.classList.toggle("active", native);
  elements.fitPreview.setAttribute("aria-pressed", String(!native));
  elements.nativePreview.setAttribute("aria-pressed", String(native));
  elements.previewOverflowHint.hidden = !native;
  saveDraft();
  window.requestAnimationFrame(renderWysiwygOverlay);
}

function updatePrintAvailability() {
  elements.print.disabled = !state.connected || !state.statusVerified || !state.printReady || state.printing || state.job.active || !state.previewReady || state.previewRevision !== state.documentRevision || state.previewHasErrors;
  if (elements.cancelBatch) elements.cancelBatch.hidden = !state.job.active;
}

function setJobControlsDisabled(disabled) {
  if (disabled) {
    if (state.controlsBeforeJob) return;
    state.controlsBeforeJob = new Map();
    document.querySelectorAll(".workspace button, .workspace input, .workspace select, .workspace textarea, .mode-tabs button, #connect-button, #disconnect-button").forEach((control) => {
      if (control.id === "cancel-batch-button") return;
      state.controlsBeforeJob.set(control, control.disabled);
      control.disabled = true;
    });
    return;
  }
  if (!state.controlsBeforeJob) return;
  for (const [control, wasDisabled] of state.controlsBeforeJob) control.disabled = wasDisabled;
  state.controlsBeforeJob = null;
}

function updateModeAria() {
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    const active = tab.dataset.template === state.activeTemplate;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

const diagnosticTranslations = {
  "document.empty": "Lägg till minst ett utskriftsbart objekt innan dokumentet skickas till skrivaren.",
  "document.node-outside-margins": "Objektet ligger delvis i etikettens marginalområde.",
  "document.node-out-of-bounds": "Objektet hamnar utanför etikettens yta.",
  "render.page-too-wide": "Dokumentet är bredare än MXW01-profilen.",
  "document.media-gap-unsupported": "Stansade etiketter med gap kan förhandsvisas men inte skrivas ut ännu; matningskommandot måste kalibreras först.",
  "document.media-black-mark-unsupported": "Black-mark-etiketter kräver sensorkalibrering som inte finns i denna version.",
  "document.frame-out-of-bounds": "Ramen är för stor för etikettens höjd eller bredd.",
  "render.text-overflow": "Texten får inte plats i rutan efter radbrytning och automatisk skalning. Öka rutan eller minska textstorleken.",
  "render.checklist-overflow": "Checklistan är högre än sin ruta. Slå på automatisk höjd eller öka rutans höjd.",
};

function diagnosticMessage(item) {
  return diagnosticTranslations[item.code] ?? item.message;
}

function showDiagnostics(diagnostics = []) {
  state.diagnostics = diagnostics;
  const errors = diagnostics.filter((item) => item.severity === "error");
  const warnings = diagnostics.filter((item) => item.severity === "warning");
  elements.diagnostic.className = "diagnostic-message";
  elements.diagnostic.setAttribute("role", errors.length ? "alert" : "status");
  elements.diagnostic.setAttribute("aria-live", errors.length ? "assertive" : "polite");
  if (errors.length || warnings.length) {
    const visible = [...errors, ...warnings];
    elements.diagnostic.classList.add(errors.length ? "error" : "warning");
    if (!state.printing && !state.job.active) {
      elements.printStatus.textContent = "Åtgärda dokumentet innan utskrift.";
    }
    elements.diagnostic.replaceChildren(...visible.map((item) => {
      const row = document.createElement(item.nodeId ? "button" : "div");
      row.className = "diagnostic-item";
      row.textContent = diagnosticMessage(item);
      if (item.nodeId) {
        row.type = "button";
        row.title = "Välj objektet som behöver åtgärdas";
        row.addEventListener("click", () => selectNode(item.nodeId));
      }
      return row;
    }));
  } else if (diagnostics.length) {
    elements.diagnostic.classList.add("error");
    elements.diagnostic.textContent = diagnosticMessage(diagnostics[0]);
  } else {
    elements.diagnostic.textContent = "Förhandsvisning uppdaterad";
  }
}

function selectNode(nodeId, { focusInspector = true, renderPreview = true } = {}) {
  if (nodeId !== FRAME_ELEMENT_ID && !state.document.nodes.some((node) => node.id === nodeId)) return;
  if (nodeId === FRAME_ELEMENT_ID && !state.document.page.frame) return;
  state.selectedNodeId = nodeId;
  renderNodeList();
  renderInspector();
  if (renderPreview) renderWysiwygOverlay();
  if (focusInspector) elements.inspector.querySelector("[data-field]")?.focus();
}

async function refreshStatus() {
  if (state.statusInFlight) return;
  state.statusInFlight = true;
  const requestId = state.statusRequestId + 1;
  state.statusRequestId = requestId;
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const status = await response.json();
    if (requestId !== state.statusRequestId) return;
    state.serverAvailable = true;
    state.connected = status.connected;
    state.statusVerified = status.connected === true && status.statusVerified === true;
    state.printReady = status.connected === true && status.statusVerified === true && status.printReady === true;
    state.printerState = status.printerState ?? null;
    state.printing = status.printing;
    updateStatusUi(status);
  } catch (_error) {
    if (requestId === state.statusRequestId) setOfflineState();
  } finally {
    if (requestId === state.statusRequestId) state.statusInFlight = false;
  }
}

function updateStatusUi(status) {
  state.serverAvailable = true;
  state.statusVerified = status.connected === true && status.statusVerified === true;
  state.printReady = status.connected === true && status.statusVerified === true && status.printReady === true;
  state.printerState = status.printerState ?? null;
  const busy = status.printing || state.job.active;
  elements.connectionPill.className = `connection-pill ${busy ? "printing" : status.connected ? "connected" : "disconnected"}`;
  elements.connectionLabel.textContent = busy ? "Skriver ut" : status.connected ? (status.device?.name ?? "Ansluten") : "Inte ansluten";
  elements.connect.hidden = status.connected;
  elements.disconnect.hidden = !status.connected;
  elements.connect.disabled = busy;
  elements.disconnect.disabled = busy;
  updatePrintAvailability();
  elements.bluetoothState.textContent = status.connected ? (status.device?.name ?? "Ansluten") : "Ej ansluten";
  elements.printerState.textContent = status.connected && !state.statusVerified
    ? "Status ej verifierad"
    : status.printerState
      ? describePrinterState(status.printerState)
      : status.statusMessage ?? "—";
  const progress = status.progress;
  const percentage = progress ? Math.round(progress.progress) : 0;
  elements.progressBar.style.width = `${percentage}%`;
  elements.progressTrack?.setAttribute("aria-valuenow", String(percentage));
  elements.progressTrack?.setAttribute("aria-valuetext", progress ? `${progress.phase} · ${percentage}%` : "Ingen aktiv utskrift");
  elements.progressLabel.textContent = progress ? `${progress.phase} · ${percentage}%` : "Ingen aktiv utskrift";
  elements.bytesLabel.textContent = progress?.totalBytes ? `${progress.sentBytes} / ${progress.totalBytes} B` : "—";
  if (status.error && !busy) elements.printStatus.textContent = status.error;
  else if (!state.document.nodes.length && !busy) elements.printStatus.textContent = "Lägg till ett objekt innan utskrift.";
  else if (status.connected && !state.statusVerified && !busy) elements.printStatus.textContent = "Skrivarens status är inte verifierad; utskrift är blockerad.";
  else if (status.connected && !state.printReady && !busy) elements.printStatus.textContent = `Skrivaren är inte redo: ${describePrinterState(status.printerState ?? {})}.`;
  else if (status.connected && !busy && !state.previewHasErrors) elements.printStatus.textContent = "Redo att skriva ut.";
  else if (!status.connected && !busy) elements.printStatus.textContent = "Anslut skrivaren för att börja.";
  elements.printStatus.classList.toggle("offline", false);
  updateFlowSteps(status.connected, busy);
  updateMobileAction();
}

function setOfflineState() {
  state.serverAvailable = false;
  state.connected = false;
  state.statusVerified = false;
  state.printReady = false;
  state.printerState = null;
  state.printing = false;
  state.connecting = false;
  elements.connectionLabel.textContent = "Servern svarar inte";
  elements.connectionPill.className = "connection-pill disconnected offline";
  elements.connect.hidden = false;
  elements.connect.disabled = true;
  elements.disconnect.hidden = true;
  elements.disconnect.disabled = true;
  elements.print.disabled = true;
  elements.bluetoothState.textContent = "Lokalserver offline";
  elements.printerState.textContent = "—";
  elements.progressBar.style.width = "0%";
  elements.progressTrack?.setAttribute("aria-valuenow", "0");
  elements.progressTrack?.setAttribute("aria-valuetext", "Ingen aktiv utskrift");
  elements.progressLabel.textContent = "Ingen aktiv utskrift";
  elements.bytesLabel.textContent = "—";
  elements.printStatus.textContent = "Starta den lokala servern för att fortsätta.";
  elements.printStatus.classList.toggle("offline", true);
  updateFlowSteps(false, false);
  updateMobileAction();
}

function updateFlowSteps(connected, printing) {
  const hasContent = state.document.nodes.length > 0;
  const currentStep = !hasContent ? "edit" : !connected ? "connect" : "print";
  elements.flowSteps.forEach((step) => {
    const key = step.dataset.step;
    const active = key === currentStep;
    step.classList.toggle("active", active);
    if (active) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
}

function updateMobileAction() {
  if (!state.serverAvailable) {
    elements.mobileAction.textContent = "Starta servern";
    elements.mobileActionHint.textContent = "Lokalservern svarar inte";
    elements.mobileAction.disabled = true;
    return;
  }
  if (state.connecting) {
    elements.mobileAction.textContent = "Söker…";
    elements.mobileActionHint.textContent = "Steg 2 av 3 · söker efter MXW01";
    elements.mobileAction.disabled = true;
    return;
  }
  if (state.printing || state.job.active) {
    elements.mobileAction.textContent = "Skriver ut…";
    elements.mobileActionHint.textContent = "Steg 3 av 3 · vänta tills jobbet är klart";
    elements.mobileAction.disabled = true;
    return;
  }
  if (state.document.nodes.length === 0) {
    elements.mobileAction.textContent = "Lägg till text";
    elements.mobileActionHint.textContent = "Steg 1 av 3 · lägg till ett objekt först";
    elements.mobileAction.disabled = false;
    return;
  }
  if (state.previewHasErrors) {
    elements.mobileAction.textContent = "Visa fel";
    elements.mobileActionHint.textContent = "Steg 1 av 3 · kontrollera förhandsvisningen";
    elements.mobileAction.disabled = false;
    return;
  }
  if (!state.connected) {
    elements.mobileAction.textContent = "Anslut skrivare";
    elements.mobileActionHint.textContent = "Steg 2 av 3 · anslut skrivaren";
    elements.mobileAction.disabled = false;
    return;
  }
  if (!state.statusVerified) {
    elements.mobileAction.textContent = "Verifierar skrivare…";
    elements.mobileActionHint.textContent = "Skrivarstatusen måste verifieras innan utskrift";
    elements.mobileAction.disabled = true;
    return;
  }
  if (!state.printReady) {
    elements.mobileAction.textContent = "Kontrollera skrivaren";
    elements.mobileActionHint.textContent = `Utskrift blockerad · ${describePrinterState(state.printerState ?? {})}`;
    elements.mobileAction.disabled = true;
    return;
  }
  elements.mobileAction.textContent = "Skriv ut etikett";
  elements.mobileActionHint.textContent = "Steg 3 av 3 · förhandsvisningen är redo";
  elements.mobileAction.disabled = false;
}

function describePrinterState(printerState) {
  const faults = [];
  if (printerState.paper_jam) faults.push("pappersstopp");
  if (printerState.out_of_paper) faults.push("slut på papper");
  if (printerState.cover_open) faults.push("luckan öppen");
  if (printerState.battery_low) faults.push("låg batterinivå");
  if (printerState.overheat) faults.push("överhettad");
  return faults.length ? faults.join(", ") : "Normal";
}

async function connectPrinter() {
  if (state.job.active) return;
  if (!state.serverAvailable) {
    showToast("Starta den lokala servern först.", true);
    return;
  }
  elements.connect.disabled = true;
  state.connecting = true;
  updateMobileAction();
  elements.connectionLabel.textContent = "Söker…";
  elements.printStatus.textContent = "Söker efter MXW01 inom Bluetooth-avstånd…";
  try {
    const response = await fetch("/api/connect", { method: "POST" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Kunde inte ansluta.");
    showToast(`Ansluten till ${payload.device?.name ?? "MXW01"}.`);
    await refreshStatus();
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
    await refreshStatus();
  } finally {
    state.connecting = false;
    elements.connect.disabled = !state.serverAvailable;
    updateMobileAction();
  }
}

async function disconnectPrinter() {
  if (state.job.active) return;
  try {
    const response = await fetch("/api/disconnect", { method: "POST" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Kunde inte koppla från.");
    showToast("Skrivaren kopplades från.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  }
  await refreshStatus();
}

async function printDocument() {
  if (state.job.active) {
    showToast("Ett utskriftsjobb pågår redan.", true);
    return;
  }
  if (!state.serverAvailable || !state.connected) {
    showToast("Anslut skrivaren innan du skriver ut.", true);
    return;
  }
  if (!state.statusVerified || !state.printReady) {
    showToast("Skrivarens status måste vara verifierad och skrivaren måste vara redo innan utskrift.", true);
    await refreshStatus();
    return;
  }
  if (state.previewHasErrors || !state.previewReady || state.previewRevision !== state.documentRevision) {
    showToast("Åtgärda dokumentet och vänta tills förhandsvisningen är uppdaterad.", true);
    return;
  }
  const snapshot = {
    document: clone(state.document),
    batch: clone(state.batch),
    templateValues: clone(state.templateValues),
    batchRows: clone(state.batchRows),
    intensity: state.intensity,
    dither: state.dither,
    preview: state.preview,
    jobId: uniqueId("job"),
    templateFingerprint: fingerprintValue(state.document),
  };
  state.job = { active: true, id: snapshot.jobId, index: 0, nextIndex: 0, count: snapshot.batch.count, cancelRequested: false, cancelResult: null, transportStarted: false, transportUncertain: false, snapshot };
  if (!checkpointActiveBatch("active", 0)) {
    state.job.active = false;
    state.job.snapshot = null;
    showToast("Utskriften stoppades eftersom batchens säkerhetscheckpoint inte kunde sparas lokalt.", true);
    updatePrintAvailability();
    return;
  }
  state.printing = true;
  setJobControlsDisabled(true);
  updatePrintAvailability();
  updateMobileAction();
  elements.printStatus.textContent = snapshot.batch.count > 1 ? `Förbereder batch med ${snapshot.batch.count} etiketter…` : "Förbereder utskrift…";
  let failure = null;
  try {
    if (snapshot.batch.count > 1) await printBatch(snapshot);
    else await printOne(resolvedDocumentForIndex(snapshot, 0), snapshot.preview, snapshot, 0);
  } catch (error) {
    failure = error;
    showToast(error instanceof Error ? error.message : String(error), true);
    elements.printStatus.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    if (!failure && state.job.cancelRequested && state.job.cancelResult?.state === "cancelling") {
      state.job.cancelResult = await waitForBatchTerminalState(state.job.id);
    }
    if (failure && (state.job.transportUncertain || state.job.transportStarted)) {
      checkpointActiveBatch("unknown", state.job.nextIndex, failure instanceof Error ? failure.message : String(failure));
    } else if (failure) {
      checkpointActiveBatch("active", state.job.nextIndex, failure instanceof Error ? failure.message : String(failure));
    } else if (state.job.cancelRequested) {
      if (state.job.cancelResult?.state === "cancelled" || state.job.cancelResult?.missing === true) clearPendingBatchJob();
      else checkpointActiveBatch("active", state.job.nextIndex, "Avbrytningen måste bekräftas av servern innan jobbet kan glömmas.");
    } else if (!failure) clearPendingBatchJob();
    await refreshStatus();
    state.printing = false;
    state.job.active = false;
    state.job.snapshot = null;
    setJobControlsDisabled(false);
    updatePrintAvailability();
    updateMobileAction();
  }
}

async function printOne(document, preview, snapshot, index) {
  state.job.index = index;
  state.job.transportStarted = true;
  let response;
  try {
    response = await fetch("/api/print", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        document,
        options: { dither: snapshot.dither, brightness: 128 },
        intensity: snapshot.intensity,
        job: makePrintJob(snapshot, index),
        preflight: {
          canPrint: preview?.canPrint === true,
          documentFingerprint: preview?.documentFingerprint,
          rendererVersion: preview?.rendererVersion,
          profileId: preview?.profileId,
          ...(document.page.media?.profileId ? { mediaProfileId: document.page.media.profileId } : {}),
          options: { dither: snapshot.dither, brightness: 128 },
        },
      }),
    });
  } catch (error) {
    state.job.transportUncertain = true;
    throw error;
  }
  const payload = await response.json();
  if (!response.ok) {
    if (response.status >= 500 || payload.job?.state === "unknown") state.job.transportUncertain = true;
    state.job.transportStarted = response.status >= 500 || payload.job?.state === "unknown";
    throw new Error(payload.error ?? "Utskriften misslyckades.");
  }
  elements.printStatus.textContent = snapshot.batch.count > 1
    ? `Klar · etikett ${index + 1} av ${snapshot.batch.count}.`
    : `Klar · ${payload.page.contentHeightRows} innehållsrader skickade.`;
  if (!checkpointActiveBatch("active", index + 1)) {
    state.job.transportUncertain = true;
    throw new Error("Utskriften skickades men säkerhetscheckpointen kunde inte sparas lokalt.");
  }
  state.job.nextIndex = index + 1;
  if (payload.job) state.job.cancelResult = payload.job;
  state.job.transportStarted = false;
  return payload;
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function printBatch(snapshot, startIndex = 0) {
  for (let index = startIndex; index < snapshot.batch.count; index += 1) {
    state.job.transportStarted = false;
    if (state.job.cancelRequested) {
      elements.printStatus.textContent = `Batchen avbröts efter ${index} etiketter.`;
      showToast(`Batchen avbröts efter ${index} etiketter.`);
      return;
    }
    if (index > 0 && snapshot.batch.intervalMs > 0) {
      elements.printStatus.textContent = `Pausar ${snapshot.batch.intervalMs / 1000} sekunder före etikett ${index + 1}…`;
      await wait(snapshot.batch.intervalMs);
      if (state.job.cancelRequested) continue;
    }
    if (snapshot.batch.confirmEach) {
      const confirmed = window.confirm(`Skriv ut etikett ${index + 1} av ${snapshot.batch.count}?`);
      if (!confirmed) {
        state.job.cancelRequested = true;
        state.job.cancelResult = await requestBatchCancellation(state.job.id, { allowNotFound: index === 0 && state.job.nextIndex === 0 });
        elements.printStatus.textContent = `Batchen stoppades efter ${index} etiketter.`;
        showToast(`Batchen stoppades efter ${index} etiketter.`);
        return;
      }
    }
    const document = resolvedDocumentForIndex(snapshot, index);
    if (state.job.cancelRequested) return;
    let preview;
    if (index === 0 && snapshot.preview) {
      preview = snapshot.preview;
    } else {
      const controller = new AbortController();
      state.job.previewController = controller;
      try {
        preview = await requestPreviewForDocument(document, controller.signal, { dither: snapshot.dither });
      } catch (error) {
        if (state.job.cancelRequested || error?.name === "AbortError") return;
        throw error;
      } finally {
        if (state.job.previewController === controller) state.job.previewController = null;
      }
    }
    if (state.job.cancelRequested) return;
    if (!preview.canPrint || !preview.pages?.length) {
      throw new Error(`Etikett ${index + 1} kan inte skrivas ut: ${diagnosticMessage(preview.diagnostics?.[0] ?? { message: "ogiltigt dokument" })}`);
    }
    let attempts = 0;
    while (true) {
      try {
        await printOne(document, preview, snapshot, index);
        break;
      } catch (error) {
        const safeToRetry = snapshot.batch.onError === "retry"
          && !state.job.transportStarted
          && !state.job.transportUncertain
          && attempts < 1;
        if (safeToRetry) {
          attempts += 1;
          elements.printStatus.textContent = `Etikett ${index + 1} misslyckades; nytt försök…`;
          await wait(750);
          continue;
        }
        const safeToSkip = snapshot.batch.onError === "skip"
          && index > 0
          && !state.job.transportStarted
          && !state.job.transportUncertain;
        if (safeToSkip) {
          await skipBatchItem(state.job.id, index);
          state.job.nextIndex = index + 1;
          if (!checkpointActiveBatch("active", index + 1, error instanceof Error ? error.message : String(error))) {
            throw new Error("Etiketten hoppades över på servern men säkerhetscheckpointen kunde inte sparas lokalt.");
          }
          elements.printStatus.textContent = `Etikett ${index + 1} hoppades över säkert.`;
          break;
        }
        throw error;
      }
    }
  }
  showToast(`${snapshot.batch.count} etiketter är klara.`);
}

async function requestBatchCancellation(jobId, { allowNotFound = false } = {}) {
  if (!jobId) return;
  try {
    const response = await fetch("/api/batch/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const payload = await response.json();
    if (!response.ok && !(allowNotFound && response.status === 404)) throw new Error(payload.error ?? "Batchen kunde inte avbrytas säkert.");
    if (response.status === 404) return { ...payload, missing: true };
    return payload;
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
    return null;
  }
}

async function waitForBatchTerminalState(jobId, attempts = 24) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch("/api/batch/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const status = await response.json();
      if (!response.ok) return null;
      if (["cancelled", "complete", "unknown", "expired"].includes(status.state)) return status;
    } catch (_error) {
      return null;
    }
    await wait(250);
  }
  return null;
}

async function cancelBatch() {
  if (!state.job.active) return;
  state.job.cancelRequested = true;
  elements.printStatus.textContent = "Batchen avbryts efter pågående etikett…";
  if (state.job.id) {
    state.job.previewController?.abort();
    state.job.cancelResult = await requestBatchCancellation(state.job.id, {
      allowNotFound: state.job.nextIndex === 0 && !state.job.transportStarted,
    });
    if (!state.job.cancelResult) {
      state.job.cancelRequested = false;
      checkpointActiveBatch(state.job.transportStarted ? "unknown" : "active", state.job.nextIndex, "Servern bekräftade inte avbrytningen.");
      elements.printStatus.textContent = "Avbrytningen kunde inte bekräftas; jobbet är sparat för säker hantering.";
    }
  }
  updateMobileAction();
}

async function discardPendingBatch() {
  const pending = state.pendingBatchJob;
  if (!pending) return;
  if (!window.confirm("Glöm jobbet först när du har kontrollerat skrivaren och bekräftat att ingen etikett behöver återupptas. Fortsätt?")) return;
  try {
    const response = await fetch("/api/batch/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: pending.jobId, confirmedPhysicalState: true }),
    });
    const payload = await response.json();
    if (!response.ok && response.status !== 404) throw new Error(payload.error ?? "Det sparade jobbet kunde inte avbrytas.");
    clearPendingBatchJob();
    showToast("Det sparade batchjobbet glömdes.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  }
}

async function resumePendingBatch() {
  const pending = state.pendingBatchJob;
  if (!pending || state.job.active) return;
  if (!state.serverAvailable || !state.connected) {
    showToast("Anslut skrivaren innan jobbet återupptas.", true);
    return;
  }
  try {
    const statusResponse = await fetch("/api/batch/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: pending.jobId }),
    });
    const status = await statusResponse.json();
    if (!statusResponse.ok) throw new Error(status.error ?? "Batchstatus kunde inte läsas.");
    if (status.state === "unknown") throw new Error("Transportstatusen är okänd. Kontrollera skrivaren och glöm jobbet innan du startar en ny utskrift.");
    const startIndex = Number.isInteger(status.nextIndex) ? status.nextIndex : pending.nextIndex;
    if (status.state === "complete" && startIndex >= pending.snapshot.batch.count) {
      clearPendingBatchJob();
      showToast("Batchjobbet är redan klart.");
      return;
    }
    if (status.state !== "ready") throw new Error(`Batchjobbet kan inte återupptas i läget ${status.state}.`);
    if (startIndex >= pending.snapshot.batch.count) {
      clearPendingBatchJob();
      showToast("Batchjobbet är redan klart.");
      return;
    }
    const snapshot = {
      ...clone(pending.snapshot),
      preview: null,
      jobId: pending.jobId,
      templateFingerprint: pending.snapshot.templateFingerprint ?? fingerprintValue(pending.snapshot.document),
    };
    state.document = clone(snapshot.document);
    state.batch = clone(snapshot.batch);
    state.templateValues = clone(snapshot.templateValues ?? {});
    state.batchRows = clone(snapshot.batchRows ?? []);
    state.documentRevision += 1;
    state.preview = null;
    state.previewReady = false;
    state.previewHasErrors = false;
    renderAll();
    state.job = { active: true, id: snapshot.jobId, index: startIndex, nextIndex: startIndex, count: snapshot.batch.count, cancelRequested: false, cancelResult: null, transportStarted: false, transportUncertain: false, snapshot };
    state.printing = true;
    setJobControlsDisabled(true);
    updatePrintAvailability();
    updateMobileAction();
    elements.printStatus.textContent = `Återupptar etikett ${startIndex + 1} av ${snapshot.batch.count}…`;
    let failure = null;
    try {
      if (startIndex === 0) snapshot.preview = await requestPreviewForDocument(resolvedDocumentForIndex(snapshot, 0), undefined, { dither: snapshot.dither });
      await printBatch(snapshot, startIndex);
    } catch (error) {
      failure = error;
      if (state.job.transportUncertain || state.job.transportStarted) {
        checkpointActiveBatch("unknown", state.job.nextIndex, error instanceof Error ? error.message : String(error));
      } else {
        checkpointActiveBatch("active", state.job.nextIndex, error instanceof Error ? error.message : String(error));
      }
      showToast(error instanceof Error ? error.message : String(error), true);
    } finally {
      if (!failure && state.job.cancelRequested && state.job.cancelResult?.state === "cancelling") {
        state.job.cancelResult = await waitForBatchTerminalState(state.job.id);
      }
      if (failure && (state.job.transportUncertain || state.job.transportStarted)) {
        // Keep an uncertain physical result for explicit reconciliation.
      } else if (state.job.cancelRequested) {
        if (state.job.cancelResult?.state === "cancelled" || state.job.cancelResult?.missing === true) clearPendingBatchJob();
        else checkpointActiveBatch("active", state.job.nextIndex, "Avbrytningen måste bekräftas av servern innan jobbet kan glömmas.");
      } else if (!failure) clearPendingBatchJob();
      await refreshStatus();
      state.printing = false;
      state.job.active = false;
      state.job.snapshot = null;
      setJobControlsDisabled(false);
      updatePrintAvailability();
      updateMobileAction();
    }
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  }
}

function useTemplate(template) {
  if (state.job.active) {
    showToast("Arbetsläge kan inte bytas medan ett utskriftsjobb pågår.", true);
    return;
  }
  if (template === "custom") {
    state.activeTemplate = "custom";
    updateModeAria();
    saveDraft();
    return;
  }
  const factories = {
    test: createTestDocument,
    price: createPriceDocument,
    qr: createQrDocument,
    receipt: createReceiptDocument,
    ticket: createTicketDocument,
    parking: createParkingDocument,
    attendance: createAttendanceDocument,
    blank: createBlankDocument,
  };
  const factory = factories[template];
  if (!factory) return;
  const nextDocument = factory();
  state.activeTemplate = template;
  state.batchRows = [];
  if (template === "parking") {
    state.templateValues = {
      date: new Intl.DateTimeFormat("sv-SE").format(new Date()),
      vehicle: "",
      reason: "",
    };
  } else {
    state.templateValues = {};
  }
  setDocument(nextDocument, nextDocument.nodes[0]?.id ?? null);
  document.querySelectorAll(".mode-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.template === template));
  updateModeAria();
  renderAll();
}

function applyJson() {
  try {
    const candidate = JSON.parse(elements.jsonEditor.value);
    const validationError = documentValidationError(candidate);
    if (validationError) throw new Error(validationError);
    state.activeTemplate = "custom";
    setDocument(candidate, candidate.nodes[0]?.id ?? null);
    document.querySelectorAll(".mode-tab").forEach((tab) => tab.classList.remove("active"));
    updateModeAria();
    renderAll();
    showToast("Dokumentmodellen laddades.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  }
}

function duplicateSelectedNode() {
  const node = selectedNode();
  if (!node) return;
  const copy = clone(node);
  copy.id = uniqueId(node.kind);
  copy.x = Math.max(0, Math.min(PROFILE_WIDTH - copy.width, copy.x + 8));
  copy.y = Math.max(0, Math.min(state.document.page.heightDots - copy.height, copy.y + 8));
  const index = state.document.nodes.findIndex((candidate) => candidate.id === node.id);
  const nodes = [...state.document.nodes];
  nodes.splice(index + 1, 0, copy);
  setDocument({ ...state.document, nodes }, copy.id);
  renderAll();
  showToast("Objektet duplicerades.");
}

function moveSelectedNode(delta) {
  const index = state.document.nodes.findIndex((candidate) => candidate.id === state.selectedNodeId);
  const targetIndex = index + delta;
  if (index < 0 || targetIndex < 0 || targetIndex >= state.document.nodes.length) return;
  const nodes = [...state.document.nodes];
  [nodes[index], nodes[targetIndex]] = [nodes[targetIndex], nodes[index]];
  setDocument({ ...state.document, nodes });
  renderAll();
}

function exportDocument() {
  const workspace = {
    schema: "mxw01.local-terminal-workspace",
    version: 1,
    activeTemplate: state.activeTemplate,
    selectedNodeId: state.selectedNodeId,
    previewMode: state.previewMode,
    printOptions: { intensity: state.intensity, dither: state.dither },
    batch: state.batch,
    batchRows: state.batchRows,
    templateValues: state.templateValues,
    document: state.document,
  };
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mxw01-local-workspace.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("Dokumentet exporterades.");
}

function requestTemplateDialog({ title, description, name = "", variableNames = [], values = {}, includeName = true }) {
  return new Promise((resolve) => {
    const dialog = elements.templateDialog;
    const form = elements.templateDialogForm;
    let onSubmit;
    let onCancel;
    const cleanup = () => {
      form.removeEventListener("submit", onSubmit);
      elements.templateDialogCancel.removeEventListener("click", onCancel);
      dialog.removeEventListener("cancel", onCancel);
    };
    const finish = (result) => {
      cleanup();
      dialog.close?.();
      resolve(result);
    };
    elements.templateDialogTitle.textContent = title;
    elements.templateDialogDescription.textContent = description;
    elements.templateNameField.hidden = !includeName;
    elements.templateNameInput.required = includeName;
    elements.templateNameInput.value = name;
    elements.templateVariableFields.replaceChildren(...variableNames.map((variableName) => {
      const label = document.createElement("label");
      label.className = "field";
      const caption = document.createElement("span");
      caption.className = "field-label";
      caption.textContent = variableName;
      const input = document.createElement("input");
      input.className = "text-input";
      input.dataset.variableName = variableName;
      input.value = typeof values[variableName] === "string" ? values[variableName] : "";
      label.append(caption, input);
      return label;
    }));
    onSubmit = (event) => {
      event.preventDefault();
      const collected = Object.fromEntries([...elements.templateVariableFields.querySelectorAll("[data-variable-name]")].map((input) => [input.dataset.variableName, input.value]));
      finish({ name: elements.templateNameInput.value.trim(), values: collected });
    };
    onCancel = () => finish(null);
    form.addEventListener("submit", onSubmit);
    elements.templateDialogCancel.addEventListener("click", onCancel);
    dialog.addEventListener("cancel", onCancel);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    window.setTimeout(() => (includeName ? elements.templateNameInput : elements.templateVariableFields.querySelector("input"))?.focus(), 0);
  });
}

async function exportTemplate() {
  const tokenNames = new Set(collectTemplateTokens(state.document));
  const textTokenNames = [...tokenNames].filter((name) => name !== state.batch.variable);
  const details = await requestTemplateDialog({
    title: "Exportera mall",
    description: "Ge mallen ett namn och fyll i eventuella standardvärden.",
    name: elements.labelName.value.trim() || "MXW01-mall",
    variableNames: textTokenNames,
    values: state.templateValues,
  });
  if (!details) {
    showToast("Mallens export avbröts.");
    return;
  }
  if (!details.name) {
    showToast("Mallens export avbröts: ange ett namn.", true);
    return;
  }
  const name = details.name;
  const templateValues = { ...state.templateValues, ...details.values };
  const variables = Object.fromEntries([...tokenNames].map((name) => [name, name === state.batch.variable
    ? { type: "sequence", label: "Löpnummer", start: state.batch.start, step: state.batch.step, padding: state.batch.padding, prefix: state.batch.prefix, suffix: state.batch.suffix }
    : { type: "text", label: name, defaultValue: templateValues[name] ?? "" }]));
  const template = {
    schema: "mxw01.print-template",
    version: 1,
    id: `template-${Date.now().toString(36)}`,
    name,
    description: "Mall skapad i MXW01 Local Terminal",
    preferredMediaProfileId: state.document.page.media?.profileId ?? "mxw01-continuous-white",
    variables: Object.keys(variables).length > 0 ? variables : undefined,
    document: state.document,
  };
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name.toLocaleLowerCase("sv-SE").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "mxw01-template"}.mxwtemplate.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("Mallen exporterades.");
}

async function importDocument(file) {
  if (!file) return;
  try {
    if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error("JSON-filen är för stor. Maxgränsen är 8 MB.");
    const parsed = JSON.parse(await file.text());
    const candidate = isDocumentCandidate(parsed) ? parsed : parsed?.document;
    const validationError = documentValidationError(candidate);
    if (validationError) throw new Error(validationError);
    state.activeTemplate = "custom";
    state.previewMode = parsed.previewMode === "native" ? "native" : "fit";
    const printOptions = parsed.printOptions && typeof parsed.printOptions === "object" ? parsed.printOptions : {};
    state.intensity = Number.isInteger(printOptions.intensity) && printOptions.intensity >= 0 && printOptions.intensity <= 255 ? printOptions.intensity : 93;
    state.dither = ["threshold", "steinberg", "bayer", "atkinson", "pattern"].includes(printOptions.dither) ? printOptions.dither : DEFAULT_DITHER;
    state.ditherExplicit = true;
    if (parsed.batch && typeof parsed.batch === "object") {
      state.batch = {
        count: Number.isInteger(parsed.batch.count) ? Math.max(1, Math.min(1000, parsed.batch.count)) : 1,
        intervalMs: Number.isInteger(parsed.batch.intervalMs) ? Math.max(0, Math.min(60000, parsed.batch.intervalMs)) : 0,
        confirmEach: parsed.batch.confirmEach === true,
        variable: typeof parsed.batch.variable === "string" ? parsed.batch.variable.slice(0, 64) : "ticketNumber",
        start: Number.isInteger(parsed.batch.start) ? parsed.batch.start : 1,
        step: Number.isInteger(parsed.batch.step) ? parsed.batch.step : 1,
        padding: Number.isInteger(parsed.batch.padding) ? Math.max(0, Math.min(12, parsed.batch.padding)) : 0,
        prefix: typeof parsed.batch.prefix === "string" ? parsed.batch.prefix.slice(0, 32) : "",
        suffix: typeof parsed.batch.suffix === "string" ? parsed.batch.suffix.slice(0, 32) : "",
        onError: ["stop", "retry", "skip"].includes(parsed.batch.onError) ? parsed.batch.onError : "stop",
      };
    } else {
      state.batch = defaultBatchSettings();
    }
    state.templateValues = parsed.templateValues && typeof parsed.templateValues === "object" && !Array.isArray(parsed.templateValues)
      ? Object.fromEntries(Object.entries(parsed.templateValues).filter(([name, value]) => /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name) && typeof value === "string").slice(0, 64))
      : {};
    state.batchRows = Array.isArray(parsed.batchRows) ? parsed.batchRows.slice(0, 1000) : [];
    elements.intensity.value = String(state.intensity);
    elements.intensityValue.textContent = String(state.intensity);
    elements.dither.value = state.dither;
    setDocument(candidate, candidate.nodes.some((node) => node.id === parsed.selectedNodeId) ? parsed.selectedNodeId : candidate.nodes[0]?.id ?? null);
    invalidatePreview();
    document.querySelectorAll(".mode-tab").forEach((tab) => tab.classList.remove("active"));
    renderAll();
    updateModeAria();
    setPreviewMode(state.previewMode);
    showToast("Dokumentet importerades.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  } finally {
    elements.documentFileInput.value = "";
  }
}

async function importTemplate(file) {
  if (!file) return;
  try {
    if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error("Mallfilen är för stor. Maxgränsen är 8 MB.");
    const parsed = JSON.parse(await file.text());
    if (parsed?.schema !== "mxw01.print-template" || parsed?.version !== 1) throw new Error("Filen är inte en mxw01-template v1-mall.");
    const templateError = templateValidationError(parsed);
    if (templateError) throw new Error(templateError);
    const candidate = parsed.document;
    const validationError = documentValidationError(candidate);
    if (validationError) throw new Error(validationError);
    const nextBatch = defaultBatchSettings();
    const importedValues = {};
    if (parsed.variables && typeof parsed.variables === "object") {
      const tokenNames = new Set(collectTemplateTokens(candidate));
      const missingTextVariables = [];
      for (const [name, variable] of Object.entries(parsed.variables)) {
        if (typeof variable?.defaultValue === "string") {
          importedValues[name] = variable.defaultValue;
        } else if (variable?.type === "text" && tokenNames.has(name)) {
          missingTextVariables.push(name);
        }
      }
      if (missingTextVariables.length) {
        const details = await requestTemplateDialog({
          title: "Fyll i mallvärden",
          description: "Ange värden för mallens textvariabler innan den laddas.",
          variableNames: missingTextVariables,
          includeName: false,
        });
        if (!details) throw new Error("Mallimporten avbröts.");
        Object.assign(importedValues, details.values);
      }
      const sequence = Object.entries(parsed.variables).find(([, variable]) => variable?.type === "sequence");
      if (sequence) {
        const [name, variable] = sequence;
        nextBatch.variable = name;
        nextBatch.start = Number.isInteger(variable.start) ? variable.start : 1;
        nextBatch.step = Number.isInteger(variable.step) ? variable.step : 1;
        nextBatch.padding = Number.isInteger(variable.padding) ? variable.padding : 0;
        nextBatch.prefix = typeof variable.prefix === "string" ? variable.prefix.slice(0, 32) : "";
        nextBatch.suffix = typeof variable.suffix === "string" ? variable.suffix.slice(0, 32) : "";
      }
    }
    state.activeTemplate = "custom";
    state.batch = nextBatch;
    state.templateValues = importedValues;
    setDocument(candidate, candidate.nodes[0]?.id ?? null);
    invalidatePreview();
    document.querySelectorAll(".mode-tab").forEach((tab) => tab.classList.remove("active"));
    updateModeAria();
    renderAll();
    showToast(`Mallen laddades: ${parsed.name ?? "utan namn"}.`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), true);
  } finally {
    elements.templateFileInput.value = "";
  }
}

function showToast(message, error = false) {
  const toast = document.createElement("div");
  toast.className = `toast${error ? " error" : ""}`;
  toast.textContent = message;
  elements.toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function templateValidationError(template) {
  if (!template || typeof template !== "object" || Array.isArray(template)) return "Mallen måste vara ett JSON-objekt.";
  if (typeof template.id !== "string" || template.id.length === 0 || template.id.length > 128) return "Mallen saknar ett giltigt id.";
  if (typeof template.name !== "string" || template.name.trim().length === 0 || template.name.length > 128) return "Mallen saknar ett giltigt namn.";
  if (template.preferredMediaProfileId !== undefined && !MEDIA_PROFILES.some((profile) => profile.id === template.preferredMediaProfileId)) return "Mallen hänvisar till en okänd mediaprofil.";
  if (template.variables !== undefined && (!template.variables || typeof template.variables !== "object" || Array.isArray(template.variables))) return "Mallens variabler måste vara ett objekt.";
  const tokens = new Set(collectTemplateTokens(template.document));
  for (const token of tokens) {
    const variable = template.variables?.[token];
    if (!variable || !["text", "sequence", "date"].includes(variable.type)) return `Mallen saknar definition för {{${token}}}.`;
  }
  return null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character]));
}

async function ensureFontAwesome() {
  try {
    await document.fonts?.load('900 1em "Font Awesome 6 Free"');
  } catch (_error) {
    // The text fallback below keeps the local terminal usable without the font file.
  }
  const available = document.fonts?.check?.('900 1em "Font Awesome 6 Free"') ?? false;
  if (available) return;
  document.querySelectorAll(".fa-solid[data-fallback]").forEach((icon) => {
    icon.textContent = icon.dataset.fallback ?? "•";
    icon.classList.add("fa-fallback");
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function base64ByteLength(value) {
  if (typeof value !== "string" || value.length === 0 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return null;
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.floor(value.length * 3 / 4) - padding;
}

function canonicalizeForFingerprint(value) {
  if (Array.isArray(value)) return value.map((item) => canonicalizeForFingerprint(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, canonicalizeForFingerprint(value[key])]));
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Fingerprintvärdet innehåller ett ogiltigt tal.");
    return Object.is(value, -0) ? 0 : value;
  }
  return value;
}

function fingerprintValue(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalizeForFingerprint(value)));
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

document.querySelectorAll(".mode-tab").forEach((tab) => tab.addEventListener("click", () => useTemplate(tab.dataset.template)));
document.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", () => addNode(button.dataset.add)));
elements.nodeList.addEventListener("keydown", handleNodeListKeydown);
elements.addImageButton = document.querySelector("#add-image-button");
elements.addImageButton.addEventListener("click", () => elements.imageInput.click());
elements.imageInput.addEventListener("change", () => {
  void addImage(elements.imageInput.files?.[0]);
  elements.imageInput.value = "";
});
elements.pasteImage.addEventListener("click", () => void pasteImageFromClipboard());
elements.webpageButton?.addEventListener("click", openWebpageDialog);
elements.webpageDialogForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void importWebPage();
});
elements.webpageDialogCancel?.addEventListener("click", () => elements.webpageDialog?.close?.());
elements.batchData?.addEventListener("change", () => void importBatchData(elements.batchData.files?.[0]));
document.addEventListener("paste", (event) => void handlePaste(event));
window.addEventListener("pointermove", handleWysiwygPointerMove);
window.addEventListener("pointerup", handleWysiwygPointerUp);
window.addEventListener("pointercancel", handleWysiwygPointerCancel);
window.addEventListener("resize", () => window.requestAnimationFrame(renderWysiwygOverlay));
elements.deleteNode.addEventListener("click", removeSelectedNode);
elements.duplicateNode.addEventListener("click", duplicateSelectedNode);
elements.moveNodeUp.addEventListener("click", () => moveSelectedNode(-1));
elements.moveNodeDown.addEventListener("click", () => moveSelectedNode(1));
elements.connect.addEventListener("click", () => void connectPrinter());
elements.disconnect.addEventListener("click", () => void disconnectPrinter());
elements.print.addEventListener("click", () => void printDocument());
elements.cancelBatch.addEventListener("click", () => void cancelBatch());
elements.resumeBatch.addEventListener("click", () => void resumePendingBatch());
elements.discardBatch.addEventListener("click", () => void discardPendingBatch());
elements.intensity.addEventListener("input", () => {
  state.intensity = Number(elements.intensity.value);
  elements.intensityValue.textContent = elements.intensity.value;
  saveDraft();
});
elements.dither.addEventListener("change", () => {
  state.dither = elements.dither.value;
  state.ditherExplicit = true;
  invalidatePreview();
  saveDraft();
  schedulePreview();
});
elements.pageHeight.addEventListener("input", updatePageHeight);
elements.mediaProfile.addEventListener("change", updateMediaProfile);
elements.mediaGap.addEventListener("change", updateMediaGap);
elements.frameInset.addEventListener("change", updateFrameFromControls);
elements.frameThickness.addEventListener("change", updateFrameFromControls);
elements.frameStyle?.addEventListener("change", updateFrameFromControls);
elements.removeFrame.addEventListener("click", removeFrame);
[
  elements.batchCount,
  elements.batchInterval,
  elements.batchStart,
  elements.batchStep,
  elements.batchPadding,
  elements.batchPrefix,
  elements.batchSuffix,
  elements.batchVariable,
].forEach((input) => input.addEventListener("input", updateBatchFromControls));
elements.batchConfirm.addEventListener("change", updateBatchFromControls);
elements.batchOnError?.addEventListener("change", updateBatchFromControls);
elements.reconcileBatch?.addEventListener("click", () => void reconcileBatchJobs());
elements.fitPreview.addEventListener("click", () => setPreviewMode("fit"));
elements.nativePreview.addEventListener("click", () => setPreviewMode("native"));
elements.mobileAction.addEventListener("click", () => {
  if (state.document.nodes.length === 0) addNode("text");
  else if (state.previewHasErrors) elements.diagnostic.scrollIntoView({ behavior: "smooth", block: "center" });
  else if (state.connected) void printDocument();
  else void connectPrinter();
});
document.querySelector("#apply-json-button").addEventListener("click", applyJson);
elements.undo.addEventListener("click", undo);
elements.redo.addEventListener("click", redo);
elements.exportJson.addEventListener("click", exportDocument);
elements.importJson.addEventListener("click", () => elements.documentFileInput.click());
elements.documentFileInput.addEventListener("change", () => void importDocument(elements.documentFileInput.files?.[0]));
elements.exportTemplate.addEventListener("click", () => void exportTemplate());
elements.importTemplate.addEventListener("click", () => elements.templateFileInput.click());
elements.templateFileInput.addEventListener("change", () => void importTemplate(elements.templateFileInput.files?.[0]));
elements.saveLabelForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentLabel(elements.labelName.value);
});
document.querySelector("#copy-json-button").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(elements.jsonEditor.value); showToast("JSON kopierad."); } catch (_error) { showToast("Webbläsaren tillåter inte kopiering.", true); }
});

document.addEventListener("keydown", (event) => {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable) return;
  event.preventDefault();
  if (event.shiftKey) redo();
  else undo();
});
window.addEventListener("beforeunload", saveDraft);

restoreDraft();
loadSavedLabels();
loadPendingBatchJob();
populateMediaProfiles();
renderSavedLabels();
updateHistoryUi();
setPreviewMode(state.previewMode);
elements.intensity.value = String(state.intensity);
elements.intensityValue.textContent = String(state.intensity);
elements.dither.value = state.dither;
updateModeAria();
updateMobileAction();
renderAll();
void ensureFontAwesome();
void refreshStatus();
state.statusTimer = window.setInterval(() => void refreshStatus(), 700);
