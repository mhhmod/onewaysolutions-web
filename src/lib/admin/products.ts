import { getSupabaseBrowserClient } from "@/lib/supabase";

const STORAGE_BUCKET = "product-images";

export type AdminCategory = { id: string; name: string; slug: string; is_published: boolean };
export type AdminBrand = { id: string; name: string; slug: string };

export type AdminImageInput = {
  id?: string;
  bucket_id: string;
  file_path: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  /** Present only for newly uploaded files that still need to be sent to storage. */
  file?: File;
  /** Local object URL used for previewing a not-yet-uploaded file. */
  previewUrl?: string;
};

export type AdminSpecInput = { id?: string; label: string; value: string; unit: string };

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  is_featured: boolean;
  updated_at: string | null;
  category: { id: string; name: string; slug: string } | null;
  primaryImage: string | null;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  model: string | null;
  sku: string | null;
  category_id: string | null;
  brand_id: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  images: AdminImageInput[];
  specs: AdminSpecInput[];
};

export type SaveProductInput = {
  id?: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  model: string;
  sku: string;
  categoryId: string | null;
  brandId: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  images: AdminImageInput[];
  specs: AdminSpecInput[];
};

type RelationLike<T> = T | T[] | null;

function firstRelation<T>(value: RelationLike<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function primaryFrom(images: Array<{ file_path: string; is_primary: boolean | null; sort_order: number | null }> | null) {
  if (!images || images.length === 0) return null;
  const ordered = [...images].sort(
    (a, b) =>
      Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  return ordered[0]?.file_path ?? null;
}

function friendlyError(error: { code?: string; message?: string } | null): Error {
  if (error?.code === "23505") {
    return new Error("A product with a similar name already exists. Adjust the name or web address.");
  }
  return new Error("We could not save your changes. Please review the form and try again.");
}

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,is_published")
    .order("sort_order", { ascending: true });
  if (error) throw friendlyError(error);
  return (data ?? []) as AdminCategory[];
}

export async function listAdminBrands(): Promise<AdminBrand[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("brands").select("id,name,slug").order("name", { ascending: true });
  if (error) throw friendlyError(error);
  return (data ?? []) as AdminBrand[];
}

export async function listAdminProducts(): Promise<AdminProductListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,slug,is_published,is_featured,updated_at,category:categories(id,name,slug),product_images(file_path,is_primary,sort_order)"
    )
    .order("updated_at", { ascending: false });
  if (error) throw friendlyError(error);

  return (data ?? []).map((row) => {
    const record = row as {
      id: string;
      name: string;
      slug: string;
      is_published: boolean;
      is_featured: boolean;
      updated_at: string | null;
      category: RelationLike<{ id: string; name: string; slug: string }>;
      product_images: Array<{ file_path: string; is_primary: boolean | null; sort_order: number | null }> | null;
    };
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
      is_published: record.is_published,
      is_featured: record.is_featured,
      updated_at: record.updated_at,
      category: firstRelation(record.category),
      primaryImage: primaryFrom(record.product_images)
    };
  });
}

export async function listExistingImages(limit = 160): Promise<Array<{ file_path: string; alt_text: string }>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("file_path,alt_text")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw friendlyError(error);

  const seen = new Set<string>();
  const unique: Array<{ file_path: string; alt_text: string }> = [];
  for (const row of (data ?? []) as Array<{ file_path: string; alt_text: string }>) {
    if (!seen.has(row.file_path)) {
      seen.add(row.file_path);
      unique.push(row);
    }
  }
  return unique;
}

