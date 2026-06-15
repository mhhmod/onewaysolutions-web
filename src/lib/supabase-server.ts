import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseServerConfig = Boolean(supabaseUrl && supabasePublishableKey);

let cachedClient: SupabaseClient | null = null;

/**
 * Read-only server client bound to the public (anonymous) key. Row level
 * security limits it to published catalog content, so it is safe to use in
 * Server Components for public pages. Returns null when configuration is
 * absent so callers can fall back to bundled content.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return cachedClient;
}
