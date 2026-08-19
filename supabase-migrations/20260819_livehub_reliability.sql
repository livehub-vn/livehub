-- LiveHub reliability/security migration (2026-08-19)
-- Run once in the Supabase SQL Editor for the configured project.
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

REVOKE ALL ON FUNCTION public.is_livehub_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_livehub_admin() TO anon, authenticated, service_role;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free_trial';
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ
  DEFAULT (timezone('utc'::text, now()) + INTERVAL '60 days');
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_membership_tier_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_membership_tier_check
      CHECK (membership_tier IN ('free_trial', 'basic', 'standard', 'premium'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_membership_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_membership_status_check
      CHECK (membership_status IN ('active', 'expiring_soon', 'expired'));
  END IF;
END $$;

ALTER TABLE public.service_rentals
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending_payment';
ALTER TABLE public.service_rentals
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

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
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.turnkey_package_bookings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.turnkey_package_bookings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ
  DEFAULT timezone('utc'::text, now()) NOT NULL;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES public.service_rentals(id) ON DELETE SET NULL,
  package_booking_id UUID REFERENCES public.turnkey_package_bookings(id) ON DELETE SET NULL,
  membership_tier TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'vietqr'
    CHECK (payment_method IN ('vietqr', 'vnpay', 'momo', 'zalopay', 'card')),
  payment_status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (payment_status IN ('pending_payment', 'processing', 'completed', 'failed', 'refunded')),
  transaction_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS package_booking_id UUID
  REFERENCES public.turnkey_package_bookings(id) ON DELETE SET NULL;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnkey_package_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Auth user insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Auth user update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_livehub_admin());

DROP POLICY IF EXISTS "Public read package bookings" ON public.turnkey_package_bookings;
DROP POLICY IF EXISTS "Public insert package bookings" ON public.turnkey_package_bookings;
DROP POLICY IF EXISTS "Users can read own package bookings" ON public.turnkey_package_bookings;
CREATE POLICY "Users can read own package bookings"
  ON public.turnkey_package_bookings FOR SELECT
  USING (auth.uid() = user_id OR public.is_livehub_admin());

-- Public consultation requests are accepted through the protected server route.
-- Direct browser writes are intentionally disabled.

DROP POLICY IF EXISTS "Anyone can view approved services" ON public.services;
CREATE POLICY "Anyone can view approved services"
  ON public.services FOR SELECT
  USING (
    status = 'approved'
    OR auth.uid() = provider_id
    OR public.is_livehub_admin()
  );

DROP POLICY IF EXISTS "Authenticated users can create services" ON public.services;
CREATE POLICY "Authenticated users can create services"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers can update their own services" ON public.services;
CREATE POLICY "Providers can update their own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = provider_id OR public.is_livehub_admin())
  WITH CHECK (auth.uid() = provider_id OR public.is_livehub_admin());

DROP POLICY IF EXISTS "Providers can delete their own services" ON public.services;
CREATE POLICY "Providers can delete their own services"
  ON public.services FOR DELETE
  USING (auth.uid() = provider_id OR public.is_livehub_admin());

DROP POLICY IF EXISTS "Anyone can view approved demands" ON public.demands;
CREATE POLICY "Anyone can view approved demands"
  ON public.demands FOR SELECT
  USING (
    status = 'approved'
    OR auth.uid() = customer_id
    OR public.is_livehub_admin()
  );

DROP POLICY IF EXISTS "Authenticated users can create demands" ON public.demands;
CREATE POLICY "Authenticated users can create demands"
  ON public.demands FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update their own demands" ON public.demands;
CREATE POLICY "Customers can update their own demands"
  ON public.demands FOR UPDATE
  USING (auth.uid() = customer_id OR public.is_livehub_admin())
  WITH CHECK (auth.uid() = customer_id OR public.is_livehub_admin());

DROP POLICY IF EXISTS "Customers can delete their own demands" ON public.demands;
CREATE POLICY "Customers can delete their own demands"
  ON public.demands FOR DELETE
  USING (auth.uid() = customer_id OR public.is_livehub_admin());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND (
      role IN ('customer', 'provider')
      OR (role = 'admin' AND public.is_livehub_admin())
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_livehub_admin())
  WITH CHECK (
    public.is_livehub_admin()
    OR (auth.uid() = id AND role IN ('customer', 'provider'))
  );

DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;
CREATE POLICY "Admin can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_livehub_admin());

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN lower(NEW.email) = 'livehubwork@gmail.com' THEN 'admin'
      ELSE 'customer'
    END,
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

UPDATE public.profiles
SET role = 'admin', updated_at = timezone('utc'::text, now())
WHERE lower(email) = 'livehubwork@gmail.com';

DROP TRIGGER IF EXISTS protect_profile_system_fields ON public.profiles;
CREATE TRIGGER protect_profile_system_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_system_fields();

CREATE INDEX IF NOT EXISTS transactions_user_created_idx
  ON public.transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_status_created_idx
  ON public.transactions (payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS package_bookings_user_created_idx
  ON public.turnkey_package_bookings (user_id, created_at DESC);

COMMIT;
