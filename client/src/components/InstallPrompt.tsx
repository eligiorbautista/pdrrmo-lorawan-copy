import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { LogoIcon } from "@/components/LogoIcon";

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
    <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-md p-4 rounded-xl bg-surface-2 border border-default shadow-2xl z-50 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-mesh/10 border border-mesh/20 flex items-center justify-center text-mesh p-1.5">
          <LogoIcon aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary text-sm font-medium">
            Install PDRRMO Mesh
          </p>
          <p className="text-tertiary text-xs mt-0.5">
            Install for offline access and faster loading
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          <button
            onClick={() => setDismissed(true)}
            className="touch-target-sm inline-flex items-center justify-center px-2 py-1.5 text-xs text-tertiary hover:text-primary transition-colors rounded-md"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={handleInstall}
            className="touch-target-sm inline-flex items-center gap-1.5 px-3 py-2 bg-mesh hover:bg-mesh/90 text-surface-0 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
