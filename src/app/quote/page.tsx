import { EnvNotice } from "@/components/EnvNotice";
import { QuoteRequestPanel } from "@/components/QuoteRequestPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Request Quote"
};

export default function QuotePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-10">
        <div className="container-shell grid gap-6">
          <EnvNotice mode="quote" />
          <QuoteRequestPanel />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
