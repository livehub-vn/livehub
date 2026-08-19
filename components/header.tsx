"use client";

import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/auth";
import { withResolvedMembership } from "@/lib/membership";
import type { Profile } from "@/lib/types/database";
import {
  ArrowDownRight,
  ArrowRight,
  CheckSquare,
  ChevronDown,
  FileCheck,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  Users,
  Video,
} from "lucide-react";
import { getFallbackProfile } from "@/lib/demo-session";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuroraText } from "@/components/ui/aurora-text";
import { MembershipBadge } from "@/components/membership-badge";
import { RealtimeNotifications } from "@/components/realtime-notifications";

const ease = [0.23, 1, 0.32, 1] as const;

function HamburgerIcon({ isOpen }: { isOpen: boolean }): ReactNode {
  return (
    <div className="relative flex h-4 w-8 cursor-pointer flex-col justify-between">
      <motion.span
        className="bg-foreground block h-0.5 w-full origin-center rounded-full"
        animate={isOpen ? { rotate: 45, y: 4.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease }}
      />
      <motion.span
        className="bg-foreground block h-0.5 w-full origin-center rounded-full"
        animate={isOpen ? { rotate: -45, y: -9.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease }}
      />
    </div>
  );
}



export function Header(): ReactNode {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfileForUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) {
      try {
        // 1. Immediately set instant profile from session metadata (0ms UI render)
        setProfile((prev) => prev || withResolvedMembership(
          {
            id: user.id,
            email: user.email ?? "",
            full_name:
              (user.user_metadata?.full_name as string) ??
              user.email?.split("@")[0] ??
              "Người dùng LiveHub",
            phone: (user.user_metadata?.phone as string) ?? null,
            avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
            role: isAdminEmail(user.email) ? "admin" : "customer",
            bio: null,
            created_at: new Date().toISOString(),
          },
          user.app_metadata
        ));

        // 2. Fetch latest data from database in background
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (data && !error) {
          const databaseProfile = data as Profile;
          setProfile(
            withResolvedMembership(
              {
                ...databaseProfile,
                role: isAdminEmail(user.email) ? "admin" : databaseProfile.role,
              },
              user.app_metadata
            )
          );
        }
      } catch {
        // Fallback silently
      }
    }

    // 1. Instant local session check (0ms)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfileForUser(session.user);
      } else {
        setProfile(getFallbackProfile());
      }
    });

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") &&
        session?.user
      ) {
        loadProfileForUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setProfile(getFallbackProfile("customer"));
      }
    });

    const handleProfileUpdated = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          loadProfileForUser(session.user);
        } else {
          setProfile(getFallbackProfile());
        }
      });
    };
    window.addEventListener("livehub:profile-updated", handleProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("livehub:profile-updated", handleProfileUpdated);
    };
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Direct Google SSO
  const handleDirectGoogleLogin = async () => {
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const currentPath = pathname || "/";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(currentPath)}`,
        },
      });

      if (error) {
        router.push(
          `/login?error=oauth-start&next=${encodeURIComponent(currentPath)}`
        );
      }
    } catch {
      router.push(
        `/login?error=oauth-start&next=${encodeURIComponent(pathname)}`
      );
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserDropdownOpen(false);
    setProfile(null);
    router.push("/");
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const closeMobile = () => {
    setMobileMenuOpen(false);
    scrollToTop();
  };

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const roleLabelMap: Record<string, string> = {
    customer: "Khách hàng",
    provider: "Nhà cung cấp",
    admin: "Quản trị viên",
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="bg-frame fixed top-2.5 left-1/2 z-9998 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-b-3xl sm:rounded-b-[2rem] shadow-xl shadow-black/5 max-[1024px]:top-0 max-[1024px]:right-0 max-[1024px]:left-0 max-[1024px]:w-full max-[1024px]:max-w-none max-[1024px]:translate-x-0 max-[1024px]:rounded-none max-[1024px]:rounded-b-2xl"
    >
      {/* Left Inverted Corner SVG (Smooth Concave Wing) */}
      <svg
        className="site-corner-nav absolute top-0 -left-8 h-8 w-8 text-frame fill-current pointer-events-none hidden lg:block"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 0 C17.673 0 32 14.327 32 32 V0 H0 Z"
          fill="currentColor"
        />
      </svg>

      {/* Right Inverted Corner SVG (Smooth Concave Wing) */}
      <svg
        className="site-corner-nav absolute top-0 -right-8 h-8 w-8 text-frame fill-current pointer-events-none hidden lg:block"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M32 0 C14.327 0 0 14.327 0 32 V0 H32 Z"
          fill="currentColor"
        />
      </svg>

      <div className="flex h-20 items-center justify-between px-4 max-[1024px]:h-18 max-[1024px]:px-6">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={scrollToTop}
          className="ml-2 flex shrink-0 items-center gap-1.5 max-[1024px]:ml-0 cursor-pointer"
          aria-label="Trang chủ sàn dịch vụ LiveHub"
        >
          <Image
            src="/brand/livehub-mark.png"
            alt=""
            width={52}
            height={52}
            className="h-12 w-12 shrink-0 object-contain"
            priority
            loading="eager"
          />
          <span className="text-foreground text-lg leading-none font-semibold whitespace-nowrap">
            <AuroraText>LiveHub</AuroraText>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-1 max-[1024px]:hidden xl:gap-2">
          {profile?.role === "provider" ? (
            <>
              {/* SUPPLIER: TÌM DỰ ÁN & NHU CẦU */}
              <Link
                href="/demands"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <FileText className="size-3.5 shrink-0 text-orange-500" />
                <span>Tìm dự án & Nhu cầu</span>
              </Link>

              {/* SUPPLIER: DỊCH VỤ CỦA TÔI */}
              <Link
                href="/services/my"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <Video className="size-3.5 shrink-0 text-orange-500" />
                <span>Dịch vụ của tôi</span>
              </Link>

              {/* SUPPLIER: ĐƠN THUÊ */}
              <Link
                href="/rentals"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <ShoppingBag className="size-3.5 shrink-0 text-orange-500" />
                <span>Đơn thuê</span>
              </Link>

              {/* SUPPLIER: GÓI TRỌN GÓI */}
              <Link
                href="/packages"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <Sparkles className="size-3.5 shrink-0 text-orange-500" />
                <span>Gói trọn gói</span>
              </Link>

              {/* SUPPLIER: BẢNG GIÁ VIP */}
              <Link
                href="/pricing"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <span>Bảng giá VIP</span>
              </Link>
            </>
          ) : profile?.role === "customer" ? (
            <>
              {/* CUSTOMER: SÀN DỊCH VỤ */}
              <Link
                href="/services"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <Video className="size-3.5 shrink-0 text-orange-500" />
                <span>Sàn dịch vụ</span>
              </Link>

              {/* CUSTOMER: NHU CẦU CỦA BẠN */}
              <Link
                href="/demands/my"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <Package className="size-3.5 shrink-0 text-orange-500" />
                <span>Nhu cầu của bạn</span>
              </Link>

              {/* CUSTOMER: HỢP ĐỒNG THUÊ */}
              <Link
                href="/rentals"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <ShoppingBag className="size-3.5 shrink-0 text-orange-500" />
                <span>Hợp đồng thuê</span>
              </Link>

              {/* DỊCH VỤ TRỌN GÓI */}
              <Link
                href="/packages"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <Sparkles className="size-3.5 shrink-0 text-orange-500" />
                <span>Gói trọn gói</span>
              </Link>

              {/* BẢNG GIÁ VIP */}
              <Link
                href="/pricing"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <span>Bảng giá VIP</span>
              </Link>
            </>
          ) : (
            <>
              {/* GUEST: SÀN DỊCH VỤ */}
              <Link
                href="/services"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <Video className="size-3.5 shrink-0 text-orange-500" />
                <span>Sàn dịch vụ</span>
              </Link>

              {/* GUEST: SÀN NHU CẦU */}
              <Link
                href="/demands"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <FileText className="size-3.5 shrink-0 text-orange-500" />
                <span>Sàn nhu cầu</span>
              </Link>

              {/* GUEST: GÓI TRỌN GÓI */}
              <Link
                href="/packages"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <Sparkles className="size-3.5 shrink-0 text-orange-500" />
                <span>Gói trọn gói</span>
              </Link>

              {/* GUEST: BẢNG GIÁ VIP */}
              <Link
                href="/pricing"
                onClick={scrollToTop}
                className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm cursor-pointer"
              >
                <span>Bảng giá VIP</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Side: Logged-in Hub or Single Join Button */}
        <div className="flex shrink-0 items-center gap-2.5 max-[1024px]:hidden">
          <RealtimeNotifications isAdmin={false} />

          {profile ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="border-border bg-card text-foreground flex shrink-0 items-center gap-2 rounded-2xl border p-1.5 pr-2.5 text-xs font-semibold whitespace-nowrap shadow-sm transition-all hover:border-orange-500 cursor-pointer"
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={28}
                    height={28}
                    className="border-border size-7 shrink-0 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                    <User className="size-4" />
                  </div>
                )}
                {profile.role === "admin" || isAdminEmail(profile.email) ? (
                  <span className="shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-rose-600 dark:text-rose-400">
                    Admin
                  </span>
                ) : profile.membership_tier &&
                profile.membership_tier !== "free_trial" ? (
                  <MembershipBadge
                    tier={profile.membership_tier}
                    status={profile.membership_status}
                    compact
                  />
                ) : (
                  <span className="shrink-0 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-orange-500">
                    {profile.role === "provider" ? "Nhà cung cấp" : "Khách hàng"}
                  </span>
                )}
                <ChevronDown className="size-3 shrink-0 opacity-60" />
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease }}
                    className="border-border bg-card absolute top-full right-0 mt-2 w-64 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="border-border/70 border-b px-3 py-2 -mx-2">
                      <p className="text-foreground truncate text-xs font-bold px-2">
                        {profile.full_name}
                      </p>
                      <p className="text-muted-foreground truncate text-[11px] px-2">
                        {profile.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5 px-2">
                        {profile.role === "admin" || isAdminEmail(profile.email) ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 shadow-xs">
                            <ShieldCheck className="size-3 text-rose-500" />
                            <span>Quản trị viên tối cao (Admin)</span>
                          </span>
                        ) : (
                          <MembershipBadge
                            tier={profile.membership_tier}
                            status={profile.membership_status}
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {profile.role === "admin" || isAdminEmail(profile.email) ? (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition-colors"
                          >
                            <LayoutDashboard className="size-4 text-orange-500" />
                            <span>Bảng quản trị Admin</span>
                          </Link>

                          <Link
                            href="/admin/services"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <FileCheck className="size-4 text-orange-500" />
                            <span>Kiểm duyệt dịch vụ sàn</span>
                          </Link>

                          <Link
                            href="/admin/demands"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <CheckSquare className="size-4 text-orange-500" />
                            <span>Kiểm duyệt nhu cầu & dự án</span>
                          </Link>

                          <Link
                            href="/admin/users"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Users className="size-4 text-orange-500" />
                            <span>Quản lý tài khoản & VIP</span>
                          </Link>

                          <div className="border-border/70 my-1 border-t -mx-2" />

                          <Link
                            href="/services"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Video className="size-4 text-muted-foreground" />
                            <span>Khám phá Sàn Dịch vụ</span>
                          </Link>

                          <Link
                            href="/demands"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <FileText className="size-4 text-muted-foreground" />
                            <span>Khám phá Sàn Nhu cầu</span>
                          </Link>

                          <Link
                            href="/profile"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Settings className="text-muted-foreground size-4" />
                            <span>Hồ sơ tài khoản</span>
                          </Link>
                        </>
                      ) : profile.role === "provider" ? (
                        <>
                          <Link
                            href="/demands"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <FileText className="size-4 text-orange-500" />
                            <span>Tìm dự án & Báo giá</span>
                          </Link>

                          <Link
                            href="/services/my"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Video className="size-4 text-orange-500" />
                            <span>Dịch vụ của tôi</span>
                          </Link>

                          <Link
                            href="/services/new"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                          >
                            <PlusCircle className="size-4" />
                            <span>+ Đăng dịch vụ mới</span>
                          </Link>

                          <Link
                            href="/rentals"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <ShoppingBag className="size-4 text-orange-500" />
                            <span>Đơn thuê nhận được</span>
                          </Link>

                          <Link
                            href="/pricing"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Layers className="size-4 text-orange-500" />
                            <span>Hạng thành viên & Bảng giá</span>
                          </Link>

                          <Link
                            href="/profile"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Settings className="text-muted-foreground size-4" />
                            <span>Hồ sơ tài khoản</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/demands/my"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Package className="size-4 text-orange-500" />
                            <span>Dự án của tôi</span>
                          </Link>

                          <Link
                            href="/demands/new"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                          >
                            <PlusCircle className="size-4" />
                            <span>+ Đăng nhu cầu tìm ekip</span>
                          </Link>

                          <Link
                            href="/rentals"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <ShoppingBag className="size-4 text-orange-500" />
                            <span>Hợp đồng thuê của tôi</span>
                          </Link>

                          <Link
                            href="/pricing"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Layers className="size-4 text-orange-500" />
                            <span>Hạng thành viên & Bảng giá</span>
                          </Link>

                          <Link
                            href="/profile"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              scrollToTop();
                            }}
                            className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                          >
                            <Settings className="text-muted-foreground size-4" />
                            <span>Hồ sơ tài khoản</span>
                          </Link>
                        </>
                      )}

                      <div className="border-border/70 my-1 border-t -mx-2" />

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <LogOut className="size-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDirectGoogleLogin}
              className="group relative inline-flex items-center cursor-pointer"
            >
              <span className="bg-accent absolute inset-y-0 right-0 w-[calc(100%-1.5rem)] rounded-2xl" />
              <span className="bg-foreground text-background relative z-10 rounded-2xl px-5 py-3 text-sm font-medium">
                Gia nhập LiveHub
              </span>
              <span className="text-foreground relative -left-px z-10 flex h-10 w-10 items-center justify-center rounded-2xl">
                <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" />
              </span>
            </button>
          )}
        </div>

        {/* Mobile Notification & Hamburger Button */}
        <div className="hidden items-center gap-2 max-[1024px]:flex">
          <RealtimeNotifications isAdmin={false} />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileMenuOpen}
          >
            <HamburgerIcon isOpen={mobileMenuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="hidden overflow-hidden max-[1024px]:block"
          >
            <div className="space-y-4 px-6 pt-2 pb-6">
              <div className="space-y-1">
                {profile?.role === "provider" ? (
                  <>
                    <Link
                      href="/demands"
                      className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                      onClick={closeMobile}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-orange-500" />
                        <span>Tìm dự án & Nhu cầu</span>
                      </div>
                      <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600">Nhận việc</span>
                    </Link>

                    <Link
                      href="/services/my"
                      className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                      onClick={closeMobile}
                    >
                      <div className="flex items-center gap-2">
                        <Video className="size-4 text-orange-500" />
                        <span>Dịch vụ của tôi</span>
                      </div>
                      <ArrowRight className="text-muted-foreground size-4" />
                    </Link>

                    <Link
                      href="/services/new"
                      className="text-orange-600 dark:text-orange-400 bg-orange-500/10 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold"
                      onClick={closeMobile}
                    >
                      <div className="flex items-center gap-2">
                        <PlusCircle className="size-4" />
                        <span>+ Đăng dịch vụ mới</span>
                      </div>
                      <ArrowRight className="size-4" />
                    </Link>

                    <Link
                      href="/rentals"
                      className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                      onClick={closeMobile}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="size-4 text-orange-500" />
                        <span>Đơn thuê</span>
                      </div>
                      <ArrowRight className="text-muted-foreground size-4" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/services"
                      className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                      onClick={closeMobile}
                    >
                      <div className="flex items-center gap-2">
                        <Video className="size-4 text-orange-500" />
                        <span>Sàn dịch vụ & Thiết bị</span>
                      </div>
                      <ArrowRight className="text-muted-foreground size-4" />
                    </Link>

                    {profile?.role === "customer" && (
                      <>
                        <Link
                          href="/demands/my"
                          className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                          onClick={closeMobile}
                        >
                          <div className="flex items-center gap-2">
                            <Package className="size-4 text-orange-500" />
                            <span>Dự án của tôi</span>
                          </div>
                          <ArrowRight className="text-muted-foreground size-4" />
                        </Link>

                        <Link
                          href="/demands/new"
                          className="text-orange-600 dark:text-orange-400 bg-orange-500/10 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold"
                          onClick={closeMobile}
                        >
                          <div className="flex items-center gap-2">
                            <PlusCircle className="size-4" />
                            <span>+ Đăng nhu cầu tìm ekip</span>
                          </div>
                          <ArrowRight className="size-4" />
                        </Link>

                        <Link
                          href="/rentals"
                          className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                          onClick={closeMobile}
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="size-4 text-orange-500" />
                            <span>Hợp đồng thuê</span>
                          </div>
                          <ArrowRight className="text-muted-foreground size-4" />
                        </Link>
                      </>
                    )}
                  </>
                )}

                <Link
                  href="/packages"
                  className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                  onClick={closeMobile}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-orange-500" />
                    <span>Dịch vụ trọn gói</span>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>

                <Link
                  href="/pricing"
                  className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                  onClick={closeMobile}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-orange-500" />
                    <span>Bảng giá VIP</span>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>
              </div>

              {profile ? (
                <div className="border-border space-y-2 border-t pt-4">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-1">
                    <span className="text-foreground text-xs font-bold">
                      {profile.full_name}
                    </span>
                    {profile.role === "admin" || isAdminEmail(profile.email) ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        <ShieldCheck className="size-3" />
                        <span>Admin</span>
                      </span>
                    ) : (
                      <>
                        <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                          {roleLabelMap[profile.role] || "Thành viên"}
                        </span>
                        <MembershipBadge
                          tier={profile.membership_tier}
                          status={profile.membership_status}
                          compact
                        />
                      </>
                    )}
                  </div>

                  {profile.role === "admin" || isAdminEmail(profile.email) ? (
                    <>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-orange-500 bg-orange-500/10"
                        onClick={closeMobile}
                      >
                        <LayoutDashboard className="size-4" />
                        <span>Bảng quản trị Admin</span>
                      </Link>

                      <Link
                        href="/admin/services"
                        className="text-foreground hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                        onClick={closeMobile}
                      >
                        <FileCheck className="size-4 text-orange-500" />
                        <span>Kiểm duyệt dịch vụ sàn</span>
                      </Link>

                      <Link
                        href="/admin/demands"
                        className="text-foreground hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                        onClick={closeMobile}
                      >
                        <CheckSquare className="size-4 text-orange-500" />
                        <span>Kiểm duyệt nhu cầu</span>
                      </Link>

                      <Link
                        href="/admin/users"
                        className="text-foreground hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                        onClick={closeMobile}
                      >
                        <Users className="size-4 text-orange-500" />
                        <span>Quản lý người dùng & VIP</span>
                      </Link>
                    </>
                  ) : null}

                  <Link
                    href="/profile"
                    className="text-foreground hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                    onClick={closeMobile}
                  >
                    <Settings className="text-muted-foreground size-4" />
                    <span>Hồ sơ tài khoản</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      handleDirectGoogleLogin();
                    }}
                    className="group relative inline-flex w-full items-center justify-center"
                  >
                    <span className="bg-accent absolute inset-y-0 right-0 w-[calc(100%-1.5rem)] rounded-2xl" />
                    <span className="bg-foreground text-background relative z-10 flex-1 rounded-2xl px-5 py-3 text-center text-sm font-medium">
                      Gia nhập LiveHub
                    </span>
                    <span className="text-foreground relative -left-px z-10 flex h-10 w-10 items-center justify-center rounded-2xl">
                      <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" />
                    </span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
