"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { useQuote } from "@/components/QuoteProvider";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  showCategory?: boolean;
};

export function ProductCard({ product, showCategory = true }: ProductCardProps) {
  const { addProduct } = useQuote();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addProduct(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="group grid overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-industrial">
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/3] bg-muted">
        <Image
          src={product.imagePath}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw"
          className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="grid gap-4 p-4">
        <div>
          {showCategory ? (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              {product.categoryName}
            </p>
          ) : null}
          <h3 className={showCategory ? "mt-2 text-base font-bold leading-6 text-primary" : "text-base font-bold leading-6 text-primary"}>
            <Link className="inline-flex min-h-8 items-start" href={`/product/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-steel">{product.summary}</p>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-white transition hover:bg-primary/92"
          >
            <Plus size={16} aria-hidden="true" />
            {added ? "Added" : "Add to quote"}
          </button>
          <Link
            href={`/product/${product.slug}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-white text-primary transition hover:border-primary/30 hover:bg-muted"
            aria-label={`View ${product.name}`}
          >
            <Eye size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
