-- Step 1: Add 'instructor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'instructor';
