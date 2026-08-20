"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function ScrollToTopInner(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // 1. Immediately scroll window
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" as ScrollBehavior,
    });

    // 2. Also reset scroll on document root and body
    if (typeof document !== "undefined") {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    // 3. Fallback microtask in case of dynamic DOM shifts during page mount
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant" as ScrollBehavior,
      });
      if (typeof document !== "undefined") {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [pathname, searchParams]);

  return null;
}

export function ScrollToTop() {
  return (
    <Suspense fallback={null}>
      <ScrollToTopInner />
    </Suspense>
  );
}
