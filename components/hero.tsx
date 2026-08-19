"use client";

import { LogoLoop, type LogoItem } from "@/components/logo-loop";
import { AuroraText } from "@/components/ui/aurora-text";
import { Iphone } from "@/components/ui/iphone";
import {
  ArrowDownRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  MapPin,
  Search,
  Send,
  Store,
  UserRoundCheck,
  Wifi,
} from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactNode, type MouseEvent } from "react";

const ease = [0.23, 1, 0.32, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95, filter: "blur(8px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
};

const liveMoments = [
  { label: "Tìm dịch vụ", icon: Search },
  { label: "Đăng nhu cầu", icon: ClipboardPlus },
  { label: "Đăng dịch vụ", icon: Store },
  { label: "Gửi yêu cầu thuê", icon: Send },
  { label: "Ứng tuyển dự án", icon: UserRoundCheck },
  { label: "Nội dung được duyệt", icon: BadgeCheck },
];

const logos: LogoItem[] = liveMoments.map(({ label, icon: Icon }) => ({
  node: (
    <span className="inline-flex items-center gap-3 text-base font-medium text-black">
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </span>
  ),
  title: label,
}));

const serviceCards = [
  {
    title: "Ê-kíp sự kiện đa máy quay",
    type: "Ê-kíp + thiết bị",
    image3d: "/brand/3d/livehub-camera-3d.png",
    glow: "rgba(249,115,22,0.25)",
    tag: "Phổ biến nhất",
  },
  {
    title: "Gói studio & ánh sáng",
    type: "Sản xuất tại studio",
    image3d: "/brand/3d/livehub-production-kit-3d.png",
    glow: "rgba(245,158,11,0.25)",
    tag: "Chuẩn 4K",
  },
  {
    title: "Kỹ thuật viên livestream",
    type: "Hỗ trợ kỹ thuật",
    image3d: "/brand/3d/livehub-microphone-3d.png",
    glow: "rgba(14,165,233,0.25)",
    tag: "Linh hoạt",
  },
];

