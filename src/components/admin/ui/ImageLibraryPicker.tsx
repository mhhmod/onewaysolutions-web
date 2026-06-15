"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/admin/ui/Button";
import { TextInput } from "@/components/admin/ui/FormField";

/**
 * Modal grid for choosing an image from the already-imported catalog library.
 */
export function ImageLibraryPicker({
  images,
  onPick,
  onClose
}: {
  images: Array<{ file_path: string; alt_text: string }>;
  onPick: (item: { file_path: string; alt_text: string }) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return images;
    return images.filter((image) => image.alt_text.toLowerCase().includes(term));
  }, [images, query]);

  return (
    <div
      className="fixed inset-0 z-[55] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image library"
    >
      <div className="admin-animate-overlay absolute inset-0 bg-primary/40" onClick={onClose} aria-hidden="true" />
      <div className="admin-animate-fade relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface shadow-industrial">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <h3 className="text-base font-semibold text-primary">Choose from library</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-steel transition hover:bg-muted hover:text-primary"
            aria-label="Close library"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="border-b border-border p-3">
          <TextInput value={query} placeholder="Search images" onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
          {filtered.map((item) => (
            <button
              key={item.file_path}
              type="button"
              onClick={() => onPick(item)}
              className="group grid gap-1 rounded-md border border-border bg-white p-2 text-start transition hover:border-accent/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.file_path} alt="" className="h-24 w-full rounded object-contain" />
              <span className="truncate text-xs text-steel">{item.alt_text}</span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-steel">No images found.</p>
          ) : null}
        </div>
        <div className="flex justify-end border-t border-border p-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
