import { Loader2 } from "lucide-react";
import { TermsModal } from "@/components/TermsModal";
import { useCheckout } from "@/hooks/useCheckout";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { CheckoutNotice } from "@/components/checkout/CheckoutNotice";
import { CartStep } from "@/components/checkout/CartStep";
import { ShippingStep } from "@/components/checkout/ShippingStep";
import { SummaryStep } from "@/components/checkout/SummaryStep";
import { CheckoutFooterBar } from "@/components/checkout/CheckoutFooterBar";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Order() {
  const ck = useCheckout();
  const { t } = useLanguage();
  const { c } = ck;

  if (ck.loading && ck.cartItems.length === 0) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" aria-label="Loading" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <CheckoutStepper step={ck.step} labels={[c.cart, c.shipping, c.summary]} />
      <CheckoutNotice notice={ck.notification} dismissLabel={t.ordering.dismiss} onDismiss={ck.dismissNotification} />
      {ck.step === 1 && <CartStep ck={ck} />}
      {ck.step === 2 && <ShippingStep ck={ck} />}
      {ck.step === 3 && <SummaryStep ck={ck} />}
      <CheckoutFooterBar ck={ck} />
      <TermsModal open={ck.termsOpen} onClose={ck.closeTerms} initialExpandedSection={ck.termsSection} lang={ck.lang} />
    </div>
  );
}
