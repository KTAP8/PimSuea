import { MapPin } from 'lucide-react';
import { CUSTOM_SHIRTS_THAILAND_COPY } from '@/content/customShirtsThailandCopy';
import { GEO } from '@/content/geoFacts';
import type { Language } from '@/i18n/types';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

/** thailand.svg geo bounds (from its mapsvg:geoViewBox): lon 97.3447–105.6400, lat 20.4634–5.6144. */
const BOUNDS = { west: 97.3447, east: 105.64, north: 20.4634, south: 5.6144 };

const CITY_COORDS: Record<string, [number, number]> = {
  Bangkok: [100.5, 13.75],
  'Chiang Mai': [98.99, 18.79],
  Phuket: [98.39, 7.88],
  Pattaya: [100.88, 12.93],
  'Hua Hin': [99.96, 12.57],
  'Koh Samui': [100.06, 9.51],
  'Koh Phangan': [100.03, 9.75],
};

const toPct = ([lon, lat]: [number, number]) => ({
  left: `${((lon - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100}%`,
  top: `${((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * 100}%`,
});

/** Map of Thailand with pulsing pins on the cities most expats live in. */
export function DeliveryMap({ lang }: { lang: Language }) {
  const copy = CUSTOM_SHIRTS_THAILAND_COPY[lang];

  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
        <Reveal>
          <SectionHeading title={copy.deliveryTitle} body={copy.deliveryBody} />
          <p className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-heavy text-5xl sm:text-6xl text-primary whitespace-nowrap">{copy.deliveryStat}</span>
            <span className="text-sm font-semibold text-[#121212]/60">{copy.deliveryStatLabel}</span>
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {GEO.location.cities.map((city) => (
              <li key={city} className="inline-flex items-center gap-1.5 rounded-full border border-[#E9ECEF] px-3 py-1.5 text-sm">
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                {city}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="relative mx-auto w-[46%] max-w-[220px] md:w-[60%]" style={{ aspectRatio: '559.57 / 1024.76' }}>
          <img
            src="/website-assets/thailand.svg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full opacity-30"
          />
          {GEO.location.cities.map((city, i) => {
            const coords = CITY_COORDS[city];
            if (!coords) return null;
            return (
              <span key={city} className="absolute -translate-x-1/2 -translate-y-1/2" style={toPct(coords)} title={city}>
                <span
                  className="absolute inset-0 rounded-full bg-primary/40 animate-ping motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 300}ms`, animationDuration: '2.4s' }}
                />
                <span className={`relative block rounded-full bg-primary ring-2 ring-white ${city === 'Bangkok' ? 'size-3.5' : 'size-2.5'}`} />
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
