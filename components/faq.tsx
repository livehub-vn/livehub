"use client";

import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

const faqs = [
  {
    question: "LiveHub làm gì?",
    answer:
      "LiveHub kết nối người cần livestream với nhà cung cấp dịch vụ. Bạn có thể tìm dịch vụ hoặc đăng nhu cầu.",
  },
  {
    question: "Tin đăng có được duyệt không?",
    answer: "Có. LiveHub kiểm tra nội dung trước khi công khai.",
  },
  {
    question: "Tôi bắt đầu từ đâu?",
    answer: "Xem dịch vụ có sẵn. Đăng nhập để gửi yêu cầu hoặc đăng nhu cầu.",
  },
];

const ease = [0.23, 1, 0.32, 1] as const;

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease, delay: index * 0.05 }}
      onClick={onToggle}
      className="bg-frame cursor-pointer rounded-2xl p-5 shadow-sm sm:p-6"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={isOpen}
    >
      <div className="flex w-full items-center justify-between gap-4 text-left">
        <span className="text-foreground text-base font-medium sm:text-lg">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease }}
          className="shrink-0"
        >
          <ChevronDown className="text-muted-foreground h-5 w-5" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="text-muted-foreground pt-4 text-sm leading-relaxed sm:text-base">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ(): ReactNode {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 xl:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center sm:mb-16"
        >
          <span className="text-muted-foreground text-sm font-medium">
            Câu hỏi thường gặp
          </span>
          <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            LiveHub, luôn sẵn sàng hỗ trợ
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base sm:text-lg">
            Ba câu trả lời trước khi bắt đầu.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/services"
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              Xem dịch vụ
            </Link>
            <Link
              href="/pricing"
              className="border-border bg-frame text-foreground inline-flex items-center rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              Xem bảng giá
            </Link>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3" role="list">
          {faqs.map((faq, index) => (
            <FAQItem
              key={faq.question}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
