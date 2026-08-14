import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { appUrl } from "@/lib/site";
import { translations } from "@/translations/landing";

type LandingCopy = (typeof translations)["en"];

const INSPIRATION_IMAGES = [
  "/inspiration/ibc-tshirt-1.webp",
  "/inspiration/pimsuea-shirt.webp",
  "/inspiration/abg-shirt-1.webp",
  "/inspiration/issa-compass-sweater.webp",
  "/inspiration/abg-shirt-2.webp",
];

type InspirationShowcaseSectionProps = {
  t: LandingCopy;
};

export function InspirationShowcaseSection({
  t,
}: InspirationShowcaseSectionProps) {
  return (
    <section className="py-20 md:py-24 border-t border-border">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="font-black text-4xl md:text-5xl mb-4">
          {t.inspirationTitle}
        </h2>
        <p className="font-light text-muted-foreground text-lg mb-12 max-w-2xl">
          {t.inspirationSubtitle}
        </p>

        <div className="-mx-6">
          <InfiniteSlider gap={20} speed={35} speedOnHover={12}>
            {INSPIRATION_IMAGES.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                className="shrink-0 w-64 md:w-72 aspect-4/5 rounded-2xl object-cover"
              />
            ))}
          </InfiniteSlider>
        </div>

        <div className="mt-10">
          <a href={appUrl("/catalog")}>
            <Button
              variant="outline"
              className="rounded-full font-bold uppercase tracking-wider text-xs px-8 py-5 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
            >
              {t.inspirationCta}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
