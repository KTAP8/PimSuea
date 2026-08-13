export interface GiftRecipientInfo {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  province: string;
  district: string;
  postalCode: string;
}

export interface AddonPricing {
  code: string;
  name: string;
  price_thb: number;
}

export const GIFT_SERVICE_CODE = 'gift_service';
export const MAX_GIFT_MESSAGE_LENGTH = 280;

export const EMPTY_GIFT_RECIPIENT: GiftRecipientInfo = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  province: '',
  district: '',
  postalCode: '',
};
