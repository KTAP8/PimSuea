const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { calculatePrice, lookupPrintPrice } = require('../utils/pricing');
const { supabaseAdmin } = require('../config/supabaseClient');

const { ACTIVE_PRINTING_TYPES } = require('../constants/printing');
const VALID_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
const VALID_TIERS = ['3x4in', 'A5', 'A4', 'A3'];

router.post('/', requireAuth, async (req, res) => {
  const { printingType, aabb_w_cm, aabb_h_cm, quantity, shirt_qty, print_qty, productId, color_id, size } = req.body;

  // Validate required fields
  if (!printingType || !ACTIVE_PRINTING_TYPES.includes(printingType)) {
    return res.status(400).json({ error: 'printingType must be DTG' });
  }
  if (typeof aabb_w_cm !== 'number' || aabb_w_cm <= 0 ||
      typeof aabb_h_cm !== 'number' || aabb_h_cm <= 0) {
    return res.status(400).json({ error: 'aabb_w_cm and aabb_h_cm must be positive numbers' });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  }
  if (shirt_qty !== undefined && (!Number.isInteger(shirt_qty) || shirt_qty < 1)) {
    return res.status(400).json({ error: 'shirt_qty must be a positive integer' });
  }
  if (print_qty !== undefined && (!Number.isInteger(print_qty) || print_qty < 1)) {
    return res.status(400).json({ error: 'print_qty must be a positive integer' });
  }
  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId is required' });
  }
  if (!color_id || typeof color_id !== 'string') {
    return res.status(400).json({ error: 'color_id is required' });
  }
  if (!size || !VALID_SIZES.includes(size)) {
    return res.status(400).json({ error: 'size must be S, M, L, XL, or XXL' });
  }

  // Resolve color_id → color_name ('White' or 'Black')
  const { data: colorRow, error: colorError } = await supabaseAdmin
    .from('colors')
    .select('name')
    .eq('id', color_id)
    .single();

  if (colorError || !colorRow) {
    return res.status(400).json({ error: `Unknown color_id: ${color_id}` });
  }

  const color_name = colorRow.name;

  try {
    const breakdown = await calculatePrice({
      printingType,
      aabb_w_cm,
      aabb_h_cm,
      quantity,
      shirt_qty,
      print_qty,
      productId,
      color_name,
      size,
    });
    return res.json(breakdown);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pricing lookup failed';
    return res.status(422).json({ error: message });
  }
});

// Price estimator — lets users see a price breakdown before designing.
// Requires auth to prevent blank-shirt price leakage (front/back both null is rejected).
router.get('/estimate', requireAuth, async (req, res) => {
  const { productId, colorName, size, quantity: qtyStr, printingType, frontTier, backTier } = req.query;

  const quantity = parseInt(qtyStr, 10);
  if (!Number.isInteger(quantity) || quantity < 1)
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  if (!productId)
    return res.status(400).json({ error: 'productId is required' });
  if (!colorName)
    return res.status(400).json({ error: 'colorName is required' });
  if (!VALID_SIZES.includes(size))
    return res.status(400).json({ error: 'Invalid size' });
  if (!ACTIVE_PRINTING_TYPES.includes(printingType))
    return res.status(400).json({ error: 'printingType must be DTG' });
  if (!frontTier && !backTier)
    return res.status(400).json({ error: 'At least one of frontTier or backTier is required' });
  if (frontTier && !VALID_TIERS.includes(frontTier))
    return res.status(400).json({ error: 'Invalid frontTier' });
  if (backTier && !VALID_TIERS.includes(backTier))
    return res.status(400).json({ error: 'Invalid backTier' });

  try {
    const { data: shirtRow, error: shirtError } = await supabaseAdmin
      .from('shirt_pricing')
      .select('price_per_unit_thb')
      .eq('product_id', productId)
      .eq('color_name', colorName)
      .eq('size', size)
      .lte('min_qty', quantity)
      .or(`max_qty.is.null,max_qty.gte.${quantity}`)
      .single();

    if (shirtError || !shirtRow)
      return res.status(422).json({ error: `ไม่พบราคาเสื้อสำหรับ สี=${colorName} ไซส์=${size} จำนวน=${quantity}` });

    const shirt_per_unit = Number(shirtRow.price_per_unit_thb);
    const front_print_per_unit = frontTier
      ? await lookupPrintPrice({ printingType, size_tier: frontTier, color_name: colorName, quantity })
      : 0;
    const back_print_per_unit = backTier
      ? await lookupPrintPrice({ printingType, size_tier: backTier, color_name: colorName, quantity })
      : 0;

    const total_per_unit = shirt_per_unit + front_print_per_unit + back_print_per_unit;
    return res.json({
      shirt_per_unit,
      front_print_per_unit,
      back_print_per_unit,
      total_per_unit,
      total: total_per_unit * quantity,
      quantity,
    });
  } catch (err) {
    return res.status(422).json({ error: err instanceof Error ? err.message : 'Pricing lookup failed' });
  }
});

module.exports = router;
