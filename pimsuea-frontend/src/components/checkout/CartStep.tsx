import { AlertCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { dtfDiscontinuedMessage } from '@/translations/app/checkout';
import type { Checkout } from '@/hooks/useCheckout';
import type { CartItem } from '@/lib/checkoutCart';
import { CartDesignGroup } from './CartDesignGroup';
import { AddDesignSheet } from './AddDesignSheet';
import { CartSummaryBox } from './CartSummaryBox';

/** Groups lines by design + colour (in first-seen order) so sizes are edited together. */
function groupLines(items: CartItem[]): CartItem[][] {
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = `${item.designId}:${item.color_id}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()];
}

export function CartStep({ ck }: { ck: Checkout }) {
  const { c, lang } = ck;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center"><ShoppingCart className="mr-2" aria-hidden="true" /> {c.cartTitle}</h2>
      {ck.hasDtfItems && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">{c.dtfBlocked}</AlertTitle>
          <AlertDescription>{dtfDiscontinuedMessage(lang)}</AlertDescription>
        </Alert>
      )}
      {ck.cartItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <p className="text-gray-600 mb-4">{c.cartEmpty}</p>
          <Button onClick={() => ck.navigate('/catalog')}>{c.pickDesign}</Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          <div className="space-y-4">
            {groupLines(ck.cartItems).map((lines) => <CartDesignGroup key={lines[0].id} ck={ck} lines={lines} />)}
            <AddDesignSheet ck={ck} />
          </div>
          <div className="lg:sticky lg:top-6"><CartSummaryBox ck={ck} /></div>
        </div>
      )}
    </div>
  );
}
