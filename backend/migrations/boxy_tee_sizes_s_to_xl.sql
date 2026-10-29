-- Oversized boxy tee: Free Size → S/M/L/XL (same prices). Applied on Supabase 2026-10-29.
-- Product id: 4e518b71-a23b-4841-aaea-d3fb924d999c
-- Existing order_items with size 'Free Size' are unchanged (historical snapshots).

-- 1) Copy pricing (run once; idempotent if Free Size rows already removed)
-- INSERT INTO shirt_pricing (product_id, color_name, size, min_qty, max_qty, price_per_unit_thb)
-- SELECT sp.product_id, sp.color_name, sz.size, sp.min_qty, sp.max_qty, sp.price_per_unit_thb
-- FROM shirt_pricing sp
-- CROSS JOIN (SELECT unnest(ARRAY['S','M','L','XL']) AS size) sz
-- WHERE sp.product_id = '4e518b71-a23b-4841-aaea-d3fb924d999c'
--   AND sp.size = 'Free Size';

-- 2) Size guide
UPDATE products
SET size_guide = '{
  "S": {"อก": 40, "แขนเสื้อ": 8, "ยาว": 25.5},
  "M": {"อก": 43, "แขนเสื้อ": 8, "ยาว": 25.5},
  "L": {"อก": 46, "แขนเสื้อ": 8.5, "ยาว": 26.5},
  "XL": {"อก": 50, "แขนเสื้อ": 9, "ยาว": 27.5}
}'::jsonb
WHERE id = '4e518b71-a23b-4841-aaea-d3fb924d999c';

-- 3) Stop selling Free Size for this product
-- DELETE FROM shirt_pricing
-- WHERE product_id = '4e518b71-a23b-4841-aaea-d3fb924d999c' AND size = 'Free Size';
