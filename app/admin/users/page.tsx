"use client";

import { MembershipBadge } from "@/components/membership-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client";
import type { Profile, UserRole } from "@/lib/types/database";
import {
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface AdminUser extends Profile {
  protected?: boolean;
}

const roleLabels: Record<UserRole, string> = {
  customer: "Khách hàng",
  provider: "Nhà cung cấp",
  admin: "Quản trị viên",
};

function UserAvatar({ user }: { user: AdminUser }) {
  return user.avatar_url ? (
    <Image
      src={user.avatar_url}
      alt=""
      width={36}
      height={36}
      className="size-9 rounded-xl object-cover ring-1 ring-slate-200"
    />
  ) : (
    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-xs font-bold text-orange-700">
      {user.full_name?.[0] || user.email[0]?.toUpperCase() || "U"}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${role === "admin"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : role === "provider"
            ? "border-orange-200 bg-orange-50 text-orange-700"
            : "border-slate-200 bg-slate-100 text-slate-700"
        }`}
    >
      {roleLabels[role]}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<{ users: AdminUser[] }>(
        "/api/admin/users",
        signal ? { signal } : undefined
      );
      setUsers(response.users);
    } catch (fetchError) {
      if (
        fetchError instanceof DOMException &&
        fetchError.name === "AbortError"
      ) {
        return;
      }
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Không thể tải danh sách tài khoản."
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const taskId = window.setTimeout(() => {
      void fetchUsers(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(taskId);
      controller.abort();
    };
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
    );
  }, [searchQuery, users]);

  const handleChangeRole = async (
    user: AdminUser,
    newRole: "customer" | "provider"
  ) => {
    setActiveUserId(user.id);
    setError(null);
    setNotice(null);
    try {
      const response = await adminFetch<{ user: AdminUser }>(
        `/api/admin/users/${user.id}`,
        { method: "PATCH", body: JSON.stringify({ role: newRole }) }
      );
      setUsers((current) =>
        current.map((item) =>
          item.id === response.user.id ? response.user : item
        )
      );
      setNotice(`Đã cập nhật ${user.email} thành ${roleLabels[newRole]}.`);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể cập nhật vai trò."
      );
    } finally {
      setActiveUserId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Xóa vĩnh viễn tài khoản ${user.email}? Tài khoản đăng nhập và dữ liệu liên kết có thể bị xóa theo.`
    );
    if (!confirmed) return;

    setActiveUserId(user.id);
    setError(null);
    setNotice(null);
    try {
      await adminFetch<{ success: true }>(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setNotice(`Đã xóa tài khoản ${user.email}.`);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể xóa tài khoản."
      );
    } finally {
      setActiveUserId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 sm:space-y-8 text-slate-900">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Quản lý tài khoản người dùng
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Theo dõi hồ sơ người dùng, phân loại gói hội viên và phân quyền Khách hàng / Nhà cung cấp.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
          <div className="relative min-w-0 flex-1 xl:w-80">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm tên, email hoặc số điện thoại..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-xs text-slate-900 transition-colors outline-none placeholder:text-slate-400 focus:border-orange-500 shadow-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => void fetchUsers()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 shadow-xs"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Làm mới
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
          <span className="flex-1 font-medium">{error}</span>
          <button
            type="button"
            onClick={() => void fetchUsers()}
            className="font-bold underline underline-offset-2 hover:text-rose-950"
          >
            Thử lại
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 shadow-xs font-medium"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
          <span className="text-xs font-bold text-slate-700">
            Danh sách tài khoản hệ thống
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-600">
            {loading ? "Đang tải" : `${filteredUsers.length} / ${users.length} tài khoản`}
          </span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100 p-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-2xl px-3 py-4"
              >
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-56 max-w-full rounded" />
                </div>
                <Skeleton className="hidden h-9 w-36 rounded-lg sm:block" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Search className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-800">
              Không tìm thấy tài khoản phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Thử một từ khóa khác hoặc làm mới dữ liệu.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredUsers.map((user) => {
                const busy = activeUserId === user.id;
                const tier = user.membership_tier;
                return (
                  <article key={user.id} className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {user.full_name || "Chưa đặt tên"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                      <RoleBadge role={user.role} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <MembershipBadge tier={tier} status={user.membership_status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Điện thoại
                        </p>
                        <p className="mt-0.5 text-slate-700 font-medium truncate">
                          {user.phone || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Ngày tham gia
                        </p>
                        <p className="mt-0.5 text-slate-700 font-medium">
                          {new Date(user.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    {user.protected ? (
                      <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-bold text-sky-700">
                        <LockKeyhole className="size-3.5" />
                        Tài khoản quản trị viên được bảo vệ
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-1">
                        <select
                          value={user.role === "admin" ? "customer" : user.role}
                          onChange={(event) =>
                            void handleChangeRole(
                              user,
                              event.target.value as "customer" | "provider"
                            )
                          }
                          disabled={busy}
                          className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-orange-500 disabled:opacity-50 shadow-xs"
                          aria-label={`Vai trò của ${user.email}`}
                        >
                          <option value="customer">Khách hàng</option>
                          <option value="provider">Nhà cung cấp</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleDeleteUser(user)}
                          disabled={busy}
                          className="flex size-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 shadow-xs"
                          aria-label={`Xóa ${user.email}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[880px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Tài khoản & Hội viên</th>
                    <th className="px-6 py-3.5">Liên hệ</th>
                    <th className="px-6 py-3.5">Ngày tham gia</th>
                    <th className="px-6 py-3.5">Vai trò</th>
                    <th className="px-6 py-3.5 text-right">Điều khiển</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const busy = activeUserId === user.id;
                    const tier = user.membership_tier;
                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <div className="min-w-0 space-y-1">
                              <p className="max-w-52 truncate font-bold text-slate-900">
                                {user.full_name || "Chưa đặt tên"}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <MembershipBadge tier={tier} status={user.membership_status} compact={true} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{user.email}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {user.phone || "Chưa có số điện thoại"}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {new Date(user.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.protected ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-bold text-sky-700">
                              <LockKeyhole className="size-3.5" />
                              Được bảo vệ
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={
                                  user.role === "admin" ? "customer" : user.role
                                }
                                onChange={(event) =>
                                  void handleChangeRole(
                                    user,
                                    event.target.value as
                                    "customer" | "provider"
                                  )
                                }
                                disabled={busy}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-orange-500 disabled:opacity-50 shadow-xs"
                                aria-label={`Vai trò của ${user.email}`}
                              >
                                <option value="customer">Khách hàng</option>
                                <option value="provider">Nhà cung cấp</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => void handleDeleteUser(user)}
                                disabled={busy}
                                className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 shadow-xs"
                                aria-label={`Xóa ${user.email}`}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
