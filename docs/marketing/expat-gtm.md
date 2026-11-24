# Expat go-to-market playbook

**Pivot (2026-11):** the primary audience moves from Thai university students to **expats in Thailand**. Thai customers are still served (Thai site at `/th`).

## Who we're talking to

| Segment | What they need | Hook |
|---|---|---|
| Activity clubs: run clubs, ice bath / breathwork, Muay Thai gyms, Hash House Harriers, padel, football | Small runs (10–40), repeat orders, club colours, event finisher tees | "Kit for your crew, even if it's 12 people" |
| International companies | Offsite, onboarding, event and booth shirts; English-speaking supplier | "Team shirts without the Thai-supplier headache" |
| Digital nomads, coworking & coliving | Community merch, meetup tees, personal-brand / creator drops | "Merch for your community — order one sample first" |
| Crypto / Web3 | Meetup, conference and community drops, fast and small | "Small-run drops for your community" |
| Couples & families (expats with Thai partners) | Matching shirts for trips, weddings, Songkran, birthdays; gifts | "Gifts that bring both families together" |

Tone: frame the couples/family segment around **celebrations and family**. Never use "Thai wife / girlfriend" wording in public copy, ads or targeting names.

## What we can claim (and what we can't)

**Can say:** English studio and checkout · English support on LINE · no minimum order · live THB price before paying · card or PromptPay · printed in Bangkok · 5–14 days to all 77 provinces · reprint guarantee.

**Don't say (not offered yet):** tax invoice / company billing, crypto payment, rush or guaranteed event deadlines, WhatsApp support. Add these to copy only once they exist, and update `src/content/geoFacts.ts` and `public/llms.txt` at the same time.

## The core problem we solve

Expats ordering custom shirts today choose between:

1. **A Thai print shop.** Quotes over LINE in Thai, waiting for an admin, MOQ 30–50.
2. **Printful / Amazon / overseas sites.** USD pricing, international shipping, weeks of waiting, possible import duty.

PimSuea is self-serve and in English, priced up front in THB, from 1 piece, and printed locally.

## Channels (in priority order)

### 1. Community partnerships (highest leverage)

Goal: **10 foreigner communities in 8 weeks.** Each delivered order becomes a case note, an Instagram post, and a mention by the club, which is the third-party proof that both people and AI assistants cite.

- Targets: Bangkok run clubs, Hash House Harriers chapters (Bangkok, Chiang Mai, Phuket, Pattaya), ice bath / breathwork groups, Muay Thai gyms with foreign students, padel clubs, coworking / coliving spaces (Bangkok, Chiang Mai, Koh Phangan), crypto meetups.
- Offer: founding-club discount code + one free sample shirt for the organiser.
- Ask in return: a photo of the club in the shirts, and a tag or link to pimsuea.com.
- After delivery: add the order to `CASE_NOTES` in `geoFacts.ts` (with permission).

### 2. Where expats ask questions

- **Facebook groups** (city expat groups, nomad groups, expat families / couples groups). Answer real "where can I print shirts" questions with a helpful answer and a photo. No drive-by link spam.
- **Reddit:** r/Thailand, r/Bangkok, r/chiangmai, r/digitalnomad, r/phuket. Same rule: answer genuine threads, disclose that you're the founder.
- **LINE OpenChat / Telegram groups** for nomads and crypto communities.

### 3. Expat media and guides (also GEO)

Pitch to expat news and lifestyle sites, "living in Bangkok / Chiang Mai" guides, relocation blogs and coworking directories. Track in [offsite-outreach-tracker.md](offsite-outreach-tracker.md).

### 4. Google Business Profile

English-first description (from `GEO.oneLiner`). Ask expat customers for English reviews that mention the use case ("run club shirts", "company offsite").

### 5. Paid (later, after 5+ case notes)

Meta ads targeted by interest + location (Bangkok, Chiang Mai, Phuket, Pattaya, Koh Phangan), English creative showing real club photos. Landing pages: `/custom-shirts-thailand` and `/club-and-gift-shirts`.

## Pages that serve this audience

| Page | Role |
|---|---|
| `/` | English home, with a "Made for your crew" use-case strip and expat FAQ |
| `/custom-shirts-thailand` | Main expat answer page and GEO citation target |
| `/club-and-gift-shirts` | Clubs, communities, couples and family gifts |
| `/vs-printful` | For people currently ordering from overseas |
| `/pricing` | Public THB rate card |
| `/th/...` | Thai mirror of every page |

## Measuring it

- Weekly GEO prompts: [geo-weekly-scorecard.md](../geo-weekly-scorecard.md) (now expat-focused).
- PostHog: share of marketing pageviews on English (`/`) vs Thai (`/th`) paths, and studio starts from English pages.
- Supabase: signups per week, and orders from community partners (track by discount code).
- Follow-up worth doing: the onboarding "who are you ordering for" options still list `university_club`. Adding expat-relevant options (club / community, company, gift / family) would let us measure the pivot directly.
