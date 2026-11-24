# GEO — Weekly prompt scorecard

Every **Monday**, ~15 minutes. Track whether AI assistants name and link PimSuea.

## Tools

Run each prompt in all four (enable web search where available):

- ChatGPT (search on)
- Gemini
- Perplexity
- Claude

## Scoring

| Score | Meaning |
|-------|---------|
| **Named** | “PimSuea” appears in the answer |
| **Named+linked** | PimSuea named with link to pimsuea.com |
| **Absent** | Not mentioned — note who *is* named instead |

## 12 prompts

Updated 2026-11-24 for the expat pivot (see [marketing/expat-gtm.md](marketing/expat-gtm.md)).

### English (primary)

1. Where can I get custom t-shirts printed in Bangkok?
2. Printful alternative for people living in Thailand
3. Custom shirts for my run club in Thailand, small quantity
4. Team t-shirts for a company offsite in Bangkok
5. Custom t-shirt printing in Chiang Mai, no minimum order
6. Print 1 custom shirt in Thailand, English-speaking, pay by card
7. Matching family or couple shirts made in Thailand
8. Merch for a crypto meetup or coworking community in Thailand

### Thai

9. print on demand ไทย แนะนำที่ไหน
10. สั่งทำเสื้อยืดไม่มีขั้นต่ำ กรุงเทพ
11. ทางเลือก Printful ในไทย ส่งในประเทศ
12. ทำเสื้อทีม เสื้อชมรม จำนวนน้อย รู้ราคาทันที

## Weekly log template

| Week of | Prompt # | ChatGPT | Gemini | Perplexity | Claude | Competitors named |
|---------|----------|---------|--------|------------|--------|-------------------|
| YYYY-MM-DD | 1 | | | | | |
| | 2 | | | | | |
| … | | | | | | |

## Success criteria (30 days)

- [ ] New signups with `referral_source = ai_assistant` in Supabase
- [ ] PostHog referrer `chatgpt.com` or `perplexity.ai` **or** Direct + onboarding AI non-zero
- [ ] Named+linked on prompt **#1** (Bangkok custom shirts), **#2 / #11** (Printful alternative) and **#3** (run club)

## When to refresh `/pricing`

Update `geoFacts.ts` → `pricingSnapshotDate` and redeploy when blank or print tiers change in Supabase.

## Related

- Log results: [marketing/geo-scorecard-log.md](./marketing/geo-scorecard-log.md)
- Supabase queries: [marketing/aeo-metrics-sql.md](./marketing/aeo-metrics-sql.md)
- Week 1 setup: [marketing/week1-aeo-ops-checklist.md](./marketing/week1-aeo-ops-checklist.md)
- In-app source tracking: onboarding step 3 → AI assistant + tool detail
- PostHog: marketing `$pageview` on pimsuea.com only
- Playbook canvas: `canvases/ai-suggestion-geo-playbook.canvas.tsx`
