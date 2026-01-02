const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY;

console.log('Env Check:', { 
    URL: !!supabaseUrl, 
    Key: !!supabaseKey, 
    Publishable: !!process.env.SUPABASE_PUBLISHABLE_KEY,
    Secret: !!process.env.SUPABASE_SECRET_KEY 
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars. URL or Key is undefined.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const productId = 'dad17a2c-a83e-4bfa-a372-55df7c10df9b'; // Known product
  console.log(`Checking join query for product: ${productId}`);

  const { data, error } = await supabase
    .from('product_templates')
    .select('id, side, color_id, color:colors(id, name, hex_code)')
    .eq('product_id', productId);

  if (error) {
    console.error('Query Error:', error);
    // Try without alias if alias failed (though alias is standard)
    if (error.code === 'PGRST200') {
         console.log('Retrying without explicit alias/relationship check...');
    }
  } else {
    console.log('Returned Data:', JSON.stringify(data, null, 2));
  }
}

inspect();
