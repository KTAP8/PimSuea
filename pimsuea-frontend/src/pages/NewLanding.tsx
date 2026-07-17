import { useState, useEffect, useRef, createContext, useContext } from "react";
import { PageSEO } from "@/components/PageSEO";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { getProducts } from "@/services/api";
import type { Product } from "@/types/api";
import {
  MousePointer2, Type, Image as ImageIcon, Layers,
  Upload, ArrowRight, Package, Zap, Truck, Loader2, Globe,
  ShieldCheck, Clock, Scissors, Activity, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintMethodBadges } from "@/components/catalog/PrintMethodBadges";
import { type Language, translations } from "@/translations/landing";

const LandingLangContext = createContext<{ lang: Language; t: typeof translations['en']; setLang: (l: Language) => void }>({
  lang: 'en',
  t: translations.en,
  setLang: () => {}
});

function useLandingLang() {
  return useContext(LandingLangContext);
}

// ─── Canvas Hero Mockup ───────────────────────────────────────────────────

function CanvasHeroGraphic() {
  const { t } = useLandingLang();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative w-full max-w-lg mx-auto"
    >
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[80px] rounded-full -z-10" />

      {/* Window chrome */}
      <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card">
        <div className="h-10 border-b border-border bg-secondary/50 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="h-5 bg-background border border-border rounded-full w-44 text-[10px] text-muted-foreground flex items-center justify-center">
              pimsuea.com/design
            </div>
          </div>
        </div>

        {/* Editor body */}
        <div className="flex h-72">
          {/* Toolbar */}
          <div className="w-14 border-r border-border bg-secondary/20 flex flex-col items-center py-4 gap-3 shrink-0">
            {[
              { Icon: MousePointer2, active: true },
              { Icon: Type, active: false },
              { Icon: ImageIcon, active: false },
              { Icon: Layers, active: false },
            ].map(({ Icon, active }, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div className="flex-1 relative flex items-center justify-center bg-background">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
                backgroundSize: "16px 16px",
              }}
            />

            {/* T-shirt */}
            <div className="relative text-border z-10">
              <svg
                width="200"
                height="240"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
              </svg>

              {/* Design element */}
              <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: -8 }}
                transition={{ delay: 1, duration: 0.5, type: "spring", stiffness: 200 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] border border-primary border-dashed bg-primary/5 flex items-center justify-center"
              >
                <span className="font-heavy text-[11px] text-primary tracking-widest uppercase">PimSuea</span>
                {/* Handles */}
                {["-top-1.5 -left-1.5", "-top-1.5 -right-1.5", "-bottom-1.5 -left-1.5", "-bottom-1.5 -right-1.5"].map((pos) => (
                  <div key={pos} className={`absolute ${pos} w-2.5 h-2.5 bg-background border border-primary`} />
                ))}
              </motion.div>
            </div>
          </div>

          {/* Properties panel */}
          <div className="w-36 border-l border-border bg-secondary/10 hidden sm:flex flex-col py-4 px-4 gap-4 shrink-0">
            <div>
              <div className="h-1.5 w-14 bg-muted-foreground/20 rounded-full mb-3" />
              <div className="grid grid-cols-2 gap-1.5">
                <div className="aspect-square bg-foreground rounded border border-border" />
                <div className="aspect-square bg-background rounded border border-border" />
                <div className="aspect-square bg-primary rounded border border-border" />
                <div className="aspect-square bg-muted rounded border border-border" />
              </div>
            </div>
            <div>
              <div className="h-1.5 w-20 bg-muted-foreground/20 rounded-full mb-3" />
              <div className="space-y-1.5">
                <div className="h-7 bg-secondary rounded" />
                <div className="h-7 bg-secondary rounded" />
              </div>
            </div>
            <div className="mt-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="h-8 bg-action/20 text-action rounded flex items-center justify-center font-bold text-xs uppercase tracking-wider"
              >
                ฿132 / pc
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute -right-4 top-1/4 bg-card border border-border shadow-xl rounded-lg px-3 py-2 flex items-center gap-2 hidden md:flex"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-bold">฿132 / piece</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute -left-4 bottom-1/4 bg-card border border-border shadow-xl rounded-lg px-3 py-2 flex items-center gap-2 hidden md:flex"
      >
        <Zap className="w-4 h-4 text-action" />
        <span className="text-sm font-bold">{t.instantPreview}</span>
      </motion.div>
    </motion.div>
  );
}

