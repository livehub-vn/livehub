"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuroraText } from "@/components/ui/aurora-text";

const footerLinks = {
  marketplace: [
    {
      label: "Khám phá dịch vụ",
      href: "/services",
    },
    {
      label: "Dịch vụ livestream trọn gói",
      href: "/packages",
    },
    {
      label: "Tìm dự án phù hợp",
      href: "/demands",
    },
    {
      label: "Đăng nhu cầu",
      href: "/demands/new",
    },
    {
      label: "Quản lý dịch vụ đã thuê",
      href: "/rentals",
    },
  ],
  platform: [
    { label: "Bảng giá gói thành viên", href: "/pricing" },
    { label: "Cách LiveHub vận hành", href: "#bo-cong-cu" },
    { label: "Quy trình đảm bảo", href: "#how-it-works" },
    { label: "Câu hỏi thường gặp", href: "#faq" },
  ],
  account: [
    {
      label: "Trang cá nhân",
      href: "/profile",
    },
    { label: "Đăng nhập", href: "/login" },
  ],
};

export function Footer(): ReactNode {
  return (
    <footer className="relative mx-2.5 mt-24 pt-38 max-[850px]:mx-0">
      <div className="absolute top-0 left-1/2 w-full max-w-6xl -translate-x-1/2 px-6">
        <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl/15">
          <div
            className="absolute inset-0 scale-125 bg-center bg-no-repeat blur brightness-150"
            style={{ backgroundImage: "url(/BG.jpg)", backgroundSize: "150%" }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center px-12 py-24 text-center max-[850px]:px-6 max-[850px]:py-6 max-[850px]:pt-12">
            <h2 className="mb-14 max-w-2xl text-3xl font-medium text-black max-[850px]:mb-8 sm:text-4xl lg:text-5xl">
              Giải pháp livestream toàn diện cùng{" "}
              <AuroraText>LiveHub</AuroraText>.
            </h2>

            <div className="flex w-full items-center justify-center gap-3 max-[850px]:flex-col">
              <Link
                href="/services"
                className="group flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-neutral-800 max-[850px]:w-full"
              >
                Xem dịch vụ
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/demands/new"
                className="flex items-center justify-center rounded-xl border border-black/10 bg-white/85 px-6 py-3.5 text-sm font-medium text-neutral-900 shadow-lg backdrop-blur-sm transition-colors hover:bg-white max-[850px]:w-full"
              >
                Đăng nhu cầu
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-accent rounded-tl-[3rem] rounded-tr-[3rem] pt-96 pb-16 max-[850px]:pt-72">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-start justify-between gap-12 max-[850px]:flex-col max-[850px]:gap-10">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label="Trang chủ sàn dịch vụ LiveHub"
            >
              <Image
                src="/brand/livehub-mark-white.png"
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
              />
              <span className="text-xl leading-none font-semibold text-white">
                <AuroraText
                  colors={["#ffffff", "#ffedd5", "#fed7aa", "#ffffff"]}
                >
                  LiveHub
                </AuroraText>
              </span>
            </Link>

            <nav
              className="flex gap-16 max-[850px]:flex-wrap max-[850px]:gap-10"
              aria-label="Điều hướng cuối trang"
            >
              <div>
                <h3 className="mb-4 text-sm font-bold text-white">
                  Sàn dịch vụ
                </h3>
                <ul className="space-y-2.5">
                  {footerLinks.marketplace.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-bold text-white">
                  Khám phá & Nền tảng
                </h3>
                <ul className="space-y-2.5">
                  <li>
                    <Link
                      href="/explore"
                      className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                    >
                      Khám phá hệ sinh thái
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/explore#studios"
                      className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                    >
                      Studio & Đối tác nổi bật
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/explore#process"
                      className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                    >
                      Quy trình đảm bảo chất lượng
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-bold text-white">
                  Tài khoản & Quản lý
                </h3>
                <ul className="space-y-2.5">
                  {footerLinks.account.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <div className="mt-16 border-t border-white/10 pt-6">
            <p className="text-center text-sm text-white/70">
              © {new Date().getFullYear()} LiveHub. Đồng hành cùng những buổi
              livestream chuyên nghiệp.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
