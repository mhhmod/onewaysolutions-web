"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, Inbox, Layers, Plus } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { Badge, type BadgeTone } from "@/components/admin/ui/Badge";
import { buttonVariants } from "@/components/admin/ui/Button";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { cn } from "@/lib/cn";

type OverviewProps = {
  totals: { products: number; categories: number };
  topCategories: Array<{ slug: string; name: string; productCount: number }>;
};

type RecentRequest = {
  id: string;
  customer_name: string;
  company_name: string;
  status: string;
  created_at: string;
};

const activeStatuses = ["new", "reviewing", "quoted"];

const statusTone: Record<string, BadgeTone> = {
  new: "accent",
  reviewing: "primary",
  quoted: "success",
  closed: "neutral",
  archived: "muted"
};

function formatStatus(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function AdminOverview({ totals, topCategories }: OverviewProps) {
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [recent, setRecent] = useState<RecentRequest[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!hasSupabaseConfig) {
        setLoading(false);
        return;
      }
      const supabase = getSupabaseBrowserClient();
      const [newResult, activeResult, recentResult] = await Promise.all([
        supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }).in("status", activeStatuses),
        supabase
          .from("quote_requests")
          .select("id,customer_name,company_name,status,created_at")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      if (!active) return;

      setNewCount(newResult.count ?? 0);
      setActiveCount(activeResult.count ?? 0);
      setRecent((recentResult.data ?? []) as RecentRequest[]);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const signals = [
    { label: "New requests", value: newCount, derived: true, accent: true },
    { label: "Active requests", value: activeCount, derived: true },
    { label: "Published products", value: totals.products, derived: false },
    { label: "Categories", value: totals.categories, derived: false }
  ];

  return (
    <div className="grid gap-6">
      <section className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface sm:flex-row sm:divide-x sm:divide-y-0">
        {signals.map((signal) => (
          <div key={signal.label} className="flex-1 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-steel">{signal.label}</p>
            {signal.derived && loading ? (
              <Skeleton className="mt-3 h-8 w-12" />
            ) : (
              <p
                className={cn(
                  "mt-2 text-3xl font-bold tabular-nums",
                  signal.accent && signal.value > 0 ? "text-accent" : "text-primary"
                )}
              >
                {signal.value}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/admin/products" className={buttonVariants({ variant: "primary" })}>
          <Plus size={18} aria-hidden="true" />
          Add product
        </Link>
        <Link href="/admin/quotes" className={buttonVariants({ variant: "secondary" })}>
          <Inbox size={18} aria-hidden="true" />
          Review quote requests
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border p-5">
            <h2 className="text-base font-semibold text-primary">Recent requests</h2>
            <Link
              href="/admin/quotes"
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition hover:gap-2"
            >
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-3 p-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex items-center gap-3 p-5 text-sm text-steel">
              <Inbox size={18} aria-hidden="true" />
              No quote requests yet. New submissions will appear here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">{request.customer_name}</p>
                    <p className="truncate text-xs text-steel">
                      {request.company_name} &middot; {formatDate(request.created_at)}
                    </p>
                  </div>
                  <Badge tone={statusTone[request.status] ?? "neutral"}>{formatStatus(request.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border p-5">
            <Layers size={18} className="text-steel" aria-hidden="true" />
            <h2 className="text-base font-semibold text-primary">Catalog snapshot</h2>
          </div>
          {topCategories.length === 0 ? (
            <div className="flex items-center gap-3 p-5 text-sm text-steel">
              <Boxes size={18} aria-hidden="true" />
              No categories yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {topCategories.map((category) => (
                <li key={category.slug} className="flex items-center justify-between gap-3 px-5 py-3">
                  <p className="truncate text-sm font-medium text-primary">{category.name}</p>
                  <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-accent">
                    {category.productCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
