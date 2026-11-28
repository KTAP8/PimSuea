-- UX redesign: guest studio, saved addresses, locale, lifecycle emails.
-- Apply before deploying the redesign backend/frontend.

-- ── Guests (Supabase anonymous sign-in) ──────────────────────────────────────
alter table public.profiles add column if not exists is_guest boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  accepted boolean;
  current_version integer := 1;
  guest boolean := coalesce(new.is_anonymous, false);
begin
  accepted := not guest
    and coalesce(new.raw_user_meta_data->>'terms_accepted', '') in ('true', 't', '1');

  insert into public.profiles (
    id, email, full_name, is_guest,
    terms_accepted_at, terms_version, privacy_accepted_at
  )
  values (
    new.id, new.email, new.raw_user_meta_data->>'full_name', guest,
    case when accepted then now() else null end,
    case when accepted then current_version else null end,
    case when accepted then now() else null end
  );
  return new;
end;
$function$;

-- A guest that upgrades in place (linkIdentity / updateUser) stops being a guest.
create or replace function public.handle_user_upgraded()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(old.is_anonymous, false) and not coalesce(new.is_anonymous, false) then
    update public.profiles set is_guest = false, email = coalesce(new.email, email) where id = new.id;
  end if;
  return new;
end;
$function$;

drop trigger if exists on_auth_user_upgraded on auth.users;
create trigger on_auth_user_upgraded
  after update of is_anonymous on auth.users
  for each row execute function public.handle_user_upgraded();

-- ── Profile preferences ──────────────────────────────────────────────────────
alter table public.profiles add column if not exists default_shipping jsonb;
alter table public.profiles add column if not exists locale text check (locale in ('en', 'th'));
alter table public.profiles add column if not exists email_opt_out boolean not null default false;

-- ── Lifecycle emails ─────────────────────────────────────────────────────────
alter table public.orders add column if not exists confirmation_email_at timestamptz;
alter table public.orders add column if not exists shipped_email_at timestamptz;

create table if not exists public.lifecycle_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,          -- order_confirmation | shipped | abandoned_cart_1 | abandoned_cart_2 | expired_checkout
  ref_id text not null,        -- order id / user id + cart fingerprint / draft id
  sent_at timestamptz not null default now(),
  unique (kind, ref_id)
);
create index if not exists lifecycle_emails_user_sent_idx on public.lifecycle_emails (user_id, sent_at desc);
alter table public.lifecycle_emails enable row level security;  -- service role only; no policies
