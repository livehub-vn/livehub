import type { ReactNode } from "react";

export function SkipToContent(): ReactNode {
  return (
    <a href="#main-content" className="skip-to-content">
      Chuyển đến nội dung chính
    </a>
  );
}
