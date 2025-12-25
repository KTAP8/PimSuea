
const { supabase } = require('../config/supabaseClient');

exports.getDashboardData = async (req, res) => {
  try {
    // 1. Fetch News (Standard select)
    const { data: news, error: newsError } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .limit(10);

    if (newsError) throw newsError;

    // 2. Fetch Best Sellers (Using the RPC function)
    // We pass { limit_count: 5 } as an argument
    const { data: bestSellers, error: salesError } = await supabase
      .rpc('get_best_sellers', { limit_count: 5 });

    if (salesError) throw salesError;

    res.json({
      news,
      bestSellers
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
};
