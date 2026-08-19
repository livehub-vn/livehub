import { adminApiError } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/server";
import { isAdminEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1_000;
const MAX_ROWS_PER_SOURCE = 10_000;

type AdminClient = ReturnType<typeof createAdminClient>;
type Row = Record<string, unknown>;
type ActivityType =
  "user" | "service" | "demand" | "rental" | "transaction" | "package";

interface TableLoad {
  rows: Row[];
  error: string | null;
  truncated: boolean;
}

interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  status: string | null;
  createdAt: string;
}

async function loadRows(
  admin: AdminClient,
  table: string,
  columns: string
): Promise<TableLoad> {
  const rows: Row[] = [];

  for (let start = 0; start < MAX_ROWS_PER_SOURCE; start += PAGE_SIZE) {
    const { data, error } = await admin
      .from(table)
      .select(columns)
      .order("created_at", { ascending: false })
      .range(start, start + PAGE_SIZE - 1);

    if (error) {
      return { rows, error: error.message, truncated: false };
    }

    const page = (data ?? []) as unknown as Row[];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return { rows, error: null, truncated: false };
    }
  }

  return { rows, error: null, truncated: true };
}

function text(row: Row, key: string, fallback = ""): string {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function number(row: Row, key: string): number {
  const value = row[key];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function countBy(
  rows: Row[],
  key: string,
  expectedValues: readonly string[] = []
): Record<string, number> {
  const counts = Object.fromEntries(expectedValues.map((value) => [value, 0]));

  for (const row of rows) {
    const value = text(row, key, "unknown");
    counts[value] = (counts[value] ?? 0) + 1;
  }

  return counts;
}

function activity(
  row: Row,
  type: ActivityType,
  title: string,
  subtitle: string
): RecentActivity {
  return {
    id: `${type}:${text(row, "id", crypto.randomUUID())}`,
    type,
    title,
    subtitle,
    status: text(row, "status") || text(row, "payment_status") || null,
    createdAt: text(row, "created_at", new Date(0).toISOString()),
  };
}

function addLoadWarning(
  warnings: string[],
  load: TableLoad,
  label: string,
  optional = false
): void {
  if (load.error) {
    warnings.push(
      optional
        ? `${label} chưa được cấu hình hoặc chưa thể truy cập.`
        : `Không thể tải ${label}: ${load.error}`
    );
  } else if (load.truncated) {
    warnings.push(
      `${label} đã vượt ${MAX_ROWS_PER_SOURCE.toLocaleString("vi-VN")} bản ghi; số liệu đang hiển thị theo giới hạn an toàn.`
    );
  }
}

export async function GET() {
  try {
    await requireAdminUser();
    const admin = createAdminClient();

    const [
      profiles,
      services,
      demands,
      rentals,
      memberships,
      transactions,
      packages,
    ] = await Promise.all([
      loadRows(admin, "profiles", "id,email,full_name,role,created_at"),
      loadRows(admin, "services", "id,title,status,created_at"),
      loadRows(admin, "demands", "id,title,status,created_at"),
      loadRows(admin, "service_rentals", "id,status,total_price,created_at"),
      loadRows(
        admin,
        "profiles",
        "id,membership_tier,membership_status,created_at"
      ),
      loadRows(
        admin,
        "transactions",
        "id,order_code,payment_status,amount,created_at"
      ),
      loadRows(
        admin,
        "turnkey_package_bookings",
        "id,package_name,customer_name,status,created_at"
      ),
    ]);

    const warnings: string[] = [];
    addLoadWarning(warnings, profiles, "tài khoản");
    addLoadWarning(warnings, services, "dịch vụ");
    addLoadWarning(warnings, demands, "nhu cầu");
    addLoadWarning(warnings, rentals, "đơn thuê");
    addLoadWarning(warnings, memberships, "dữ liệu thành viên", true);
    addLoadWarning(warnings, transactions, "dữ liệu giao dịch", true);
    addLoadWarning(warnings, packages, "dữ liệu đặt gói trọn gói", true);

    profiles.rows = profiles.rows.map((row) =>
      isAdminEmail(text(row, "email")) ? { ...row, role: "admin" } : row
    );

    const userStatus = countBy(profiles.rows, "role", [
      "customer",
      "provider",
      "admin",
    ]);
    const serviceStatus = countBy(services.rows, "status", [
      "pending",
      "approved",
      "rejected",
      "closed",
    ]);
    const demandStatus = countBy(demands.rows, "status", [
      "pending",
      "approved",
      "rejected",
      "closed",
    ]);
    const rentalStatus = countBy(rentals.rows, "status", [
      "pending",
      "approved",
      "rejected",
      "in_progress",
      "completed",
      "cancelled",
    ]);
    const transactionStatus = transactions.error
      ? null
      : countBy(transactions.rows, "payment_status", [
          "pending_payment",
          "processing",
          "completed",
          "failed",
          "refunded",
        ]);
    const packageStatus = packages.error
      ? null
      : countBy(packages.rows, "status", [
          "pending",
          "confirmed",
          "completed",
          "cancelled",
        ]);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1_000;
    const newUsers30d = profiles.rows.filter(
      (row) => Date.parse(text(row, "created_at")) >= thirtyDaysAgo
    ).length;
    const completedTransactions = transactions.error
      ? []
      : transactions.rows.filter(
          (row) => text(row, "payment_status") === "completed"
        );
    const revenue = transactions.error
      ? null
      : completedTransactions.reduce(
          (total, row) => total + number(row, "amount"),
          0
        );

    const recentActivity: RecentActivity[] = [
      ...profiles.rows
        .slice(0, 6)
        .map((row) =>
          activity(
            row,
            "user",
            text(row, "full_name", text(row, "email", "Tài khoản mới")),
            text(row, "email", "Người dùng mới tham gia LiveHub")
          )
        ),
      ...services.rows
        .slice(0, 6)
        .map((row) =>
          activity(
            row,
            "service",
            text(row, "title", "Dịch vụ mới"),
            "Bài đăng dịch vụ"
          )
        ),
      ...demands.rows
        .slice(0, 6)
        .map((row) =>
          activity(
            row,
            "demand",
            text(row, "title", "Nhu cầu mới"),
            "Yêu cầu tìm nhà cung cấp"
          )
        ),
      ...rentals.rows
        .slice(0, 6)
        .map((row) =>
          activity(
            row,
            "rental",
            `Đơn thuê ${text(row, "id").slice(0, 8)}`,
            "Giao dịch thuê dịch vụ"
          )
        ),
      ...(transactions.error
        ? []
        : transactions.rows
            .slice(0, 6)
            .map((row) =>
              activity(
                row,
                "transaction",
                text(row, "order_code", "Giao dịch mới"),
                `${number(row, "amount").toLocaleString("vi-VN")} đ`
              )
            )),
      ...(packages.error
        ? []
        : packages.rows
            .slice(0, 6)
            .map((row) =>
              activity(
                row,
                "package",
                text(row, "package_name", "Đặt gói trọn gói"),
                text(row, "customer_name", "Khách hàng LiveHub")
              )
            )),
    ]
      .sort(
        (left, right) =>
          Date.parse(right.createdAt) - Date.parse(left.createdAt)
      )
      .slice(0, 12);

    return NextResponse.json(
      {
        overview: {
          totalUsers: profiles.rows.length,
          newUsers30d,
          totalServices: services.rows.length,
          pendingServices: serviceStatus.pending ?? 0,
          totalDemands: demands.rows.length,
          pendingDemands: demandStatus.pending ?? 0,
          totalRentals: rentals.rows.length,
          activeRentals:
            (rentalStatus.approved ?? 0) + (rentalStatus.in_progress ?? 0),
          completedPayments: transactions.error
            ? null
            : completedTransactions.length,
          revenue,
          pendingPackages: packages.error
            ? null
            : (packageStatus?.pending ?? 0),
        },
        status: {
          users: userStatus,
          services: serviceStatus,
          demands: demandStatus,
          rentals: rentalStatus,
          transactions: transactionStatus,
          packages: packageStatus,
        },
        membership: memberships.error
          ? null
          : {
              tiers: countBy(memberships.rows, "membership_tier", [
                "free_trial",
                "basic",
                "standard",
                "premium",
              ]),
              statuses: countBy(memberships.rows, "membership_status", [
                "active",
                "expiring_soon",
                "expired",
              ]),
            },
        recentActivity,
        warnings,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return adminApiError(error);
  }
}
