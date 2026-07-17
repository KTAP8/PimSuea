const ACTIVE_PRINTING_TYPES = ['DTG'];
const LEGACY_PRINTING_TYPES = ['DTG', 'DTF'];

function isLegacyDtfPrintMethod(method) {
  if (!method) return false;
  const id = String(method.id ?? '').toLowerCase();
  const name = String(method.name ?? '').toUpperCase();
  return (
    id === 'dtf'
    || id.includes('dtf')
    || name === 'DTF'
    || name.includes('DTF')
    || name.includes('DIRECT TO FILM')
    || name.includes('DIRECT-TO-FILM')
  );
}

function isActivePrintingType(type) {
  return ACTIVE_PRINTING_TYPES.includes(type);
}

function filterActivePrintMethods(methods) {
  return (methods ?? []).filter(m => !isLegacyDtfPrintMethod(m));
}

function productHasActivePrintMethod(productPrintMethods) {
  const methods = productPrintMethods
    ? productPrintMethods.map(ppm => ppm.print_method).filter(Boolean)
    : [];
  return filterActivePrintMethods(methods).length > 0;
}

module.exports = {
  ACTIVE_PRINTING_TYPES,
  LEGACY_PRINTING_TYPES,
  isActivePrintingType,
  isLegacyDtfPrintMethod,
  filterActivePrintMethods,
  productHasActivePrintMethod,
};
