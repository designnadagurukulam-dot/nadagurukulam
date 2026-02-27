
-- Add slug column to courses for URL-friendly identifiers
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
