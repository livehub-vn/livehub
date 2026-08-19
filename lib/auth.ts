import type { Profile } from "@/lib/types/database";

export const ADMIN_EMAIL = "livehubwork@gmail.com";

export function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === ADMIN_EMAIL;
}

export function isOnboardingComplete(
  profile: Pick<Profile, "email" | "phone" | "role"> | null | undefined
): boolean {
  if (!profile) return false;
  if (isAdminEmail(profile.email)) return true;

  return Boolean(
    profile.phone?.trim() &&
    (profile.role === "customer" || profile.role === "provider")
  );
}

/** Only allow in-app destinations supplied through login/callback URLs. */
export function getSafeNextPath(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const url = new URL(value, "https://livehub.local");
    if (url.origin !== "https://livehub.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
