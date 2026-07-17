-- Remove DTF from product catalog offerings.
-- Safe to run: does not delete historical pricing, designs, or orders.

DELETE FROM product_print_methods
WHERE print_method_id IN (
  SELECT id FROM print_methods
  WHERE UPPER(name) = 'DTF'
     OR UPPER(name) LIKE '%DTF%'
     OR UPPER(name) LIKE '%DIRECT TO FILM%'
     OR UPPER(name) LIKE '%DIRECT-TO-FILM%'
);

-- Hide DTF-only products from the public catalog (optional but recommended)
-- UPDATE products SET is_active = false
-- WHERE id NOT IN (
--   SELECT DISTINCT ppm.product_id
--   FROM product_print_methods ppm
--   JOIN print_methods pm ON pm.id = ppm.print_method_id
--   WHERE UPPER(pm.name) NOT LIKE '%DTF%'
--     AND UPPER(pm.name) NOT LIKE '%DIRECT TO FILM%'
--     AND UPPER(pm.name) NOT LIKE '%DIRECT-TO-FILM%'
-- );

-- Optional: deactivate the print method row if your schema has is_active
-- UPDATE print_methods SET is_active = false WHERE UPPER(name) = 'DTF';
