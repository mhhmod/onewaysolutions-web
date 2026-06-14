"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { useQuote } from "@/components/QuoteProvider";
import type { Product } from "@/lib/types";

export function AddToQuoteButton({ product }: { product: Product }) {
  const { addProduct } = useQuote();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addProduct(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex min-h-12 items-center gap-2 rounded-md bg-accent px-5 text-sm font-black text-white transition hover:bg-accent/90"
      >
        <Plus size={18} aria-hidden="true" />
        {added ? "Added to quote" : "Add to quote"}
      </button>
      <Link
        href="/quote"
        className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-black text-primary transition hover:border-primary/30 hover:bg-muted"
      >
        <FileText size={18} aria-hidden="true" />
        Open quote
      </Link>
    </div>
  );
}
