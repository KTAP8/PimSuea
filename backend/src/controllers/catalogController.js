const { supabase } = require('../config/supabaseClient');

exports.getCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('id');

    if (error) throw error;
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.getProducts = async (req, res) => {
  const { category_id, is_beginner_friendly } = req.query;

  try {
    // Select columns and join images, filtering by is_active instead of is_published
    // Map DB columns to Frontend names: title->name, base_price->price, details->description
    let query = supabase
      .from('products')
      .select(`
        id,
        name:title,
        price:base_price,
        description:details,
        is_beginner_friendly,
        category_id,
        product_images (image_url)
      `)
      .eq('is_active', true);

    if (category_id && category_id !== 'undefined') {
        query = query.eq('category_id', category_id);
    }
    
    if (is_beginner_friendly === 'true') {
        query = query.eq('is_beginner_friendly', true);
    }

    const { data: products, error } = await query;

    if (error) throw error;

    const formattedProducts = products.map(p => ({
        ...p,
        image_url: p.product_images && p.product_images.length > 0 ? p.product_images[0].image_url : null
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name:title,
        price:base_price,
        description:details,
        care_instructions,
        size_guide,
        is_beginner_friendly,
        category_id,
        product_images (image_url),
        category:categories(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Product not found' });
        }
        throw error;
    }

    const formattedProduct = {
        ...product,
        images: product.product_images ? product.product_images.map(img => img.image_url) : [],
        image_url: product.product_images && product.product_images.length > 0 ? product.product_images[0].image_url : null
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
};

exports.getProductTemplates = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: templates, error } = await supabase
      .from('product_templates')
      .select('*')
      .eq('product_id', id);

    if (error) throw error;
    res.json(templates);
  } catch (error) {
    console.error('Error fetching product templates:', error);
    res.status(500).json({ error: 'Failed to fetch product templates' });
  }
};
