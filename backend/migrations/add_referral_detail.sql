-- Optional sub-choice when referral_source = 'ai_assistant' (e.g. chatgpt, gemini).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_detail text;

COMMENT ON COLUMN public.profiles.referral_detail IS
  'Sub-choice for referral_source. Used when referral_source = ai_assistant (chatgpt, gemini, claude, perplexity, other).';
