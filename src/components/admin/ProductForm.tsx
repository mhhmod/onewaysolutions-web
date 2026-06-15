"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Library, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { Button } from "@/components/admin/ui/Button";
import { Drawer } from "@/components/admin/ui/Drawer";
import { ImageLibraryPicker } from "@/components/admin/ui/ImageLibraryPicker";
import { Field, SelectInput, TextArea, TextInput } from "@/components/admin/ui/FormField";
import { useToast } from "@/components/admin/ui/Toast";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/slugify";
import { revalidateCatalog } from "@/lib/admin/revalidate";
import {
  loadProductDetail,
  saveProduct,
  type AdminBrand,
  type AdminCategory,
  type AdminImageInput,
  type AdminSpecInput
} from "@/lib/admin/products";

type FormImage = AdminImageInput & { uid: string };
type FormSpec = AdminSpecInput & { uid: string };

type ProductFormProps = {
  open: boolean;
  productId: string | null;
  categories: AdminCategory[];
  brands: AdminBrand[];
  existingImages: Array<{ file_path: string; alt_text: string }>;
  onClose: () => void;
  onSaved: () => void;
};

const emptyState = {
  name: "",
  slug: "",
  summary: "",
  description: "",
  model: "",
  sku: "",
  categoryId: "",
  brandId: "",
  isPublished: true,
  isFeatured: false
};

