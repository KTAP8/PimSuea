import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getProductById } from "@/services/api";
import type { Product } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration State
  const [quantity, setQuantity] = useState(1);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
        
        // Auto-select first method if available
        if (data.print_methods && data.print_methods.length > 0) {
            setSelectedMethodId(data.print_methods[0].id);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("ไม่พบข้อมูลสินค้าหรือเกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Pricing Logic
  useEffect(() => {
    if (!product || !selectedMethodId || !product.print_methods) {
        setCalculatedPrice(null);
        return;
    }

    const method = product.print_methods.find(m => m.id === selectedMethodId);
    if (!method || !method.tiers || method.tiers.length === 0) {
        // Fallback to base price if no tiers? Or handle error.
        // For now, use product.price if available
        setCalculatedPrice(product.price);
        return;
    }

    // Filter tiers by selected method (product.print_methods already groups them properly)
    // Find tier where min_quantity <= current_quantity
    // Sort tiers by min_quantity desc to find the "highest min_quantity" that fits
    const sortedTiers = [...method.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
    const applicableTier = sortedTiers.find(t => t.min_quantity <= quantity);

    if (applicableTier) {
        // unit_price is "Total Final Price per unit" as per instructions
        setCalculatedPrice(applicableTier.unit_price * quantity);
    } else {
        // If undefined (quantity lower than lowest tier? Should use lowest tier price?)
        // Usually assume lowest tier applies to 1?
        // Let's assume the last one (smallest min_quantity) applies
        const lowestTier = sortedTiers[sortedTiers.length - 1];
        if (lowestTier) {
            setCalculatedPrice(lowestTier.unit_price * quantity);
        } else {
             setCalculatedPrice(product.price * quantity);
        }
    }

  }, [quantity, selectedMethodId, product]);

  const handleStartDesign = () => {
    if (!selectedMethodId) return;
    navigate(`/design/${id}?printingType=${selectedMethodId}`, {
        state: {
            printMethodId: selectedMethodId,
            quantity: quantity,
            totalPrice: calculatedPrice
        }
    });
  };

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
        <div className="bg-gray-50 rounded-2xl aspect-square flex items-center justify-center text-9xl shadow-inner overflow-hidden sticky top-24">
            {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
                <span>👕</span>
            )}
        </div>

        {/* Right: Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
            {/* Show Unit Price or Total Price? Usually easier to show Total here if configured, or Unit if list. */}
            <div className="flex items-baseline gap-2">
                 {calculatedPrice !== null ? (
                     <>
                        <p className="text-3xl font-bold text-primary">฿{calculatedPrice.toLocaleString()}</p>
                        <span className="text-gray-500 text-sm">(ราคารวม {quantity} ชิ้น)</span>
                     </>
                 ) : (
                    <p className="text-2xl font-bold text-gray-400">กรุณาเลือกรูปแบบ</p>
                 )}
            </div>
          </div>

          <div className="space-y-6 border-y py-6">
            {/* Print Method Selection */}
            <div className="space-y-3">
                <Label className="text-base font-semibold">เลือกรูปแบบการพิมพ์</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.print_methods?.map((method) => (
                        <div 
                            key={method.id}
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`
                                cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:border-primary/50
                                ${selectedMethodId === method.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold">{method.name}</span>
                                {selectedMethodId === method.id && <Check className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{method.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quantity Input */}
            <div className="space-y-3">
                 <Label className="text-base font-semibold">จำนวน (ชิ้น)</Label>
                 <div className="flex items-center gap-4">
                     <Input 
                        type="number" 
                        min={1} 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-32 text-lg"
                     />
                     <div className="text-sm text-gray-500">
                        {/* Price Breakdown Helper */}
                        {calculatedPrice && (
                             <span>เฉลี่ยชิ้นละ ฿{(calculatedPrice / quantity).toFixed(2)}</span>
                        )}
                     </div>
                 </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
                size="lg" 
                className="w-full text-lg py-6 shadow-lg shadow-primary/20"
                onClick={handleStartDesign}
                disabled={!selectedMethodId}
            >
              เริ่มออกแบบสินค้า
            </Button>
            {!selectedMethodId && (
                <p className="text-center text-sm text-red-500 mt-2">กรุณาเลือกรูปแบบการพิมพ์ก่อนเริ่มออกแบบ</p>
            )}
          </div>

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
