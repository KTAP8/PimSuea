const { supabase, getAuthenticatedSupabase } = require('../config/supabaseClient');

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
  const { items, shipping, total } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Use Authenticated Client to respect RLS but allow insert if policy permits
  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    // 1. Create Order
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: total,
        status: 'pending_payment',
        shipping_address: shipping,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items
    const orderItems = items.map(item => ({
      order_id: order.id,
      user_design_id: item.designId, // Ensure this matches frontend
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsError } = await client
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback: try to delete the order if items fail
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
