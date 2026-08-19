"use client";

import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";
import { AuroraText } from "@/components/ui/aurora-text";

const marketplaceUrl = "/services";
const demandsUrl = "/demands";

const ease = [0.23, 1, 0.32, 1] as const;

export function ProductionKit(): ReactNode {
  return (
    <section
      id="bo-cong-cu"
      className="bg-background relative overflow-hidden py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4 xl:px-0">
        {/* Section Header */}
        <div className="mb-12 max-w-2xl">
          <motion.h2
            className="text-foreground text-2xl font-semibold sm:text-3xl lg:text-4xl"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease }}
          >
            Hai phía, <AuroraText>một nền tảng.</AuroraText>
          </motion.h2>

          <motion.p
            className="text-muted-foreground mt-3 text-base leading-relaxed sm:text-lg"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
          >
            Nơi thương hiệu và nhà sản xuất tìm thấy nhau, đồng hành trọn vẹn
            trong từng buổi livestream.
          </motion.p>
        </div>

        {/* Bento Grid Layout: 1 Rectangle + 2 Squares */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. RECTANGLE CARD (Full Row / Spans 2 Columns) - Một Nền Tảng */}
          <motion.a
            href={marketplaceUrl}
            aria-label="Một nền tảng LiveHub kết nối hai phía"
            className="group relative min-h-[22rem] overflow-hidden rounded-[2.5rem] border border-neutral-800 bg-neutral-950 p-8 text-white sm:min-h-[24rem] sm:p-10 lg:col-span-2 lg:min-h-[26rem] lg:p-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease }}
            whileHover={{ y: -4 }}
          >
            {/* Background Gradient Orbs */}
            <div
              className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-orange-500/15 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-amber-500/15 blur-3xl"
              aria-hidden="true"
            />

            {/* Text Content */}
            <div className="relative z-10 max-w-xl lg:max-w-lg">
              <h3 className="text-xl leading-tight font-medium sm:text-2xl lg:text-3xl">
                Trung tâm kết nối & theo dõi tiến trình
              </h3>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-400 sm:text-base">
                LiveHub bảo chứng chất lượng dịch vụ và đồng hành cùng hai bên
                từ ý tưởng đến khi đèn đỏ bật sáng.
              </p>

              {/* Feature Highlights */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-neutral-300">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
                  <CheckCircle2 className="size-3.5 text-orange-400" />
                  Kiểm duyệt nội dung
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
                  <CheckCircle2 className="size-3.5 text-orange-400" />
                  Theo dõi tiến trình kết nối
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
                  <CheckCircle2 className="size-3.5 text-orange-400" />
                  Minh bạch chi phí
                </span>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-neutral-950 transition-colors group-hover:bg-orange-400">
                <span>Khám phá nền tảng</span>
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>

            {/* Absolute Bottom-Right Inset 3D Art (Bleeds past bottom-right edge & clipped by overflow-hidden) */}
            <div className="pointer-events-none absolute -right-6 -bottom-6 z-0 h-[70%] w-[85%] sm:-right-10 sm:-bottom-10 sm:h-[85%] sm:w-[60%] lg:-right-12 lg:-bottom-12 lg:h-[105%] lg:w-[52%]">
              <motion.div
                className="relative size-full"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4, ease }}
              >
                <Image
                  src="/brand/3d/livehub-production-kit-3d.png"
                  alt="Minh hoạ 3D nền tảng LiveHub kết nối hai bên"
                  fill
                  sizes="(max-width: 1024px) 90vw, 30rem"
                  className="translate-x-6 translate-y-6 scale-125 object-contain object-bottom-right sm:translate-x-10 sm:translate-y-10 sm:scale-135 lg:translate-x-12 lg:translate-y-12 lg:scale-140"
                />
              </motion.div>
            </div>
          </motion.a>

          {/* 2. SQUARE CARD 1 (Side 1) - Khách Hàng */}
          <motion.a
            href={marketplaceUrl}
            aria-label="Khách hàng: Tìm dịch vụ và đăng nhu cầu trên LiveHub"
            className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[2.5rem] border border-neutral-800 bg-neutral-900 p-7 text-white sm:p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, delay: 0.08, ease }}
            whileHover={{ y: -4 }}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-3 text-xs font-semibold text-orange-400">
                    Khách hàng · 01
                  </p>
                  <h3 className="max-w-[14rem] text-lg leading-snug font-medium sm:text-xl lg:text-2xl">
                    Tìm dịch vụ. Đăng nhu cầu.
                  </h3>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 transition-colors duration-300 group-hover:bg-white group-hover:text-neutral-950">
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-neutral-400">
                Lựa chọn nhân sự, thiết bị ưng ý và khởi tạo dự án trong vài cú
                nhấp.
              </p>
            </div>

            {/* Absolute Bottom-Right Inset 3D Art (Bleeds past bottom-right edge & clipped by overflow-hidden) */}
            <div className="pointer-events-none absolute -right-8 -bottom-8 z-0 h-[75%] w-[80%] sm:-right-10 sm:-bottom-10 sm:h-[80%] sm:w-[85%]">
              <motion.div
                className="relative size-full"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4, ease }}
              >
                <Image
                  src="/brand/3d/livehub-customer-flow-3d.png"
                  alt="Minh hoạ 3D luồng tìm dịch vụ dành cho khách hàng"
                  fill
                  sizes="(max-width: 1024px) 90vw, 24rem"
                  className="translate-x-8 translate-y-8 scale-130 object-contain object-bottom-right sm:translate-x-10 sm:translate-y-10 sm:scale-140"
                />
              </motion.div>
            </div>
          </motion.a>

          {/* 3. SQUARE CARD 2 (Side 2) - Nhà Cung Cấp */}
          <motion.a
            href={demandsUrl}
            aria-label="Nhà cung cấp: Đăng dịch vụ và tìm dự án trên LiveHub"
            className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[2.5rem] bg-orange-500 p-7 text-neutral-950 sm:p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, delay: 0.16, ease }}
            whileHover={{ y: -4 }}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-3 text-xs font-semibold text-orange-950/70">
                    Nhà cung cấp · 02
                  </p>
                  <h3 className="max-w-[14rem] text-lg leading-snug font-medium sm:text-xl lg:text-2xl">
                    Đăng dịch vụ. Tìm dự án.
                  </h3>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-950/30 transition-colors duration-300 group-hover:bg-neutral-950 group-hover:text-white">
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 max-w-[16rem] text-sm leading-relaxed font-medium text-orange-950/80">
                Tỏa sáng năng lực chuyên môn và nhận lời mời hợp tác trực tiếp.
              </p>
            </div>

            {/* Absolute Bottom-Right Inset 3D Art (Bleeds past bottom-right edge & clipped by overflow-hidden) */}
            <div className="pointer-events-none absolute -right-8 -bottom-8 z-0 h-[75%] w-[80%] sm:-right-10 sm:-bottom-10 sm:h-[80%] sm:w-[85%]">
              <motion.div
                className="relative size-full"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4, ease }}
              >
                <Image
                  src="/brand/3d/livehub-provider-flow-3d.png"
                  alt="Minh hoạ 3D luồng đăng dịch vụ dành cho nhà cung cấp"
                  fill
                  sizes="(max-width: 1024px) 90vw, 24rem"
                  className="translate-x-8 translate-y-8 scale-130 object-contain object-bottom-right sm:translate-x-10 sm:translate-y-10 sm:scale-140"
                />
              </motion.div>
            </div>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
