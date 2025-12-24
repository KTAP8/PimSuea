
const { supabase } = require('../config/supabaseClient');

exports.getTransactions = async (req, res) => {
  const userId = req.user.id;

  try {
    // MOCK: Fetch wallet transactions
    // const { data, error } = await supabase.from('wallet_transactions').select('*').eq('user_id', userId);

    console.log(`Fetching wallet transactions for user: ${userId}`);

    const mockTransactions = [
      { id: 1, type: 'credit', amount: 1000, description: 'Top up', created_at: new Date().toISOString() },
      { id: 2, type: 'debit', amount: 598, description: 'Payment for order ORD-123', created_at: new Date().toISOString() }
    ];

    res.json(mockTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};
