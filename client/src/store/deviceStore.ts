import { create } from "zustand";
import type { MeshDevice } from "@meshtastic/core";
import type { ConnectionPhase, MeshNode } from "@/lib/types";

interface DeviceState {
  /** The active MeshDevice instance (null when disconnected) */
  connection: MeshDevice | null;
  /** Current connection lifecycle phase */
  phase: ConnectionPhase;
  /** Error message if phase is "error" */
  error: string | null;
  /** Our own node number once configured */
  myNodeNum: number | null;
  /** Known nodes on the mesh */
  nodes: Map<number, MeshNode>;
  /** The Bluetooth device for reconnection */
  bluetoothDevice: BluetoothDevice | null;

  // Actions
  setConnection: (conn: MeshDevice | null) => void;
  setPhase: (phase: ConnectionPhase) => void;
  setError: (error: string | null) => void;
  setMyNodeNum: (num: number) => void;
  upsertNode: (node: MeshNode) => void;
  removeNode: (nodeNum: number) => void;
  setBluetoothDevice: (device: BluetoothDevice | null) => void;
  reset: () => void;
}

const initialState = {
  connection: null,
  phase: "idle" as ConnectionPhase,
  error: null,
  myNodeNum: null,
  nodes: new Map<number, MeshNode>(),
  bluetoothDevice: null,
};

export const useDeviceStore = create<DeviceState>((set) => ({
  ...initialState,

  setConnection: (connection) => set({ connection }),
  setPhase: (phase) => set({ phase }),
  setError: (error) => set({ error, phase: error ? "error" : "idle" }),
  setMyNodeNum: (myNodeNum) => set({ myNodeNum }),
  upsertNode: (node) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.set(node.nodeNum, { ...state.nodes.get(node.nodeNum), ...node });
      return { nodes };
    }),
  removeNode: (nodeNum) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.delete(nodeNum);
      return { nodes };
    }),
  setBluetoothDevice: (bluetoothDevice) => set({ bluetoothDevice }),
  reset: () => set({ ...initialState, nodes: new Map() }),
}));
