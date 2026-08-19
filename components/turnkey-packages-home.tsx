"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const turnkeyPackages = [
  {
    id: "ecommerce",
    name: "Gói Livestream Bán Hàng E-Commerce",
    badge: "Bán chạy nhất",
    price: 5500000,
    unit: "/ ca 4 tiếng",
    suitableFor:
      "Shop thời trang, mỹ phẩm, đồ gia dụng bán hàng trên TikTok Shop, Shopee Live, Facebook Live.",
    image: "/brand/3d/package-ecommerce-3d.jpg",
    features: [
      "1-2 Máy quay Sony 4K chuyên dụng góc cận & góc toàn",
      "Bộ đèn Key Light, Fill Light & RGB tạo chiều sâu",
      "Hệ thống Micro không dây lọc tạp âm DJI Mic 2",
      "1 Kỹ thuật viên vận hành phần mềm OBS/vMix chuyên nghiệp",
    ],
  },
  {
    id: "talkshow",
    name: "Gói Talkshow & Hội Thảo Doanh Nghiệp",
    badge: "Khuyên dùng cho Doanh nghiệp",
    price: 12500000,
    unit: "/ buổi",
    suitableFor:
      "Tọa đàm chuyên gia, hội thảo quốc tế, lễ ký kết hợp tác, webinar đa điểm cầu qua Zoom/Teams.",
    image: "/brand/3d/package-talkshow-3d.jpg",
    features: [
      "2-3 Máy quay Sony FX3/FX6 chuẩn điện ảnh đa góc bắt cảm xúc",
      "Bàn trộn hình chuyên dụng Blackmagic ATEM Mini Extreme ISO",
      "Hệ thống âm thanh mixer kỹ thuật số chống vang vọng tuyệt đối",
      "2 Kỹ thuật viên điều khiển hình ảnh và âm thanh chuyên sâu",
    ],
  },
  {
    id: "mega-event",
    name: "Gói Sự Kiện Ra Mắt & Đại Nhạc Hội Mega Event",
    badge: "Quy mô lớn & Truyền hình",
    price: 28000000,
    unit: "/ sự kiện",
    suitableFor:
      "Đại nhạc hội, lễ hội âm nhạc, lễ ra mắt sản phẩm thương hiệu, gala vinh danh 500+ khách mời.",
    image: "/brand/3d/package-mega-event-3d.jpg",
    features: [
      "4-6 Máy quay chuyên dụng (Cần cẩu Crane 7m, Gimbal, Tele lens, Flycam)",
      "Kết nối màn hình LED sân khấu P2.5 siêu sắc nét",
      "Bộ truyền dẫn không dây cáp quang cự ly xa không trễ",
      "Đạo diễn hình ảnh + Ekip kỹ thuật 8+ nhân sự túc trực",
    ],
  },
];

export function TurnkeyPackagesHome(): ReactNode {
  return (
    <section className="relative border-t border-border bg-background py-20 text-foreground">
      <div className="mx-auto max-w-6xl px-4 xl:px-0">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
              <Zap className="size-3.5 text-orange-500 fill-orange-500" />
              <span>Giải pháp trọn gói A-Z</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Dịch vụ livestream <AuroraText>trọn gói chuẩn 4K</AuroraText>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
              Giải pháp toàn diện từ thiết bị Sony điện ảnh, âm thanh, ánh sáng đến ekip kỹ thuật viên chuyên nghiệp bảo chứng buổi phát sóng hoàn hảo.
            </p>
          </div>

          <Link
            href="/packages"
            className="group inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-orange-500 hover:text-orange-500"
          >
            <span>Xem chi tiết tất cả gói</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3D Package Cards Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {turnkeyPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="group flex flex-col justify-between rounded-[2.5rem] border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:p-5"
            >
              <div>
                {/* 3D Asset Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted/50">
                  <Image
                    src={pkg.image}
                    alt={pkg.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3.5 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-0.5 text-[11px] font-bold text-white shadow-md">
                    <Sparkles className="size-3" />
                    {pkg.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-3.5 px-2 pt-5 sm:px-3 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-bold leading-snug text-foreground">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {pkg.suitableFor}
                  </p>

                  <div className="border-t border-border/60 pt-3">
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
                      Bao gồm nổi bật:
                    </span>
                    <ul className="space-y-2">
                      {pkg.features.map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-foreground/90 leading-tight"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="px-2 pt-6 pb-1 sm:px-3 sm:pb-2">
                <div className="mb-4 flex items-baseline justify-between border-t border-border/60 pt-4">
                  <span className="text-xs text-muted-foreground font-medium">Chi phí trọn gói</span>
                  <div>
                    <span className="text-lg font-extrabold text-orange-500">
                      {pkg.price.toLocaleString("vi-VN")} đ
                    </span>
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      {pkg.unit}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/packages#${pkg.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-[0.98]"
                >
                  <span>Đặt lịch tư vấn gói này</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
