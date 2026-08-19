import { MEMBERSHIP_TIERS } from "@/lib/membership";
import type { MembershipStatus, MembershipTier } from "@/lib/types/database";
import { Crown, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function MembershipBadge({
  tier = "free_trial",
  status = "active",
  compact = false,
  className = "",
}: {
  tier?: MembershipTier | undefined;
  status?: MembershipStatus | undefined;
  compact?: boolean | undefined;
  className?: string | undefined;
}): ReactNode {
  const config = MEMBERSHIP_TIERS[tier];
  const isActive = status !== "expired";
  const Icon = config.paid ? Crown : Sparkles;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
        config.paid && isActive
          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          : isActive
            ? "border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-400"
            : "border-rose-500/25 bg-rose-500/10 text-rose-500"
      } ${className}`}
      title={`${config.label} · ${isActive ? "Đang hoạt động" : "Đã hết hạn"}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      <span>{compact ? config.shortLabel : config.label}</span>
      {!isActive && <span>· Hết hạn</span>}
    </span>
  );
}
