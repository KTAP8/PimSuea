-- English category label for bilingual catalog.
-- `name` remains the primary Thai/default label.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_en text;

COMMENT ON COLUMN public.categories.name_en IS
  'Optional English display name; falls back to name when null.';

-- Idempotent backfill for known categories (does not modify `name`).
UPDATE public.categories SET name_en = 'T-shirts'
  WHERE name = 'เสื้อยืด' AND name_en IS NULL;

UPDATE public.categories SET name_en = 'Hoodies & sweatshirts'
  WHERE name = 'เสื้อกันหนาว' AND name_en IS NULL;

UPDATE public.categories SET name_en = 'Bags'
  WHERE name = 'กระเป๋า' AND name_en IS NULL;
