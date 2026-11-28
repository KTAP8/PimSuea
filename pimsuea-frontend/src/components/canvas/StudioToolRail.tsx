import { ImageIcon, Layers, Loader2, SlidersHorizontal, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import type { StudioPanel } from '@/hooks/useStudioTools';
import { StudioToolButton } from './StudioToolButton';

type Props = {
  variant: 'rail' | 'tabs';
  active: StudioPanel | null;
  onToggle: (panel: StudioPanel) => void;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  layerCount: number;
};

/** Desktop: vertical rail. Mobile: bottom tabs (Upload opens the library, which has "Upload new"). */
export function StudioToolRail({ variant, active, onToggle, isUploading, onUpload, layerCount }: Props) {
  const { t } = useLanguage();
  const s = t.studio;
  const tool = (panel: StudioPanel, icon: React.ReactNode, label: string, badge?: number) => (
    <StudioToolButton key={panel} icon={icon} label={label} badge={badge} compact={variant === 'tabs'}
      active={active === panel} onClick={() => onToggle(panel)} />
  );

  if (variant === 'rail') {
    return (
      <aside className="hidden md:flex md:w-24 md:flex-col md:items-center md:py-6 md:gap-5 md:shrink-0 md:border-r md:border-gray-100 md:bg-white">
        <label className={cn('flex flex-col items-center justify-center gap-0.5 cursor-pointer text-gray-600', isUploading && 'opacity-60 pointer-events-none')}>
          <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 hover:bg-gray-100">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Upload className="w-5 h-5" />}
          </span>
          <span className="text-[10px] font-semibold">{s.upload}</span>
          <input type="file" className="hidden" accept="image/*" onChange={onUpload} disabled={isUploading} />
        </label>
        {tool('library', <ImageIcon className="w-5 h-5" />, s.library)}
        <div className="w-10 h-px bg-gray-100" />
        {tool('layers', <Layers className="w-5 h-5" />, s.layers, layerCount)}
      </aside>
    );
  }

  return (
    <nav className="md:hidden shrink-0 w-full bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)] grid grid-cols-3 items-center pt-2 pb-safe-bar px-safe border-t border-gray-100 z-30">
      {tool('library', <ImageIcon className="w-5 h-5" />, s.upload)}
      {tool('layers', <Layers className="w-5 h-5" />, s.layers, layerCount)}
      {tool('price', <SlidersHorizontal className="w-5 h-5" />, s.price)}
    </nav>
  );
}
