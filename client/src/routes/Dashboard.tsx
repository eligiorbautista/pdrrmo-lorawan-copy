import { useMemo } from "react";
import { useDeviceStore } from "@/store/deviceStore";
import { useMessageStore } from "@/store/messageStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AlertCard } from "@/components/AlertCard";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3000/api/ws";

export function Dashboard() {
  const nodes = useDeviceStore((s) => s.nodes);
  const messages = useMessageStore((s) => s.messages);
  const alerts = useMessageStore((s) => s.alerts);
  const isBtConnected = useDeviceStore((s) => s.phase === "configured");

  // Connect to backend for real-time updates
  const ws = useWebSocket({ url: WS_URL, enabled: true });

  const activeAlerts = useMemo(
    () =>
      alerts.filter(
        (a) => a.status !== "resolved" && a.status !== "failed",
      ),
    [alerts],
  );

  const recentMessages = useMemo(
    () => messages.slice(-10).reverse(),
    [messages],
  );

  const nodeCount = nodes.size;
  const onlineNodes = useMemo(
    () =>
      Array.from(nodes.values()).filter(
        (n) =>
          n.lastHeard &&
          Date.now() - n.lastHeard.getTime() < 30 * 60 * 1000,
      ).length,
    [nodes],
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Command Dashboard</h2>
          <p className="text-sm text-white/50 mt-1">
            Overview of all nodes, messages, and alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${ws.connected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-xs text-white/50">
            {ws.connected
              ? `Backend connected (${ws.clientId ?? "—"})`
              : "Backend disconnected"}
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Mesh Nodes"
          value={nodeCount}
          detail={`${onlineNodes} online`}
          icon="📡"
        />
        <StatCard
          label="Messages"
          value={messages.length}
          detail="Total"
          icon="💬"
        />
        <StatCard
          label="Active Alerts"
          value={activeAlerts.length}
          detail={activeAlerts.length > 0 ? "⚠️ Needs attention" : "All clear"}
          icon="🚨"
          danger={activeAlerts.length > 0}
        />
        <StatCard
          label="Connection"
          value={isBtConnected ? "BT" : ws.connected ? "WS" : "None"}
          detail={isBtConnected ? "Bluetooth" : ws.connected ? "WebSocket" : "Disconnected"}
          icon="🔗"
        />
      </div>

      {/* Active alerts section */}
      {activeAlerts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-red-300 uppercase tracking-wide mb-3">
            🚨 Active Alerts ({activeAlerts.length})
          </h3>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      )}

      {/* Recent messages + nodes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent messages */}
        <section>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
            Recent Messages
          </h3>
          <div className="rounded-xl bg-gray-900 border border-white/10 divide-y divide-white/10 max-h-[400px] overflow-y-auto">
            {recentMessages.length === 0 ? (
              <div className="p-4 text-center text-white/30 text-sm">
                No messages yet
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div key={msg.id} className="p-3 hover:bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">
                      {msg.direction === "sent" ? "→" : "←"}{" "}
                      {msg.from.toString(16).toUpperCase().slice(-4)}
                    </span>
                    <span className="text-xs text-white/30">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mt-1 truncate">
                    {msg.emergency && "🚨 "}
                    {msg.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Nodes overview */}
        <section>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
            Known Nodes ({nodeCount})
          </h3>
          <div className="rounded-xl bg-gray-900 border border-white/10 divide-y divide-white/10 max-h-[400px] overflow-y-auto">
            {nodeCount === 0 ? (
              <div className="p-4 text-center text-white/30 text-sm">
                No nodes discovered
              </div>
            ) : (
              Array.from(nodes.values())
                .sort((a, b) => {
                  if (!a.lastHeard) return 1;
                  if (!b.lastHeard) return -1;
                  return b.lastHeard.getTime() - a.lastHeard.getTime();
                })
                .map((node) => (
                  <div
                    key={node.nodeNum}
                    className="flex items-center gap-3 p-3 hover:bg-white/5"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        node.lastHeard &&
                        Date.now() - node.lastHeard.getTime() < 30 * 60 * 1000
                          ? "bg-green-500"
                          : "bg-gray-600"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {node.longName || node.shortName}
                      </p>
                      <p className="text-xs text-white/40">
                        {node.role}
                        {node.position &&
                          ` · ${node.position.latitude.toFixed(3)}, ${node.position.longitude.toFixed(3)}`}
                      </p>
                    </div>
                    {node.batteryLevel !== undefined && (
                      <span className="text-xs text-white/30 flex-shrink-0">
                        {node.batteryLevel}%
                      </span>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  danger = false,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        danger
          ? "bg-red-950/20 border-red-800/30"
          : "bg-gray-900 border-white/10"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${danger ? "text-red-300" : "text-white"}`}>
        {value}
      </p>
      <p className="text-xs text-white/30 mt-1">{detail}</p>
    </div>
  );
}
