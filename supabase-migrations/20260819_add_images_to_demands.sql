-- Migration: Add images column to demands table (2026-08-19)
BEGIN;

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMIT;
