-- Account-level consent lives on profiles (there is no public.users table).
-- Order-level consent is stored separately so checkout / future guest orders
-- keep a snapshot even if the account later re-accepts a newer version.
--
-- CURRENT_TERMS_VERSION = 1 (March 2026 ToS in TermsModal).
-- Bump the integer in handle_new_user() together with backend/src/constants/legal.js
-- when ToS or Privacy changes materially (e.g. gift-mode / PDPA recipient data).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version integer,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz;

COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'When the user last accepted the current Terms of Service. Null = never recorded.';
COMMENT ON COLUMN public.profiles.terms_version IS 'Integer version of ToS/Privacy the account last accepted. Bump CURRENT_TERMS_VERSION when either document changes materially.';
COMMENT ON COLUMN public.profiles.privacy_accepted_at IS 'When the user last accepted the Privacy Policy. Same moment as terms until Privacy is a separate document.';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version integer,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz;

COMMENT ON COLUMN public.orders.terms_accepted_at IS 'When this order was placed under the then-current Terms of Service.';
COMMENT ON COLUMN public.orders.terms_version IS 'ToS/Privacy version in force at checkout. Independent of profiles.terms_version.';
COMMENT ON COLUMN public.orders.privacy_accepted_at IS 'When this order was placed under the then-current Privacy Policy.';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted boolean;
  current_version integer := 1;
BEGIN
  accepted := COALESCE(NEW.raw_user_meta_data->>'terms_accepted', '') IN ('true', 't', '1');

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    terms_accepted_at,
    terms_version,
    privacy_accepted_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN accepted THEN now() ELSE NULL END,
    CASE WHEN accepted THEN current_version ELSE NULL END,
    CASE WHEN accepted THEN now() ELSE NULL END
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_consent_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    NEW.terms_accepted_at := OLD.terms_accepted_at;
    NEW.terms_version := OLD.terms_version;
    NEW.privacy_accepted_at := OLD.privacy_accepted_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profiles_consent ON public.profiles;
CREATE TRIGGER protect_profiles_consent
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_consent_columns();

DROP TRIGGER IF EXISTS protect_orders_consent ON public.orders;
CREATE TRIGGER protect_orders_consent
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_consent_columns();
