import { AdminAccessError, requireAdminUser } from "@/lib/admin/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User;

  try {
    user = await requireAdminUser();
  } catch (error) {
    if (error instanceof AdminAccessError && error.status === 401) {
      redirect("/login?next=%2Fadmin");
    }
    if (error instanceof AdminAccessError && error.status === 403) {
      redirect("/");
    }
    throw error;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = {
    id: user.id,
    email: user.email ?? "livehubwork@gmail.com",
    full_name:
      data?.full_name ??
      user.user_metadata?.full_name ??
      "LiveHub Administrator",
    phone: data?.phone ?? null,
    avatar_url: data?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
    role: "admin",
    bio: data?.bio ?? "Ban quản trị LiveHub",
    created_at: data?.created_at ?? user.created_at,
    ...(data?.membership_tier ? { membership_tier: data.membership_tier } : {}),
    ...(data?.trial_ends_at ? { trial_ends_at: data.trial_ends_at } : {}),
    ...(data?.membership_status
      ? { membership_status: data.membership_status }
      : {}),
  };

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
