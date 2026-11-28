import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { track } from '@/lib/analytics';
import type { Order } from '@/types/api';

/** Copies a past order's lines (same designs, sizes, colours, quantities) into the cart. */
export function useReorder() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const canReorder = (order: Order) => Boolean(order.items?.some((i) => i.design_id && i.product_id && i.size));

  const reorder = useCallback((order: Order) => {
    const lines = (order.items ?? []).filter((i) => i.design_id && i.product_id && i.size && !i.is_gift);
    for (const i of lines) {
      addToCart({
        product_id: i.product_id!,
        color_id: i.color_id ?? '',
        size: i.size!,
        quantity: i.quantity,
        design_id: i.design_id!,
        print_file_url: i.print_file_url ?? '',
        design_json: {},
        preview_url: i.image,
        design_name: i.product_name,
      });
    }
    track('reorder', { order_id: String(order.id), lines: lines.length });
    toast.success(t.ordering.reorderAdded);
    navigate('/checkout');
  }, [addToCart, navigate, t]);

  return { reorder, canReorder };
}
