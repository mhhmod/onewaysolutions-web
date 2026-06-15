"use client";

import { useRef, useState } from "react";
import { ImagePlus, Library, Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui/Button";
import { ImageLibraryPicker } from "@/components/admin/ui/ImageLibraryPicker";

export type SingleImageValue = {
  file_path: string;
  bucket_id: string;
  file?: File;
  previewUrl?: string;
} | null;

export function SingleImageField({
  value,
  existingImages,
  bucket,
  onChange
}: {
  value: SingleImageValue;
  existingImages: Array<{ file_path: string; alt_text: string }>;
  bucket: string;
  onChange: (value: SingleImageValue) => void;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange({ file_path: "", bucket_id: bucket, file, previewUrl: URL.createObjectURL(file) });
  }

  function clear() {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
  }

  const preview = value?.previewUrl ?? value?.file_path ?? "";

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-white text-steel">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={18} aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={15} aria-hidden="true" />
            Upload
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setLibraryOpen(true)}>
            <Library size={15} aria-hidden="true" />
            Library
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <Trash2 size={15} aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files);
          event.target.value = "";
        }}
      />
      {libraryOpen ? (
        <ImageLibraryPicker
          images={existingImages}
          onPick={(item) => {
            onChange({ file_path: item.file_path, bucket_id: "local-public" });
            setLibraryOpen(false);
          }}
          onClose={() => setLibraryOpen(false)}
        />
      ) : null}
    </div>
  );
}
