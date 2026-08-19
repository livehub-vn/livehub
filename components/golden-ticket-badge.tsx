import type { MembershipTier } from "@/lib/types/database";
import { Crown, Sparkles, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface GoldenTicketBadgeProps {
  tier?: MembershipTier | string | null | undefined;
  variant?: "badge" | "ribbon" | "pill" | "admin-tag";
  showSla?: boolean;
  className?: string;
}

export function GoldenTicketBadge({
  tier = "free_trial",
  variant = "badge",
  showSla = false,
  className = "",
}: GoldenTicketBadgeProps): ReactNode {
  const isPremium = tier === "premium";
  const isStandard = tier === "standard";

  if (!isPremium && !isStandard) {
    return null;
  }

  if (variant === "admin-tag") {
    if (isPremium) {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs whitespace-nowrap shrink-0 ${className}`}
          title="Tài khoản hội viên Premium"
        >
          <Crown className="size-3 text-white fill-white shrink-0" />
          <span>Premium</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs whitespace-nowrap shrink-0 ${className}`}
        title="Tài khoản hội viên Standard"
      >
        <Sparkles className="size-3 text-white shrink-0" />
        <span>Standard</span>
      </span>
    );
  }

  if (variant === "ribbon") {
    if (isPremium) {
      return (
        <div
          className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 px-3 py-1 text-[10px] font-bold text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-300/60 ${className}`}
        >
          <Crown className="size-3 fill-slate-950" />
          <span>Golden VIP Pro</span>
        </div>
      );
    }

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-sm ${className}`}
      >
        <Sparkles className="size-3" />
        <span>Đối tác Standard</span>
      </div>
    );
  }

  // Default "badge" or "pill"
  if (isPremium) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/60 dark:from-amber-950/40 dark:to-yellow-950/30 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 shadow-xs ring-1 ring-amber-400/30 ${className}`}
      >
        <Crown className="size-3 text-amber-600 dark:text-amber-400 fill-amber-500/40 shrink-0" />
        <span>VIP Golden Ticket</span>
        {showSla && <span className="text-[9px] font-normal text-amber-700/80 dark:text-amber-400">· 15p CSKH</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-50/80 dark:bg-blue-950/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 ${className}`}
    >
      <ShieldCheck className="size-3 text-blue-500 shrink-0" />
      <span>Standard Partner</span>
    </span>
  );
}

/**
 * Priority sort helper for services and demands:
 * Premium (100) > Standard (50) > Basic (20) > Free Trial (0)
 * Within same tier, newest created_at comes first.
 */
export function getTierPriorityWeight(tier?: string | null): number {
  if (!tier) return 0;
  switch (tier.toLowerCase()) {
    case "premium":
      return 100;
    case "standard":
      return 50;
    case "basic":
      return 20;
    default:
      return 0;
  }
}

/**
 * Returns container highlight classes for cards based on membership tier
 */
export function getTierCardStyle(tier?: string | null): string {
  if (!tier) return "border-border bg-card";
  const normalized = tier.toLowerCase();
  if (normalized === "premium") {
    return "border-amber-400/80 bg-gradient-to-br from-amber-500/[0.07] via-card to-amber-500/[0.03] shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40";
  }
  if (normalized === "standard") {
    return "border-blue-400/50 bg-gradient-to-br from-blue-500/[0.05] via-card to-card ring-1 ring-blue-400/20 shadow-md shadow-blue-500/5";
  }
  return "border-border bg-card";
}
