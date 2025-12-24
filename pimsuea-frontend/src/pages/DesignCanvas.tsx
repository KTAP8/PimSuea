import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fabric } from "fabric";
import { getProductTemplates } from "@/services/api";
import type { ProductTemplate } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Upload, Type, Trash2 } from "lucide-react";

export default function DesignCanvas() {
  const { id } = useParams();
  
  
  // Refs & State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // To measure available space
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const clipPathRef = useRef<fabric.Rect | null>(null); // Store the clipping rect
  const printZoneBoundsRef = useRef<{ left: number, top: number, width: number, height: number } | null>(null); // To center objects
  
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<ProductTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tools State
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  // ------------------------------------------------------------------
  // 1. Fetch Templates
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchTemplates = async () => {
      console.log("RENDER DesignCanvas | ID:", id);
      if (!id) return;
      try {
        const data = await getProductTemplates(id);
        setTemplates(data);
        if (data.length > 0) setCurrentTemplate(data[0]);
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [id]);

  // ------------------------------------------------------------------
  // COMBINED: Initialize Canvas & Load Template (Alignment Fix)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current || !currentTemplate) return;

    if (fabricRef.current) {
      fabricRef.current.dispose();
    }

    // 1. Measure Container & Safety buffer
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 800;
    const TARGET_WIDTH = containerWidth - 60; 
    const TARGET_HEIGHT = containerHeight - 60;

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      preserveObjectStacking: true, // Crucial for layering
      selection: true,
    });

    fabricRef.current = newCanvas;

    // Event Listeners
    newCanvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
    newCanvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
    newCanvas.on('selection:cleared', () => setSelectedObject(null));

    // Load Image
    fabric.Image.fromURL(currentTemplate.image_url, (img) => {
      if (!img.width || !img.height || !fabricRef.current) return;

      // 1. Calculate Scale to Fit Screen
      // Only scale DOWN, don't scale up pixelated images, unless they are tiny
      const scaleX = TARGET_WIDTH / img.width;
      const scaleY = TARGET_HEIGHT / img.height;
      const scaleFactor = Math.min(scaleX, scaleY, 1) * 0.95; // 95% of available space

      const finalWidth = img.width * scaleFactor;
      const finalHeight = img.height * scaleFactor;

      // 2. Resize Canvas to match the Scaled Image exactly
      newCanvas.setWidth(finalWidth);
      newCanvas.setHeight(finalHeight);

      // 3. Add T-Shirt Image
      img.set({
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
        scaleX: scaleFactor,
        scaleY: scaleFactor,
        selectable: false, 
        evented: false,
        // Remove crossOrigin to allow loading from external non-CORS sources for display
      });
      newCanvas.add(img);
      newCanvas.sendToBack(img);

      // 4. Setup Print Zone & Clipping
      if (currentTemplate.print_area_config) {
        const { x, y, width: w, height: h } = currentTemplate.print_area_config;
        
        const scaledLeft = x * scaleFactor;
        const scaledTop = y * scaleFactor;
        const scaledWidth = w * scaleFactor;
        const scaledHeight = h * scaleFactor;

        // Store bounds for centering new objects later
        printZoneBoundsRef.current = { 
            left: scaledLeft, 
            top: scaledTop, 
            width: scaledWidth, 
            height: scaledHeight 
        };

        // A. Visual Visual Guide (Red Box)
        const visualZone = new fabric.Rect({
          left: scaledLeft,
          top: scaledTop,
          width: scaledWidth,
          height: scaledHeight,
          fill: 'transparent',
          stroke: '#ef4444', // Red-500
          strokeWidth: 2,
          strokeDashArray: [10, 5],
          selectable: false,
          evented: false,
        });
        newCanvas.add(visualZone);

        // B. Clipping Path Object (Invisible, Absolute Position)
        // We create a separate rect instance to use as the clipPath for objects
        const clipRect = new fabric.Rect({
            left: scaledLeft,
            top: scaledTop,
            width: scaledWidth,
            height: scaledHeight,
            absolutePositioned: true, // Critical for clipping to work relative to canvas
        });
        clipPathRef.current = clipRect;
      }

      newCanvas.renderAll();
      newCanvas.calcOffset(); 
    }); // Removed options object with crossOrigin

    return () => {
      newCanvas.dispose();
      fabricRef.current = null;
    };

  }, [currentTemplate]);


  // ------------------------------------------------------------------
  // 4. Tools Logic
  // ------------------------------------------------------------------
  
  // Add Text
  const addText = () => {
    // Check the REF, not the state
    if (!fabricRef.current) return; 
    
    // Default to center of canvas if no print zone, else center of print zone
    const bounds = printZoneBoundsRef.current;
    
    // Fallback centers
    const centerX = bounds ? bounds.left + bounds.width / 2 : fabricRef.current.width! / 2;
    const centerY = bounds ? bounds.top + bounds.height / 2 : fabricRef.current.height! / 2;

    const text = new fabric.IText("ข้อความของคุณ", {
      left: centerX,
      top: centerY,
      originX: 'center',
      originY: 'center',
      fontFamily: 'sans-serif',
      fill: '#000000',
      fontSize: 30, // Slightly smaller default
      clipPath: clipPathRef.current || undefined, // Apply Clipping!
    });
    
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll(); // Always manually render when using Refs
  };

  // Handle Image Upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check 'fabricRef.current' instead of 'fabricCanvas'
    if (!e.target.files || !e.target.files[0] || !fabricRef.current) return;
    
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setUploadedImages((prev) => [...prev, url]);

    addImageToCanvas(url);
  };

  // Add Uploaded Image to Canvas (from sidebar click)
  const addImageToCanvas = (url: string) => {
    if (!fabricRef.current) return;

    fabric.Image.fromURL(url, (img) => {
        if (!fabricRef.current) return;

        // Default to center of print zone
        const bounds = printZoneBoundsRef.current;
        const centerX = bounds ? bounds.left + bounds.width / 2 : fabricRef.current.width! / 2;
        const centerY = bounds ? bounds.top + bounds.height / 2 : fabricRef.current.height! / 2;
        
        // Scale down if too big for print zone
        if (bounds) {
             if (img.width! > bounds.width) {
                 img.scaleToWidth(bounds.width * 0.8);
             }
        } else {
             img.scaleToWidth(200);
        }

        img.set({
            left: centerX,
            top: centerY,
            originX: 'center',
            originY: 'center',
            clipPath: clipPathRef.current || undefined, // Apply Clipping!
        });

        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
        
        // IMPORTANT: Explicit re-render
        fabricRef.current.renderAll();
    });
  }

  // Delete Object
  const deleteSelected = () => {
     if (!fabricRef.current || !selectedObject) return;
     
     fabricRef.current.remove(selectedObject);
     fabricRef.current.discardActiveObject();
     
     // Update the React state so the "Delete" button disappears
     setSelectedObject(null); 
     
     // IMPORTANT: Explicit re-render
     fabricRef.current.renderAll();
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* HEADER */}
      <header className="h-16 bg-white border-b flex items-center px-4 justify-between z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
            <Link to={`/product/${id}`} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-bold text-lg hidden md:block">ห้องออกแบบสินค้า</h1>
            <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>
            
            {/* Context Aware Header Controls */}
            {selectedObject ? (
                 <div className="flex items-center gap-2 animate-in fade-in">
                    <span className="text-sm font-bold text-blue-600">
                        กำลังแก้ไข: {selectedObject.type === 'i-text' ? 'ข้อความ' : 'รูปภาพ'}
                    </span>
                    <Button variant="destructive" size="sm" onClick={deleteSelected}>
                        <Trash2 className="w-4 h-4 mr-2" /> ลบวัตถุ
                    </Button>
                 </div>
            ) : (
                currentTemplate && (
                    <span className="text-sm font-medium text-gray-900">
                        มุมมอง: {
                            currentTemplate.side.toLowerCase().includes('front') ? 'ด้านหน้า' :
                            currentTemplate.side.toLowerCase().includes('back') ? 'ด้านหลัง' :
                            currentTemplate.side
                        }
                    </span>
                )
            )}
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">บันทึกแบบร่าง</Button>
            <Button size="sm">เพิ่มลงตะกร้า</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TOOLBAR */}
        <aside className="w-20 bg-white border-r flex flex-col items-center py-4 gap-4 z-10 overflow-y-auto shrink-0">
            {/* Upload Tool */}
            <div className="flex flex-col items-center gap-1 cursor-pointer group relative">
                <label className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer">
                     <Upload className="w-5 h-5" />
                     <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                </label>
                <span className="text-[10px] text-gray-500 font-medium">อัปโหลด</span>
            </div>

            {/* Text Tool */}
            <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={addText}>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                     <Type className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">ข้อความ</span>
            </div>
            
            <hr className="w-10 border-gray-200" />

            {/* Uploaded Thumbnails */}
            {uploadedImages.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  className="w-12 h-12 object-cover rounded border hover:border-black cursor-pointer"
                  onClick={() => addImageToCanvas(url)}
                />
            ))}
        </aside>

        {/* CENTER WORKSPACE */}
        <main className="flex-1 bg-gray-100 relative flex items-center justify-center overflow-auto p-8" ref={containerRef}>
            {/* Canvas Container
                We force a min-height to ensure it is visible even if image fails
             */}
            <div className="relative shadow-2xl bg-white min-h-[500px] min-w-[500px]">
                <canvas ref={canvasRef} />
            </div>

            {/* View Switcher */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow-lg flex gap-2 border z-20">
                {templates.map(t => {
                    // Simple translation helper
                    const getThaiSide = (name: string) => {
                        const lower = name.toLowerCase();
                        if (lower.includes('front')) return 'ด้านหน้า';
                        if (lower.includes('back')) return 'ด้านหลัง';
                        if (lower.includes('left')) return 'ด้านซ้าย';
                        if (lower.includes('right')) return 'ด้านขวา';
                        return name;
                    };

                    return (
                        <button 
                            key={t.id}
                            onClick={() => setCurrentTemplate(t)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                currentTemplate?.id === t.id ? 'bg-black text-white' : 'hover:bg-gray-100'
                            }`}
                        >
                            {getThaiSide(t.side)}
                        </button>
                    );
                })}
            </div>
        </main>
      </div>
    </div>
  );
}