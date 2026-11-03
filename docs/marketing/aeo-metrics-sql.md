# AEO & marketing metrics (Supabase)

Project: PimSueaDB. Run in Supabase SQL editor every **Monday** with the GEO scorecard.

## AI assistant signups (last 7 / 30 days)

```sql
SELECT
  date_trunc('week', created_at AT TIME ZONE 'Asia/Bangkok') AS week,
  count(*) FILTER (WHERE referral_source = 'ai_assistant') AS ai_signups,
  count(*) FILTER (WHERE referral_source = 'instagram') AS ig_signups
FROM profiles
WHERE created_at >= now() - interval '90 days'
GROUP BY 1
ORDER BY 1 DESC;
```

## AI signups → paid (lifetime)

```sql
SELECT
  count(DISTINCT p.id) AS ai_signups,
  count(DISTINCT p.id) FILTER (WHERE o.user_id IS NOT NULL) AS ai_paid_users,
  coalesce(sum(o.total_amount), 0) AS ai_gmv
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id
  AND o.status IN ('paid_processing', 'printing', 'shipped', 'delivered')
WHERE p.referral_source = 'ai_assistant';
```

## AI tool breakdown (`referral_detail`)

```sql
SELECT coalesce(nullif(trim(referral_detail), ''), '(blank)') AS tool,
  count(*) AS signups
FROM profiles
WHERE referral_source = 'ai_assistant'
GROUP BY 1 ORDER BY 2 DESC;
```

## Instagram spike cohort reminder (Aug 12–19 2026)

```sql
SELECT
  count(*) AS signups,
  count(DISTINCT d.user_id) AS designers,
  count(DISTINCT o.user_id) AS paid
FROM profiles p
LEFT JOIN (SELECT DISTINCT user_id FROM user_designs) d ON d.user_id = p.id
LEFT JOIN (
  SELECT DISTINCT user_id FROM orders
  WHERE status IN ('paid_processing', 'printing', 'shipped', 'delivered')
) o ON o.user_id = p.id
WHERE p.created_at >= '2026-08-12' AND p.created_at < '2026-08-20';
```

## PostHog (marketing site)

In PostHog → Web analytics → referrers, filter last 7 days for:

- `chatgpt.com`
- `perplexity.ai`
- `gemini.google.com` (if present)

North-star for 90 days: **+8–12 new `ai_assistant` signups** and **≥2 paid** from that channel.
