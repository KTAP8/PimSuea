# PimSuea — Pricing Task

> I am building PimSuea, a Thai print-on-demand platform.
> This task covers the **complete pricing system**: database tables, seed data, and the `calculatePrice()` function.
> Do NOT touch any canvas code. Do NOT modify any existing files outside of what is listed below.

---

## Context

Pricing is split into two independent lookups that are summed:

1. **Shirt price** — varies by product, color, size, and quantity bracket
2. **Print price** — varies by printing type (DTG/DTF), print tier, color (DTG only), and quantity bracket

The print tier is determined by the rotated AABB of the user's design objects (in cm).

**Never trust the price from the client. Always recalculate server-side on checkout.**

---

## Step 1 — Create Database Tables via Supabase MCP

Use the Supabase MCP tool to run the following SQL in the project's database.

### 1a. `shirt_pricing` table

```sql
create table shirt_pricing (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  color_name text not null check (color_name in ('White', 'Black')),
  size text not null check (size in ('S', 'M', 'L', 'XL', 'XXL')),
  min_qty integer not null,
  max_qty integer, -- NULL = no upper limit (last tier)
  price_per_unit_thb numeric(10,2) not null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table shirt_pricing enable row level security;
create policy "Public read shirt_pricing" on shirt_pricing for select using (true);
create policy "Admin write shirt_pricing" on shirt_pricing for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
```

### 1b. `print_pricing` table

```sql
create table print_pricing (
  id uuid primary key default gen_random_uuid(),
  type_code text not null check (type_code in ('DTG', 'DTF')),
  size_tier text not null check (size_tier in ('3x4in', 'A5', 'A4', 'A3', 'A2')),
  color_name text check (color_name in ('White', 'Black')), -- NULL for DTF rows
  min_qty integer not null,
  max_qty integer, -- NULL = no upper limit
  price_per_unit_thb numeric(10,2) not null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table print_pricing enable row level security;
create policy "Public read print_pricing" on print_pricing for select using (true);
create policy "Admin write print_pricing" on print_pricing for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
```

---

## Step 2 — Seed Pricing Data via Supabase MCP

### 2a. Seed `shirt_pricing`

First fetch the product IDs for Regular T-Shirt and Oversize T-Shirt from the `products` table, then insert:

```sql
-- Regular T-Shirt (base 130 THB), White
insert into shirt_pricing (product_id, color_name, size, min_qty, max_qty, price_per_unit_thb)
select id, 'White', s.size, s.min_qty, s.max_qty, s.price
from products,
(values
  ('S',   1, 11,  130.00),
  ('S',  12, 23,  120.00),
  ('S',  24, null, 110.00),
  ('M',   1, 11,  130.00),
  ('M',  12, 23,  120.00),
  ('M',  24, null, 110.00),
  ('L',   1, 11,  130.00),
  ('L',  12, 23,  120.00),
  ('L',  24, null, 110.00),
  ('XL',  1, 11,  130.00),
  ('XL', 12, 23,  120.00),
  ('XL', 24, null, 110.00),
  ('XXL', 1, 11,  130.00),
  ('XXL',12, 23,  120.00),
  ('XXL',24, null, 110.00)
) as s(size, min_qty, max_qty, price)
where name = 'Regular T-Shirt';

-- Regular T-Shirt, Black (same price for now)
insert into shirt_pricing (product_id, color_name, size, min_qty, max_qty, price_per_unit_thb)
select id, 'Black', s.size, s.min_qty, s.max_qty, s.price
from products,
(values
  ('S',   1, 11,  130.00), ('S',  12, 23,  120.00), ('S',  24, null, 110.00),
  ('M',   1, 11,  130.00), ('M',  12, 23,  120.00), ('M',  24, null, 110.00),
  ('L',   1, 11,  130.00), ('L',  12, 23,  120.00), ('L',  24, null, 110.00),
  ('XL',  1, 11,  130.00), ('XL', 12, 23,  120.00), ('XL', 24, null, 110.00),
  ('XXL', 1, 11,  130.00), ('XXL',12, 23,  120.00), ('XXL',24, null, 110.00)
) as s(size, min_qty, max_qty, price)
where name = 'Regular T-Shirt';

-- Oversize T-Shirt (base 150 THB), White + Black
insert into shirt_pricing (product_id, color_name, size, min_qty, max_qty, price_per_unit_thb)
select id, c.color, s.size, s.min_qty, s.max_qty, s.price
from products,
(values ('White'), ('Black')) as c(color),
(values
  ('S',   1, 11,  150.00), ('S',  12, 23,  140.00), ('S',  24, null, 130.00),
  ('M',   1, 11,  150.00), ('M',  12, 23,  140.00), ('M',  24, null, 130.00),
  ('L',   1, 11,  150.00), ('L',  12, 23,  140.00), ('L',  24, null, 130.00),
  ('XL',  1, 11,  150.00), ('XL', 12, 23,  140.00), ('XL', 24, null, 130.00),
  ('XXL', 1, 11,  150.00), ('XXL',12, 23,  140.00), ('XXL',24, null, 130.00)
) as s(size, min_qty, max_qty, price)
where name = 'Oversize T-Shirt';
```

