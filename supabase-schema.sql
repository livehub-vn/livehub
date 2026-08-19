-- ==============================================================================
-- LiveHub Complete Database Schema & Migration Script
-- Execute this script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pabomqopgvaekbrblcnk/sql
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'provider', 'admin')),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create SERVICES Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('equipment', 'studio', 'crew', 'operator')),
    price_per_day NUMERIC NOT NULL DEFAULT 0,
    location TEXT NOT NULL DEFAULT 'Hồ Chí Minh',
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'closed')),
    rejection_reason TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create DEMANDS Table
CREATE TABLE IF NOT EXISTS public.demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    budget NUMERIC NOT NULL DEFAULT 0,
    location TEXT NOT NULL DEFAULT 'Hồ Chí Minh',
    event_date TEXT,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed', 'closed')),
    rejection_reason TEXT,
    requirements JSONB DEFAULT '{}'::jsonb,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create SERVICE RENTALS Table
CREATE TABLE IF NOT EXISTS public.service_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_price NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create DEMAND APPLICATIONS Table
CREATE TABLE IF NOT EXISTS public.demand_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposed_price NUMERIC NOT NULL DEFAULT 0,
    proposal_note TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create REVIEWS Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating NUMERIC NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_livehub_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.role() = 'service_role'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'livehubwork@gmail.com';
$$;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND (
      role IN ('customer', 'provider')
      OR (role = 'admin' AND public.is_livehub_admin())
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_livehub_admin())
  WITH CHECK (
    public.is_livehub_admin()
    OR (auth.uid() = id AND role IN ('customer', 'provider'))
  );

-- Services Policies
DROP POLICY IF EXISTS "Anyone can view approved services" ON public.services;
CREATE POLICY "Anyone can view approved services" ON public.services FOR SELECT
  USING (status = 'approved' OR auth.uid() = provider_id OR public.is_livehub_admin());

DROP POLICY IF EXISTS "Authenticated users can create services" ON public.services;
CREATE POLICY "Authenticated users can create services" ON public.services FOR INSERT WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers can update their own services" ON public.services;
CREATE POLICY "Providers can update their own services" ON public.services FOR UPDATE
  USING (auth.uid() = provider_id OR public.is_livehub_admin())
  WITH CHECK (auth.uid() = provider_id OR public.is_livehub_admin());

-- Demands Policies
DROP POLICY IF EXISTS "Anyone can view approved demands" ON public.demands;
CREATE POLICY "Anyone can view approved demands" ON public.demands FOR SELECT
  USING (status = 'approved' OR auth.uid() = customer_id OR public.is_livehub_admin());

DROP POLICY IF EXISTS "Authenticated users can create demands" ON public.demands;
CREATE POLICY "Authenticated users can create demands" ON public.demands FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update their own demands" ON public.demands;
CREATE POLICY "Customers can update their own demands" ON public.demands FOR UPDATE
  USING (auth.uid() = customer_id OR public.is_livehub_admin())
  WITH CHECK (auth.uid() = customer_id OR public.is_livehub_admin());

-- Rentals Policies
DROP POLICY IF EXISTS "Users can view their own rentals" ON public.service_rentals;
CREATE POLICY "Users can view their own rentals" ON public.service_rentals FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS "Authenticated users can create rentals" ON public.service_rentals;
CREATE POLICY "Authenticated users can create rentals" ON public.service_rentals FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Participants can update rentals" ON public.service_rentals;
CREATE POLICY "Participants can update rentals" ON public.service_rentals FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- Demand Applications Policies
DROP POLICY IF EXISTS "Anyone can view applications" ON public.demand_applications;
CREATE POLICY "Anyone can view applications" ON public.demand_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Providers can create applications" ON public.demand_applications;
CREATE POLICY "Providers can create applications" ON public.demand_applications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reviews Policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN lower(NEW.email) = 'livehubwork@gmail.com' THEN 'admin'
      ELSE 'customer'
    END,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- INITIAL SAMPLE DATA (Marketplace Services & Demands)
-- ==============================================================================

