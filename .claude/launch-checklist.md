# Launch Checklist

## How pre-launch gating works

`LAUNCH_DATE = new Date('2026-03-27T12:00:00+07:00')` is defined in `src/App.tsx` (exported so `Landing.tsx` can import it).

**Before launch date:** Every route except `/` redirects to `/` (the waitlist page).
**On/after launch date:** All routes become accessible automatically — no deploy needed.

---

## On launch day (2026-03-27)

The gate opens automatically. The only manual step is **swapping the root route** so `/` shows the main landing page instead of the waitlist.

### 1. `src/App.tsx` — swap the root route and remove the gate

```tsx
// REMOVE the pre-launch gate block entirely.
// REPLACE with the full route list, with / → NewLanding:

<Routes>
  <Route path="/" element={<NewLanding />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  <Route element={<ProtectedRoute />}>
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/news/:id" element={<NewsDetails />} />
    <Route path="/catalog" element={<Catalog />} />
    <Route path="/product/:id" element={<ProductDetails />} />
    <Route path="/design/:id" element={<DesignCanvas />} />
    <Route path="/orders" element={<MyOrders />} />
    <Route path="/my-products" element={<MyProducts />} />
    <Route path="/wallet" element={<Wallet />} />
    <Route path="/order" element={<Order />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
</Routes>
```

- Remove the `LAUNCH_DATE` export and `Navigate` import from `App.tsx`
- Remove the `Landing` import from `App.tsx`
- Remove the `Landing.tsx` route entirely (or keep as `/waitlist` if you want to preserve it)

### 2. `src/pages/NewLanding.tsx` — update canonical URL

```tsx
// BEFORE
canonical="https://pimsuea.com/home"

// AFTER
canonical="https://pimsuea.com"
```

### 3. `public/sitemap.xml` — promote `/` to priority 1.0

```xml
<url>
  <loc>https://pimsuea.com/</loc>
  <lastmod>2026-03-27</lastmod>
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
  <xhtml:link rel="alternate" hreflang="th" href="https://pimsuea.com/"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://pimsuea.com/"/>
</url>
```

Remove or lower the `/home` entry (it will no longer exist as a route).

### 4. `public/robots.txt` — clean up

Remove `Allow: /home` (route no longer exists after the swap).

---

## After deploy on launch day

- [ ] Visit `https://pimsuea.com` — confirm NewLanding renders
- [ ] Visit `https://pimsuea.com/login` — confirm accessible
- [ ] Test OG preview: [opengraph.xyz](https://www.opengraph.xyz/) with `https://pimsuea.com`
- [ ] Google Search Console → URL Inspection → re-index `https://pimsuea.com`
- [ ] Submit updated sitemap

---

## Before launch day — what's blocked

Any direct URL visit to `/login`, `/register`, `/home`, `/dashboard`, etc. redirects to `/`.
The only accessible page is the waitlist at `/`.
