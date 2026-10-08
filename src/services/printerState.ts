// Printer state management

import { Command } from "./protocol";

/**
 * Printer state interface
 */
export interface PrinterState {
  printing: boolean;
  paper_jam: boolean;
  out_of_paper: boolean;
  cover_open: boolean;
  battery_low: boolean;
  overheat: boolean;
}

/**
 * Parse printer state from status response payload
 * @param payload Status response payload
 * @returns Parsed printer state or null if invalid
 */
export function parsePrinterState(payload: Uint8Array): PrinterState | null {
  if (payload.length < 7) {
    return null;
  }

  const statusByte = payload[6];
  return {
    printing: (statusByte & 0x01) !== 0,
    paper_jam: (statusByte & 0x02) !== 0,
    out_of_paper: (statusByte & 0x04) !== 0,
    cover_open: (statusByte & 0x08) !== 0,
    battery_low: (statusByte & 0x10) !== 0,
    overheat: (statusByte & 0x20) !== 0,
  };
}

/**
 * Create initial/default printer state
 */
export function createDefaultState(): PrinterState {
  return {
    printing: false,
    paper_jam: false,
    out_of_paper: false,
    cover_open: false,
    battery_low: false,
    overheat: false,
  };
}

interface PendingNotification {
  readonly promise: Promise<Uint8Array>;
  readonly resolve: (payload: Uint8Array) => void;
  readonly reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Printer state manager
 * Handles state updates and notification processing
 */
export class PrinterStateManager {
  private state: PrinterState;
  private printComplete: boolean = false;
  private printCompleteSequence = 0;
  private pendingResolvers: Map<number, Set<PendingNotification>> = new Map();

  constructor() {
    this.state = createDefaultState();
  }

  /**
   * Get current printer state
   */
  getState(): PrinterState {
    return { ...this.state };
  }

  /**
   * Check if print is complete
   */
  isPrintComplete(): boolean {
    return this.printComplete;
  }

  getPrintCompleteSequence(): number {
    return this.printCompleteSequence;
  }

  /**
   * Reset print complete flag
   */
  resetPrintComplete(): void {
    this.printComplete = false;
  }

  /**
   * Process notification and update state
   * @param cmdId Command ID from notification
   * @param payload Notification payload
   */
  processNotification(cmdId: number, payload: Uint8Array): void {
    // Check for print complete notification
    if (cmdId === Command.PrintComplete) {
      this.printComplete = true;
      this.printCompleteSequence += 1;
    }

    // Update state from status response
    if (cmdId === Command.GetStatus) {
      const newState = parsePrinterState(payload);
      if (newState) {
        this.state = newState;
      }
    }

    // Resolve any pending promise for this command
    const waiters = this.pendingResolvers.get(cmdId);
    if (waiters) {
      this.pendingResolvers.delete(cmdId);
      waiters.forEach((waiter) => {
        clearTimeout(waiter.timer);
        waiter.resolve(payload);
      });
    }
  }

  /** Reject waits when a transport disappears before a response arrives. */
  rejectPending(error: Error): void {
    this.pendingResolvers.forEach((waiters) => {
      waiters.forEach((waiter) => {
        clearTimeout(waiter.timer);
        waiter.reject(error);
      });
    });
    this.pendingResolvers.clear();
  }

  /**
   * Wait for notification response
   * @param cmdId Command ID to wait for
   * @param timeoutMs Timeout in milliseconds
   * @returns Promise that resolves with the payload
   */
  waitForNotification(cmdId: number, timeoutMs = 10000): Promise<Uint8Array> {
    let resolvePromise!: (payload: Uint8Array) => void;
    let rejectPromise!: (error: Error) => void;
    const promise = new Promise<Uint8Array>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    const waiter: PendingNotification = {
      promise,
      resolve: resolvePromise,
      reject: rejectPromise,
      timer: setTimeout(() => {
        const waiters = this.pendingResolvers.get(cmdId);
        if (waiters) {
          waiters.delete(waiter);
          if (waiters.size === 0) {
            this.pendingResolvers.delete(cmdId);
          }
        }
        rejectPromise(
          new Error(`Timeout waiting for notification 0x${cmdId.toString(16)}`)
        );
      }, timeoutMs),
    };

    let waiters = this.pendingResolvers.get(cmdId);
    if (!waiters) {
      waiters = new Set<PendingNotification>();
      this.pendingResolvers.set(cmdId, waiters);
    }
    waiters.add(waiter);
    return promise;
  }

  /** Remove a waiter whose command write failed before a response could arrive. */
  cancelNotification(cmdId: number, promise: Promise<Uint8Array>): void {
    const waiters = this.pendingResolvers.get(cmdId);
    if (!waiters) {
      return;
    }
    for (const waiter of waiters) {
      if (waiter.promise === promise) {
        clearTimeout(waiter.timer);
        waiters.delete(waiter);
        break;
      }
    }
    if (waiters.size === 0) {
      this.pendingResolvers.delete(cmdId);
    }
  }
}
