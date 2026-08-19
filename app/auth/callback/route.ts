import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath, isAdminEmail } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const isAdmin = isAdminEmail(user.email);

        // Check if profile row exists in profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, phone, role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email ?? "",
              full_name:
                user.user_metadata?.full_name ??
                user.email?.split("@")[0] ??
                "Thành viên LiveHub",
              avatar_url: user.user_metadata?.avatar_url ?? null,
              role: isAdmin ? "admin" : "customer",
            });

          if (profileError && !isAdmin) {
            return NextResponse.redirect(
              `${origin}/login?error=profile-create-failed&step=onboarding&next=${encodeURIComponent(next)}`
            );
          }

          if (isAdmin) {
            return NextResponse.redirect(`${origin}/admin`);
          }

          // New user -> prompt role/phone onboarding
          return NextResponse.redirect(
            `${origin}/login?step=onboarding&next=${encodeURIComponent(next)}`
          );
        }

        // Admin email -> ensure role is admin and go to /admin
        if (isAdmin) {
          if (profile.role !== "admin") {
            const { error: roleError } = await supabase
              .from("profiles")
              .update({ role: "admin" })
              .eq("id", user.id);
            if (roleError) {
              // The server-side admin guard uses the configured email as the
              // authority, so a stale display role must not block this account.
              console.error(
                "Unable to sync configured admin profile role",
                roleError.message
              );
            }
          }
          return NextResponse.redirect(`${origin}/admin`);
        }

        if (!profile.phone) {
          // Incomplete profile -> prompt role/phone onboarding
          return NextResponse.redirect(
            `${origin}/login?step=onboarding&next=${encodeURIComponent(next)}`
          );
        }
      }

      // Existing user -> straight to destination with zero intermediate pages!
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
