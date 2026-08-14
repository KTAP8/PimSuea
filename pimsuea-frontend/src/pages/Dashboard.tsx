import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Star,
  Loader2,
  AlertCircle,
  Newspaper,
  Flame,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboard } from "@/services/api";
import type { DashboardData } from "@/types/api";

import { motion } from "framer-motion";
import { UserGreeting } from "@/components/dashboard/UserGreeting";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ContinueDesigning } from "@/components/dashboard/ContinueDesigning";
import { OngoingOrders } from "@/components/dashboard/OngoingOrders";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function newsExcerpt(description?: string, content?: string): string {
  if (description?.trim()) return description;
  if (!content?.trim()) return "";
  const plain = content
    .replace(/[#>*_\-\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= 120) return plain;
  return `${plain.slice(0, 120).trim()}…`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stats = useDashboardStats();

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
        <Button onClick={() => window.location.reload()}>
          ลองใหม่อีกครั้ง
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-slate-50 to-white border-b border-gray-100/50">
        {/* Subtle decorative gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-125 opacity-30 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-teal-200 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse delay-100" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-orange-100 blur-[100px] rounded-full mix-blend-multiply opacity-70 animate-pulse delay-700" />
        </div>

        <div className="text-center px-4 max-w-4xl mx-auto relative z-10 flex flex-col justify-center min-h-[40vh] md:min-h-[70vh] pt-8 pb-8 md:pt-16 md:pb-12">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-heavy mb-4 md:mb-6 text-slate-900 tracking-tight leading-[1.1]"
          >
            บริการ Print On Demand <br className="hidden md:block" />
            <span className="text-primary">เพื่อคุณ โดยคุณ เราจัดการให้</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-base md:text-xl text-slate-600 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            ศูนย์รวมงานสกรีนคุณภาพสูง ออกแบบเองได้ง่ายๆ{" "}
            <br className="hidden md:block" /> เริ่มต้นเพียง 1 ชิ้น
            ส่งตรงถึงบ้านคุณ
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to="/catalog">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full text-base md:text-lg px-6 md:px-8 py-5 md:py-7 shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-primary/30 group"
              >
                เริ่มสั่งทำเลย
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Personalized user summary */}
      <UserGreeting stats={stats} />

      <div className="container mx-auto px-4 space-y-16 mt-10">
        <QuickActions stats={stats} />
        <ContinueDesigning
          designs={stats.recentDesigns}
          loading={stats.loading}
        />
        <OngoingOrders orders={stats.ongoingOrders} loading={stats.loading} />

        {/* News Section */}
        {data?.news && data.news.length > 0 && (
          <section className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Newspaper className="w-6 h-6" />
              </div>
              ข่าวสารและโปรโมชั่น
            </h2>
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="mx-2 sm:mx-4 md:mx-16"
            >
              <CarouselContent className="-ml-4 py-4">
                {data.news.map((item) => (
                  <CarouselItem
                    key={item.id}
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <Link
                      to={`/news/${item.id}`}
                      className="group block h-full"
                    >
                      <div
                        className={`h-full bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col`}
                      >
                        {/* Image Header */}
                        <div
                          className={`h-48 ${item.color_class || "bg-gray-100"} relative overflow-hidden`}
                        >
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
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                            {newsExcerpt(item.description, item.content)}
                          </p>
                          {item.published_at && (
                            <div className="text-xs text-gray-400 mt-auto">
                              {new Date(item.published_at).toLocaleDateString(
                                "th-TH",
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-4 md:-left-12" />
              <CarouselNext className="-right-4 md:-right-12" />
            </Carousel>
          </section>
        )}

        {/* Best Sellers */}
        {data?.bestSellers && data.bestSellers.length > 0 && (
          <section className="container mx-auto px-4 pb-12">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-semibold flex items-center gap-2 text-slate-900">
                <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                  <Flame className="w-6 h-6" />
                </div>
                สินค้าขายดี
              </h2>
              <Link
                to="/catalog"
                className="text-primary hover:underline text-sm font-normal"
              >
                ดูทั้งหมด
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {data.bestSellers.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="h-48 bg-gray-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                    {/* Placeholder generic icon since real image might be missing */}
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>👕</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-1 text-slate-800 truncate">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      {/* Fallback sold count if missing */}
                      <span>ขายแล้ว {product.sold_count || "100+"}</span>
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />{" "}
                        {product.rating || "4.8"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-primary">
                        ฿{product.price.toLocaleString()}
                      </span>
                      <Link to={`/product/${product.id}`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full"
                        >
                          เลือก
                        </Button>
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
