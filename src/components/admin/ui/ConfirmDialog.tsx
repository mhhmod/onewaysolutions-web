"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/admin/ui/Button";

/**
 * Confirmation guard for destructive or irreversible actions.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    confirmRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[55] grid place-items-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="admin-animate-overlay absolute inset-0 bg-primary/40"
        onClick={() => (loading ? undefined : onCancel())}
        aria-hidden="true"
      />
      <div className="admin-animate-fade relative w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-industrial">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/12 text-danger">
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-primary">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-steel">{description}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
