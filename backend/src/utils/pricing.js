const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Maps any shirt color name to the pricing category used in print_pricing / shirt_pricing.
 * DTG has two tiers: White and Other (all non-white colors).
 * @param {string} colorName
 * @returns {'White'|'Other'}
 */
function toColorCategory(colorName) {
  return colorName === 'White' ? 'White' : 'Other';
}

/**
 * Determine print tier from rotated AABB dimensions (in cm).
 * @param {number} w_cm
 * @param {number} h_cm
 * @returns {'3x4in'|'A5'|'A4'|'A3'}
 */
function getPrintTier(w_cm, h_cm) {
  // Normalize to short/long so landscape and portrait are treated identically
  const short = Math.min(w_cm, h_cm);
  const long  = Math.max(w_cm, h_cm);
  // Custom inch-based tiers: 3x4in, A5=6x8in, A4=8x12in, A3=12x16in (catch-all)
  if (short <= 7.62  && long <= 10.16) return '3x4in';
  if (short <= 15.24 && long <= 20.32) return 'A5';
  if (short <= 20.32 && long <= 30.48) return 'A4';
  return 'A3';
}

/**
 * Calculate price from the two-table pricing model.
 *
 * @param {{
 *   printingType: 'DTG'|'DTF',
 *   aabb_w_cm: number,
 *   aabb_h_cm: number,
 *   quantity: number,
 *   productId: string,
 *   color_name: string,
 *   size: 'S'|'M'|'L'|'XL'|'XXL'
 * }} input
 * @returns {Promise<{
 *   tier: string,
 *   shirt_per_unit: number,
 *   print_per_unit: number,
 *   total_per_unit: number,
 *   total: number,
 *   quantity: number
 * }>}
 */
async function calculatePrice({ printingType, aabb_w_cm, aabb_h_cm, quantity, shirt_qty, print_qty, productId, color_name, size }) {
  const db = supabaseAdmin;

  const tier = getPrintTier(aabb_w_cm, aabb_h_cm);
  const shirtQuantity = shirt_qty ?? quantity;
  const printQuantity = print_qty ?? quantity;

  // Look up shirt price (product + color + size + qty bracket)
  const { data: shirtRow, error: shirtError } = await db
    .from('shirt_pricing')
    .select('price_per_unit_thb')
    .eq('product_id', productId)
    .eq('color_name', toColorCategory(color_name))
    .eq('size', size)
    .lte('min_qty', shirtQuantity)
    .or(`max_qty.is.null,max_qty.gte.${shirtQuantity}`)
    .single();

  if (shirtError || !shirtRow) {
    throw new Error(
      `No shirt pricing found for product=${productId} color=${color_name} size=${size} qty=${shirtQuantity}`
    );
  }

  // Look up print price (type + tier + color[DTG only] + qty bracket)
  let printQuery = db
    .from('print_pricing')
    .select('price_per_unit_thb')
    .eq('type_code', printingType)
    .eq('size_tier', tier)
    .lte('min_qty', printQuantity)
    .or(`max_qty.is.null,max_qty.gte.${printQuantity}`);

  if (printingType === 'DTG') {
    printQuery = printQuery.eq('color_name', toColorCategory(color_name));
  } else {
    printQuery = printQuery.is('color_name', null);
  }

  const { data: printRow, error: printError } = await printQuery.single();

  if (printError || !printRow) {
    throw new Error(
      `No print pricing found for type=${printingType} tier=${tier} color=${color_name} qty=${printQuantity}`
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

/**
 * Look up delivery fee based on total shirt quantity in the order.
 * @param {number} totalQty
 * @returns {Promise<{ fee: number, label: string }>}
 */
async function getDeliveryFee(totalQty) {
  const { data, error } = await supabaseAdmin
    .from('delivery_fees')
    .select('fee_thb, label')
    .lte('min_qty', totalQty)
    .or(`max_qty.is.null,max_qty.gte.${totalQty}`)
    .single();

  if (error || !data) return { fee: 0, label: 'ฟรี' };
  return { fee: Number(data.fee_thb), label: data.label };
}

/**
 * Look up the print cost for one side given a known size tier.
 * Used by the price estimator (user picks tier directly, no dimensions needed).
 */
async function lookupPrintPrice({ printingType, size_tier, color_name, quantity }) {
  let query = supabaseAdmin
    .from('print_pricing')
    .select('price_per_unit_thb')
    .eq('type_code', printingType)
    .eq('size_tier', size_tier)
    .lte('min_qty', quantity)
    .or(`max_qty.is.null,max_qty.gte.${quantity}`);

  if (printingType === 'DTG') {
    query = query.eq('color_name', toColorCategory(color_name));
  } else {
    query = query.is('color_name', null);
  }

  const { data, error } = await query.single();
  if (error || !data) {
    throw new Error(`No print pricing found for type=${printingType} tier=${size_tier} qty=${quantity}`);
  }
  return Number(data.price_per_unit_thb);
}

module.exports = { getPrintTier, calculatePrice, getDeliveryFee, lookupPrintPrice, toColorCategory };
