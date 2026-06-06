import { create } from "zustand";

// ─── Toast Store ──────────────────────────────────────────

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({
          toasts: s.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ─── Toast Container ──────────────────────────────────────

const typeStyles = {
  success: "bg-green-900/90 border-green-600 text-green-100",
  error: "bg-red-900/90 border-red-600 text-red-100",
  warning: "bg-yellow-900/90 border-yellow-600 text-yellow-100",
  info: "bg-blue-900/90 border-blue-600 text-blue-100",
};

const typeIcons: Record<string, string> = {
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "ℹ",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur animate-in slide-in-from-right ${typeStyles[toast.type]}`}
        >
          <span className="font-bold text-lg flex-shrink-0">
            {typeIcons[toast.type]}
          </span>
          <p className="text-sm flex-1">{toast.message}</p>
          <button
            onClick={() => useToastStore.getState().removeToast(toast.id)}
            className="text-white/50 hover:text-white flex-shrink-0"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
