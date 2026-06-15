"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Slide-over panel anchored to the inline-end edge. Preferred over modals for
 * detail views and create/edit forms. Entrance animation is reduced-motion
 * aware via the global media query.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClassName = "max-w-xl"
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="admin-animate-overlay absolute inset-0 bg-primary/35 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "admin-animate-drawer absolute inset-y-0 end-0 flex w-full flex-col border-s border-border bg-surface shadow-industrial outline-none",
          widthClassName
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-primary">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-steel">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-m-1 shrink-0 rounded-md p-1.5 text-steel transition hover:bg-muted hover:text-primary"
            aria-label="Close panel"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t border-border bg-background/60 p-4">{footer}</div> : null}
      </div>
    </div>
  );
}
