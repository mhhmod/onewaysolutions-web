"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { Button } from "@/components/admin/ui/Button";
import { Drawer } from "@/components/admin/ui/Drawer";
import { Field, SelectInput, TextArea, TextInput } from "@/components/admin/ui/FormField";
import { SingleImageField, type SingleImageValue } from "@/components/admin/ui/SingleImageField";
import { useToast } from "@/components/admin/ui/Toast";
import { slugify } from "@/lib/slugify";
import { uploadImageFile } from "@/lib/admin/storage";
import { revalidateCatalog } from "@/lib/admin/revalidate";
import { saveCategory, type AdminCategoryRow } from "@/lib/admin/categories";

type CategoryFormProps = {
  open: boolean;
  category: AdminCategoryRow | null;
  allCategories: AdminCategoryRow[];
  existingImages: Array<{ file_path: string; alt_text: string }>;
  onClose: () => void;
  onSaved: () => void;
};

export function CategoryForm({ open, category, allCategories, existingImages, onClose, onSaved }: CategoryFormProps) {
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isPublished, setIsPublished] = useState(true);
  const [image, setImage] = useState<SingleImageValue>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(category);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setSlugTouched(true);
      setDescription(category.description ?? "");
      setParentId(category.parent_id ?? "");
      setSortOrder(String(category.sort_order));
      setIsPublished(category.is_published);
      setImage(category.image_path ? { file_path: category.image_path, bucket_id: "local-public" } : null);
    } else {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setParentId("");
      setSortOrder("0");
      setIsPublished(true);
      setImage(null);
    }
  }, [open, category]);

  function handleName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Enter a category name.";
    if (!slug.trim()) nextErrors.slug = "A web address is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !hasSupabaseConfig) return;

    setSaving(true);
    try {
      let imagePath = image?.file_path || null;
      if (image?.file) {
        imagePath = await uploadImageFile(image.file, "product-images", "categories");
      }

      const { slug: savedSlug } = await saveCategory({
        id: category?.id,
        name,
        slug,
        description,
        imagePath,
        parentId: parentId || null,
        sortOrder: Number(sortOrder) || 0,
        isPublished
      });

      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (data.session?.access_token) {
        await revalidateCatalog(data.session.access_token, { categorySlug: savedSlug });
      }

      notify(isEditing ? "Category updated." : "Category added.", "success");
      onSaved();
      onClose();
    } catch (error) {
      notify(error instanceof Error ? error.message : "We could not save the category.", "error");
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = allCategories.filter((item) => item.id !== category?.id);

  return (
    <Drawer
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={isEditing ? "Edit category" : "Add category"}
      description={isEditing ? category?.name : "Group products into a catalog section."}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEditing ? "Save changes" : "Add category"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <Field label="Category name" htmlFor="category-name" required error={errors.name}>
          <TextInput
            id="category-name"
            value={name}
            invalid={Boolean(errors.name)}
            onChange={(event) => handleName(event.target.value)}
            placeholder="Distribution panels"
          />
        </Field>

        <Field label="Web address" htmlFor="category-slug" required error={errors.slug} hint="Auto-filled from the name.">
          <TextInput
            id="category-slug"
            value={slug}
            invalid={Boolean(errors.slug)}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
          />
        </Field>

        <Field label="Description" htmlFor="category-description">
          <TextArea
            id="category-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Parent category" htmlFor="category-parent" hint="Optional.">
            <SelectInput id="category-parent" value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">No parent</option>
              {parentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Display order" htmlFor="category-order" hint="Lower numbers show first.">
            <TextInput
              id="category-order"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </Field>
        </div>

        <Field label="Image" htmlFor="category-image" hint="Shown on the category card.">
          <SingleImageField value={image} existingImages={existingImages} bucket="product-images" onChange={setImage} />
        </Field>

        <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/50 p-4 text-sm">
          <span className="font-medium text-primary">Published on the website</span>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </label>
      </div>
    </Drawer>
  );
}
