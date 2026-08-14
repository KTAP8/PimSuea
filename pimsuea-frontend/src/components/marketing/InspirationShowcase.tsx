import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Layers,
  Shirt,
  Flame,
  ShieldCheck,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { appUrl } from "@/lib/site";
import { translations } from "@/translations/landing";
import { cn } from "@/lib/utils";

type LandingCopy = (typeof translations)["en"];

/** Mirror active catalog blanks — keep in sync with Supabase `products.title` / `title_en`. */
const CATALOG_BLANKS = {
  classic: {
    productId: "0de86104-0582-4da2-84c5-f46a2878d122",
    titleEn: "DTG 100% cotton tshirt",
    titleTh: "เสื้อยืดสกรีนลงเนื้อผ้า",
  },
  boxy: {
    productId: "4e518b71-a23b-4841-aaea-d3fb924d999c",
    titleEn: "Oversized boxy heavyweight tee",
    titleTh: "เสื้อ oversized boxy heavyweight tee สกรีนลงเนื้อผ้า",
  },
} as const;

interface ShowcaseItem {
  id: string;
  src: string;
  category: "all" | "creator" | "club" | "brand";
  titleEn: string;
  titleTh: string;
  tagEn: string;
  tagTh: string;
  quantityEn: string;
  quantityTh: string;
  blankEn: string;
  blankTh: string;
  printSpecEn: string;
  printSpecTh: string;
  storyEn: string;
  storyTh: string;
  /** When set, modal CTA links to this catalog product. Omit if not orderable yet. */
  catalogProductId?: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "ibc-tshirt",
    src: "/inspiration/ibc-tshirt-1.webp",
    category: "club",
    titleEn: "IBC Basketball Club Tee",
    titleTh: "เสื้อทีมบาสเกตบอล IBC",
    tagEn: "Sports Club",
    tagTh: "ชมรมกีฬา",
    quantityEn: "100 pcs order",
    quantityTh: "สั่งผลิต 100 ตัว",
    blankEn: CATALOG_BLANKS.classic.titleEn,
    blankTh: CATALOG_BLANKS.classic.titleTh,
    printSpecEn: "DTG front chest + back",
    printSpecTh: "พิมพ์ DTG อกหน้า + หลัง",
    storyEn:
      `100-piece team order on our ${CATALOG_BLANKS.classic.titleEn} — front chest logo and a bold back print.`,
    storyTh:
      `ออเดอร์ทีม 100 ตัวบน${CATALOG_BLANKS.classic.titleTh} — โลโก้อกหน้าและลายหลังขนาดใหญ่`,
    catalogProductId: CATALOG_BLANKS.classic.productId,
  },
  {
    id: "pimsuea-studio",
    src: "/inspiration/pimsuea-shirt.webp",
    category: "creator",
    titleEn: "PimSuea Signature Tee",
    titleTh: "เสื้อสตูดิโอ PimSuea Signature",
    tagEn: "Studio Merch",
    tagTh: "เมิร์ชสตูดิโอ",
    quantityEn: "3 pcs order",
    quantityTh: "สั่งผลิต 3 ตัว",
    blankEn: CATALOG_BLANKS.classic.titleEn,
    blankTh: CATALOG_BLANKS.classic.titleTh,
    printSpecEn: "DTG front chest",
    printSpecTh: "พิมพ์ DTG อกหน้า",
    storyEn:
      `3-piece batch on our ${CATALOG_BLANKS.classic.titleEn} with a clean front-chest DTG print.`,
    storyTh:
      `ผลิต 3 ตัวบน${CATALOG_BLANKS.classic.titleTh} พิมพ์ DTG อกหน้าคมชัด`,
    catalogProductId: CATALOG_BLANKS.classic.productId,
  },
  {
    id: "abg-botanical",
    src: "/inspiration/abg-shirt-1.webp",
    category: "brand",
    titleEn: "ABG • #SamyanABG Collection",
    titleTh: "ABG • คอลเลกชัน #SamyanABG",
    tagEn: "#SamyanABG",
    tagTh: "#SamyanABG",
    quantityEn: "40 pcs order",
    quantityTh: "สั่งผลิต 40 ตัว",
    blankEn: CATALOG_BLANKS.boxy.titleEn,
    blankTh: CATALOG_BLANKS.boxy.titleTh,
    printSpecEn: "DTG front center graphic",
    printSpecTh: "พิมพ์ DTG ลายกราฟิกด้านหน้า",
    storyEn:
      `#SamyanABG drop on our ${CATALOG_BLANKS.boxy.titleEn} with a full-detail front DTG print.`,
    storyTh:
      `คอลเลกชัน #SamyanABG บน${CATALOG_BLANKS.boxy.titleTh} พิมพ์ DTG ด้านหน้าคมชัด`,
    catalogProductId: CATALOG_BLANKS.boxy.productId,
  },
  {
    id: "issa-sweater",
    src: "/inspiration/issa-compass-sweater.webp",
    category: "brand",
    titleEn: "Issa Compass Team Sweater",
    titleTh: "สเวตเตอร์ทีม Issa Compass",
    tagEn: "Special Request",
    tagTh: "สั่งทำพิเศษ",
    quantityEn: "20 pcs order",
    quantityTh: "สั่งผลิต 20 ตัว",
    blankEn: "Custom sweater (not in catalog yet)",
    blankTh: "สเวตเตอร์สั่งทำพิเศษ (ยังไม่เปิดในแคตตาล็อก)",
    printSpecEn: "Left chest DTG",
    printSpecTh: "พิมพ์ DTG อกซ้าย",
    storyEn:
      "Special order for Issa Compass — custom sweater blank with a minimal left-chest DTG print. Sweaters aren't in our catalog yet.",
    storyTh:
      "ออเดอร์พิเศษสำหรับ Issa Compass — สเวตเตอร์สั่งทำพร้อมพิมพ์ DTG อกซ้าย (ยังไม่เปิดจำหน่ายบนแคตตาล็อก)",
  },
  {
    id: "abg-oversize",
    src: "/inspiration/abg-shirt-2.webp",
    category: "brand",
    titleEn: "ABG • #SamyanABG Lookbook",
    titleTh: "ABG • Lookbook #SamyanABG",
    tagEn: "#SamyanABG",
    tagTh: "#SamyanABG",
    quantityEn: "40 pcs order",
    quantityTh: "สั่งผลิต 40 ตัว",
    blankEn: CATALOG_BLANKS.boxy.titleEn,
    blankTh: CATALOG_BLANKS.boxy.titleTh,
    printSpecEn: "DTG front typography",
    printSpecTh: "พิมพ์ DTG ตัวอักษรด้านหน้า",
    storyEn:
      `Lookbook shoot for #SamyanABG on our ${CATALOG_BLANKS.boxy.titleEn} with front DTG typography.`,
    storyTh:
      `ภาพ Lookbook #SamyanABG บน${CATALOG_BLANKS.boxy.titleTh} พิมพ์ DTG ตัวอักษรด้านหน้า`,
    catalogProductId: CATALOG_BLANKS.boxy.productId,
  },
];

