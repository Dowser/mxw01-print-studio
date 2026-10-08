import { describe, expect, it } from "vitest";
import { ThermalPrinterClient } from "../../core/ThermalPrinterClient";
import type {
  BluetoothAdapter,
  BluetoothCharacteristic,
  BluetoothConnection,
  BluetoothDevice,
  BluetoothNotificationEvent,
  BluetoothServiceInfo,
} from "../../core/types";
import { Command, makeCommand } from "../../services/protocol";

class FakeCharacteristic implements BluetoothCharacteristic {
  private readonly listeners = new Set<(event: BluetoothNotificationEvent) => void>();
  public write: (data: Uint8Array) => Promise<void> = async () => undefined;

  async writeValueWithoutResponse(data: Uint8Array): Promise<void> {
    await this.write(data);
  }

  async startNotifications(): Promise<void> {}

  async stopNotifications(): Promise<void> {}

  addEventListener(_event: string, callback: (event: BluetoothNotificationEvent) => void): void {
    this.listeners.add(callback);
  }

  removeEventListener(_event: string, callback: (event: BluetoothNotificationEvent) => void): void {
    this.listeners.delete(callback);
  }

  emit(value: Uint8Array): void {
    this.listeners.forEach((listener) => listener({ value }));
  }
}

class FakeAdapter implements BluetoothAdapter {
  readonly device: BluetoothDevice = { id: "fake-mxw01", name: "Fake MXW01" };
  readonly control = new FakeCharacteristic();
  readonly data = new FakeCharacteristic();
  readonly notify = new FakeCharacteristic();
  statusPayload = Uint8Array.of(0, 0, 0, 0, 0, 0, 0);

  constructor() {
    this.control.write = async (data) => {
      if (data[2] === Command.GetStatus) {
        this.notify.emit(makeCommand(Command.GetStatus, this.statusPayload));
      }
    };
  }

  isAvailable(): boolean {
    return true;
  }

  async requestDevice(): Promise<BluetoothDevice> {
    return this.device;
  }

  async connect(device: BluetoothDevice): Promise<BluetoothConnection & BluetoothServiceInfo> {
    return {
      device,
      controlCharacteristic: this.control,
      dataCharacteristic: this.data,
      notifyCharacteristic: this.notify,
      disconnect: async () => undefined,
    };
  }
}

describe("core/ThermalPrinterClient", () => {
  it("fails closed until a live status response confirms the printer is ready", async () => {
    const adapter = new FakeAdapter();
    const client = new ThermalPrinterClient(adapter);

    expect(client.statusVerified).toBe(false);
    expect(client.isPrintReady).toBe(false);

    await client.connect();
    expect(client.statusVerified).toBe(true);
    expect(client.isPrintReady).toBe(true);

    adapter.statusPayload = Uint8Array.of(0, 0, 0, 0, 0, 0, 0b00000010);
    await client.getStatus();
    expect(client.statusVerified).toBe(true);
    expect(client.isPrintReady).toBe(false);

    await client.disconnect();
    expect(client.statusVerified).toBe(false);
    expect(client.isPrintReady).toBe(false);
  });
});
