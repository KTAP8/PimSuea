import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function Catalog() {
  const [activeTab, setActiveTab] = useState("all");
  const [isBeginner, setIsBeginner] = useState(false);

  const products = [
    { id: 1, name: "เสื้อยืด Basic Cotton", price: 250, category: "t-shirt", image: "👕", newbie: true },
    { id: 2, name: "เสื้อฮู้ด Premium", price: 590, category: "hoodie", image: "🧥", newbie: false },
    { id: 3, name: "กระเป๋าผ้า Canvas", price: 190, category: "bag", image: "👜", newbie: true },
    { id: 4, name: "หมวกแก๊ป", price: 150, category: "hat", image: "🧢", newbie: true },
    { id: 5, name: "เสื้อ Oversize", price: 300, category: "t-shirt", image: "👕", newbie: false },
    { id: 6, name: "ถุงผ้าหูรูด", price: 120, category: "bag", image: "🎒", newbie: true },
  ];

  const filteredProducts = products.filter(p => 
    (activeTab === "all" || p.category === activeTab) &&
    (!isBeginner || p.newbie)
  );

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
        {[
          { id: "all", label: "ทั้งหมด" },
          { id: "t-shirt", label: "เสื้อยืด" },
          { id: "hoodie", label: "เสื้อฮู้ด" },
          { id: "bag", label: "กระเป๋า" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className="rounded-full"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Link key={product.id} to={`/product/${product.id}`} className="group">
            <div className="bg-white border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gray-50 flex items-center justify-center text-8xl group-hover:scale-105 transition-transform">
                {product.image}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                    {product.newbie && <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">มือใหม่</Badge>}
                </div>
                <p className="text-primary font-bold text-xl">฿{product.price}</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button className="w-full">ออกแบบเลย</Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
