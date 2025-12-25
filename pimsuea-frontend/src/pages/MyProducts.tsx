import { Edit2, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyDesigns } from "@/services/api";

export default function MyProducts() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const data = await getMyDesigns();
        console.log("MyProducts: Fetched designs:", data);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ผลงานออกแบบของฉัน</h1>
        <Link to="/catalog">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> สร้างงานใหม่
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {designs.map((design) => (
          <div key={design.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-40 bg-gray-50 flex items-center justify-center relative group">
                <img 
                    src={design.preview_image_url || "https://via.placeholder.com/300?text=No+Preview"} 
                    alt={design.design_name} 
                    className="h-full w-full object-contain" 
                />
                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center gap-2 transition-all">
                    <Link to={`/design/${design.base_product_id}?designId=${design.id}`}>
                         <Button size="icon" variant="secondary"><Edit2 className="w-4 h-4" /></Button>
                    </Link>
                    <Button size="icon" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1 truncate" title={design.design_name}>{design.design_name}</h3>
              <p className="text-sm text-gray-500">
                  {new Date(design.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                  })}
              </p>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                 <span className={`text-xs font-medium px-2 py-1 rounded ${design.is_ordered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600'}`}>
                     {design.is_ordered ? 'Ordered' : 'Draft'}
                 </span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State / Add New Placeholder */}
        <Link to="/catalog" className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-[250px]">
            <Plus className="w-12 h-12 mb-2" />
            <span className="font-medium">เริ่มออกแบบงานใหม่</span>
        </Link>
      </div>
    </div>
  );
}
