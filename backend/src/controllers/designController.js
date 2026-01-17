
const { supabase, supabaseAdmin, getAuthenticatedSupabase } = require('../config/supabaseClient');

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


exports.getDesignById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    const { data, error } = await db
      .from('user_designs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
             return res.status(404).json({ error: 'Design not found' });
        }
        throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({ error: 'Failed to fetch design' });
  }
};

exports.saveDesign = async (req, res) => {
  const userId = req.user.id;
  const { canvas_data, preview_image_url, design_name, base_product_id, print_file_url } = req.body;

  if (!canvas_data || !preview_image_url || !base_product_id) {
       return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`Saving design for user ${userId}: ${design_name}`);
    
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    // Check if printing_type is provided
    const printingType = req.body.printing_type || null;

    const { data, error } = await db
      .from('user_designs')
      .insert([{ 
          user_id: userId, 
          base_product_id: base_product_id,
          design_name: design_name || 'Untitled Design',
          canvas_data: canvas_data, 
          preview_image_url: preview_image_url,
          print_file_url: print_file_url || null, // Save print file URL(s)
          is_ordered: false,
          available_colors: req.body.available_colors || [],
          printing_type: printingType
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

exports.updateDesign = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { canvas_data, preview_image_url, design_name, print_file_url } = req.body;

  if (!canvas_data || !preview_image_url) {
       return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log("Updating design " + id + " for user " + userId);
    
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    // 1. Fetch current design to handle file cleanup
    const { data: oldDesign, error: fetchError } = await db
        .from('user_designs')
        .select('print_file_url')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
        
    if (fetchError || !oldDesign) {
        return res.status(404).json({ error: 'Design not found' });
    }

    // 2. Cleanup old print files if a new one is provided
    if (print_file_url && oldDesign.print_file_url && print_file_url !== oldDesign.print_file_url) {
        try {
            // Parse OLD URLs
            let oldUrls = [];
            try {
                const parsed = JSON.parse(oldDesign.print_file_url);
                if (typeof parsed === 'object' && parsed !== null) {
                    oldUrls = Object.values(parsed);
                } else {
                    oldUrls = [oldDesign.print_file_url];
                }
            } catch (e) {
                oldUrls = [oldDesign.print_file_url];
            }

            // Parse NEW URLs to avoid deleting reused files
            let newUrls = [];
            try {
                const parsedNew = JSON.parse(print_file_url);
                if (typeof parsedNew === 'object' && parsedNew !== null) {
                    newUrls = Object.values(parsedNew);
                } else {
                    newUrls = [print_file_url];
                }
            } catch (e) {
                newUrls = [print_file_url];
            }

            // Find URLs that are in Old but NOT in New
            const urlsToDelete = oldUrls.filter(url => !newUrls.includes(url));

            if (urlsToDelete.length > 0) {
                // Extract paths from URLs
                const paths = urlsToDelete.map(url => {
                    const parts = url.split('/print-files/');
                    return parts.length > 1 ? parts[1] : null;
                }).filter(Boolean);

                if (paths.length > 0) {
                     console.log("Deleting old print files:", paths);
                     // Use admin client if available for reliable deletion, fallback to standard client
                     const storageClient = supabaseAdmin || supabase;
                     
                     const { error: deleteError } = await storageClient.storage
                        .from('print-files')
                        .remove(paths);
                        
                     if (deleteError) console.error("Storage delete error:", deleteError);
                }
            }

        } catch (cleanupErr) {
            console.error("Failed to cleanup old print files:", cleanupErr);
            // Non-blocking error
        }
    }
    
    // 3. Update Record
    const { data, error } = await db
      .from('user_designs')
      .update({ 
          design_name: design_name || 'Untitled Design',
          canvas_data: canvas_data, 
          preview_image_url: preview_image_url,
          print_file_url: print_file_url || oldDesign.print_file_url, // Update if new provided
          available_colors: req.body.available_colors || [],
          printing_type: req.body.printing_type || undefined,
          updated_at: new Date()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

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
