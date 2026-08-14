import { useEffect, useState } from 'react';
import { Gift, ChevronDown, ChevronUp, MapPin, MessageSquareText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GiftRecipientInfo } from '@/types/gift';
import { EMPTY_GIFT_RECIPIENT, MAX_GIFT_MESSAGE_LENGTH } from '@/types/gift';
import {
  filterAddressInput,
  validateAddressField,
  validateAddressFields,
  type AddressField,
  REQUIRED_ADDRESS_FIELDS,
} from '@/lib/addressValidation';

interface Props {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  message: string;
  onMessageChange: (message: string) => void;
  recipient: GiftRecipientInfo;
  onRecipientChange: (recipient: GiftRecipientInfo) => void;
  addonPrice: number | null;
  addonAvailable: boolean;
  addonName?: string;
  /** Increment to force full validation (e.g. on submit) */
  validateKey?: number;
}

export function GiftServiceLineOption({
  enabled,
  onEnabledChange,
  message,
  onMessageChange,
  recipient,
  onRecipientChange,
  addonPrice,
  addonAvailable,
  addonName = 'Gift Service',
  validateKey = 0,
}: Props) {
  const [expanded, setExpanded] = useState(enabled);
  const [touchedFields, setTouchedFields] = useState<Set<AddressField>>(new Set());
  const [errors, setErrors] = useState<Partial<Record<AddressField, string>>>({});

  useEffect(() => {
    if (!enabled || validateKey === 0) return;
    setExpanded(true);
    setTouchedFields(new Set(REQUIRED_ADDRESS_FIELDS));
    setErrors(validateAddressFields(recipient));
    // Only re-run when parent triggers validation (submit), not on each keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validateKey, enabled]);

  const updateRecipient = (field: keyof GiftRecipientInfo, value: string) => {
    const filtered = filterAddressInput(field, value);
    onRecipientChange({ ...(recipient ?? EMPTY_GIFT_RECIPIENT), [field]: filtered });
    if (touchedFields.has(field as AddressField)) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateAddressField(field as AddressField, filtered),
      }));
    }
  };

  const handleBlur = (field: AddressField) => {
    setTouchedFields((prev) => new Set([...prev, field]));
    setErrors((prev) => ({
      ...prev,
      [field]: validateAddressField(field, recipient?.[field] ?? ''),
    }));
  };

  const fieldClass = (field: AddressField) =>
    errors[field] ? 'border-red-500 focus-visible:ring-red-500' : '';

  const handleToggle = (next: boolean) => {
    onEnabledChange(next);
    setExpanded(next);
    if (next && !recipient?.fullName) {
      onRecipientChange({ ...EMPTY_GIFT_RECIPIENT });
    }
    if (!next) {
      setTouchedFields(new Set());
      setErrors({});
    }
  };

  const displayPrice = addonPrice ?? 179;

  return (
    <div
      className={`w-full mt-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
        enabled
          ? 'border-primary/40 bg-linear-to-b from-primary/4 to-background shadow-md shadow-primary/5'
          : 'border-border/80 bg-card hover:border-primary/30 shadow-xs'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          
          {/* Left: Checkbox + Gift Icon + Title */}
          <label className="flex items-center gap-3 cursor-pointer group select-none flex-1 min-w-0">
            {/* Custom Styled Checkbox */}
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={enabled}
                disabled={!addonAvailable}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <div
                className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
                  enabled
                    ? 'bg-primary border-primary text-white shadow-xs'
                    : 'border-muted-foreground/40 bg-background group-hover:border-primary/60'
                }`}
              >
                {enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Gift Icon Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                enabled ? 'bg-primary text-white shadow-sm' : 'bg-primary/10 text-primary'
              }`}
            >
              <Gift className="w-4 h-4" />
            </div>

            {/* Name & Price */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-heavy text-base text-foreground tracking-tight">
                {addonName}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                +฿{displayPrice.toLocaleString()}
              </span>
            </div>
          </label>

          {/* Right: Expand / Collapse Toggle Button */}
          {enabled && (
            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors shrink-0"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Subtitle Description */}
        <p className="text-xs text-muted-foreground font-light leading-relaxed pl-8 sm:pl-11">
          กล่องของขวัญ + การ์ด ส่งตรงถึงผู้รับ (รวมค่าจัดส่ง) — ไม่แสดงราคาในกล่อง
        </p>

        {!addonAvailable && (
          <p className="text-xs text-amber-700 font-medium pl-8 sm:pl-11">
            บริการของขวัญไม่พร้อมให้บริการในขณะนี้
          </p>
        )}
      </div>

      {/* Expanded Details Body */}
      <AnimatePresence initial={false}>
        {enabled && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-5 pt-2 sm:px-5 sm:pb-6 space-y-5 border-t border-primary/15 bg-background/50">
              
              {/* Card Greeting Message Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquareText className="w-3.5 h-3.5 text-primary" />
                    ข้อความบนการ์ด (ไม่บังคับ)
                  </Label>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {message.length}/{MAX_GIFT_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => onMessageChange(e.target.value.slice(0, MAX_GIFT_MESSAGE_LENGTH))}
                  placeholder="เขียนข้อความถึงผู้รับ..."
                  className="min-h-21 w-full rounded-xl border border-input bg-background/90 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none shadow-xs"
                  maxLength={MAX_GIFT_MESSAGE_LENGTH}
                />
              </div>

              {/* Recipient Shipping Address Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-border/80 pb-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    ที่อยู่ผู้รับของขวัญ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground/80 mb-1 block">
                      ชื่อ-นามสกุลผู้รับ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={recipient?.fullName ?? ''}
                      onChange={(e) => updateRecipient('fullName', e.target.value)}
                      onBlur={() => handleBlur('fullName')}
                      placeholder="ระบุชื่อและนามสกุลผู้รับ"
                      className={`h-10 text-sm rounded-xl ${fieldClass('fullName')}`}
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-foreground/80 mb-1 block">
                      เบอร์โทร <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={recipient?.phone ?? ''}
                      onChange={(e) => updateRecipient('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      placeholder="08X-XXX-XXXX"
                      className={`h-10 text-sm rounded-xl ${fieldClass('phone')}`}
                      inputMode="tel"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-foreground/80 mb-1 block">
                      รหัสไปรษณีย์ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={recipient?.postalCode ?? ''}
                      onChange={(e) => updateRecipient('postalCode', e.target.value)}
                      onBlur={() => handleBlur('postalCode')}
                      placeholder="10XXX"
                      className={`h-10 text-sm rounded-xl ${fieldClass('postalCode')}`}
                      inputMode="numeric"
                    />
                    {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-foreground/80 mb-1 block">
                      จังหวัด <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={recipient?.province ?? ''}
                      onChange={(e) => updateRecipient('province', e.target.value)}
                      onBlur={() => handleBlur('province')}
                      placeholder="เช่น กรุงเทพมหานคร"
                      className={`h-10 text-sm rounded-xl ${fieldClass('province')}`}
                    />
                    {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-foreground/80 mb-1 block">
                      เขต/อำเภอ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={recipient?.district ?? ''}
                      onChange={(e) => updateRecipient('district', e.target.value)}
                      onBlur={() => handleBlur('district')}
                      placeholder="เช่น ปทุมวัน"
                      className={`h-10 text-sm rounded-xl ${fieldClass('district')}`}
                    />
                    {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground/80 mb-1 block">
                      ที่อยู่ (บ้านเลขที่, ซอย, ถนน) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={recipient?.addressLine1 ?? ''}
                      onChange={(e) => updateRecipient('addressLine1', e.target.value)}
                      onBlur={() => handleBlur('addressLine1')}
                      placeholder="บ้านเลขที่ ซอย อาคาร ถนน"
                      className={`h-10 text-sm rounded-xl ${fieldClass('addressLine1')}`}
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground/80 mb-1 block">
                      ที่อยู่เพิ่มเติม (ไม่บังคับ)
                    </Label>
                    <Input
                      value={recipient?.addressLine2 ?? ''}
                      onChange={(e) => updateRecipient('addressLine2', e.target.value)}
                      placeholder="เช่น ชั้น, เลขที่ห้อง, จุดสังเกต"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
