"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Boxes, FileText, ImageIcon, LogOut, ShieldAlert, UserCheck } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

type AdminDashboardProps = {
  totals: {
    categories: number;
    products: number;
    catalogPages: number;
  };
  categories: Array<{
    slug: string;
    name: string;
    productCount?: number;
  }>;
};

type GateState = "checking" | "missing-env" | "signed-out" | "unauthorized" | "ready";

export function AdminDashboard({ totals, categories }: AdminDashboardProps) {
  const [gateState, setGateState] = useState<GateState>("checking");

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      if (!hasSupabaseConfig) {
        setGateState("missing-env");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        if (isMounted) {
          setGateState("signed-out");
        }
        return;
      }

      const { data: profile, error } = await supabase
        .from("admin_profiles")
        .select("user_id,is_active,role")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error || !profile?.is_active) {
        setGateState("unauthorized");
        return;
      }

      setGateState("ready");
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  async function signOut() {
    if (!hasSupabaseConfig) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setGateState("signed-out");
  }

  if (gateState !== "ready") {
    const title =
      gateState === "checking"
        ? "Checking admin access"
        : gateState === "missing-env"
          ? "Admin environment is not connected"
          : gateState === "unauthorized"
            ? "Admin profile is missing"
            : "Sign in required";

    const text =
      gateState === "checking"
        ? "Validating the current Supabase session."
        : gateState === "missing-env"
          ? "Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart the server."
          : gateState === "unauthorized"
            ? "The user is signed in, but does not have an active row in admin_profiles."
            : "The admin dashboard is separate from the public catalog and requires a Supabase admin user.";

    return (
      <div className="mx-auto grid min-h-[70svh] max-w-xl content-center gap-5 px-4">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-industrial">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
            <ShieldAlert size={22} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-primary">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-steel">{text}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/login"
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-black text-white hover:bg-accent/90"
            >
              Open login
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-black text-primary hover:bg-muted"
            >
              Public site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-white">
        <div className="container-shell flex min-h-20 flex-wrap items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">One Way Solutions</p>
            <h1 className="mt-1 text-2xl font-black">Admin dashboard</h1>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/24 px-4 text-sm font-black text-white hover:bg-white/10"
          >
            <LogOut size={17} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <main className="container-shell grid gap-8 py-8">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-border bg-surface p-5">
            <Boxes className="text-accent" size={22} aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-primary">{totals.products}</p>
            <p className="mt-1 text-sm font-semibold text-steel">Catalog products</p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-5">
            <FileText className="text-accent" size={22} aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-primary">{totals.categories}</p>
            <p className="mt-1 text-sm font-semibold text-steel">Catalog categories</p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-5">
            <ImageIcon className="text-accent" size={22} aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-primary">{totals.catalogPages}</p>
            <p className="mt-1 text-sm font-semibold text-steel">Reference pages</p>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-primary">Catalog sections</h2>
                <p className="mt-2 text-sm leading-6 text-steel">
                  The first version is generated from local catalog assets. Admin editing can be connected to Supabase rows after the seed/import step.
                </p>
              </div>
              <UserCheck className="shrink-0 text-success" size={24} aria-hidden="true" />
            </div>
            <div className="mt-6 grid gap-2">
              {categories.map((category) => (
                <div
                  key={category.slug}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-border bg-white px-4 py-3"
                >
                  <p className="truncate text-sm font-bold text-primary">{category.name}</p>
                  <p className="text-sm font-black text-accent">{category.productCount ?? 0}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-2xl font-black text-primary">Admin readiness</h2>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-steel">
              <p>Quote requests can be stored in Supabase once `.env.local` is configured.</p>
              <p>First admin user still needs to be created in Supabase Auth and inserted into `admin_profiles`.</p>
              <p>Catalog management should be enabled after remote catalog seeding is confirmed.</p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
