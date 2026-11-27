import { useCountdown } from '@/hooks/useCountdown';
import type { HolidayPromoCopy } from '@/content/holidayPromoCopy';

interface Props {
  target: Date;
  copy: HolidayPromoCopy;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Live "ends in" strip with dd:hh:mm:ss tiles. */
export function PromoCountdown({ target, copy }: Props) {
  const { days, hours, minutes, seconds, done } = useCountdown(target);
  if (done) return null;

  const units = [
    { value: days, label: copy.unitDays },
    { value: hours, label: copy.unitHours },
    { value: minutes, label: copy.unitMinutes },
    { value: seconds, label: copy.unitSeconds },
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6C757D]">{copy.endsIn}</p>
      <div className="flex gap-1.5" role="timer" aria-live="off">
        {units.map((u) => (
          <div key={u.label} className="flex-1 rounded-md sm:w-11 sm:flex-none bg-[#121212] py-1 text-center">
            <span className="block font-black text-base leading-tight tabular-nums text-[#F8F9FA]">
              {pad(u.value)}
            </span>
            <span className="block text-[9px] font-medium uppercase tracking-wider text-[#F8F9FA]/60">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
