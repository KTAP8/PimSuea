# Launch Checklist — Switch Landing Page from `/` to `/home`

## Context
Currently:
- `/` → `Landing.tsx` (waitlist/coming-soon page) — live and public
- `/home` → `NewLanding.tsx` (main product landing page) — exists but not the root

At launch, `/` should serve the main landing page (`NewLanding`). The waitlist page can be retired or kept at a different route.

---

## Code Changes

### 1. `pimsuea-frontend/src/App.tsx`
Swap the route assignments:

```tsx
// BEFORE
<Route path="/" element={<Landing />} />
<Route path="/home" element={<NewLanding />} />

// AFTER
<Route path="/" element={<NewLanding />} />
// Remove /home, or keep as redirect:
// <Route path="/home" element={<Navigate to="/" replace />} />
```

### 2. `pimsuea-frontend/src/pages/NewLanding.tsx`
Update the `PageSEO` canonical URL from `/home` → `/`:

```tsx
// BEFORE
<PageSEO
  ...
  canonical="https://pimsuea.com/home"
/>

// AFTER
<PageSEO
  ...
  canonical="https://pimsuea.com"
/>
```

Also update the JSON-LD `WebSite.potentialAction.target` if it referenced `/home`.

### 3. `pimsuea-frontend/src/pages/Landing.tsx` (optional)
Decide what happens to the waitlist page:
- **Retire it:** Remove the route entirely from `App.tsx`
- **Keep it:** Move it to `/waitlist` if you still want it accessible

---

## Static File Changes

### 4. `pimsuea-frontend/public/sitemap.xml`
Make `/` priority 1.0 and remove (or lower) `/home`:

```xml
<url>
  <loc>https://pimsuea.com/</loc>
  <lastmod>YYYY-MM-DD</lastmod>   <!-- update to launch date -->
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
  <xhtml:link rel="alternate" hreflang="th" href="https://pimsuea.com/"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://pimsuea.com/"/>
</url>
```

### 5. `pimsuea-frontend/public/robots.txt`
The `/` route is already allowed. If you kept `/home` as a redirect, it can stay or be removed — redirects are harmless for crawlers.

### 6. `pimsuea-frontend/public/og-image.png`
Create this file before launch if not already done (1200×630px):
- Logo + "Custom shirts, made simple. | สั่งทำเสื้อ ง่ายกว่าที่เคย"

---

## After Deploy

- [ ] Visit `https://pimsuea.com` — confirm NewLanding renders
- [ ] Check `View Source` — confirm `<title>` and meta tags are correct
- [ ] Test OG preview: paste URL into [opengraph.xyz](https://www.opengraph.xyz/)
- [ ] Google Search Console → URL Inspection → re-index `https://pimsuea.com`
- [ ] Submit updated sitemap: `https://pimsuea.com/sitemap.xml`

---

## Also Update CLAUDE.md

In the SEO section, change:
- `/home` → `/` as the canonical main landing
- `/` (waitlist) → retired or moved to `/waitlist`
