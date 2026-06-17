import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CategoryShowcaseCard } from "@/components/CategoryShowcaseCard";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCategories, getCategory, getProducts } from "@/lib/catalog-db";
import { buildCatalogGroups, findCatalogGroupForCategory, getSiblingCategories } from "@/lib/catalog-groups";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export const revalidate = 120;
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = await getCategory(categorySlug);

  return {
    title: category ? category.name : "Category"
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const [categories, category, allProducts] = await Promise.all([
    getCategories(),
    getCategory(categorySlug),
    getProducts()
  ]);

  if (!category) {
    notFound();
  }

  const products = allProducts.filter((product) => product.categorySlug === category.slug);
  const catalogGroups = buildCatalogGroups(categories, allProducts);
  const currentGroup = findCatalogGroupForCategory(category.slug, catalogGroups);
  const siblingCategories = getSiblingCategories(category.slug, catalogGroups);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="industrial-grid border-b border-border bg-surface py-12">
          <div className="container-shell">
            <Link
              href="/products"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-bold text-primary hover:bg-muted"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              All products
            </Link>
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">
                  {products.length} products{currentGroup ? ` in ${currentGroup.title}` : ""}
                </p>
                <h1 className="mt-3 text-4xl font-black text-primary md:text-6xl">{category.name}</h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-steel">{category.description}</p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-steel">Current section</p>
                <p className="mt-1 text-3xl font-black text-primary">{products.length}</p>
                <p className="text-sm font-semibold text-steel">published products ready for quote selection</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="container-shell">
            {siblingCategories.length ? (
              <section className="mb-10 rounded-lg border border-border bg-surface p-5" aria-labelledby="related-sections">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-accent">{currentGroup?.title ?? "Related collection"}</p>
                    <h2 id="related-sections" className="mt-1 text-2xl font-black text-primary">
                      Nearby sections
                    </h2>
                  </div>
                  <Link
                    href="/products"
                    className="inline-flex min-h-10 items-center rounded-md border border-border bg-white px-3 text-sm font-bold text-primary hover:bg-muted"
                  >
                    Full catalog
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {siblingCategories.map((sibling) => (
                    <CategoryShowcaseCard key={sibling.slug} category={sibling} />
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-accent">Products in this section</p>
                <h2 className="mt-1 text-3xl font-black text-primary">Select exact items</h2>
              </div>
              <Link
                href="/quote"
                className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition hover:bg-accent/90"
              >
                Open quote request
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} showCategory={false} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
