
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;


if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase URL or Publishable Key is missing. Using mock client for testing.');
  
  // Mock client to allow server to start without valid keys
  const mockSupabase = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }) // Auto-auth for testing if keys missing
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: {}, error: null }), data: [], error: null }) }),
      insert: () => ({ select: () => ({ data: [], error: null }) })
    })
  };
  
  module.exports = { supabase: mockSupabase, supabaseAdmin: null };
} else {
  // Client for public interaction (uses Publishable Key)
  const supabase = createClient(supabaseUrl, supabasePublishableKey);

  // Client for admin interaction (uses Secret Key)
  const supabaseAdmin = supabaseSecretKey 
    ? createClient(supabaseUrl, supabaseSecretKey) 
    : null;

  module.exports = { supabase, supabaseAdmin };
}


