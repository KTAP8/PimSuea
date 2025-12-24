
const { supabase } = require('../config/supabaseClient');

exports.getCategories = async (req, res) => {
  try {
    // MOCK: Fetch all categories
    // const { data, error } = await supabase.from('categories').select('*');
    
    const mockCategories = [
      { id: 1, name: 'Apparel', slug: 'apparel' },
      { id: 2, name: 'Accessories', slug: 'accessories' },
      { id: 3, name: 'Stationery', slug: 'stationery' }
    ];

    res.json(mockCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.getProducts = async (req, res) => {
  const { category, is_beginner_friendly } = req.query;

  try {
    // MOCK: Fetch products with filters
    // let query = supabase.from('products').select('*');
    // if (category) query = query.eq('category_slug', category);
    // if (is_beginner_friendly === 'true') query = query.eq('is_beginner_friendly', true);
    // const { data, error } = await query;

    console.log(`Fetching products with filters: category=${category}, is_beginner_friendly=${is_beginner_friendly}`);

    const mockProducts = [
      { id: 101, name: 'Cotton T-Shirt', category: 'apparel', price: 299, is_beginner_friendly: true },
      { id: 102, name: 'Canvas Tote Bag', category: 'accessories', price: 199, is_beginner_friendly: true },
      { id: 106, name: 'Hoodie', category: 'apparel', price: 590, is_beginner_friendly: false }
    ];

    // Simple in-memory filtering for mock
    let filtered = mockProducts;
    if (category) filtered = filtered.filter(p => p.category === category);
    if (is_beginner_friendly === 'true') filtered = filtered.filter(p => p.is_beginner_friendly);

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    // MOCK: Fetch product details
    // const { data, error } = await supabase.from('products').select('*').eq('id', id).single();

    if (id === '999') {
        return res.status(404).json({ error: 'Product not found' });
    }

    const mockProduct = {
      id: id,
      name: 'Mock Product',
      description: 'Full details about this product...',
      care_instructions: 'Wash cold, tumble dry low.',
      size_guide: { S: '36"', M: '38"', L: '40"' },
      price: 299
    };

    res.json(mockProduct);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
};
