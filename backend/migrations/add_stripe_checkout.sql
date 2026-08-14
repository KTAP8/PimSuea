-- Stripe Checkout: draft snapshots + order payment metadata

CREATE TABLE IF NOT EXISTS public.checkout_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  stripe_checkout_session_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_drafts_user_id ON public.checkout_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_drafts_stripe_session ON public.checkout_drafts(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_drafts_status_expires ON public.checkout_drafts(status, expires_at);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session ON public.orders(stripe_checkout_session_id);

COMMENT ON TABLE public.checkout_drafts IS 'Cart snapshot between Pay click and Stripe webhook fulfillment';
COMMENT ON COLUMN public.orders.payment_method IS 'e.g. stripe_promptpay, stripe_card';
