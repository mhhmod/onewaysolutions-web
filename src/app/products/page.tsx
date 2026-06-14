import Link from "next/link";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogTotals, getCategories, getProducts } from "@/lib/catalog";

export const metadata = {
  title: "Catalog"
};

export default function ProductsPage() {
  const categories = getCategories();
  const products = getProducts();
  const totals = getCatalogTotals();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="industrial-grid border-b border-border bg-surface py-12">
          <div className="container-shell">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Catalog</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-primary md:text-6xl">All products</h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-steel">
                  Browse the full imported catalog, add products to your quote list, then submit your details once.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-3xl font-black text-primary">{totals.products}</p>
                <p className="text-sm font-semibold text-steel">imported product images</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="container-shell">
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar" aria-label="Catalog category filters">
              <Link
                href="/products"
                className="inline-flex shrink-0 items-center rounded-full bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/products/${category.slug}`}
                  className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-primary hover:border-primary/30 hover:bg-muted"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface py-12">
          <div className="container-shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Sections</p>
                <h2 className="mt-2 text-3xl font-black text-primary">Browse by category</h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard key={category.slug} category={category} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
