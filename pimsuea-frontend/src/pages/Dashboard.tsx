import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

export default function Dashboard() {
  const news = [
    { id: 1, title: "โปรโมชั่นเปิดร้านใหม่", desc: "ลด 20% ทุกรายการ ถึงสิ้นเดือนนี้", color: "bg-blue-100" },
    { id: 2, title: "เทคนิคการออกแบบ", desc: "5 วิธีทำให้ลายสกรีนสวยทน", color: "bg-green-100" },
    { id: 3, title: "สินค้าใหม่มาแรง", desc: "เสื้อฮู้ดผ้าหนานุ่ม ใส่สบาย", color: "bg-yellow-100" },
  ];

  const bestSellers = [
    { id: 1, name: "เสื้อยืด Cotton 100%", price: "฿250", sold: "1.2k", img: "👕" },
    { id: 2, name: "เสื้อฮู้ด Oversize", price: "฿590", sold: "850", img: "🧥" },
    { id: 3, name: "กระเป๋าผ้าแคนวาส", price: "฿190", sold: "2.5k", img: "👜" },
    { id: 4, name: "หมวกแก๊ป", price: "฿150", sold: "500", img: "🧢" },
  ];

  return (
    <div className="space-y-12 pb-10">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-20 px-4 text-center rounded-b-[3rem] shadow-xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">ยินดีต้อนรับสู่ PimSuea</h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
          ศูนย์รวมงานสกรีนคุณภาพสูง ออกแบบเองได้ง่ายๆ เริ่มต้นเพียง 1 ชิ้น
        </p>
        <Link to="/catalog">
          <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-bold shadow-lg transition-transform hover:scale-105">
            เริ่มสั่งทำเลย <ArrowRight className="ml-2" />
          </Button>
        </Link>
      </section>

      <div className="container mx-auto px-4space-y-12">
        {/* News Section */}
        <section className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
            📢 ข่าวสารและโปรโมชั่น
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
                <div key={item.id} className={`${item.color} p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-700">{item.desc}</p>
                </div>
            ))}
            </div>
        </section>

        {/* Best Sellers */}
        <section className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-bold flex items-center">
                🔥 สินค้าขายดี
            </h2>
            <Link to="/catalog" className="text-primary hover:underline font-medium">
                ดูทั้งหมด
            </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
                <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="h-48 bg-gray-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                    {product.img}
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>ขายแล้ว {product.sold}</span>
                    <div className="flex items-center text-yellow-500">
                        <Star className="w-3 h-3 fill-current" /> 4.9
                    </div>
                    </div>
                    <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{product.price}</span>
                    <Button size="sm" variant="secondary" className="rounded-full">เลือก</Button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </section>
      </div>
    </div>
  );
}
