"use client";

import { Footer } from "@/components/footer";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function FooterWrapper(): ReactNode {
  const pathname = usePathname();

  // Don't render footer on admin screens
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <Footer />;
}
