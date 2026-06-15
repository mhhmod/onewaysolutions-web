import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, FileText, ShieldCheck, Zap } from "lucide-react";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogPages } from "@/lib/catalog";
import { getCatalogTotals, getCategories, getFeaturedProducts } from "@/lib/catalog-db";

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

const heroTiles = [
  {
    src: "/catalog/02_ecommerce_candidate_images/distribution_panels/p06_img07_distribution_panels_759x433.jpeg",
    alt: "Electrical distribution panels ready for project installation",
    label: "Distribution panels",
    featured: true
  },
  {
    src: "/catalog/02_ecommerce_candidate_images/cable_trays/p34_img02_cable_trays_669x465.png",
    alt: "Galvanized cable tray fitting",
    label: "Cable trays"
  },
  {
    src: "/catalog/02_ecommerce_candidate_images/electrical_accessories/p57_img11_electrical_accessories_600x600.jpeg",
    alt: "Assorted colored cable ties",
    label: "Electrical accessories"
  },
  {
    src: "/catalog/02_ecommerce_candidate_images/fire_fighting_cabinets/p26_img03_fire_fighting_cabinets_1309x984.jpeg",
    alt: "Red fire fighting cabinets in production",
    label: "Fire cabinets"
  }
];

export const revalidate = 120;

export default async function HomePage() {
  const [categories, featuredProducts, totals] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getCatalogTotals()
  ]);
  const catalogPages = getCatalogPages().slice(5, 9);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-primary/20 bg-primary text-white">
          <div className="industrial-grid absolute inset-0 -z-10 opacity-35" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-background" />
          <div className="container-shell grid min-h-[72svh] content-center gap-10 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-center">
            <div className="max-w-4xl pb-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">
                Industrial catalog and quote requests
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-white md:text-7xl">
                One Way Solutions
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/86">
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
              <dl className="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-lg border border-white/18 bg-white/6">
                <div className="border-e border-white/14 p-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-white/62">Products</dt>
                  <dd className="mt-1 text-2xl font-black text-white">{totals.products}</dd>
                </div>
                <div className="border-e border-white/14 p-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-white/62">Categories</dt>
                  <dd className="mt-1 text-2xl font-black text-white">{totals.categories}</dd>
                </div>
                <div className="p-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-white/62">Pages</dt>
                  <dd className="mt-1 text-2xl font-black text-white">{totals.catalogPages}</dd>
                </div>
              </dl>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {heroTiles.map((tile) => (
                  <article
                    key={tile.src}
                    className={`relative overflow-hidden rounded-lg border border-white/18 bg-white shadow-industrial ${
                      tile.featured ? "aspect-[16/9] sm:col-span-2" : "aspect-[4/3]"
                    }`}
                  >
                    <Image
                      src={tile.src}
                      alt={tile.alt}
                      fill
                      priority={tile.featured}
                      sizes={tile.featured ? "(min-width: 1024px) 44vw, 92vw" : "(min-width: 1024px) 22vw, 46vw"}
                      className="object-contain p-3"
                    />
                    <span className="absolute bottom-3 start-3 rounded-md bg-primary px-3 py-1.5 text-xs font-black text-white shadow-sm">
                      {tile.label}
                    </span>
                  </article>
                ))}
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
                    <p className="mt-1 text-xs text-steel">Technical catalog reference</p>
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
