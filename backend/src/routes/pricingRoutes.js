const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { calculatePrice } = require('../utils/pricing');
const { supabaseAdmin } = require('../config/supabaseClient');

const VALID_PRINTING_TYPES = ['DTG', 'DTF'];
const VALID_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const VALID_COLORS = ['White', 'Black'];

router.post('/', requireAuth, async (req, res) => {
  const { printingType, aabb_w_cm, aabb_h_cm, quantity, productId, color_id, size } = req.body;

  // Validate required fields
  if (!printingType || !VALID_PRINTING_TYPES.includes(printingType)) {
    return res.status(400).json({ error: 'printingType must be DTG or DTF' });
  }
  if (typeof aabb_w_cm !== 'number' || aabb_w_cm <= 0 ||
      typeof aabb_h_cm !== 'number' || aabb_h_cm <= 0) {
    return res.status(400).json({ error: 'aabb_w_cm and aabb_h_cm must be positive numbers' });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
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
  if (!VALID_COLORS.includes(color_name)) {
    return res.status(422).json({
      error: `Color '${color_name}' is not supported for pricing. Supported colors: White, Black`,
    });
  }

  try {
    const breakdown = await calculatePrice({
      printingType,
      aabb_w_cm,
      aabb_h_cm,
      quantity,
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

module.exports = router;
