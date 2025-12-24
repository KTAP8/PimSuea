
const { supabase } = require('../config/supabaseClient');

exports.getDashboardData = async (req, res) => {
  try {
    // MOCK: Fetch latest 3 news items
    // const { data: news, error: newsError } = await supabase
    //   .from('news')
    //   .select('*')
    //   .order('created_at', { ascending: false })
    //   .limit(3);
    
    const mockNews = [
      { id: 1, title: 'Summer Sale Started!', content: 'Get 20% off...', created_at: new Date().toISOString() },
      { id: 2, title: 'New Hoodies Available', content: 'Check out our new line...', created_at: new Date().toISOString() },
      { id: 3, title: 'Platform Maintenance', content: 'Scheduled for Sunday...', created_at: new Date().toISOString() }
    ];

    // MOCK: Fetch top 5 best-selling products
    // const { data: bestSellers, error: salesError } = await supabase
    //   .from('products')
    //   .select('*')
    //   .order('sales_count', { ascending: false })
    //   .limit(5);

    const mockBestSellers = [
      { id: 101, name: 'Cotton T-Shirt', price: 299, sales_count: 1500 },
      { id: 102, name: 'Canvas Tote Bag', price: 199, sales_count: 1200 },
      { id: 103, name: 'Ceramic Mug', price: 150, sales_count: 900 },
      { id: 104, name: 'Phone Case', price: 250, sales_count: 850 },
      { id: 105, name: 'Sticker Pack', price: 99, sales_count: 800 }
    ];

    // if (newsError) throw newsError;
    // if (salesError) throw salesError;

    res.json({
      news: mockNews,
      bestSellers: mockBestSellers
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
};
