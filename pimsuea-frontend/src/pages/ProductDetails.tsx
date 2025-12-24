import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams();

  // Mock data - in real app would fetch by ID
  const product = {
    id,
    name: "เสื้อยืด Basic Cotton",
    price: 250,
    description: "เสื้อยืดคอตตอน 100% สัมผัสนุ่ม สวมใส่สบาย ระบายอากาศได้ดี เหมาะสำหรับสภาพอากาศประเทศไทย ทรงสวย ไม่ย้วยง่าย",
    colors: ["ขาว", "ดำ", "กรมท่า", "เทา"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    image: "👕"
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalog" className="inline-flex items-center text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> กลับไปแคตตาล็อก
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Image */}
        <div className="bg-gray-50 rounded-2xl aspect-square flex items-center justify-center text-9xl shadow-inner">
          {product.image}
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-primary">฿{product.price}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">สีที่เลือกได้:</h3>
            <div className="flex gap-2">
              {product.colors.map(c => (
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
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
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
