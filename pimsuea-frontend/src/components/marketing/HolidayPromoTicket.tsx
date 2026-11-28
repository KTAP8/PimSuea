import { useEffect, useRef, useState } from 'react';
import { Gift, X } from 'lucide-react';
import { useLandingLang } from '@/i18n/LanguageContext';
import { track, trackMeta } from '@/lib/analytics';
import { studioUrl } from '@/lib/site';
import { HOLIDAY_PROMO_COPY } from '@/content/holidayPromoCopy';
import { HOLIDAY_PROMO_CODE, hasSeenHolidayPopupThisSession, isHolidayPromoLive, markHolidayPopupSeen, writePromoCookie } from '@/lib/promoCode';

const SHOW_AFTER_MS = 8000;

/**
 * Non-blocking promo (replaces the 700 ms modal: 62 views, 0 clicks).
 * Appears after the visitor scrolls or 8 s, never covers the hero, links straight to the studio.
 * Renders only after mount — prerendered HTML must not depend on today's date.
 */
export function HolidayPromoTicket() {
  const { lang } = useLandingLang();
  const copy = HOLIDAY_PROMO_COPY[lang];
  const [visible, setVisible] = useState(false);
  const tracked = useRef(false);
  /** Stops the scroll/timer handlers from reopening after dismiss (they outlive setVisible(false)). */
  const suppressedRef = useRef(hasSeenHolidayPopupThisSession());
  const stopTriggersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isHolidayPromoLive() || suppressedRef.current) return;
    const show = () => {
      if (suppressedRef.current || hasSeenHolidayPopupThisSession()) return;
      setVisible(true);
    };
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.6) show();
    };
    const timer = window.setTimeout(show, SHOW_AFTER_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    const stop = () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
    stopTriggersRef.current = stop;
    return () => {
      stop();
      stopTriggersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!visible || tracked.current) return;
    tracked.current = true;
    track('promo_banner_shown', { campaign: HOLIDAY_PROMO_CODE, lang });
  }, [visible, lang]);

  if (!visible) return null;

  const dismiss = () => {
    suppressedRef.current = true;
    markHolidayPopupSeen();
    stopTriggersRef.current?.();
    stopTriggersRef.current = null;
    track('promo_banner_dismissed', { campaign: HOLIDAY_PROMO_CODE, lang });
    setVisible(false);
  };
  const go = () => {
    suppressedRef.current = true;
    markHolidayPopupSeen();
    stopTriggersRef.current?.();
    stopTriggersRef.current = null;
    writePromoCookie(HOLIDAY_PROMO_CODE);
    track('promo_banner_cta', { campaign: HOLIDAY_PROMO_CODE, lang, destination: 'studio' });
    trackMeta('Lead', { content_name: HOLIDAY_PROMO_CODE });
  };

  return (
    <aside role="complementary" aria-label={copy.eyebrow}
      className="fixed z-40 left-3 right-3 bottom-24 md:bottom-6 md:left-6 md:right-auto md:max-w-sm rounded-2xl border border-action/30 bg-background shadow-xl p-4 animate-in fade-in slide-in-from-bottom-4">
      <button type="button" onClick={dismiss} aria-label={copy.closeAria}
        className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-6">
        <span className="h-10 w-10 shrink-0 rounded-xl bg-action/15 text-action flex items-center justify-center"><Gift className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{copy.headline}</p>
          <p className="text-xs text-muted-foreground">{copy.terms}</p>
          <div className="mt-2 flex flex-col gap-2">
            <span className="w-fit rounded-md border border-dashed border-action px-2 py-1 font-mono text-sm font-bold tracking-wider">{HOLIDAY_PROMO_CODE}</span>
            <a href={`${studioUrl()}?coupon=${HOLIDAY_PROMO_CODE}`} onClick={go}
              className="inline-flex w-full items-center justify-center rounded-lg bg-action px-3 min-h-9 whitespace-nowrap text-sm font-bold text-action-foreground hover:bg-action/90">
              {copy.cta}
            </a>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{copy.autoApply}</p>
        </div>
      </div>
    </aside>
  );
}
