import { useMemo, useState } from "react";
import {
  Radio,
  MessageSquare,
  Bell,
  Link,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { LogoIcon } from "@/components/LogoIcon";
import { useDeviceStore } from "@/store/deviceStore";
import { useMessageStore } from "@/store/messageStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AlertCard } from "@/components/AlertCard";
import { PageWrapper, StatCard, ContentPanel } from "@/components/PageWrapper";

import { ENV } from "@/lib/env";

export function Dashboard() {
  const nodes = useDeviceStore((s) => s.nodes);
  const messages = useMessageStore((s) => s.messages);
  const alerts = useMessageStore((s) => s.alerts);
  const isBtConnected = useDeviceStore((s) => s.phase === "configured");

  // Connect to backend for real-time updates
  const ws = useWebSocket({ url: ENV.WS_URL, enabled: true });

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

  const [now] = useState(() => Date.now());

  const nodeCount = nodes.size;
  const onlineNodes = useMemo(
    () =>
      Array.from(nodes.values()).filter(
        (n) =>
          n.lastHeard &&
          now - n.lastHeard.getTime() < 30 * 60 * 1000,
      ).length,
    [nodes, now],
  );

  return (
    <PageWrapper
      title="Command Dashboard"
      subtitle="Overview of all nodes, messages, and alerts"
      icon={LogoIcon}
      action={
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${ws.connected ? "bg-mesh" : "bg-emergency"}`}
            aria-hidden="true"
          />
          <span className="text-xs text-tertiary hidden sm:inline">
            {ws.connected
              ? `Backend connected (${ws.clientId ?? "—"})`
              : "Backend disconnected"}
          </span>
        </div>
      }
    >
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8 pb-4 md:pb-6">
        <StatCard
          label="Mesh Nodes"
          value={nodeCount}
          detail={`${onlineNodes} online`}
      icon={LogoIcon}
          tone="mesh"
        />
        <StatCard
          label="Messages"
          value={messages.length}
          detail="Total"
          icon={MessageSquare}
          tone="info"
        />
        <StatCard
          label="Active Alerts"
          value={activeAlerts.length}
          detail={activeAlerts.length > 0 ? "Needs attention" : "All clear"}
          icon={Bell}
          tone={activeAlerts.length > 0 ? "emergency" : "neutral"}
        />
        <StatCard
          label="Connection"
          value={isBtConnected ? "BT" : ws.connected ? "WS" : "None"}
          detail={isBtConnected ? "Bluetooth" : ws.connected ? "WebSocket" : "Disconnected"}
          icon={Link}
          tone={isBtConnected || ws.connected ? "mesh" : "warn"}
        />
      </div>

      {/* Active alerts section */}
      {activeAlerts.length > 0 && (
        <ContentPanel
          title={`Active Alerts (${activeAlerts.length})`}
          icon={AlertTriangle}
        >
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </ContentPanel>
      )}

      {/* Recent messages + nodes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Recent messages */}
        <ContentPanel title="Recent Messages" icon={MessageSquare}>
          <div className="rounded-xl bg-surface-1 border border-default divide-y divide-subtle max-h-[400px] overflow-y-auto">
            {recentMessages.length === 0 ? (
              <div className="p-4 text-center text-tertiary text-sm">
                No messages yet
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div key={msg.id} className="p-3 hover:bg-surface-1/80 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-tertiary flex items-center gap-1">
                      {msg.direction === "sent" ? (
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      ) : (
                        <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                      )}
                      {msg.from.toString(16).toUpperCase().slice(-4)}
                    </span>
                    <span className="text-xs text-disabled">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-primary mt-1 truncate">
                    {msg.emergency && (
                      <AlertTriangle className="w-3.5 h-3.5 inline text-emergency mr-1" aria-hidden="true" />
                    )}
                    {msg.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </ContentPanel>

        {/* Nodes overview */}
        <ContentPanel title={`Known Nodes (${nodeCount})`} icon={Radio}>
          <div className="rounded-xl bg-surface-1 border border-default divide-y divide-subtle max-h-[400px] overflow-y-auto">
            {nodeCount === 0 ? (
              <div className="p-4 text-center text-tertiary text-sm">
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
                    className="flex items-center gap-3 p-3 hover:bg-surface-1/80 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        node.lastHeard &&
                        now - node.lastHeard.getTime() < 30 * 60 * 1000
                          ? "bg-mesh"
                          : "bg-surface-4"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary font-medium truncate">
                        {node.longName || node.shortName}
                      </p>
                      <p className="text-xs text-tertiary">
                        {node.role}
                        {node.position && (
                          <>
                            {" · "}
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" aria-hidden="true" />
                              {node.position.latitude.toFixed(3)}, {node.position.longitude.toFixed(3)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    {node.batteryLevel !== undefined && (
                      <span className="text-xs text-tertiary flex-shrink-0">
                        {node.batteryLevel}%
                      </span>
                    )}
                  </div>
                ))
            )}
          </div>
        </ContentPanel>
      </div>
    </PageWrapper>
  );
}
