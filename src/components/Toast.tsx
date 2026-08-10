import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, AlertTriangle, Info, XCircle, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// ─── Styling Config ───────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { border: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: { border: "border-l-emerald-500", icon: CheckCircle, iconColor: "text-emerald-400" },
  error: { border: "border-l-red-500", icon: XCircle, iconColor: "text-red-400" },
  warning: { border: "border-l-yellow-500", icon: AlertTriangle, iconColor: "text-yellow-400" },
  info: { border: "border-l-blue-500", icon: Info, iconColor: "text-blue-400" },
};

const AUTO_DISMISS_MS = 4000;
const FADE_OUT_MS = 300;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Start fade-out animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    // Actually remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, FADE_OUT_MS);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto-dismiss timer
      const timer = setTimeout(() => {
        removeToast(id);
        timersRef.current.delete(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const handleClose = useCallback(
    (id: string) => {
      // Cancel auto-dismiss timer
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
      removeToast(id);
    },
    [removeToast]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const contextValue: ToastContextValue = {
    success: (msg) => addToast("success", msg),
    error: (msg) => addToast("error", msg),
    warning: (msg) => addToast("warning", msg),
    info: (msg) => addToast("info", msg),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container — bottom-right corner */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={handleClose} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg
        bg-navy-800 border border-navy-700 border-l-4 ${config.border}
        min-w-[300px] max-w-[420px]
        ${toast.exiting ? "animate-toast-out" : "animate-toast-in"}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className="flex-1 text-sm text-slate-200 leading-snug">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
