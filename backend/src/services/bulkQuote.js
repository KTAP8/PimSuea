/**
 * Bulk quote for one design in one colour across several sizes (the studio size grid).
 * Tier quantity = total shirts in the grid, exactly as checkout prices it
 * (shirt_qty = product+colour total, print_qty = design total — one design here).
 */
const { ensureCatalogFresh, calculatePriceFromCache } = require('../utils/pricingCatalogCache');

function quoteAt({ printingType, productId, color_name, sides, lines, totalQty }) {
  const priced = lines.filter((l) => l.qty > 0).map((l) => {
    const perSide = sides.map((d) => calculatePriceFromCache({
      printingType, aabb_w_cm: d.w, aabb_h_cm: d.h, quantity: l.qty,
      shirt_qty: totalQty, print_qty: totalQty, productId, color_name, size: l.size,
    }));
    const shirt = perSide[0].shirt_per_unit;
    const print = perSide.reduce((s, r) => s + r.print_per_unit, 0);
    return { size: l.size, qty: l.qty, shirt_per_unit: shirt, print_per_unit: print, unit: shirt + print, total: (shirt + print) * l.qty };
  });
  const total = priced.reduce((s, l) => s + l.total, 0);
  return { lines: priced, total, totalQty, avgUnit: totalQty ? total / totalQty : 0 };
}

/** Next quantity where any price bracket used by this quote steps down. */
function nextBreakpoint(catalogRows, totalQty) {
  const mins = catalogRows.map((r) => r.min_qty ?? 1).filter((m) => m > totalQty);
  return mins.length ? Math.min(...mins) : null;
}

async function bulkQuote({ printingType, productId, color_name, sides, lines }) {
  await ensureCatalogFresh();
  const { catalog } = require('../utils/pricingCatalogCache');
  const totalQty = lines.reduce((s, l) => s + (l.qty > 0 ? l.qty : 0), 0);
  if (!totalQty) return { lines: [], total: 0, totalQty: 0, avgUnit: 0, next: null };

  const current = quoteAt({ printingType, productId, color_name, sides, lines, totalQty });

  // Rows that can affect this design: same product (shirts) and same print type (print).
  const rows = [
    ...(catalog?.shirt ?? []).filter((r) => r.product_id === productId),
    ...(catalog?.print ?? []).filter((r) => r.type_code === printingType),
  ];
  const nextQty = nextBreakpoint(rows, totalQty);
  let next = null;
  if (nextQty) {
    // Add the extra shirts to the most-ordered size (what most people would do).
    const biggest = [...lines].sort((a, b) => b.qty - a.qty)[0];
    const bumped = lines.map((l) => (l.size === biggest.size ? { ...l, qty: l.qty + (nextQty - totalQty) } : l));
    try {
      const at = quoteAt({ printingType, productId, color_name, sides, lines: bumped, totalQty: nextQty });
      if (at.avgUnit < current.avgUnit - 0.5) {
        next = { qty: nextQty, addMore: nextQty - totalQty, avgUnit: at.avgUnit, savingPerShirt: current.avgUnit - at.avgUnit };
      }
    } catch { /* no pricing at that qty for some size — skip the nudge */ }
  }
  return { ...current, next };
}

module.exports = { bulkQuote };
