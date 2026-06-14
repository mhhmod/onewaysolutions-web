import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/products/${category.slug}`}
      className="group grid overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-industrial"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {category.imagePath ? (
          <Image
            src={category.imagePath}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
        <span className="absolute start-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-primary shadow-sm">
          {category.productCount ?? 0} items
        </span>
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-bold text-primary">{category.name}</h3>
          <ArrowUpRight
            className="mt-0.5 shrink-0 text-steel transition group-hover:text-accent"
            size={18}
            aria-hidden="true"
          />
        </div>
        <p className="text-sm leading-6 text-steel">{category.description}</p>
      </div>
    </Link>
  );
}