export function ProductForm({
  open,
  productId,
  categories,
  brands,
  existingImages,
  onClose,
  onSaved
}: ProductFormProps) {
  const { notify } = useToast();
  const uidRef = useRef(0);
  const nextUid = () => {
    uidRef.current += 1;
    return `f${uidRef.current}`;
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyState);
  const [slugTouched, setSlugTouched] = useState(false);
  const [images, setImages] = useState<FormImage[]>([]);
  const [specs, setSpecs] = useState<FormSpec[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(productId);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setLibraryOpen(false);

    if (!productId) {
      setForm(emptyState);
      setSlugTouched(false);
      setImages((current) => {
        current.forEach((image) => {
          if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
        });
        return [];
      });
      setSpecs([]);
      return;
    }

    let active = true;
    setLoading(true);
    loadProductDetail(productId)
      .then((detail) => {
        if (!active) return;
        setForm({
          name: detail.name,
          slug: detail.slug,
          summary: detail.summary ?? "",
          description: detail.description ?? "",
          model: detail.model ?? "",
          sku: detail.sku ?? "",
          categoryId: detail.category_id ?? "",
          brandId: detail.brand_id ?? "",
          isPublished: detail.is_published,
          isFeatured: detail.is_featured
        });
        setSlugTouched(true);
        setImages((current) => {
          current.forEach((image) => {
            if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
          });
          return detail.images.map((image) => ({ ...image, uid: nextUid() }));
        });
        setSpecs(detail.specs.map((spec) => ({ ...spec, uid: nextUid() })));
      })
      .catch(() => {
        if (active) notify("We could not open this product. Please try again.", "error");
        onClose();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId]);

  // Revoke object URLs created for upload previews when the form unmounts.
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categorySlug = useMemo(
    () => categories.find((category) => category.id === form.categoryId)?.slug ?? null,
    [categories, form.categoryId]
  );

  function update<K extends keyof typeof emptyState>(key: K, value: (typeof emptyState)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(value: string) {
    update("name", value);
    if (!slugTouched) {
      setForm((current) => ({ ...current, name: value, slug: slugify(value) }));
    }
  }

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const additions: FormImage[] = Array.from(files).map((file) => ({
      uid: nextUid(),
      bucket_id: "product-images",
      file_path: "",
      alt_text: "",
      is_primary: false,
      sort_order: 0,
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setImages((current) => {
      const next = [...current, ...additions];
      if (!next.some((image) => image.is_primary) && next.length > 0) {
        next[0] = { ...next[0], is_primary: true };
      }
      return next;
    });
  }

  function addFromLibrary(item: { file_path: string; alt_text: string }) {
    setImages((current) => {
      if (current.some((image) => image.file_path === item.file_path && !image.file)) {
        return current;
      }
      const next = [
        ...current,
        {
          uid: nextUid(),
          bucket_id: "local-public",
          file_path: item.file_path,
          alt_text: item.alt_text ?? "",
          is_primary: false,
          sort_order: 0
        }
      ];
      if (!next.some((image) => image.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return next;
    });
  }

  function removeImage(uid: string) {
    setImages((current) => {
      const target = current.find((image) => image.uid === uid);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = current.filter((image) => image.uid !== uid);
      if (next.length > 0 && !next.some((image) => image.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return next;
    });
  }

  function setPrimary(uid: string) {
    setImages((current) => current.map((image) => ({ ...image, is_primary: image.uid === uid })));
  }

  function setAlt(uid: string, alt: string) {
    setImages((current) => current.map((image) => (image.uid === uid ? { ...image, alt_text: alt } : image)));
  }

  function addSpec() {
    setSpecs((current) => [...current, { uid: nextUid(), label: "", value: "", unit: "" }]);
  }

  function updateSpec(uid: string, key: "label" | "value" | "unit", value: string) {
    setSpecs((current) => current.map((spec) => (spec.uid === uid ? { ...spec, [key]: value } : spec)));
  }

  function removeSpec(uid: string) {
    setSpecs((current) => current.filter((spec) => spec.uid !== uid));
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Enter a product name.";
    if (!form.slug.trim()) nextErrors.slug = "A web address is required.";
    if (!form.categoryId) nextErrors.categoryId = "Choose a category.";
    if (images.some((image) => !image.alt_text.trim())) {
      nextErrors.images = "Add a short description to every image.";
    }
    if (form.isPublished && images.length === 0) {
      nextErrors.images = "Add at least one image before publishing.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!hasSupabaseConfig || !validate()) {
      return;
    }
    setSaving(true);
    try {
      const { slug } = await saveProduct({
        id: productId ?? undefined,
        name: form.name,
        slug: form.slug,
        summary: form.summary,
        description: form.description,
        model: form.model,
        sku: form.sku,
        categoryId: form.categoryId || null,
        brandId: form.brandId || null,
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
        sortOrder: 0,
        images,
        specs
      });

      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (data.session?.access_token) {
        await revalidateCatalog(data.session.access_token, {
          categorySlug: categorySlug ?? undefined,
          productSlug: slug
        });
      }

      notify(isEditing ? "Product updated." : "Product added.", "success");
      onSaved();
      onClose();
    } catch (error) {
      notify(error instanceof Error ? error.message : "We could not save your changes.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={isEditing ? "Edit product" : "Add product"}
      description={isEditing ? form.name : "Create a catalog product and publish it to the website."}
      widthClassName="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEditing ? "Save changes" : "Add product"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="grid place-items-center py-20 text-steel">
          <Loader2 className="animate-spin" size={22} aria-hidden="true" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Field label="Product name" htmlFor="product-name" required error={errors.name}>
            <TextInput
              id="product-name"
              value={form.name}
              invalid={Boolean(errors.name)}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Distribution panel 24-way"
            />
          </Field>

          <Field
            label="Web address"
            htmlFor="product-slug"
            required
            hint="Used in the public link. Auto-filled from the name."
            error={errors.slug}
          >
            <TextInput
              id="product-slug"
              value={form.slug}
              invalid={Boolean(errors.slug)}
              onChange={(event) => {
                setSlugTouched(true);
                update("slug", slugify(event.target.value));
              }}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Category" htmlFor="product-category" required error={errors.categoryId}>
              <SelectInput
                id="product-category"
                value={form.categoryId}
                invalid={Boolean(errors.categoryId)}
                onChange={(event) => update("categoryId", event.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Brand" htmlFor="product-brand" hint="Optional.">
              <SelectInput
                id="product-brand"
                value={form.brandId}
                onChange={(event) => update("brandId", event.target.value)}
              >
                <option value="">No brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <Field label="Summary" htmlFor="product-summary" hint="Short line shown on product cards.">
            <TextArea
              id="product-summary"
              rows={2}
              value={form.summary}
              onChange={(event) => update("summary", event.target.value)}
            />
          </Field>

          <Field label="Description" htmlFor="product-description" hint="Longer detail shown on the product page.">
            <TextArea
              id="product-description"
              rows={4}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Model" htmlFor="product-model" hint="Optional.">
              <TextInput
                id="product-model"
                value={form.model}
                onChange={(event) => update("model", event.target.value)}
              />
            </Field>
            <Field label="Reference code" htmlFor="product-sku" hint="Optional.">
              <TextInput id="product-sku" value={form.sku} onChange={(event) => update("sku", event.target.value)} />
            </Field>
          </div>

          {/* Images */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-primary">Images</p>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus size={15} aria-hidden="true" />
                  Upload
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setLibraryOpen(true)}>
                  <Library size={15} aria-hidden="true" />
                  Library
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            {errors.images ? <p className="text-xs font-medium text-danger">{errors.images}</p> : null}

            {images.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-background/60 p-6 text-center text-sm text-steel">
                Upload images or choose from the existing library. The first image is used as the main photo.
              </div>
            ) : (
              <div className="grid gap-3">
                {images.map((image) => (
                  <div
                    key={image.uid}
                    className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-3 rounded-md border border-border bg-white p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.previewUrl ?? image.file_path}
                      alt=""
                      className="h-16 w-16 rounded object-contain"
                    />
                    <div className="grid gap-2">
                      <TextInput
                        value={image.alt_text}
                        placeholder="Describe the image (required)"
                        invalid={Boolean(errors.images) && !image.alt_text.trim()}
                        onChange={(event) => setAlt(image.uid, event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setPrimary(image.uid)}
                        className={cn(
                          "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
                          image.is_primary ? "bg-accent/12 text-accent" : "bg-muted text-steel hover:text-primary"
                        )}
                      >
                        <Star size={13} aria-hidden="true" />
                        {image.is_primary ? "Main photo" : "Set as main"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(image.uid)}
                      className="rounded-md p-1.5 text-steel transition hover:bg-danger/10 hover:text-danger"
                      aria-label="Remove image"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-primary">Specifications</p>
              <Button type="button" variant="secondary" size="sm" onClick={addSpec}>
                <Plus size={15} aria-hidden="true" />
                Add row
              </Button>
            </div>
            {specs.length === 0 ? (
              <p className="text-sm text-steel">No specifications added.</p>
            ) : (
              <div className="grid gap-2">
                {specs.map((spec) => (
                  <div key={spec.uid} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_84px_auto] gap-2">
                    <TextInput
                      value={spec.label}
                      placeholder="Label"
                      onChange={(event) => updateSpec(spec.uid, "label", event.target.value)}
                    />
                    <TextInput
                      value={spec.value}
                      placeholder="Value"
                      onChange={(event) => updateSpec(spec.uid, "value", event.target.value)}
                    />
                    <TextInput
                      value={spec.unit}
                      placeholder="Unit"
                      onChange={(event) => updateSpec(spec.uid, "unit", event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(spec.uid)}
                      className="rounded-md p-1.5 text-steel transition hover:bg-danger/10 hover:text-danger"
                      aria-label="Remove specification"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="grid gap-3 rounded-md border border-border bg-background/50 p-4">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-primary">Published on the website</span>
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => update("isPublished", event.target.checked)}
                className="h-4 w-4 accent-accent"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-primary">Featured on the homepage</span>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => update("isFeatured", event.target.checked)}
                className="h-4 w-4 accent-accent"
              />
            </label>
          </div>
        </div>
      )}

      {libraryOpen ? (
        <ImageLibraryPicker
          images={existingImages}
          onPick={(item) => {
            addFromLibrary(item);
          }}
          onClose={() => setLibraryOpen(false)}
        />
      ) : null}
    </Drawer>
  );
}
