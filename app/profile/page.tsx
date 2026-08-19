"use client";

import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/auth";
import {
  MEMBERSHIP_TIERS,
  withResolvedMembership,
} from "@/lib/membership";
import type { Profile } from "@/lib/types/database";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LogOut,
  Plus,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuroraText } from "@/components/ui/aurora-text";
import { MembershipBadge } from "@/components/membership-badge";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<"customer" | "provider">("customer");

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          const resolvedProfile = withResolvedMembership(
            {
              ...(data as Profile),
              role: isAdminEmail(user.email) ? "admin" : data.role,
            },
            user.app_metadata
          );
          setProfile(resolvedProfile);
          setFullName(resolvedProfile.full_name || "");
          setPhone(resolvedProfile.phone || "");
          setBio(resolvedProfile.bio || "");
          setRole(
            resolvedProfile.role === "provider" ? "provider" : "customer"
          );
        } else {
          // Fallback from auth metadata
          const fallbackProfile: Profile = {
            id: user.id,
            email: user.email ?? "",
            full_name:
              user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
            phone: user.user_metadata?.phone ?? "",
            avatar_url: user.user_metadata?.avatar_url ?? null,
            role: isAdminEmail(user.email) ? "admin" : "customer",
            bio: user.user_metadata?.bio ?? "",
            created_at: new Date().toISOString(),
          };
          const resolvedProfile = withResolvedMembership(
            fallbackProfile,
            user.app_metadata
          );
          setProfile(resolvedProfile);
          setFullName(resolvedProfile.full_name || "");
          setPhone(resolvedProfile.phone || "");
          setBio(resolvedProfile.bio || "");
          setRole(
            resolvedProfile.role === "provider" ? "provider" : "customer"
          );
        }
      } catch {
        // Fallback gracefully
      }
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSavedMsg(false);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const nextRole = isAdminEmail(profile.email) ? "admin" : role;
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: profile.id,
        email: profile.email,
        full_name: fullName,
        phone,
        bio,
        role: nextRole,
      });
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          bio,
        },
      });
      if (metadataError) throw metadataError;

      setProfile((current) =>
        current
          ? { ...current, full_name: fullName, phone, bio, role: nextRole }
          : current
      );
      setSavedMsg(true);
      window.dispatchEvent(new Event("livehub:profile-updated"));
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (error: unknown) {
      setErrorMsg(
        (error as Error).message || "Không thể cập nhật hồ sơ lúc này."
      );
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
        <div className="mx-auto w-full max-w-6xl">
          <Skeleton className="mb-6 h-4 w-32 rounded-md" />

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="border-border bg-card space-y-6 rounded-[2.5rem] border p-6 lg:col-span-1 shadow-sm">
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32 rounded-md" />
                  <Skeleton className="h-3.5 w-44 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>

            <div className="border-border bg-card space-y-6 rounded-[2.5rem] border p-8 lg:col-span-2 shadow-sm">
              <Skeleton className="h-8 w-48 rounded-xl" />
              <div className="space-y-4">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Trở về Trang chủ</span>
        </Link>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Left Column: User Summary & Membership (1 Col) */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Card */}
            <div className="border-border bg-card rounded-[2.5rem] border p-6 shadow-sm">
              <div className="flex items-center gap-4">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={fullName}
                    width={64}
                    height={64}
                    className="border-accent size-16 rounded-full border-2 object-cover"
                  />
                ) : (
                  <div className="bg-accent/10 text-accent flex size-16 items-center justify-center rounded-full">
                    <User className="size-8" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold truncate">
                    {profile?.full_name || "Chưa đặt tên"}
                  </h1>
                  <p className="text-muted-foreground text-xs truncate">
                    {profile?.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                      {profile?.role === "admin"
                        ? "Quản trị viên"
                        : profile?.role === "provider"
                          ? "Nhà cung cấp"
                          : "Khách hàng"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Membership Status Card */}
              {profile && (
                <div className="mt-6 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs font-semibold">
                      Gói thành viên
                    </p>
                    <MembershipBadge
                      tier={profile.membership_tier}
                      status={profile.membership_status}
                    />
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    {MEMBERSHIP_TIERS[profile.membership_tier ?? "free_trial"].paid
                      ? "Gói trả phí của bạn đã được đồng bộ với tài khoản LiveHub."
                      : profile.trial_ends_at
                        ? `Dùng thử đến ${new Date(profile.trial_ends_at).toLocaleDateString("vi-VN")}.`
                        : "Tài khoản đang sử dụng gói dùng thử miễn phí."}
                  </p>
                  <Link
                    href="/pricing"
                    className="mt-3.5 inline-flex w-full items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors"
                  >
                    Nâng cấp / Bảng giá gói
                  </Link>
                </div>
              )}

              {/* Quick Navigation Links */}
              <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs font-semibold">
                <Link
                  href="/rentals"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <span>📋 Hợp đồng & Đơn thuê</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                {role === "provider" ? (
                  <Link
                    href="/services/my"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span>🎥 Quản lý dịch vụ của tôi</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/demands/my"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span>📢 Nhu cầu dự án của tôi</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>

              {/* Sign Out Button */}
              <div className="mt-4 border-t border-border pt-4">
                <button
                  onClick={handleSignOut}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-500/20"
                >
                  <LogOut className="size-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Edit Form (2 Cols) */}
          <div className="lg:col-span-2">
            <div className="border-border bg-card rounded-[2.5rem] border p-8 shadow-sm sm:p-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Chỉnh sửa thông tin hồ sơ
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Cập nhật thông tin cá nhân, số điện thoại và vai trò hoạt động trên LiveHub.
                </p>
              </div>

              <form onSubmit={handleSave} className="mt-8 space-y-6">
                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-500"
                  >
                    {errorMsg}
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-border bg-background focus:border-accent w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
                      placeholder="Nhập họ tên của bạn"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-border bg-background focus:border-accent w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
                      placeholder="0912 345 678"
                    />
                  </div>
                </div>

                {isAdminEmail(profile?.email) ? (
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                    <p className="text-sm font-semibold text-orange-500">
                      Quản trị viên hệ thống
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Tài khoản quản trị được xác định tự động và không cần chọn vai
                      trò người dùng.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                      Vai trò chính trên <AuroraText>LiveHub</AuroraText>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole("customer")}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          role === "customer"
                            ? "border-accent bg-accent/10 font-semibold"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <p className="text-sm font-semibold">Khách hàng</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Tìm kiếm và thuê thiết bị, studio, ekip cho dự án
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole("provider")}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          role === "provider"
                            ? "border-accent bg-accent/10 font-semibold"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <p className="text-sm font-semibold">Nhà cung cấp</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Cho thuê thiết bị, phòng quay và cung cấp nhân sự
                          livestream
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                    Giới thiệu bản thân / Năng lực chuyên môn
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="border-border bg-background focus:border-accent w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
                    placeholder="Giới thiệu kinh nghiệm livestream, thiết bị sở hữu hoặc nhu cầu của bạn..."
                  />
                </div>

                <div className="space-y-4 pt-4">
                  {savedMsg && (
                    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:flex-row">
                      <span className="inline-flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="size-4" />
                        Đã lưu thông tin hồ sơ thành công!
                      </span>
                      <Link
                        href="/services"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-orange-600"
                      >
                        <ShoppingBag className="size-3.5" />
                        <span>Đến Sàn Dịch Vụ ngay</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  )}

                  <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/services"
                        className="border-border bg-background text-foreground inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors hover:border-orange-500 hover:text-orange-500"
                      >
                        <ShoppingBag className="size-3.5 text-orange-500" />
                        <span>Xem Sàn Dịch Vụ</span>
                      </Link>

                      {role === "provider" ? (
                        <Link
                          href="/services/new"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-xs font-semibold text-orange-600 dark:text-orange-400 transition-colors hover:bg-orange-500/20"
                        >
                          <Plus className="size-3.5" />
                          <span>Đăng Dịch Vụ Mới</span>
                        </Link>
                      ) : (
                        <Link
                          href="/demands/new"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-xs font-semibold text-orange-600 dark:text-orange-400 transition-colors hover:bg-orange-500/20"
                        >
                          <Plus className="size-3.5" />
                          <span>Đăng Nhu Cầu Mới</span>
                        </Link>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-accent inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <ShieldCheck className="size-4" />
                      <span>{saving ? "Đang lưu..." : "Cập nhật hồ sơ"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
