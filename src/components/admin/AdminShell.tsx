"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ExternalLink, FileText, LayoutDashboard, LogOut, Menu, Tags, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdmin } from "@/components/admin/AdminProvider";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const navItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/quotes", label: "Quote requests", icon: FileText },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories & brands", icon: Tags }
];

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "/";

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, signOut } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (onNavigate?: () => void) =>
    navItems.map((item) => {
      const active = isActive(pathname, item);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
            active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
          )}
        >
          <item.icon size={18} aria-hidden="true" />
          {item.label}
        </Link>
      );
    });

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-primary/30 bg-primary text-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/12 px-5">
          <span className="text-sm font-bold uppercase tracking-[0.14em] text-accent">One Way</span>
          <span className="text-sm font-semibold text-white/80">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin sections">
          {navLinks()}
        </nav>
        <div className="space-y-1 border-t border-white/12 p-3">
          <a
            href={publicSiteUrl}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
          >
            <ExternalLink size={18} aria-hidden="true" />
            Public site
          </a>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:ps-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border bg-surface/92 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-muted lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              <CurrentSectionTitle pathname={pathname} />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-end sm:block">
                <p className="text-sm font-semibold leading-5 text-primary">{profile.fullName}</p>
                <p className="text-xs capitalize leading-4 text-steel">{profile.role}</p>
              </div>
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white"
                aria-hidden="true"
              >
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="admin-animate-overlay absolute inset-0 bg-primary/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="admin-animate-drawer absolute inset-y-0 start-0 flex w-72 max-w-[82%] flex-col bg-primary text-white">
            <div className="flex h-16 items-center justify-between border-b border-white/12 px-5">
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-accent">One Way Admin</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-white/80 transition hover:bg-white/10"
                aria-label="Close navigation"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin sections">
              {navLinks(() => setMobileOpen(false))}
            </nav>
            <div className="space-y-1 border-t border-white/12 p-3">
              <a
                href={publicSiteUrl}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
              >
                <ExternalLink size={18} aria-hidden="true" />
                Public site
              </a>
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
              >
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CurrentSectionTitle({ pathname }: { pathname: string }) {
  const current = [...navItems].reverse().find((item) => isActive(pathname, item));
  return <h1 className="text-lg font-semibold text-primary">{current?.label ?? "Admin"}</h1>;
}
