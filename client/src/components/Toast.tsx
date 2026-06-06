import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toastStore";

const typeStyles = {
  success: "bg-emerald-950/40 border-emerald-800/30 text-emerald-300",
  error: "bg-red-950/40 border-red-800/30 text-red-300",
  warning: "bg-amber-950/40 border-amber-800/30 text-amber-300",
  info: "bg-blue-950/40 border-blue-800/30 text-blue-300",
};

const typeIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = typeIcons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur animate-fade-in ${typeStyles[toast.type]}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm flex-1 text-white">{toast.message}</p>
            <button
              onClick={() => useToastStore.getState().removeToast(toast.id)}
              className="text-tertiary hover:text-primary flex-shrink-0 touch-target-sm inline-flex items-center justify-center rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
