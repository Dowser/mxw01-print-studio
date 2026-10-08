export type PrinterErrorCode =
  | "bluetooth-unavailable"
  | "not-connected"
  | "connection-failed"
  | "transport"
  | "protocol"
  | "printer-rejected"
  | "printer-fault"
  | "busy"
  | "timeout"
  | "cancelled"
  | "unknown";

export interface PrinterErrorOptions {
  readonly recoverable?: boolean;
  readonly cause?: unknown;
}

/** Stable, serializable error category for web and native clients. */
export class PrinterError extends Error {
  readonly code: PrinterErrorCode;
  readonly recoverable: boolean;
  readonly cause?: unknown;

  constructor(
    code: PrinterErrorCode,
    message: string,
    options: PrinterErrorOptions = {}
  ) {
    super(message);
    this.name = "PrinterError";
    this.code = code;
    this.recoverable = options.recoverable ?? false;
    this.cause = options.cause;
  }
}

export function asPrinterError(
  error: unknown,
  fallbackCode: PrinterErrorCode = "unknown"
): PrinterError {
  if (error instanceof PrinterError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new PrinterError(fallbackCode, message, { cause: error });
}
