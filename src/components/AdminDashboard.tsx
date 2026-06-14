"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  UserCheck
} from "lucide-react";
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
type QuoteStatus = "new" | "reviewing" | "quoted" | "closed" | "archived";
type QuoteLoadState = "idle" | "loading" | "ready" | "error";

type AdminProfile = {
  full_name: string | null;
  role: string;
};

type QuoteRequestRow = {
  id: string;
  status: QuoteStatus;
  customer_name: string;
  company_name: string;
  email: string | null;
  phone: string;
  project_location: string | null;
  message: string | null;
  items: unknown;
  source: string | null;
  created_at: string;
  updated_at: string | null;
};

type QuoteItemPreview = {
  name?: string;
  categoryName?: string;
  quantity?: number;
  notes?: string;
};

const quoteStatuses: QuoteStatus[] = ["new", "reviewing", "quoted", "closed", "archived"];

const statusStyles: Record<QuoteStatus, string> = {
  new: "bg-accent/10 text-accent",
  reviewing: "bg-primary/10 text-primary",
  quoted: "bg-success/10 text-success",
  closed: "bg-steel/12 text-primary",
  archived: "bg-muted text-steel"
};

function normalizeStatus(value: unknown): QuoteStatus {
  return quoteStatuses.includes(value as QuoteStatus) ? (value as QuoteStatus) : "new";
}

