import type { Metadata } from "next";
import { QuoteProvider } from "@/components/QuoteProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "One Way Solutions",
    template: "%s | One Way Solutions"
  },
  description:
    "Industrial electrical, solar, fire safety, telecom, and control product catalog with quote requests.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://onewaysolutions-eg.com")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QuoteProvider>{children}</QuoteProvider>
      </body>
    </html>
  );
}
