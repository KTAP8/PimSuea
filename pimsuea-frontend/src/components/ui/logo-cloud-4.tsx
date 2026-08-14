import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  scale?: number;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos: Logo[];
};

export function LogoCloud({ logos }: LogoCloudProps) {
  return (
    <div className="relative w-full py-4 md:py-6">
      <InfiniteSlider gap={32} reverse speed={60} speedOnHover={20}>
        {logos.map((logo) => (
          <div
            key={`logo-${logo.alt}`}
            className="flex h-8 w-24 shrink-0 items-center justify-center md:h-14 md:w-40"
          >
            <img
              alt={logo.alt}
              className="max-h-[88%] max-w-[92%] select-none object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.14)]"
              loading="eager"
              src={logo.src}
              style={logo.scale ? { transform: `scale(${logo.scale})` } : undefined}
            />
          </div>
        ))}
      </InfiniteSlider>

      <ProgressiveBlur
        blurIntensity={1}
        className="pointer-events-none absolute top-0 left-0 h-full w-16 md:w-40"
        direction="left"
      />
      <ProgressiveBlur
        blurIntensity={1}
        className="pointer-events-none absolute top-0 right-0 h-full w-16 md:w-40"
        direction="right"
      />
    </div>
  );
}
