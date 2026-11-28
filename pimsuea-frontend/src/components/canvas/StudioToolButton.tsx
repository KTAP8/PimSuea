import { cn } from '@/lib/utils';

type Props = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  compact?: boolean;
  onClick?: () => void;
};

/** One tool in the studio rail (desktop) or bottom tabs (mobile). */
export function StudioToolButton({ icon, label, active = false, badge, compact = false, onClick }: Props) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('relative flex flex-col items-center justify-center gap-0.5', compact && 'min-h-13', active ? 'text-primary' : 'text-gray-600')}>
      <span className={cn('relative flex items-center justify-center border transition-all',
        compact ? 'w-11 h-11 rounded-xl' : 'w-12 h-12 rounded-2xl',
        active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-50 border-transparent hover:bg-gray-100 active:bg-gray-100')}>
        {icon}
        {!!badge && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-white">{badge}</span>
        )}
      </span>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
