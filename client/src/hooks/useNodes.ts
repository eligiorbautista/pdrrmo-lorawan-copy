import { useDeviceStore } from "@/store/deviceStore";
import type { MeshNode } from "@/lib/types";
import { useMemo } from "react";

/**
 * Convenience hook to access known mesh nodes.
 *
 * Returns nodes sorted by lastHeard (most recent first).
 */
export function useNodes(): MeshNode[] {
  const nodes = useDeviceStore((s) => s.nodes);

  return useMemo(() => {
    const arr = Array.from(nodes.values());
    arr.sort((a, b) => {
      if (!a.lastHeard && !b.lastHeard) return 0;
      if (!a.lastHeard) return 1;
      if (!b.lastHeard) return -1;
      return b.lastHeard.getTime() - a.lastHeard.getTime();
    });
    return arr;
  }, [nodes]);
}

/**
 * Returns a single node by number, or undefined.
 */
export function useNode(nodeNum: number): MeshNode | undefined {
  return useDeviceStore((s) => s.nodes.get(nodeNum));
}
