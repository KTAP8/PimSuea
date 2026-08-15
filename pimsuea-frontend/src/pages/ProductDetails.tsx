import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, Loader2, AlertCircle, Calculator } from "lucide-react";
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
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [mainImageHovered, setMainImageHovered] = useState(false);
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
    navigate(`/studio/${id}?printingType=${selectedMethodId}`, {
        state: {
            printMethodId: selectedMethodId,
            quantity: quantity,
            studioSource: 'catalog',
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
        {/* Left: Image gallery */}
        <div className="flex flex-col gap-3">
            <div
                className="bg-gray-50 rounded-2xl aspect-square flex items-center justify-center text-9xl shadow-inner overflow-hidden relative"
                onMouseEnter={() => setMainImageHovered(true)}
                onMouseLeave={() => setMainImageHovered(false)}
            >
                {(product.images && product.images.length > 0) ? (
                    <>
                        <img
                            src={product.images[activeImageIdx]}
                            alt={`${product.name} ${activeImageIdx + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {product.hover_image_url && (
                            <img
                                src={product.hover_image_url}
                                alt={`${product.name} hover`}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mainImageHovered && activeImageIdx === 0 ? 'opacity-100' : 'opacity-0'}`}
                            />
                        )}
                    </>
                ) : product.image_url ? (
                    <>
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        {product.hover_image_url && (
                            <img
                                src={product.hover_image_url}
                                alt={`${product.name} hover`}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mainImageHovered && activeImageIdx === 0 ? 'opacity-100' : 'opacity-0'}`}
                            />
                        )}
                    </>
                ) : (
                    <span>👕</span>
                )}
            </div>
            {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveImageIdx(i)}
                            onMouseEnter={() => setActiveImageIdx(i)}
                            className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImageIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Right: Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 tracking-tight">{product.name}</h1>
            <div className="flex items-baseline gap-2 mt-3">
                {product.starting_price ? (
                    <>
                        <p className="text-4xl font-black text-primary">฿{product.starting_price.toLocaleString()}</p>
                        <span className="text-gray-500 font-medium">ราคาเริ่มต้น / ชิ้น</span>
                    </>
                ) : (
                    <p className="text-2xl font-bold text-gray-400">ติดต่อสอบถาม</p>
                )}
            </div>
          </div>

          <div className="space-y-8 py-2">
            {/* Print Method Selection */}
            {(product.print_methods?.length ?? 0) > 1 && (
            <div className="space-y-4">
                <Label className="flex items-center text-lg font-bold text-gray-900 border-l-4 border-primary pl-3">
                   เลือกรูปแบบการพิมพ์
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                    {product.print_methods?.map((method) => (
                        <div 
                            key={method.id}
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`
                                cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 
                                ${selectedMethodId === method.id 
                                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                                    : 'border-gray-100 bg-white hover:border-primary/30 hover:bg-gray-50'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`font-bold ${selectedMethodId === method.id ? 'text-primary' : 'text-gray-800'}`}>
                                    {method.name}
                                </span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedMethodId === method.id ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                    {selectedMethodId === method.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">{method.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            )}


          </div>
          
          {/* Primary Action Area (CTA) */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 md:p-8 rounded-[2rem] border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Calculator className="w-32 h-32" />
            </div>
            <div className="relative z-10 w-full">
                <div className="space-y-3">
                    <Button
                        size="lg"
                        className="w-full text-xl h-16 rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 font-bold"
                        onClick={handleStartDesign}
                        disabled={!selectedMethodId}
                    >
                      ✨ เริ่มออกแบบสินค้า
                    </Button>
                    {!selectedMethodId && (
                        <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 py-2 rounded-xl border border-amber-100">
                            <AlertCircle className="w-4 h-4" /> 
                            <span>กรุณาเลือกรูปแบบการพิมพ์ (ข้อ 1) ก่อนเริ่มออกแบบ</span>
                        </div>
                    )}
                </div>
            </div>
          </div>


          {/* Secondary Elements: Details, Size, Estimator */}
          {/* Secondary Elements: Details, Size, Care, Estimator */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full bg-gray-50/80 p-1.5 rounded-2xl h-12 sm:h-14 flex overflow-x-auto no-scrollbar">
              <TabsTrigger value="details" className="flex-1 min-w-[72px] rounded-xl font-medium text-xs sm:text-base h-full data-[state=active]:shadow-sm">รายละเอียด</TabsTrigger>
              <TabsTrigger value="size" className="flex-1 min-w-[72px] rounded-xl font-medium text-xs sm:text-base h-full data-[state=active]:shadow-sm">ตารางไซส์</TabsTrigger>
              <TabsTrigger value="care" className="flex-1 min-w-[72px] rounded-xl font-medium text-xs sm:text-base h-full data-[state=active]:shadow-sm">การดูแล</TabsTrigger>
              <TabsTrigger value="estimator" className="flex-1 min-w-[80px] rounded-xl font-medium text-xs sm:text-base h-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> คำนวณราคา
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-6 border border-gray-100 rounded-3xl mt-4 bg-white shadow-sm">
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">{product.description || "ไม่มีรายละเอียดสินค้า"}</p>
            </TabsContent>
            
            <TabsContent value="size" className="p-6 border border-gray-100 rounded-3xl mt-4 bg-white shadow-sm overflow-hidden">
              {product.size_guide && Object.keys(product.size_guide).length > 0 ? (() => {
                const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
                const entries = Object.entries(product.size_guide as Record<string, Record<string, number>>)
                  .sort(([a], [b]) => {
                    const ai = SIZE_ORDER.indexOf(a), bi = SIZE_ORDER.indexOf(b);
                    if (ai === -1 && bi === -1) return a.localeCompare(b);
                    if (ai === -1) return 1;
                    if (bi === -1) return -1;
                    return ai - bi;
                  });
                if (entries.length === 0) return <p className="text-sm text-gray-400">ไม่มีข้อมูลตารางไซส์</p>;
                const measureKeys = Object.keys(entries[0][1] || {});
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="p-4 font-bold text-gray-700 uppercase">Size</th>
                          {measureKeys.map(k => <th key={k} className="p-4 font-bold text-gray-700">{k} (นิ้ว)</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entries.map(([size, measures]) => (
                          <tr key={size} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-semibold">{size}</td>
                            {measureKeys.map(k => <td key={k} className="p-4">{measures[k] ?? '-'}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })() : (
                <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="p-4 font-bold text-gray-700 uppercase">Size</th>
                            <th className="p-4 font-bold text-gray-700">อก (นิ้ว)</th>
                            <th className="p-4 font-bold text-gray-700">ยาว (นิ้ว)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50/50 transition-colors"><td className="p-4 font-semibold">S</td><td className="p-4">32</td><td className="p-4">26</td></tr>
                        <tr className="hover:bg-gray-50/50 transition-colors"><td className="p-4 font-semibold">M</td><td className="p-4">36</td><td className="p-4">27</td></tr>
                        <tr className="hover:bg-gray-50/50 transition-colors"><td className="p-4 font-semibold">L</td><td className="p-4">40</td><td className="p-4">28</td></tr>
                        <tr className="hover:bg-gray-50/50 transition-colors"><td className="p-4 font-semibold">XL</td><td className="p-4">44</td><td className="p-4">29</td></tr>
                    </tbody>
                 </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="care" className="p-6 border border-gray-100 rounded-3xl mt-4 bg-white shadow-sm">
              {product.care_instructions ? (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.care_instructions}</p>
              ) : (
                <p className="text-sm text-gray-400">ไม่มีข้อมูลการดูแลรักษา</p>
              )}
            </TabsContent>

            <TabsContent value="estimator" className="p-6 border border-gray-100 rounded-3xl mt-4 bg-white shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">เครื่องมือประเมินราคาเบื้องต้น</h3>
                        <p className="text-sm text-gray-500">ช่วยคุณวางแผนงบประมาณ</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label className="text-sm font-semibold text-gray-700">จำนวนที่ต้องการ (ชิ้น)</Label>
                    <Input
                       type="number"
                       min={1}
                       value={quantity}
                       onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                       className="bg-gray-50 border-gray-200 rounded-xl h-12 text-lg focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">สีเสื้อ</Label>
                    <Select value={estColor} onValueChange={(v) => setEstColor(v as 'White' | 'Black')}>
                      <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="White">ขาว (White)</SelectItem>
                        <SelectItem value="Black">ดำ (Black)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">ไซส์ประเมินราคา</Label>
                    <Select value={estSize || product.available_sizes?.[0] || ''} onValueChange={setEstSize}>
                      <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12"><SelectValue placeholder="เลือกไซส์" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {(product.available_sizes ?? []).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">พิมพ์ด้านหน้า</Label>
                    <Select value={frontTier} onValueChange={setFrontTier}>
                      <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">ไม่พิมพ์</SelectItem>
                        {Object.entries(TIER_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">พิมพ์ด้านหลัง</Label>
                    <Select value={backTier} onValueChange={setBackTier}>
                      <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">ไม่พิมพ์</SelectItem>
                        {Object.entries(TIER_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {estError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 flex items-center gap-2 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>{estError}</p>
                    </div>
                )}

                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-2 border-gray-200 hover:border-primary/50 hover:bg-gray-50 font-bold text-gray-700 transition-all"
                  onClick={handleEstimate}
                  disabled={estLoading || !selectedMethodId}
                >
                  {estLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Calculator className="w-5 h-5 mr-2" />}
                  ประเมินราคาสำหรับ {quantity} ชิ้น
                </Button>

                {estResult && (
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3 mt-4">
                    <div className="flex justify-between text-gray-600">
                      <span>ราคาเสื้อ</span>
                      <span className="font-medium">฿{estResult.shirt_per_unit.toLocaleString()} / ชิ้น</span>
                    </div>
                    {estResult.front_print_per_unit > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>สกรีนด้านหน้า</span>
                        <span className="font-medium">฿{estResult.front_print_per_unit.toLocaleString()} / ชิ้น</span>
                      </div>
                    )}
                    {estResult.back_print_per_unit > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>สกรีนด้านหลัง</span>
                        <span className="font-medium">฿{estResult.back_print_per_unit.toLocaleString()} / ชิ้น</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-3 mt-1">
                      <span>รวมต่อชิ้น</span>
                      <span className="text-primary text-xl">฿{estResult.total_per_unit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-black text-gray-900 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-2 items-center">
                      <span>ยอดรวมทั้งสิ้น ({quantity} ชิ้น)</span>
                      <span className="text-primary text-2xl">฿{estResult.total.toLocaleString()}</span>
                    </div>
                  </div>
                )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
