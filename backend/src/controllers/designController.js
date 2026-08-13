
const { supabase, supabaseAdmin, getAuthenticatedSupabase } = require('../config/supabaseClient');
const { isUUID, isPositiveInt } = require('../utils/validate');
const { getLocationFromUrl, deleteObject, normalizeStoredUrlField } = require('../config/r2Client');

const { ACTIVE_PRINTING_TYPES } = require('../constants/printing');

function withNormalizedMedia(design) {
  if (!design) return design;
  return {
    ...design,
    preview_image_url: normalizeStoredUrlField(design.preview_image_url),
    print_file_url: normalizeStoredUrlField(design.print_file_url),
  };
}

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
    res.json(data.map(withNormalizedMedia));
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
};


exports.getDesignById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!isUUID(id) && !isPositiveInt(id)) {
    return res.status(400).json({ error: 'ID ไม่ถูกต้อง' });
  }

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

    res.json(withNormalizedMedia(data));
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

  if (!isPositiveInt(base_product_id) && !isUUID(String(base_product_id))) {
    return res.status(400).json({ error: 'base_product_id ไม่ถูกต้อง' });
  }

  const printingType = req.body.printing_type || null;
  if (printingType && !ACTIVE_PRINTING_TYPES.includes(printingType)) {
    return res.status(400).json({ error: 'printing_type ไม่ถูกต้อง' });
  }

  const safeName = (design_name && typeof design_name === 'string')
    ? design_name.slice(0, 200)
    : 'Untitled Design';

  const normalizedPreview = normalizeStoredUrlField(preview_image_url);
  const normalizedPrint = print_file_url ? normalizeStoredUrlField(print_file_url) : null;

  try {
    console.log(`Saving design for user ${userId}: ${safeName}`);

    const db = getAuthenticatedSupabase(req.headers.authorization);

    const { data, error } = await db
      .from('user_designs')
      .insert([{ 
          user_id: userId,
          base_product_id: base_product_id,
          design_name: safeName,
          canvas_data: canvas_data, 
          preview_image_url: normalizedPreview,
          print_file_url: normalizedPrint,
          design_hash: req.body.design_hash || null,
          is_ordered: false,
          available_colors: req.body.available_colors || [],
          printing_type: printingType,
          print_dimensions: req.body.print_dimensions ?? null,
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

  if (!isUUID(id) && !isPositiveInt(id)) {
    return res.status(400).json({ error: 'ID ไม่ถูกต้อง' });
  }

  if (!canvas_data || !preview_image_url) {
       return res.status(400).json({ error: 'Missing required fields' });
  }

  const updatePrintingType = req.body.printing_type || undefined;

  const safeUpdateName = (design_name && typeof design_name === 'string')
    ? design_name.slice(0, 200)
    : 'Untitled Design';

  const normalizedPreview = normalizeStoredUrlField(preview_image_url);
  const normalizedPrint = print_file_url ? normalizeStoredUrlField(print_file_url) : undefined;

  try {
    console.log("Updating design " + id + " for user " + userId);
    
    const db = getAuthenticatedSupabase(req.headers.authorization);
    
    // 1. Fetch current design to handle file cleanup
    const { data: oldDesign, error: fetchError } = await db
        .from('user_designs')
        .select('print_file_url, design_hash, printing_type')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
        
    if (fetchError || !oldDesign) {
        return res.status(404).json({ error: 'Design not found' });
    }

    if (updatePrintingType) {
      const isExistingLegacyDtf =
        oldDesign.printing_type === 'DTF' && updatePrintingType === 'DTF';
      if (!isExistingLegacyDtf && !ACTIVE_PRINTING_TYPES.includes(updatePrintingType)) {
        return res.status(400).json({ error: 'printing_type ไม่ถูกต้อง' });
      }
    }

    // 2. Cleanup old print files if a new one is provided
    // 2. Cleanup old draft print files when a new print file is provided
    if (print_file_url && oldDesign.print_file_url && print_file_url !== oldDesign.print_file_url) {
      let oldUrls = [];
      try { oldUrls = Object.values(JSON.parse(oldDesign.print_file_url)); }
      catch { oldUrls = [oldDesign.print_file_url]; }
      await Promise.all(oldUrls.map(async (url) => {
        const loc = getLocationFromUrl(url);
        if (loc && loc.bucket === 'print-files') {
          await deleteObject(loc.bucket, loc.key).catch(e =>
            console.warn('Could not delete old print file:', loc.key, e.message)
          );
        }
      }));
    }
    
    // 3. Update Record
    const { data, error } = await db
      .from('user_designs')
      .update({ 
          design_name: safeUpdateName,
          canvas_data: canvas_data,
          preview_image_url: normalizedPreview,
          print_file_url: normalizedPrint || oldDesign.print_file_url,
          design_hash: req.body.design_hash || oldDesign.design_hash,
          available_colors: req.body.available_colors || [],
          printing_type: updatePrintingType,
          print_dimensions: req.body.print_dimensions ?? undefined,
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

  if (!isUUID(id) && !isPositiveInt(id)) {
    return res.status(400).json({ error: 'ID ไม่ถูกต้อง' });
  }

  try {
    console.log(`Deleting design ${id} for user ${userId}`);
    const db = getAuthenticatedSupabase(req.headers.authorization);

    // Fetch file URLs before deleting so we can clean up R2
    const { data: design, error: fetchError } = await db
      .from('user_designs')
      .select('preview_image_url, print_file_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Delete DB record first
    const { error } = await db
      .from('user_designs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Clean up R2 files (best-effort — don't fail the request if R2 delete fails)
    // Both preview_image_url and print_file_url are stored as JSON maps of URLs.
    const parseUrls = (raw) => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) return Object.values(parsed);
      } catch { /* not JSON */ }
      return [raw]; // legacy plain URL
    };

    const urlsToDelete = [...parseUrls(design.preview_image_url), ...parseUrls(design.print_file_url)];
    for (const url of urlsToDelete) {
      const loc = getLocationFromUrl(url);
      if (loc) {
        deleteObject(loc.bucket, loc.key).catch(err =>
          console.error(`R2 delete failed for ${url}: ${err.message}`)
        );
      }
    }

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
};
