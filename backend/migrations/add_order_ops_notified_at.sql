-- Set after a successful ops Telegram alert so Stripe retries do not send twice.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ops_notified_at timestamptz;

COMMENT ON COLUMN public.orders.ops_notified_at IS
  'When the paid-order Telegram alert was sent. Null means not yet notified.';
