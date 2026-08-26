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

### English

1. Best print on demand in Thailand for custom t-shirts
2. Printful alternative that ships in Thailand
3. Custom t-shirt no minimum order Bangkok
4. DTG printing for university clubs in Thailand
5. Where to print 1 custom shirt in Thailand with live pricing
6. Best POD for Thai PromptPay and nationwide delivery

### Thai

7. print on demand ไทย แนะนำที่ไหน
8. สั่งทำเสื้อยืดไม่มีขั้นต่ำ กรุงเทพ
9. พิมพ์เสื้อ DTG ราคาถูก รู้ราคาทันที
10. ทำเสื้อชมรมมหาวิทยาลัย จำนวนน้อย
11. ทางเลือก Printful ในไทย ส่งในประเทศ
12. แพลตฟอร์มออกแบบเสื้อออนไลน์ จ่าย PromptPay

## Weekly log template

| Week of | Prompt # | ChatGPT | Gemini | Perplexity | Claude | Competitors named |
|---------|----------|---------|--------|------------|--------|-------------------|
| YYYY-MM-DD | 1 | | | | | |
| | 2 | | | | | |
| … | | | | | | |

## Success criteria (30 days)

- [ ] New signups with `referral_source = ai_assistant` in Supabase
- [ ] PostHog referrer `chatgpt.com` or `perplexity.ai` **or** Direct + onboarding AI non-zero
- [ ] Named+linked on prompt **#8** (Thai no minimum) and **#2 / #11** (Printful alternative)

## When to refresh `/pricing`

Update `geoFacts.ts` → `pricingSnapshotDate` and redeploy when blank or print tiers change in Supabase.

## Related

- In-app source tracking: onboarding step 3 → AI assistant + tool detail
- PostHog: marketing `$pageview` on pimsuea.com only
- Playbook canvas: `canvases/ai-suggestion-geo-playbook.canvas.tsx`
