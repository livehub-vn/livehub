"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  CheckCheck,
  Crown,
  FileCheck,
  Handshake,
  MessageSquare,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface RealtimeNotification {
  id: string;
  type: "service" | "demand" | "rental" | "system" | "vip";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  vipTier?: "premium" | "standard";
}

const INITIAL_MOCK_NOTIFICATIONS: RealtimeNotification[] = [
  {
    id: "notif-1",
    type: "vip",
    title: "⚡ Golden Ticket VIP: Yêu cầu thuê mới",
    message: "Khách hàng V-Brand vừa đặt thuê gói máy Sony FX3. SLA phản hồi trong 15 phút.",
    link: "/admin/services",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    vipTier: "premium",
  },
  {
    id: "notif-2",
    type: "service",
    title: "Dịch vụ đã được duyệt thành công",
    message: "Phòng quay Studio 4K E-Commerce của bạn đã được quản trị viên LiveHub phê duyệt lên sàn.",
    link: "/services",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "notif-3",
    type: "demand",
    title: "Nhu cầu dự án mới",
    message: "Có 1 bài đăng tuyển dụng Đạo diễn hình ảnh Livestream tại Quận 1 vừa được tạo.",
    link: "/demands",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

// Play a gentle UI chime using Web Audio API
function playChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio autoplay restrictions if un-interacted
  }
}

export function RealtimeNotifications({
  isAdmin = false,
  className = "",
}: {
  isAdmin?: boolean;
  className?: string;
}) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    () => INITIAL_MOCK_NOTIFICATIONS
  );
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastNotification, setToastNotification] =
    useState<RealtimeNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Subscribe to Supabase Realtime changes with unique channel name per mounted instance
  useEffect(() => {
    const supabase = createClient();
    const channelId = `livehub-rt-${isAdmin ? "adm" : "usr"}-${Math.random().toString(36).slice(2, 9)}`;

    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "services" },
        (payload) => {
          const record = payload.new as { title?: string; id?: string };
          const newNotif: RealtimeNotification = {
            id: `service-${Date.now()}`,
            type: "service",
            title: isAdmin ? "Dịch vụ mới chờ kiểm duyệt" : "Dịch vụ mới trên LiveHub",
            message: `Dịch vụ "${record.title || "Không tên"}" vừa được đăng tải.`,
            link: isAdmin ? "/admin/services" : `/services/${record.id ?? ""}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          triggerNewNotification(newNotif);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "demands" },
        (payload) => {
          const record = payload.new as { title?: string; id?: string };
          const newNotif: RealtimeNotification = {
            id: `demand-${Date.now()}`,
            type: "demand",
            title: isAdmin ? "Nhu cầu mới chờ kiểm duyệt" : "Nhu cầu dự án mới",
            message: `Bài đăng tuyển "${record.title || "Không tên"}" vừa được gửi lên sàn.`,
            link: isAdmin ? "/admin/demands" : `/demands/${record.id ?? ""}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          triggerNewNotification(newNotif);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_rentals" },
        () => {
          const newNotif: RealtimeNotification = {
            id: `rental-${Date.now()}`,
            type: "rental",
            title: "Yêu cầu thuê thiết bị mới!",
            message: "Có khách hàng vừa gửi đơn đặt thuê dịch vụ của bạn.",
            link: isAdmin ? "/admin" : "/profile",
            read: false,
            createdAt: new Date().toISOString(),
          };
          triggerNewNotification(newNotif);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const triggerNewNotification = (notif: RealtimeNotification) => {
    setNotifications((prev) => [notif, ...prev]);
    setToastNotification(notif);
    if (soundEnabled) {
      playChime();
    }
    setTimeout(() => {
      setToastNotification((curr) => (curr?.id === notif.id ? null : curr));
    }, 6000);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${Math.floor(diffHours / 24)} ngày trước`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative flex size-10 items-center justify-center rounded-xl border transition-all focus-visible:outline-2 focus-visible:outline-orange-500 ${
          isAdmin
            ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
            : "border-border bg-background/80 text-foreground hover:bg-muted"
        }`}
        aria-label={`Thông báo (${unreadCount} chưa đọc)`}
        aria-expanded={open}
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-extrabold text-white shadow-md shadow-orange-500/40 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Realtime Toast */}
      {toastNotification && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-9999 flex max-w-sm items-start gap-3 rounded-2xl border border-orange-500/40 bg-white/95 dark:bg-neutral-900/95 p-4 text-slate-900 dark:text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30">
            <Zap className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {toastNotification.title}
              </p>
              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                aria-label="Đóng thông báo"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              {toastNotification.message}
            </p>
            {toastNotification.link && (
              <Link
                href={toastNotification.link}
                onClick={() => {
                  markAsRead(toastNotification.id);
                  setToastNotification(null);
                }}
                className="mt-2 inline-flex text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
              >
                Xem chi tiết →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Dropdown Popover */}
      {open && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isAdmin
              ? "border-slate-200 bg-white text-slate-900"
              : "border-border bg-card/95 text-foreground"
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-800"
                title={soundEnabled ? "Tắt âm thanh thông báo" : "Bật âm thanh thông báo"}
              >
                {soundEnabled ? (
                  <Volume2 className="size-3.5" />
                ) : (
                  <VolumeX className="size-3.5" />
                )}
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <CheckCheck className="size-3.5" />
                  <span>Đọc tất cả</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Không có thông báo nào
              </div>
            ) : (
              notifications.map((notif) => {
                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`group relative flex items-start gap-3 rounded-xl p-2.5 transition-colors cursor-pointer ${
                      notif.read
                        ? "bg-transparent hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-slate-600 dark:text-slate-400"
                        : "bg-orange-50/60 dark:bg-orange-950/20 text-slate-900 dark:text-white border border-orange-200/50 dark:border-orange-500/20"
                    }`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        notif.vipTier === "premium"
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : notif.type === "service"
                            ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                            : notif.type === "demand"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {notif.vipTier === "premium" ? (
                        <Crown className="size-4" />
                      ) : notif.type === "service" ? (
                        <FileCheck className="size-4" />
                      ) : notif.type === "demand" ? (
                        <MessageSquare className="size-4" />
                      ) : (
                        <Handshake className="size-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-semibold">
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <Link
                          href={notif.link}
                          onClick={() => setOpen(false)}
                          className="mt-1 inline-flex text-[10px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          Đi tới trang →
                        </Link>
                      )}
                    </div>

                    {!notif.read && (
                      <span className="size-2 shrink-0 self-center rounded-full bg-orange-500" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-3 border-t pt-2.5 text-center border-slate-100 dark:border-neutral-800">
            <span className="text-[10px] font-medium text-slate-400">
              ⚡ Hệ thống thông báo tự động kết nối Supabase Realtime
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
