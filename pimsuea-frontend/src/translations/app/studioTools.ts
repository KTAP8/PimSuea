import type { Language } from '@/i18n/types';

/** Copy for the redesigned studio: start panel, text tool, templates, presets, drafts, errors. */
const en = {
  dropHere: 'Drop your image to add it',



  // Print-size presets
  presetsLabel: 'Print size',
  presetHint: 'Fits the {tier} price tier',

  // Layers / keyboard
  noLayers: 'No layers yet',
  deleteHint: 'Delete',

  // Price card
  addArtworkForPrice: 'Add artwork to see your price',
  bulkFrom: 'From {price}/shirt at {qty}+',

  // Drafts
  draftRestored: 'We restored your unsaved design',
  draftDiscard: 'Start over',
  leaveTitle: 'Leave the studio?',
  leaveBody: 'Your design is kept on this device — it will be here when you come back.',
  leaveKeep: 'Keep draft & leave',
  leaveDiscard: 'Discard design',
  leaveStay: 'Keep designing',

  // Saves & errors
  saved: 'Saved',
  orderThisDesign: 'Order this design',
  retry: 'Retry',
  saveErrors: {
    network: "Couldn't reach our server. Check your connection and retry.",
    session: 'Your session expired. Sign in again to save.',
    tooLarge: 'One of your images is too large. Try a smaller file (max 50 MB).',
    server: 'Something went wrong on our side. Retry in a moment.',
  },
  uploadFailed: 'Upload failed — {reason}',
  uploadFailedGeneric: 'Upload failed. Try again or use a smaller file.',
  mockupFailed: "Couldn't build the preview. Try again.",
  cartSyncFailed: "Your cart couldn't sync — it's still saved on this device.",
  libraryLoadFailed: "Couldn't load your images. Try again.",

  // Mobile labels
  mockupShort: 'Preview',
  saveShort: 'Save',
};

const th: typeof en = {
  dropHere: 'วางรูปเพื่อเพิ่มลงเสื้อ',



  presetsLabel: 'ขนาดลาย',
  presetHint: 'ราคาขนาด {tier}',

  noLayers: 'ยังไม่มีเลเยอร์',
  deleteHint: 'ลบ',

  addArtworkForPrice: 'เพิ่มลายเพื่อดูราคา',
  bulkFrom: 'เริ่ม {price}/ตัว เมื่อสั่ง {qty}+',

  draftRestored: 'เรากู้ดีไซน์ที่ยังไม่ได้บันทึกให้แล้ว',
  draftDiscard: 'เริ่มใหม่',
  leaveTitle: 'ออกจากสตูดิโอ?',
  leaveBody: 'ดีไซน์ของคุณถูกเก็บไว้ในเครื่องนี้ กลับมาเมื่อไหร่ก็ยังอยู่',
  leaveKeep: 'เก็บดราฟต์แล้วออก',
  leaveDiscard: 'ทิ้งดีไซน์',
  leaveStay: 'ออกแบบต่อ',

  saved: 'บันทึกแล้ว',
  orderThisDesign: 'สั่งดีไซน์นี้',
  retry: 'ลองอีกครั้ง',
  saveErrors: {
    network: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
    session: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้งเพื่อบันทึก',
    tooLarge: 'รูปบางรูปใหญ่เกินไป ลองใช้ไฟล์ที่เล็กลง (ไม่เกิน 50 MB)',
    server: 'ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งในอีกสักครู่',
  },
  uploadFailed: 'อัปโหลดไม่สำเร็จ — {reason}',
  uploadFailedGeneric: 'อัปโหลดไม่สำเร็จ ลองใหม่หรือใช้ไฟล์ที่เล็กลง',
  mockupFailed: 'สร้างภาพตัวอย่างไม่สำเร็จ ลองอีกครั้ง',
  cartSyncFailed: 'ซิงก์ตะกร้าไม่สำเร็จ แต่ยังบันทึกไว้ในเครื่องนี้',
  libraryLoadFailed: 'โหลดคลังรูปไม่สำเร็จ ลองอีกครั้ง',

  mockupShort: 'ตัวอย่าง',
  saveShort: 'บันทึก',
};

export const studioToolsTranslations: Record<Language, typeof en> = { th, en };