### 2b. Seed `print_pricing`

```sql
-- DTG — White, all 5 tiers, 3 qty brackets
insert into print_pricing (type_code, size_tier, color_name, min_qty, max_qty, price_per_unit_thb) values
('DTG', '3x4in', 'White',  1, 11,  60.00),
('DTG', '3x4in', 'White', 12, 23,  55.00),
('DTG', '3x4in', 'White', 24, null, 50.00),
('DTG', 'A5',    'White',  1, 11,  80.00),
('DTG', 'A5',    'White', 12, 23,  75.00),
('DTG', 'A5',    'White', 24, null, 70.00),
('DTG', 'A4',    'White',  1, 11, 100.00),
('DTG', 'A4',    'White', 12, 23,  90.00),
('DTG', 'A4',    'White', 24, null, 80.00),
('DTG', 'A3',    'White',  1, 11, 130.00),
('DTG', 'A3',    'White', 12, 23, 120.00),
('DTG', 'A3',    'White', 24, null,110.00),
('DTG', 'A2',    'White',  1, 11, 160.00),
('DTG', 'A2',    'White', 12, 23, 150.00),
('DTG', 'A2',    'White', 24, null,140.00);

-- DTG — Black (slightly higher cost due to white ink underbase)
insert into print_pricing (type_code, size_tier, color_name, min_qty, max_qty, price_per_unit_thb) values
('DTG', '3x4in', 'Black',  1, 11,  80.00),
('DTG', '3x4in', 'Black', 12, 23,  75.00),
('DTG', '3x4in', 'Black', 24, null, 70.00),
('DTG', 'A5',    'Black',  1, 11, 100.00),
('DTG', 'A5',    'Black', 12, 23,  95.00),
('DTG', 'A5',    'Black', 24, null, 90.00),
('DTG', 'A4',    'Black',  1, 11, 130.00),
('DTG', 'A4',    'Black', 12, 23, 120.00),
('DTG', 'A4',    'Black', 24, null,110.00),
('DTG', 'A3',    'Black',  1, 11, 160.00),
('DTG', 'A3',    'Black', 12, 23, 150.00),
('DTG', 'A3',    'Black', 24, null,140.00),
('DTG', 'A2',    'Black',  1, 11, 190.00),
('DTG', 'A2',    'Black', 12, 23, 180.00),
('DTG', 'A2',    'Black', 24, null,170.00);

-- DTF — color_name is NULL (no difference between White/Black for DTF)
insert into print_pricing (type_code, size_tier, color_name, min_qty, max_qty, price_per_unit_thb) values
('DTF', '3x4in', null,  1, 11,  50.00),
('DTF', '3x4in', null, 12, 23,  45.00),
('DTF', '3x4in', null, 24, null, 40.00),
('DTF', 'A5',    null,  1, 11,  70.00),
('DTF', 'A5',    null, 12, 23,  65.00),
('DTF', 'A5',    null, 24, null, 60.00),
('DTF', 'A4',    null,  1, 11,  90.00),
('DTF', 'A4',    null, 12, 23,  80.00),
('DTF', 'A4',    null, 24, null, 75.00),
('DTF', 'A3',    null,  1, 11, 120.00),
('DTF', 'A3',    null, 12, 23, 110.00),
('DTF', 'A3',    null, 24, null,100.00),
('DTF', 'A2',    null,  1, 11, 150.00),
('DTF', 'A2',    null, 12, 23, 140.00),
('DTF', 'A2',    null, 24, null,130.00);
```

> ⚠️ These are placeholder costs. The admin can update them via `/admin/pricing` once the UI is built.

---

## Step 3 — Create `/lib/pricing.ts`

Create this file from scratch. Do not modify any other files.

