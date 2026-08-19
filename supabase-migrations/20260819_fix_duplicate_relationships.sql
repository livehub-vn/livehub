-- Fix duplicate relationships in service_rentals table
-- This script will properly define foreign key relationships to fix the "more than one relationship" error

BEGIN;

-- Drop existing foreign key constraints to clean up any duplicates
ALTER TABLE public.service_rentals
DROP CONSTRAINT IF EXISTS service_rentals_customer_id_fkey;

ALTER TABLE public.service_rentals
DROP CONSTRAINT IF EXISTS service_rentals_provider_id_fkey;

ALTER TABLE public.service_rentals
DROP CONSTRAINT IF EXISTS service_rentals_service_id_fkey;

-- Recreate the foreign key constraints with explicit names
-- This fixes the issue where Supabase couldn't distinguish between multiple relationships to profiles
ALTER TABLE public.service_rentals
ADD CONSTRAINT service_rentals_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.service_rentals
ADD CONSTRAINT service_rentals_provider_id_fkey
FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.service_rentals
ADD CONSTRAINT service_rentals_service_id_fkey
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

-- Create explicit relationship views for better querying
-- This helps prevent ambiguity in relationship queries
CREATE OR REPLACE VIEW service_rentals_with_details AS
SELECT
  sr.*,
  s.title as service_title,
  s.description as service_description,
  s.category as service_category,
  s.location as service_location,
  s.price_per_day as service_price_per_day,
  c.full_name as customer_name,
  c.email as customer_email,
  p.full_name as provider_name,
  p.email as provider_email
FROM public.service_rentals sr
LEFT JOIN public.services s ON sr.service_id = s.id
LEFT JOIN public.profiles c ON sr.customer_id = c.id
LEFT JOIN public.profiles p ON sr.provider_id = p.id;

-- Commit the changes
COMMIT;