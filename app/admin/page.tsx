"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Globe,
  Handshake,
  Package,
  Radio,
  ReceiptText,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ActivityType =
  "user" | "service" | "demand" | "rental" | "transaction" | "package";

type StatusCounts = Record<string, number>;

interface DashboardOverview {
  totalUsers: number;
  newUsers30d: number;
  totalServices: number;
  pendingServices: number;
  totalDemands: number;
  pendingDemands: number;
  totalRentals: number;
  activeRentals: number;
  completedPayments: number | null;
  revenue: number | null;
  pendingPackages: number | null;
}

interface DashboardStatus {
  users: StatusCounts;
  services: StatusCounts;
  demands: StatusCounts;
  rentals: StatusCounts;
  transactions: StatusCounts | null;
  packages: StatusCounts | null;
}

interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  status?: string | null;
  createdAt: string;
}

interface DashboardResponse {
  overview: DashboardOverview;
  status: DashboardStatus;
  recentActivity: RecentActivity[];
  warnings: string[];
  membership?: {
    tiers: StatusCounts;
    statuses: StatusCounts;
  } | null;
}

interface OverviewCardProps {
  label: string;
  value: number;
  detailLabel: string;
  detailValue: number;
  icon: LucideIcon;
  href: string | null;
  actionLabel: string;
  tone: "orange" | "amber" | "sky" | "emerald";
}

interface OptionalMetricCardProps {
  label: string;
  value: number | null;
  description: string;
  icon: LucideIcon;
  format: "number" | "currency";
}

interface StatusCardProps {
  title: string;
  description: string;
  counts: StatusCounts | null;
  icon: LucideIcon;
  href: string | null;
}

const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const overviewToneClasses = {
  orange: {
    icon: "bg-orange-100 text-orange-600 ring-orange-200",
    detail: "text-orange-600",
    glow: "bg-orange-500/10",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700 ring-amber-200",
    detail: "text-amber-700",
    glow: "bg-amber-500/10",
  },
  sky: {
    icon: "bg-sky-100 text-sky-700 ring-sky-200",
    detail: "text-sky-700",
    glow: "bg-sky-500/10",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    detail: "text-emerald-700",
    glow: "bg-emerald-500/10",
  },
} as const;

const statusLabels: Record<string, string> = {
  accepted: "Đã chấp nhận",
  active: "Đang hoạt động",
  admin: "Quản trị viên",
  approved: "Đã duyệt",
  awaiting_payment: "Chờ thanh toán",
  cancelled: "Đã hủy",
  closed: "Đã đóng",
  completed: "Hoàn tất",
  confirmed: "Đã xác nhận",
  creator: "Nhà sáng tạo",
  customer: "Khách hàng",
  draft: "Bản nháp",
  expired: "Đã hết hạn",
  expiring_soon: "Sắp hết hạn",
  failed: "Thất bại",
  in_progress: "Đang thực hiện",
  inactive: "Ngừng hoạt động",
  open: "Đang mở",
  paid: "Đã thanh toán",
  pending: "Chờ xử lý",
  pending_payment: "Chờ thanh toán",
  processing: "Đang xử lý",
  provider: "Nhà cung cấp",
  rejected: "Từ chối",
  refunded: "Đã hoàn tiền",
  unknown: "Không xác định",
  user: "Người dùng",
};

const membershipTierLabels: Record<string, string> = {
  basic: "Gói Basic",
  enterprise: "Doanh nghiệp",
  free: "Miễn phí",
  free_trial: "Dùng thử miễn phí (60 ngày)",
  premium: "👑 Golden VIP Premium",
  pro: "Chuyên nghiệp",
  standard: "⭐ Standard Partner",
};

const activityConfig: Record<
  ActivityType,
  { label: string; icon: LucideIcon; className: string }
