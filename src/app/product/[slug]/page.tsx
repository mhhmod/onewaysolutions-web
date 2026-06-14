import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, FileImage, Layers } from "lucide-react";
import { AddToQuoteButton } from "@/components/AddToQuoteButton";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getProduct, getProducts, getRelatedProducts } from "@/lib/catalog";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  return {
    title: product ? product.name : "Product"
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product);

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

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-white p-4">
                    <BadgeCheck className="text-accent" size={20} aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold text-primary">Quote only</p>
                    <p className="mt-1 text-xs leading-5 text-steel">No public prices shown</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <Layers className="text-accent" size={20} aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold text-primary">Category</p>
                    <p className="mt-1 text-xs leading-5 text-steel">{product.categoryName}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <FileImage className="text-accent" size={20} aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold text-primary">Catalog source</p>
                    <p className="mt-1 text-xs leading-5 text-steel">
                      {product.sourcePage ? `Page ${product.sourcePage}` : "Imported image"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-5">
                  <h2 className="text-lg font-black text-primary">How this item is quoted</h2>
                  <p className="mt-2 text-sm leading-7 text-steel">
                    Add the item to your quote list, set quantity and notes, then submit your contact details. One Way Solutions can confirm the exact model, specification, availability, and commercial terms directly.
                  </p>
                </div>
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
