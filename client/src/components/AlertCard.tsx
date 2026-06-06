import { AlertOctagon, AlertTriangle, Info, MapPin } from "lucide-react";
import type { EmergencyAlert } from "@/lib/types";

const severityStyles = {
  EMERGENCY:
    "border-emergency/30 bg-emergency/5 text-emergency-light",
  URGENT:
    "border-warn/30 bg-warn/5 text-warn-light",
  INFO:
    "border-info/30 bg-info/5 text-info-light",
} as const;

const severityIcons = {
  EMERGENCY: AlertOctagon,
  URGENT: AlertTriangle,
  INFO: Info,
} as const;

const severityLabels = {
  EMERGENCY: "EMERGENCY",
  URGENT: "URGENT",
  INFO: "INFO",
} as const;

const statusLabels: Record<string, string> = {
  sent: "Sent",
  acked: "Acknowledged",
  failed: "Failed",
  received: "Received",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

const statusColors: Record<string, string> = {
  sent: "text-warn",
  acked: "text-mesh",
  failed: "text-emergency",
  received: "text-warn",
  acknowledged: "text-mesh",
  resolved: "text-info",
};

interface AlertCardProps {
  alert: EmergencyAlert;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
}: AlertCardProps) {
  const style =
    severityStyles[alert.payload.severity] ?? severityStyles.INFO;
  const label =
    severityLabels[alert.payload.severity] ?? alert.payload.severity;
  const SeverityIcon =
    severityIcons[alert.payload.severity] ?? Info;

  return (
    <div
      className={`rounded-xl border p-4 md:p-5 ${style} transition-all duration-200 hover:border-strong`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Severity badge + status */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold">
              <SeverityIcon className="w-4 h-4" aria-hidden="true" />
              {label}
            </span>
            <span
              className={`text-xs ${statusColors[alert.status] ?? "text-tertiary"}`}
            >
              {statusLabels[alert.status] ?? alert.status}
            </span>
            {alert.retryCount > 0 && (
              <span className="text-xs text-tertiary">
                Retried {alert.retryCount}x
              </span>
            )}
          </div>

          {/* Node info */}
          <p className="text-sm text-primary/80 mb-1">
            From: {alert.payload.nodeName} ({alert.payload.nodeId})
          </p>

          {/* Location */}
          {alert.payload.gps && (
            <p className="text-xs text-tertiary mb-1 inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {alert.payload.gps.lat.toFixed(4)},{" "}
              {alert.payload.gps.lng.toFixed(4)}
            </p>
          )}

          {/* Message */}
          {alert.payload.message && (
            <p className="text-sm text-primary/90 mt-2 whitespace-pre-wrap">
              {alert.payload.message}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-tertiary mt-2">
            {alert.createdAt.toLocaleString()}
          </p>
        </div>

        {/* Actions for dispatch */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {onAcknowledge && alert.status === "received" && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="touch-target-sm px-3 py-2 bg-mesh/15 hover:bg-mesh/25 text-mesh text-xs font-semibold rounded-lg transition-colors border border-mesh/20"
            >
              Acknowledge
            </button>
          )}
          {onResolve &&
            (alert.status === "acknowledged" || alert.status === "acked") && (
              <button
                onClick={() => onResolve(alert.id)}
                className="touch-target-sm px-3 py-2 bg-info/15 hover:bg-info/25 text-info text-xs font-semibold rounded-lg transition-colors border border-info/20"
              >
                Resolve
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