function normalizeItems(value: unknown): QuoteItemPreview[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      name: typeof item.name === "string" ? item.name : undefined,
      categoryName: typeof item.categoryName === "string" ? item.categoryName : undefined,
      quantity: typeof item.quantity === "number" ? item.quantity : undefined,
      notes: typeof item.notes === "string" ? item.notes : undefined
    }));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatStatus(value: QuoteStatus) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function AdminDashboard({ totals, categories }: AdminDashboardProps) {
  const [gateState, setGateState] = useState<GateState>("checking");
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequestRow[]>([]);
  const [quoteState, setQuoteState] = useState<QuoteLoadState>("idle");
  const [quoteError, setQuoteError] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const loadQuoteRequests = useCallback(async () => {
    if (!hasSupabaseConfig) {
      return;
    }

    setQuoteState("loading");
    setQuoteError("");

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("quote_requests")
      .select(
        "id,status,customer_name,company_name,email,phone,project_location,message,items,source,created_at,updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setQuoteState("error");
      setQuoteError(error.message);
      return;
    }

    const rows = ((data ?? []) as QuoteRequestRow[]).map((row) => ({
      ...row,
      status: normalizeStatus(row.status)
    }));

    setQuoteRequests(rows);
    setQuoteState("ready");
  }, []);

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

      const { data: profileRow, error } = await supabase
        .from("admin_profiles")
        .select("full_name,role,is_active")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error || !profileRow?.is_active) {
        setGateState("unauthorized");
        return;
      }

      setProfile({
        full_name: profileRow.full_name ?? data.session.user.email ?? "Admin user",
        role: profileRow.role ?? "admin"
      });
      setGateState("ready");
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (gateState === "ready") {
      loadQuoteRequests();
    }
  }, [gateState, loadQuoteRequests]);

  async function signOut() {
    if (!hasSupabaseConfig) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setGateState("signed-out");
    setQuoteRequests([]);
  }

  async function updateQuoteStatus(requestId: string, status: QuoteStatus) {
    if (!hasSupabaseConfig) {
      return;
    }

    setUpdatingStatusId(requestId);
    setQuoteError("");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("quote_requests").update({ status }).eq("id", requestId);

    if (error) {
      setQuoteError(error.message);
      setQuoteState("error");
      setUpdatingStatusId(null);
      return;
    }

    setQuoteRequests((requests) =>
      requests.map((request) => (request.id === requestId ? { ...request, status } : request))
    );
    setUpdatingStatusId(null);
  }

  const newRequestCount = useMemo(
    () => quoteRequests.filter((request) => request.status === "new").length,
    [quoteRequests]
  );

  const activeRequestCount = useMemo(
    () => quoteRequests.filter((request) => !["closed", "archived"].includes(request.status)).length,
    [quoteRequests]
  );

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
            <p className="mt-1 text-sm text-white/68">
              {profile?.full_name} - {profile?.role}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/24 px-4 text-sm font-black text-white hover:bg-white/10"
            >
              Public site
              <ExternalLink size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/24 px-4 text-sm font-black text-white hover:bg-white/10"
            >
              <LogOut size={17} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container-shell grid gap-8 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-border bg-surface p-5">
            <Clock3 className="text-accent" size={22} aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-primary">{newRequestCount}</p>
            <p className="mt-1 text-sm font-semibold text-steel">New requests</p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-5">
            <FileText className="text-accent" size={22} aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-primary">{activeRequestCount}</p>
            <p className="mt-1 text-sm font-semibold text-steel">Active requests</p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-5">
            <Boxes className="text-accent" size={22} aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-primary">{totals.products}</p>
            <p className="mt-1 text-sm font-semibold text-steel">Catalog products</p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-5">
            <ImageIcon className="text-accent" size={22} aria-hidden="true" />
            <p className="mt-4 text-3xl font-black text-primary">{totals.catalogPages}</p>
            <p className="mt-1 text-sm font-semibold text-steel">Reference pages</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="rounded-lg border border-border bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 className="text-2xl font-black text-primary">Quote inbox</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
                  Review customer requests, contact details, selected catalog items, and current workflow status.
                </p>
              </div>
              <button
                type="button"
                onClick={loadQuoteRequests}
                disabled={quoteState === "loading"}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-black text-primary transition hover:bg-muted disabled:cursor-wait disabled:text-steel"
              >
                {quoteState === "loading" ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <RefreshCw size={16} aria-hidden="true" />
                )}
                Refresh
              </button>
            </div>

            {quoteError ? (
              <div className="border-b border-border bg-danger/10 p-4 text-sm font-semibold text-danger">
                {quoteError}
              </div>
            ) : null}

            {quoteState === "loading" ? (
              <div className="grid gap-4 p-5">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : quoteRequests.length === 0 ? (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <CheckCircle2 className="mx-auto text-success" size={34} aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-black text-primary">No quote requests yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-steel">
                    New customer submissions will appear here as soon as they are sent from the public quote page.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {quoteRequests.map((request) => {
                  const items = normalizeItems(request.items);

                  return (
                    <article key={request.id} className="grid gap-4 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-primary">{request.customer_name}</h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-black ${statusStyles[request.status]}`}
                            >
                              {formatStatus(request.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-steel">{request.company_name}</p>
                          <p className="mt-1 text-xs text-steel">{formatDate(request.created_at)}</p>
                        </div>
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-steel">
                          Status
                          <select
                            value={request.status}
                            disabled={updatingStatusId === request.id}
                            onChange={(event) => updateQuoteStatus(request.id, event.target.value as QuoteStatus)}
                            className="min-h-10 rounded-md border border-border bg-white px-3 text-sm font-bold normal-case tracking-normal text-primary outline-none transition focus:border-accent"
                          >
                            {quoteStatuses.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-2 text-sm text-primary sm:grid-cols-2">
                        <a className="inline-flex min-h-8 items-center gap-2 font-semibold" href={`tel:${request.phone}`}>
                          <Phone size={15} aria-hidden="true" />
                          {request.phone}
                        </a>
                        {request.email ? (
                          <a className="inline-flex min-h-8 items-center gap-2 font-semibold" href={`mailto:${request.email}`}>
                            <Mail size={15} aria-hidden="true" />
                            {request.email}
                          </a>
                        ) : null}
                        {request.project_location ? (
                          <p className="inline-flex min-h-8 items-center gap-2 font-semibold text-steel">
                            <MapPin size={15} aria-hidden="true" />
                            {request.project_location}
                          </p>
                        ) : null}
                      </div>

                      {request.message ? (
                        <p className="rounded-md bg-background p-3 text-sm leading-6 text-steel">{request.message}</p>
                      ) : null}

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-accent">
                          Selected items ({items.length})
                        </p>
                        <div className="mt-3 grid gap-2">
                          {items.map((item, index) => (
                            <div
                              key={`${request.id}-${item.name ?? index}`}
                              className="grid gap-1 rounded-md border border-border bg-white px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto]"
                            >
                              <div>
                                <p className="font-bold text-primary">{item.name ?? "Catalog item"}</p>
                                {item.categoryName ? <p className="text-xs text-steel">{item.categoryName}</p> : null}
                                {item.notes ? <p className="mt-1 text-xs leading-5 text-steel">{item.notes}</p> : null}
                              </div>
                              <p className="font-black text-accent">Qty {item.quantity ?? 1}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-6 self-start">
            <aside className="rounded-lg border border-border bg-surface">
              <div className="border-b border-border p-5">
                <h2 className="text-2xl font-black text-primary">Catalog inventory</h2>
                <p className="mt-2 text-sm leading-6 text-steel">
                  The public catalog is generated from imported local assets and is ready for quote selection.
                </p>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.slug}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-3 last:border-b-0"
                  >
                    <p className="truncate text-sm font-bold text-primary">{category.name}</p>
                    <p className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-black text-accent">
                      {category.productCount ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </aside>

            <aside className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-2xl font-black text-primary">Operational status</h2>
              <div className="mt-5 grid gap-3 text-sm leading-6">
                <p className="flex gap-3 text-steel">
                  <UserCheck className="mt-0.5 shrink-0 text-success" size={18} aria-hidden="true" />
                  Admin access is active for the signed-in Supabase user.
                </p>
                <p className="flex gap-3 text-steel">
                  <FileText className="mt-0.5 shrink-0 text-success" size={18} aria-hidden="true" />
                  Quote requests are read from Supabase and can be moved through statuses.
                </p>
                <p className="flex gap-3 text-steel">
                  <Boxes className="mt-0.5 shrink-0 text-success" size={18} aria-hidden="true" />
                  Catalog browsing remains public; customer details are collected only on request submission.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
