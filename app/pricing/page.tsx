"use client";

import { MembershipBadge } from "@/components/membership-badge";
import { AuroraText } from "@/components/ui/aurora-text";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminEmail } from "@/lib/auth";
import {
  getMembershipPlanAction,
  isBillingCycle,
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_TIER_ORDER,
  MEMBERSHIP_TIERS,
  PAID_MEMBERSHIP_PLANS,
  resolveMembership,
  type BillingCycle,
  type MembershipPlanAction,
  type PaidMembershipTier,
} from "@/lib/membership";
import { createClient } from "@/lib/supabase/client";
import type { MembershipStatus, MembershipTier } from "@/lib/types/database";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const pricingTiers: Array<{
  id: PaidMembershipTier;
  badge: string;
  description: string;
  featured: boolean;
  features: string[];
}> = [
  {
    id: "basic",
    badge: "Cơ bản",
    description:
      "Phù hợp cho cá nhân sáng tạo nội dung, streamer và kỹ thuật viên mới bắt đầu.",
    featured: false,
    features: [
      "Đăng tối đa 5 bài dịch vụ hoặc nhu cầu dự án",
      "Tiếp cận 10.000+ khách hàng trên sàn LiveHub",
      "Phí giao dịch sàn ưu đãi 8%",
      "Thanh toán an toàn qua VietQR & Thẻ quốc tế",
      "Trợ lý ảo AI Chatbot hỗ trợ 24/7",
    ],
  },
  {
    id: "standard",
    badge: "Khuyên dùng",
    description:
      "Lựa chọn phổ biến nhất cho studio vừa, ekip kỹ thuật và đơn vị cho thuê thiết bị.",
    featured: true,
    features: [
      "Đăng tối đa 20 bài dịch vụ hoặc nhu cầu dự án",
      "Huy hiệu 'Đối tác uy tín đã kiểm duyệt'",
      "Tự động đẩy bài lên top 1 lần/tuần",
      "Phí giao dịch sàn giảm còn 5%",
      "Hỗ trợ kỹ thuật ưu tiên qua Zalo OA & Hotline",
      "Hợp đồng mẫu & cam kết giao dịch an toàn",
    ],
  },
  {
    id: "premium",
    badge: "Toàn năng",
    description:
      "Giải pháp toàn diện nhất cho Production House, đài truyền hình và Agency sự kiện lớn.",
    featured: false,
    features: [
      "Đăng không giới hạn dịch vụ & nhu cầu dự án",
      "Huy hiệu vàng 'LiveHub Pro Partner'",
      "Ưu tiên hiển thị vị trí số 1 trang chủ & tìm kiếm",
      "Phí giao dịch sàn tối ưu chỉ 3%",
      "Chuyên viên quản lý tài khoản & CSKH 1:1",
      "Bảo hiểm rủi ro thiết bị & hóa đơn VAT tự động",
      "Đặc quyền tham gia mạng lưới đấu thầu dự án lớn",
    ],
  },
];

const membershipJourney: Array<{
  tier: MembershipTier;
  label: string;
}> = [
  { tier: "free_trial", label: "Dùng thử" },
  { tier: "basic", label: "Basic" },
  { tier: "standard", label: "Standard" },
  { tier: "premium", label: "Premium" },
];

interface AccountMembership {
  tier: MembershipTier;
  status: MembershipStatus;
  trialEndsAt: string | null;
  billingCycle: BillingCycle | null;
  isAdmin: boolean;
}

type PricingActionState =
  MembershipPlanAction | "guest" | "admin" | "checking" | "unavailable";

function getNextPaidTier(
  currentTier: MembershipTier
): PaidMembershipTier | null {
  return (
    pricingTiers.find(
      (tier) =>
        MEMBERSHIP_TIER_ORDER[tier.id] > MEMBERSHIP_TIER_ORDER[currentTier]
    )?.id ?? null
  );
}

function formatMembershipDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function CurrentPlanPanel({
  account,
  loading,
  error,
  onRetry,
}: {
  account: AccountMembership | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div
        className="mt-8 rounded-[2rem] border border-neutral-800 bg-neutral-950 p-5 text-white sm:p-6"
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <Skeleton className="size-11 shrink-0 rounded-2xl bg-white/10" />
          <div className="w-full max-w-md space-y-2">
            <Skeleton className="h-3 w-36 bg-white/10" />
            <Skeleton className="h-6 w-56 bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mt-8 flex flex-col gap-4 rounded-[2rem] border border-rose-500/25 bg-rose-500/10 p-5 text-left sm:flex-row sm:items-center sm:justify-between sm:p-6"
        role="alert"
      >
        <div>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-300">
            Chưa thể xác định gói hiện tại
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {error} Các nút thanh toán được tạm khóa để tránh chọn nhầm gói.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="bg-background inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-500/30 px-4 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:text-rose-300"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Thử lại
        </button>
      </div>
    );
  }

  if (!account) {
    return (
      <div
        className="relative mt-8 overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 p-5 text-left text-white shadow-2xl shadow-orange-500/5 sm:p-6"
        aria-live="polite"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
              <UserRoundCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-orange-400 uppercase">
                Gói hiện tại của bạn
              </p>
              <p className="mt-1 text-lg font-bold">
                Đăng nhập để xem trạng thái thành viên
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                LiveHub sẽ tự khóa gói hiện tại và các gói thấp hơn sau khi xác
                định tài khoản.
              </p>
            </div>
          </div>
          <Link
            href="/login?next=%2Fpricing"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-xs font-bold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          >
            Đăng nhập
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  if (account.isAdmin) {
    return (
      <div
        className="relative mt-8 overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 p-5 text-left text-white shadow-2xl shadow-orange-500/10 sm:p-6"
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-orange-400 uppercase">
              Quyền truy cập hiện tại
            </p>
            <p className="mt-1 text-xl font-bold">Quản trị viên hệ thống</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              Tài khoản quản trị đã có toàn quyền LiveHub và không cần mua gói
              thành viên.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const nextTier = getNextPaidTier(account.tier);
  const isTrial = account.tier === "free_trial";

  return (
    <div
      className="relative mt-8 overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 p-5 text-left text-white shadow-2xl shadow-orange-500/10 sm:p-6"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -top-24 -right-20 size-56 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.1fr] lg:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] text-orange-400 uppercase">
            Gói hiện tại của bạn
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <MembershipBadge
              tier={account.tier}
              status={account.status}
              className="!border-orange-500 !bg-orange-500 !text-white shadow-lg shadow-orange-500/25 dark:!text-white"
            />
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-neutral-300">
              {MEMBERSHIP_STATUS_LABELS[account.status]}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            {isTrial && account.trialEndsAt
              ? account.status === "expired"
                ? `Thời gian dùng thử đã kết thúc ngày ${formatMembershipDate(account.trialEndsAt)}.`
                : `Bạn được dùng thử đến ${formatMembershipDate(account.trialEndsAt)}.`
              : account.billingCycle
                ? `Chu kỳ hiện tại: ${account.billingCycle === "yearly" ? "thanh toán theo năm" : "thanh toán theo tháng"}.`
                : "Gói thành viên đã được đồng bộ với tài khoản LiveHub."}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-orange-300">
            <TrendingUp className="size-3.5" aria-hidden="true" />
            {nextTier
              ? `Có thể nâng cấp tiếp lên ${MEMBERSHIP_TIERS[nextTier].label}.`
              : account.status === "active"
                ? "Bạn đang ở gói cao nhất của LiveHub."
                : "Bạn có thể gia hạn Premium theo chu kỳ mong muốn."}
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
          {membershipJourney.map((step) => {
            const stepRank = MEMBERSHIP_TIER_ORDER[step.tier];
            const currentRank = MEMBERSHIP_TIER_ORDER[account.tier];
            const isCurrent = step.tier === account.tier;
            const isCompleted = stepRank < currentRank;

            return (
              <div
                key={step.tier}
                className={`rounded-xl border px-3 py-3 text-center text-[10px] font-bold transition-colors ${
                  isCurrent
                    ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : isCompleted
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-neutral-500"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="mx-auto mb-1.5 flex size-5 items-center justify-center rounded-full border border-current/30">
                  {isCompleted ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    stepRank
                  )}
                </span>
                {step.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlanAction({
  state,
  tier,
  billingCycle,
  featured,
}: {
  state: PricingActionState;
  tier: PaidMembershipTier;
  billingCycle: BillingCycle;
  featured: boolean;
}) {
  const shortLabel = MEMBERSHIP_TIERS[tier].shortLabel;
  const baseClass =
    "group flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99]";

  if (state === "upgrade" || state === "renew" || state === "guest") {
    const label =
      state === "renew"
        ? `Gia hạn ${shortLabel}`
        : state === "guest"
          ? `Chọn ${shortLabel}`
          : `Nâng cấp lên ${shortLabel}`;

    return (
      <Link
        href={`/checkout/membership_${tier}?cycle=${billingCycle}`}
        className={`${baseClass} ${
          featured || state === "upgrade"
            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 focus-visible:outline-orange-500"
            : "border-border bg-background text-foreground border shadow-sm hover:border-orange-500 hover:text-orange-500 focus-visible:outline-orange-500"
        }`}
      >
        <span>{label}</span>
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    );
  }

  const config = {
    current: { label: "Đang sử dụng", icon: Check },
    lower: { label: "Gói thấp hơn hiện tại", icon: LockKeyhole },
    admin: { label: "Tài khoản quản trị", icon: ShieldCheck },
    checking: { label: "Đang kiểm tra gói...", icon: RefreshCw },
    unavailable: { label: "Chưa thể xác định gói", icon: LockKeyhole },
  }[state];
  const Icon = config.icon;

  return (
    <button
      type="button"
      disabled
      className={`${baseClass} border-border bg-muted/60 text-muted-foreground cursor-not-allowed border opacity-80`}
    >
      <Icon
        className={`size-3.5 ${state === "checking" ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </button>
  );
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [account, setAccount] = useState<AccountMembership | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadAccount(authUser?: User | null) {
      let user = authUser;

      if (user === undefined) {
        const { data, error } = await supabase.auth.getUser();
        if (error && error.name !== "AuthSessionMissingError") {
          if (active) {
            setMembershipError(
              "Không thể xác thực tài khoản. Vui lòng thử lại."
            );
            setMembershipLoading(false);
          }
          return;
        }
        user = data.user;
      }

      if (!active) return;

      if (!user) {
        setAccount(null);
        setMembershipError(null);
        setMembershipLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("membership_tier,membership_status,trial_ends_at")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError) {
        setAccount(null);
        setMembershipError("Không thể tải trạng thái thành viên từ LiveHub.");
        setMembershipLoading(false);
        return;
      }

      const membership = resolveMembership(profile, user.app_metadata);
      const metadataCycle = user.app_metadata?.membership_billing_cycle;
      const resolvedCycle = isBillingCycle(metadataCycle)
        ? metadataCycle
        : null;

      setAccount({
        tier: membership.membership_tier,
        status: membership.membership_status,
        trialEndsAt: membership.trial_ends_at,
        billingCycle: resolvedCycle,
        isAdmin: isAdminEmail(user.email),
      });
      setMembershipError(null);
      setMembershipLoading(false);

      if (resolvedCycle) setBillingCycle(resolvedCycle);
    }

    void loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAccount(null);
        setMembershipError(null);
        setMembershipLoading(false);
      } else if (session?.user) {
        void loadAccount(session.user);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [reloadKey]);

  const getActionState = (tier: PaidMembershipTier): PricingActionState => {
    if (membershipLoading) return "checking";
    if (membershipError) return "unavailable";
    if (!account) return "guest";
    if (account.isAdmin) return "admin";

    return getMembershipPlanAction(account.tier, account.status, tier);
  };

  return (
    <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl min-w-0">
        <Link
          href="/"
          replace
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Trở về Trang chủ</span>
        </Link>

        <div className="mx-auto w-full max-w-3xl min-w-0 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-500">
            <Crown className="size-3.5" aria-hidden="true" />
            <span>Phân hạng thành viên LiveHub</span>
          </div>

          <h1 className="mt-4 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
            Giữ gói hiện tại, chỉ nâng cấp khi bạn muốn{" "}
            <AuroraText>tiến xa hơn</AuroraText>
          </h1>

          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm leading-relaxed">
            LiveHub tự nhận diện gói của tài khoản, khóa gói đang dùng và các
            lựa chọn thấp hơn. Bạn chỉ thanh toán khi nâng cấp lên cấp cao hơn
            hoặc gia hạn gói sắp hết hạn.
          </p>

          <CurrentPlanPanel
            account={account}
            loading={membershipLoading}
            error={membershipError}
            onRetry={() => {
              setMembershipLoading(true);
              setMembershipError(null);
              setReloadKey((value) => value + 1);
            }}
          />

          <fieldset className="mt-8 w-full">
            <legend className="sr-only">Chọn chu kỳ thanh toán</legend>
            <div className="border-border bg-card grid w-full grid-cols-2 rounded-2xl border p-1.5 shadow-xs sm:mx-auto sm:w-fit">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                aria-pressed={billingCycle === "monthly"}
                className={`min-h-11 rounded-xl px-3 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:px-5 ${
                  billingCycle === "monthly"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Theo tháng
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                aria-pressed={billingCycle === "yearly"}
                className={`flex min-h-11 flex-col items-center justify-center rounded-xl px-3 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:px-5 ${
                  billingCycle === "yearly"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Theo năm</span>
                <span
                  className={`text-[9px] font-bold ${
                    billingCycle === "yearly"
                      ? "text-orange-100"
                      : "text-emerald-500"
                  }`}
                >
                  Tiết kiệm 20%
                </span>
              </button>
            </div>
          </fieldset>
        </div>

        <div className="mt-14 grid min-w-0 items-stretch gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => {
            const plan = PAID_MEMBERSHIP_PLANS[tier.id];
            const price =
              billingCycle === "monthly"
                ? plan.monthlyPrice
                : plan.yearlyMonthlyPrice;
            const actionState = getActionState(tier.id);
            const isCurrent =
              account?.tier === tier.id && !account.isAdmin && !membershipError;
            const isLower = actionState === "lower";

            return (
              <article
                key={tier.id}
                aria-current={isCurrent ? "true" : undefined}
                className={`relative flex min-w-0 flex-col justify-between rounded-[2.5rem] border p-6 shadow-sm transition-all duration-300 sm:p-8 ${
                  isCurrent
                    ? "border-orange-500 bg-orange-500/5 shadow-xl ring-2 shadow-orange-500/10 ring-orange-500/25"
                    : isLower
                      ? "border-border bg-muted/20"
                      : tier.featured
                        ? "bg-card border-orange-500 shadow-xl ring-2 shadow-orange-500/10 ring-orange-500/20 hover:-translate-y-1 hover:shadow-2xl"
                        : tier.id === "premium"
                          ? "border-amber-500/40 bg-linear-to-b from-amber-500/5 to-transparent hover:-translate-y-1 hover:shadow-2xl"
                          : "border-border bg-card hover:-translate-y-1 hover:shadow-2xl"
                }`}
              >
                {isCurrent ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1 text-[11px] font-bold whitespace-nowrap text-white shadow-lg shadow-orange-500/30">
                      <CheckCircle2
                        className="size-3 text-white"
                        aria-hidden="true"
                      />
                      Gói hiện tại
                    </span>
                  </div>
                ) : tier.featured && !isLower ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1 text-[11px] font-bold whitespace-nowrap text-white shadow-md shadow-orange-500/30">
                      <Sparkles className="size-3" aria-hidden="true" />
                      Gói phổ biến nhất
                    </span>
                  </div>
                ) : null}

                <div className="min-w-0">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <h2 className="min-w-0 text-xl font-bold">{plan.name}</h2>
                    <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
                      {tier.badge}
                    </span>
                  </div>

                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    {tier.description}
                  </p>

                  <div className="border-border mt-6 min-w-0 border-b pb-6">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1">
                      <span className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        {price.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-muted-foreground text-sm font-semibold">
                        đ / tháng
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="mt-1 text-[11px] font-medium text-emerald-500">
                        Thanh toán {(price * 12).toLocaleString("vi-VN")} đ /
                        năm
                      </p>
                    )}
                  </div>

                  <div className="mt-6 space-y-3.5">
                    <p className="text-foreground text-xs font-bold">
                      Quyền lợi bao gồm:
                    </p>
                    <ul className="text-muted-foreground space-y-3 text-xs">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-orange-500"
                            aria-hidden="true"
                          />
                          <span className="text-foreground/90 leading-tight">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-border/70 mt-8 border-t pt-6">
                  <PlanAction
                    state={actionState}
                    tier={tier.id}
                    billingCycle={billingCycle}
                    featured={tier.featured}
                  />
                  <p className="text-muted-foreground mt-2 min-h-8 text-center text-[10px] leading-relaxed">
                    {actionState === "lower"
                      ? "LiveHub chỉ hỗ trợ nâng cấp lên gói cao hơn."
                      : actionState === "current"
                        ? "Đây là gói đang hoạt động trên tài khoản."
                        : actionState === "renew"
                          ? "Gia hạn theo chu kỳ thanh toán bạn vừa chọn."
                          : actionState === "upgrade"
                            ? "Gói cao hơn được kích hoạt sau khi xác nhận."
                            : actionState === "guest"
                              ? "Bạn sẽ đăng nhập trước khi thanh toán."
                              : actionState === "admin"
                                ? "Quản trị viên không cần mua gói."
                                : "Thanh toán tạm khóa để bảo vệ tài khoản."}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="border-border bg-card/60 mx-auto mt-16 max-w-3xl rounded-[2.5rem] border p-8 text-center backdrop-blur-xs">
          <ShieldCheck className="mx-auto size-10 text-orange-500" />
          <h2 className="mt-3 text-lg font-bold">
            Nâng cấp một chiều, bảo vệ gói đang sử dụng
          </h2>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            Gói hiện tại và các gói thấp hơn không thể ghi đè quyền lợi đang có.
            Khi gói sắp hoặc đã hết hạn, bạn có thể gia hạn cùng cấp hoặc chọn
            một cấp cao hơn.
          </p>
        </div>
      </div>
    </div>
  );
}
