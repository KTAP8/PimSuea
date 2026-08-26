-- One Stripe Checkout session may create only one order.
-- 'completing' is a short-lived claim so webhook + poll cannot double-insert.

ALTER TABLE public.checkout_drafts DROP CONSTRAINT IF EXISTS checkout_drafts_status_check;
ALTER TABLE public.checkout_drafts ADD CONSTRAINT checkout_drafts_status_check
  CHECK (status IN ('pending', 'completing', 'completed', 'expired', 'cancelled'));

DROP INDEX IF EXISTS public.idx_orders_stripe_checkout_session;
CREATE UNIQUE INDEX idx_orders_stripe_checkout_session
  ON public.orders (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

COMMENT ON COLUMN public.checkout_drafts.status IS 'pending → completing (claim) → completed after order insert. expired/cancelled are terminal without an order.';
