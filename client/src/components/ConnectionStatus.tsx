import { useMeshtastic } from "@/hooks/useMeshtastic";

const phaseColors: Record<string, string> = {
  idle: "bg-surface-4",
  scanning: "bg-info animate-pulse",
  connecting: "bg-warn animate-pulse",
  configuring: "bg-warn animate-pulse",
  configured: "bg-mesh",
  disconnected: "bg-surface-4",
  error: "bg-emergency",
};

export function ConnectionStatus() {
  const { phase, statusLabel, connect, disconnect, isConnected, myNodeNum } =
    useMeshtastic();

  return (
    <div className="flex items-center gap-3 px-3 py-2 md:px-4 bg-surface-2 backdrop-blur rounded-lg border border-default">
      <span
        className={`inline-block w-3 h-3 rounded-full ${phaseColors[phase] ?? "bg-surface-4"}`}
        aria-label={`Status: ${statusLabel}`}
      />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-primary truncate">
          {statusLabel}
        </span>
        {myNodeNum !== null && (
          <span className="text-xs text-tertiary">
            Node: {myNodeNum.toString(16).toUpperCase()}
          </span>
        )}
      </div>
      <button
        onClick={isConnected ? disconnect : connect}
        disabled={phase === "scanning" || phase === "connecting"}
        className={`ml-auto px-3 py-1.5 text-xs font-semibold rounded-md transition-colors touch-target-sm inline-flex items-center
          ${isConnected
            ? "bg-emergency/80 hover:bg-emergency text-white"
            : "bg-mesh hover:bg-mesh/90 text-surface-0"}
          disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isConnected ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
}
