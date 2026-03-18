# Design System & Brand Rules

## Brand Assets

**Logo:** `public/logo.svg` — use as `<img src="/logo.svg" alt="PimSuea" />`.
SVG is already in brand green `#08636D`. Do not recolor it.
Dimensions: 137 × 52px (use as-is or scale proportionally).

**Font: FC Vision** — loaded via `src/index.css` `@font-face`. The only typeface for this project.

| Weight | File | Tailwind class | Use for |
|---|---|---|---|
| 300 | `fc-vision-light.otf` | `font-light` | Body text, secondary labels |
| 400/500 | `fc-vision-light.otf` | `font-normal` / `font-medium` | Paragraphs (maps to light) |
| 700 | `fc-vision-bold.otf` | `font-bold` | UI labels, prices, buttons |
| 900 | `fc-vision-heavy.otf` | `font-heavy` or `font-black` | Large display headings only |

> Google Fonts (Sarabun, Kanit, etc.) are **only** allowed inside the Fabric.js canvas tool for customer design use. Never import them in UI.

---

## Color Palette

| Token | Hex | CSS variable | Tailwind class | Usage |
|---|---|---|---|---|
| Brand Green | `#08636D` | `--primary` | `bg-primary` / `text-primary` | Navigation, active states, structural UI, headings |
| Action Orange | `#F05A25` | `--action` | `bg-action` / `text-action` | Primary CTAs **only** (Add to Cart, Checkout, Save, Join Waitlist) |
| Alert Red | `#C23B32` | `--destructive` | `bg-destructive` / `text-destructive` | Errors and destructive actions **only** |
| Deep Black | `#121212` | `--foreground` | `text-foreground` | Main body typography |
| Slate Gray | `#6C757D` | `--muted-foreground` | `text-muted-foreground` | Secondary text, placeholders, captions |
| Surface Gray | `#E9ECEF` | `--border` / `--input` | `bg-secondary` / `border-border` | Input backgrounds, dividers, muted surfaces |
| Crisp White | `#F8F9FA` | `--background` | `bg-background` | Page background, cards |

### Color Rules

- **Orange = conversion actions only.** Never decorative, never on green background.
- **Red = errors/destructive only.** Never decorative.
- Green (`--primary`) is for structure and navigation, not for CTA buttons.

---

## Button Variants

| Purpose | Classes to use | Example |
|---|---|---|
| Primary CTA | `bg-action text-action-foreground hover:bg-action/90` | Add to Cart, Join Waitlist |
| Secondary / outline | `border border-primary text-primary bg-transparent hover:bg-primary/10` | Cancel, Back |
| Destructive | `bg-destructive text-destructive-foreground hover:bg-destructive/90` | Delete, Remove |
| Navigation / ghost | `text-primary hover:bg-primary/10` | Sidebar links |

Shadcn `<Button>` default variant maps to `--primary` (brand green). For orange CTAs, pass the CTA classes via `className`:

```tsx
// CTA button
<Button className="bg-action text-action-foreground hover:bg-action/90">
  สั่งซื้อเลย
</Button>

// Secondary button
<Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
  ยกเลิก
</Button>
```

---

## Input Specs

```tsx
// Standard input — idle border from --input (#E9ECEF), orange focus ring
<Input className="border-input focus-visible:ring-ring" />
```

Focus ring uses `--ring` which is set to `#F05A25` (Action Orange). This is already the default — no extra class needed.

---

## Border Radius

| Element | Size | Tailwind class |
|---|---|---|
| Buttons, inputs | 6px | `rounded-md` (default from `--radius`) |
| Cards, modals, panels | 8px | `rounded-lg` |
| Product images | 0px | `rounded-none` |
| Chips, badges, pills | 999px | `rounded-full` |

> `--radius` is `0.5rem` (8px). `rounded-md = calc(--radius - 2px) = 6px`, `rounded-lg = --radius = 8px`.

---

## Typography Scale

```tsx
// Display heading (hero, page titles)
<h1 className="font-heavy text-5xl md:text-7xl text-foreground">

// Section heading
<h2 className="font-bold text-3xl text-foreground">

// Card / component heading
<h3 className="font-bold text-lg text-foreground">

// Body
<p className="font-light text-base text-foreground leading-relaxed">

// Secondary / caption
<p className="text-sm text-muted-foreground">

// Price
<span className="font-bold text-foreground">฿130</span>
```

---

## Spacing & Layout

- Content max-width: `max-w-5xl mx-auto px-6`
- Section vertical padding: `py-24`
- Card internal padding: `p-6` or `p-8`
- Gap between grid items: `gap-6` or `gap-8`

---

## Products at Launch

**Regular T-Shirt**
- Colors: White (`#FFFFFF`), Black (`#000000`)
- Sizes: S, M, L, XL, XXL — SKUs: `REG-WHITE-S` … `REG-BLACK-XXL`
- Printing: DTG + DTF — Base price: ฿130

**Oversize T-Shirt**
- Colors: White (`#FFFFFF`), Black (`#000000`)
- Sizes: S, M, L, XL, XXL — SKUs: `OS-WHITE-S` … `OS-BLACK-XXL`
- Printing: DTG + DTF — Base price: ฿150

---

## Tone of Voice

Audience: Thai university students. Be direct and energetic.

- Good: "Upload, choose, done." / "Your design. Your squad."
- Bad: "Please kindly proceed to the next step."
- Prices always show THB with ฿ symbol.

---

## Route Protection

- `/design/*`, `/designs`, `/cart`, `/checkout`, `/orders/*` → require auth → redirect `/login`
- `/admin/*` → require auth AND `profiles.role = 'admin'` → redirect `/dashboard`
- `/` (landing page), `/login`, `/register` → public, no auth required
