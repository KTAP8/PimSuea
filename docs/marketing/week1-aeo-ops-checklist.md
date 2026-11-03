# Week 1 — AEO ops checklist

Complete once, then rely on [geo-weekly-scorecard.md](../geo-weekly-scorecard.md) every Monday.

## Automated (after deploy)

```bash
chmod +x scripts/verify-geo-public.sh
MARKETING_ORIGIN=https://pimsuea.com ./scripts/verify-geo-public.sh
```

Local marketing preview:

```bash
cd pimsuea-frontend && VITE_FORCE_MARKETING=true npm run dev
# MARKETING_ORIGIN=http://localhost:5173 ./scripts/verify-geo-public.sh
```

## 12-prompt baseline scorecard

Run all prompts in ChatGPT (search on), Gemini, Perplexity, Claude. Log results in [geo-scorecard-log.md](./geo-scorecard-log.md).

Prompt list: [geo-weekly-scorecard.md](../geo-weekly-scorecard.md).

## Google Search Console

Follow [geo-search-console-runbook.md](../geo-search-console-runbook.md):

- Property `https://pimsuea.com`
- Submit sitemap
- Request indexing for all six marketing URLs (including `/custom-shirt-no-minimum`, `/club-and-gift-shirts`)

## Bing Webmaster Tools

Same sitemap + URL submission (feeds ChatGPT search).

## Google Business Profile

- Name: **PimSuea**
- Category: Custom t-shirt store / Print shop
- Website: `https://pimsuea.com`
- Description: copy from `pimsuea-frontend/src/content/geoFacts.ts` → `GEO.oneLiner`
- Photos: real DTG prints (IBC, ABG, studio)

## Vercel env (schema sameAs)

Set when stable:

- `VITE_INSTAGRAM_URL=https://www.instagram.com/<handle>`

Redeploy marketing site after env change.

## Week 1 done when

- [ ] `verify-geo-public.sh` passes on production
- [ ] Scorecard log has baseline row for every prompt × tool
- [ ] GSC + Bing sitemap submitted
- [ ] GBP live (or scheduled with photos)
