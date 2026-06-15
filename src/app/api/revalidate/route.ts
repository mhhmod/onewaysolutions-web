import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * On-demand revalidation for the public catalog. Guarded: the caller must
 * present a valid admin session token. Used by the admin tools so catalog
 * edits appear on the public site immediately instead of waiting for ISR.
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("is_active")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!profile?.is_active) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: { categorySlug?: string; productSlug?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  revalidatePath("/");
  revalidatePath("/products");
  if (body.categorySlug) {
    revalidatePath(`/products/${body.categorySlug}`);
  }
  if (body.productSlug) {
    revalidatePath(`/product/${body.productSlug}`);
  }

  return NextResponse.json({ ok: true });
}
