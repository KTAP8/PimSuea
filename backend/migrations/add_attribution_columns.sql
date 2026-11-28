-- First-touch / last-touch marketing attribution captured by the frontend
-- (pimsuea-frontend/src/lib/attribution.ts). Shape:
--   { "first_touch": { utm_source, utm_medium, utm_campaign, utm_content, utm_term,
--                      fbclid, fbc, referrer, landing_path, lang, ts },
--     "last_touch":  { ...same } }
-- Apply BEFORE deploying the backend change that writes orders.attribution.

alter table public.profiles add column if not exists attribution jsonb;
alter table public.orders   add column if not exists attribution jsonb;

create index if not exists profiles_ft_utm_campaign_idx
  on public.profiles ((attribution->'first_touch'->>'utm_campaign'));
create index if not exists orders_ft_utm_campaign_idx
  on public.orders ((attribution->'first_touch'->>'utm_campaign'));
