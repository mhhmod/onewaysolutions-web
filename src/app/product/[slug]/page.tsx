import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddToQuoteButton } from "@/components/AddToQuoteButton";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getProduct, getProducts, getRelatedProducts } from "@/lib/catalog-db";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 120;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return {
    title: product ? product.name : "Product"
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-surface py-10">
          <div className="container-shell">
            <Link
              href={`/products/${product.categorySlug}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-bold text-primary hover:bg-muted"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {product.categoryName}
            </Link>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-white shadow-industrial">
                <Image
                  src={product.imagePath}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 48vw, 92vw"
                  className="object-contain p-6"
                />
              </div>

              <div className="grid gap-6">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">
                    {product.categoryName}
                  </p>
                  <h1 className="mt-3 text-4xl font-black leading-tight text-primary md:text-6xl">
                    {product.name}
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-steel">{product.summary}</p>
                </div>

                <AddToQuoteButton product={product} />
              </div>
            </div>
          </div>
        </section>

        {relatedProducts.length ? (
          <section className="bg-background py-12">
            <div className="container-shell">
              <h2 className="text-3xl font-black text-primary">Related items</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((related) => (
                  <ProductCard key={related.slug} product={related} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
