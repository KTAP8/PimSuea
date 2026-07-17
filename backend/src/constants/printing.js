const ACTIVE_PRINTING_TYPES = ['DTG'];
const LEGACY_PRINTING_TYPES = ['DTG', 'DTF'];

function isActivePrintingType(type) {
  return ACTIVE_PRINTING_TYPES.includes(type);
}

function filterActivePrintMethods(methods) {
  return (methods ?? []).filter(m => m?.name?.toUpperCase() !== 'DTF');
}

module.exports = {
  ACTIVE_PRINTING_TYPES,
  LEGACY_PRINTING_TYPES,
  isActivePrintingType,
  filterActivePrintMethods,
};
