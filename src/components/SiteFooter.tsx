import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "/admin";

  return (
    <footer id="contact" className="border-t border-border bg-primary text-white">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Logo compact />
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/76">
            Industrial electrical, solar, fire safety, telecom, and control solutions with open catalog browsing and quote requests.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold">Contact</h2>
          <div className="mt-4 space-y-3 text-sm text-white/78">
            <a className="flex min-h-8 gap-3" href="tel:+201003094000">
              <Phone size={17} aria-hidden="true" />
              +2 0100 309 4000
            </a>
            <a className="flex min-h-8 gap-3" href="mailto:mohamed.sabry@onewaysolutions-eg.com">
              <Mail size={17} aria-hidden="true" />
              mohamed.sabry@onewaysolutions-eg.com
            </a>
            <p className="flex min-h-8 gap-3">
              <MapPin size={17} aria-hidden="true" />
              109 H, Hadaek Al Haram, Haram, Giza
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold">Catalog</h2>
          <div className="mt-4 grid gap-1 text-sm text-white/78">
            <Link className="inline-flex min-h-8 items-center" href="/products">All products</Link>
            <Link className="inline-flex min-h-8 items-center" href="/quote">Quote request</Link>
            <Link className="inline-flex min-h-8 items-center" href={adminUrl}>Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
