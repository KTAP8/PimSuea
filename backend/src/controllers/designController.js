
const { supabase } = require('../config/supabaseClient');

exports.getUserDesigns = async (req, res) => {
  const userId = req.user.id;

  try {
    // MOCK: Fetch designs for the user
    // const { data, error } = await supabase.from('designs').select('*').eq('user_id', userId);

    console.log(`Fetching designs for user: ${userId}`);

    const mockDesigns = [
      { id: 1, name: 'My Cool T-Shirt', preview_url: 'https://example.com/preview1.jpg', created_at: new Date().toISOString() },
      { id: 2, name: 'Untitled Design', preview_url: 'https://example.com/preview2.jpg', created_at: new Date().toISOString() }
    ];

    res.json(mockDesigns);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
};

exports.saveDesign = async (req, res) => {
  const userId = req.user.id;
  const { canvas_json, preview_url, name } = req.body;

  try {
    // MOCK: Insert new design
    // const { data, error } = await supabase
    //   .from('designs')
    //   .insert([{ user_id: userId, canvas_json, preview_url, name }])
    //   .select();

    console.log(`Saving design for user ${userId}: ${name}`);

    res.status(201).json({ message: 'Design saved successfully', id: Date.now() });
  } catch (error) {
    console.error('Error saving design:', error);
    res.status(500).json({ error: 'Failed to save design' });
  }
};