function MarketplacePreview(): ReactNode {
  const [activeCard, setActiveCard] = useState(0);
  const currentCard = serviceCards[activeCard] ?? serviceCards[0]!;

  const nextCard = () => {
    setActiveCard((prev) => (prev + 1) % serviceCards.length);
  };

  const prevCard = () => {
    setActiveCard((prev) => (prev - 1 + serviceCards.length) % serviceCards.length);
  };

  return (
    <div
      className="overflow-hidden bg-neutral-950 text-neutral-50"
      role="img"
      aria-label="Bản xem trước sàn dịch vụ livestream LiveHub"
    >
      <div className="flex items-center justify-between gap-5 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/brand/livehub-mark.png"
            alt=""
            width={40}
            height={40}
            className="size-8 sm:size-9 object-contain"
            aria-hidden="true"
          />
          <div className="leading-tight">
            <p className="text-sm font-medium">LiveHub</p>
            <p className="text-[10px] text-neutral-500">
              Sàn dịch vụ livestream
            </p>
          </div>
        </div>

        <div className="hidden max-w-sm min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-neutral-500 sm:flex">
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Tìm thiết bị, ê-kíp, studio...</span>
        </div>

        <Link
          href="/demands/new"
          className="bg-accent rounded-lg px-3 py-1.5 sm:py-2 text-xs font-medium text-neutral-950 hover:opacity-90 transition-opacity"
        >
          Đăng nhu cầu
        </Link>
      </div>

      <div className="grid min-h-96 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          <div className="mb-4 sm:mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold text-orange-400">
                Dịch vụ đã được duyệt
              </p>
              <h3 className="text-lg font-medium sm:text-2xl">
                Dịch vụ cho buổi live tiếp theo
              </h3>
            </div>
            <Link href="/services" className="hidden text-xs text-orange-400 hover:text-orange-300 sm:inline transition-colors font-medium">
              Xem tất cả dịch vụ →
            </Link>
          </div>

          {/* Desktop Grid (3 blocks) */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-3">
            {serviceCards.map(({ title, type, image3d, glow }) => (
              <Link
                key={title}
                href="/services"
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 transition-all duration-300 hover:border-orange-500/40 hover:bg-white/[0.08]"
              >
                <div
                  className="relative mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-white/5 p-2 transition-transform duration-500 group-hover:scale-105"
                  style={{
                    boxShadow: `0 4px 20px ${glow}`,
                  }}
                >
                  <Image
                    src={image3d}
                    alt={title}
                    width={200}
                    height={150}
                    className="h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1"
                  />
                </div>
                <p className="text-sm leading-snug font-medium text-neutral-100 group-hover:text-orange-400 transition-colors">{title}</p>
                <p className="mt-1 text-[11px] text-neutral-400">{type}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-neutral-500">
                  <MapPin className="size-3" aria-hidden="true" />
                  Thành phố Hồ Chí Minh
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile Responsive 1-Block Carousel */}
          <div className="block sm:hidden">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCard}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <Link
                    href="/services"
                    className="group block relative overflow-hidden rounded-2xl border border-orange-500/30 bg-white/5 p-3.5 shadow-lg"
                  >
                    <div
                      className="relative mb-3 flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-white/5 p-3"
                      style={{
                        boxShadow: `0 4px 24px ${currentCard.glow}`,
                      }}
                    >
                      <span className="absolute top-2 right-2 rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-semibold text-orange-300 border border-orange-500/30">
                        {currentCard.tag}
                      </span>
                      <Image
                        src={currentCard.image3d}
                        alt={currentCard.title}
                        width={220}
                        height={160}
                        className="h-full w-full object-contain drop-shadow-2xl"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm leading-snug font-medium text-neutral-100 group-hover:text-orange-400 transition-colors">
                          {currentCard.title}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {currentCard.type}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-orange-400">
                        Chi tiết →
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] text-neutral-400">
                      <MapPin className="size-3 text-orange-400" aria-hidden="true" />
                      Thành phố Hồ Chí Minh
                    </div>
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Mobile Carousel Indicators & Controls */}
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  {serviceCards.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveCard(idx)}
                      aria-label={`Xem dịch vụ ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeCard
                          ? "w-6 bg-orange-400"
                          : "w-1.5 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevCard}
                    aria-label="Dịch vụ trước"
                    className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-300 active:bg-white/10"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextCard}
                    aria-label="Dịch vụ tiếp theo"
                    className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-300 active:bg-white/10"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-orange-500/25 bg-orange-500/10 p-4 sm:p-5">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-orange-400 font-medium">Nhu cầu mẫu</p>
                <p className="mt-1 text-sm font-medium">
                  Livestream ra mắt sản phẩm
                </p>
              </div>
              <span className="size-2 rounded-full bg-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.8)]" />
            </div>

            <div className="relative my-3 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-neutral-900/60 border border-orange-500/20 p-2">
              <Image
                src="/brand/3d/livehub-customer-flow-3d.png"
                alt="Quy trình nhu cầu"
                width={180}
                height={100}
                className="h-full w-full object-contain drop-shadow-xl"
              />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="flex items-center gap-2 text-neutral-400">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Lịch sản xuất
                </span>
                <span className="font-medium text-neutral-200">Ngày dự kiến</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="flex items-center gap-2 text-neutral-400">
                  <Camera className="size-3.5" aria-hidden="true" />
                  Hình thức
                </span>
                <span className="font-medium text-neutral-200">Trọn gói 4K</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="flex items-center gap-2 text-neutral-400">
                  <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
                  Ngân sách
                </span>
                <span className="font-medium text-orange-400">Linh hoạt</span>
              </div>
            </div>
          </div>

          <Link
            href="/demands"
            className="mt-4 block rounded-xl bg-neutral-50 px-4 py-2.5 text-center text-xs font-semibold text-neutral-950 transition-colors hover:bg-white"
          >
            Nhận hồ sơ ứng tuyển
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileIphoneShowcase(): ReactNode {
  const [activeCard, setActiveCard] = useState(0);
  const currentCard = serviceCards[activeCard] ?? serviceCards[0]!;

  const nextCard = () => {
    setActiveCard((prev) => (prev + 1) % serviceCards.length);
  };

  const prevCard = () => {
    setActiveCard((prev) => (prev - 1 + serviceCards.length) % serviceCards.length);
  };

  return (
    <Iphone className="mx-auto max-w-[320px] sm:max-w-[360px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
      <div className="flex h-full flex-col bg-neutral-950 text-neutral-50">
        {/* iOS Top Status Bar Area */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-neutral-300">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Wifi className="size-3" />
            <div className="size-2 rounded-full bg-orange-500 animate-pulse" />
          </div>
        </div>

        {/* Mini App Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/livehub-mark.png"
              alt="LiveHub"
              width={26}
              height={26}
              className="size-6 object-contain"
            />
            <span className="text-xs font-semibold tracking-tight">LiveHub</span>
          </div>
          <Link
            href="/demands/new"
            className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-neutral-950 shadow-sm"
          >
            Đăng nhu cầu
          </Link>
        </div>

        {/* App Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 no-scrollbar">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                Dịch vụ nổi bật
              </p>
              <h4 className="text-sm font-semibold text-white">
                Buổi live tiếp theo
              </h4>
            </div>
            <Link href="/services" className="text-[10px] font-medium text-orange-400">
              Tất cả →
            </Link>
          </div>

          {/* 1 Single Card Block Responsive */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-2xl border border-orange-500/30 bg-neutral-900/90 p-3 shadow-md"
              >
                <div
                  className="relative mb-2.5 flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-neutral-950 p-2"
                  style={{
                    boxShadow: `0 4px 20px ${currentCard.glow}`,
                  }}
                >
                  <span className="absolute top-1.5 right-1.5 rounded-full bg-orange-500/25 px-2 py-0.5 text-[8px] font-semibold text-orange-300 border border-orange-500/30">
                    {currentCard.tag}
                  </span>
                  <Image
                    src={currentCard.image3d}
                    alt={currentCard.title}
                    width={160}
                    height={110}
                    className="h-full w-full object-contain drop-shadow-xl"
                  />
                </div>

                <p className="text-xs font-semibold text-white leading-tight">
                  {currentCard.title}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-400">
                  {currentCard.type}
                </p>

                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[10px]">
                  <span className="flex items-center gap-1 text-neutral-400">
                    <MapPin className="size-2.5 text-orange-400" />
                    TP. Hồ Chí Minh
                  </span>
                  <span className="font-semibold text-orange-400">
                    Đặt ngay →
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Indicator Dots & Buttons */}
            <div className="mt-2 flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1">
                {serviceCards.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCard(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === activeCard ? "w-4 bg-orange-400" : "w-1 bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevCard}
                  aria-label="Trước"
                  className="flex size-5 items-center justify-center rounded border border-white/10 bg-white/5 text-neutral-300 active:scale-95"
                >
                  <ChevronLeft className="size-2.5" />
                </button>
                <button
                  type="button"
                  onClick={nextCard}
                  aria-label="Sau"
                  className="flex size-5 items-center justify-center rounded border border-white/10 bg-white/5 text-neutral-300 active:scale-95"
                >
                  <ChevronRight className="size-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mini Flow Block */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-orange-400">Nhu cầu đang tìm</span>
              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="mt-1 text-xs font-semibold text-neutral-200">
              Livestream ra mắt sản phẩm 4K
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px] text-neutral-400">
              <div className="rounded bg-black/40 px-2 py-1">
                Lịch: <span className="text-white">Linh hoạt</span>
              </div>
              <div className="rounded bg-black/40 px-2 py-1">
                Hồ sơ: <span className="text-orange-400 font-semibold">5 ứng tuyển</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Iphone>
  );
}

const PARALLAX_INTENSITY = 20;

export function Hero(): ReactNode {
  const sectionRef = useRef<HTMLElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;

    if (window.innerWidth < 850) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const offsetX = (e.clientX - centerX) / (rect.width / 2);
    const offsetY = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(offsetX * PARALLAX_INTENSITY);
    mouseY.set(offsetY * PARALLAX_INTENSITY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex flex-col"
      style={{ colorScheme: "light" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="absolute inset-0 -z-10 rounded-br-4xl rounded-bl-4xl bg-cover bg-center bg-no-repeat brightness-125 min-[850px]:inset-2.5 min-[850px]:scale-105"
        style={{
          backgroundImage: "url(/BG.jpg)",
          x,
          y,
        }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-center px-6 pt-64 max-[850px]:pt-32">
        <motion.div
          className="flex max-w-4xl flex-col items-center text-center max-[850px]:w-full max-[850px]:items-start max-[850px]:text-left"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white py-1.5 pr-3 pl-4 text-sm font-medium text-black"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            Giải pháp livestream toàn diện
            <span className="text-accent">✦</span>
          </motion.div>

          <h1 className="mb-6 text-4xl leading-[1.15] font-medium text-black sm:text-5xl md:text-6xl lg:text-7xl">
            <motion.span
              className="block"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease }}
            >
              Giải pháp livestream
            </motion.span>
            <motion.span
              className="block"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease }}
            >
              cho{" "}
              <AuroraText className="font-serif italic">
                thương hiệu của bạn.
              </AuroraText>
            </motion.span>
          </h1>

          <motion.p
            className="mb-8 max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-300"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            Kết nối khách hàng với nhà cung cấp thiết bị & nhân sự livestream hàng đầu. Đăng nhu cầu, duyệt minh bạch và theo dõi dễ dàng.
          </motion.p>

          <motion.div
            className="flex items-center gap-3 max-[850px]:w-full max-[850px]:flex-col"
            variants={fadeInScale}
            transition={{ duration: 0.8, ease }}
          >
            <motion.a
              href="/services"
              className="group relative inline-flex items-center max-[850px]:w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="bg-accent absolute inset-y-0 right-0 w-[calc(100%-2rem)] rounded-xl max-[850px]:w-full" />
              <span className="relative z-10 rounded-xl bg-black px-6 py-3 font-medium text-white max-[850px]:flex-1">
                Xem dịch vụ
              </span>
              <span className="relative -left-px z-10 flex size-11 items-center justify-center rounded-xl text-black">
                <ArrowDownRight className="size-5 transition-transform duration-300 group-hover:-rotate-45" />
              </span>
            </motion.a>
            <motion.a
              href="/demands/new"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 bg-white/70 px-6 text-sm font-medium text-black backdrop-blur-sm max-[850px]:w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Đăng nhu cầu
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="relative mt-24 px-4 sm:px-6 max-[850px]:mt-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease }}
      >
        <div className="relative mx-auto max-w-5xl">
          {/* Desktop Marketplace Preview */}
          <div className="hidden min-[850px]:block relative overflow-hidden rounded-2xl border border-neutral-200 mask-[linear-gradient(to_bottom,black_58%,transparent_100%)] shadow-2xl/5 [-webkit-mask-image:linear-gradient(to_bottom,black_58%,transparent_100%)]">
            <MarketplacePreview />
          </div>

          {/* Mobile MagicUI iPhone Showcase */}
          <div className="block min-[850px]:hidden py-2">
            <MobileIphoneShowcase />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="pt-24 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1, ease }}
      >
        <LogoLoop logos={logos} speed={60} logoHeight={42} gap={124} />
      </motion.div>
    </section>
  );
}
