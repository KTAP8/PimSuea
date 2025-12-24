import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getProductById } from "@/services/api";
import type { Product } from "@/types/api";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("ไม่พบข้อมูลสินค้าหรือเกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500 space-y-4">
        <AlertCircle className="w-12 h-12" />
        <p className="text-xl font-semibold">{error || "ไม่พบสินค้า"}</p>
        <Link to="/catalog">
            <Button variant="outline">กลับไปแคตตาล็อก</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalog" className="inline-flex items-center text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> กลับไปแคตตาล็อก
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Image */}
        <div className="bg-gray-50 rounded-2xl aspect-square flex items-center justify-center text-9xl shadow-inner overflow-hidden">
            {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
                <span>👕</span>
            )}
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-primary">฿{product.price.toLocaleString()}</p>
          </div>

          {/* Placeholder for colors/sizes as API might not return them yet, keeping UI structure stable */}
          <div className="space-y-2">
            <h3 className="font-semibold">สีที่เลือกได้:</h3>
            <div className="flex gap-2">
                {/* Mock colors for now as interface doesn't strictly define them yet */}
              {["ขาว", "ดำ", "กรมท่า"].map(c => (
                <div key={c} className="px-3 py-1 border rounded-md text-sm cursor-pointer hover:border-primary peer-checked:bg-primary">{c}</div>
              ))}
            </div>
          </div>

          <Link to={`/design/${id}`}>
            <Button size="lg" className="w-full text-lg py-6 mt-4 shadow-lg shadow-primary/20">
              เริ่มออกแบบสินค้า
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
             <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/> ผลิตไวใน 2-3 วัน</div>
             <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500"/> รับประกันคุณภาพ</div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">รายละเอียด</TabsTrigger>
              <TabsTrigger value="size" className="flex-1">ตารางไซส์</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="p-4 border rounded-b-lg border-t-0 mt-0">
              <p className="text-gray-600 leading-relaxed">{product.description || "ไม่มีรายละเอียดสินค้า"}</p>
            </TabsContent>
            <TabsContent value="size" className="p-4 border rounded-b-lg border-t-0 mt-0">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2">Size</th>
                            <th className="p-2">อก (นิ้ว)</th>
                            <th className="p-2">ยาว (นิ้ว)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b"><td className="p-2">S</td><td className="p-2">32</td><td className="p-2">26</td></tr>
                        <tr className="border-b"><td className="p-2">M</td><td className="p-2">36</td><td className="p-2">27</td></tr>
                        <tr className="border-b"><td className="p-2">L</td><td className="p-2">40</td><td className="p-2">28</td></tr>
                        <tr><td className="p-2">XL</td><td className="p-2">44</td><td className="p-2">29</td></tr>
                    </tbody>
                 </table>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
