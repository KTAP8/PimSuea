/**
 * Deactivate catalog products that only support legacy DTF print methods.
 * Run from backend/: node scripts/deactivate_dtf_only_products.js
 */
require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabaseClient');
const { isLegacyDtfPrintMethod } = require('../src/constants/printing');

async function main() {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, title, is_active, product_print_methods(print_method:print_methods(id, name))')
    .eq('is_active', true);

  if (error) throw error;

  let count = 0;
  for (const p of products ?? []) {
    const methods = (p.product_print_methods ?? []).map(x => x.print_method).filter(Boolean);
    const active = methods.filter(m => !isLegacyDtfPrintMethod(m));
    if (active.length === 0) {
      console.log('Deactivating:', p.title, p.id);
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ is_active: false })
        .eq('id', p.id);
      if (updateError) throw updateError;
      count += 1;
    }
  }

  console.log(`Deactivated ${count} DTF-only product(s).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
