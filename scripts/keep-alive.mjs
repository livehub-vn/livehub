/**
 * LiveHub & Supabase Keep-Alive Trigger Script
 * Runs via Node.js in GitHub Actions or locally.
 * Prevents Supabase project from auto-pausing after 7 days of inactivity.
 */

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pabomqopgvaekbrblcnk.supabase.co"
).trim().replace(/\/+$/, "");

const SUPABASE_ANON_KEY = (
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYm9tcW9wZ3ZhZWticmJsY25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTA2MzEsImV4cCI6MjA2MDQ4NjYzMX0.bGyca7srUEAcpjdFQ2Xv7hCI7BH8x9Lt0H7duCC1bG0"
).trim();

const APP_URL = (
  process.env.LIVEHUB_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://livehub.vn"
).trim().replace(/\/+$/, "");

async function pingSupabase() {
  const targetEndpoint = `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`;
  console.log(`\n🗄️ [1/2] Pinging Supabase Database Endpoint: ${targetEndpoint}`);

  const startTime = Date.now();
  try {
    const response = await fetch(targetEndpoint, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const latencyMs = Date.now() - startTime;
    const bodyText = await response.text();

    console.log(`   HTTP Status: ${response.status} ${response.statusText} (${latencyMs}ms)`);
    console.log(`   Response: ${bodyText.slice(0, 150)}`);

    if (response.ok) {
      console.log(`   ✅ Supabase Database is ACTIVE! (7-day pause timer reset)`);
      return { ok: true, status: response.status, latencyMs };
    } else {
      console.warn(`   ⚠️ Supabase returned non-200 status: ${response.status}`);
      return { ok: false, status: response.status, latencyMs };
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error(`   ❌ Supabase Ping Failed:`, error.message);
    return { ok: false, error: error.message, latencyMs };
  }
}

async function pingLiveHubApp() {
  const healthEndpoint = `${APP_URL}/api/health`;
  console.log(`\n🌐 [2/2] Pinging LiveHub Web Health Endpoint: ${healthEndpoint}`);

  const startTime = Date.now();
  try {
    const response = await fetch(healthEndpoint, {
      method: "GET",
      headers: {
        "User-Agent": "LiveHub-KeepAlive-Bot/1.0",
      },
      signal: AbortSignal.timeout(15000),
    });

    const latencyMs = Date.now() - startTime;
    const bodyText = await response.text();

    console.log(`   HTTP Status: ${response.status} ${response.statusText} (${latencyMs}ms)`);
    console.log(`   Response: ${bodyText.slice(0, 150)}`);

    if (response.ok) {
      console.log(`   ✅ LiveHub Web App is Healthy!`);
      return { ok: true, status: response.status, latencyMs };
    } else {
      console.log(`   ℹ️ LiveHub Web App returned status ${response.status}`);
      return { ok: false, status: response.status, latencyMs };
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.log(`   ℹ️ LiveHub Web App ping note: ${error.message}`);
    return { ok: false, error: error.message, latencyMs };
  }
}

async function main() {
  console.log("=========================================");
  console.log("🚀 LiveHub Keep-Alive Heartbeat Trigger");
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log("=========================================");

  const supabaseResult = await pingSupabase();
  const appResult = await pingLiveHubApp();

  console.log("\n=========================================");
  console.log("📊 Summary Report:");
  console.log(`- Supabase DB: ${supabaseResult.ok ? "✅ SUCCESS" : "⚠️ CHECK"}`);
  console.log(`- LiveHub App: ${appResult.ok ? "✅ SUCCESS" : "ℹ️ PINGED"}`);
  console.log("=========================================\n");

  // As long as Supabase ping succeeded, the keep-alive goal is 100% achieved!
  if (supabaseResult.ok) {
    console.log("🎉 Heartbeat completed successfully!");
    process.exit(0);
  } else {
    console.error("❌ Critical: Supabase ping failed.");
    process.exit(1);
  }
}

main();
