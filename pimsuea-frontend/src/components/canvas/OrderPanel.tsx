import { Loader2, Minus, Plus, ShoppingCart, X, Zap } from 'lucide-react';
import type { CanvasPriceBreakdown } from '../../types/canvas';
import { DTF_DISCONTINUED_MESSAGE, isLegacyDtfPrintingType } from '../../constants/printing';

interface Props {
    selectedSize: string;
    onSizeChange: (s: string) => void;
    availableSizes: string[];
    quantity: number;
    onQuantityChange: (q: number) => void;
    priceBreakdown: CanvasPriceBreakdown | null;
    isAddingToCart: boolean;
    isSaving: boolean;
    onAddToCart: () => void;
    onOrderNow: () => void;
    onClose: () => void;
    printingType: string;
}

export function OrderPanel({
    selectedSize, onSizeChange, availableSizes,
    quantity, onQuantityChange,
    priceBreakdown,
    isAddingToCart, isSaving,
    onAddToCart, onOrderNow, onClose,
    printingType,
}: Props) {
    const isDtfLegacy = isLegacyDtfPrintingType(printingType);
    const busy = isAddingToCart || isSaving;
    const checkoutDisabled = busy || isDtfLegacy;
    const pricePerUnit = priceBreakdown?.total_per_unit ?? null;
    const totalPrice = pricePerUnit != null ? pricePerUnit * quantity : null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h3 className="font-bold text-base text-gray-900">สั่งซื้อสินค้า</h3>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 pb-6 flex flex-col gap-5">
                    {/* Size */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">ไซส์</p>
                        <div className="flex gap-2 flex-wrap">
                            {availableSizes.map(s => (
                                <button
                                    key={s}
                                    onClick={() => onSizeChange(s)}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                                        selectedSize === s
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">จำนวน</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all">
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-gray-800">{quantity}</span>
                            <button
                                onClick={() => onQuantityChange(quantity + 1)}
                                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Price summary */}
                    {priceBreakdown && (
                        <div className="bg-gray-50 rounded-2xl p-4">
                            {priceBreakdown.sides.map(s => (
                                <div key={s.side} className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>พิมพ์ ({s.side} · {s.tier})</span>
                                    <span>฿{s.print_per_unit.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                <span>เสื้อ</span>
                                <span>฿{priceBreakdown.shirt_per_unit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-2">
                                <span>รวม × {quantity}</span>
                                <span>฿{totalPrice?.toLocaleString() ?? '—'}</span>
                            </div>
                        </div>
                    )}
                    {!priceBreakdown && (
                        <p className="text-xs text-gray-400 text-center">บันทึกดีไซน์เพื่อดูราคา</p>
                    )}

                    {isDtfLegacy && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                {DTF_DISCONTINUED_MESSAGE}
                            </p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onOrderNow}
                            disabled={checkoutDisabled}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-sm hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            สั่งซื้อทันที
                        </button>
                        <button
                            onClick={onAddToCart}
                            disabled={checkoutDisabled}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                            เพิ่มลงตะกร้า
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center -mt-2">
                        ดีไซน์จะถูกบันทึกอัตโนมัติก่อนสั่งซื้อ
                    </p>
                </div>
            </div>
        </div>
    );
}
