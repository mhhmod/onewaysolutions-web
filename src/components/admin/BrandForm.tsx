"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { Button } from "@/components/admin/ui/Button";
import { Drawer } from "@/components/admin/ui/Drawer";
import { Field, TextInput } from "@/components/admin/ui/FormField";
import { SingleImageField, type SingleImageValue } from "@/components/admin/ui/SingleImageField";
import { useToast } from "@/components/admin/ui/Toast";
import { slugify } from "@/lib/slugify";
import { uploadImageFile } from "@/lib/admin/storage";
import { revalidateCatalog } from "@/lib/admin/revalidate";
import { saveBrand, type AdminBrandRow } from "@/lib/admin/brands";

type BrandFormProps = {
  open: boolean;
  brand: AdminBrandRow | null;
  existingImages: Array<{ file_path: string; alt_text: string }>;
  onClose: () => void;
  onSaved: () => void;
};

export function BrandForm({ open, brand, existingImages, onClose, onSaved }: BrandFormProps) {
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [country, setCountry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isPublished, setIsPublished] = useState(true);
  const [logo, setLogo] = useState<SingleImageValue>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(brand);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (brand) {
      setName(brand.name);
      setSlug(brand.slug);
      setSlugTouched(true);
      setCountry(brand.country ?? "");
      setWebsiteUrl(brand.website_url ?? "");
      setSortOrder(String(brand.sort_order));
      setIsPublished(brand.is_published);
      setLogo(brand.logo_path ? { file_path: brand.logo_path, bucket_id: "local-public" } : null);
    } else {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setCountry("");
      setWebsiteUrl("");
      setSortOrder("0");
      setIsPublished(true);
      setLogo(null);
    }
  }, [open, brand]);

  function handleName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Enter a brand name.";
    if (!slug.trim()) nextErrors.slug = "A web address is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !hasSupabaseConfig) return;

    setSaving(true);
    try {
      let logoPath = logo?.file_path || null;
      if (logo?.file) {
        logoPath = await uploadImageFile(logo.file, "brand-assets", "brands");
      }

      await saveBrand({
        id: brand?.id,
        name,
        slug,
        country,
        websiteUrl,
        logoPath,
        sortOrder: Number(sortOrder) || 0,
        isPublished
      });

      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (data.session?.access_token) {
        await revalidateCatalog(data.session.access_token);
      }

      notify(isEditing ? "Brand updated." : "Brand added.", "success");
      onSaved();
      onClose();
    } catch (error) {
      notify(error instanceof Error ? error.message : "We could not save the brand.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={isEditing ? "Edit brand" : "Add brand"}
      description={isEditing ? brand?.name : "Manufacturers and suppliers you can assign to products."}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEditing ? "Save changes" : "Add brand"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <Field label="Brand name" htmlFor="brand-name" required error={errors.name}>
          <TextInput
            id="brand-name"
            value={name}
            invalid={Boolean(errors.name)}
            onChange={(event) => handleName(event.target.value)}
          />
        </Field>

        <Field label="Web address" htmlFor="brand-slug" required error={errors.slug} hint="Auto-filled from the name.">
          <TextInput
            id="brand-slug"
            value={slug}
            invalid={Boolean(errors.slug)}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Country" htmlFor="brand-country" hint="Optional.">
            <TextInput id="brand-country" value={country} onChange={(event) => setCountry(event.target.value)} />
          </Field>
          <Field label="Display order" htmlFor="brand-order" hint="Lower numbers show first.">
            <TextInput
              id="brand-order"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </Field>
        </div>

        <Field label="Website" htmlFor="brand-website" hint="Optional.">
          <TextInput
            id="brand-website"
            type="url"
            placeholder="https://"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
          />
        </Field>

        <Field label="Logo" htmlFor="brand-logo">
          <SingleImageField value={logo} existingImages={existingImages} bucket="brand-assets" onChange={setLogo} />
        </Field>

        <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/50 p-4 text-sm">
          <span className="font-medium text-primary">Visible</span>
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