export async function loadProductDetail(id: string): Promise<AdminProductDetail> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,slug,summary,description,model,sku,category_id,brand_id,is_published,is_featured,sort_order,product_images(id,bucket_id,file_path,alt_text,is_primary,sort_order),product_specs(id,label,value,unit,sort_order)"
    )
    .eq("id", id)
    .single();
  if (error || !data) throw friendlyError(error);

  const record = data as Record<string, unknown>;
  const images = ((record.product_images as AdminImageInput[] | null) ?? [])
    .map((image) => ({
      id: image.id,
      bucket_id: image.bucket_id,
      file_path: image.file_path,
      alt_text: image.alt_text,
      is_primary: image.is_primary,
      sort_order: image.sort_order
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const specs = (((record.product_specs as Array<AdminSpecInput & { sort_order: number }> | null) ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)).map((spec) => ({
    id: spec.id,
    label: spec.label,
    value: spec.value,
    unit: spec.unit ?? ""
  }));

  return {
    id: record.id as string,
    name: record.name as string,
    slug: record.slug as string,
    summary: (record.summary as string | null) ?? null,
    description: (record.description as string | null) ?? null,
    model: (record.model as string | null) ?? null,
    sku: (record.sku as string | null) ?? null,
    category_id: (record.category_id as string | null) ?? null,
    brand_id: (record.brand_id as string | null) ?? null,
    is_published: record.is_published as boolean,
    is_featured: record.is_featured as boolean,
    sort_order: (record.sort_order as number) ?? 0,
    images,
    specs
  };
}

export async function saveProduct(input: SaveProductInput): Promise<{ slug: string }> {
  const supabase = getSupabaseBrowserClient();

  const productPayload = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    summary: input.summary.trim() || null,
    description: input.description.trim() || null,
    model: input.model.trim() || null,
    sku: input.sku.trim() || null,
    category_id: input.categoryId,
    brand_id: input.brandId,
    is_published: input.isPublished,
    is_featured: input.isFeatured,
    sort_order: input.sortOrder
  };

  let productId = input.id;

  if (productId) {
    const { error } = await supabase.from("products").update(productPayload).eq("id", productId);
    if (error) throw friendlyError(error);
  } else {
    const { data, error } = await supabase.from("products").insert(productPayload).select("id").single();
    if (error || !data) throw friendlyError(error);
    productId = (data as { id: string }).id;
  }

  const finalImages: Array<{
    product_id: string;
    bucket_id: string;
    file_path: string;
    alt_text: string;
    is_primary: boolean;
    sort_order: number;
  }> = [];

  for (let index = 0; index < input.images.length; index += 1) {
    const image = input.images[index];
    let filePath = image.file_path;
    let bucket = image.bucket_id;

    if (image.file) {
      const path = `${productId}/${Date.now()}-${index}-${sanitizeFileName(image.file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, image.file, { upsert: true, contentType: image.file.type });
      if (uploadError) {
        throw new Error("We could not upload an image. Use a JPG, PNG, or WEBP under 10MB.");
      }
      filePath = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      bucket = STORAGE_BUCKET;
    }

    finalImages.push({
      product_id: productId,
      bucket_id: bucket,
      file_path: filePath,
      alt_text: image.alt_text.trim(),
      is_primary: image.is_primary,
      sort_order: index
    });
  }

  if (finalImages.length > 0 && !finalImages.some((image) => image.is_primary)) {
    finalImages[0].is_primary = true;
  }

  // Capture the prior images so a failed insert cannot leave the product with
  // none (the browser client has no transaction; this restores on failure).
  const { data: priorImages } = await supabase
    .from("product_images")
    .select("bucket_id,file_path,alt_text,source_folder,source_filename,source_page,width_px,height_px,is_primary,sort_order")
    .eq("product_id", productId);

  await supabase.from("product_images").delete().eq("product_id", productId);
  if (finalImages.length > 0) {
    const { error } = await supabase.from("product_images").insert(finalImages);
    if (error) {
      if (priorImages && priorImages.length > 0) {
        await supabase
          .from("product_images")
          .insert(priorImages.map((row) => ({ ...row, product_id: productId })));
      }
      throw friendlyError(error);
    }
  }

  const cleanSpecs = input.specs
    .filter((spec) => spec.label.trim() && spec.value.trim())
    .map((spec, index) => ({
      product_id: productId as string,
      label: spec.label.trim(),
      value: spec.value.trim(),
      unit: spec.unit.trim() || null,
      sort_order: index
    }));

  const { data: priorSpecs } = await supabase
    .from("product_specs")
    .select("label,value,unit,sort_order")
    .eq("product_id", productId);

  await supabase.from("product_specs").delete().eq("product_id", productId);
  if (cleanSpecs.length > 0) {
    const { error } = await supabase.from("product_specs").insert(cleanSpecs);
    if (error) {
      if (priorSpecs && priorSpecs.length > 0) {
        await supabase
          .from("product_specs")
          .insert(priorSpecs.map((row) => ({ ...row, product_id: productId })));
      }
      throw friendlyError(error);
    }
  }

  return { slug: productPayload.slug };
}

export async function setProductsPublished(ids: string[], isPublished: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("products").update({ is_published: isPublished }).in("id", ids);
  if (error) throw friendlyError(error);
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw friendlyError(error);
}
