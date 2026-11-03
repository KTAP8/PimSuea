const { supabaseAdmin } = require('../config/supabaseClient');

const TTL_MS = 15 * 60 * 1000;

function toColorCategory(colorName) {
  return colorName === 'White' ? 'White' : 'Other';
}

function getPrintTier(w_cm, h_cm) {
  const short = Math.min(w_cm, h_cm);
  const long = Math.max(w_cm, h_cm);
  if (short <= 7.62 && long <= 10.16) return '3x4in';
  if (short <= 15.24 && long <= 20.32) return 'A5';
  if (short <= 20.32 && long <= 30.48) return 'A4';
  return 'A3';
}

/** @type {{ loadedAt: number, shirt: object[], print: object[], colorsById: Map<string, string> } | null} */
let catalog = null;
/** @type {Promise<void> | null} */
let loading = null;

function qtyMatches(row, quantity) {
  const min = row.min_qty ?? 1;
  if (quantity < min) return false;
  if (row.max_qty == null) return true;
  return quantity <= row.max_qty;
}

function pickShirtRow(rows, { productId, colorCategory, size, quantity }) {
  const candidates = rows.filter(
    (r) =>
      r.product_id === productId &&
      r.color_name === colorCategory &&
      r.size === size &&
      qtyMatches(r, quantity),
  );
  if (!candidates.length) return null;
  candidates.sort((a, b) => (b.min_qty ?? 1) - (a.min_qty ?? 1));
  return candidates[0];
}

function pickPrintRow(rows, { printingType, tier, colorCategory, quantity }) {
  const candidates = rows.filter((r) => {
    if (r.type_code !== printingType || r.size_tier !== tier) return false;
    if (!qtyMatches(r, quantity)) return false;
    if (printingType === 'DTG') {
      return r.color_name === colorCategory;
    }
    return r.color_name == null;
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => (b.min_qty ?? 1) - (a.min_qty ?? 1));
  return candidates[0];
}

async function loadCatalogFromDb() {
  const [shirtRes, printRes, colorRes] = await Promise.all([
    supabaseAdmin.from('shirt_pricing').select('*'),
    supabaseAdmin.from('print_pricing').select('*'),
    supabaseAdmin.from('colors').select('id, name'),
  ]);
  if (shirtRes.error) throw shirtRes.error;
  if (printRes.error) throw printRes.error;
  if (colorRes.error) throw colorRes.error;

  const colorsById = new Map();
  for (const row of colorRes.data ?? []) {
    colorsById.set(row.id, row.name);
  }

  catalog = {
    loadedAt: Date.now(),
    shirt: shirtRes.data ?? [],
    print: printRes.data ?? [],
    colorsById,
  };
  console.info(
    `[pricing-cache] loaded ${catalog.shirt.length} shirt + ${catalog.print.length} print rows`,
  );
}

async function ensureCatalogFresh() {
  if (catalog && Date.now() - catalog.loadedAt < TTL_MS) return;
  if (loading) {
    await loading;
    return;
  }
  loading = loadCatalogFromDb().finally(() => {
    loading = null;
  });
  await loading;
}

function resolveColorNameFromCache(color_id) {
  if (!catalog) return null;
  return catalog.colorsById.get(color_id) ?? null;
}

/**
 * Same outputs as DB calculatePrice but reads from in-memory catalog.
 */
function calculatePriceFromCache(input) {
  if (!catalog) throw new Error('Pricing catalog not loaded');
  const {
    printingType,
    aabb_w_cm,
    aabb_h_cm,
    quantity,
    shirt_qty,
    print_qty,
    productId,
    color_name,
    size,
  } = input;

  const tier = getPrintTier(aabb_w_cm, aabb_h_cm);
  const shirtQuantity = shirt_qty ?? quantity;
  const printQuantity = print_qty ?? quantity;
  const colorCategory = toColorCategory(color_name);

  const shirtRow = pickShirtRow(catalog.shirt, {
    productId,
    colorCategory,
    size,
    quantity: shirtQuantity,
  });
  if (!shirtRow) {
    throw new Error(
      `No shirt pricing found for product=${productId} color=${color_name} size=${size} qty=${shirtQuantity}`,
    );
  }

  const printRow = pickPrintRow(catalog.print, {
    printingType,
    tier,
    colorCategory,
    quantity: printQuantity,
  });
  if (!printRow) {
    throw new Error(
      `No print pricing found for type=${printingType} tier=${tier} color=${color_name} qty=${printQuantity}`,
    );
  }

  const shirt_per_unit = Number(shirtRow.price_per_unit_thb);
  const print_per_unit = Number(printRow.price_per_unit_thb);
  const total_per_unit = shirt_per_unit + print_per_unit;

  return {
    tier,
    shirt_per_unit,
    print_per_unit,
    total_per_unit,
    total: total_per_unit * quantity,
    quantity,
  };
}

module.exports = {
  ensureCatalogFresh,
  calculatePriceFromCache,
  resolveColorNameFromCache,
  /** @visibleForTesting */
  _resetCatalogForTests: () => {
    catalog = null;
    loading = null;
  },
};
