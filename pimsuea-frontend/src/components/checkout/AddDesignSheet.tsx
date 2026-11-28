import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPreviewDisplayUrl } from '@/lib/previews';
import type { Checkout } from '@/hooks/useCheckout';

/** "Add more" — pick another saved design into the cart. */
export function AddDesignSheet({ ck }: { ck: Checkout }) {
  const { c, isAddOpen, setIsAddOpen, loadingDesigns, myDesigns, addingDesignId, addToCart } = ck;
  return (
    <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-200 text-gray-700 font-bold hover:bg-gray-50">
          <Plus className="w-5 h-5 mr-2" /> {c.addMore}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] sm:w-100 md:w-135 bg-gray-50 border-l border-gray-100 pt-12 shadow-2xl">
        <SheetHeader className="mb-6 px-2">
          <SheetTitle className="font-bold text-2xl text-gray-900 flex items-center gap-3">
            <span className="bg-primary/10 p-2 rounded-xl text-primary"><Plus className="w-5 h-5" /></span>
            {c.pickDesign}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] px-2 pb-6">
          {loadingDesigns ? (
            <div className="flex justify-center py-20 px-4"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
          ) : myDesigns.length === 0 ? (
            <div className="text-center p-12 bg-white border border-dashed border-gray-200 rounded-3xl mt-4">
              <p className="text-gray-500 font-medium">{c.noDesigns}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-8">
              {myDesigns.map((design) => (
                <button key={design.id} type="button" disabled={addingDesignId === design.id} onClick={() => addToCart(design)}
                  className="relative bg-white border border-gray-100 p-3 rounded-2xl text-left transition hover:border-primary/30 hover:shadow-lg disabled:opacity-70">
                  {addingDesignId === design.id && (
                    <span className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-2xl">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </span>
                  )}
                  <span className="block bg-gray-50 rounded-xl mb-3 overflow-hidden aspect-square">
                    <img src={getPreviewDisplayUrl(design.preview_image_url) || ''} alt={design.design_name} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                  </span>
                  <span className="block px-1 text-center font-bold text-sm text-gray-900 truncate">{design.design_name}</span>
                  <span className="block text-center text-[11px] font-semibold text-primary mt-1">+ {c.addToCartDesign}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
