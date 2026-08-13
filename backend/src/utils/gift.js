const GIFT_SERVICE_CODE = 'gift_service';
const MAX_GIFT_MESSAGE_LENGTH = 280;

/**
 * Normalize client gift recipient draft to DB column names.
 * Accepts camelCase (frontend) or snake_case.
 */
function normalizeGiftRecipient(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const fullName = String(raw.fullName ?? raw.full_name ?? '').trim();
  const phone = String(raw.phone ?? '').trim();
  const addressLine1 = String(raw.addressLine1 ?? raw.address_line1 ?? '').trim();
  const addressLine2 = String(raw.addressLine2 ?? raw.address_line2 ?? '').trim() || null;
  const province = String(raw.province ?? '').trim();
  const district = String(raw.district ?? '').trim();
  const postalCode = String(raw.postalCode ?? raw.postal_code ?? '').trim();

  return {
    full_name: fullName,
    phone,
    address_line1: addressLine1,
    address_line2: addressLine2,
    province,
    district,
    postal_code: postalCode,
  };
}

function validateGiftRecipient(recipient) {
  const errors = [];
  if (!recipient?.full_name) errors.push('ชื่อผู้รับของขวัญ');
  if (!recipient?.phone) errors.push('เบอร์โทรผู้รับ');
  if (!recipient?.province) errors.push('จังหวัดผู้รับ');
  if (!recipient?.district) errors.push('เขต/อำเภอผู้รับ');
  if (!recipient?.postal_code) errors.push('รหัสไปรษณีย์ผู้รับ');
  if (!recipient?.address_line1) errors.push('ที่อยู่ผู้รับ');
  if (errors.length > 0) {
    throw new Error(`กรุณากรอกข้อมูลผู้รับให้ครบ: ${errors.join(', ')}`);
  }
}

function validateGiftMessage(message) {
  if (message == null || message === '') return null;
  const trimmed = String(message).trim();
  if (trimmed.length > MAX_GIFT_MESSAGE_LENGTH) {
    throw new Error(`ข้อความการ์ดของขวัญยาวเกิน ${MAX_GIFT_MESSAGE_LENGTH} ตัวอักษร`);
  }
  return trimmed;
}

/**
 * Format gift_recipients row for API responses (camelCase for frontend).
 */
function formatGiftRecipientForClient(row) {
  if (!row) return null;
  return {
    fullName: row.full_name,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? '',
    province: row.province,
    district: row.district,
    postalCode: row.postal_code,
  };
}

module.exports = {
  GIFT_SERVICE_CODE,
  MAX_GIFT_MESSAGE_LENGTH,
  normalizeGiftRecipient,
  validateGiftRecipient,
  validateGiftMessage,
  formatGiftRecipientForClient,
};
