import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PrintMethodBadges } from "@/components/catalog/PrintMethodBadges";
import { filterActivePrintMethods } from "@/constants/printing";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { getCategories, getProducts } from "@/services/api";
import type { Category, Product } from "@/types/api";
import { useLanguage } from "@/i18n/LanguageContext";
import { getProductName, getCategoryName } from "@/lib/productName";
import { formatMoney } from "@/i18n/localeFormat";

export default function Catalog() {
  const { t, lang } = useLanguage();
  const cat = t.catalog;
  const common = t.common;
  const [activeTab, setActiveTab] = useState<number | string | "all">("all");
  const [isBeginner, setIsBeginner] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchProds = async () => {
      try {
        setLoading(true);
        setError(null);
        const categoryId = activeTab === "all" ? null : activeTab;
        const data = await getProducts({ category_id: categoryId, is_beginner_friendly: isBeginner });
        setProducts(
          data.filter(p => filterActivePrintMethods(p.print_methods).length > 0)
        );
      } catch (err) {
        console.error("Failed to load products:", err);
        setError(cat.loadError);
      } finally {
        setLoading(false);
      }
    };

    fetchProds();
  }, [activeTab, isBeginner, cat.loadError]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 space-y-6">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">{cat.title}</h1>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50/80 backdrop-blur-md p-2 rounded-2xl border border-gray-100 shadow-sm sticky top-20 z-40">
          
          <div className="flex overflow-x-auto no-scrollbar gap-2 p-1">
            <Button
                variant={activeTab === "all" ? "default" : "ghost"}
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-5 transition-all w-max shrink-0 ${activeTab === 'all' ? 'shadow-sm font-bold' : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'}`}
            >
                {common.all}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeTab === category.id ? "default" : "ghost"}
                onClick={() => setActiveTab(category.id)}
                className={`rounded-xl px-5 transition-all w-max shrink-0 ${activeTab === category.id ? 'shadow-sm font-bold' : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'}`}
              >
                {getCategoryName(category, lang)}
              </Button>
            ))}
          </div>

          <div className="flex justify-between lg:justify-end items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 shrink-0 mx-1 lg:mx-0">
            <span className={`text-sm tracking-wide ${isBeginner ? "text-primary font-bold" : "text-gray-500 font-medium"}`}>
                {cat.beginnerToggle}
            </span>
            <Switch checked={isBeginner} onCheckedChange={setIsBeginner} className="data-[state=checked]:bg-primary" />
          </div>

        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
             <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 space-y-4">
             <AlertCircle className="w-12 h-12" />
             <p className="text-xl font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {products.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500">
                    {cat.noProducts}
                </div>
            ) : (
                products.map((product) => {
                  const productName = getProductName(product, lang);
                  const price = product.starting_price ?? product.price;
                  return (
                <Link key={product.id} to={`/product/${product.id}`} className="group block h-full outline-primary rounded-2xl sm:rounded-[2rem] min-w-0">
                    <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-[2rem] overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full flex flex-col group-hover:-translate-y-1 min-w-0">
                      
                      <div className="aspect-4/5 sm:aspect-square bg-gray-50/50 flex items-center justify-center text-8xl relative overflow-hidden">
                           {product.image_url ? (
                              <img src={product.image_url} alt={productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                           ) : (
                              <span>👕</span>
                           )}
                           {product.hover_image_url && (
                              <img src={product.hover_image_url} alt={`${productName} hover`} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                           )}
                           <div className="absolute inset-0 bg-linear-to-t from-gray-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      </div>

                      <div className="p-3 sm:p-6 flex-1 flex flex-col relative bg-linear-to-b from-white to-gray-50/30 min-w-0">
                          <div className="mb-2 sm:mb-3 min-w-0">
                              <h3 className="font-bold text-sm sm:text-xl text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                  {productName}
                              </h3>
                              {product.is_beginner_friendly && (
                                <Badge variant="secondary" className="mt-1.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 shrink-0 rounded-lg whitespace-nowrap hidden sm:inline-flex">
                                    {cat.beginnerBadge}
                                </Badge>
                              )}
                          </div>
                          <PrintMethodBadges print_methods={product.print_methods} />
                          <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:pt-4 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">{cat.startingPrice}</p>
                              <p className="text-primary font-black text-lg sm:text-2xl truncate">
                                  {formatMoney(price, lang)}
                              </p>
                            </div>
                            
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm border border-primary/10 shrink-0">
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                      </div>
                    </div>
                </Link>
                  );
                })
            )}
        </div>
      )}
    </div>
  );
}
