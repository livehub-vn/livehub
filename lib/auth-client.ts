"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Trigger immediate Google OAuth login with Supabase and return to destination
 */
export async function loginWithGoogle(nextPath?: string) {
  try {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const currentPath =
      nextPath ||
      (typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(currentPath)}`,
      },
    });

    if (error) {
      console.error("Google sign in error:", error);
    }
  } catch (err) {
    console.error("Error signing in with Google:", err);
  }
}
