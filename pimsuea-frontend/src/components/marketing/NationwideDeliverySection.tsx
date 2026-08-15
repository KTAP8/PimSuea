import { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/site";
import { translations } from "@/translations/landing";

type LandingCopy = (typeof translations)["en"];

interface NationwideDeliverySectionProps {
  t: LandingCopy;
}

/** Decorative coverage dots on the Thailand map — not production hubs or ETA claims. */
const COVERAGE_POINTS = [
  { svgX: 135, svgY: 110 },
  { svgX: 375, svgY: 285 },
  { svgX: 226, svgY: 468 },
  { svgX: 260, svgY: 508 },
  { svgX: 68, svgY: 865 },
  { svgX: 220, svgY: 928 },
];

export function NationwideDeliverySection({
  t,
}: NationwideDeliverySectionProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [loadingMap, setLoadingMap] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetch("/website-assets/thailand.svg")
      .then((res) => res.text())
      .then((raw) => {
        if (!mounted) return;
        const cleaned = raw
          .replace(/<\?xml.*?\?>/gi, "")
          .replace(/<!--.*?-->/gi, "")
          .replace(/width="[^"]*"/gi, "")
          .replace(/height="[^"]*"/gi, "")
          .replace(
            /<svg/i,
            `<svg viewBox="0 0 559.57092 1024.7631" class="w-full h-full filter drop-shadow-sm pointer-events-auto"`
          );
        setSvgMarkup(cleaned);
        setLoadingMap(false);
      })
      .catch((err) => {
        console.error("Error loading thailand.svg:", err);
        setLoadingMap(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-20 md:py-28 border-t border-border bg-gradient-to-b from-secondary/15 via-background to-secondary/15 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-action/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Truck className="w-3.5 h-3.5 text-primary" />
            <span>{t.deliveryBadge}</span>
          </div>

          <h2 className="font-black text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground leading-[1.15]">
            {t.deliveryTitle}
          </h2>

          <p className="font-light text-muted-foreground text-base sm:text-lg mt-3">
            {t.deliverySubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-[360px] sm:max-w-[420px] lg:max-w-none aspect-[3/4.2] bg-card/90 backdrop-blur-md rounded-3xl border border-border/80 p-5 sm:p-7 shadow-lg shadow-primary/5 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

              {loadingMap && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-medium">Loading Map…</span>
                </div>
              )}

              <div className="relative w-full h-full flex items-center justify-center">
                <style>{`
                  .thailand-vector-map svg path {
                    fill: #08636D;
                    fill-opacity: 0.14;
                    stroke: #08636D;
                    stroke-opacity: 0.38;
                    stroke-width: 0.8px;
                    transition: all 0.3s ease;
                  }
                  .dark .thailand-vector-map svg path {
                    fill-opacity: 0.22;
                    stroke-opacity: 0.45;
                  }
                `}</style>

                {svgMarkup && (
                  <div
                    className="thailand-vector-map w-full h-full flex items-center justify-center select-none"
                    dangerouslySetInnerHTML={{ __html: svgMarkup }}
                  />
                )}

                <svg
                  viewBox="0 0 559.57092 1024.7631"
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  aria-hidden
                >
                  {COVERAGE_POINTS.map((point, i) => (
                    <g key={i}>
                      {/* Outer Pin Halo */}
                      <circle
                        cx={point.svgX}
                        cy={point.svgY}
                        r="10"
                        fill="#08636D"
                        fillOpacity="0.15"
                      />
                      {/* Pin Circle Body */}
                      <circle
                        cx={point.svgX}
                        cy={point.svgY}
                        r="6.5"
                        fill="#ffffff"
                        stroke="#08636D"
                        strokeWidth="2.5"
                        className="filter drop-shadow-sm"
                      />
                      {/* Center Point */}
                      <circle
                        cx={point.svgX}
                        cy={point.svgY}
                        r="2.8"
                        fill="#08636D"
                      />
                    </g>
                  ))}
                </svg>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-border/80 shadow-md z-20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary text-white shrink-0 shadow-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {t.deliveryMapBannerTitle}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t.deliveryMapBannerSub}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-13 h-13 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-2xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                      {t.deliveryStat1Value}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-primary">
                      {t.deliveryStat1Label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {t.deliveryStat1Desc}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md hover:border-action/30 transition-all duration-300 group">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-13 h-13 rounded-2xl bg-action/10 text-action flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-action group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                      {t.deliveryStat2Value}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-action">
                      {t.deliveryStat2Label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {t.deliveryStat2Desc}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                      {t.deliveryStat3Value}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-emerald-600">
                      {t.deliveryStat3Label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {t.deliveryStat3Desc}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <a href={appUrl("/catalog")} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-full font-bold uppercase tracking-wider text-xs px-8 py-5.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] cursor-pointer">
                  {t.heroStartDesigning}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>

              <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-primary shrink-0" />
                <span>{t.deliveryFootnote}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
