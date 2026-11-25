import { EXPAT_SEGMENTS_COPY } from '@/content/expatSegmentsCopy';
import type { Language } from '@/i18n/types';
import { cn } from '@/lib/utils';

/** Print shop vs overseas vs PimSuea. A table on desktop, stacked rows on mobile. */
export function CompareTable({ lang }: { lang: Language }) {
  const { compareTitle, compareCols, compareRows } = EXPAT_SEGMENTS_COPY[lang];
  const usIdx = compareCols.length - 1;

  return (
    <div>
      <h3 className="font-heavy text-3xl text-[#121212]">{compareTitle}</h3>

      <table className="hidden md:table mt-6 w-full text-sm">
        <thead>
          <tr>
            <th className="w-[22%]" />
            {compareCols.map((col, i) => (
              <th
                key={col}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left font-bold',
                  i === usIdx ? 'rounded-t-lg bg-primary text-white' : 'text-[#6C757D]',
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {compareRows.map((row, r) => (
            <tr key={row.label} className="border-t border-[#E9ECEF]">
              <th scope="row" className="py-3.5 pr-4 text-left font-semibold text-[#121212]">
                {row.label}
              </th>
              {row.values.map((v, i) => (
                <td
                  key={i}
                  className={cn(
                    'px-4 py-3.5',
                    i === usIdx ? 'bg-primary/[0.07] font-semibold text-[#121212]' : 'text-[#121212]/60',
                    i === usIdx && r === compareRows.length - 1 && 'rounded-b-lg',
                  )}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="md:hidden mt-6 space-y-3">
        {compareRows.map((row) => (
          <div key={row.label} className="rounded-lg border border-[#E9ECEF] bg-white p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-[#6C757D]">{row.label}</dt>
            <dd className="mt-2 space-y-1.5 text-sm">
              {row.values.map((v, i) => (
                <p key={i} className={cn('flex justify-between gap-3', i === usIdx ? 'font-semibold text-primary' : 'text-[#121212]/55')}>
                  <span>{compareCols[i]}</span>
                  <span className="text-right">{v}</span>
                </p>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
