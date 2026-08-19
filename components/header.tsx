"use client";

import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/auth";
import { withResolvedMembership } from "@/lib/membership";
import type { Profile } from "@/lib/types/database";
import {
  ArrowDownRight,
  ArrowRight,
  Camera,
  ChevronDown,
  Compass,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  Radio,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
  Video,
} from "lucide-react";
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

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile(userId: string) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || user.id !== userId) {
          setProfile(null);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
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
          return;
        }

        setProfile(
          withResolvedMembership(
            {
              id: user.id,
              email: user.email ?? "",
              full_name:
                user.user_metadata?.full_name ??
                user.email?.split("@")[0] ??
                "Người dùng LiveHub",
              phone: user.user_metadata?.phone ?? null,
              avatar_url: user.user_metadata?.avatar_url ?? null,
              role: isAdminEmail(user.email) ? "admin" : "customer",
              bio: null,
              created_at: new Date().toISOString(),
            },
            user.app_metadata
          )
        );
      } catch {
        // Fallback silently
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        loadProfile(user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session?.user
      ) {
        loadProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    const handleProfileUpdated = () => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) loadProfile(user.id);
      });
    };
    window.addEventListener("livehub:profile-updated", handleProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(
        "livehub:profile-updated",
        handleProfileUpdated
      );
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

  const closeMobile = () => setMobileMenuOpen(false);

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
          className="ml-2 flex shrink-0 items-center gap-1.5 max-[1024px]:ml-0"
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
          {/* SÀN DỊCH VỤ DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setActiveMenu("services")}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <Link
              href="/services"
              className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm"
            >
              <span>Sàn dịch vụ</span>
              <ChevronDown className="size-3.5 shrink-0 opacity-70" />
            </Link>

            <AnimatePresence>
              {activeMenu === "services" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease }}
                  className="absolute top-full left-0 w-80 pt-2"
                >
                  <div className="bg-frame border-border overflow-hidden rounded-2xl border p-2 shadow-2xl backdrop-blur-xl">
                    <Link
                      href="/services"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <Video className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Tất cả dịch vụ
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Khám phá toàn bộ thiết bị & studio
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/services?category=equipment"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <Camera className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Thiết bị Livestream
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Máy quay 4K, switcher, micro, đèn
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/services?category=studio"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <Radio className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Studio & Phòng quay
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Phông xanh, phòng thu cách âm
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/services?category=crew"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Ekip sản xuất
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Đạo diễn, kỹ thuật viên livestream
                        </p>
                      </div>
                    </Link>

                    <div className="border-border my-1 border-t" />

                    <Link
                      href="/services/new"
                      className="flex items-start gap-3 rounded-xl p-3 text-orange-500 transition-colors hover:bg-orange-500/10"
                    >
                      <PlusCircle className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">
                          Đăng dịch vụ mới
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Dành cho Nhà cung cấp đăng thiết bị
                        </p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SÀN NHU CẦU DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setActiveMenu("demands")}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <Link
              href="/demands"
              className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm"
            >
              <span>Sàn nhu cầu</span>
              <ChevronDown className="size-3.5 shrink-0 opacity-70" />
            </Link>

            <AnimatePresence>
              {activeMenu === "demands" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease }}
                  className="absolute top-full left-0 w-80 pt-2"
                >
                  <div className="bg-frame border-border overflow-hidden rounded-2xl border p-2 shadow-2xl backdrop-blur-xl">
                    <Link
                      href="/demands"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <FileText className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Nhu cầu dự án
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Danh sách yêu cầu tìm kiếm ekip
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/demands/new"
                      className="flex items-start gap-3 rounded-xl p-3 text-orange-500 transition-colors hover:bg-orange-500/10"
                    >
                      <PlusCircle className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">
                          Đăng nhu cầu mới
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Tạo yêu cầu thuê & nhận báo giá
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/demands/my"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <Package className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Nhu cầu của tôi
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Quản lý bài đăng & ứng tuyển
                        </p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DỊCH VỤ TRỌN GÓI */}
          <Link
            href="/packages"
            className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm"
          >
            <Sparkles className="size-3.5 shrink-0 text-orange-500" />
            <span>Dịch vụ trọn gói</span>
          </Link>

          {/* BẢNG GIÁ THÀNH VIÊN */}
          <Link
            href="/pricing"
            className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm"
          >
            <span>Bảng giá</span>
          </Link>

          {/* KHÁM PHÁ DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setActiveMenu("explore")}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <Link
              href="/explore"
              className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm"
            >
              <span>Khám phá</span>
              <ChevronDown className="size-3.5 shrink-0 opacity-70" />
            </Link>

            <AnimatePresence>
              {activeMenu === "explore" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease }}
                  className="absolute top-full left-0 w-80 pt-2"
                >
                  <div className="bg-frame border-border overflow-hidden rounded-2xl border p-2 shadow-2xl backdrop-blur-xl">
                    <Link
                      href="/packages"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Dịch vụ livestream trọn gói
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Setup từ A-Z: E-commerce, talkshow, concert
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/pricing"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <Layers className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Phân hạng gói thành viên
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Miễn phí 02 tháng dùng thử - Nâng cấp Basic/Pro
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/explore#studios"
                      className="hover:bg-muted flex items-start gap-3 rounded-xl p-3 transition-colors"
                    >
                      <Compass className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Studio & Đối tác nổi bật
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Top không gian và studio uy tín
                        </p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right Side: Logged-in Hub or Single Join Button */}
        <div className="flex shrink-0 items-center gap-2.5 max-[1024px]:hidden">
          <RealtimeNotifications isAdmin={false} />

          {profile ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="border-border bg-card text-foreground flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold whitespace-nowrap shadow-sm transition-all hover:border-orange-500"
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={24}
                    height={24}
                    className="border-border size-6 shrink-0 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                    <User className="size-3.5" />
                  </div>
                )}
                <span className="max-w-[100px] truncate">
                  {profile.full_name || "Tài khoản"}
                </span>
                {profile.membership_tier &&
                  profile.membership_tier !== "free_trial" ? (
                  <MembershipBadge
                    tier={profile.membership_tier}
                    status={profile.membership_status}
                    compact
                  />
                ) : (
                  <span className="shrink-0 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-orange-500">
                    {roleLabelMap[profile.role] || "Thành viên"}
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
                    <div className="border-border/70 border-b px-3 py-2">
                      <p className="text-foreground truncate text-xs font-bold">
                        {profile.full_name}
                      </p>
                      <p className="text-muted-foreground truncate text-[11px]">
                        {profile.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <MembershipBadge
                          tier={profile.membership_tier}
                          status={profile.membership_status}
                        />
                      </div>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {/* Customer / Provider common link */}
                      <Link
                        href="/rentals"
                        onClick={() => setUserDropdownOpen(false)}
                        className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <ShoppingBag className="size-4 text-orange-500" />
                        <span>Đơn thuê của tôi</span>
                      </Link>

                      {/* Provider specific */}
                      {profile.role === "provider" && (
                        <Link
                          href="/services/my"
                          onClick={() => setUserDropdownOpen(false)}
                          className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium"
                        >
                          <Video className="size-4 text-orange-500" />
                          <span>Dịch vụ của tôi</span>
                        </Link>
                      )}

                      {/* Customer / Demands */}
                      <Link
                        href="/demands/my"
                        onClick={() => setUserDropdownOpen(false)}
                        className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <Package className="size-4 text-orange-500" />
                        <span>Nhu cầu của tôi</span>
                      </Link>

                      {/* Admin Link */}
                      {isAdminEmail(profile.email) && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-orange-500 hover:bg-orange-500/10"
                        >
                          <LayoutDashboard className="size-4" />
                          <span>Bảng quản trị Admin</span>
                        </Link>
                      )}

                      <Link
                        href="/pricing"
                        onClick={() => setUserDropdownOpen(false)}
                        className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <Layers className="size-4 text-orange-500" />
                        <span>Gói thành viên & Bảng giá</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="text-foreground hover:bg-muted flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <Settings className="text-muted-foreground size-4" />
                        <span>Hồ sơ tài khoản</span>
                      </Link>

                      <div className="border-border/70 my-1 border-t" />

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
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
              className="group relative inline-flex items-center"
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
                <Link
                  href="/services"
                  className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                  onClick={closeMobile}
                >
                  <span>Sàn dịch vụ</span>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>

                <Link
                  href="/demands"
                  className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                  onClick={closeMobile}
                >
                  <span>Sàn nhu cầu</span>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>

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
                  <span>Bảng giá thành viên</span>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>

                <Link
                  href="/explore"
                  className="text-foreground hover:bg-muted flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold"
                  onClick={closeMobile}
                >
                  <span>Khám phá</span>
                  <ArrowRight className="text-muted-foreground size-4" />
                </Link>
              </div>

              {profile ? (
                <div className="border-border space-y-2 border-t pt-4">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-1">
                    <span className="text-foreground text-xs font-bold">
                      {profile.full_name}
                    </span>
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                      {roleLabelMap[profile.role] || "Thành viên"}
                    </span>
                    <MembershipBadge
                      tier={profile.membership_tier}
                      status={profile.membership_status}
                      compact
                    />
                  </div>

                  <Link
                    href="/rentals"
                    className="text-foreground hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                    onClick={closeMobile}
                  >
                    <ShoppingBag className="size-4 text-orange-500" />
                    <span>Đơn thuê của tôi</span>
                  </Link>

                  {profile.role === "provider" && (
                    <Link
                      href="/services/my"
                      className="text-foreground hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                      onClick={closeMobile}
                    >
                      <Video className="size-4 text-orange-500" />
                      <span>Dịch vụ của tôi</span>
                    </Link>
                  )}

                  <Link
                    href="/demands/my"
                    className="text-foreground hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                    onClick={closeMobile}
                  >
                    <Package className="size-4 text-orange-500" />
                    <span>Nhu cầu của tôi</span>
                  </Link>

                  <Link
                    href="/profile"
                    className="text-foreground hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                    onClick={closeMobile}
                  >
                    <Settings className="text-muted-foreground size-4" />
                    <span>Hồ sơ tài khoản</span>
                  </Link>

                  {isAdminEmail(profile.email) && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-orange-500 hover:bg-orange-500/10"
                      onClick={closeMobile}
                    >
                      <LayoutDashboard className="size-4" />
                      <span>Bảng quản trị Admin</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
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
