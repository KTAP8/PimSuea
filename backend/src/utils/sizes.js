const { supabaseAdmin } = require('../config/supabaseClient');

/** Display sort order only — not used for validation. */
const SIZE_ORDER = ['Free Size', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

function sortSizes(sizes) {
  return [...new Set(sizes)].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/**
 * Distinct sizes from shirt_pricing for one product, sorted for display.
 * @param {string} productId
 * @returns {Promise<string[]>}
 */
async function getAvailableSizes(productId) {
  const { data, error } = await supabaseAdmin
    .from('shirt_pricing')
    .select('size')
    .eq('product_id', productId);

  if (error) throw error;
  if (!data?.length) return [];
  return sortSizes(data.map(r => r.size));
}

/**
 * Batch lookup: productId → Set of valid sizes.
 * @param {string[]} productIds
 * @returns {Promise<Map<string, Set<string>>>}
 */
async function getSizesByProductIds(productIds) {
  const unique = [...new Set(productIds.filter(Boolean))];
  const map = new Map(unique.map(id => [id, new Set()]));
  if (unique.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from('shirt_pricing')
    .select('product_id, size')
    .in('product_id', unique);

  if (error) throw error;
  for (const row of data ?? []) {
    map.get(row.product_id)?.add(row.size);
  }
  return map;
}

/**
 * @param {string} productId
 * @param {string} size
 * @returns {Promise<boolean>}
 */
async function isValidSizeForProduct(productId, size) {
  if (!productId || !size) return false;
  const sizes = await getAvailableSizes(productId);
  return sizes.includes(size);
}

module.exports = {
  SIZE_ORDER,
  sortSizes,
  getAvailableSizes,
  getSizesByProductIds,
  isValidSizeForProduct,
};
