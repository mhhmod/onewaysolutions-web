import { getSupabaseBrowserClient } from "@/lib/supabase";
import { friendlyError } from "@/lib/admin/errors";

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  parent_id: string | null;
  sort_order: number;
  is_published: boolean;
  productCount: number;
};

export type SaveCategoryInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imagePath: string | null;
  parentId: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export async function listAdminCategoryRows(): Promise<AdminCategoryRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,image_path,parent_id,sort_order,is_published,products(count)")
    .order("sort_order", { ascending: true });
  if (error) throw friendlyError(error);

  return (data ?? []).map((row) => {
    const record = row as Omit<AdminCategoryRow, "productCount"> & { products: Array<{ count: number }> | null };
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
      description: record.description,
      image_path: record.image_path,
      parent_id: record.parent_id,
      sort_order: record.sort_order ?? 0,
      is_published: record.is_published,
      productCount: record.products?.[0]?.count ?? 0
    };
  });
}

export async function saveCategory(input: SaveCategoryInput): Promise<{ slug: string }> {
  const supabase = getSupabaseBrowserClient();
  const payload = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description.trim() || null,
    image_path: input.imagePath,
    parent_id: input.parentId,
    sort_order: input.sortOrder,
    is_published: input.isPublished
  };

  if (input.id) {
    const { error } = await supabase.from("categories").update(payload).eq("id", input.id);
    if (error) throw friendlyError(error);
  } else {
    const { error } = await supabase.from("categories").insert(payload);
    if (error) throw friendlyError(error);
  }

  return { slug: payload.slug };
}

export async function setCategoriesPublished(ids: string[], isPublished: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("categories").update({ is_published: isPublished }).in("id", ids);
  if (error) throw friendlyError(error);
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw friendlyError(error);
}
