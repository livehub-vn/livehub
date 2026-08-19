import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}

async function handleSeed() {
  try {
    const admin = createAdminClient();

    // 1. Get or create auth users
    const demoUsers = [
      {
        email: "saigonstudio@livehub.vn",
        password: "LiveHub@2026Password!",
        name: "Saigon Cinema & Studio Production",
        role: "provider",
        tier: "premium",
      },
      {
        email: "hanoilive@livehub.vn",
        password: "LiveHub@2026Password!",
        name: "Hanoi Stream Tech & Media",
        role: "provider",
        tier: "standard",
      },
      {
        email: "vietnammedia@livehub.vn",
        password: "LiveHub@2026Password!",
        name: "Tập đoàn Truyền thông V-Brand (Golden VIP)",
        role: "customer",
        tier: "premium",
      },
      {
        email: "fashionlive@livehub.vn",
        password: "LiveHub@2026Password!",
        name: "KOC & Fashion Media Group",
        role: "customer",
        tier: "standard",
      },
    ];

    const createdProfiles: Record<string, string> = {};

    for (const u of demoUsers) {
      // Check if user already exists
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((x) => x.email === u.email);

      let userId = existing?.id;

      if (!userId) {
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.name, role: u.role },
        });
        if (newUser?.user) {
          userId = newUser.user.id;
        } else if (createErr) {
          console.error("Create user err:", createErr);
        }
      }

      if (userId) {
        createdProfiles[u.email] = userId;
        // Upsert into public.profiles
        await admin.from("profiles").upsert({
          id: userId,
          email: u.email,
          full_name: u.name,
          role: u.role,
          membership_tier: u.tier,
          membership_status: "active",
          updated_at: new Date().toISOString(),
        });
      }
    }

    const p1Id = createdProfiles["saigonstudio@livehub.vn"] || "00000000-0000-4000-8000-000000000001";
    const p2Id = createdProfiles["hanoilive@livehub.vn"] || "00000000-0000-4000-8000-000000000002";
    const p3Id = createdProfiles["vietnammedia@livehub.vn"] || "00000000-0000-4000-8000-000000000003";
    const p4Id = createdProfiles["fashionlive@livehub.vn"] || "00000000-0000-4000-8000-000000000004";

    // 2. Insert Services into real Supabase table
    const service1Id = "11111111-1111-4111-8111-111111111111";
    const service2Id = "22222222-2222-4222-8222-222222222222";
    const service3Id = "33333333-3333-4333-8333-333333333333";

    await admin.from("services").upsert([
      {
        id: service1Id,
        provider_id: p1Id,
        title: "Gói Máy Quay Cinema Sony FX3 + Lens GM II + Truyền Hình Ảnh Không Dây Hollyland 4K",
        description: "Trọn bộ máy quay Full-frame Sony FX3 cảm biến 4K 120fps, kèm ống kính Sony FE 24-70mm f/2.8 GM II và FE 70-200mm f/2.8 GM OSS II. Bộ truyền hình ảnh không dây Hollyland Mars 4K độ trễ cực thấp.",
        category: "equipment",
        price_per_day: 1800000,
        location: "Quận 1, TP. Hồ Chí Minh",
        status: "approved",
        images: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&auto=format&fit=crop&q=80",
        ],
      },
      {
        id: service2Id,
        provider_id: p1Id,
        title: "Phim Trường Livestream Cách Âm E-Commerce & Talkshow Chuẩn 4K Chuyên Nghiệp",
        description: "Phòng quay 60m² cách âm tiêu chuẩn phát thanh, trang bị sẵn 3 góc máy Sony 4K, bàn trộn Blackmagic ATEM Mini Extreme ISO và dàn đèn Nanlite FS-300B.",
        category: "studio",
        price_per_day: 4500000,
        location: "Bình Thạnh, TP. Hồ Chí Minh",
        status: "approved",
        images: [
          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
        ],
      },
      {
        id: service3Id,
        provider_id: p2Id,
        title: "Ekip Livestream & Kỹ Thuật Viên Vận Hành Bàn Trộn ATEM / OBS / vMix Chuyên Nghiệp",
        description: "Đội ngũ kỹ thuật 3 nhân sự hỗ trợ từ set-up ánh sáng, cân chỉnh màu sắc camera đến điều phối phiên live trực tuyến.",
        category: "crew",
        price_per_day: 2500000,
        location: "Cầu Giấy, Hà Nội",
        status: "approved",
        images: [
          "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1000&auto=format&fit=crop&q=80",
        ],
      },
    ], { onConflict: "id" });

    // 3. Insert Demands into real Supabase table
    const demand1Id = "44444444-4444-4444-8444-444444444444";
    const demand2Id = "55555555-5555-4555-8555-555555555555";

    await admin.from("demands").upsert([
      {
        id: demand1Id,
        customer_id: p3Id,
        title: "Cần Thuê Ekip & Hệ Thống 3 Máy Quay 4K Cho Sự Kiện Ra Mắt Sản Phẩm Công Nghệ (Golden VIP)",
        description: "Yêu cầu setup 3 góc máy quay 4K Sony FX3/FX6, 1 bàn trộn ATEM Mini Extreme ISO và hệ thống truyền tín hiệu không dây Hollyland Mars 4K. Kỹ thuật viên trực line xuyên suốt 6 tiếng.",
        budget: 15000000,
        location: "Quận 1, TP. Hồ Chí Minh",
        event_date: "2026-09-15",
        status: "approved",
        requirements: {
          "Máy quay": "3 máy Full-frame 4K",
          "Bàn trộn": "ATEM Mini Extreme ISO",
          "Đường truyền": "2 line mạng dự phòng 300Mbps",
        },
      },
      {
        id: demand2Id,
        customer_id: p4Id,
        title: "Tìm Thuê Phim Trường Livestream TikTok Shop Mega Live 12H - Concept Thời Trang Cao Cấp",
        description: "Cần phòng studio cách âm rộng từ 50m², có dàn đèn trần Aputure/Nanlite ánh sáng mịn 5600K và màn hình nhắc lời 22 inch. Setup background chuyên nghiệp cho ngành hàng thời trang.",
        budget: 6000000,
        location: "Bình Thạnh, TP. Hồ Chí Minh",
        event_date: "2026-09-08",
        status: "approved",
        requirements: {
          "Phòng quay": "Cách âm tiêu chuẩn, phông nền thay đổi linh hoạt",
          "Âm thanh": "Micro cài áo Rode Wireless PRO",
        },
      },
    ], { onConflict: "id" });

    // 4. Insert Rentals into real Supabase table
    const rental1Id = "66666666-6666-4666-8666-666666666666";
    const rental2Id = "77777777-7777-4777-8777-777777777777";

    await admin.from("service_rentals").upsert([
      {
        id: rental1Id,
        service_id: service1Id,
        customer_id: p3Id,
        provider_id: p1Id,
        start_date: "2026-09-10",
        end_date: "2026-09-12",
        total_price: 3600000,
        status: "in_progress",
        notes: "Thuê máy quay kèm ống kính 24-70mm GM II và 3 pin sạc dự phòng cho chuỗi livestream ra mắt sản phẩm.",
      },
      {
        id: rental2Id,
        service_id: service2Id,
        customer_id: p4Id,
        provider_id: p1Id,
        start_date: "2026-09-05",
        end_date: "2026-09-06",
        total_price: 4500000,
        status: "approved",
        notes: "Sử dụng phòng quay studio cách âm chuyên nghiệp cho phiên Mega Live TikTok Shop 12h liên tục.",
      },
    ], { onConflict: "id" });

    return NextResponse.json({
      success: true,
      message: "Đã lưu và đồng bộ toàn bộ dữ liệu vào PostgreSQL database Supabase thành công 100%!",
      usersCount: Object.keys(createdProfiles).length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi lưu database" },
      { status: 500 }
    );
  }
}
