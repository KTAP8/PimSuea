const { getAuthenticatedSupabase } = require('../config/supabaseClient');

const VALID_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

exports.getCart = async (req, res) => {
  try {
    const db = getAuthenticatedSupabase(req.token);
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
  const { id, product_id, color_id, size, quantity, design_id, print_file_url, preview_url, design_name } = req.body;

  if (!id || !product_id || !color_id || !VALID_SIZES.includes(size) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Invalid cart item' });
  }

  try {
    const db = getAuthenticatedSupabase(req.token);
    const { error } = await db.from('cart_items').upsert({
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
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Error upserting cart item:', err);
    res.status(500).json({ error: 'Failed to save cart item' });
  }
};

exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const allowed = ['color_id', 'size', 'quantity', 'print_file_url'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.updated_at = new Date().toISOString();

  try {
    const db = getAuthenticatedSupabase(req.token);
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
    const db = getAuthenticatedSupabase(req.token);
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
    const db = getAuthenticatedSupabase(req.token);
    const { error } = await db.from('cart_items').delete().eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};
