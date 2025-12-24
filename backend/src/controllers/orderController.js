
const { supabase } = require('../config/supabaseClient');

exports.getUserOrders = async (req, res) => {
  const userId = req.user.id;

  try {
    // MOCK: Fetch orders for the user
    // const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId);

    console.log(`Fetching orders for user: ${userId}`);

    const mockOrders = [
      { id: 'ORD-123', total: 598, status: 'shipped', created_at: new Date().toISOString() },
      { id: 'ORD-124', total: 299, status: 'processing', created_at: new Date().toISOString() }
    ];

    res.json(mockOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderDetails = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // MOCK: Fetch order details (ensure it belongs to user)
    // const { data, error } = await supabase
    //   .from('orders')
    //   .select('*, order_items(*)')
    //   .eq('id', id)
    //   .eq('user_id', userId)
    //   .single();

    console.log(`Fetching order details for order ${id} and user ${userId}`);

    const mockOrderDetails = {
      id: id,
      user_id: userId,
      total: 598,
      status: 'shipped',
      tracking_number: 'TRACK-999',
      items: [
        { product_name: 'Cotton T-Shirt', quantity: 2, price: 299 }
      ]
    };

    res.json(mockOrderDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};
