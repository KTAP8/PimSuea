import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fabric } from "fabric";
import { getProductTemplates } from "@/services/api";
import type { ProductTemplate } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FontPicker } from "@/components/FontPicker";
import WebFont from "webfontloader";
import { ArrowLeft, Loader2, Upload, Type, Trash2, ZoomIn, ZoomOut, Hand, MousePointer2, RotateCcw } from "lucide-react";

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
  const [isPanning, setIsPanning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Panning Refs
  const isDragging = useRef(false);
  const lastPosX = useRef(0);
  const lastPosY = useRef(0);
  
  // State Persistence
  const savedDesigns = useRef<Record<string, object>>({});
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(['sans-serif']));

  // Constraints Helper
  const applyConstraints = (canvas: fabric.Canvas) => {
     canvas.on('object:moving', (e) => {
         const obj = e.target;
         if (!obj || !printZoneBoundsRef.current) return;
         
         // Ignore if static background
         if (obj.name === 'static_bg') return;

         const bounds = printZoneBoundsRef.current;
         const objWidth = (obj.width || 0) * (obj.scaleX || 1);
         const objHeight = (obj.height || 0) * (obj.scaleY || 1);

         // Basic clamping logic - keep center within bounds (or edges, depending on preference)
         // Strict: Keep the entire object inside
         // Loose: Keep center inside
         // Let's go with "Center must be inside" for better UX, or "Edges clamped"
         // Implementing Edge Clamping:
         let left = obj.left || 0;
         let top = obj.top || 0;
         
         // Adjust based on origin (assuming center origin for simplicity in logic, but Fabric defaults vary)
         // Fabric default origin is usually top/left unless changed.
         // In addText/addImage we set originX/Y to 'center'.
         
         // If origin is center:
         if (obj.originX === 'center') {
             if (left < bounds.left) left = bounds.left;
             if (left > bounds.left + bounds.width) left = bounds.left + bounds.width;
         } else {
             if (left < bounds.left) left = bounds.left;
             if (left + objWidth > bounds.left + bounds.width) left = bounds.left + bounds.width - objWidth;
         }
         
         if (obj.originY === 'center') {
             if (top < bounds.top) top = bounds.top;
             if (top > bounds.top + bounds.height) top = bounds.top + bounds.height;
         } else {
             if (top < bounds.top) top = bounds.top;
             if (top + objHeight > bounds.top + bounds.height) top = bounds.top + bounds.height - objHeight;
         }
         
         obj.set({ left, top });
     });
  };

  const saveCurrentCanvas = () => {
      if (fabricRef.current && currentTemplate) {
          console.log("Saving design for:", currentTemplate.id);
          // Include everything, including background
          savedDesigns.current[currentTemplate.id] = fabricRef.current.toJSON(['name', 'selectable', 'evented']);
      }
  };


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

    // ZOOM & PAN Event Listeners
    newCanvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = newCanvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 5) zoom = 5;
        if (zoom < 0.1) zoom = 0.1;
        
        // Zoom to point
        newCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        setZoomLevel(zoom);
        
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });






    fabric.Image.fromURL(currentTemplate.image_url, (img) => {
      if (!img.width || !img.height || !fabricRef.current) return;

      // 1. Calculate Scale
      const scaleX = TARGET_WIDTH / img.width;
      const scaleY = TARGET_HEIGHT / img.height;
      const scaleFactor = Math.min(scaleX, scaleY, 1) * 0.95;

      const finalWidth = img.width * scaleFactor;
      const finalHeight = img.height * scaleFactor;

      // 2. Setup Bounds Ref (ALWAYS needed for constraints/tools)
      if (currentTemplate.print_area_config) {
        const { x, y, width: w, height: h } = currentTemplate.print_area_config;
        const scaledLeft = x * scaleFactor;
        const scaledTop = y * scaleFactor;
        const scaledWidth = w * scaleFactor;
        const scaledHeight = h * scaleFactor;

        printZoneBoundsRef.current = { 
            left: scaledLeft, 
            top: scaledTop, 
            width: scaledWidth, 
            height: scaledHeight 
        };
        
        // We also need the ClipRect REF for *new* objects
        const clipRect = new fabric.Rect({
            left: scaledLeft,
            top: scaledTop,
            width: scaledWidth,
            height: scaledHeight,
            absolutePositioned: true, 
        });
        clipPathRef.current = clipRect;
      }
      
      // 3. Execute Load Strategy
      if (currentTemplate && savedDesigns.current[currentTemplate.id]) {
           // PATH A: Restore
           newCanvas.loadFromJSON(savedDesigns.current[currentTemplate.id], () => {
               newCanvas.setWidth(finalWidth);
               newCanvas.setHeight(finalHeight);
               applyConstraints(newCanvas);
               newCanvas.renderAll();
           });
      } else {
           // PATH B: Fresh Load
           newCanvas.setWidth(finalWidth);
           newCanvas.setHeight(finalHeight);
           
           img.set({
             originX: 'left',
             originY: 'top',
             left: 0,
             top: 0,
             scaleX: scaleFactor,
             scaleY: scaleFactor,
             selectable: false, 
             evented: false,
             name: 'static_bg', 
           });
           newCanvas.add(img);
           newCanvas.sendToBack(img);

           if (printZoneBoundsRef.current) {
                // Add Visual Zone
                const visualZone = new fabric.Rect({
                  left: printZoneBoundsRef.current.left,
                  top: printZoneBoundsRef.current.top,
                  width: printZoneBoundsRef.current.width,
                  height: printZoneBoundsRef.current.height,
                  fill: 'transparent',
                  stroke: '#ef4444', 
                  strokeWidth: 2,
                  strokeDashArray: [10, 5],
                  selectable: false,
                  evented: false,
                  name: 'static_bg', 
                });
                newCanvas.add(visualZone);
                
                // Note: clipping is applied to individual objects, so we don't add the clipRect to canvas
           }
           
           applyConstraints(newCanvas);
           newCanvas.renderAll();
           newCanvas.calcOffset();
      }

    }); 

    return () => {
      // Auto-save on unmount? Or just cleanup.
      // User asked to save on *Switch*, not necessarily on unmount, but good practice maybe?
      // But we can't easily save safely in cleanup if canvas is disposing.
      // We rely on the Button Click handler for saving.
      
      newCanvas.dispose();
      fabricRef.current = null;
    };

  }, [currentTemplate]);

  // ------------------------------------------------------------------
  // 3.5 Zoom & Pan Logic (Attached separately to avoid Canvas recreation)
  // ------------------------------------------------------------------
  useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Update Cursor
      canvas.defaultCursor = isPanning ? 'grab' : 'default';
      canvas.hoverCursor = isPanning ? 'grab' : 'move';
      
      // Toggle Selection
      canvas.selection = !isPanning;
      canvas.forEachObject((obj) => {
          if (obj.name === 'static_bg') {
              // Always keep background locked
              obj.selectable = false;
              obj.evented = false;
          } else {
              // Toggle others based on mode
              obj.selectable = !isPanning;
              obj.evented = !isPanning;
          }
      });
      canvas.requestRenderAll();

      // Handlers
      const onMouseDown = (opt: fabric.IEvent) => {
          if (isPanning) {
              const evt = opt.e as MouseEvent;
              isDragging.current = true;
              canvas.selection = false;
              lastPosX.current = evt.clientX;
              lastPosY.current = evt.clientY;
              canvas.defaultCursor = 'grabbing';
              canvas.requestRenderAll();
          }
      };

      const onMouseMove = (opt: fabric.IEvent) => {
          if (isPanning && isDragging.current) {
              const evt = opt.e as MouseEvent;
              const vpt = canvas.viewportTransform;
              if (!vpt) return;
              
              vpt[4] += evt.clientX - lastPosX.current;
              vpt[5] += evt.clientY - lastPosY.current;
              
              canvas.requestRenderAll();
              lastPosX.current = evt.clientX;
              lastPosY.current = evt.clientY;
          }
      };

      const onMouseUp = () => {
          if (isPanning) {
              canvas.setViewportTransform(canvas.viewportTransform!); // commit
              isDragging.current = false;
              canvas.defaultCursor = 'grab';
              canvas.requestRenderAll();
          }
      };

      // Bind
      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:up', onMouseUp);

      return () => {
          // Unbind
          canvas.off('mouse:down', onMouseDown);
          canvas.off('mouse:move', onMouseMove);
          canvas.off('mouse:up', onMouseUp);
          
          // Reset Object Interactability when leaving pan mode
          canvas.forEachObject((obj) => {
             // Only unlock objects that are NOT static backgrounds
             if (obj.name !== 'static_bg') {
                obj.selectable = true;
                obj.evented = true;
             }
          });
      };
  }, [isPanning]);

  const handleZoom = (factor: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      let zoom = canvas.getZoom();
      zoom *= factor; // Multiply for smooth steps
      if (zoom > 5) zoom = 5;
      if (zoom < 0.1) zoom = 0.1;

      // Zoom to center
      const center = canvas.getCenter();
      canvas.zoomToPoint({ x: center.left, y: center.top }, zoom);
      setZoomLevel(zoom);
  };

  const resetView = () => {
       const canvas = fabricRef.current;
       if (!canvas) return;
       
       canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); // Reset to identity
       setZoomLevel(1);
       
       // Optionally re-center content if needed, but identity usually puts 0,0 at top-left
       // If we want to "Fit to Screen" like initial load:
       // We might need to store the initial scale/pan calculated in the first useEffect.
       // For now, identity is a good "True Reset". 
       // Better user experience: Reset to the "Fit" state.
       // To do that, we'd need to re-run the "Fit" logic or store those values.
       // Let's stick to Identity + Zoom 1 for "True Reset" or logic to re-center image.
       
       // Let's try to just re-center the main image
       // Simple approach: setZoom(1) and pan to center (0,0) implied by identity.
  };




  // ------------------------------------------------------------------
  // 4. Tools Logic
  // ------------------------------------------------------------------

  // Handle Font Change
  const handleFontChange = (fontFamily: string) => {
    if (!fabricRef.current || !selectedObject) return;
    
    // 1. Check if already loaded
    if (loadedFonts.has(fontFamily)) {
        if (selectedObject.type === 'i-text') {
            (selectedObject as fabric.IText).set('fontFamily', fontFamily);
            fabricRef.current.requestRenderAll();
        }
        return;
    }

    // 2. Load Font via WebFontLoader
    WebFont.load({
        google: {
            families: [fontFamily]
        },
        active: () => {
            // Success
            if (selectedObject && fabricRef.current) {
                if (selectedObject.type === 'i-text') {
                    (selectedObject as fabric.IText).set('fontFamily', fontFamily);
                    fabricRef.current.requestRenderAll();
                }
                
                // Add to loaded Set
                setLoadedFonts(prev => new Set(prev).add(fontFamily));
            }
        },
        inactive: () => {
            console.error(`Could not load font: ${fontFamily}`);
        }
    });
  };
  
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
                    <span className="text-sm font-bold text-blue-600 mr-2">
                        กำลังแก้ไข: {selectedObject.type === 'i-text' ? 'ข้อความ' : 'รูปภาพ'}
                    </span>
                    
                    {/* Font Picker for Text Objects */}
                    {selectedObject.type === 'i-text' && (
                        <div className="mr-2">
                            <FontPicker 
                                currentFont={(selectedObject as fabric.IText).fontFamily || 'sans-serif'} 
                                onFontSelect={handleFontChange} 
                            />
                        </div>
                    )}

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
                            onClick={() => {
                                saveCurrentCanvas();
                                setCurrentTemplate(t);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                currentTemplate?.id === t.id ? 'bg-black text-white' : 'hover:bg-gray-100'
                            }`}
                        >
                            {getThaiSide(t.side)}
                        </button>
                    );
                })}

            </div>

            {/* Zoom & Pan Toolbar */}
            <div className="absolute bottom-6 right-6 bg-white p-2 rounded-lg shadow-lg flex flex-col gap-2 border z-20">
                <div 
                    onClick={() => setIsPanning(!isPanning)}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${isPanning ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
                    title={isPanning ? "Switch to Select Mode" : "Switch to Pan Mode"}
                >
                    {isPanning ? <Hand className="w-5 h-5" /> : <MousePointer2 className="w-5 h-5" />}
                </div>
                
                <div className="h-px bg-gray-200" />
                
                <button 
                    onClick={() => handleZoom(1.1)}
                    className="p-2 hover:bg-gray-100 rounded-md text-gray-700"
                    title="Zoom In"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <div className="text-center text-[10px] text-gray-400 font-mono">
                    {Math.round(zoomLevel * 100)}%
                </div>
                <button 
                    onClick={() => handleZoom(0.9)}
                    className="p-2 hover:bg-gray-100 rounded-md text-gray-700"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                
                <div className="h-px bg-gray-200" />
                
                <button 
                    onClick={resetView}
                    className="p-2 hover:bg-gray-100 rounded-md text-gray-700"
                    title="Reset View"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

        </main>
      </div>
    </div>
  );
}