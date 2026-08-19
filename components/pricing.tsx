"use client";

import {
  ArrowUpRight,
  Check,
  FileText,
  Search,
  Store,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

const marketplacePaths: Array<{
  audience: string;
  name: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  icon: LucideIcon;
  featured: boolean;
}> = [
  {
    audience: "Dành cho khách hàng",
    name: "Tìm giải pháp sản xuất",
    description:
      "Khám phá thiết bị, đội ngũ sản xuất, studio và dịch vụ livestream đang được đăng trên LiveHub.",
    features: [
      "Khám phá các tin dịch vụ công khai",
      "Xem chi tiết tin đăng và khoảng giá",
      "Gửi yêu cầu thuê dịch vụ",
    ],
    cta: "Khám phá dịch vụ",
    href: "/services",
    icon: Search,
    featured: true,
  },
  {
    audience: "Dành cho nhà cung cấp",
    name: "Đăng dịch vụ của bạn",
    description:
      "Giới thiệu thiết bị, studio, đội ngũ sản xuất hoặc năng lực sản xuất tới người đang chuẩn bị một sự kiện livestream.",
    features: [
      "Tạo tin dịch vụ kèm hình ảnh",
      "Thêm danh mục, khoảng giá và ngày khả dụng",
      "Quản lý tin đăng trong mục Dịch vụ của tôi",
    ],
    cta: "Đăng dịch vụ",
    href: "/services/new",
    icon: Store,
    featured: false,
  },
  {
    audience: "Dành cho nhu cầu riêng",
    name: "Đăng nhu cầu sản xuất",
    description:
      "Mô tả buổi phát sóng bạn đang lên kế hoạch để nhà cung cấp phù hợp có thể tìm thấy và phản hồi.",
    features: [
      "Nêu rõ phạm vi và chọn danh mục",
      "Thêm ngân sách, thời gian, thông tin liên hệ và tệp đính kèm",
      "Nhận đơn ứng tuyển qua tin nhu cầu",
    ],
    cta: "Đăng nhu cầu",
    href: "/demands/new",
    icon: FileText,
    featured: false,
  },
];

const ease = [0.23, 1, 0.32, 1] as const;

function MarketplacePathCard({
  path,
  index,
}: {
  path: (typeof marketplacePaths)[number];
  index: number;
}): ReactNode {
  const Icon = path.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease, delay: index * 0.1 }}
      className="relative"
    >
      {path.featured && (
        <div
          className="bg-accent absolute -inset-1 rounded-[1.2em]"
          aria-hidden="true"
        />
      )}

      <div
        className={`bg-frame relative flex h-full flex-col rounded-2xl p-6 sm:p-8 ${
          path.featured ? "" : "border-border border"
        }`}
      >
        {path.featured && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-accent inline-block rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap text-black/80">
              Bắt đầu tại đây
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground text-sm font-medium">
            {path.audience}
          </span>
          <span className="bg-muted text-foreground flex size-11 items-center justify-center rounded-xl">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </div>

        <h3 className="text-foreground mt-6 text-2xl font-semibold tracking-tight">
          {path.name}
        </h3>
        <p className="text-muted-foreground mt-3 min-h-20 text-sm leading-relaxed">
          {path.description}
        </p>

        <motion.a
          href={path.href}
          target="_blank"
          rel="noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`mt-6 flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
            path.featured
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "bg-muted text-foreground hover:bg-muted/80"
          }`}
        >
          {path.cta}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </motion.a>

        <div className="border-border mt-8 border-t pt-6">
          <p className="text-muted-foreground text-sm font-medium">
            Bạn có thể
          </p>
          <ul className="mt-4 space-y-3">
            {path.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check
                  className="text-foreground mt-0.5 h-4 w-4 shrink-0"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <span className="text-foreground text-sm leading-relaxed">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing(): ReactNode {
  return (
    <section
      id="solutions"
      className="bg-background w-full scroll-mt-24 px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center sm:mb-16"
        >
          <span className="text-muted-foreground text-sm font-medium">
            Ba cách tham gia
          </span>
          <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Chọn cách bạn sử dụng LiveHub
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base sm:text-lg">
            Tìm hỗ trợ cho buổi phát sóng sắp tới, giới thiệu năng lực sản xuất
            hoặc đăng nhu cầu để nhà cung cấp phản hồi.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {marketplacePaths.map((path, index) => (
            <MarketplacePathCard key={path.name} path={path} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
