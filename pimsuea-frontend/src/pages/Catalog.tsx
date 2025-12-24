import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { getCategories, getProducts } from "@/services/api";
import type { Category, Product } from "@/types/api";

export default function Catalog() {
  const [activeTab, setActiveTab] = useState<number | "all">("all");
  const [isBeginner, setIsBeginner] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Categories on Mount
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

  // Fetch Products on Filter Change
  useEffect(() => {
    const fetchProds = async () => {
      try {
        setLoading(true);
        setError(null);
        const categoryId = activeTab === "all" ? null : (activeTab as number);
        const data = await getProducts({ category_id: categoryId, is_beginner_friendly: isBeginner });
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("เกิดข้อผิดพลาดในการโหลดสินค้า");
      } finally {
        setLoading(false);
      }
    };

    fetchProds();
  }, [activeTab, isBeginner]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">แคตตาล็อกสินค้า</h1>
        
        <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
          <span className={`text-sm ${isBeginner ? "text-primary font-bold" : "text-gray-500"}`}>สำหรับมือใหม่</span>
          <Switch checked={isBeginner} onCheckedChange={setIsBeginner} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => setActiveTab("all")}
            className="rounded-full"
        >
            ทั้งหมด
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeTab === cat.id ? "default" : "outline"}
            onClick={() => setActiveTab(cat.id)}
            className="rounded-full"
          >
            {/* Can use cat.icon if needed later */}
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Loading & Error States */}
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
        /* Product Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500">
                    ไม่พบสินค้าในหมวดหมู่นี้
                </div>
            ) : (
                products.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="group">
                    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-square bg-gray-50 flex items-center justify-center text-8xl group-hover:scale-105 transition-transform overflow-hidden">
                         {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                         ) : (
                            <span>👕</span>
                         )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                            {product.is_beginner_friendly && <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100 shrink-0 ml-2">มือใหม่</Badge>}
                        </div>
                        <p className="text-primary font-bold text-xl mt-auto">฿{product.price.toLocaleString()}</p>
                        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button className="w-full">ออกแบบเลย</Button>
                        </div>
                    </div>
                    </div>
                </Link>
                ))
            )}
        </div>
      )}
    </div>
  );
}
