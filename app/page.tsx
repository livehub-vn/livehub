import { FAQ } from "@/components/faq";
import { FeaturedServices } from "@/components/featured-services";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { ProductionKit } from "@/components/production-kit";
import { createMetadata, siteConfig } from "@/lib/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = createMetadata({
  title: "Nền tảng kết nối dịch vụ livestream",
  description: siteConfig.description,
  path: "/",
});

export default function HomePage(): ReactNode {
  return (
    <main id="main-content" className="flex-1">
      <Hero />
      <FeaturedServices />
      <ProductionKit />
      <HowItWorks />
      <FAQ />
    </main>
  );
}
