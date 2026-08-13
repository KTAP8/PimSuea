const { getAuthenticatedSupabase } = require('../config/supabaseClient');
const { isValidSizeForProduct } = require('../utils/sizes');

exports.getCart = async (req, res) => {
  try {
    const db = getAuthenticatedSupabase(req.headers.authorization);
    const { data, error } = await db
      .from('cart_items')
      .select('*')
      .order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

exports.upsertItem = async (req, res) => {
  const {
    id, product_id, color_id, size, quantity, design_id, print_file_url, preview_url, design_name,
    is_gift, gift_message, gift_recipient,
  } = req.body;

  if (!id || !product_id || !color_id || !size || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Invalid cart item' });
  }

  try {
    const sizeValid = await isValidSizeForProduct(product_id, size);
    if (!sizeValid) {
      return res.status(400).json({ error: `size "${size}" ไม่ถูกต้องสำหรับสินค้านี้` });
    }

    const db = getAuthenticatedSupabase(req.headers.authorization);
    const row = {
      id,
      user_id: req.user.id,
      product_id,
      color_id,
      size,
      quantity,
      design_id: design_id || null,
      print_file_url: print_file_url || null,
      preview_url: preview_url || null,
      design_name: design_name || null,
      is_gift: Boolean(is_gift),
      gift_message: gift_message ?? null,
      gift_recipient: gift_recipient ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from('cart_items').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Error upserting cart item:', err);
    res.status(500).json({ error: 'Failed to save cart item' });
  }
};

exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const allowed = ['color_id', 'size', 'quantity', 'print_file_url', 'is_gift', 'gift_message', 'gift_recipient'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.updated_at = new Date().toISOString();

  try {
    const db = getAuthenticatedSupabase(req.headers.authorization);

    if (updates.size) {
      const { data: existing, error: fetchError } = await db
        .from('cart_items')
        .select('product_id')
        .eq('id', id)
        .single();
      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      const sizeValid = await isValidSizeForProduct(existing.product_id, updates.size);
      if (!sizeValid) {
        return res.status(400).json({ error: `size "${updates.size}" ไม่ถูกต้องสำหรับสินค้านี้` });
      }
    }

    const { error } = await db.from('cart_items').update(updates).eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const db = getAuthenticatedSupabase(req.headers.authorization);
    const { error } = await db.from('cart_items').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Error removing cart item:', err);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const db = getAuthenticatedSupabase(req.headers.authorization);
    const { error } = await db.from('cart_items').delete().eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};
