import { useDeviceStore } from "@/store/deviceStore";

export function NodeList() {
  const nodes = useDeviceStore((s) => s.nodes);

  const nodeArray = Array.from(nodes.values()).sort((a, b) => {
    // Sort by last heard (most recent first), unknown at the end
    if (!a.lastHeard && !b.lastHeard) return 0;
    if (!a.lastHeard) return 1;
    if (!b.lastHeard) return -1;
    return b.lastHeard.getTime() - a.lastHeard.getTime();
  });

  if (nodeArray.length === 0) {
    return (
      <div className="p-4 text-center text-white/60 text-sm">
        No nodes discovered yet.
        <br />
        Nearby Meshtastic nodes will appear here once they transmit.
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10">
      {nodeArray.map((node) => (
        <div
          key={node.nodeNum}
          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
        >
          {/* Node icon */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-mesh-blue/20 flex items-center justify-center text-mesh-blue font-bold text-sm">
            {node.shortName.slice(0, 2).toUpperCase()}
          </div>

          {/* Node info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-sm truncate">
                {node.longName || node.shortName}
              </span>
              <span className="text-xs text-white/40 flex-shrink-0">
                {node.role}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
              {node.lastHeard && (
                <span>
                  {timeAgo(node.lastHeard)}
                </span>
              )}
              {node.position && (
                <span>
                  {node.position.latitude.toFixed(4)},{" "}
                  {node.position.longitude.toFixed(4)}
                </span>
              )}
              {node.batteryLevel !== undefined && (
                <span className="ml-auto">
                  {batteryIcon(node.batteryLevel)} {node.batteryLevel}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function batteryIcon(level: number): string {
  if (level > 75) return "🔋";
  if (level > 50) return "🔋";
  if (level > 25) return "🪫";
  return "⚠️";
}
