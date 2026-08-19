-- Update service rental queries to use explicit relationship names
-- This script should be run in the Supabase SQL Editor

-- Update the service detail page query to use explicit relationship names
-- Replace: .select("*, provider:profiles(*)")
-- With: .select("*, provider:profiles!service_rentals_provider_id_fkey(*)")

-- Update the checkout page query to use explicit relationship names
-- Replace:
-- .select("*, service:services!service_rentals_service_id_fkey(*), customer:profiles!service_rentals_customer_id_fkey(*), provider:profiles!service_rentals_provider_id_fkey(*)")
-- With:
-- .select("*, service:services!service_rentals_service_id_fkey(*), customer:profiles!service_rentals_customer_id_fkey(*), provider:profiles!service_rentals_provider_id_fkey(*)")

-- The relationship names are now properly defined in the migration script above
-- which should resolve the "more than one relationship was found" error