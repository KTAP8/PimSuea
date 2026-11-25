import { useEffect, useState } from 'react';

/**
 * True once the element `heroId` has scrolled above the viewport, and false again
 * while the element `hideWhenVisibleId` (e.g. the closing CTA) is on screen.
 */
export function useShowAfterHero(heroId: string, hideWhenVisibleId?: string) {
  const [pastHero, setPastHero] = useState(false);
  const [endVisible, setEndVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const hero = document.getElementById(heroId);
    const end = hideWhenVisibleId ? document.getElementById(hideWhenVisibleId) : null;

    const heroObserver = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    const endObserver = new IntersectionObserver(([entry]) => setEndVisible(entry.isIntersecting));

    if (hero) heroObserver.observe(hero);
    if (end) endObserver.observe(end);
    return () => {
      heroObserver.disconnect();
      endObserver.disconnect();
    };
  }, [heroId, hideWhenVisibleId]);

  return pastHero && !endVisible;
}
