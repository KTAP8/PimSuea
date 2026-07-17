-- Remove DTF from product catalog offerings.
-- Safe to run: does not delete historical pricing, designs, or orders.

DELETE FROM product_print_methods
WHERE print_method_id IN (
  SELECT id FROM print_methods WHERE UPPER(name) = 'DTF'
);

-- Optional: deactivate the print method row if your schema has is_active
-- UPDATE print_methods SET is_active = false WHERE UPPER(name) = 'DTF';
