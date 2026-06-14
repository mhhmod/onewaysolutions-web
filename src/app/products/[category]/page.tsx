import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCategories, getCategory, getProductsByCategory } from "@/lib/catalog";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export function generateStaticParams() {
  return getCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = getCategory(categorySlug);

  return {
    title: category ? category.name : "Category"
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = getCategory(categorySlug);

  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(category.slug);

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
            <p className="mt-8 text-sm font-black uppercase tracking-[0.16em] text-accent">
              {products.length} products
            </p>
            <h1 className="mt-3 text-4xl font-black text-primary md:text-6xl">{category.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-steel">{category.description}</p>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="container-shell">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
