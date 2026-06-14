import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { QuoteNavLink } from "@/components/QuoteNavLink";

const nav = [
  { href: "/products", label: "Catalog" },
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#projects", label: "Projects" },
  { href: "/#contact", label: "Contact" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur">
      <div className="container-shell flex min-h-20 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-steel transition hover:bg-muted hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            className="hidden min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-muted sm:inline-flex"
            href="tel:+201003094000"
          >
            <Phone size={16} aria-hidden="true" />
            Call
          </a>
          <QuoteNavLink />
          <details className="group relative md:hidden">
            <summary
              className="inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-border bg-surface text-primary [&::-webkit-details-marker]:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} aria-hidden="true" />
            </summary>
            <nav
              className="absolute end-0 top-14 grid min-w-56 gap-1 rounded-lg border border-border bg-surface p-2 shadow-industrial"
              aria-label="Mobile navigation"
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-3 text-sm font-semibold text-primary hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
