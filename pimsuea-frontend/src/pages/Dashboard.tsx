import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboard } from "@/services/api";
import type { DashboardData } from "@/types/api";
import { motion } from "framer-motion";

import { BackgroundCells } from "@/components/ui/background-ripple-effect";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDashboard();
        setData(result);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500 space-y-4">
        <AlertCircle className="w-12 h-12" />
        <p className="text-xl font-semibold">{error}</p>
        <Button onClick={() => window.location.reload()}>ลองใหม่อีกครั้ง</Button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Hero Section */}
      <BackgroundCells className="h-[80vh] border-b">
        <div className="text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-900 tracking-tight leading-tight">
            ออกแบบ <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#07636D] to-teal-600">
              สินค้าในสไตล์คุณ
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            ศูนย์รวมงานสกรีนคุณภาพสูง ออกแบบเองได้ง่ายๆ <br className="hidden md:block" /> เริ่มต้นเพียง 1 ชิ้น ส่งตรงถึงบ้านคุณ
          </p>

          <Link to="/catalog">
            <Button size="lg" className="bg-[#07636D] hover:bg-[#06545c] text-white rounded-full text-lg px-8 py-6 shadow-xl shadow-teal-900/10 transition-all hover:scale-105 hover:shadow-teal-900/20">
              เริ่มสั่งทำเลย <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </BackgroundCells>
      
      <div className="container mx-auto px-4 space-y-12 mt-12">
            {/* News Section */}
        {data?.news && data.news.length > 0 && (
            <section className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                📢 ข่าวสารและโปรโมชั่น
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.news.map((item) => (
                    <Link key={item.id} to={`/news/${item.id}`} className="group block h-full">
                        <div className={`h-full bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col`}>
                             {/* Image Header */}
                            <div className={`h-48 ${item.color_class || 'bg-gray-100'} relative overflow-hidden`}>
                                {item.image_url ? (
                                    <img 
                                        src={item.image_url} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        📰
                                    </div>
                                )}
                                {item.type && (
                                    <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                        {item.type}
                                    </span>
                                )}
                            </div>
                            
                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                                    {item.description}
                                </p>
                                {item.published_at && (
                                    <div className="text-xs text-gray-400 mt-auto">
                                        {new Date(item.published_at).toLocaleDateString('th-TH')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
                </div>
            </section>
        )}

        {/* Best Sellers */}
        {data?.bestSellers && data.bestSellers.length > 0 && (
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
                {data.bestSellers.map((product) => (
                    <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="h-48 bg-gray-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                        {/* Placeholder generic icon since real image might be missing */}
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <span>👕</span>
                        )}
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                         {/* Fallback sold count if missing */}
                        <span>ขายแล้ว {product.sold_count || '100+'}</span>
                        <div className="flex items-center text-yellow-500">
                            <Star className="w-3 h-3 fill-current" /> {product.rating || '4.8'}
                        </div>
                        </div>
                        <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">฿{(product.price).toLocaleString()}</span>
                        <Link to={`/product/${product.id}`}>
                            <Button size="sm" variant="secondary" className="rounded-full">เลือก</Button>
                        </Link>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            </section>
        )}
      </div>
    </div>
  );
}
