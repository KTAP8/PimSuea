/**
 * One-off: unlink DTF print methods from all products.
 * Run from backend/: node scripts/remove_dtf_from_products.js
 */
require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabaseClient');
const { isLegacyDtfPrintMethod } = require('../src/constants/printing');

async function main() {
  const { data: methods, error: methodsError } = await supabaseAdmin
    .from('print_methods')
    .select('id, name');

  if (methodsError) throw methodsError;

  const dtfIds = (methods ?? [])
    .filter(m => isLegacyDtfPrintMethod(m))
    .map(m => m.id);

  if (dtfIds.length === 0) {
    console.log('No DTF print_methods rows found.');
    return;
  }

  console.log('DTF print_method ids:', dtfIds);

  const { data: deleted, error: deleteError } = await supabaseAdmin
    .from('product_print_methods')
    .delete()
    .in('print_method_id', dtfIds)
    .select('product_id, print_method_id');

  if (deleteError) throw deleteError;

  console.log(`Removed ${deleted?.length ?? 0} product_print_methods link(s).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
