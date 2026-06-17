import Link from "next/link";
import { CatalogGroupCard } from "@/components/CatalogGroupCard";
import { CategoryShowcaseCard } from "@/components/CategoryShowcaseCard";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogTotals, getCategories, getProducts } from "@/lib/catalog-db";
import { buildCatalogGroups } from "@/lib/catalog-groups";

export const metadata = {
  title: "Catalog"
};

export const revalidate = 120;

export default async function ProductsPage() {
  const [categories, products, totals] = await Promise.all([
    getCategories(),
    getProducts(),
    getCatalogTotals()
  ]);
  const catalogGroups = buildCatalogGroups(categories, products);
  const productsByCategory = categories.reduce((map, category) => {
    map.set(
      category.slug,
      products.filter((product) => product.categorySlug === category.slug)
    );
    return map;
  }, new Map<string, typeof products>());

  return (
    <>
      <SiteHeader />
      <main>
        <section className="industrial-grid border-b border-border bg-surface py-12">
          <div className="container-shell">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Catalog</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-primary md:text-6xl">Choose a collection</h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-steel">
                  Open the section closest to your project, inspect every product image, then add exact items to one quote request.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-3xl font-black text-primary">{totals.products}</p>
                <p className="text-sm font-semibold text-steel">published product images</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="container-shell">
            <div className="grid gap-4 lg:grid-cols-2">
              {catalogGroups.map((group) => (
                <CatalogGroupCard key={group.id} group={group} />
              ))}
            </div>

            <div className="mt-10 rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-primary">Section index</h2>
                <Link
                  href="#all-products"
                  className="inline-flex min-h-10 items-center rounded-md border border-border bg-white px-3 text-sm font-bold text-primary hover:bg-muted"
                >
                  Jump to products
                </Link>
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar" aria-label="Catalog category filters">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`#${category.slug}`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-primary hover:border-primary/30 hover:bg-muted"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-steel">{category.productCount ?? 0}</span>
                  </Link>
                ))}
              </div>
            </div>

            <section className="mt-10" aria-labelledby="browse-by-category">
              <h2 id="browse-by-category" className="text-3xl font-black text-primary">Browse by category</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <CategoryShowcaseCard key={category.slug} category={category} />
                ))}
              </div>
            </section>

            <section id="all-products" className="mt-12 grid gap-10" aria-label="All products by section">
              <Link
                href="/products"
                className="inline-flex w-fit min-h-11 items-center rounded-md bg-primary px-4 text-sm font-bold text-white"
              >
                All products
              </Link>
              {categories.map((category) => (
                <section key={category.slug} id={category.slug} className="scroll-mt-28">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <p className="text-sm font-bold text-accent">{category.productCount ?? 0} products</p>
                      <h2 className="mt-1 text-3xl font-black text-primary">{category.name}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">{category.description}</p>
                    </div>
                    <Link
                      href={`/products/${category.slug}`}
                      className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-bold text-primary transition hover:border-primary/30 hover:bg-muted"
                    >
                      Open section
                    </Link>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(productsByCategory.get(category.slug) ?? []).map((product) => (
                      <ProductCard key={product.slug} product={product} showCategory={false} />
                    ))}
                  </div>
                </section>
              ))}
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
