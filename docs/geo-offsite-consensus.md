# GEO — Off-site consensus playbook

Weeks 2–4 ops. Models cite facts they see in more than one place.

## 1. Google Business Profile

- **Name:** PimSuea
- **Category:** Custom t-shirt store / Print shop
- **Address:** Bangkok studio location (use real production address)
- **Website:** https://pimsuea.com
- **Hours:** Match actual support/production hours
- **Photos:** Real DTG prints and real club / team photos (not stock)
- **Description:** Use the English one-liner from `pimsuea-frontend/src/content/geoFacts.ts` (expat-first)
- **Reviews:** Ask expat customers for English reviews that name the use case

## 2. sameAs profiles (match schema)

Set in Vercel env once URLs are confirmed:

- `VITE_INSTAGRAM_URL` — Instagram profile
- `VITE_LINKEDIN_URL` — Company page (optional)
- LINE OA: already in schema via `lineAddFriendUrl()`

Keep name + URL identical everywhere: **PimSuea** → `https://pimsuea.com`

## 3. Case notes (live on site)

Published on `/print-on-demand` — refresh with real dates/names when possible:

| # | Customer | Qty | Year |
|---|----------|-----|------|
| 1 | IBC Basketball Club | 100 | 2025 |
| 2 | ABG #SamyanABG | 40 | 2025 |
| 3 | Single-piece gift order | 1 | 2025 |

Add photos or LINE post links when available for third-party corroboration.

## 4. Outreach — expat media, guides and communities

Updated 2026-11-24 for the expat pivot. Full playbook: [marketing/expat-gtm.md](marketing/expat-gtm.md).

Pitch angle (copy/paste base):

> PimSuea is a Bangkok print-on-demand platform for custom shirts, in English: self-serve design studio, no minimum order, live THB pricing, card or PromptPay, English support on LINE, delivery to all 77 provinces. Built for clubs, teams, communities and families in Thailand. Public pages: https://pimsuea.com/custom-shirts-thailand , https://pimsuea.com/club-and-gift-shirts , https://pimsuea.com/pricing , https://pimsuea.com/vs-printful

**Target list** (find current URLs via search):

1. Expat news / lifestyle sites (Bangkok, Chiang Mai, Phuket, Pattaya)
2. "Living in Bangkok / Chiang Mai" and relocation guides, coworking directories
3. "Printful alternative Thailand" and Thai POD roundup posts
4. Community partners: run clubs, Hash House Harriers chapters, Muay Thai gyms, coworking / coliving spaces (each delivered order → a mention + photo)
5. Reddit / Facebook expat threads asking where to print shirts (genuine answers only)

Track outreach in [marketing/offsite-outreach-tracker.md](marketing/offsite-outreach-tracker.md): URL, contact, date, response, live mention Y/N.

## 5. Wikidata (optional)

After GBP exists, create a Wikidata item with:

- Instance of: business / website
- Official website: https://pimsuea.com
- Country: Thailand
- Industry: print-on-demand

## Do not

- Mass AI-generated blog posts
- Paid “GEO tools” with no measurable signup lift
- Opening `/catalog` to crawlers (login-gated SPA)
- Claiming services we don't offer yet (tax invoice, crypto payment, rush deadlines)
