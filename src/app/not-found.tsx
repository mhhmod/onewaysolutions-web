import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-20">
        <div className="container-shell max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">Not found</p>
          <h1 className="mt-3 text-4xl font-black text-primary md:text-6xl">This page is not in the catalog</h1>
          <p className="mt-4 text-base leading-8 text-steel">
            The item may have moved, or the link may be incomplete. Return to the catalog to continue browsing.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex min-h-12 items-center rounded-md bg-accent px-5 text-sm font-black text-white hover:bg-accent/90"
          >
            Open catalog
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
