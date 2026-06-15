"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; tone: ToastTone; message: string };
type ToastApi = { notify: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastApi | null>(null);

const toneConfig: Record<ToastTone, { icon: typeof Info; ring: string; iconClass: string }> = {
  success: { icon: CheckCircle2, ring: "border-success/30", iconClass: "text-success" },
  error: { icon: AlertTriangle, ring: "border-danger/30", iconClass: "text-danger" },
  info: { icon: Info, ring: "border-border", iconClass: "text-accent" }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = idRef.current + 1;
      idRef.current = id;
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
        role="region"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const { icon: Icon, ring, iconClass } = toneConfig[toast.tone];
          return (
            <div
              key={toast.id}
              className={cn(
                "admin-animate-fade pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-surface p-3 shadow-industrial",
                ring
              )}
            >
              <Icon className={cn("mt-0.5 shrink-0", iconClass)} size={18} aria-hidden="true" />
              <p className="flex-1 text-sm font-medium leading-6 text-primary">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-m-1 rounded-md p-1 text-steel transition hover:bg-muted hover:text-primary"
                aria-label="Dismiss notification"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
