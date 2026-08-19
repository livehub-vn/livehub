import type {
  MembershipStatus,
  MembershipTier,
  Profile,
} from "@/lib/types/database";

export const MEMBERSHIP_TIERS: Record<
  MembershipTier,
  { label: string; shortLabel: string; paid: boolean }
> = {
  free_trial: {
    label: "Dùng thử miễn phí",
    shortLabel: "Dùng thử",
    paid: false,
  },
  basic: { label: "Gói Basic", shortLabel: "Basic", paid: true },
  standard: { label: "Gói Standard", shortLabel: "Standard", paid: true },
  premium: { label: "Gói Premium", shortLabel: "Premium", paid: true },
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Đang hoạt động",
  expiring_soon: "Sắp hết hạn",
  expired: "Đã hết hạn",
};

export type PaidMembershipTier = Exclude<MembershipTier, "free_trial">;
export type BillingCycle = "monthly" | "yearly";
export type MembershipPlanAction = "upgrade" | "current" | "renew" | "lower";

export const MEMBERSHIP_TIER_ORDER: Record<MembershipTier, number> = {
  free_trial: 0,
  basic: 1,
  standard: 2,
  premium: 3,
};

export const PAID_MEMBERSHIP_PLANS: Record<
  PaidMembershipTier,
  { name: string; monthlyPrice: number; yearlyMonthlyPrice: number }
> = {
  basic: {
    name: "Gói Basic",
    monthlyPrice: 199_000,
    yearlyMonthlyPrice: 159_000,
  },
  standard: {
    name: "Gói Standard",
    monthlyPrice: 499_000,
    yearlyMonthlyPrice: 399_000,
  },
  premium: {
    name: "Gói Premium",
    monthlyPrice: 999_000,
    yearlyMonthlyPrice: 799_000,
  },
};

export function isPaidMembershipTier(
  value: unknown
): value is PaidMembershipTier {
  return value === "basic" || value === "standard" || value === "premium";
}

export function isBillingCycle(value: unknown): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export function getMembershipCheckoutDetails(
  tier: PaidMembershipTier,
  cycle: BillingCycle
): { title: string; amount: number } {
  const plan = PAID_MEMBERSHIP_PLANS[tier];
  return {
    title: plan.name,
    amount:
      cycle === "monthly" ? plan.monthlyPrice : plan.yearlyMonthlyPrice * 12,
  };
}

/**
 * Returns the only valid action for a target paid plan.
 * Active users can move upward only; expiring/expired users may renew the
 * same plan, while lower tiers always remain unavailable.
 */
export function getMembershipPlanAction(
  currentTier: MembershipTier,
  currentStatus: MembershipStatus,
  targetTier: PaidMembershipTier
): MembershipPlanAction {
  const currentRank = MEMBERSHIP_TIER_ORDER[currentTier];
  const targetRank = MEMBERSHIP_TIER_ORDER[targetTier];

  if (targetRank > currentRank) return "upgrade";
  if (targetRank < currentRank) return "lower";

  return currentStatus === "active" ? "current" : "renew";
}

export function isMembershipTier(value: unknown): value is MembershipTier {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(MEMBERSHIP_TIERS, value)
  );
}

export function isMembershipStatus(value: unknown): value is MembershipStatus {
  return value === "active" || value === "expiring_soon" || value === "expired";
}

export function getEffectiveMembershipStatus(
  tier: MembershipTier,
  status: MembershipStatus,
  trialEndsAt: string | null
): MembershipStatus {
  if (
    tier === "free_trial" &&
    trialEndsAt &&
    Number.isFinite(Date.parse(trialEndsAt)) &&
    Date.parse(trialEndsAt) <= Date.now()
  ) {
    return "expired";
  }

  return status;
}

export function resolveMembership(
  profile: Partial<Profile> | null | undefined,
  appMetadata?: Record<string, unknown> | null
): {
  membership_tier: MembershipTier;
  membership_status: MembershipStatus;
  trial_ends_at: string | null;
} {
  const metadataTier = appMetadata?.membership_tier;
  const metadataStatus = appMetadata?.membership_status;
  const metadataTrialEnd = appMetadata?.trial_ends_at;

  const membershipTier = isMembershipTier(metadataTier)
    ? metadataTier
    : isMembershipTier(profile?.membership_tier)
      ? profile.membership_tier
      : "free_trial";
  const membershipStatus = isMembershipStatus(metadataStatus)
    ? metadataStatus
    : isMembershipStatus(profile?.membership_status)
      ? profile.membership_status
      : "active";
  const trialEndsAt =
    typeof metadataTrialEnd === "string" || metadataTrialEnd === null
      ? metadataTrialEnd
      : (profile?.trial_ends_at ?? null);

  return {
    membership_tier: membershipTier,
    membership_status: getEffectiveMembershipStatus(
      membershipTier,
      membershipStatus,
      trialEndsAt
    ),
    trial_ends_at: trialEndsAt,
  };
}

export function withResolvedMembership(
  profile: Profile,
  appMetadata?: Record<string, unknown> | null
): Profile {
  return { ...profile, ...resolveMembership(profile, appMetadata) };
}
