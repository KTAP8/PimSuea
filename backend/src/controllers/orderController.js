const { supabase, supabaseAdmin, getAuthenticatedSupabase } = require('../config/supabaseClient');
const { calculatePrice } = require('../utils/pricing');

exports.getUserOrders = async (req, res) => {
  const userId = req.user.id;
  // Use authenticated client to respect RLS
  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    const { data: orders, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          unit_price,
          user_design:user_designs (
            design_name,
            preview_image_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to match frontend interface
    const formattedOrders = orders.map(order => ({
        ...order,
        items: order.order_items ? order.order_items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.unit_price, // frontend expects 'price' in OrderItem
            product_name: item.user_design?.design_name || 'Custom Design',
            image: item.user_design?.preview_image_url
        })) : []
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderDetails = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    const { data: order, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          unit_price,
          user_design:user_designs (
            design_name,
            preview_image_url
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
         if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Order not found' });
        }
        throw error;
    }

    const formattedOrder = {
        ...order,
        total: order.total_amount, // Alias if frontend expects 'total' in some places, but interface says total_amount
        items: order.order_items ? order.order_items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.unit_price,
            product_name: item.user_design?.design_name || 'Custom Design',
            image: item.user_design?.preview_image_url
        })) : []
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { items, shipping } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    // 1. Server-side price recalculation for each item
    const pricedItems = await Promise.all(items.map(async (item) => {
      const designId = (item.designId && item.designId !== 'custom') ? item.designId : null;

      if (!designId) {
        // No design: cannot verify price, fall back to client-submitted price
        console.warn(`Order item has no design_id; using client price: ${item.price}`);
        return { ...item, verifiedUnitPrice: item.price };
      }

      // Fetch design data needed for pricing
      const { data: design, error: designError } = await supabaseAdmin
        .from('user_designs')
        .select('print_dimensions, printing_type, base_product_id')
        .eq('id', designId)
        .single();

      if (designError || !design) {
        console.warn(`Could not fetch design ${designId}; using client price`);
        return { ...item, verifiedUnitPrice: item.price };
      }

      // Derive max dimensions across all sides
      const dims = design.print_dimensions;
      let aabb_w_cm = 0;
      let aabb_h_cm = 0;
      if (dims && typeof dims === 'object') {
        for (const side of Object.values(dims)) {
          aabb_w_cm = Math.max(aabb_w_cm, side.w ?? 0);
          aabb_h_cm = Math.max(aabb_h_cm, side.h ?? 0);
        }
      }

      if (!aabb_w_cm || !aabb_h_cm || !design.printing_type) {
        console.warn(`Design ${designId} missing AABB/printing_type; using client price`);
        return { ...item, verifiedUnitPrice: item.price };
      }

      // Resolve color_id → color_name
      const { data: colorRow } = await supabaseAdmin
        .from('colors')
        .select('name')
        .eq('id', item.color_id || item.color)
        .single();

      const color_name = colorRow?.name;
      if (!color_name || !['White', 'Black'].includes(color_name)) {
        console.warn(`Color '${item.color_id || item.color}' not priceable; using client price`);
        return { ...item, verifiedUnitPrice: item.price };
      }

      try {
        const breakdown = await calculatePrice({
          printingType: design.printing_type,
          aabb_w_cm,
          aabb_h_cm,
          quantity: item.quantity,
          productId: design.base_product_id,
          color_name,
          size: item.size,
        });
        return { ...item, verifiedUnitPrice: breakdown.total_per_unit };
      } catch (priceErr) {
        console.warn(`Pricing lookup failed for design ${designId}: ${priceErr.message}; using client price`);
        return { ...item, verifiedUnitPrice: item.price };
      }
    }));

    const verifiedTotal = pricedItems.reduce(
      (sum, item) => sum + item.verifiedUnitPrice * item.quantity,
      0
    );

    // 2. Create Order with server-verified total
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: verifiedTotal,
        status: 'pending_payment',
        shipping_address: shipping,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Create Order Items with server-verified unit prices
    const orderItems = pricedItems.map(item => ({
      order_id: order.id,
      user_design_id: (item.designId && item.designId !== 'custom') ? item.designId : null,
      size: item.size,
      color: item.color_id || item.color,
      quantity: item.quantity,
      unit_price: item.verifiedUnitPrice,
      print_file_url: item.print_file_url,
    }));

    const { error: itemsError } = await client
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      await client.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    res.status(201).json({ message: 'Order created successfully', orderId: order.id });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.updateOrder = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { shipping_address } = req.body;
  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    // 1. Fetch current order to check status
    const { data: order, error: fetchError } = await client
        .from('orders')
        .select('status, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (fetchError || !order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Validate Status
    const editableStatuses = ['pending_payment', 'pending', 'processing'];
    if (!editableStatuses.includes(order.status)) {
        return res.status(400).json({ error: 'Order cannot be edited in its current status' });
    }

    // 3. Update Order
    const { error: updateError } = await client
        .from('orders')
        .update({ 
            shipping_address, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', userId);

    if (updateError) throw updateError;

    res.json({ message: 'Order updated successfully' });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};
