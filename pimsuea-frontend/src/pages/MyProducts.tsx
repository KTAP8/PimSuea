import { Edit2, Trash2, Plus, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyDesigns, deleteDesign } from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { isLegacyDtfPrintingType } from "@/constants/printing";
import { getPreviewDisplayUrl } from "@/lib/previews";
import { useLanguage } from "@/i18n/LanguageContext";
import { dtfDiscontinuedMessage } from "@/translations/app/checkout";
import { formatDate } from "@/i18n/localeFormat";

export default function MyProducts() {
  const { t, lang } = useLanguage();
  const o = t.orders;
  const common = t.common;
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
      if (!deleteId) return;
      try {
          await deleteDesign(deleteId);
          setDesigns(prev => prev.filter(d => d.id !== deleteId));
      } catch (error) {
          console.error("Failed to delete design:", error);
          alert(o.deleteFailed);
      } finally {
          setDeleteId(null);
      }
  };

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const data = await getMyDesigns();
        setDesigns(data);
      } catch (error) {
        console.error("Failed to fetch designs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">{o.myDesignsTitle}</h1>
          <p className="text-gray-500 mt-1 font-medium">{o.myDesignsSubtitle}</p>
        </div>
        <Link to="/catalog">
          <Button className="rounded-full shadow-md shadow-primary/20 hover:shadow-primary/40 font-bold px-6 border-2 border-primary">
            <Plus className="w-5 h-5 mr-2" /> {o.createDesign}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
        
        {designs.length === 0 && (
          <Link to="/catalog" className="col-span-1 md:col-span-full border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-[2rem] flex flex-col items-center justify-center p-12 text-gray-400 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300 cursor-pointer min-h-80 group">
              <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Plus className="w-10 h-10 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
              <span className="font-black text-2xl text-gray-700 group-hover:text-primary transition-colors">{o.myDesignsEmpty}</span>
              <span className="text-base font-medium mt-3 text-center">{o.myDesignsEmptyHint}</span>
          </Link>
        )}

        {designs.map((design) => (
          <div key={design.id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col group hover:-translate-y-1">
            <Link to={`/studio/${design.base_product_id}?designId=${design.id}`} state={{ studioSource: 'my_products' }} className="relative aspect-square bg-gray-50/50 flex items-center justify-center p-8 cursor-pointer overflow-hidden">
                <img
                    src={getPreviewDisplayUrl(design.preview_image_url) || "https://via.placeholder.com/300?text=No+Preview"}
                    alt={design.design_name} 
                    className="h-full w-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 ease-out" 
                />
                
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                   {design.is_ordered && (
                       <Badge variant="secondary" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border shadow-sm bg-green-50 text-green-700 border-green-200">
                           {o.orderedBadge}
                       </Badge>
                   )}
                   {design.printing_type && (
                       <Badge variant="outline" className="text-[10px] font-bold bg-white/90 backdrop-blur-sm text-gray-600 border-gray-100 rounded-lg shadow-sm self-start hidden sm:inline-flex">
                           {design.printing_type}
                       </Badge>
                   )}
                </div>
                
                <div className="absolute bottom-3 left-3 right-3 md:hidden pointer-events-none">
                  <span className="inline-block text-[10px] font-medium text-gray-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-100">
                    {o.tapToView}
                  </span>
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-gray-900/5 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block" />
            </Link>
            
            <div className="p-5 sm:p-6 flex-1 flex flex-col bg-linear-to-b from-white to-gray-50/30">
              <div className="mb-4">
                  <h3 className="font-bold text-lg sm:text-xl text-gray-900 leading-snug line-clamp-1 mb-1.5" title={design.design_name}>{design.design_name || "Untitled Design"}</h3>
                  <p className="text-xs font-medium text-gray-400">
                      {o.lastEdited} {formatDate(lang, design.created_at, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      })}
                  </p>
              </div>

              <div className="mt-auto flex items-start gap-2 pt-4 border-t border-gray-100">
                  {isLegacyDtfPrintingType(design.printing_type) ? (
                    <div className="flex-1 min-w-0">
                      <Button variant="default" className="w-full rounded-xl h-11 font-bold px-3 gap-2" disabled>
                        <ShoppingCart className="w-4 h-4 shrink-0" />
                        <span className="truncate">{o.addToCart}</span>
                      </Button>
                      <p className="text-[10px] text-amber-600 mt-1.5 leading-snug">{dtfDiscontinuedMessage(lang)}</p>
                    </div>
                  ) : (
                  <Link to={`/checkout?initialDesignId=${design.id}`} className="flex-1 min-w-0">
                      <Button variant="default" className="w-full rounded-xl shadow-sm hover:shadow-primary/20 bg-primary font-bold h-11 px-3 gap-2">
                          <ShoppingCart className="w-4 h-4 shrink-0" />
                          <span className="truncate">{o.addToCart}</span>
                      </Button>
                  </Link>
                  )}
                  <Link to={`/studio/${design.base_product_id}?designId=${design.id}`} state={{ studioSource: 'my_products' }} className="shrink-0">
                      <Button variant="outline" className="h-11 w-11 rounded-xl border-gray-200 hover:border-primary/50 text-gray-600 hover:bg-primary/5 p-0">
                          <Edit2 className="w-4 h-4" />
                      </Button>
                  </Link>
                  <Button variant="outline" onClick={() => setDeleteId(design.id)} className="shrink-0 h-11 w-11 rounded-xl border-red-100 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-0 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                  </Button>
              </div>
            </div>
          </div>
        ))}

        {designs.length > 0 && (
          <Link to="/catalog" className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-[2rem] flex flex-col items-center justify-center p-6 text-gray-400 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300 cursor-pointer min-h-80 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <Plus className="w-7 h-7" />
              </div>
              <span className="font-bold text-lg text-gray-600 group-hover:text-primary transition-colors">{o.createAnother}</span>
          </Link>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{o.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {o.deleteConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              {o.deleteDesign}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
