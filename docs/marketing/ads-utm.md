# Ad URL tagging (UTM convention)

The site stores the first and last marketing touch (cookies `pimsuea_ft` / `pimsuea_lt` on `.pimsuea.com`, 90 days).
They are copied to `profiles.attribution` at onboarding and `orders.attribution` at checkout, and sent to PostHog as
`ft_*` / `lt_*` event properties. The ops Analytics tab joins these to Meta Insights **by name**, so every ad must be tagged.

## Meta (Facebook / Instagram)
Ads Manager → Ad → Destination → **URL parameters**:

```
utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}
```

- Keep campaign / ad set / ad names unique and stable. Renaming breaks the join for historical data.
- `fbclid` is appended by Meta automatically and is stored too (`fbc` is pre-built for a future Conversions API).

## Other channels
| Channel | utm_source | utm_medium | utm_campaign |
|---|---|---|---|
| Instagram bio / organic post | instagram | organic_social | `bio` or post slug |
| Community partner (club, coworking) | partner | referral | partner slug (match the coupon code) |
| Reddit / Facebook group post | reddit / facebook | community | thread slug |
| Newsletter / expat media | newsletter name | email / pr | issue slug |
| Google Business Profile | google | gbp | `profile` |

Lowercase, use `-` for spaces. Untagged traffic still records the external referrer host.
