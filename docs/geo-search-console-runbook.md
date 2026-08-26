# GEO — Search Console & Bing Webmaster

Manual ops checklist (Phase 1, same week as deploy).

## Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property `https://pimsuea.com` (DNS TXT or HTML file — use Vercel DNS if domain is on Vercel)
3. Submit sitemap: `https://pimsuea.com/sitemap.xml`
4. URL inspection — request indexing for:
   - `/`
   - `/print-on-demand`
   - `/pricing`
   - `/vs-printful`

## Bing Webmaster Tools

Bing feeds ChatGPT search — do not skip.

1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add site `https://pimsuea.com` (import from GSC if available)
3. Submit sitemap: `https://pimsuea.com/sitemap.xml`
4. URL submission for the four marketing URLs above

## Post-deploy verification

- [ ] `curl -s https://pimsuea.com/robots.txt` shows GPTBot / PerplexityBot / ClaudeBot allowed
- [ ] `curl -s https://pimsuea.com/llms.txt` returns canonical facts
- [ ] View-source on `/` shows FAQ answer text in HTML (collapsed CSS, not unmounted)
- [ ] PostHog project host is `https://eu.i.posthog.com` in Vercel env (`VITE_PUBLIC_POSTHOG_HOST`)
- [ ] After a week: check PostHog web analytics for referrers `chatgpt.com`, `perplexity.ai`

## Database migration

Apply before deploy if not already on production:

```bash
# File: backend/migrations/add_referral_detail.sql
psql $DATABASE_URL -f backend/migrations/add_referral_detail.sql
```

Or run via Supabase SQL editor:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_detail text;
```
