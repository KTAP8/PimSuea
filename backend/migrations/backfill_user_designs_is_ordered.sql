-- One-time: mark designs that appear on paid orders
UPDATE user_designs ud
SET is_ordered = true
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE oi.user_design_id = ud.id
  AND o.status IN ('paid_processing', 'printing', 'shipped', 'delivered')
  AND (ud.is_ordered IS DISTINCT FROM true);
