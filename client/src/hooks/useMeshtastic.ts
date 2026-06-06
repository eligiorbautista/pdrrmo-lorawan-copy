import { useCallback, useEffect, useRef } from "react";
import { Protobuf, Types } from "@meshtastic/core";
import { useDeviceStore } from "@/store/deviceStore";
import { createBluetoothDevice } from "@/lib/meshtastic";
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
        // Add ourselves (the local node) to the store's nodes list
        store.upsertNode({
          nodeNum: info.myNodeNum,
          shortName: "Me",
          longName: "Local Node Gateway",
          lastHeard: new Date(),
          role: "Local Client",
        });
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

      const { device, transport } = await createBluetoothDevice();

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
          await device.disconnect();
        } catch {
          // Disconnect may throw if already disconnected
        }
        try {
          await transport.disconnect();
        } catch {
          // Ignore errors if transport is already dead
        }
        store.setConnection(null);
        store.setPhase("disconnected");
      };

      // Wait for the device to successfully complete its pairing/bonding and report Connected
      store.setPhase("connecting");
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          unsub();
          reject(new Error("Pairing attempt timed out. Please try again."));
        }, 45000); // 45 seconds timeout to allow slow typing of PIN

        const unsub = device.events.onDeviceStatus.subscribe((status: Types.DeviceStatusEnum) => {
          if (status === Types.DeviceStatusEnum.DeviceConnected) {
            clearTimeout(timeout);
            unsub();
            resolve();
          } else if (status === Types.DeviceStatusEnum.DeviceDisconnected) {
            clearTimeout(timeout);
            unsub();
            reject(new Error("Device disconnected during pairing."));
          }
        });
      });

      store.setPhase("configuring");

      // configure() requests config + node info from the device.
      // When the device responds, onMyNodeInfo fires → phase transitions to "configured".
      await device.configure();

      // Request browser location and share it with the local device (especially if it has no built-in GPS)
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              // Set the fixed position on the device
              await device.setFixedPosition(latitude, longitude);
              // Update local node position in the store
              store.upsertNode({
                nodeNum: store.myNodeNum ?? 0,
                shortName: "Me",
                longName: "Local Node Gateway",
                lastHeard: new Date(),
                position: { latitude, longitude },
                role: "Local Client",
              });
            } catch (e) {
              console.warn("Failed to set device position:", e);
            }
          },
          (err) => {
            console.warn("Geolocation denied or failed:", err);
          },
          { enableHighAccuracy: true }
        );
      }

      // Start heartbeat to keep the connection alive
      device.heartbeat().catch(() => {});

      heartbeatRef.current = setInterval(() => {
        device.heartbeat().catch(() => {});
      }, 5 * 60 * 1000); // 5-minute heartbeat interval
    } catch (err) {
      // Clear the stale device reference so the next attempt opens a fresh
      // browser picker instead of retrying a dead BLE handle.
      store.setBluetoothDevice(null);
      store.setConnection(null);

      // Clean up connection handles if they were instantiated before failure
      if (disconnectRef.current) {
        await disconnectRef.current().catch(() => {});
        disconnectRef.current = null;
      }

      const message = err instanceof Error ? err.message : "Failed to connect";
      // Surface a friendlier hint when the low-level transport rejects.
      const isTransportError =
        message.toLowerCase().includes("connection attempt failed") ||
        message.toLowerCase().includes("gatt") ||
        message.toLowerCase().includes("not found");
      store.setError(
        isTransportError
          ? `Bluetooth pairing failed: make sure the device is powered on, in range, and not already connected to another app. (${message})`
          : message,
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
