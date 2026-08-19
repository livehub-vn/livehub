import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        status: "degraded",
        message: "Supabase environment variables are missing.",
        timestamp: new Date().toISOString(),
        database: {
          status: "misconfigured",
        },
      },
      { status: 503 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Query 1 row from public services or profiles to register active DB traffic and verify connectivity
    const { error } = await supabase
      .from("services")
      .select("id")
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      // Fallback check on profiles table if services returned an error
      const profileCheck = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (profileCheck.error) {
        return NextResponse.json(
          {
            status: "degraded",
            message: "Supabase query failed",
            error: profileCheck.error.message,
            timestamp: new Date().toISOString(),
            database: {
              status: "error",
              latencyMs,
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      status: "healthy",
      message: "LiveHub Keep-Alive Heartbeat Triggered Successfully",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        latencyMs,
      },
      environment: process.env.NODE_ENV || "production",
    });
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        status: "error",
        message: "Internal keep-alive handler error",
        error: errorMessage,
        timestamp: new Date().toISOString(),
        database: {
          status: "unreachable",
          latencyMs,
        },
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "x-livehub-health": "ok",
      "x-livehub-timestamp": new Date().toISOString(),
    },
  });
}
