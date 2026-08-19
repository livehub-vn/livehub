"use client";

import { RealtimeNotifications } from "@/components/realtime-notifications";
import { AuroraText } from "@/components/ui/aurora-text";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";
import {
  CheckSquare,
  FileCheck,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Tổng quan hệ thống", href: "/admin", icon: LayoutDashboard },
  { label: "Kiểm duyệt dịch vụ", href: "/admin/services", icon: FileCheck },
  { label: "Kiểm duyệt nhu cầu", href: "/admin/demands", icon: CheckSquare },
  { label: "Quản lý tài khoản", href: "/admin/users", icon: Users },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Điều hướng quản trị" className="space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${active
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${active
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900"
                }`}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AdminIdentity({ profile }: { profile: Profile }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      {profile.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900">
          {profile.full_name || "LiveHub Admin"}
        </p>
        <p className="truncate text-[10px] text-slate-500">{profile.email}</p>
      </div>
    </div>
  );
}

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  const brand = (
    <Link
      href="/admin"
      onClick={() => setMobileOpen(false)}
      className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
      aria-label="LiveHub Admin - Tổng quan"
    >
      <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-2xl">
        <Image
          src="/brand/livehub-mark.png"
          alt=""
          width={36}
          height={36}
          className="size-8 object-contain"
          priority
        />
      </span>
      <span>
        <span className="block text-base font-bold tracking-tight text-slate-900">
          <AuroraText>LiveHub</AuroraText> Admin
        </span>
      </span>
    </Link>
  );

  return (
    <div className="light min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* 1. FIXED LEFT SIDEBAR (Desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden h-screen w-64 lg:w-72 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-5 lg:flex z-30 shadow-xs overflow-y-auto">
        <div className="flex flex-col">
          <div className="px-1 py-1">{brand}</div>
          <div className="my-5 h-px bg-slate-100" />
          <AdminNavigation pathname={pathname} />
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-100">
          <AdminIdentity profile={profile} />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Link
              href="/"
              replace
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-orange-500 shadow-xs"
            >
              <Home className="size-4 text-orange-500" aria-hidden="true" />
              <span>Trang chủ</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-500 disabled:opacity-50 shadow-xs"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT SIDE CONTAINER (Overflow-y-auto) */}
      <div className="lg:pl-72 flex-1 min-h-screen w-full flex flex-col bg-slate-50/70 overflow-y-auto">
        {/* Top Header Bar for Notifications & Mobile Navigation */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3 lg:hidden">
            {brand}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Hệ thống Quản trị & Điều phối LiveHub
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Realtime Notification Center */}
            <RealtimeNotifications isAdmin={true} />

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden shadow-xs hover:bg-slate-50"
              aria-label="Mở menu quản trị"
              aria-expanded={mobileOpen}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu quản trị"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
              aria-label="Đóng menu quản trị"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,20rem)] flex-col justify-between border-r border-slate-200 bg-white p-5 shadow-2xl">
              <div>
                <div className="flex items-center justify-between">
                  {brand}
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                    aria-label="Đóng menu"
                  >
                    <X className="size-4.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="my-5 h-px bg-slate-100" />
                <AdminNavigation
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <AdminIdentity profile={profile} />
                <Link
                  href="/"
                  replace
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <Home className="size-4 text-orange-500" aria-hidden="true" />
                  Trở về Trang chủ
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* Scrollable Main Area */}
        <main
          id="admin-main"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