// ─── Step Visuals ─────────────────────────────────────────────────────────

function StepVisual1() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { t } = useLandingLang();

  return (
    <div
      ref={ref}
      className="w-full max-w-xs mx-auto aspect-square rounded-2xl border border-border bg-secondary/20 flex items-center justify-center relative overflow-hidden"
    >
      {/* Drop zone */}
      <div className="w-40 h-40 border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center gap-2">
        <Upload className="w-8 h-8 text-primary/30" />
        <p className="text-[11px] text-muted-foreground">{t.dropYourFile}</p>
      </div>

      {/* Floating file card animating down */}
      <motion.div
        initial={{ y: -100, opacity: 0, rotate: -4 }}
        animate={isInView ? { y: 0, opacity: 1, rotate: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.7, type: "spring", stiffness: 100 }}
        className="absolute top-6 left-1/2 -translate-x-1/2 bg-card border border-border shadow-lg rounded-xl px-4 py-3 flex items-center gap-3"
      >
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
          <ImageIcon className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="font-bold text-sm">logo.png</p>
          <p className="text-[10px] text-muted-foreground">2.4 MB</p>
        </div>
      </motion.div>
    </div>
  );
}

function StepVisual2() {
  const { t } = useLandingLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const target = 132;
    const duration = 1200;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView]);

  return (
    <div ref={ref} className="w-full max-w-xs mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">{t.instantPricingTitle}</p>
            <p className="text-xs text-muted-foreground">{t.instantPricingSub}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {[
            [t.canvasGarment, "฿110"],
            [t.canvasPrintTier, "฿22"],
          ].map(([label, price]) => (
            <div key={label} className="flex justify-between text-muted-foreground">
              <span>{label}</span>
              <span>{price}</span>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-border flex justify-between items-center">
          <span className="font-bold">{t.totalPerPiece}</span>
          <span className="font-black text-3xl text-action">฿{count}</span>
        </div>
      </div>
    </div>
  );
}

function StepVisual3() {
  const { t } = useLandingLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stages = [
    { label: t.stage1, done: true },
    { label: t.stage2, done: true },
    { label: t.stage3, done: true },
    { label: t.stage4, done: false, highlight: true },
  ];

  return (
    <div ref={ref} className="w-full max-w-xs mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Package className="w-7 h-7 text-primary" />
        </div>
        <div className="space-y-3">
          {stages.map(({ label, highlight }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -16 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.15 * i }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  highlight ? "bg-action" : "bg-primary"
                }`}
              >
                {highlight ? (
                  <Truck className="w-3.5 h-3.5 text-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span
                className={`text-sm ${highlight ? "font-bold text-action" : "text-muted-foreground"}`}
              >
                {label}
              </span>
              {highlight && (
                <span className="ml-auto text-[10px] bg-action/10 text-action px-2 py-0.5 rounded-full font-medium">
                  {t.daysLeft}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── How It Works (sticky scroll) ─────────────────────────────────────────

function HowItWorksSection() {
  const { t } = useLandingLang();
  const [activeStep, setActiveStep] = useState(0);

  const HOW_IT_WORKS_STEPS = [
    {
      number: "01",
      title: t.how1Title,
      body: t.how1Body,
    },
    {
      number: "02",
      title: t.how2Title,
      body: t.how2Body,
    },
    {
      number: "03",
      title: t.how3Title,
      body: t.how3Body,
    },
  ];

  const refs = [useRef(null), useRef(null), useRef(null)];
  const inViews = refs.map((ref) => useInView(ref, { amount: 0.6 })); // eslint-disable-line react-hooks/rules-of-hooks

  useEffect(() => {
    if (inViews[2]) setActiveStep(2);
    else if (inViews[1]) setActiveStep(1);
    else if (inViews[0]) setActiveStep(0);
  }, [inViews[0], inViews[1], inViews[2]]); // eslint-disable-line react-hooks/exhaustive-deps

  const visuals = [<StepVisual1 />, <StepVisual2 />, <StepVisual3 />];

  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="font-black text-4xl md:text-5xl mb-16 text-center">{t.howItWorksTitle}</h2>

        {/* Desktop: sticky text left + scrolling visuals right */}
        <div className="hidden md:grid md:grid-cols-2 relative">
          {/* Sticky text */}
          <div className="sticky top-24 self-start h-[calc(100vh-6rem)] flex items-center pr-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <span className="font-black text-8xl text-border leading-none block">
                  {HOW_IT_WORKS_STEPS[activeStep].number}
                </span>
                <h3 className="font-black text-3xl mt-4 leading-tight">
                  {HOW_IT_WORKS_STEPS[activeStep].title}
                </h3>
                <p className="font-light text-lg text-muted-foreground mt-4 leading-relaxed">
                  {HOW_IT_WORKS_STEPS[activeStep].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Scrolling visuals */}
          <div>
            {visuals.map((visual, i) => (
              <div
                key={i}
                ref={refs[i]}
                className="h-screen flex items-center justify-center"
              >
                {visual}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: stacked cards */}
        <div className="md:hidden space-y-16">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <div key={i} className="space-y-6">
              {visuals[i]}
              <div className="text-center">
                <span className="font-black text-6xl text-border block">{step.number}</span>
                <h3 className="font-black text-2xl mt-2">{step.title}</h3>
                <p className="font-light text-muted-foreground mt-2 max-w-xs mx-auto">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────

function FAQSection() {
  const { t } = useLandingLang();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: t.faqQ1, a: t.faqA1 },
    { q: t.faqQ2, a: t.faqA2 },
    { q: t.faqQ3, a: t.faqA3 },
    { q: t.faqQ4, a: t.faqA4 },
    { q: t.faqQ5, a: t.faqA5 },
    { q: t.faqQ6, a: t.faqA6 },
  ];

  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-4xl md:text-5xl mb-4">{t.faqTitle}</h2>
          <p className="text-muted-foreground font-light text-lg">{t.faqSubtitle}</p>
        </div>
        <div className="divide-y divide-border">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-base md:text-lg leading-snug">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-muted-foreground font-light leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Who We Are ───────────────────────────────────────────────────────────

function WhoWeAreSection() {
  const { lang } = useLandingLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const isEn = lang === 'en';

  return (
    <section className="border-t border-border bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — 2 Photos placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative order-last lg:order-first w-full max-w-lg mx-auto lg:mx-0"
          >
            <div className="grid grid-cols-3 gap-3 sm:gap-4 relative z-10">

              {/* Photo 1 (shifted down - Haka) */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-foreground shadow-xl mt-8 md:mt-12 group">
                <img
                  src="/photos/Founder_Haka.jpg"
                  alt="Founder Haka"
                  className="absolute inset-0 w-full h-full object-cover object-[center_top] group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-3 left-3 right-3 z-10 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-bold text-xs sm:text-sm tracking-wide drop-shadow-md">Haka</p>
                  <p className="text-white/70 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-light mt-0.5">COO · CBO</p>
                </div>
              </div>

              {/* Photo 2 (center, no offset - Touch) */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-foreground shadow-xl group">
                <img
                  src="/photos/Founder_Touch.jpg"
                  alt="Founder Touch"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-3 left-3 right-3 z-10 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-bold text-xs sm:text-sm tracking-wide drop-shadow-md">Touch</p>
                  <p className="text-white/70 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-light mt-0.5">CEO · CTO</p>
                </div>
              </div>

              {/* Photo 3 (shifted down - Khaopan) */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-foreground shadow-xl mt-8 md:mt-12 group">
                <img
                  src="/photos/Founder_Khaopan.jpg"
                  alt="Founder Khaopan"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-3 left-3 right-3 z-10 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-bold text-xs sm:text-sm tracking-wide drop-shadow-md">Khaopan</p>
                  <p className="text-white/70 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-light mt-0.5">CMO</p>
                </div>
              </div>
            </div>

            {/* Location badge */}
            <div className="flex justify-center mt-6">
              <div className="bg-white/90 backdrop-blur-md border border-border/50 shadow-xl rounded-xl px-5 py-3 flex items-center gap-3 w-max">
                <div className="w-2.5 h-2.5 rounded-full bg-action animate-pulse shrink-0" />
                <span className="text-foreground text-sm font-semibold tracking-wide">Bangkok, Thailand</span>
              </div>
            </div>

            {/* Subtle shadow accent */}
            <div className="absolute -bottom-4 left-4 right-8 h-12 bg-foreground/5 blur-2xl rounded-full -z-10" />
          </motion.div>

          {/* Right — Narrative */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="space-y-8"
          >
            {/* Eyebrow */}
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
              Engineered in Bangkok
            </p>

            {/* Headline */}
            <div className="space-y-2">
              <h2 className="font-black text-4xl md:text-5xl leading-[1.2] md:leading-[1.15] tracking-tight py-2">
                {isEn ? (
                  <>Engineered for creators.<br /><span className="text-primary">Built from experience.</span></>
                ) : (
                  <>ออกแบบโดยครีเอเตอร์<br /><span className="text-primary">พัฒนาโดยวิศวกร</span></>
                )}
              </h2>
            </div>

            {/* Divider */}
            <div className="w-12 h-0.5 bg-primary" />

            {/* Body */}
            <div className="space-y-5 font-light text-lg text-muted-foreground leading-relaxed max-w-lg">
              {isEn ? (
                <>
                  <p>
                    PimSuea wasn't born in a boardroom. It started exactly where our users are:
                    trying to order custom team shirts and hitting a wall of minimums, slow LINE replies,
                    and unpredictable pricing.
                  </p>
                  <p>
                    As engineering students, we realized the problem wasn't
                    the printing—it was the infrastructure. We built PimSuea to replace the friction of
                    the traditional factory model with the precision of modern software.{" "}
                    <span className="font-medium text-foreground">No middlemen. No guessing. Just your design, engineered flawlessly.</span>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    PimSuea ไม่ได้เริ่มต้นจากโรงงานสกรีน แต่เริ่มจากความหงุดหงิดที่เราเจอเหมือนคุณ—
                    การต้องง้อขั้นต่ำ รอแอดมินตอบแชท และไม่เคยรู้ราคาที่แท้จริงจนกว่าจะตกลงสั่งทำ
                  </p>
                  <p>
                    ในฐานะนิสิตวิศวกรรมศาสตร์ เรามองเห็นว่าปัญหานี้แก้ได้ด้วยเทคโนโลยี
                    เราจึงสร้างแพลตฟอร์มที่เปลี่ยนความยุ่งยากทั้งหมดให้จบได้ในหน้าเว็บเดียว...
                    ลากวางลาย เห็นม็อคอัพจริง และคำนวณราคาเรียลไทม์
                  </p>
                  <p>
                    <span className="font-medium text-foreground">เราไม่ได้แค่ทำร้านสกรีนเสื้อ แต่เรากำลังสร้างโครงสร้างพื้นฐานใหม่ให้คนทำเสื้อทุกคน</span>
                  </p>
                </>
              )}
            </div>

            {/* Sign-off */}
            <div className="pt-4 border-t border-border space-y-1">
              <p className="font-bold text-base text-foreground">The PimSuea Team</p>
              <p className="text-sm text-muted-foreground font-light">
                Engineers by trade, creators by passion.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function NewLanding() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];
  const [scrolled, setScrolled] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  const scrollToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "PimSuea",
        "url": "https://pimsuea.com",
        "logo": "https://pimsuea.com/logo.svg",
        "description": "Print-on-demand t-shirt platform | แพลตฟอร์มสั่งพิมพ์เสื้อยืดออนไลน์",
        "sameAs": [],
      },
      {
        "@type": "WebSite",
        "name": "PimSuea",
        "url": "https://pimsuea.com",
      },
    ],
  };

  return (
    <LandingLangContext.Provider value={{ lang, t, setLang }}>
    <PageSEO
      title="PimSuea | สั่งพิมพ์เสื้อยืดออนไลน์ | Custom T-Shirt Printing Thailand"
      description="ออกแบบและสั่งพิมพ์เสื้อยืดออนไลน์ คุณภาพสูง จัดส่งทั่วไทย | Design and print custom t-shirts online. High quality DTG printing. Fast delivery across Thailand."
      canonical="https://pimsuea.com/"
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur border-b border-border shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/logo.svg" alt="PimSuea" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              <Globe className="w-4 h-4" />
              {lang === 'en' ? 'ไทย' : 'English'}
            </button>
            <Link to="/catalog">
              <Button className="bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-sm">
                {t.navStartDesigning} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-5xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <h1 className="font-black text-5xl md:text-6xl lg:text-7xl leading-[1.2] md:leading-[1.15] tracking-tight py-2">
              {t.heroTitle1}{" "}
              <span className="text-primary">{t.heroTitle2}</span>
            </h1>
            <p className="font-light text-xl text-muted-foreground leading-relaxed max-w-md">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/catalog">
                <Button
                  size="lg"
                  className="bg-action text-action-foreground hover:bg-action/90 font-bold uppercase tracking-wider text-base px-8"
                >
                  {t.heroStartDesigning} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a
                href="#catalog"
                onClick={scrollToCatalog}
                className="font-light text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              >
                {t.heroViewCatalog}
              </a>
            </div>
          </motion.div>

          {/* Graphic */}
          <div className="order-first lg:order-last">
            <CanvasHeroGraphic />
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── Painkillers Grid ─────────────────────────────────────────── */}
      <section className="py-24 border-t border-border bg-secondary/10">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-black text-4xl md:text-5xl mb-4">
            {t.builtDifferentTitle}
          </h2>
          <p className="font-light text-muted-foreground text-lg mb-16 max-w-lg">
            {t.builtDifferentSubtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: t.feature1Title,
                quote: t.feature1Quote,
                iconText: "01",
                icon: <Activity className="w-8 h-8 md:w-10 md:h-10 text-primary" />,
              },
              {
                title: t.feature2Title,
                quote: t.feature2Quote,
                iconText: "02",
                icon: <Clock className="w-8 h-8 md:w-10 md:h-10 text-primary" />,
              },
              {
                title: t.feature3Title,
                quote: t.feature3Quote,
                iconText: "03",
                icon: <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary" />,
              },
              {
                title: t.feature4Title,
                quote: t.feature4Quote,
                iconText: "04",
                icon: <Scissors className="w-8 h-8 md:w-10 md:h-10 text-primary" />,
              },
            ].map(({ title, quote, iconText, icon }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-10 transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5"
              >
                {/* Background Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Number Watermark */}
                <span className="absolute -bottom-6 -right-4 font-black text-8xl md:text-9xl text-muted/10 select-none group-hover:text-primary/5 transition-colors duration-500">
                  {iconText}
                </span>

                <div className="relative z-10">
                  <div className="mb-8 inline-flex items-center justify-center rounded-xl bg-secondary/30 p-4 ring-1 ring-border group-hover:bg-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                    {icon}
                  </div>
                  <h3 className="font-black text-2xl md:text-3xl mb-4 group-hover:text-primary transition-colors duration-300">{title}</h3>
                  <p className="font-light text-muted-foreground text-lg leading-relaxed max-w-sm">"{quote}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Catalog ───────────────────────────────────────────── */}
      <section id="catalog" className="py-24 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-black text-4xl md:text-5xl mb-4">{t.catalogTitle}</h2>
          <p className="font-light text-muted-foreground text-lg mb-12">
            {t.catalogSubtitle}
          </p>

          {loadingProducts ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground font-light text-center py-16">
              {t.catalogNoProducts}
            </p>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 flex-shrink-0 w-64 snap-start"
                >
                  <div className="aspect-square bg-secondary/20 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-24 h-24">
                          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base leading-tight">{product.name}</h3>
                    <PrintMethodBadges print_methods={product.print_methods} />
                    <p className="text-sm text-muted-foreground font-light">
                      {t.catalogStartingAt}{" "}
                      <span className="font-bold text-foreground">
                        ฿{(product.starting_price ?? product.price).toLocaleString()}
                      </span>
                    </p>
                    <Link to="/catalog" className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-primary text-primary hover:bg-primary/10 font-bold uppercase tracking-wider text-xs"
                      >
                        {t.catalogDesignShirt}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ── Who We Are ───────────────────────────────────────────────── */}
      <WhoWeAreSection />

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      <section className="bg-foreground text-background py-32 text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-8">
          <h2 className="font-black text-5xl md:text-6xl lg:text-7xl leading-tight">
            {t.footerTitle}
          </h2>
          <Link to="/catalog">
            <Button
              size="lg"
              className="bg-action text-action-foreground hover:bg-action/90 font-black uppercase tracking-widest text-base px-12 py-6 text-lg mt-4"
            >
              {t.footerEnterCanvas}
            </Button>
          </Link>
        </div>
        <p className="mt-16 text-background/30 text-sm font-light">
          © {new Date().getFullYear()} {t.footerCopyright}
        </p>
      </section>

    </div>
    </LandingLangContext.Provider>
  );
}
