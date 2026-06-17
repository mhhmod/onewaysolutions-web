import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { CatalogGroup } from "@/lib/catalog-groups";

export function CatalogMegaMenu({ groups }: { groups: CatalogGroup[] }) {
  return (
    <div className="group/menu relative hidden md:block">
      <Link
        href="/products"
        className="inline-flex min-h-11 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-steel transition hover:bg-muted hover:text-primary focus:bg-muted focus:text-primary"
      >
        Catalog
        <ChevronDown size={15} aria-hidden="true" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-50 w-[min(920px,calc(100vw-48px))] -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover/menu:visible group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:opacity-100">
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-industrial">
          <div className="grid gap-px bg-border lg:grid-cols-4">
            {groups.map((group) => {
              const firstCategory = group.categories[0];
              const imagePath = group.imagePaths[0] ?? firstCategory?.imagePath;
              return (
                <section key={group.id} className="grid bg-surface p-4">
                  <Link href={firstCategory ? `/products/${firstCategory.slug}` : "/products"} className="group/card grid gap-3">
                    {imagePath ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-white">
                        <Image
                          src={imagePath}
                          alt=""
                          fill
                          sizes="220px"
                          className="object-contain p-2 transition duration-200 group-hover/card:scale-[1.03]"
                        />
                      </div>
                    ) : null}
                    <div>
                      <p className="text-xs font-bold text-accent">{group.productCount} products</p>
                      <h2 className="mt-1 text-base font-black text-primary">{group.title}</h2>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-steel">{group.summary}</p>
                    </div>
                  </Link>
                  <div className="mt-4 grid gap-1">
                    {group.categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/products/${category.slug}`}
                        className="flex min-h-9 items-center justify-between gap-2 rounded-md px-2 text-sm font-semibold text-primary transition hover:bg-muted"
                      >
                        <span className="min-w-0 truncate">{category.name}</span>
                        <span className="shrink-0 text-xs font-bold text-steel">{category.productCount ?? 0}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border bg-background px-4 py-3">
            <p className="text-sm text-steel">Open any section first, then add exact items to one quote request.</p>
            <Link
              href="/products"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary/92"
            >
              View all products
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileCatalogLinks({ groups }: { groups: CatalogGroup[] }) {
  return (
    <div className="grid gap-2 border-t border-border pt-2">
      <Link href="/products" className="rounded-md px-3 py-3 text-sm font-semibold text-primary hover:bg-muted">
        All products
      </Link>
      {groups.map((group) => (
        <div key={group.id} className="rounded-md bg-muted/60 p-2">
          <p className="px-2 py-1 text-xs font-bold text-accent">{group.title}</p>
          <div className="grid gap-1">
            {group.categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products/${category.slug}`}
                className="flex min-h-10 items-center justify-between gap-3 rounded-md bg-surface px-3 text-sm font-semibold text-primary hover:bg-white"
              >
                <span className="min-w-0 truncate">{category.name}</span>
                <span className="shrink-0 text-xs text-steel">{category.productCount ?? 0}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
