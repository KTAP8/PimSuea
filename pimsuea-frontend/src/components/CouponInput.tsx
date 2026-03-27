import { useState } from "react";
import { validateCoupon, type CouponValidationResult } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Tag, X } from "lucide-react";

export interface AppliedCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_thb: number | null;
  max_qty: number | null;
}

/** Mirror of backend computeCouponDiscount — used for client-side preview only. */
export function computeDiscount(coupon: AppliedCoupon, subtotal: number, totalQty: number): number {
  if (totalQty <= 0 || subtotal <= 0) return 0;
  const applicableQty = coupon.max_qty != null ? Math.min(totalQty, coupon.max_qty) : totalQty;
  const fraction = applicableQty / totalQty;
  const discountableSubtotal = subtotal * fraction;
  if (coupon.discount_type === 'percentage') {
    const raw = discountableSubtotal * (coupon.discount_value / 100);
    return coupon.max_discount_thb != null ? Math.min(raw, coupon.max_discount_thb) : raw;
  }
  return Math.min(coupon.discount_value, discountableSubtotal);
}

interface CouponInputProps {
  subtotal: number;
  totalQty: number;
  onApply: (coupon: AppliedCoupon, discount: number) => void;
  onClear: () => void;
  appliedCoupon: AppliedCoupon | null;
}

export default function CouponInput({ subtotal, totalQty, onApply, onClear, appliedCoupon }: CouponInputProps) {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result: CouponValidationResult = await validateCoupon(inputCode.trim());
      if (!result.valid) {
        setError(result.reason ?? 'รหัสโค้ดไม่ถูกต้อง');
        return;
      }
      const coupon: AppliedCoupon = {
        code: result.code!,
        discount_type: result.discount_type!,
        discount_value: result.discount_value!,
        max_discount_thb: result.max_discount_thb ?? null,
        max_qty: result.max_qty ?? null,
      };
      const discount = computeDiscount(coupon, subtotal, totalQty);
      onApply(coupon, discount);
      setInputCode('');
    } catch {
      setError('เกิดข้อผิดพลาดในการตรวจสอบโค้ด');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputCode('');
    setError(null);
    onClear();
  };

  if (appliedCoupon) {
    const discount = computeDiscount(appliedCoupon, subtotal, totalQty);
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm">
        <div className="flex items-center gap-2 text-green-700">
          <Tag className="w-4 h-4" />
          <span className="font-medium">{appliedCoupon.code}</span>
          <span className="text-green-600">
            {appliedCoupon.discount_type === 'percentage'
              ? `(-${appliedCoupon.discount_value}%${appliedCoupon.max_discount_thb ? ` สูงสุด ฿${appliedCoupon.max_discount_thb.toLocaleString()}` : ''})`
              : `(-฿${appliedCoupon.discount_value.toLocaleString()})`
            }
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-green-700">-฿{discount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
          <button onClick={handleClear} className="text-green-600 hover:text-green-800 transition-colors" aria-label="ลบโค้ด">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          placeholder="รหัสโปรโมชัน"
          value={inputCode}
          onChange={(e) => { setInputCode(e.target.value.toUpperCase()); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
          className={error ? 'border-red-400 focus-visible:ring-red-400' : ''}
          disabled={loading}
        />
        <Button variant="outline" onClick={handleApply} disabled={loading || !inputCode.trim()} className="shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ใช้โค้ด'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
