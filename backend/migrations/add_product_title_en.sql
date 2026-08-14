-- English product title for bilingual catalog (landing EN toggle, future i18n).
-- `title` remains the primary Thai/default name.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS title_en text;

COMMENT ON COLUMN products.title_en IS 'Optional English display title; falls back to title when null.';
