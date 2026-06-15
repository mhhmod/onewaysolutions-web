import { getSupabaseBrowserClient } from "@/lib/supabase";
import { friendlyError } from "@/lib/admin/errors";

export type AdminBrandRow = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  website_url: string | null;
  logo_path: string | null;
  sort_order: number;
  is_published: boolean;
};

export type SaveBrandInput = {
  id?: string;
  name: string;
  slug: string;
  country: string;
  websiteUrl: string;
  logoPath: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export async function listAdminBrandRows(): Promise<AdminBrandRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id,name,slug,country,website_url,logo_path,sort_order,is_published")
    .order("sort_order", { ascending: true });
  if (error) throw friendlyError(error);
  return (data ?? []) as AdminBrandRow[];
}

export async function saveBrand(input: SaveBrandInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const payload = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    country: input.country.trim() || null,
    website_url: input.websiteUrl.trim() || null,
    logo_path: input.logoPath,
    sort_order: input.sortOrder,
    is_published: input.isPublished
  };

  if (input.id) {
    const { error } = await supabase.from("brands").update(payload).eq("id", input.id);
    if (error) throw friendlyError(error);
  } else {
    const { error } = await supabase.from("brands").insert(payload);
    if (error) throw friendlyError(error);
  }
}

export async function deleteBrand(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw friendlyError(error);
}
