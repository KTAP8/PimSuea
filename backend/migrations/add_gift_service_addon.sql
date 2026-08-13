-- Gift Service add-on: addon pricing, recipient PII, shipments, cart/order gift fields

-- 1. General-purpose add-on pricing (editable without deploy)
CREATE TABLE IF NOT EXISTS addon_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_thb numeric(10,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE addon_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active addon_pricing"
  ON addon_pricing FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin write addon_pricing"
  ON addon_pricing FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO addon_pricing (code, name, price_thb, is_active)
VALUES ('gift_service', 'Gift Service', 179.00, true)
ON CONFLICT (code) DO NOTHING;

-- 2. Recipient PII — separate from buyer shipping_address (PDPA)
CREATE TABLE IF NOT EXISTS gift_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  full_name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  province text NOT NULL,
  district text NOT NULL,
  postal_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gift_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own collected gift_recipients"
  ON gift_recipients FOR SELECT
  USING (collected_by_user_id = auth.uid());

CREATE POLICY "Users insert gift_recipients"
  ON gift_recipients FOR INSERT
  WITH CHECK (collected_by_user_id = auth.uid());

CREATE POLICY "Admin all gift_recipients"
  ON gift_recipients FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Shipments — one per destination (buyer or each gift line)
CREATE TABLE IF NOT EXISTS order_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('buyer', 'gift')),
  gift_recipient_id uuid REFERENCES gift_recipients(id),
  hide_prices boolean NOT NULL DEFAULT false,
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own order_shipments"
  ON order_shipments FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_shipments.order_id AND o.user_id = auth.uid()));

CREATE POLICY "Users insert order_shipments via order"
  ON order_shipments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_shipments.order_id AND o.user_id = auth.uid()));

CREATE POLICY "Admin all order_shipments"
  ON order_shipments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Cart draft gift fields
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS is_gift boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_message text,
  ADD COLUMN IF NOT EXISTS gift_recipient jsonb;

-- 5. Order line gift fields + shipment link
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS is_gift boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_message text,
  ADD COLUMN IF NOT EXISTS gift_recipient_id uuid REFERENCES gift_recipients(id),
  ADD COLUMN IF NOT EXISTS addon_code text,
  ADD COLUMN IF NOT EXISTS addon_fee_thb numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipment_id uuid REFERENCES order_shipments(id);

CREATE INDEX IF NOT EXISTS idx_order_items_shipment_id ON order_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_order_id ON order_shipments(order_id);
