import { useMemo } from "react";
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { useMessageStore } from "@/store/messageStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AlertCard } from "@/components/AlertCard";
import { PageWrapper, ContentPanel } from "@/components/PageWrapper";

import { ENV } from "@/lib/env";

export function Dispatch() {
  const alerts = useMessageStore((s) => s.alerts);
  const updateAlert = useMessageStore((s) => s.updateAlert);

  // Connect to backend for real-time alert dispatch
  const ws = useWebSocket({ url: ENV.WS_URL, enabled: true });

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
    fetch(`${ENV.API_URL}/alerts/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "acknowledged" }),
    }).catch(console.error);
  };

  const handleResolve = (id: string) => {
    updateAlert(id, { status: "resolved" });

    fetch(`${ENV.API_URL}/alerts/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    }).catch(console.error);
  };

  return (
    <PageWrapper
      title="Alert Dispatch"
      subtitle="Manage incoming emergency alerts and coordinate responses"
      icon={Bell}
      action={
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${ws.connected ? "bg-mesh" : "bg-emergency"}`}
            aria-hidden="true"
          />
          <span className="text-xs text-tertiary hidden sm:inline">
            {ws.connected ? "Live" : "Disconnected"}
          </span>
        </div>
      }
    >
      {/* Alert severity counts */}
      <div className="grid grid-cols-3 gap-5 md:gap-8 pb-4 md:pb-6">
        <SeverityBadge
          label="EMERGENCY"
          count={counts.emergency}
          tone="emergency"
        />
        <SeverityBadge
          label="URGENT"
          count={counts.urgent}
          tone="urgent"
        />
        <SeverityBadge
          label="INFO"
          count={counts.info}
          tone="info"
        />
      </div>

      {/* Active alerts */}
      <ContentPanel title={`Active Alerts (${active.length})`} icon={ShieldAlert}>
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 md:py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-mesh/10 border border-mesh/20 flex items-center justify-center text-mesh mb-3">
              <CheckCircle className="w-7 h-7" aria-hidden="true" />
            </div>
            <p className="text-lg font-semibold text-primary">No active alerts</p>
            <p className="text-sm text-tertiary mt-1 max-w-xs">
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
      </ContentPanel>

      {/* Resolved alerts history */}
      {resolved.length > 0 && (
        <ContentPanel
          title={`Resolved (${resolved.length})`}
          icon={CheckCircle}
          action={
            <span className="text-xs text-tertiary">Last 10 shown</span>
          }
        >
          <div className="space-y-2 opacity-60">
            {resolved.slice(0, 10).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </ContentPanel>
      )}
    </PageWrapper>
  );
}

function SeverityBadge({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "emergency" | "urgent" | "info";
}) {
  const toneClasses = {
    emergency: {
      wrapper: "bg-emergency/5 border-emergency/20 text-emergency",
      icon: AlertOctagon,
    },
    urgent: {
      wrapper: "bg-warn/5 border-warn/20 text-warn",
      icon: AlertTriangle,
    },
    info: {
      wrapper: "bg-info/5 border-info/20 text-info",
      icon: Info,
    },
  };

  const style = toneClasses[tone];
  const Icon = style.icon;

  return (
    <div
      className={`rounded-xl p-3 md:p-4 border text-center transition-all hover:border-strong ${style.wrapper}`}
    >
      <div className="flex items-center justify-center mb-1.5 md:mb-2">
        <Icon className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
      </div>
      <p className="text-2xl-fluid font-bold">{count}</p>
      <p className="text-xs text-current opacity-70 mt-1">{label}</p>
    </div>
  );
}
