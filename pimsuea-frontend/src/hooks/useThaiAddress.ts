import { useEffect, useMemo, useState } from 'react';

type District = [th: string, en: string, zips: string[]];
type Province = { th: string; en: string; d: District[] };

let cache: Promise<Province[]> | null = null;
const load = () => (cache ??= fetch('/data/thai-address.json').then((r) => r.json()).then((j) => j.provinces as Province[]).catch(() => { cache = null; return []; }));

/** "Chiang Mai (เชียงใหม่)" — readable for expats and for the courier. */
export const placeLabel = (en: string, th: string) => `${en} (${th})`;

const norm = (s: string) => s.trim().toLowerCase();
const matches = (value: string, en: string, th: string) => {
  const v = norm(value);
  return v === norm(en) || v === norm(th) || v === norm(placeLabel(en, th));
};

/** Province → district → postcode suggestions. Free text still works if a place isn't listed. */
export function useThaiAddress(province: string, district: string) {
  const [data, setData] = useState<Province[]>([]);
  useEffect(() => { void load().then(setData); }, []);

  const provinceMatch = useMemo(() => data.find((p) => matches(province, p.en, p.th)) ?? null, [data, province]);
  const districtMatch = useMemo(
    () => provinceMatch?.d.find(([th, en]) => matches(district, en, th)) ?? null,
    [provinceMatch, district],
  );

  return {
    provinceOptions: data.map((p) => placeLabel(p.en, p.th)),
    districtOptions: provinceMatch?.d.map(([th, en]) => placeLabel(en, th)) ?? [],
    postcodeOptions: districtMatch?.[2] ?? [],
    /** Canonical label when the typed value matches a known place (else the value unchanged). */
    canonicalProvince: (v: string) => {
      const p = data.find((x) => matches(v, x.en, x.th));
      return p ? placeLabel(p.en, p.th) : v;
    },
    canonicalDistrict: (v: string) => {
      const d = provinceMatch?.d.find(([th, en]) => matches(v, en, th));
      return d ? placeLabel(d[1], d[0]) : v;
    },
    singlePostcode: (districtValue: string): string | null => {
      const d = provinceMatch?.d.find(([th, en]) => matches(districtValue, en, th));
      return d && d[2].length === 1 ? d[2][0] : null;
    },
  };
}
