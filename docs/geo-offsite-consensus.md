# GEO — Off-site consensus playbook

Weeks 2–4 ops. Models cite facts they see in more than one place.

## 1. Google Business Profile

- **Name:** PimSuea
- **Category:** Custom t-shirt store / Print shop
- **Address:** Bangkok studio location (use real production address)
- **Website:** https://pimsuea.com
- **Hours:** Match actual support/production hours
- **Photos:** Real DTG prints — IBC, ABG, studio shots (not stock)
- **Description:** Use one-liner from `pimsuea-frontend/src/content/geoFacts.ts`

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

## 4. Outreach — 5 Thai POD roundup pages

Pitch angle (copy/paste base):

> PimSuea is a Bangkok print-on-demand platform: self-serve DTG design studio, no minimum order, live THB pricing, PromptPay checkout, delivery to all 77 provinces. Public pages: https://pimsuea.com/print-on-demand and https://pimsuea.com/pricing

**Target list** (find current URLs via search):

1. Shopify Thailand POD roundup articles
2. “Printful alternative Thailand” list posts
3. Thai factory / merch blog roundups
4. University entrepreneur / startup resource lists
5. Thai e-commerce tool comparison sites

Track outreach in a spreadsheet: URL, contact, date, response, live mention Y/N.

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
