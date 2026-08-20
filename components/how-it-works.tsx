"use client";

import { FileCheck2, Handshake, Search } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";
import { AuroraText } from "@/components/ui/aurora-text";

const steps = [
  {
    icon: Search,
    title: "Đăng",
    description: "Dịch vụ hoặc nhu cầu.",
  },
  {
    icon: FileCheck2,
    title: "Duyệt",
    description: "LiveHub kiểm tra nội dung trước khi công khai.",
  },
  {
    icon: Handshake,
    title: "Kết nối",
    description: "Gửi yêu cầu thuê hoặc hồ sơ ứng tuyển.",
  },
];

function StepItem({
  step,
  isLast,
}: {
  step: (typeof steps)[0];
  isLast: boolean;
}): ReactNode {
  const Icon = step.icon;

  return (
    <div
      className={`relative flex gap-5 ${isLast ? "" : "pb-28 sm:pb-40 lg:pb-52"}`}
    >
      <div
        className="bg-accent relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
      </div>

      <div className="pt-1">
        <h3 className="text-foreground text-xl font-semibold sm:text-2xl">
          {step.title === "Kết nối" ? <AuroraText>{step.title}</AuroraText> : step.title}
        </h3>
        <p className="text-foreground/60 mt-2 max-w-sm text-base leading-relaxed">
          {step.description}
        </p>
      </div>
    </div>
  );
}

export function HowItWorks(): ReactNode {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.3", "end 0.7"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="bg-background relative w-full scroll-mt-24"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-4 xl:px-0 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-48 lg:h-fit lg:self-start">
          <h2 className="text-foreground text-2xl font-semibold whitespace-nowrap sm:text-3xl lg:text-4xl">
            Đăng, Duyệt & <AuroraText>Kết nối</AuroraText>
          </h2>
          <p className="text-foreground/60 mt-6 max-w-md text-lg leading-relaxed">
            Nền tảng giúp tra cứu dịch vụ, kiểm duyệt thông tin và theo dõi tiến trình làm việc.
          </p>
          <motion.a
            href="/services"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-accent text-white hover:bg-accent/90 mt-8 inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
          >
            Xem dịch vụ
          </motion.a>
        </div>

        <div className="relative">
          <div
            className="bg-foreground/10 absolute top-6 left-6 h-[calc(100%-6rem)] w-0.5 -translate-x-1/2"
            aria-hidden="true"
          >
            <motion.div
              style={{ height: lineHeight, willChange: "height" }}
              className="bg-accent w-full"
            />
          </div>

          <ol className="relative m-0 list-none p-0">
            {steps.map((step, index) => (
              <li key={step.title}>
                <StepItem step={step} isLast={index === steps.length - 1} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
