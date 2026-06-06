import type { EmergencyAlert } from "@/lib/types";

const severityStyles = {
  EMERGENCY:
    "border-red-600 bg-red-950/40 text-red-200",
  URGENT:
    "border-orange-500 bg-orange-950/30 text-orange-200",
  INFO:
    "border-blue-500 bg-blue-950/30 text-blue-200",
} as const;

const severityLabels = {
  EMERGENCY: "🚨 EMERGENCY",
  URGENT: "⚠️ URGENT",
  INFO: "ℹ️ INFO",
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
  sent: "text-yellow-400",
  acked: "text-green-400",
  failed: "text-red-400",
  received: "text-yellow-400",
  acknowledged: "text-green-400",
  resolved: "text-blue-400",
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

  return (
    <div
      className={`rounded-xl border-2 p-4 ${style} transition-all`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Severity badge + status */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold">{label}</span>
            <span
              className={`text-xs ${statusColors[alert.status] ?? "text-white/50"}`}
            >
              {statusLabels[alert.status] ?? alert.status}
            </span>
            {alert.retryCount > 0 && (
              <span className="text-xs text-white/30">
                Retried {alert.retryCount}x
              </span>
            )}
          </div>

          {/* Node info */}
          <p className="text-sm opacity-80 mb-1">
            From: {alert.payload.nodeName} ({alert.payload.nodeId})
          </p>

          {/* Location */}
          {alert.payload.gps && (
            <p className="text-xs opacity-60 mb-1">
              📍 {alert.payload.gps.lat.toFixed(4)},{" "}
              {alert.payload.gps.lng.toFixed(4)}
            </p>
          )}

          {/* Message */}
          {alert.payload.message && (
            <p className="text-sm mt-2 opacity-90 whitespace-pre-wrap">
              {alert.payload.message}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs opacity-40 mt-2">
            {alert.createdAt.toLocaleString()}
          </p>
        </div>

        {/* Actions for dispatch */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {onAcknowledge && alert.status === "received" && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1.5 bg-green-700/60 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Acknowledge
            </button>
          )}
          {onResolve &&
            (alert.status === "acknowledged" || alert.status === "acked") && (
              <button
                onClick={() => onResolve(alert.id)}
                className="px-3 py-1.5 bg-blue-700/60 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Resolve
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
