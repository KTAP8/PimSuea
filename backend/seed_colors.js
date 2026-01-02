require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Check .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedColors() {
  const colors = [
    { id: 'white', name: 'White', hex_code: '#FFFFFF' },
    { id: 'black', name: 'Black', hex_code: '#000000' }
  ];

  console.log('Seeding colors:', colors);

  const { data, error } = await supabase
    .from('colors')
    .upsert(colors, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Error seeding colors:', error);
  } else {
    console.log('Successfully seeded colors:', data);
  }
}

seedColors();
