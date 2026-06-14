"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useQuote } from "@/components/QuoteProvider";

export function QuoteNavLink() {
  const { itemCount } = useQuote();

  return (
    <Link
      className="relative inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-white shadow-industrial transition hover:translate-y-[-1px] hover:bg-accent/90"
      href="/quote"
    >
      <FileText size={16} aria-hidden="true" />
      Request quote
      {itemCount > 0 ? (
        <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-accent">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
