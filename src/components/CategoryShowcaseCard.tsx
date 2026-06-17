import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";

export function CategoryShowcaseCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/products/${category.slug}`}
      className="group grid min-w-0 overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-industrial"
    >
      <div className="grid min-w-0 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div className="relative aspect-[16/9] bg-white sm:aspect-square">
          {category.imagePath ? (
            <Image
              src={category.imagePath}
              alt=""
              fill
              sizes="112px"
              className="object-contain p-3 transition duration-200 group-hover:scale-[1.03]"
            />
          ) : null}
        </div>
        <div className="grid min-w-0 content-between gap-3 overflow-hidden p-4">
          <div>
            <p className="text-sm font-bold text-accent">{category.productCount ?? 0} items</p>
            <h3 className="mt-1 truncate text-base font-black text-primary">{category.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-steel">{category.description}</p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
            Open section
            <ArrowUpRight size={16} className="text-steel transition group-hover:text-accent" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
