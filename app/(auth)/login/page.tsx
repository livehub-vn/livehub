"use client";

import { createClient } from "@/lib/supabase/client";
import {
  getSafeNextPath,
  isAdminEmail,
  isOnboardingComplete,
} from "@/lib/auth";
import { setActiveDemoRole } from "@/lib/demo-session";
import type { Profile, UserRole } from "@/lib/types/database";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Phone,
  User,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuroraText } from "@/components/ui/aurora-text";
import { Skeleton } from "@/components/ui/skeleton";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeNextPath(searchParams.get("next"));
  const stepParam = searchParams.get("step");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    const error = searchParams.get("error");
    return error ? "Không thể hoàn tất đăng nhập. Vui lòng thử lại." : null;
  });

  // Onboarding step (only when user has signed in with Google for the first time without profile)
  const [step, setStep] = useState<"join" | "onboarding">(
    stepParam === "onboarding" ? "onboarding" : "join"
  );

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("customer");

  // Check if user is already authenticated
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        if (isAdminEmail(user.email)) {
          router.replace("/admin");
          return;
        }

        // A profile row is created automatically, so role alone cannot prove
        // that a first-time user has completed onboarding.
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (error) throw error;

          if (isOnboardingComplete(profile as Profile | null)) {
            // Already configured account -> go directly to destination
            router.replace(next);
            return;
          }

          // Incomplete profile -> show onboarding step
          setCurrentUser({
            id: user.id,
            email: user.email ?? "",
            fullName:
              user.user_metadata?.full_name ??
              user.email?.split("@")[0] ??
              "Thành viên LiveHub",
            avatarUrl: user.user_metadata?.avatar_url ?? null,
          });
          setFullName(
            user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? ""
          );
          setStep("onboarding");
        } catch (error: unknown) {
          setErrorMsg(
            (error as Error).message ||
              "Không thể kiểm tra hồ sơ. Vui lòng tải lại trang."
          );
        }
      }
    });
  }, [next, router]);

  // Handle Google SSO login
  const handleGoogleJoin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const supabase = createClient();
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi khi đăng nhập.");
      setLoading(false);
    }
  };

  // Handle Save Onboarding Profile
  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      const supabase = createClient();

      const profilePayload: Partial<Profile> = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: fullName.trim() || currentUser.fullName,
        phone: phone.trim() || null,
        role: role,
        avatar_url: currentUser.avatarUrl || null,
        bio:
          role === "provider"
            ? "Nhà cung cấp dịch vụ livestream"
            : "Khách hàng LiveHub",
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload);
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: profilePayload.full_name,
          phone: profilePayload.phone,
        },
      });
      if (metadataError) throw metadataError;

      window.dispatchEvent(new Event("livehub:profile-updated"));
      router.replace(next);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Không thể lưu thông tin.");
      setLoading(false);
    }
  };

  // Quick Demo Access (100% instant and reliable)
  const handleDemoAccess = async (targetRole: UserRole, _email?: string) => {
    try {
      setLoading(true);
      setActiveDemoRole(targetRole);
      window.dispatchEvent(new Event("livehub:profile-updated"));
      
      const destination = targetRole === "admin" ? "/admin" : (next || "/");
      router.replace(destination);
    } catch {
      setActiveDemoRole(targetRole);
      router.replace(targetRole === "admin" ? "/admin" : (next || "/"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 size-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="mx-auto w-full max-w-md">
          {/* Back Link */}
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Trở về Trang chủ</span>
          </Link>

        {/* STEP 1: SINGLE "GIA NHẬP LIVEHUB" BUTTON */}
        {step === "join" ? (
          <div className="border-border bg-card/90 rounded-[2.5rem] border p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
            {/* Brand Logo & Heading */}
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500 shadow-inner">
              <Video className="size-7" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
              Gia nhập <AuroraText>LiveHub</AuroraText>
            </h1>

            <p className="text-muted-foreground mt-2.5 text-xs leading-relaxed">
              Nền tảng kết nối thiết bị, studio và ekip livestream chuyên nghiệp
              hàng đầu.
            </p>

            {errorMsg && (
              <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* THE ONLY PRIMARY BUTTON */}
            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleGoogleJoin}
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/35 active:translate-y-0 disabled:opacity-50"
              >
                {/* Google Icon */}
                <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#FFFFFF"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#FFFFFF"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FFFFFF"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#FFFFFF"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>

                <span>
                  {loading ? "Đang kết nối..." : "Gia nhập LiveHub với Google"}
                </span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="border-border/70 mt-10 border-t pt-6">
              <p className="text-muted-foreground text-[11px] font-medium">
                Truy cập nhanh bản thử nghiệm
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDemoAccess("customer", "customer@livehub.vn")
                  }
                  className="border-border bg-background text-muted-foreground hover:text-foreground rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:border-orange-500"
                >
                  Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDemoAccess("provider", "provider@livehub.vn")
                  }
                  className="border-border bg-background text-muted-foreground hover:text-foreground rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:border-orange-500"
                >
                  Nhà cung cấp
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: ONBOARDING ONLY FOR NEW ACCOUNTS */
          <div className="border-border bg-card/90 rounded-[2.5rem] border p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="border-border flex items-center gap-3 border-b pb-6">
              {currentUser?.avatarUrl ? (
                <Image
                  src={currentUser.avatarUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="border-accent size-12 rounded-full border-2 object-cover"
                />
              ) : (
                <div className="bg-accent/10 text-accent flex size-12 items-center justify-center rounded-full">
                  <User className="size-6" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">Hoàn tất đăng ký LiveHub</h2>
                <p className="text-muted-foreground text-xs">
                  {currentUser?.email}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveOnboarding} className="mt-6 space-y-5">
              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Họ và tên hiển thị
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                  className="border-border bg-background focus:border-accent w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Số điện thoại liên hệ
                </label>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    required
                    className="border-border bg-background focus:border-accent w-full rounded-xl border py-3 pr-4 pl-10 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Vai trò chính của bạn
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      role === "customer"
                        ? "border-accent bg-accent/10 font-semibold"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <p className="text-foreground text-xs font-bold">
                      Khách hàng
                    </p>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Tìm thuê thiết bị, studio & đăng nhu cầu
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("provider")}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      role === "provider"
                        ? "border-accent bg-accent/10 font-semibold"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <p className="text-foreground text-xs font-bold">
                      Nhà cung cấp
                    </p>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Cho thuê máy quay, studio & nhận dự án
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-accent mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                <span>
                  {loading ? "Đang lưu..." : "Lưu & Bắt đầu sử dụng LiveHub"}
                </span>
              </button>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
          <div className="border-border bg-card w-full max-w-md space-y-6 rounded-[2.5rem] border p-8 text-center sm:p-10">
            <Skeleton className="mx-auto size-14 rounded-2xl" />
            <Skeleton className="mx-auto h-8 w-48 rounded-xl" />
            <Skeleton className="mx-auto h-4 w-64 rounded-md" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <div className="border-border/70 space-y-2 border-t pt-6">
              <Skeleton className="mx-auto h-3 w-32 rounded-md" />
              <div className="flex justify-center gap-2">
                <Skeleton className="h-8 w-20 rounded-xl" />
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-16 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
