import { useMeshtastic } from "@/hooks/useMeshtastic";

const phaseColors: Record<string, string> = {
  idle: "bg-gray-400",
  scanning: "bg-blue-400 animate-pulse",
  connecting: "bg-yellow-400 animate-pulse",
  configuring: "bg-yellow-400 animate-pulse",
  configured: "bg-green-500",
  disconnected: "bg-gray-400",
  error: "bg-red-500",
};

export function ConnectionStatus() {
  const { phase, statusLabel, connect, disconnect, isConnected, myNodeNum } =
    useMeshtastic();

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20">
      <span
        className={`inline-block w-3 h-3 rounded-full ${phaseColors[phase] ?? "bg-gray-400"}`}
        aria-label={`Status: ${statusLabel}`}
      />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-white truncate">
          {statusLabel}
        </span>
        {myNodeNum !== null && (
          <span className="text-xs text-white/60">
            Node: {myNodeNum.toString(16).toUpperCase()}
          </span>
        )}
      </div>
      <button
        onClick={isConnected ? disconnect : connect}
        disabled={phase === "scanning" || phase === "connecting"}
        className={`ml-auto px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer
          ${isConnected
            ? "bg-red-600/80 hover:bg-red-600 text-white"
            : "bg-green-600/80 hover:bg-green-600 text-white"}
          disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isConnected ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
}
