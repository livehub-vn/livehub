"use client";

import {
  CalendarDays,
  Camera,
  CircleCheck,
  FileText,
  ListFilter,
  Search,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { motion, type Transition } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

const STARTING_POINTS: Array<{
  icon: LucideIcon;
  label: string;
  detail: string;
}> = [
  { icon: Search, label: "Khám phá", detail: "Dịch vụ" },
  { icon: FileText, label: "Đăng", detail: "Nhu cầu" },
];

const cardAnimation = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
};

const getCardTransition = (delay = 0): Transition => ({
  duration: 0.8,
  ease: EASE,
  delay,
});

function PhoneMockup({
  children,
  variant = "full",
}: {
  children: ReactNode;
  variant?: "full" | "compact";
}): ReactNode {
  const isCompact = variant === "compact";

  return (
    <div
      className={`bg-background relative z-10 overflow-hidden border-neutral-800 shadow-2xl ${
        isCompact
          ? "h-64 w-44 rounded-3xl border-4 md:h-72 md:w-48"
          : "h-96 w-56 rounded-t-4xl border-6 border-b-0 md:h-115 md:w-64"
      } `}
    >
      <div
        className={`absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-neutral-800 ${isCompact ? "h-4 w-16" : "h-5 w-20"} `}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function ProductionIconStack(): ReactNode {
  const categories = [
    { icon: Camera, label: "Thiết bị" },
    { icon: UsersRound, label: "Đội ngũ sản xuất" },
    { icon: Video, label: "Studio" },
  ];

  return (
    <div
      className="flex items-center"
      aria-label="Thiết bị, đội ngũ sản xuất và studio"
    >
      {categories.map(({ icon: Icon, label }, index) => (
        <div
          key={label}
          className={`flex size-12 items-center justify-center rounded-full border-2 border-white/30 bg-neutral-900 text-white shadow-lg ${
            index === 0 ? "" : "-ml-3"
          }`}
          title={label}
        >
          <Icon className="size-5" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </div>
      ))}
    </div>
  );
}

function StartingPoint({
  icon: Icon,
  label,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
}): ReactNode {
  return (
    <div className="bg-background flex items-center justify-between rounded-xl p-3">
      <div className="flex items-center gap-2">
        <span className="bg-accent/15 text-foreground flex size-8 items-center justify-center rounded-lg">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="text-foreground font-medium">{label}</span>
      </div>
      <span className="bg-accent/20 text-foreground rounded px-2 py-0.5 text-xs font-medium">
        {detail}
      </span>
    </div>
  );
}

function DecorativeCircles(): ReactNode {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="border-accent/80 absolute size-56 rounded-full border" />
      <div className="border-accent/60 absolute size-72 rounded-full border" />
      <div className="border-accent/40 absolute size-88 rounded-full border" />
    </div>
  );
}

function MarketplaceCardContent(): ReactNode {
  return (
    <>
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,60 Q30,40 60,50 T100,30"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <path
          d="M0,55 Q40,35 70,45 T100,25"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
        />
      </svg>

      <div className="relative z-10 flex h-full items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-neutral-900">
            Sự kiện kết hợp
          </p>
          <p className="text-base font-semibold text-neutral-900">
            đa điểm cầu
          </p>
        </div>
        <CircleCheck className="text-black opacity-25" aria-hidden="true" />
      </div>

      <div
        className="absolute bottom-3 left-5 flex items-center gap-2 text-xs text-neutral-700"
        aria-hidden="true"
      >
        <span>THIẾT BỊ</span>
        <span>•</span>
        <span>SẢN XUẤT</span>
        <span>•</span>
        <span>STUDIO</span>
      </div>
    </>
  );
}

function DiscoveryCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0)}
      className="group bg-card-primary flex min-h-140 flex-col overflow-hidden rounded-4xl p-8 pb-0 md:row-span-2"
    >
      <div className="relative z-10 mb-6 text-center transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="mb-3 text-2xl leading-tight font-medium text-neutral-900 md:text-4xl">
          Chuẩn bị trọn bộ cho buổi phát sóng
        </h3>
        <p className="text-sm text-neutral-700">
          Tìm thiết bị, đội ngũ sản xuất, studio và dịch vụ livestream chỉ với
          một lượt tìm kiếm.
        </p>
      </div>

      <div className="flex flex-1 items-end justify-center transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <PhoneMockup variant="full">
          <div className="bg-phone-screen absolute inset-0 px-5 pt-14">
            <h4 className="mt-4 text-3xl leading-none font-medium tracking-tight text-neutral-900">
              Livestream của bạn
            </h4>
            <h4 className="mb-4 text-3xl leading-none font-medium tracking-tight text-neutral-900">
              bắt đầu từ đây.
            </h4>
            <p className="mb-8 text-sm leading-snug text-neutral-500">
              Tìm dịch vụ phù hợp hoặc đăng nhu cầu sản xuất của bạn.
            </p>

            <div className="from-accent via-accent/80 to-accent/50 relative h-52 overflow-hidden rounded-2xl bg-linear-to-br p-4 shadow-xl">
              <MarketplaceCardContent />
            </div>
          </div>
        </PhoneMockup>
      </div>
    </motion.div>
  );
}

function SearchCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.1)}
      className="group bg-card-secondary relative flex min-h-80 flex-col overflow-hidden rounded-4xl p-8 md:block"
    >
      <div className="relative z-10 max-w-48 transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="text-card-foreground mb-3 text-xl leading-tight font-medium whitespace-nowrap md:text-2xl">
          Tìm đúng nhu cầu
        </h3>
        <p className="text-card-foreground-muted text-sm">
          Xem phạm vi công việc, khoảng giá, ngày khả dụng và chi tiết trước khi
          lựa chọn.
        </p>
      </div>

      <div className="relative mt-8 flex items-center justify-center self-center transition-transform duration-500 ease-out group-hover:scale-105 md:absolute md:top-1/2 md:right-12 md:mt-0 md:-translate-y-1/2 md:self-auto">
        <DecorativeCircles />

        <PhoneMockup variant="compact">
          <div className="bg-phone-screen absolute inset-0 px-3 pt-9">
            <div className="mb-3 flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2 py-1.5">
              <Search className="size-3 text-neutral-400" aria-hidden="true" />
              <span className="text-xs text-neutral-400">Tìm dịch vụ...</span>
            </div>
            <p className="mb-0.5 text-xs text-neutral-500">
              Tìm theo nhu cầu sản xuất
            </p>
            <p className="mb-3 text-xl font-medium text-neutral-900">
              Lên kế hoạch livestream
            </p>

            <div className="mb-4 flex gap-1.5">
              <span className="bg-accent rounded-full px-2.5 py-1 text-xs text-black">
                Thiết bị
              </span>
              <span className="px-2 py-1 text-xs text-neutral-400">
                Đội ngũ
              </span>
              <span className="px-2 py-1 text-xs text-neutral-400">Studio</span>
            </div>
          </div>
        </PhoneMockup>

        <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-neutral-900 px-5 py-3 whitespace-nowrap shadow-xl">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-xs text-neutral-400">Chi tiết dịch vụ</span>
            <ListFilter
              className="size-3 text-neutral-500"
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-medium text-white">
              Phạm vi · giá · lịch
            </span>
            <CalendarDays className="text-accent size-4" aria-hidden="true" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TwoSidedCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.2)}
      className="group bg-card-secondary flex min-h-64 flex-col items-center justify-center rounded-4xl p-6 text-center md:p-8"
    >
      <div className="transition-transform duration-500 ease-out group-hover:scale-110">
        <h3 className="text-card-foreground mb-1 text-2xl leading-tight font-medium md:text-3xl">
          Hai phía.
        </h3>
        <h3 className="text-card-foreground mb-5 text-2xl leading-tight font-medium md:text-3xl">
          Một buổi phát sóng.
        </h3>
      </div>

      <div className="transition-transform duration-500 ease-out group-hover:scale-105">
        <ProductionIconStack />
      </div>

      <p className="text-card-foreground-muted mt-5 max-w-52 text-xs font-medium transition-transform duration-500 ease-out group-hover:scale-105">
        Đơn vị tổ chức và nhà cung cấp gặp nhau quanh một nhu cầu sản xuất cụ
        thể.
      </p>
    </motion.div>
  );
}

function StartingPointsCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.3)}
      className="group bg-card-primary flex min-h-64 flex-col rounded-4xl p-6 md:p-8"
    >
      <div className="mb-auto transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="mb-2 text-xl leading-tight font-medium text-neutral-900 md:text-2xl">
          Bắt đầu theo cách của bạn
        </h3>
        <p className="text-sm text-neutral-700">
          Tìm dịch vụ có sẵn hoặc mô tả chính xác nhu cầu sản xuất.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        {STARTING_POINTS.map((point) => (
          <StartingPoint key={point.label} {...point} />
        ))}
      </div>
    </motion.div>
  );
}

export function FeaturesBento(): ReactNode {
  return (
    <section
      id="features"
      className="bg-background mb-32 w-full scroll-mt-24 px-6"
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10 max-w-2xl"
        >
          <span className="text-muted-foreground text-sm font-medium">
            Một hệ sinh thái sản xuất livestream
          </span>
          <h2 className="text-foreground mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Tìm đúng thiết bị. Kết nối đúng người. Sẵn sàng lên sóng.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.5fr]">
          <DiscoveryCard />
          <SearchCard />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TwoSidedCard />
            <StartingPointsCard />
          </div>
        </div>
      </div>
    </section>
  );
}
