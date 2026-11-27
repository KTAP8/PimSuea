import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { useLandingLang } from '@/i18n/LanguageContext';
import { usePrefersReducedMotionAfterMount } from '@/hooks/usePrefersReducedMotionAfterMount';
import { track, trackMeta } from '@/lib/analytics';
import { appUrl } from '@/lib/site';
import { stripLangPrefix } from '@/content/marketingRoutes';
import { HOLIDAY_PROMO_COPY } from '@/content/holidayPromoCopy';
import {
  HOLIDAY_PROMO_CODE,
  HOLIDAY_PROMO_EXPIRES_AT,
  hasSeenHolidayPopupThisSession,
  isHolidayPromoLive,
  markHolidayPopupSeen,
  writePromoCookie,
} from '@/lib/promoCode';
import { HolidayPromoHero } from './holiday-promo/HolidayPromoHero';
import { PromoCodeTicket } from './holiday-promo/PromoCodeTicket';
import { PromoCountdown } from './holiday-promo/PromoCountdown';

const OPEN_DELAY_MS = 700;

type DismissMethod = 'close' | 'overlay' | 'escape';

function analyticsPage(pathname: string): '/' | '/custom-shirts-thailand' {
  const base = stripLangPrefix(pathname);
  return base.startsWith('/custom-shirts-thailand') ? '/custom-shirts-thailand' : '/';
}

export function HolidayPromoPopup() {
  const { lang } = useLandingLang();
  const copy = HOLIDAY_PROMO_COPY[lang];
  const reducedMotion = usePrefersReducedMotionAfterMount();
  const [open, setOpen] = useState(false);
  const shownTracked = useRef(false);
  const ctaClicked = useRef(false);
  const dismissTracked = useRef(false);
  const dismissMethod = useRef<DismissMethod>('close');

  useEffect(() => {
    if (!isHolidayPromoLive() || hasSeenHolidayPopupThisSession()) return;
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open || shownTracked.current) return;
    shownTracked.current = true;
    track('promo_popup_shown', {
      campaign: HOLIDAY_PROMO_CODE,
      page: analyticsPage(window.location.pathname),
      lang,
    });
  }, [open, lang]);

  const finishDismiss = (method: DismissMethod) => {
    markHolidayPopupSeen();
    if (!ctaClicked.current && !dismissTracked.current) {
      dismissTracked.current = true;
      track('promo_popup_dismissed', {
        campaign: HOLIDAY_PROMO_CODE,
        page: analyticsPage(window.location.pathname),
        lang,
        method,
      });
    }
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setOpen(true);
      return;
    }
    finishDismiss(dismissMethod.current);
  };

  const handleCta = async () => {
    ctaClicked.current = true;
    markHolidayPopupSeen();
    writePromoCookie(HOLIDAY_PROMO_CODE);
    track('promo_popup_cta', {
      campaign: HOLIDAY_PROMO_CODE,
      page: analyticsPage(window.location.pathname),
      lang,
      destination: 'catalog',
    });
    trackMeta('Lead', { content_name: HOLIDAY_PROMO_CODE });
    try {
      await navigator.clipboard.writeText(HOLIDAY_PROMO_CODE);
    } catch {
      /* still navigate */
    }
    window.location.href = appUrl(`/catalog?coupon=${HOLIDAY_PROMO_CODE}`);
  };

  const instant = reducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className="bg-[#121212]/80 data-[state=open]:animate-none data-[state=closed]:animate-none"
          onClick={() => {
            dismissMethod.current = 'overlay';
          }}
        />
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Content
              onEscapeKeyDown={() => {
                dismissMethod.current = 'escape';
              }}
              onPointerDownOutside={() => {
                dismissMethod.current = 'overlay';
              }}
              className="fixed top-[50%] left-[50%] z-50 w-[calc(100%-32px)] max-w-[26rem] translate-x-[-50%] translate-y-[-50%] outline-none"
            >
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.9, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
                transition={instant}
                className="relative overflow-hidden rounded-xl bg-[#F8F9FA] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
              >
                <DialogTitle className="sr-only">{copy.headline}</DialogTitle>
                <DialogDescription className="sr-only">{copy.terms}</DialogDescription>

                <HolidayPromoHero copy={copy} reducedMotion={reducedMotion} />

                <button
                  type="button"
                  onClick={() => {
                    dismissMethod.current = 'close';
                    finishDismiss('close');
                  }}
                  className="absolute top-3 right-3 z-10 rounded-full bg-[#F8F9FA]/10 p-2 text-[#F8F9FA] transition-colors hover:bg-[#F8F9FA]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8F9FA]"
                  aria-label={copy.closeAria}
                >
                  <X className="size-4" strokeWidth={2} />
                </button>

                <div className="space-y-4 px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-8">
                  <PromoCodeTicket
                    code={HOLIDAY_PROMO_CODE}
                    label={copy.codeLabel}
                    tapToCopy={copy.tapToCopy}
                    copied={copy.copied}
                  />

                  <PromoCountdown target={HOLIDAY_PROMO_EXPIRES_AT} copy={copy} />

                  <div>
                    <Button
                      type="button"
                      onClick={handleCta}
                      className="btn-shine btn-glow group h-14 w-full rounded-lg bg-action text-action-foreground hover:bg-[#E04E1B] font-bold uppercase tracking-wider text-sm transition-transform active:scale-[0.98]"
                    >
                      <span className="relative z-[2] flex items-center gap-2">
                        {copy.cta}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                      </span>
                    </Button>
                    <p className="mt-2 text-center text-xs font-medium text-[#08636D]">{copy.autoApply}</p>
                  </div>

                  <p className="text-center text-[11px] leading-relaxed text-[#6C757D]">{copy.terms}</p>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          )}
        </AnimatePresence>
      </DialogPortal>
    </Dialog>
  );
}
