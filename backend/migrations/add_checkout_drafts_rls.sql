-- checkout_drafts is backend-only (service role via API). Block direct client access.

ALTER TABLE public.checkout_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all checkout_drafts"
  ON public.checkout_drafts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
