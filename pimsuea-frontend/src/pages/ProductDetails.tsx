import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, ShieldCheck, Loader2, AlertCircle, Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import { getProductById, estimatePrice } from "@/services/api";
import type { Product } from "@/types/api";
import type { PriceEstimate } from "@/services/api";
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

  // Price estimator state
  const [estColor, setEstColor] = useState<'White' | 'Black'>('White');
  const [estSize, setEstSize] = useState<string>('');
  const [frontTier, setFrontTier] = useState<string>('none');
  const [backTier, setBackTier] = useState<string>('none');
  const [estResult, setEstResult] = useState<PriceEstimate | null>(null);
  const [estLoading, setEstLoading] = useState(false);
  const [estError, setEstError] = useState<string | null>(null);

  const TIER_LABELS: Record<string, string> = {
    '3x4in': '3×4" (เล็ก)',
    'A5':    'A5 (กลาง)',
    'A4':    'A4 (ใหญ่)',
    'A3':    'A3 (ใหญ่มาก)',
  };

  const handleEstimate = async () => {
    if (!product || !id || !selectedMethodId) return;
    const ft = frontTier === 'none' ? undefined : frontTier;
    const bt = backTier === 'none' ? undefined : backTier;
    if (!ft && !bt) {
      setEstError('กรุณาเลือกขนาดพิมพ์อย่างน้อย 1 ด้าน');
      return;
    }
    const size = estSize || product.available_sizes?.[0] || 'M';
    setEstLoading(true);
    setEstError(null);
    setEstResult(null);
    try {
      const result = await estimatePrice({
        productId: id,
        colorName: estColor,
        size,
        quantity,
        printingType: selectedMethodId.toUpperCase(),
        frontTier: ft,
        backTier: bt,
      });
      setEstResult(result);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setEstError(msg || 'คำนวณราคาไม่สำเร็จ');
    } finally {
      setEstLoading(false);
    }
  };

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


  const handleStartDesign = () => {
    if (!selectedMethodId) return;
    navigate(`/design/${id}?printingType=${selectedMethodId}`, {
        state: {
            printMethodId: selectedMethodId,
            quantity: quantity,
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
            <div className="flex items-baseline gap-2">
                {product.starting_price ? (
                    <>
                        <p className="text-3xl font-bold text-primary">฿{product.starting_price.toLocaleString()}</p>
                        <span className="text-gray-500 text-sm">ราคาเริ่มต้น / ชิ้น</span>
                    </>
                ) : (
                    <p className="text-2xl font-bold text-gray-400">ติดต่อสอบถาม</p>
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
                 <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 text-lg"
                 />
            </div>
          </div>
          
          {/* Price Estimator */}
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Calculator className="w-4 h-4" />
              คำนวณราคาโดยประมาณ
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Color */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">สีเสื้อ</Label>
                <Select value={estColor} onValueChange={(v) => setEstColor(v as 'White' | 'Black')}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="White">ขาว (White)</SelectItem>
                    <SelectItem value="Black">ดำ (Black)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Size */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">ไซส์</Label>
                <Select
                  value={estSize || product.available_sizes?.[0] || ''}
                  onValueChange={setEstSize}
                >
                  <SelectTrigger className="bg-white"><SelectValue placeholder="เลือกไซส์" /></SelectTrigger>
                  <SelectContent>
                    {(product.available_sizes ?? []).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Front print size */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">พิมพ์ด้านหน้า</Label>
                <Select value={frontTier} onValueChange={setFrontTier}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ไม่พิมพ์</SelectItem>
                    {Object.entries(TIER_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Back print size */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">พิมพ์ด้านหลัง</Label>
                <Select value={backTier} onValueChange={setBackTier}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ไม่พิมพ์</SelectItem>
                    {Object.entries(TIER_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {estError && <p className="text-xs text-red-500">{estError}</p>}

            <Button
              variant="outline"
              className="w-full"
              onClick={handleEstimate}
              disabled={estLoading || !selectedMethodId}
            >
              {estLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
              คำนวณราคา ({quantity} ชิ้น)
            </Button>

            {estResult && (
              <div className="text-sm space-y-1 pt-1 border-t">
                <div className="flex justify-between text-gray-600">
                  <span>ราคาเสื้อ</span>
                  <span>฿{estResult.shirt_per_unit.toLocaleString()} / ชิ้น</span>
                </div>
                {estResult.front_print_per_unit > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>พิมพ์ด้านหน้า</span>
                    <span>฿{estResult.front_print_per_unit.toLocaleString()} / ชิ้น</span>
                  </div>
                )}
                {estResult.back_print_per_unit > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>พิมพ์ด้านหลัง</span>
                    <span>฿{estResult.back_print_per_unit.toLocaleString()} / ชิ้น</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>รวม / ชิ้น</span>
                  <span className="text-primary">฿{estResult.total_per_unit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>รวมทั้งหมด ({quantity} ชิ้น)</span>
                  <span className="text-primary">฿{estResult.total.toLocaleString()}</span>
                </div>
              </div>
            )}
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
