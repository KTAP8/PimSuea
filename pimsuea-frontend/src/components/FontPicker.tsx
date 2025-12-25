import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Loader2, Check, ChevronDown } from 'lucide-react';
import WebFont from 'webfontloader';
import { fetchGoogleFonts } from '@/services/googleFonts';
import type { GoogleFont } from '@/types/font';
import { Button } from './ui/button';

interface FontPickerProps {
  currentFont: string;
  onFontSelect: (font: string) => void;
}

const ITEMS_PER_PAGE = 20;

export function FontPicker({ currentFont, onFontSelect }: FontPickerProps) {
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lazy Loading State
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const loadedPreviewFonts = useRef<Set<string>>(new Set(['sans-serif']));

  // 1. Fetch Fonts
  useEffect(() => {
    const loadFonts = async () => {
      const data = await fetchGoogleFonts();
      setFonts(data);
      setLoading(false);
    };
    loadFonts();
  }, []);

  // 2. Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Filter Logic
  const filteredFonts = useMemo(() => {
    if (!searchTerm) return fonts;
    return fonts.filter(f => f.family.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [fonts, searchTerm]);

  // Reset lazy load on search or open
  useEffect(() => {
      if (isOpen) {
          setVisibleCount(ITEMS_PER_PAGE);
          if (listRef.current) listRef.current.scrollTop = 0;
      }
  }, [isOpen, searchTerm]);

  // 4. Infinite Scroll Handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      // If we are near bottom (within 50px)
      if (scrollHeight - scrollTop - clientHeight < 50) {
          if (visibleCount < filteredFonts.length) {
              setVisibleCount(prev => Math.min(prev + 20, filteredFonts.length));
          }
      }
  };

  const visibleFonts = filteredFonts.slice(0, visibleCount);

  // 5. Load Previews for Visible Fonts
  useEffect(() => {
      if (!isOpen || visibleFonts.length === 0) return;

      const fontsToLoad = visibleFonts
          .map(f => f.family)
          .filter(f => !loadedPreviewFonts.current.has(f));

      if (fontsToLoad.length > 0) {
          // Batch load them
          // Note: Google Fonts API supports up to ~multiple families in one request, 
          // loading 20 at a time is acceptable.
          WebFont.load({
              google: {
                  families: fontsToLoad
              },
              active: () => {
                 // Mark as loaded effectively (React re-render not strictly needed if we rely on browser CSS engine)
                 // But we have a Ref tracking it.
              },
              // Allow silent failures for obscure fonts
          });

          // Update cache immediately to prevent spamming
          fontsToLoad.forEach(f => loadedPreviewFonts.current.add(f));
      }

  }, [isOpen, visibleFonts]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-48 justify-between font-normal"
      >
        <span className="truncate">{currentFont}</span>
        <ChevronDown className="w-4 h-4 opacity-50 ml-2" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
           {/* Search Input */}
           <div className="p-2 border-b bg-gray-50 shrink-0">
             <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Search fonts..."
                    className="w-full pl-8 pr-2 py-1 text-sm bg-white border rounded focus:outline-none focus:ring-1 focus:ring-black"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
             </div>
           </div>

           {/* Font List */}
           {loading ? (
             <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
             </div>
           ) : filteredFonts.length === 0 ? (
             <div className="h-48 flex items-center justify-center text-sm text-gray-500">
                No fonts found.
             </div>
           ) : (
             <div 
                ref={listRef}
                className="max-h-[300px] overflow-y-auto"
                onScroll={handleScroll}
             >
                {visibleFonts.map((font) => {
                     const isSelected = currentFont === font.family;
                     return (
                        <div 
                            key={font.family}
                            className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                            onClick={() => {
                                onFontSelect(font.family);
                                setIsOpen(false);
                            }}
                        >
                            <span className="truncate" style={{ fontFamily: font.family }}>{font.family}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                        </div>
                     );
                })}
                {/* Loader at bottom if more to load */}
                {visibleCount < filteredFonts.length && (
                    <div className="p-2 text-center text-xs text-gray-400">Loading more...</div>
                )}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
