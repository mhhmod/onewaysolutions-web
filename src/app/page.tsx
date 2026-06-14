import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, FileText, ShieldCheck, Zap } from "lucide-react";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogPages, getCatalogTotals, getCategories, getFeaturedProducts } from "@/lib/catalog";

const capabilities = [
  {
    icon: Zap,
    title: "Electrical and control supply",
    text: "Distribution panels, contactors, cable routing, accessories, and site-ready electrical components."
  },
  {
    icon: ShieldCheck,
    title: "Safety and fire systems",
    text: "Fire cabinets, alarms, safety boxes, safety footwear, labeling, and project safety support."
  },
  {
    icon: Building2,
    title: "Telecom and solar projects",
    text: "Smart panels, ONT/ONU infrastructure, solar lighting, and supporting installation material."
  }
];

export default function HomePage() {
  const categories = getCategories();
  const featuredProducts = getFeaturedProducts(8);
  const totals = getCatalogTotals();
  const catalogPages = getCatalogPages().slice(5, 9);
  const heroProduct = featuredProducts[0];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-primary/20 bg-primary text-white">
          <div className="absolute inset-0 -z-10">
            {heroProduct ? (
              <Image
                src={heroProduct.imagePath}
                alt={heroProduct.name}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-22"
              />
            ) : null}
            <div className="absolute inset-0 bg-primary/78" />
          </div>
          <div className="container-shell grid min-h-[72svh] content-center gap-10 py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-center">
            <div className="max-w-4xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">
                Industrial catalog and quote requests
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.98] tracking-normal md:text-7xl">
                One Way Solutions
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
                Browse electrical, solar, fire safety, telecom, and control products. Select what your project needs and send one quote request with your details.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex min-h-12 items-center gap-2 rounded-md bg-accent px-5 text-sm font-black text-white transition hover:bg-accent/90"
                >
                  Browse catalog
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  href="/quote"
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/28 px-5 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Request quote
                  <FileText size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="grid gap-3 rounded-lg border border-white/18 bg-white/8 p-4 backdrop-blur-sm">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-white">
                {heroProduct ? (
                  <Image
                    src={heroProduct.imagePath}
                    alt={heroProduct.name}
                    fill
                    sizes="(min-width: 1024px) 38vw, 92vw"
                    className="object-contain p-4"
                  />
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">{totals.products}</p>
                  <p className="text-xs text-white/72">Products</p>
                </div>
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">{totals.categories}</p>
                  <p className="text-xs text-white/72">Categories</p>
                </div>
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">{totals.catalogPages}</p>
                  <p className="text-xs text-white/72">Pages</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-14">
          <div className="container-shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Catalog sections</p>
                <h2 className="mt-2 text-3xl font-black text-primary md:text-5xl">Open product browsing</h2>
              </div>
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-bold text-primary transition hover:border-primary/30 hover:bg-muted"
              >
                View all products
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <CategoryCard key={category.slug} category={category} />
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" className="border-y border-border bg-surface py-14">
          <div className="container-shell grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Capabilities</p>
              <h2 className="mt-2 text-3xl font-black text-primary md:text-5xl">
                Built for project purchasing, not public checkout.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-steel">
                The website shows the catalog clearly, then moves serious buyers into a quote workflow where the team can verify availability, specifications, quantities, and delivery details.
              </p>
            </div>
            <div className="grid gap-4">
              {capabilities.map((item) => (
                <article key={item.title} className="grid gap-3 rounded-lg border border-border bg-white p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
                    <item.icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-black text-primary">{item.title}</h3>
                  <p className="text-sm leading-7 text-steel">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background py-14">
          <div className="container-shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Featured products</p>
                <h2 className="mt-2 text-3xl font-black text-primary md:text-5xl">Ready for quote selection</h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="border-y border-border bg-primary py-14 text-white">
          <div className="container-shell">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Reference catalog</p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">Catalog pages remain visible for technical detail</h2>
              <p className="mt-4 text-base leading-8 text-white/78">
                Product images are imported from the catalog references so buyers can inspect visual detail before requesting a quote.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {catalogPages.map((page) => (
                <article key={page.id} className="overflow-hidden rounded-lg border border-white/16 bg-white">
                  <div className="relative aspect-[3/4] bg-white">
                    <Image
                      src={page.imagePath}
                      alt={page.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                  <div className="border-t border-border p-3 text-primary">
                    <p className="text-sm font-bold">{page.title}</p>
                    <p className="mt-1 text-xs text-steel">Source page {page.pageNumber}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
