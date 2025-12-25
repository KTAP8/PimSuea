
const { supabase, getAuthenticatedSupabase } = require('../config/supabaseClient');

exports.getUserDesigns = async (req, res) => {
  const userId = req.user.id; // From requireAuth

  try {
    console.log(`Fetching designs for user: ${userId}`);
    
    // Use Authenticated client for SELECT to respect RLS (Users can view own designs)
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    const { data, error } = await db
      .from('user_designs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`Found ${data.length} designs for user ${userId}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
};

exports.saveDesign = async (req, res) => {
  const userId = req.user.id;
  // Note: 'canvas_json' coming from frontend might be named 'canvas_data' in request body
  // based on our frontend change: { canvas_data, preview_image_url, base_product_id, design_name }
  const { canvas_data, preview_image_url, design_name, base_product_id } = req.body;

  if (!canvas_data || !preview_image_url || !base_product_id) {
       return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`Saving design for user ${userId}: ${design_name}`);
    
    // Insert into user_designs using Authenticated client to respect RLS
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    const { data, error } = await db
      .from('user_designs')
      .insert([{ 
          user_id: userId, 
          base_product_id: base_product_id,
          design_name: design_name || 'Untitled Design',
          canvas_data: canvas_data, 
          preview_image_url: preview_image_url,
          is_ordered: false
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Design saved successfully', design: data });
  } catch (error) {
    console.error('Error saving design:', error);
    res.status(500).json({ error: error.message, details: error });
  }
};

exports.getDesignById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    // Check if ID is a valid UUID to avoid syntax errors if frontend passes non-UUID
    // Actually, RLS/DB will throw if invalid UUID, but let's just let DB handle it.
    
    const { data, error } = await db
      .from('user_designs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) 
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Design not found' });

    res.json(data);
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({ error: 'Failed to fetch design' });
  }
};

exports.updateDesign = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { canvas_data, preview_image_url, design_name } = req.body;

  if (!canvas_data || !preview_image_url) {
       return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log("Updating design " + id + " for user " + userId + ": " + design_name);
    
    // Use Authenticated client
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    // Update - RLS ensures user can only update their own
    const { data, error } = await db
      .from('user_designs')
      .update({ 
          design_name: design_name || 'Untitled Design',
          canvas_data: canvas_data, 
          preview_image_url: preview_image_url,
          updated_at: new Date() // Ensure your DB has this column or trigger? Usually Supabase handles it or we pass it
      })
      .eq('id', id)
      .eq('user_id', userId) // Extra safety
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Design not found or update failed' });

    res.json({ message: 'Design updated successfully', design: data });
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({ error: error.message, details: error });
  }
};

exports.deleteDesign = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    console.log(`Deleting design ${id} for user ${userId}`);
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    // Check if design exists and belongs to user first (optional but good for debugging)
    // Actually DELETE with RLS will just silently fail (count=0) if not matched.
    
    const { error, count } = await db
      .from('user_designs')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    
    // Note: Supabase delete returns count of deleted rows if proper header? 
    // Usually it returns null data on success unless .select() appended.
    
    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
};
