import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const TURNKEY_PACKAGES = {
  ecommerce: {
    name: "Gói Livestream Bán Hàng E-Commerce",
    price: 5_500_000,
  },
  talkshow: {
    name: "Gói Talkshow & Hội Thảo Doanh Nghiệp",
    price: 12_500_000,
  },
  "mega-event": {
    name: "Gói Sự Kiện Ra Mắt & Đại Nhạc Hội Mega Event",
    price: 28_000_000,
  },
} as const;

type PackageId = keyof typeof TURNKEY_PACKAGES;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverSecretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serverSecretKey) return null;

  return createSupabaseAdmin(supabaseUrl, serverSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  const bookingId = new URL(request.url).searchParams.get("id");
  if (!bookingId) {
    return NextResponse.json({ error: "Thiếu mã đăng ký." }, { status: 400 });
  }

  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Máy chủ tiếp nhận đăng ký chưa được cấu hình." },
      { status: 503 }
    );
  }

  const { data, error } = await admin
    .from("turnkey_package_bookings")
    .select("id, user_id, customer_email, package_name, estimated_price")
    .eq("id", bookingId)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json(
      { error: "Không tìm thấy đăng ký gói dịch vụ." },
      { status: 404 }
    );
  }

  if (
    (data.user_id && data.user_id !== user.id) ||
    (!data.user_id &&
      data.customer_email.toLowerCase() !== user.email?.toLowerCase())
  ) {
    return NextResponse.json(
      { error: "Đăng ký này không thuộc tài khoản của bạn." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    id: data.id,
    packageName: data.package_name,
    estimatedPrice: Number(data.estimated_price) || 0,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu đăng ký không hợp lệ." },
      { status: 400 }
    );
  }

  const packageId = cleanText(body.packageId, 40) as PackageId;
  const selectedPackage = TURNKEY_PACKAGES[packageId];
  const customerName = cleanText(body.customerName, 120);
  const customerPhone = cleanText(body.customerPhone, 30);
  const customerEmail = cleanText(body.customerEmail, 180).toLowerCase();
  const eventDate = cleanText(body.eventDate, 20);
  const location = cleanText(body.location, 240) || "TP. Hồ Chí Minh";
  const notes = cleanText(body.notes, 2_000);

  if (
    !selectedPackage ||
    customerName.length < 2 ||
    customerPhone.length < 8 ||
    !/^\S+@\S+\.\S+$/.test(customerEmail) ||
    !eventDate ||
    !location
  ) {
    return NextResponse.json(
      { error: "Vui lòng kiểm tra lại các thông tin bắt buộc." },
      { status: 400 }
    );
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Máy chủ tiếp nhận đăng ký chưa được cấu hình." },
      { status: 503 }
    );
  }

  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  const { data, error } = await admin
    .from("turnkey_package_bookings")
    .insert({
      user_id: user?.id ?? null,
      package_name: selectedPackage.name,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      event_date: eventDate,
      location,
      notes: notes || null,
      estimated_price: selectedPackage.price,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return NextResponse.json(
      {
        error: error?.message || "Không thể lưu đăng ký gói dịch vụ lúc này.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
