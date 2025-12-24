const { supabase } = require('../config/supabaseClient');

exports.getArticleById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Handle "not found" specifically if needed, likely code 'PGRST116'
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Article not found' });
      }
      throw error;
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};
