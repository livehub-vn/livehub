"use client";

import {
  BriefcaseBusiness,
  Clapperboard,
  Megaphone,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, type ReactNode } from "react";

const useCases = [
  {
    label: "Livestream bán hàng",
    title: "Hoàn thiện buổi live bán hàng mà không phải tự ghép từng bên.",
    description:
      "Tìm máy quay, ánh sáng, âm thanh, kỹ thuật viên và dịch vụ sản xuất trọn gói trên cùng một nền tảng.",
    icon: ShoppingBag,
  },
  {
    label: "Chiến dịch thương hiệu",
    title: "Tìm đúng ê-kíp và thiết bị cho màn ra mắt đáng nhớ.",
    description:
      "Đăng nhu cầu sản xuất, xác định phạm vi và ngân sách, rồi kết nối với nhà cung cấp phù hợp.",
    icon: Megaphone,
  },
  {
    label: "Sự kiện doanh nghiệp",
    title: "Bảo đảm hỗ trợ kỹ thuật phù hợp cho mọi sự kiện nội bộ.",
    description:
      "Khám phá studio, kỹ thuật viên và gói sản xuất cho webinar, hội nghị toàn công ty và sự kiện hybrid.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Nội dung sáng tạo",
    title: "Nâng cấp khỏi thiết lập cá nhân khi buổi live cần nhiều hơn.",
    description:
      "Bổ sung thiết bị, kỹ thuật viên chuyên môn hoặc cả đội ngũ sản xuất, đồng thời quản lý nhu cầu và đặt dịch vụ tại một nơi.",
    icon: Clapperboard,
  },
];

export function Testimonials(): ReactNode {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % useCases.length);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="border-accent/15 bg-frame w-full border-t border-b px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16 text-4xl leading-tight font-medium text-neutral-900 sm:text-5xl lg:mb-20 lg:text-6xl dark:text-neutral-50"
        >
          Cho mọi định dạng livestream
        </motion.h2>

        <div className="mb-16 grid gap-8 lg:mb-20 lg:grid-cols-2 lg:gap-12">
          <div
            className="flex items-center justify-start gap-4 lg:gap-6"
            role="tablist"
            aria-label="Các tình huống sử dụng livestream"
          >
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;

              return (
                <motion.button
                  key={useCase.label}
                  type="button"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: activeIndex === index ? 1.1 : 0.9,
                    opacity: activeIndex === index ? 1 : 0.6,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="relative cursor-pointer"
                  role="tab"
                  aria-selected={activeIndex === index}
                  aria-label={useCase.label}
                  tabIndex={activeIndex === index ? 0 : -1}
                  onClick={() => setActiveIndex(index)}
                >
                  <div
                    className={`relative flex size-12 items-center justify-center overflow-hidden rounded-full border transition-colors duration-500 sm:size-16 lg:size-20 ${
                      activeIndex === index
                        ? "border-accent bg-accent text-neutral-950"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <Icon
                      className="size-5 sm:size-7 lg:size-8"
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </div>

                  {activeIndex === index && (
                    <svg
                      className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90"
                      viewBox="0 0 100 100"
                      aria-hidden="true"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="1.5"
                        opacity="0.2"
                      />
                      <motion.circle
                        key={`progress-${activeIndex}`}
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="1.5"
                        strokeDasharray={`${2 * Math.PI * 48}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 10, ease: "linear" }}
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div
            className="flex flex-col justify-center"
            role="tabpanel"
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              {useCases[activeIndex] && (
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-accent mb-3 text-sm font-medium">
                    {useCases[activeIndex].label}
                  </p>
                  <h3 className="mb-5 text-2xl leading-tight font-medium text-neutral-900 sm:text-3xl dark:text-neutral-100">
                    {useCases[activeIndex].title}
                  </h3>
                  <p className="text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
                    {useCases[activeIndex].description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {useCases.map((useCase, index) => {
            const isActive = activeIndex === index;

            return (
              <motion.button
                key={useCase.label}
                type="button"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => setActiveIndex(index)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {useCase.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
