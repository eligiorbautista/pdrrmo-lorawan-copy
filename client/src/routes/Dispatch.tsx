import { useMemo } from "react";
import { useMessageStore } from "@/store/messageStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AlertCard } from "@/components/AlertCard";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3000/api/ws";

export function Dispatch() {
  const alerts = useMessageStore((s) => s.alerts);
  const updateAlert = useMessageStore((s) => s.updateAlert);

  // Connect to backend for real-time alert dispatch
  const ws = useWebSocket({ url: WS_URL, enabled: true });

  const active = useMemo(
    () => alerts.filter((a) => a.status !== "resolved"),
    [alerts],
  );

  const resolved = useMemo(
    () => alerts.filter((a) => a.status === "resolved"),
    [alerts],
  );

  const counts = useMemo(
    () => ({
      emergency: alerts.filter(
        (a) =>
          a.payload.severity === "EMERGENCY" && a.status !== "resolved",
      ).length,
      urgent: alerts.filter(
        (a) =>
          a.payload.severity === "URGENT" && a.status !== "resolved",
      ).length,
      info: alerts.filter(
        (a) =>
          a.payload.severity === "INFO" && a.status !== "resolved",
      ).length,
    }),
    [alerts],
  );

  const handleAcknowledge = (id: string) => {
    updateAlert(id, { status: "acked" });

    // Notify backend via fetch
    fetch(`${WS_URL.replace("/api/ws", "/api/alerts")}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "acknowledged" }),
    }).catch(console.error);
  };

  const handleResolve = (id: string) => {
    updateAlert(id, { status: "resolved" });

    fetch(`${WS_URL.replace("/api/ws", "/api/alerts")}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    }).catch(console.error);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Alert Dispatch</h2>
          <p className="text-sm text-white/50 mt-1">
            Manage incoming emergency alerts and coordinate responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${ws.connected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-xs text-white/50">
            {ws.connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Alert severity counts */}
      <div className="grid grid-cols-3 gap-3">
        <SeverityBadge
          label="EMERGENCY"
          count={counts.emergency}
          color="red"
        />
        <SeverityBadge label="URGENT" count={counts.urgent} color="orange" />
        <SeverityBadge label="INFO" count={counts.info} color="blue" />
      </div>

      {/* Active alerts */}
      <section>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Active Alerts ({active.length})
        </h3>
        {active.length === 0 ? (
          <div className="rounded-xl bg-gray-900 border border-white/10 p-8 text-center text-white/30">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-lg">No active alerts</p>
            <p className="text-sm mt-1">
              All clear — no emergencies to respond to.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {active
              .sort(
                (a, b) =>
                  b.createdAt.getTime() - a.createdAt.getTime(),
              )
              .map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                />
              ))}
          </div>
        )}
      </section>

      {/* Resolved alerts history */}
      {resolved.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wide mb-3">
            Resolved ({resolved.length})
          </h3>
          <div className="space-y-2 opacity-50">
            {resolved.slice(0, 10).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SeverityBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "red" | "orange" | "blue";
}) {
  const colorMap = {
    red: "bg-red-950/30 border-red-800/30 text-red-300",
    orange: "bg-orange-950/30 border-orange-800/30 text-orange-300",
    blue: "bg-blue-950/30 border-blue-800/30 text-blue-300",
  };

  const icons = {
    red: "🚨",
    orange: "⚠️",
    blue: "ℹ️",
  };

  return (
    <div
      className={`rounded-xl p-3 border text-center ${colorMap[color]}`}
    >
      <div className="text-xl mb-1">{icons[color]}</div>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs opacity-70 mt-1">{label}</p>
    </div>
  );
}
