import { useCallback, useEffect, useRef } from "react";
import { Protobuf, Types } from "@meshtastic/core";
import { useDeviceStore } from "@/store/deviceStore";
import { createBluetoothDevice, reconnectToDevice } from "@/lib/meshtastic";
import type { MeshNode } from "@/lib/types";

/**
 * Hook managing the Meshtastic Bluetooth connection lifecycle.
 *
 * Provides `connect`, `disconnect`, and automatic event subscription.
 * The connection state flows through the deviceStore.
 */
export function useMeshtastic() {
  const store = useDeviceStore();
  const disconnectRef = useRef<(() => Promise<void>) | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  // Subscribe to device events when connection changes
  useEffect(() => {
    const conn = store.connection;
    if (!conn) return;

    // Track our own node info — signals configuration is complete
    const unsubMyNode = conn.events.onMyNodeInfo.subscribe(
      (info: Protobuf.Mesh.MyNodeInfo) => {
        store.setMyNodeNum(info.myNodeNum);
        store.setPhase("configured");
      },
    );

    // Track node info updates (other nodes on mesh)
    const unsubNodeInfo = conn.events.onNodeInfoPacket.subscribe(
      (nodeInfo: Protobuf.Mesh.NodeInfo) => {
        const node: MeshNode = {
          nodeNum: nodeInfo.num,
          shortName:
            nodeInfo.user?.shortName ?? `Node ${nodeInfo.num.toString(16)}`,
          longName: nodeInfo.user?.longName ?? "",
          lastHeard: new Date(),
          position: nodeInfo.position
            ? {
                latitude: nodeInfo.position.latitudeI * 1e-7,
                longitude: nodeInfo.position.longitudeI * 1e-7,
              }
            : undefined,
          role: roleName(nodeInfo.user?.role ?? 0),
        };
        store.upsertNode(node);
      },
    );

    // Track position updates
    const unsubPosition = conn.events.onPositionPacket.subscribe(
      (packet: Types.PacketMetadata<Protobuf.Mesh.Position>) => {
        store.upsertNode({
          nodeNum: packet.from,
          shortName:
            store.nodes.get(packet.from)?.shortName ??
            `Node ${packet.from.toString(16)}`,
          longName: store.nodes.get(packet.from)?.longName ?? "",
          lastHeard: new Date(),
          position: {
            latitude: packet.data.latitudeI * 1e-7,
            longitude: packet.data.longitudeI * 1e-7,
          },
          role: store.nodes.get(packet.from)?.role ?? "Unknown",
          batteryLevel: packet.data.batteryLevel,
        });
      },
    );

    // Track device status changes
    const unsubStatus = conn.events.onDeviceStatus.subscribe(
      (status: Types.DeviceStatusEnum) => {
        if (status === Types.DeviceStatusEnum.DeviceDisconnected) {
          store.setPhase("disconnected");
        }
      },
    );

    return () => {
      unsubMyNode();
      unsubNodeInfo();
      unsubPosition();
      unsubStatus();
    };
  }, [store.connection]);

  const connect = useCallback(async () => {
    try {
      store.setPhase("scanning");
      store.setError(null);

      const { device, transport } = store.bluetoothDevice
        ? await reconnectToDevice(store.bluetoothDevice)
        : await createBluetoothDevice();

      // Store Bluetooth device reference for reconnection
      const btDevice = (
        transport as unknown as {
          gattServer?: { device: BluetoothDevice };
        }
      ).gattServer?.device;
      if (btDevice) store.setBluetoothDevice(btDevice);

      store.setConnection(device);
      store.setPhase("configuring");

      // Wire up disconnect
      disconnectRef.current = async () => {
        clearInterval(heartbeatRef.current);
        try {
          device.disconnect();
        } catch {
          // Disconnect may throw if already disconnected
        }
        await transport.disconnect();
        store.setConnection(null);
        store.setPhase("disconnected");
      };

      // Start the Meshtastic protocol handshake.
      // configure() requests config + node info from the device.
      // When the device responds, onMyNodeInfo fires → phase transitions to "configured".
      await device.configure();

      // Start heartbeat to keep the connection alive
      device.heartbeat().catch(() => {});

      heartbeatRef.current = setInterval(() => {
        device.heartbeat().catch(() => {});
      }, 5 * 60 * 1000); // 5-minute heartbeat interval
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : "Failed to connect",
      );
      store.setPhase("error");
    }
  }, [store.bluetoothDevice]);

  const disconnect = useCallback(async () => {
    await disconnectRef.current?.();
    store.reset();
  }, []);

  return {
    connect,
    disconnect,
    phase: store.phase,
    error: store.error,
    isConnected: store.phase === "configured",
    myNodeNum: store.myNodeNum,
    statusLabel:
      store.phase === "error"
        ? (store.error ?? "Error")
        : phaseLabel(store.phase),
  };
}

function roleName(role: number): string {
  const roles: Record<number, string> = {
    0: "Client",
    1: "Client Mute",
    2: "Router",
    3: "Router Client",
    4: "Repeater",
    5: "Tracker",
    6: "Sensor",
    7: "TAK",
    8: "Client Hidden",
    9: "Lost and Found",
    10: "TAK Tracker",
  };
  return roles[role] ?? `Unknown (${role})`;
}

function phaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    idle: "Ready to connect",
    scanning: "Scanning for devices…",
    connecting: "Connecting…",
    configuring: "Configuring device…",
    configured: "Connected",
    disconnected: "Disconnected",
    error: "Error",
  };
  return labels[phase] ?? phase;
}
