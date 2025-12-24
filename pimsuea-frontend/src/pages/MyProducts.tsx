import { Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function MyProducts() {
  const myDesigns = [
    { id: 1, name: "โปรเจกต์เสื้อทีม", updated: "2 ชั่วโมงที่แล้ว", image: "👕" },
    { id: 2, name: "ลายกราฟิกแมว", updated: "เมื่อวาน", image: "🧥" },
    { id: 3, name: "กระเป๋ารักษ์โลก", updated: "3 วันที่แล้ว", image: "👜" },
  ];

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
        {myDesigns.map((design) => (
          <div key={design.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-40 bg-gray-50 flex items-center justify-center text-6xl relative group">
                {design.image}
                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center gap-2 transition-all">
                    <Button size="icon" variant="secondary"><Edit2 className="w-4 h-4" /></Button>
                    <Button size="icon" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{design.name}</h3>
              <p className="text-sm text-gray-500">แก้ไขล่าสุด: {design.updated}</p>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                 <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Draft</span>
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
