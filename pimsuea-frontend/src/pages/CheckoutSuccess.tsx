import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCheckoutSessionStatus } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/i18n/LanguageContext';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;

export default function CheckoutSuccess() {
  const { t } = useLanguage();
  const c = t.checkout;
  const common = t.common;
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'expired' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage(c.noSession);
      return;
    }

    let cancelled = false;
    let pollCount = 0;

    const poll = async () => {
      try {
        const result = await getCheckoutSessionStatus(sessionId);
        if (cancelled) return;

        if (result.status === 'paid' && result.orderId) {
          setOrderId(result.orderId);
          setStatus('paid');
          clearCart();
          return;
        }

        if (result.status === 'expired') {
          setStatus('expired');
          return;
        }

        pollCount += 1;
        if (pollCount >= MAX_POLLS) {
          setStatus('pending');
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(c.verifyFailed);
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [sessionId, clearCart, c.noSession, c.verifyFailed]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">{c.verifying}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h1 className="text-xl font-bold">{common.error}</h1>
        <p className="text-muted-foreground">{errorMessage}</p>
        <Link to="/checkout"><Button variant="outline">{c.backToCheckout}</Button></Link>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h1 className="text-xl font-bold">{c.sessionExpired}</h1>
        <p className="text-muted-foreground">{c.sessionExpiredDesc}</p>
        <Link to="/checkout"><Button>{c.backToCheckout}</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl space-y-6">
      <div className="text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">
          {status === 'paid' ? c.paidTitle : c.paidPendingTitle}
        </h1>
        <p className="text-muted-foreground mt-2">
          {status === 'paid' ? c.paidDesc : c.paidPendingDesc}
        </p>
      </div>

      {orderId && (
        <div className="bg-muted/50 rounded-xl border p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">{c.orderNumber}</p>
          <p className="text-xl font-bold font-mono">#{orderId}</p>
        </div>
      )}

      <Link to="/orders">
        <Button className="w-full" size="lg">
          {c.viewMyOrders} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