-- Create demo provider profile if not exists
-- The seed block runs only if matching demo auth users were provisioned first.
-- It is skipped on normal projects so profile foreign keys cannot abort later DDL.
DO $livehub_seed$
BEGIN
IF EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = 'd0000001-0000-0000-0000-000000000001'::uuid
) AND EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = 'd0000001-0000-0000-0000-000000000002'::uuid
) AND EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = 'd0000001-0000-0000-0000-000000000003'::uuid
) THEN
INSERT INTO public.profiles (id, email, full_name, role, phone, avatar_url, bio)
VALUES 
  ('d0000001-0000-0000-0000-000000000001', 'saigonstudio@livehub.vn', 'Saigon Cinema & Studio Production', 'provider', '0908889999', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces', 'Đơn vị cung cấp thiết bị máy quay điện ảnh, studio cách âm và ekip livestream chuyên nghiệp tại TP. Hồ Chí Minh.'),
  ('d0000001-0000-0000-0000-000000000002', 'hanoilive@livehub.vn', 'Hanoi Stream Tech & Media', 'provider', '0912334455', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces', 'Chuyên cho thuê bàn trộn ATEM, hệ thống đèn trường quay Nanlite/Aputure và kỹ thuật viên livestream sự kiện.'),
  ('d0000001-0000-0000-0000-000000000003', 'vietnammedia@livehub.vn', 'Tập đoàn Truyền thông V-Brand', 'customer', '0977665544', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces', 'Doanh nghiệp tổ chức sự kiện và bán lẻ đa kênh trực tuyến.')
ON CONFLICT (id) DO NOTHING;

-- Seed Services
INSERT INTO public.services (id, provider_id, title, description, category, price_per_day, location, status, images, specs)
VALUES
  (
    '50000001-0000-0000-0000-000000000001',
    'd0000001-0000-0000-0000-000000000001',
    'Gói Máy Quay Cinema Sony FX3 + Ống Kính GM II + Truyền Hình Ảnh Không Dây',
    'Trọn bộ máy quay Full-frame Sony FX3 cảm biến 4K 120fps, kèm ống kính Sony FE 24-70mm f/2.8 GM II và FE 70-200mm f/2.8 GM OSS II. Bộ truyền hình ảnh không dây Hollyland Mars 4K độ trễ cực thấp dưới 0.06s, hỗ trợ livestream trực tiếp với chất lượng màu sắc chuẩn S-Cinetone.',
    'equipment',
    1800000,
    'Quận 1, TP. Hồ Chí Minh',
    'approved',
    ARRAY['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&auto=format&fit=crop&q=80'],
    '{"Cảm biến": "Full-frame 12.1 MP", "Độ phân giải": "4K UHD 120p", "Hệ màu": "S-Cinetone, S-Log3"}'::jsonb
  ),
  (
    '50000001-0000-0000-0000-000000000002',
    'd0000001-0000-0000-0000-000000000001',
    'Studio Livestream Cách Âm E-Commerce & Talkshow Chuẩn 4K',
    'Phòng quay 60m² cách âm tiêu chuẩn phát thanh, trang bị sẵn 3 góc máy Sony 4K, bàn trộn Blackmagic ATEM Mini Extreme ISO, hệ thống đèn trần Nanlite FS-300B và màn hình nhắc lời Teleprompter 22 inch. Thích hợp livestream bán hàng TikTok Shop, Shopee và talkshow thương hiệu.',
    'studio',
    4500000,
    'Bình Thạnh, TP. Hồ Chí Minh',
    'approved',
    ARRAY['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1000&auto=format&fit=crop&q=80'],
    '{"Diện tích": "60m²", "Đường truyền": "Cáp quang 500Mbps", "Âm thanh": "Micro Rode Wireless PRO"}'::jsonb
  ),
  (
    '50000001-0000-0000-0000-000000000003',
    'd0000001-0000-0000-0000-000000000002',
    'Ekip Sản Xuất Livestream Sự Kiện & Hội Nghị Đa Máy Quay (3-4 Máy 4K)',
    'Cung cấp trọn gói đội ngũ nhân sự gồm: 1 Đạo diễn hình ảnh (Switcher), 3 Quay phim chuyên nghiệp, 1 Kỹ sư âm thanh (Audio Engineer). Đầy đủ thiết bị bàn trộn, màn hình Multiview, hệ thống liên lạc nội bộ Intercom Hollyland Solidcom C1.',
    'crew',
    8500000,
    'Cầu Giấy, Hà Nội',
    'approved',
    ARRAY['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1000&auto=format&fit=crop&q=80'],
    '{"Nhân sự": "5 nhân sự chính thức", "Thời lượng": "Phục vụ cả ngày", "Nền tảng": "Đa luồng Facebook, YouTube, TikTok"}'::jsonb
  ),
  (
    '50000001-0000-0000-0000-000000000004',
    'd0000001-0000-0000-0000-000000000002',
    'Kỹ Thuật Viên Vmix / OBS & Vận Hành Bàn Trộn ATEM Livestream',
    'Kỹ thuật viên hơn 5 năm kinh nghiệm setup hệ thống livestream phức tạp, xử lý đồ họa hạ tầng lower-third, scoreboard, video intro/outro, kết nối cầu truyền hình vMix Call / Zoom không độ trễ, kiểm soát bitrate đường truyền an toàn tuyệt đối.',
    'operator',
    1500000,
    'Hà Nội & TP. Hồ Chí Minh',
    'approved',
    ARRAY['https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1000&auto=format&fit=crop&q=80'],
    '{"Phần mềm": "vMix Pro 4K, OBS, ATEM Software", "Kinh nghiệm": "200+ sự kiện"}'::jsonb
  ),
  (
    '50000001-0000-0000-0000-000000000005',
    'd0000001-0000-0000-0000-000000000001',
    'Bộ Đèn Studio Chuyên Nghiệp Aputure 600d Pro + Nanlite Forza + Softbox Lantern',
    'Gói ánh sáng cao cấp dành cho phim trường & livestream chuyên nghiệp gồm: 1x Aputure LS 600d Pro (nguồn sáng chính cực mạnh), 2x Nanlite Forza 300B Bi-color, 2x Đèn led thanh Nanlite Pavotube II 30C RGBWW, đầy đủ chân C-stand, tạ cát và ngàm Bowens.',
    'equipment',
    2200000,
    'Quận 7, TP. Hồ Chí Minh',
    'approved',
    ARRAY['https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1000&auto=format&fit=crop&q=80'],
    '{"Chỉ số hoàn màu": "CRI 96+, TLCI 98+", "Phụ kiện": "Softbox Octa 120cm, Lantern 90cm"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Demands
INSERT INTO public.demands (id, customer_id, title, description, budget, location, event_date, status, requirements)
VALUES
  (
    'd0000002-0000-0000-0000-000000000001',
    'd0000001-0000-0000-0000-000000000003',
    'Cần Thuê Ekip & Thiết Bị Livestream Ra Mắt Bộ Sưu Tập Thời Trang Thu Đông',
    'Doanh nghiệp cần tìm đơn vị sản xuất livestream runway thời trang tại trung tâm White Palace. Yêu cầu tối thiểu 3 máy quay 4K, đường truyền LiveU hoặc mạng vệ tinh backup, bàn trộn và hệ thống âm thanh trực tiếp.',
    18000000,
    'Phú Nhuận, TP. Hồ Chí Minh',
    '2026-09-15',
    'approved',
    '{"Máy quay": "3 máy Sony FX3/FX6", "Hình thức": "Trọn gói thiết bị + nhân sự"}'::jsonb
  ),
  (
    'd0000002-0000-0000-0000-000000000002',
    'd0000001-0000-0000-0000-000000000003',
    'Cần Thuê Studio Cách Âm Livestream TikTok Shop Mega Sale 24 Giờ',
    'Tìm studio diện tích 40-70m² tại khu vực Đống Đa / Cầu Giấy để phát sóng bán hàng liên tục 24h. Yêu cầu trang bị sẵn hệ thống đèn, máy lạnh công suất lớn, phòng nghỉ cho KOC và internet riêng.',
    25000000,
    'Cầu Giấy, Hà Nội',
    '2026-09-20',
    'approved',
    '{"Thời lượng": "24 tiếng liên tục chia ca", "Đường truyền": "Cáp quang 300Mbps"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

END IF;
END
$livehub_seed$;

-- 8. Alter PROFILES Table for 2-Month Free Trial & Membership Tiers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free_trial' CHECK (membership_tier IN ('free_trial', 'basic', 'standard', 'premium'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '60 days');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'expiring_soon', 'expired'));

-- 9. Create TRANSACTIONS Table for Real QR Payment & Checkout Orders
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rental_id UUID REFERENCES public.service_rentals(id) ON DELETE SET NULL,
    membership_tier TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'vietqr' CHECK (payment_method IN ('vietqr', 'vnpay', 'momo', 'zalopay', 'card')),
    payment_status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (payment_status IN ('pending_payment', 'processing', 'completed', 'failed', 'refunded')),
    transaction_ref TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create TURNKEY PACKAGE BOOKINGS Table
CREATE TABLE IF NOT EXISTS public.turnkey_package_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    package_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    event_date TEXT NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    estimated_price NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.turnkey_package_bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.turnkey_package_bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS package_booking_id UUID REFERENCES public.turnkey_package_bookings(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnkey_package_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Auth user insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Auth user update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_livehub_admin());

DROP POLICY IF EXISTS "Public read package bookings" ON public.turnkey_package_bookings;
DROP POLICY IF EXISTS "Public insert package bookings" ON public.turnkey_package_bookings;
DROP POLICY IF EXISTS "Users can read own package bookings" ON public.turnkey_package_bookings;
CREATE POLICY "Users can read own package bookings" ON public.turnkey_package_bookings FOR SELECT
  USING (auth.uid() = user_id OR public.is_livehub_admin());

CREATE OR REPLACE FUNCTION public.protect_profile_system_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_livehub_admin() THEN
    IF lower(NEW.email) = 'livehubwork@gmail.com' THEN
      NEW.role := 'admin';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.membership_tier IS DISTINCT FROM OLD.membership_tier
    OR NEW.membership_status IS DISTINCT FROM OLD.membership_status
    OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
    OR NEW.role = 'admin'
  THEN
    RAISE EXCEPTION 'Protected profile fields can only be changed by LiveHub server';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_system_fields ON public.profiles;
CREATE TRIGGER protect_profile_system_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_system_fields();
