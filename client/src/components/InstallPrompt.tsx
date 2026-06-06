import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Listens for the `beforeinstallprompt` event and shows an
 * install button when the PWA is installable.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const handleInstall = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
    }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-md p-4 rounded-xl bg-gray-900 border border-white/20 shadow-2xl z-50">
      <div className="flex items-center gap-3">
        <div className="text-2xl flex-shrink-0">📡</div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">
            Install PDRRMO Mesh
          </p>
          <p className="text-white/50 text-xs mt-0.5">
            Install for offline access and faster loading
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 bg-mesh-green hover:bg-mesh-green/80 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
