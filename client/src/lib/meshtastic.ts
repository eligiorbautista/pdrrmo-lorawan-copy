import { MeshDevice } from "@meshtastic/core";
import { TransportWebBluetooth } from "@meshtastic/transport-web-bluetooth";

/**
 * Creates a MeshDevice connected via Web Bluetooth.
 * Prompts the user to select a Meshtastic BLE device.
 */
export async function createBluetoothDevice(): Promise<{
  device: MeshDevice;
  transport: TransportWebBluetooth;
}> {
  const transport = await TransportWebBluetooth.create();

  // Allow the newly established bonding secure tunnel to settle
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const device = new MeshDevice(transport);
  return { device, transport };
}

/**
 * Reconnects to a previously-paired Bluetooth device.
 */
export async function reconnectToDevice(
  bluetoothDevice: BluetoothDevice,
): Promise<{
  device: MeshDevice;
  transport: TransportWebBluetooth;
}> {
  const transport = await TransportWebBluetooth.createFromDevice(bluetoothDevice);
  const device = new MeshDevice(transport);
  return { device, transport };
}