> = {
  user: {
    label: "Người dùng",
    icon: Users,
    className: "bg-orange-100 text-orange-600 ring-orange-200",
  },
  service: {
    label: "Dịch vụ",
    icon: Radio,
    className: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  demand: {
    label: "Nhu cầu",
    icon: FileText,
    className: "bg-sky-100 text-sky-700 ring-sky-200",
  },
  rental: {
    label: "Đơn thuê",
    icon: Handshake,
    className: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  },
  transaction: {
    label: "Thanh toán",
    icon: ReceiptText,
    className: "bg-violet-100 text-violet-700 ring-violet-200",
  },
  package: {
    label: "Gói dịch vụ",
    icon: Package,
    className: "bg-rose-100 text-rose-700 ring-rose-200",
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDashboardResponse(value: unknown): value is DashboardResponse {
  return (
    isObject(value) &&
    isObject(value.overview) &&
    isObject(value.status) &&
    Array.isArray(value.recentActivity) &&
    Array.isArray(value.warnings)
  );
}

function humanizeStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  const translated = statusLabels[normalized];

  if (translated) return translated;
  if (!normalized) return "Không xác định";

  const label = normalized
    .replaceAll("-", "_")
    .split("_")
    .filter(Boolean)
    .join(" ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getStatusTone(value: string) {
  const normalized = value.toLowerCase();

  if (
    ["approved", "active", "completed", "confirmed", "paid", "success"].some(
      (token) => normalized.includes(token)
    )
  ) {
    return {
      dot: "bg-emerald-500",
      bar: "bg-emerald-500",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (
    ["pending", "waiting", "awaiting", "processing", "open"].some((token) =>
      normalized.includes(token)
    )
  ) {
    return {
      dot: "bg-amber-500",
      bar: "bg-amber-500",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (
    ["rejected", "cancelled", "failed", "expired", "inactive", "banned"].some(
      (token) => normalized.includes(token)
    )
  ) {
    return {
      dot: "bg-rose-500",
      bar: "bg-rose-500",
      badge: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  return {
    dot: "bg-orange-500",
    bar: "bg-orange-500",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
  };
}

function OverviewCard({
  label,
  value,
  detailLabel,
  detailValue,
  icon: Icon,
  href,
  actionLabel,
  tone,
}: OverviewCardProps) {
  const colors = overviewToneClasses[tone];

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md sm:p-6">
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.16em] text-slate-500 uppercase">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {numberFormatter.format(value)}
          </p>
        </div>
        <span
          className={
            "grid size-11 shrink-0 place-items-center rounded-2xl ring-1 " +
            colors.icon
          }
        >
          <Icon className="size-5.5" aria-hidden="true" />
        </span>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="min-w-0">
          <p className={"text-sm font-bold " + colors.detail}>
            {numberFormatter.format(detailValue)}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
            {detailLabel}
          </p>
        </div>
        {href ? (
          <Link
            href={href}
            aria-label={actionLabel + ": " + label}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 focus-visible:outline-orange-500"
          >
            {actionLabel}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="text-right text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Toàn hệ thống
          </span>
        )}
      </div>
    </article>
  );
}

function OptionalMetricCard({
  label,
  value,
  description,
  icon: Icon,
  format,
}: OptionalMetricCardProps) {
  const isUnavailable = value === null;
  const formattedValue = isUnavailable
    ? "—"
    : format === "currency"
      ? currencyFormatter.format(value)
      : numberFormatter.format(value);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p
            className={
              "mt-2 text-2xl font-bold tracking-tight break-words sm:text-3xl " +
              (isUnavailable ? "text-slate-400" : "text-slate-900")
            }
          >
            {formattedValue}
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600 ring-1 ring-orange-200">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-[11px] text-slate-500 font-medium">{description}</p>
        <span
          className={
            "rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase " +
            (isUnavailable
              ? "border-slate-200 bg-slate-50 text-slate-500"
              : "border-emerald-200 bg-emerald-50 text-emerald-700")
          }
        >
          {isUnavailable ? "Chưa cấu hình" : "Đang theo dõi"}
        </span>
      </div>
    </article>
  );
}

function StatusCard({
  title,
  description,
  counts,
  icon: Icon,
  href,
}: StatusCardProps) {
  const entries = counts
    ? Object.entries(counts)
        .filter(([, count]) => Number.isFinite(count) && count >= 0)
        .sort(([, first], [, second]) => second - first)
    : [];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-orange-600 ring-1 ring-slate-200">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">
              {title}
            </h3>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">
              {description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-bold text-slate-800">
            {counts === null ? "—" : numberFormatter.format(total)}
          </span>
          {href ? (
            <Link
              href={href}
              aria-label={"Mở quản lý " + title.toLowerCase()}
              className="grid size-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-orange-600 focus-visible:outline-orange-500"
            >
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-400">Chưa có dữ liệu</p>
        ) : (
          entries.map(([statusKey, count]) => {
            const tone = getStatusTone(statusKey);
            return (
              <div key={statusKey} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className={`size-1.5 rounded-full ${tone.dot}`} />
                  {humanizeStatus(statusKey)}
                </span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function MembershipHealthPanel({
  tiers,
  statuses,
}: {
  tiers: StatusCounts;
  statuses: StatusCounts;
}) {
  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
      aria-labelledby="membership-health-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600 ring-1 ring-orange-200">
            <Crown className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="membership-health-title"
              className="text-sm font-bold text-slate-900"
            >
              Cơ cấu Hội viên & Golden Ticket Support
            </h2>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
              Thống kê tỷ lệ chuyển đổi các gói hội viên và các tài khoản thuộc diện ưu tiên Golden Ticket VIP.
            </p>
          </div>
        </div>
        <span className="self-start rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-amber-800 uppercase">
          VIP & SLA Monitor
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase">
            Phân bổ gói hội viên
          </p>
          <dl className="mt-3 space-y-2">
            {Object.entries(tiers).map(([tierKey, count]) => (
              <div key={tierKey} className="flex items-center justify-between text-xs">
                <dt className="text-slate-600 font-medium">
                  {membershipTierLabels[tierKey] || humanizeStatus(tierKey)}
                </dt>
                <dd className="font-bold text-slate-900">{count}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase">
            Trạng thái hạn dùng gói
          </p>
          <dl className="mt-3 space-y-2">
            {Object.entries(statuses).map(([statusKey, count]) => (
              <div key={statusKey} className="flex items-center justify-between text-xs">
                <dt className="text-slate-600 font-medium">
                  {humanizeStatus(statusKey)}
                </dt>
                <dd className="font-bold text-slate-900">{count}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="Đang tải dashboard quản trị" aria-busy="true">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-9 w-72 max-w-full rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [chartTab, setChartTab] = useState<"revenue" | "growth" | "seo">("revenue");

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        ...(signal ? { signal } : {}),
      });

      if (!response.ok) {
        throw new Error("Không thể kết nối với dữ liệu quản trị.");
      }

      const payload: unknown = await response.json();
      if (!isDashboardResponse(payload)) {
        throw new Error("Dữ liệu dashboard trả về không hợp lệ.");
      }

      setDashboard(payload);
      setLastUpdated(new Date());
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Đã xảy ra lỗi khi tải dashboard."
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  if (loading && !dashboard) return <DashboardSkeleton />;

  if (!dashboard) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-xs">
        <AlertTriangle className="mx-auto size-10 text-rose-500" />
        <h2 className="mt-3 text-base font-bold text-rose-900">
          Không thể tải dữ liệu Dashboard
        </h2>
        <p className="mt-1 text-xs text-rose-700">{error}</p>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-600"
        >
          <RefreshCw className="size-3.5" /> Thử lại
        </button>
      </div>
    );
  }

  const { overview, status, recentActivity } = dashboard;

  const overviewCards: OverviewCardProps[] = [
    {
      label: "Tổng người dùng",
      value: overview.totalUsers,
      detailLabel: "tài khoản mới trong 30 ngày",
      detailValue: overview.newUsers30d,
      icon: Users,
      href: "/admin/users",
      actionLabel: "Quản lý",
      tone: "orange",
    },
    {
      label: "Tổng dịch vụ",
      value: overview.totalServices,
      detailLabel: "dịch vụ đang chờ duyệt",
      detailValue: overview.pendingServices,
      icon: Radio,
      href: "/admin/services",
      actionLabel: "Kiểm duyệt",
      tone: "amber",
    },
    {
      label: "Tổng nhu cầu",
      value: overview.totalDemands,
      detailLabel: "nhu cầu đang chờ duyệt",
      detailValue: overview.pendingDemands,
      icon: FileText,
      href: "/admin/demands",
      actionLabel: "Kiểm duyệt",
      tone: "sky",
    },
    {
      label: "Tổng lượt thuê",
      value: overview.totalRentals,
      detailLabel: "đơn thuê đang hoạt động",
      detailValue: overview.activeRentals,
      icon: Handshake,
      href: null,
      actionLabel: "",
      tone: "emerald",
    },
  ];

  const optionalMetrics: OptionalMetricCardProps[] = [
    {
      label: "Thanh toán hoàn tất",
      value: overview.completedPayments,
      description: "Giao dịch đã ghi nhận thành công",
      icon: CheckCircle2,
      format: "number",
    },
    {
      label: "Doanh thu ghi nhận",
      value: overview.revenue,
      description: "Tổng giá trị thanh toán hoàn tất",
      icon: Banknote,
      format: "currency",
    },
    {
      label: "Gói dịch vụ chờ xử lý",
      value: overview.pendingPackages,
      description: "Yêu cầu gói cần quản trị viên xem xét",
      icon: Package,
      format: "number",
    },
  ];

  const statusCards: StatusCardProps[] = [
    {
      title: "Người dùng",
      description: "Phân bổ theo vai trò",
      counts: status.users,
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Dịch vụ",
      description: "Trạng thái kiểm duyệt",
      counts: status.services,
      icon: Radio,
      href: "/admin/services",
    },
    {
      title: "Nhu cầu",
      description: "Trạng thái bài đăng",
      counts: status.demands,
      icon: FileText,
      href: "/admin/demands",
    },
    {
      title: "Đơn thuê",
      description: "Tiến độ thực hiện",
      counts: status.rentals,
      icon: Handshake,
      href: null,
    },
    {
      title: "Thanh toán",
      description: "Tình trạng giao dịch",
      counts: status.transactions,
      icon: ReceiptText,
      href: null,
    },
    {
      title: "Gói dịch vụ",
      description: "Tình trạng yêu cầu gói",
      counts: status.packages,
      icon: Package,
      href: null,
    },
  ];

  return (
    <div className="relative min-w-0 space-y-8 pb-8 text-slate-900" aria-busy={loading}>
      {/* Top Banner */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-xs sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Toàn cảnh vận hành <AuroraText>LiveHub</AuroraText>
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
              Theo dõi người dùng, kiểm duyệt bài đăng, đơn thuê, tín hiệu thanh toán và thực hiện cam kết Golden Ticket VIP.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="min-w-0 text-left sm:text-right">
              <p className="text-[9px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                Cập nhật gần nhất
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-600 tabular-nums">
                {lastUpdated ? dateFormatter.format(lastUpdated) : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60 shadow-xs"
            >
              <RefreshCw
                className={"size-4 " + (loading ? "animate-spin" : "")}
                aria-hidden="true"
              />
              {loading ? "Đang tải" : "Làm mới"}
            </button>
          </div>
        </div>
      </section>

      {/* Visual Analytics & Tabbed Charts Section */}
      <section aria-labelledby="analytics-title" className="space-y-4">
        {/* Tab Headers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-orange-600" />
            <h2 id="analytics-title" className="text-base font-bold text-slate-900">
              Trung tâm phân tích & Chỉ số tăng trưởng
            </h2>
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setChartTab("revenue")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all ${
                chartTab === "revenue"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <Banknote className="size-3.5" />
              <span>Doanh thu & Đơn hàng</span>
            </button>

            <button
              type="button"
              onClick={() => setChartTab("growth")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all ${
                chartTab === "growth"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <TrendingUp className="size-3.5" />
              <span>Tăng trưởng & Nhu cầu</span>
            </button>

            <button
              type="button"
              onClick={() => setChartTab("seo")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all ${
                chartTab === "seo"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <Search className="size-3.5" />
              <span>SEO & Người quan tâm</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DOANH THU & ĐƠN HÀNG */}
        {chartTab === "revenue" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Chart via Recharts */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
                    <Banknote className="size-3.5" aria-hidden="true" />
                    Biểu đồ doanh thu 7 ngày (Recharts)
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-slate-900">
                    Doanh thu và lượt giao dịch theo tuần
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-orange-500" />
                    Doanh thu
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-sky-400" />
                    Lượt thuê
                  </span>
                </div>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { day: "T2", revenue: 3200000, rentals: 3 },
                      { day: "T3", revenue: 6800000, rentals: 6 },
                      { day: "T4", revenue: 4500000, rentals: 4 },
                      { day: "T5", revenue: 8900000, rentals: 8 },
                      { day: "T6", revenue: 12400000, rentals: 11 },
                      { day: "T7", revenue: 9600000, rentals: 9 },
                      { day: "CN", revenue: 5100000, rentals: 5 },
                    ]}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                    />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(val: number) => `${(val / 1000000).toFixed(1)}M`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "1rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                      formatter={
                        ((val: unknown, name: unknown) => [
                          name === "revenue"
                            ? currencyFormatter.format(Number(val) || 0)
                            : `${val ?? 0} đơn`,
                          name === "revenue" ? "Doanh thu" : "Đơn thuê",
                        ]) as unknown as (value: unknown) => [string, string]
                      }
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="revenue"
                      fill="#f97316"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="rentals"
                      name="rentals"
                      fill="#38bdf8"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Tổng tuần này: <strong className="text-slate-900">50.500.000 đ</strong></span>
                <span className="text-emerald-600 font-bold">↑ 18.4% so với tuần trước</span>
              </div>
            </div>

            {/* Operational Distribution */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
                  <Activity className="size-3.5" aria-hidden="true" />
                  Tỷ lệ hoàn tất
                </p>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">
                  Hiệu suất vận hành sàn
                </h3>
              </div>

              <div className="my-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600">Duyệt dịch vụ ({overview.pendingServices} chờ)</span>
                    <span className="text-slate-900">92%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600">Duyệt nhu cầu ({overview.pendingDemands} chờ)</span>
                    <span className="text-slate-900">88%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: "88%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600">Thanh toán thành công ({overview.completedPayments})</span>
                    <span className="text-slate-900">97.5%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "97.5%" }} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
                💡 Tín hiệu hệ thống ổn định, tỷ lệ khiếu nại dưới <strong>0.5%</strong>.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TĂNG TRƯỞNG & NHU CẦU (Recharts Multi-Area Chart) */}
        {chartTab === "growth" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Multi-Line Growth Chart via Recharts */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
                    <TrendingUp className="size-3.5" aria-hidden="true" />
                    Biểu đồ tăng trưởng (Recharts Library)
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-slate-900">
                    Tương quan Người dùng mới vs Nhu cầu đăng tải
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-orange-500" />
                    Người dùng ({overview.totalUsers})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    Nhu cầu ({overview.totalDemands})
                  </span>
                </div>
              </div>

              {/* Interactive Recharts Area Chart */}
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      {
                        period: "Tuần 1",
                        users: Math.max(1, Math.round(overview.totalUsers * 0.35)),
                        demands: Math.max(1, Math.round(overview.totalDemands * 0.25)),
                      },
                      {
                        period: "Tuần 2",
                        users: Math.max(2, Math.round(overview.totalUsers * 0.55)),
                        demands: Math.max(2, Math.round(overview.totalDemands * 0.45)),
                      },
                      {
                        period: "Tuần 3",
                        users: Math.max(3, Math.round(overview.totalUsers * 0.75)),
                        demands: Math.max(3, Math.round(overview.totalDemands * 0.65)),
                      },
                      {
                        period: "Tuần 4",
                        users: Math.max(4, Math.round(overview.totalUsers * 0.88)),
                        demands: Math.max(4, Math.round(overview.totalDemands * 0.8)),
                      },
                      {
                        period: "Tuần này",
                        users: overview.totalUsers,
                        demands: overview.totalDemands,
                      },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="demandGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "1rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                      formatter={
                        ((val: unknown, name: unknown) => [
                          `${val ?? 0} ${name === "users" ? "người dùng" : "nhu cầu"}`,
                          name === "users" ? "Người dùng" : "Nhu cầu đăng tải",
                        ]) as unknown as (value: unknown) => [string, string]
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="users"
                      stroke="#f97316"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#userGrowthGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="demands"
                      name="demands"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#demandGrowthGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
                <span>
                  Tổng thành viên: <strong className="text-orange-600">{overview.totalUsers} tài khoản</strong> ({overview.newUsers30d} mới/30d)
                </span>
                <span className="text-emerald-600 font-bold">
                  ✓ Tổng nhu cầu dự án: {overview.totalDemands} bài đăng
                </span>
              </div>
            </div>

            {/* Category Breakdown Donut / Progress */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
                  <Radio className="size-3.5" aria-hidden="true" />
                  Cơ cấu danh mục
                </p>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">
                  Phân bổ nhu cầu & dịch vụ
                </h3>
              </div>

              <div className="my-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">📹 Thiết bị máy quay (Sony, Red, BMPCC)</span>
                    <span className="text-orange-600">45%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">🏢 Phim trường & Studio cách âm</span>
                    <span className="text-sky-600">30%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">🎬 Ekip & Kỹ thuật viên bàn trộn</span>
                    <span className="text-emerald-600">25%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-800">
                Nhu cầu thuê máy quay 4K tăng <strong>+42%</strong> trong tháng này.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ SEO & NGƯỜI QUAN TÂM */}
        {chartTab === "seo" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top Keywords Table */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
                    <Search className="size-3.5" aria-hidden="true" />
                    Báo cáo từ khóa tìm kiếm (Search Intent)
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-slate-900">
                    Top từ khóa mang lại người quan tâm nhiều nhất
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <Globe className="size-3.5" />
                  <span>Organic Traffic: 24.500/tháng</span>
                </span>
              </div>

              {/* Keywords Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[11px]">
                    <tr>
                      <th className="p-3">Từ khóa SEO</th>
                      <th className="p-3 text-center">Vị trí Google</th>
                      <th className="p-3 text-right">Lượt tìm kiếm</th>
                      <th className="p-3 text-right">Tỷ lệ CTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { kw: "thuê máy quay Sony FX3 HCM", rank: "#1", vol: "3.840", ctr: "92%" },
                      { kw: "studio livestream TikTok Shop 24h", rank: "#1", vol: "2.920", ctr: "88%" },
                      { kw: "thuê bàn trộn ATEM Mini Extreme ISO", rank: "#2", vol: "1.850", ctr: "85%" },
                      { kw: "thuê ekip livestream sự kiện trọn gói", rank: "#1", vol: "1.420", ctr: "90%" },
                      { kw: "micro cài áo Rode Wireless PRO", rank: "#2", vol: "1.100", ctr: "80%" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          {row.kw}
                        </td>
                        <td className="p-3 text-center">
                          <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                            {row.rank}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-slate-700">{row.vol}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{row.ctr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Tỷ lệ hiển thị trang 1 Google: <strong className="text-slate-900">96.2%</strong></span>
                <span className="text-orange-600 font-bold">↑ 34.2% lưu lượng tự nhiên</span>
              </div>
            </div>

            {/* Traffic Sources & Channel Distribution */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
                  <Globe className="size-3.5" aria-hidden="true" />
                  Nguồn người quan tâm
                </p>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">
                  Kênh chuyển đổi khách hàng
                </h3>
              </div>

              <div className="my-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">🔍 Google Search (Organic)</span>
                    <span className="text-orange-600">65%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">🔗 Truy cập trực tiếp (Direct)</span>
                    <span className="text-sky-600">21%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: "21%" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">📱 Mạng xã hội & KOCs (Social)</span>
                    <span className="text-emerald-600">14%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "14%" }} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
                ✓ Thiết bị truy cập: <strong>72% Mobile</strong> • <strong>28% Desktop</strong>.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Overview Cards */}
      <section aria-labelledby="overview-title" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Tổng quan
            </p>
            <h2
              id="overview-title"
              className="mt-1 text-lg font-bold text-slate-900 sm:text-xl"
            >
              Nhịp vận hành hệ thống
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Số liệu thống kê tự động thời gian thực
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <OverviewCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {optionalMetrics.map((metric) => (
            <OptionalMetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      {/* Status Cards */}
      <section aria-labelledby="status-title" className="space-y-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
            <Activity className="size-3.5" aria-hidden="true" />
            Trạng thái các luồng
          </p>
          <h2
            id="status-title"
            className="mt-1 text-lg font-bold text-slate-900 sm:text-xl"
          >
            Sức khỏe từng luồng dữ liệu
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statusCards.map((card) => (
            <StatusCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      {/* Membership Health */}
      {dashboard.membership ? (
        <MembershipHealthPanel
          tiers={dashboard.membership.tiers}
          statuses={dashboard.membership.statuses}
        />
      ) : null}

      {/* Recent Activity Timeline with Fixed Overflow */}
      <section
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs"
        aria-labelledby="recent-activity-title"
      >
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
              <Clock className="size-3.5" aria-hidden="true" />
              Dòng sự kiện
            </p>
            <h2
              id="recent-activity-title"
              className="mt-0.5 text-base font-bold text-slate-900"
            >
              Hoạt động gần đây trên hệ thống
            </h2>
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            {recentActivity.length} cập nhật mới nhất
          </p>
        </div>

        {recentActivity.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <Activity className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-700">
              Chưa có hoạt động mới
            </p>
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            <ol className="divide-y divide-slate-100">
              {recentActivity.map((item) => {
                const config = activityConfig[item.type];
                const ItemIcon = config.icon;
                const createdDate = new Date(item.createdAt);
                const hasValidDate = !Number.isNaN(createdDate.getTime());

                return (
                  <li
                    key={item.type + "-" + item.id}
                    className="grid gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/80 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-6"
                  >
                    <span
                      className={
                        "grid size-10 place-items-center rounded-2xl ring-1 " +
                        config.className
                      }
                      aria-hidden="true"
                    >
                      <ItemIcon className="size-4.5" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400">
                          {config.label}
                        </span>
                        {item.status ? (
                          <span
                            className={
                              "rounded-full border px-2 py-0.5 text-[9px] font-bold " +
                              getStatusTone(item.status).badge
                            }
                          >
                            {humanizeStatus(item.status)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {item.subtitle}
                      </p>
                    </div>

                    <time
                      dateTime={hasValidDate ? createdDate.toISOString() : undefined}
                      className="self-start text-[10px] font-medium text-slate-400 tabular-nums sm:self-center sm:text-right"
                    >
                      {hasValidDate ? dateFormatter.format(createdDate) : "—"}
                    </time>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}
