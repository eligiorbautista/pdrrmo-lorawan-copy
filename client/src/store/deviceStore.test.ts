import { describe, it, expect, beforeEach } from "vitest";
import { useDeviceStore } from "./deviceStore";
import type { MeshNode } from "@/lib/types";

function makeNode(overrides: Partial<MeshNode> = {}): MeshNode {
  return {
    nodeNum: 0x1234,
    shortName: "Test",
    longName: "Test Node",
    lastHeard: new Date(),
    role: "Client",
    ...overrides,
  };
}

describe("deviceStore", () => {
  beforeEach(() => {
    useDeviceStore.getState().reset();
  });

  describe("connection lifecycle", () => {
    it("starts with idle phase", () => {
      expect(useDeviceStore.getState().phase).toBe("idle");
    });

    it("transitions through connection phases", () => {
      const store = useDeviceStore.getState();
      store.setPhase("scanning");
      expect(useDeviceStore.getState().phase).toBe("scanning");

      store.setPhase("connecting");
      expect(useDeviceStore.getState().phase).toBe("connecting");

      store.setPhase("configured");
      expect(useDeviceStore.getState().phase).toBe("configured");
    });

    it("sets error phase when error is set", () => {
      useDeviceStore.getState().setError("BLE connection failed");
      expect(useDeviceStore.getState().phase).toBe("error");
      expect(useDeviceStore.getState().error).toBe("BLE connection failed");
    });

    it("clears error on reconnect", () => {
      useDeviceStore.getState().setError("Failed");
      useDeviceStore.getState().setPhase("scanning");
      expect(useDeviceStore.getState().phase).toBe("scanning");
      expect(useDeviceStore.getState().error).toBe("Failed"); // error stays until cleared
    });
  });

  describe("node management", () => {
    it("adds a new node", () => {
      useDeviceStore.getState().upsertNode(makeNode({ nodeNum: 100 }));
      expect(useDeviceStore.getState().nodes.size).toBe(1);
      expect(useDeviceStore.getState().nodes.get(100)?.shortName).toBe("Test");
    });

    it("updates an existing node", () => {
      useDeviceStore.getState().upsertNode(makeNode({ nodeNum: 100, shortName: "Old" }));
      useDeviceStore.getState().upsertNode(makeNode({ nodeNum: 100, shortName: "New", role: "Router" }));
      const node = useDeviceStore.getState().nodes.get(100);
      expect(node?.shortName).toBe("New");
      expect(node?.role).toBe("Router");
    });

    it("removes a node", () => {
      useDeviceStore.getState().upsertNode(makeNode({ nodeNum: 100 }));
      useDeviceStore.getState().upsertNode(makeNode({ nodeNum: 200 }));
      useDeviceStore.getState().removeNode(100);
      expect(useDeviceStore.getState().nodes.size).toBe(1);
      expect(useDeviceStore.getState().nodes.has(100)).toBe(false);
      expect(useDeviceStore.getState().nodes.has(200)).toBe(true);
    });

    it("resets clears all nodes", () => {
      useDeviceStore.getState().upsertNode(makeNode({ nodeNum: 100 }));
      useDeviceStore.getState().upsertNode(makeNode({ nodeNum: 200 }));
      useDeviceStore.getState().reset();
      expect(useDeviceStore.getState().nodes.size).toBe(0);
      expect(useDeviceStore.getState().phase).toBe("idle");
      expect(useDeviceStore.getState().connection).toBeNull();
    });
  });

  describe("myNodeNum", () => {
    it("tracks our own node number", () => {
      useDeviceStore.getState().setMyNodeNum(0xABCD);
      expect(useDeviceStore.getState().myNodeNum).toBe(0xABCD);
    });
  });
});
