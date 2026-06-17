import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CatalogGroup } from "@/lib/catalog-groups";

type CatalogGroupCardProps = {
  group: CatalogGroup;
  featured?: boolean;
};

export function CatalogGroupCard({ group, featured = false }: CatalogGroupCardProps) {
  const primaryCategory = group.categories[0];
  const imagePaths = group.imagePaths.length > 0 ? group.imagePaths : primaryCategory?.imagePath ? [primaryCategory.imagePath] : [];
  const href = primaryCategory ? `/products/${primaryCategory.slug}` : "/products";

  return (
    <article
      className={
        featured
          ? "grid overflow-hidden rounded-lg border border-primary/18 bg-surface shadow-industrial lg:grid-cols-[0.9fr_1.1fr]"
          : "grid overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-industrial"
      }
    >
      <Link
        href={href}
        className={`grid gap-2 bg-muted p-3 ${featured ? "grid-cols-2" : "grid-cols-2"}`}
        aria-label={`Open ${group.title}`}
      >
        {imagePaths.slice(0, featured ? 4 : 2).map((imagePath, index) => (
          <div
            key={`${group.id}-${imagePath}`}
            className={`relative overflow-hidden rounded-md border border-border bg-white ${
              featured && index === 0 ? "aspect-[4/3] sm:row-span-2 sm:aspect-auto" : "aspect-[4/3]"
            }`}
          >
            <Image
              src={imagePath}
              alt=""
              fill
              sizes={featured ? "(min-width: 1024px) 18vw, 44vw" : "(min-width: 1024px) 12vw, 44vw"}
              className="object-contain p-2"
            />
          </div>
        ))}
      </Link>
      <div className={featured ? "grid content-between gap-6 p-6" : "grid gap-4 p-4"}>
        <div>
          <p className="text-sm font-bold text-accent">
            {group.productCount} products across {group.categories.length} sections
          </p>
          <h3 className={featured ? "mt-3 text-3xl font-black leading-tight text-primary" : "mt-2 text-xl font-black text-primary"}>
            {group.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-steel">{group.summary}</p>
        </div>
        <div className="grid gap-2">
          {group.categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products/${category.slug}`}
              className="group/category flex min-h-10 items-center justify-between gap-3 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-muted"
            >
              <span className="min-w-0 truncate">{category.name}</span>
              <span className="shrink-0 text-xs font-bold text-steel group-hover/category:text-accent">
                {category.productCount ?? 0}
              </span>
            </Link>
          ))}
        </div>
        <Link
          href={href}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary/92"
        >
          Open collection
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
