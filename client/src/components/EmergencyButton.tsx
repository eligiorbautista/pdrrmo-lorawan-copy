import { useState } from "react";
import { useEmergency } from "@/hooks/useEmergency";

export function EmergencyButton() {
  const { sendEmergency, cancel, sending, lastAlert, error, isReady } =
    useEmergency();
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");

  const handleInitialPress = () => {
    setConfirmed(true);
    // Play alert sound
    playAlert();
  };

  const handleCancel = () => {
    setConfirmed(false);
    setMessage("");
    stopAlert();
  };

  const handleConfirmSend = async () => {
    if (!isReady) return;
    await sendEmergency(message || undefined);
    setConfirmed(false);
    setMessage("");
    stopAlert();
  };

  const handleCancelSend = () => {
    cancel();
    stopAlert();
  };

  if (sending) {
    return (
      <div className="w-full p-6 rounded-2xl bg-red-900/60 border-2 border-red-600 animate-pulse text-center">
        <div className="text-4xl mb-3">🚨</div>
        <p className="text-red-200 text-lg font-bold mb-2">
          Sending Emergency Alert…
        </p>
        <p className="text-red-300/70 text-sm mb-4">
          Do not close this screen. Retrying if needed.
        </p>
        <button
          onClick={handleCancelSend}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/20"
        >
          Cancel Send
        </button>
      </div>
    );
  }

  if (lastAlert?.status === "acked") {
    return (
      <div className="w-full p-6 rounded-2xl bg-green-900/40 border-2 border-green-600 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-green-200 text-lg font-bold mb-1">
          Alert Acknowledged
        </p>
        <p className="text-green-300/70 text-sm">
          Command center has been notified.
          {lastAlert.ackedAt &&
            ` ${lastAlert.ackedAt.toLocaleTimeString()}`}
        </p>
      </div>
    );
  }

  if (lastAlert?.status === "failed") {
    return (
      <div className="w-full p-6 rounded-2xl bg-yellow-900/40 border-2 border-yellow-600 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-yellow-200 text-lg font-bold mb-1">
          Alert Delivery Failed
        </p>
        <p className="text-yellow-300/70 text-sm mb-1">
          {error ?? "Could not reach any node. Try moving to higher ground."}
        </p>
        <p className="text-yellow-300/50 text-xs mb-4">
          Retried {lastAlert.retryCount} time{lastAlert.retryCount !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => sendEmergency(message || undefined)}
          className="px-6 py-2 bg-yellow-600/30 hover:bg-yellow-600/50 text-white text-sm rounded-lg transition-colors border border-yellow-600/50"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="w-full p-6 rounded-2xl bg-red-900/80 border-2 border-red-500 text-center">
        <div className="text-4xl mb-3 animate-bounce">🚨</div>
        <p className="text-red-100 text-lg font-bold mb-4">
          Confirm Emergency Alert
        </p>
        <p className="text-red-200/70 text-sm mb-4">
          This will broadcast an emergency alert to ALL nodes on the mesh.
          Command center will be notified.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the emergency (optional)…"
          rows={3}
          className="w-full bg-red-950/50 text-white text-sm rounded-lg px-3 py-2 border border-red-700/50 resize-none focus:outline-none focus:border-red-400 placeholder-red-300/30 mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={handleConfirmSend}
            disabled={!isReady}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-base font-bold rounded-lg transition-colors"
          >
            SEND EMERGENCY ALERT
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/20"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Default: big red emergency button
  return (
    <button
      onClick={handleInitialPress}
      disabled={!isReady}
      className="w-full p-6 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700
        disabled:opacity-40 disabled:cursor-not-allowed
        text-white text-xl font-extrabold tracking-wide
        shadow-lg shadow-red-900/30 hover:shadow-red-800/40
        transform hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-150
        border-2 border-red-400/50 hover:border-red-300/50"
    >
      <div className="text-4xl mb-2">🚨</div>
      EMERGENCY
      <div className="text-xs font-normal mt-1 opacity-80">
        Press to send alert
      </div>
    </button>
  );
}

function playAlert() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => {
      osc.frequency.value = 440;
    }, 200);
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 600);
  } catch {
    // Audio not available, silently skip
  }
}

function stopAlert() {
  // Audio is self-stopping, no-op for cleanup
}
