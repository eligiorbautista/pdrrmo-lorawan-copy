import { useMemo, useState } from "react";
import {
  Shield,
  Activity,
  WifiOff,
  Clock,
  Server,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  ChevronRight,
} from "lucide-react";
import { PageWrapper, ContentPanel } from "@/components/PageWrapper";
import { useDeviceStore } from "@/store/deviceStore";
import { useMessageStore } from "@/store/messageStore";
import { useWebSocket } from "@/hooks/useWebSocket";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3000/api/ws";

export function System() {
  const nodes = useDeviceStore((s) => s.nodes);
  const messages = useMessageStore((s) => s.messages);
  const alerts = useMessageStore((s) => s.alerts);
  const ws = useWebSocket({ url: WS_URL, enabled: true });

  const [baseTime] = useState(() => Date.now());

  /* Fake audit log entries derived from real data */
  const auditEntries = useMemo(() => {
    const entries = [
      {
        id: "sys-1",
        ts: new Date(baseTime - 1000 * 60 * 2),
        level: "info" as const,
        source: "WebSocket",
        message: ws.connected
          ? `Backend connected (${ws.clientId ?? "—"})`
          : "Backend disconnected — retrying",
      },
      {
        id: "sys-2",
        ts: new Date(baseTime - 1000 * 60 * 15),
        level: "info" as const,
        source: "Mesh",
        message: `Node registry updated: ${nodes.size} nodes known`,
      },
      {
        id: "sys-3",
        ts: new Date(baseTime - 1000 * 60 * 45),
        level: alerts.length > 0 ? "warn" : "info" as const,
        source: "Alerts",
        message: `${alerts.filter((a) => a.status !== "resolved").length} active alerts, ${alerts.filter((a) => a.status === "resolved").length} resolved`,
      },
      {
        id: "sys-4",
        ts: new Date(baseTime - 1000 * 60 * 60 * 2),
        level: "info" as const,
        source: "Messages",
        message: `Message store contains ${messages.length} entries`,
      },
      {
        id: "sys-5",
        ts: new Date(baseTime - 1000 * 60 * 60 * 4),
        level: "info" as const,
        source: "System",
        message: "Application build: v0.0.0 — PWA install prompt registered",
      },
    ];
    return entries.sort((a, b) => b.ts.getTime() - a.ts.getTime());
  }, [baseTime, ws.connected, ws.clientId, nodes.size, alerts, messages.length]);

  const systemHealth = useMemo(() => {
    const checks = [
      {
        label: "Backend WebSocket",
        status: ws.connected ? ("pass" as const) : ("fail" as const),
        detail: ws.connected ? `Connected (${ws.clientId ?? "—"})` : "Disconnected",
      },
      {
        label: "Mesh Node Registry",
        status: nodes.size > 0 ? ("pass" as const) : ("warn" as const),
        detail: `${nodes.size} nodes registered`,
      },
      {
        label: "Message Store",
        status: "pass" as const,
        detail: `${messages.length} messages stored`,
      },
      {
        label: "Alert Pipeline",
        status:
          alerts.filter((a) => a.status === "failed").length > 0
            ? ("warn" as const)
            : ("pass" as const),
        detail: `${alerts.length} total alerts processed`,
      },
    ];
    return checks;
  }, [ws, nodes, messages, alerts]);

  return (
    <PageWrapper
      title="System Logs"
      subtitle="Audit trails, connection history, and administrative system overview"
      icon={Shield}
    >
      <div className="space-y-4 md:space-y-5">
        {/* System Health Overview */}
        <ContentPanel title="System Health" icon={Activity}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {systemHealth.map((check) => (
              <div
                key={check.label}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  check.status === "pass"
                    ? "bg-mesh/5 border-mesh/20"
                    : check.status === "warn"
                    ? "bg-warn/5 border-warn/20"
                    : "bg-emergency/5 border-emergency/20"
                }`}
              >
                <div className="flex-shrink-0">
                  {check.status === "pass" ? (
                    <CheckCircle className="w-5 h-5 text-mesh" aria-hidden="true" />
                  ) : check.status === "warn" ? (
                    <AlertTriangle className="w-5 h-5 text-warn" aria-hidden="true" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-emergency" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{check.label}</p>
                  <p className="text-xs text-tertiary">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </ContentPanel>

        {/* Resource Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <MetricCard
            icon={Server}
            label="Nodes Registered"
            value={nodes.size}
            tone="mesh"
          />
          <MetricCard
            icon={HardDrive}
            label="Messages Stored"
            value={messages.length}
            tone="info"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Active Alerts"
            value={alerts.filter((a) => a.status !== "resolved").length}
            tone={alerts.filter((a) => a.status !== "resolved").length > 0 ? "emergency" : "neutral"}
          />
        </div>

        {/* Audit Log */}
        <ContentPanel
          title="Audit Trail"
          icon={Clock}
          action={
            <span className="text-xs text-tertiary">
              {auditEntries.length} entries
            </span>
          }
        >
          <div className="space-y-1">
            {auditEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-1 transition-colors border border-transparent hover:border-subtle"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {entry.level === "warn" ? (
                    <AlertTriangle className="w-4 h-4 text-warn" aria-hidden="true" />
                  ) : entry.level === "error" ? (
                    <WifiOff className="w-4 h-4 text-emergency" aria-hidden="true" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-mesh" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <p className="text-sm text-primary">{entry.message}</p>
                    <span className="hidden sm:inline text-tertiary">·</span>
                    <span className="text-xs text-tertiary whitespace-nowrap">
                      {entry.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-tertiary mt-0.5">Source: {entry.source}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-tertiary flex-shrink-0 hidden sm:block" aria-hidden="true" />
              </div>
            ))}
          </div>
        </ContentPanel>
      </div>
    </PageWrapper>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "neutral" | "mesh" | "emergency" | "warn" | "info";
}) {
  const toneClasses = {
    neutral: "text-primary",
    mesh: "text-mesh",
    emergency: "text-emergency",
    warn: "text-warn",
    info: "text-blue-400",
  };

  return (
    <div className="panel-default p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-tertiary uppercase tracking-wider">{label}</span>
        <Icon className={`w-5 h-5 ${toneClasses[tone]}`} aria-hidden="true" />
      </div>
      <p className={`text-2xl-fluid font-bold ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}
