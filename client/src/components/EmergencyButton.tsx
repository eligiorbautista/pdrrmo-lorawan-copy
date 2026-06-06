import { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Loader,
  Siren,
} from "lucide-react";
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
      <div className="w-full p-6 md:p-8 rounded-2xl bg-emergency/10 border-2 border-emergency/30 animate-pulse text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-emergency/10 border border-emergency/20 flex items-center justify-center text-emergency mb-4">
          <Loader className="w-7 h-7 animate-spin" aria-hidden="true" />
        </div>
        <p className="text-emergency-light text-lg font-bold mb-2">
          Sending Emergency Alert
        </p>
        <p className="text-emergency/70 text-sm mb-5">
          Do not close this screen. Retrying if needed.
        </p>
        <button
          onClick={handleCancelSend}
          className="touch-target-sm px-6 py-2.5 bg-surface-2 hover:bg-surface-3 text-primary text-sm rounded-lg transition-colors border border-default"
        >
          Cancel Send
        </button>
      </div>
    );
  }

  if (lastAlert?.status === "acked") {
    return (
      <div className="w-full p-6 md:p-8 rounded-2xl bg-mesh/5 border-2 border-mesh/30 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-mesh/10 border border-mesh/20 flex items-center justify-center text-mesh mb-3">
          <CheckCircle className="w-7 h-7" aria-hidden="true" />
        </div>
        <p className="text-mesh-light text-lg font-bold mb-1">
          Alert Acknowledged
        </p>
        <p className="text-mesh/70 text-sm">
          Command center has been notified.
          {lastAlert.ackedAt &&
            ` ${lastAlert.ackedAt.toLocaleTimeString()}`}
        </p>
      </div>
    );
  }

  if (lastAlert?.status === "failed") {
    return (
      <div className="w-full p-6 md:p-8 rounded-2xl bg-warn/5 border-2 border-warn/30 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-warn/10 border border-warn/20 flex items-center justify-center text-warn mb-3">
          <AlertTriangle className="w-7 h-7" aria-hidden="true" />
        </div>
        <p className="text-warn-light text-lg font-bold mb-1">
          Alert Delivery Failed
        </p>
        <p className="text-warn/70 text-sm mb-1">
          {error ?? "Could not reach any node. Try moving to higher ground."}
        </p>
        <p className="text-warn/50 text-xs mb-5">
          Retried {lastAlert.retryCount} time{lastAlert.retryCount !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => sendEmergency(message || undefined)}
          className="touch-target-sm px-6 py-2.5 bg-warn/10 hover:bg-warn/20 text-warn text-sm rounded-lg transition-colors border border-warn/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="w-full p-6 md:p-8 rounded-2xl bg-emergency/10 border-2 border-emergency/30 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-emergency/10 border border-emergency/20 flex items-center justify-center text-emergency mb-3 animate-bounce">
          <Siren className="w-7 h-7" aria-hidden="true" />
        </div>
        <p className="text-emergency-light text-lg font-bold mb-4">
          Confirm Emergency Alert
        </p>
        <p className="text-emergency/70 text-sm mb-5 max-w-md mx-auto">
          This will broadcast an emergency alert to ALL nodes on the mesh.
          Command center will be notified.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the emergency (optional)…"
          rows={3}
          className="w-full bg-emergency/5 text-primary text-sm rounded-lg px-3 py-2.5 border border-emergency/20 resize-none focus:outline-none focus:border-emergency/50 placeholder:text-emergency/30 mb-5 transition-all"
        />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleConfirmSend}
            disabled={!isReady}
            className="touch-target inline-flex items-center justify-center gap-2 px-6 py-3 bg-emergency hover:bg-emergency/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-bold rounded-lg transition-colors shadow-glow-emergency"
          >
            <Siren className="w-5 h-5" aria-hidden="true" />
            SEND EMERGENCY ALERT
          </button>
          <button
            onClick={handleCancel}
            className="touch-target inline-flex items-center justify-center px-6 py-3 bg-surface-2 hover:bg-surface-3 text-primary text-sm rounded-lg transition-colors border border-default"
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
      className="w-full touch-target p-5 md:p-6 rounded-2xl bg-emergency hover:bg-emergency/90 active:bg-emergency/80
        disabled:opacity-40 disabled:cursor-not-allowed
        text-white text-xl-fluid font-extrabold tracking-wide
        shadow-lg shadow-emergency/20 hover:shadow-emergency/30
        transform hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-150
        border-2 border-emergency-light/30 hover:border-emergency-light/50
        inline-flex flex-col items-center justify-center gap-2"
      aria-label="Send emergency alert"
    >
      <Siren className="w-10 h-10 md:w-12 md:h-12" aria-hidden="true" />
      <span>EMERGENCY</span>
      <span className="text-xs md:text-sm font-normal opacity-80">
        Press to send alert
      </span>
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
