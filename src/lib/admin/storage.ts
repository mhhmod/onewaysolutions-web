import { getSupabaseBrowserClient } from "@/lib/supabase";

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Upload an image to a public storage bucket and return its public URL.
 * Admin-only writes are enforced by storage row level security.
 */
export async function uploadImageFile(file: File, bucket: string, prefix: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const path = `${prefix}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type
  });
  if (error) {
    throw new Error("We could not upload the image. Use a JPG, PNG, or WEBP under 10MB.");
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