type FilterKey = "all" | "creator" | "club" | "brand";

type InspirationShowcaseSectionProps = {
  t: LandingCopy;
};

export function InspirationShowcaseSection({
  t,
}: InspirationShowcaseSectionProps) {
  // Determine if Thai
  const isTh = t.inspirationTitle.includes("แรงบันดาลใจ");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredItems =
    activeFilter === "all"
      ? SHOWCASE_ITEMS
      : SHOWCASE_ITEMS.filter((item) => item.category === activeFilter);

  const filterTabs = [
    { key: "all" as FilterKey, label: t.inspirationFilterAll || "All Pieces" },
    {
      key: "creator" as FilterKey,
      label: t.inspirationFilterCreator || "Creator & Merch",
    },
    {
      key: "club" as FilterKey,
      label: t.inspirationFilterClub || "Clubs & Sports",
    },
    {
      key: "brand" as FilterKey,
      label: t.inspirationFilterBrand || "Streetwear & Teams",
    },
  ];

  // Scroll carousel
  const scrollTo = (direction: "prev" | "next") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector("div[data-card]")?.clientWidth || 320;
    const scrollAmount = cardWidth + 24; // width + gap
    
    if (direction === "next") {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  // Track active slide index on scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector("div[data-card]")?.clientWidth || 320;
    const index = Math.round(container.scrollLeft / (cardWidth + 24));
    setCurrentIndex(Math.max(0, Math.min(index, filteredItems.length - 1)));
  };

  useEffect(() => {
    setCurrentIndex(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [activeFilter]);

  return (
    <section className="py-20 md:py-28 border-t border-border bg-gradient-to-b from-background via-secondary/15 to-background relative overflow-hidden">
      {/* Decorative ambient subtle background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-action/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <h2 className="font-black text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground">
              {t.inspirationTitle}
            </h2>

            <p className="font-light text-muted-foreground text-base sm:text-lg mt-2 max-w-xl">
              {t.inspirationSubtitle}
            </p>
          </div>

          {/* Action and Navigation button group */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <a href={appUrl("/catalog")}>
              <Button
                variant="default"
                className="rounded-full font-bold uppercase tracking-wider text-xs px-6 py-5 bg-action hover:bg-action/90 text-action-foreground shadow-lg shadow-action/20 transition-all duration-300 hover:scale-[1.02]"
              >
                {t.inspirationCta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>

            {/* Desktop Navigation buttons */}
            <div className="hidden sm:flex items-center gap-2 pl-2">
              <button
                onClick={() => scrollTo("prev")}
                disabled={currentIndex === 0}
                aria-label="Previous image"
                className="w-10 h-10 rounded-full border border-border bg-card/80 backdrop-blur-sm text-foreground flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollTo("next")}
                disabled={currentIndex >= filteredItems.length - 1}
                aria-label="Next image"
                className="w-10 h-10 rounded-full border border-border bg-card/80 backdrop-blur-sm text-foreground flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-3 mb-8 no-scrollbar scroll-smooth">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  "relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer select-none",
                  isActive
                    ? "text-white shadow-md shadow-primary/20"
                    : "text-foreground/80 hover:text-foreground bg-card hover:bg-secondary/70 border border-border shadow-2xs"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-showcase-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Carousel / Card List */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory py-2 pb-6 px-1 no-scrollbar -mx-4 sm:-mx-6 px-4 sm:px-6"
          style={{ scrollbarWidth: "none" }}
        >
          {filteredItems.map((item, idx) => {
            const title = isTh ? item.titleTh : item.titleEn;
            const tag = isTh ? item.tagTh : item.tagEn;
            const qty = isTh ? item.quantityTh : item.quantityEn;
            const blank = isTh ? item.blankTh : item.blankEn;

            return (
              <div
                key={item.id}
                data-card
                onClick={() => setSelectedItem(item)}
                className="group relative shrink-0 w-[280px] sm:w-[320px] md:w-[360px] aspect-[3/4] rounded-3xl overflow-hidden snap-start cursor-pointer border border-border/80 bg-card shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5"
              >
                {/* Background Image with smooth zoom on hover */}
                <img
                  src={item.src}
                  alt={title}
                  loading={idx < 2 ? "eager" : "lazy"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Top Floating Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xs">
                    {tag}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-primary/90 backdrop-blur-md text-primary-foreground shadow-xs">
                    {qty}
                  </span>
                </div>

                {/* Bottom Card Glass Overlay */}
                <div className="absolute inset-x-0 bottom-0 pt-20 pb-5 px-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end text-white z-10">
                  <h3 className="font-bold text-lg sm:text-xl text-white drop-shadow-sm line-clamp-1 group-hover:text-action-foreground transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-white/80 font-light mt-1 line-clamp-1">
                    {blank}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/15">
                    <span className="text-[11px] font-medium text-white/90 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-action" />
                      {isTh ? item.printSpecTh : item.printSpecEn}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/95 group-hover:text-action transition-colors">
                      <ZoomIn className="w-3.5 h-3.5" />
                      {t.inspirationViewDetails || "Inspect"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Indicators & Trust Pills */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {filteredItems.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!scrollContainerRef.current) return;
                  const container = scrollContainerRef.current;
                  const cardWidth =
                    container.querySelector("div[data-card]")?.clientWidth || 320;
                  container.scrollTo({
                    left: i * (cardWidth + 24),
                    behavior: "smooth",
                  });
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  currentIndex === i
                    ? "w-7 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Quick Quality Assurance Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              {isTh ? "ไม่มีขั้นต่ำ สั่ง 1 ตัวก็พิมพ์" : "Zero Minimums (1 pc+)"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {isTh ? "รับประกันพิมพ์ใหม่ฟรี" : "Free Reprint Guarantee"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5 text-primary" />
              {isTh ? "ผ้าฝ้ายเกรดพรีเมียม" : "Premium Curated Blanks"}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Detail Lightbox Dialog */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent
          className={cn(
            "gap-0 p-0 overflow-hidden border-border bg-card",
            "w-[calc(100%-1rem)] max-w-3xl rounded-2xl sm:rounded-3xl",
            "max-h-[92dvh] flex flex-col",
            "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:max-h-[90dvh]",
          )}
        >
          {selectedItem && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Photo */}
                  <div className="relative aspect-[4/3] max-h-[42dvh] sm:aspect-[4/5] sm:max-h-[50vh] md:aspect-auto md:max-h-none md:min-h-full bg-secondary/50 overflow-hidden shrink-0">
                    <img
                      src={selectedItem.src}
                      alt={isTh ? selectedItem.titleTh : selectedItem.titleEn}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute top-3 left-3 right-12 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/70 backdrop-blur-md text-white border border-white/20">
                        {isTh ? selectedItem.tagTh : selectedItem.tagEn}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-primary-foreground">
                        {isTh ? selectedItem.quantityTh : selectedItem.quantityEn}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 sm:p-6 md:p-8">
                    <DialogHeader className="p-0 text-left">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        {isTh ? "ผลงานสั่งผลิตจริง" : "Real Customer Production"}
                      </div>
                      <DialogTitle className="text-xl sm:text-2xl font-black text-foreground pr-6">
                        {isTh ? selectedItem.titleTh : selectedItem.titleEn}
                      </DialogTitle>
                      <DialogDescription className="text-sm font-light text-muted-foreground mt-2 leading-relaxed">
                        {isTh ? selectedItem.storyTh : selectedItem.storyEn}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mt-5 sm:mt-6 space-y-3 bg-secondary/30 rounded-2xl p-3.5 sm:p-4 border border-border/60">
                      <div className="flex items-start gap-3">
                        <Layers className="w-4 h-4 text-action shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t.inspirationTech || "Print Technique"}
                          </div>
                          <div className="text-sm font-medium text-foreground">
                            {isTh
                              ? selectedItem.printSpecTh
                              : selectedItem.printSpecEn}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 pt-2 border-t border-border/50">
                        <Shirt className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t.inspirationBlank || "Garment Blank"}
                          </div>
                          <div className="text-sm font-medium text-foreground break-words">
                            {isTh ? selectedItem.blankTh : selectedItem.blankEn}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 pt-2 border-t border-border/50">
                        <Flame className="w-4 h-4 text-action shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t.inspirationOrderSize || "Order Quantity"}
                          </div>
                          <div className="text-sm font-medium text-foreground">
                            {isTh
                              ? selectedItem.quantityTh
                              : selectedItem.quantityEn}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky CTA — always reachable on mobile */}
              <div className="shrink-0 border-t border-border bg-card p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {selectedItem.catalogProductId ? (
                  <a
                    href={appUrl(`/product/${selectedItem.catalogProductId}`)}
                    className="block"
                    onClick={() => setSelectedItem(null)}
                  >
                    <Button className="w-full rounded-full font-bold uppercase tracking-wider text-xs py-5 bg-action hover:bg-action/90 text-action-foreground shadow-md shadow-action/20">
                      {t.inspirationDesignSimilar || "Customize this style"}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </a>
                ) : (
                  <Button
                    disabled
                    className="w-full rounded-full font-bold uppercase tracking-wider text-xs py-5 opacity-60 cursor-not-allowed"
                  >
                    {t.inspirationNotAvailableYet || "Not available yet"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