```typescript
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrintTier = '3x4in' | 'A5' | 'A4' | 'A3' | 'A2'
export type PrintingType = 'DTG' | 'DTF'
export type ColorName = 'White' | 'Black'
export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface PriceInput {
  printingType: PrintingType
  aabb_w_cm: number
  aabb_h_cm: number
  quantity: number
  productId: string
  color_name: ColorName
  size: Size
}

export interface PriceBreakdown {
  tier: PrintTier
  shirt_per_unit: number
  print_per_unit: number
  total_per_unit: number
  total: number
  quantity: number
}

// ─── Tier Logic ───────────────────────────────────────────────────────────────

export function getPrintTier(w_cm: number, h_cm: number): PrintTier {
  if (w_cm <= 7.62 && h_cm <= 10.16) return '3x4in'
  if (w_cm <= 14.8  && h_cm <= 21.0)  return 'A5'
  if (w_cm <= 21.0  && h_cm <= 29.7)  return 'A4'
  if (w_cm <= 29.7  && h_cm <= 42.0)  return 'A3'
  return 'A2'
}

// ─── Main Function ────────────────────────────────────────────────────────────

export async function calculatePrice({
  printingType,
  aabb_w_cm,
  aabb_h_cm,
  quantity,
  productId,
  color_name,
  size,
}: PriceInput): Promise<PriceBreakdown> {
  const supabase = createClient()

  // 1. Determine print tier from rotated AABB dimensions
  const tier = getPrintTier(aabb_w_cm, aabb_h_cm)

  // 2. Look up shirt price
  //    Matches: product_id + color + size + quantity bracket
  const { data: shirtRow, error: shirtError } = await supabase
    .from('shirt_pricing')
    .select('price_per_unit_thb')
    .eq('product_id', productId)
    .eq('color_name', color_name)
    .eq('size', size)
    .lte('min_qty', quantity)
    .or(`max_qty.is.null,max_qty.gte.${quantity}`)
    .single()

  if (shirtError || !shirtRow) {
    throw new Error(
      `No shirt pricing found for product=${productId} color=${color_name} size=${size} qty=${quantity}`
    )
  }

  // 3. Look up print price
  //    DTG: type + tier + color + qty bracket
  //    DTF: type + tier + color_name IS NULL + qty bracket
  const printQuery = supabase
    .from('print_pricing')
    .select('price_per_unit_thb')
    .eq('type_code', printingType)
    .eq('size_tier', tier)
    .lte('min_qty', quantity)
    .or(`max_qty.is.null,max_qty.gte.${quantity}`)

  if (printingType === 'DTG') {
    printQuery.eq('color_name', color_name)
  } else {
    printQuery.is('color_name', null)
  }

  const { data: printRow, error: printError } = await printQuery.single()

  if (printError || !printRow) {
    throw new Error(
      `No print pricing found for type=${printingType} tier=${tier} color=${color_name} qty=${quantity}`
    )
  }

  // 4. Calculate
  const shirt_per_unit = Number(shirtRow.price_per_unit_thb)
  const print_per_unit = Number(printRow.price_per_unit_thb)
  const total_per_unit = shirt_per_unit + print_per_unit

  return {
    tier,
    shirt_per_unit,
    print_per_unit,
    total_per_unit,
    total: total_per_unit * quantity,
    quantity,
  }
}
```

---

## Step 4 — Create Server-Side Pricing API Route

Create `/app/api/pricing/route.ts`. This is the server-side endpoint used by the canvas sidebar for live price updates.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculatePrice } from '@/lib/pricing'

const PriceRequestSchema = z.object({
  printingType: z.enum(['DTG', 'DTF']),
  aabb_w_cm: z.number().positive(),
  aabb_h_cm: z.number().positive(),
  quantity: z.number().int().min(1),
  productId: z.string().uuid(),
  color_name: z.enum(['White', 'Black']),
  size: z.enum(['S', 'M', 'L', 'XL', 'XXL']),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = PriceRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const breakdown = await calculatePrice(parsed.data)
    return NextResponse.json(breakdown)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pricing lookup failed'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
```

---

## Step 5 — Verify

After completing the above steps, run:

```bash
npm run check
```

Expected: no TypeScript errors, no lint errors.

Manual check via Supabase MCP — confirm both tables exist and have rows:

```sql
select count(*) from shirt_pricing;   -- should be 60 rows (2 products × 2 colors × 5 sizes × 3 tiers)
select count(*) from print_pricing;   -- should be 45 rows (2 DTG colors × 5 tiers × 3 + 1 DTF × 5 tiers × 3)
```

Also test the API route with a sample payload:

```bash
curl -X POST http://localhost:3000/api/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "printingType": "DTG",
    "aabb_w_cm": 15,
    "aabb_h_cm": 20,
    "quantity": 5,
    "productId": "<regular-tshirt-uuid>",
    "color_name": "White",
    "size": "M"
  }'
```

Expected response shape:
```json
{
  "tier": "A5",
  "shirt_per_unit": 130,
  "print_per_unit": 80,
  "total_per_unit": 210,
  "total": 1050,
  "quantity": 5
}
```

---

## Files Modified / Created

| File | Action |
|---|---|
| `shirt_pricing` table | Created via Supabase MCP |
| `print_pricing` table | Created via Supabase MCP |
| `/lib/pricing.ts` | Created |
| `/app/api/pricing/route.ts` | Created |

**Do NOT touch:** any canvas files, `/lib/canvas-serialiser.ts`, `/lib/print.ts`, or any existing page components.
