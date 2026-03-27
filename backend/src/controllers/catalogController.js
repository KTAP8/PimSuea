const { supabase } = require('../config/supabaseClient');
const { isUUID, isPositiveInt } = require('../utils/validate');

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
    let query = supabase
      .from('products')
      .select(`
        id,
        name:title,
        price:base_price,
        min_price,
        description:details,
        is_beginner_friendly,
        category_id,
        product_images (image_url, is_hover, display_order)
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

    const formattedProducts = products.map(p => {
        const gallery = p.product_images
            ? p.product_images.filter(img => !img.is_hover).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            : [];
        const hoverImg = p.product_images ? p.product_images.find(img => img.is_hover) : null;
        return {
            ...p,
            image_url: gallery.length > 0 ? gallery[0].image_url : null,
            hover_image_url: hoverImg ? hoverImg.image_url : null,
            starting_price: p.min_price ?? null,
            price: p.min_price ?? p.price,
        };
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  if (!isUUID(id) && !isPositiveInt(id)) {
    return res.status(400).json({ error: 'ID ไม่ถูกต้อง' });
  }

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name:title,
        price:base_price,
        min_price,
        description:details,
        care_instructions,
        size_guide,
        is_beginner_friendly,
        category_id,
        product_images (image_url, is_hover, display_order),
        category:categories(name),
        product_print_methods (
          print_method:print_methods (
            id,
            name,
            description
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Product not found' });
        }
        throw error;
    }

    // Process print methods and their associated pricing tiers
    const printMethods = product.product_print_methods
      ? product.product_print_methods.map(ppm => ppm.print_method)
      : [];

    const startingPrice = product.min_price ?? null;

    // Derive available sizes from shirt_pricing (authoritative source)
    const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
    const { data: shirtPricingRows } = await supabase
        .from('shirt_pricing')
        .select('size')
        .eq('product_id', product.id);
    const available_sizes = shirtPricingRows
        ? [...new Set(shirtPricingRows.map(r => r.size))]
            .sort((a, b) => {
                const ai = SIZE_ORDER.indexOf(a);
                const bi = SIZE_ORDER.indexOf(b);
                if (ai === -1 && bi === -1) return a.localeCompare(b);
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
            })
        : Object.keys(product.size_guide || {});

    const galleryImages = product.product_images
        ? product.product_images.filter(img => !img.is_hover).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        : [];
    const hoverImg = product.product_images
        ? product.product_images.find(img => img.is_hover)
        : null;

    const formattedProduct = {
        ...product,
        images: galleryImages.map(img => img.image_url),
        image_url: galleryImages.length > 0 ? galleryImages[0].image_url : null,
        hover_image_url: hoverImg ? hoverImg.image_url : null,
        print_methods: printMethods,
        starting_price: startingPrice,
        available_sizes,
    };

    delete formattedProduct.product_print_methods;

    res.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
};

exports.getProductTemplates = async (req, res) => {
  const { id } = req.params;

  if (!isUUID(id) && !isPositiveInt(id)) {
    return res.status(400).json({ error: 'ID ไม่ถูกต้อง' });
  }

  try {
    const { data: templates, error } = await supabase
      .from('product_templates')
      .select('*, color:colors(id, name, hex_code)')
      .eq('product_id', id);

    if (error) throw error;

    res.json(templates);
  } catch (error) {
    console.error('Error fetching product templates:', error);
    res.status(500).json({ error: 'Failed to fetch product templates' });
  }
};
