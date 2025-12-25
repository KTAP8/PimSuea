import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fabric } from "fabric";
import { getProductTemplates } from "@/services/api";
import type { ProductTemplate } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FontPicker } from "@/components/FontPicker";
import WebFont from "webfontloader";
import { ArrowLeft, Loader2, Upload, Type, Trash2, ZoomIn, ZoomOut, Hand, MousePointer2, RotateCcw, Bold, Italic, Underline, Minus, Plus, Undo2, Redo2, Layers, ChevronUp, ChevronDown } from "lucide-react";

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
  const [, forceUpdate] = useState({}); // Function to trigger re-render
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  // Layer State
  const [layers, setLayers] = useState<fabric.Object[]>([]); // Top to Bottom list

  // Refs for reliable access inside Event Listeners (Stale Closure Fix)
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const isHistoryLocked = useRef(false);

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

      // 2. Setup Bounds Ref
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
        
        const clipRect = new fabric.Rect({
            left: scaledLeft,
            top: scaledTop,
            width: scaledWidth,
            height: scaledHeight,
            absolutePositioned: true, 
        });
        clipPathRef.current = clipRect;
      }
      
      const initHistory = () => {
          if (!isHistoryLocked.current) {
               const json = JSON.stringify(newCanvas.toJSON(['name', 'selectable', 'evented', 'id']));
               
               // Set Refs
               historyStack.current = [json];
               historyIndex.current = 0;

               // Sync State
               setHistory([json]);
               setHistoryStep(0);
          }
      };

      // 3. Execute Load Strategy
      if (currentTemplate && savedDesigns.current[currentTemplate.id]) {
           // PATH A: Restore
           newCanvas.loadFromJSON(savedDesigns.current[currentTemplate.id], () => {
               newCanvas.setWidth(finalWidth);
               newCanvas.setHeight(finalHeight);
               applyConstraints(newCanvas);
               newCanvas.renderAll();
               initHistory();
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
           }
           
           applyConstraints(newCanvas);
           newCanvas.renderAll();
           newCanvas.calcOffset();
           initHistory();
      }

      // 4. Bind History Events (After Init)
      const onHistoryChange = () => {
         if (isHistoryLocked.current) return;
         const json = JSON.stringify(newCanvas.toJSON(['name', 'selectable', 'evented', 'id']));
         
         // Logic using Mutable Refs to avoid Stale Closures
         const currentHistory = historyStack.current;
         const currentIndex = historyIndex.current;
         
         // Slice forward history if we are in middle
         const newHistory = currentHistory.slice(0, currentIndex + 1);
         newHistory.push(json);
         
         // Update Refs
         historyStack.current = newHistory;
         historyIndex.current = newHistory.length - 1;
         
         // Sync State (for UI)
         setHistory([...newHistory]);
         setHistoryStep(newHistory.length - 1);
         updateLayers();
      };
      
      const updateLayers = () => {
          if (!newCanvas) return;
          // Filter out static_bg, reference only
          // We want Top -> Bottom for the UI list
          const objs = newCanvas.getObjects().filter(o => o.name !== 'static_bg').reverse();
          setLayers([...objs]);
      };

      // Defer attachment slightly to avoid initial triggers? 
      // Actually standard binding is fine because initHistory sets initial state, 
      // and subsequent 'add' events should trigger new history.
      // BUT 'loadFromJSON' might trigger 'object:added' which we want to ignore (locked).
      // 'img.add' in Fresh Load triggers 'object:added'. We want that in initial state? 
      // We manually called initHistory().
      // If we attach listeners NOW, will they fire for existing objects? No, listeners fire on Future events.
      // So this is safe.

      newCanvas.on('object:added', onHistoryChange);
      newCanvas.on('object:modified', onHistoryChange);
      newCanvas.on('object:removed', onHistoryChange);
      
      // Initial Layer Set
      updateLayers();

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
            fabricRef.current.fire('object:modified', { target: selectedObject }); // Trigger History
            forceUpdate({}); // Trigger UI Update
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
                    fabricRef.current.fire('object:modified', { target: selectedObject }); // Trigger History
                    forceUpdate({}); // Trigger UI Update
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

  // Text Formatting Helpers
  const toggleBold = () => {
    if (!fabricRef.current || !selectedObject || selectedObject.type !== 'i-text') return;
    const obj = selectedObject as fabric.IText;
    obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
    fabricRef.current.requestRenderAll();
    fabricRef.current.fire('object:modified', { target: obj });
    forceUpdate({});
  };

  const toggleItalic = () => {
    if (!fabricRef.current || !selectedObject || selectedObject.type !== 'i-text') return;
    const obj = selectedObject as fabric.IText;
    obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
    fabricRef.current.requestRenderAll();
    fabricRef.current.fire('object:modified', { target: obj });
    forceUpdate({});
  };

  const toggleUnderline = () => {
    if (!fabricRef.current || !selectedObject || selectedObject.type !== 'i-text') return;
    const obj = selectedObject as fabric.IText;
    obj.set('underline', !obj.underline);
    fabricRef.current.requestRenderAll();
    fabricRef.current.fire('object:modified', { target: obj });
    forceUpdate({});
  };

  const changeFontSize = (delta: number) => {
      if (!fabricRef.current || !selectedObject || selectedObject.type !== 'i-text') return;
      const obj = selectedObject as fabric.IText;
      const currentSize = obj.fontSize || 30;
      obj.set('fontSize', Math.max(5, currentSize + delta));
      fabricRef.current.requestRenderAll();
      fabricRef.current.fire('object:modified', { target: obj });
      forceUpdate({});
  };

  const changeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!fabricRef.current || !selectedObject) return;
      selectedObject.set('fill', e.target.value);
      fabricRef.current.requestRenderAll();
      fabricRef.current.fire('object:modified', { target: selectedObject });
      forceUpdate({});
  };

  // Undo / Redo
  const undo = () => {
      // Use Ref for Logic
      if (historyIndex.current <= 0) return;
      
      isHistoryLocked.current = true;
      const prevIndex = historyIndex.current - 1;
      const json = historyStack.current[prevIndex];
      
      if (fabricRef.current) {
          fabricRef.current.loadFromJSON(JSON.parse(json), () => {
              fabricRef.current?.renderAll();
              
              // Verify constraints after undo
              // applyConstraints(fabricRef.current!); // Already applied to canvas instance
              
              isHistoryLocked.current = false;
              
              // Updates Refs & State
              historyIndex.current = prevIndex;
              setHistoryStep(prevIndex);
          });
      }
  };

  const redo = () => {
      // Use Ref for Logic
      if (historyIndex.current >= historyStack.current.length - 1) return;
      
      isHistoryLocked.current = true;
      const nextIndex = historyIndex.current + 1;
      const json = historyStack.current[nextIndex];
      
      if (fabricRef.current) {
          fabricRef.current.loadFromJSON(JSON.parse(json), () => {
              fabricRef.current?.renderAll();
              isHistoryLocked.current = false;
              
              // Updates Refs & State
              historyIndex.current = nextIndex;
              setHistoryStep(nextIndex);
          });
      }
  };
  

  
  // Layer Management
  const moveLayerUp = (obj: fabric.Object, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!fabricRef.current) return;
      fabricRef.current.bringForward(obj);
      // Trigger update
      fabricRef.current.fire('object:modified'); // Triggers history & layer update
      // But history listener also calls updateLayers, so we are good? 
      // Wait, explicit layer update might be faster for UI if history is locked?
      // No, history listener calls updateLayers.
      // BUT bringForward does NOT trigger 'object:modified' by default? 
      // We need to verify. Usually it doesn't. 
      // So we should manually update layers or trigger event.
      // Let's manually trigger our loop
      forceUpdate({}); 
      // Actually, we need to re-fetch the list from canvas to get new order.
      // updateLayers is defined inside useEffect, not accessible here.
      // So we should duplicate the logic or extract it.
      // Let's just setState here since we have ref access? No, we don't have the updateLayers function.
      // Better: trigger a custom event or just manually set state.
      
      const canvas = fabricRef.current;
      const objs = canvas.getObjects().filter(o => o.name !== 'static_bg').reverse();
      setLayers([...objs]);
      
      // Also save history? Layer reordering IS a change.
      // So yes, let's fire history manually.
      // We can use the 'history' logic... but it is inside useEffect?
      // No, we can just fire 'object:modified' via canvas.
      canvas.fire('object:modified', { target: obj });
  };

  const moveLayerDown = (obj: fabric.Object, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!fabricRef.current) return;
      
      // Prevent going behind background
      // Objects list: [bg, obj1, obj2...]
      // Index of obj must be > 1 to move down (index 0 is bg).
      const canvas = fabricRef.current;
      const allObjs = canvas.getObjects();
      const index = allObjs.indexOf(obj);
      
      // Assuming static_bg is at index 0.
      if (index <= 1) return; // Can't move below first object (if bg is 0, obj at 1 cannot go to 0)
      
      fabricRef.current.sendBackwards(obj);
      
      const objs = canvas.getObjects().filter(o => o.name !== 'static_bg').reverse();
      setLayers([...objs]);
      canvas.fire('object:modified', { target: obj });
  };
  
  const selectLayer = (obj: fabric.Object) => {
      if (!fabricRef.current) return;
      fabricRef.current.setActiveObject(obj);
      fabricRef.current.renderAll();
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
            
            {currentTemplate && (
                    <span className="text-sm font-medium text-gray-900 border px-3 py-1 rounded-full bg-gray-50">
                        มุมมอง: {
                            currentTemplate.side.toLowerCase().includes('front') ? 'ด้านหน้า' :
                            currentTemplate.side.toLowerCase().includes('back') ? 'ด้านหลัง' :
                            currentTemplate.side
                        }
                    </span>
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
                <span className="text-xs text-gray-500 font-medium">ข้อความ</span>
            </div>
        </aside>

        {/* CENTER WORKSPACE */}
        <main className="flex-1 bg-gray-100 relative flex items-center justify-center overflow-auto p-8" ref={containerRef}>
            {/* Canvas Container
                We force a min-height to ensure it is visible even if image fails
             */}
            <div className="relative shadow-2xl bg-white min-h-[500px] min-w-[500px]">
                <canvas ref={canvasRef} />
            </div>

            {/* CONTEXT FLOATING TOOLBAR (Below Header) */}
            {selectedObject && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white p-2 rounded-xl shadow-xl flex items-center gap-2 border z-30 animate-in slide-in-from-top-2">
                    
                    {/* Font Picker for Text Objects */}
                    {selectedObject.type === 'i-text' && (
                        <>
                            <FontPicker 
                                currentFont={(selectedObject as fabric.IText).fontFamily || 'sans-serif'} 
                                onFontSelect={handleFontChange} 
                            />
                            
                            <div className="w-px h-6 bg-gray-200 mx-1" />

                            {/* Size */}
                            <div className="flex items-center bg-gray-100 rounded-md">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeFontSize(-1)}>
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-xs font-medium w-6 text-center">
                                    {(selectedObject as fabric.IText).fontSize}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeFontSize(1)}>
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                            
                            <div className="w-px h-6 bg-gray-200 mx-1" />

                            {/* Color */}
                           <div className="relative group">
                                <div className="w-8 h-8 rounded-full border shadow-sm cursor-pointer overflow-hidden relative">
                                    <input 
                                        type="color" 
                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer opacity-0" 
                                        value={(selectedObject.fill as string) || '#000000'}
                                        onChange={changeColor}
                                    />
                                    <div 
                                        className="w-full h-full" 
                                        style={{ backgroundColor: (selectedObject.fill as string) || '#000000' }} 
                                    />
                                </div>
                            </div>
                            
                            <div className="w-px h-6 bg-gray-200 mx-1" />

                            {/* Formatting Toggles */}
                            <Button 
                                variant={(selectedObject as fabric.IText).fontWeight === 'bold' ? 'default' : 'ghost'} 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={toggleBold}
                            >
                                <Bold className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant={(selectedObject as fabric.IText).fontStyle === 'italic' ? 'default' : 'ghost'} 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={toggleItalic}
                            >
                                <Italic className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant={(selectedObject as fabric.IText).underline ? 'default' : 'ghost'} 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={toggleUnderline}
                            >
                                <Underline className="w-4 h-4" />
                            </Button>
                            
                            <div className="w-px h-6 bg-gray-200 mx-1" />
                        </>
                    )}

                    {/* Delete Object (Icon Only) */}
                    <Button variant="destructive" size="icon" onClick={deleteSelected} title="ลบวัตถุ">
                        <Trash2 className="w-5 h-5" />
                    </Button>
                </div>
            )}

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

            {/* LAYERS PANEL (Floating Right) */}
            <div className="absolute top-20 right-6 w-48 bg-white p-3 rounded-lg shadow-xl border z-20 flex flex-col gap-3 max-h-[60vh]">
                <div className="flex items-center gap-2 text-gray-700 pb-2 border-b">
                     <Layers className="w-4 h-4" />
                     <span className="text-sm font-bold">เลเยอร์ ({layers.length})</span>
                </div>
                
                <div className="flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin">
                    {layers.length === 0 && (
                        <div className="text-center text-xs text-gray-400 py-4">
                            ยังไม่มีวัตถุ
                        </div>
                    )}
                    {layers.map((obj, i) => (
                        <div 
                            key={i} 
                            onClick={() => selectLayer(obj)}
                            className={`flex items-center justify-between p-2 rounded-md border cursor-pointer text-xs group transition-colors ${
                                selectedObject === obj ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                {obj.type === 'image' ? (
                                    <img 
                                        src={(obj as fabric.Image).getSrc()} 
                                        alt="layer" 
                                        className="w-8 h-8 rounded object-cover border bg-gray-100"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 border">
                                        <Type className="w-4 h-4" />
                                    </div>
                                )}
                                <span className="truncate max-w-[80px]">
                                    {obj.type === 'i-text' ? (obj as fabric.IText).text : 'รูปภาพ'}
                                </span>
                            </div>
                            
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    className="p-1 hover:bg-gray-200 rounded"
                                    onClick={(e) => moveLayerUp(obj, e)}
                                    title="Move Up"
                                    disabled={i === 0} // Top of list (remember list is reversed)
                                >
                                    <ChevronUp className="w-3 h-3" />
                                </button>
                                <button 
                                    className="p-1 hover:bg-gray-200 rounded"
                                    onClick={(e) => moveLayerDown(obj, e)}
                                    title="Move Down"
                                    disabled={i === layers.length - 1} // Bottom of list
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Zoom & Pan Toolbar (Bottom Left - Horizontal) */}
            <div className="absolute bottom-6 left-6 bg-white p-2 rounded-lg shadow-lg flex items-center gap-2 border z-20">
                <div 
                    onClick={() => setIsPanning(!isPanning)}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${isPanning ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
                    title={isPanning ? "Switch to Select Mode" : "Switch to Pan Mode"}
                >
                    {isPanning ? <Hand className="w-5 h-5" /> : <MousePointer2 className="w-5 h-5" />}
                </div>
                
                <div className="w-px h-6 bg-gray-200" />
                
                <button 
                    onClick={() => handleZoom(1.1)}
                    className="p-2 hover:bg-gray-100 rounded-md text-gray-700"
                    title="Zoom In"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <div className="text-center text-[10px] text-gray-400 font-mono w-8">
                    {Math.round(zoomLevel * 100)}%
                </div>
                <button 
                    onClick={() => handleZoom(0.9)}
                    className="p-2 hover:bg-gray-100 rounded-md text-gray-700"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                
                <div className="w-px h-6 bg-gray-200" />
                
                <button 
                    onClick={resetView}
                    className="p-2 hover:bg-gray-100 rounded-md text-gray-700"
                    title="Reset View"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Undo / Redo Toolbar (Top Left) */}
            <div className="absolute top-6 left-6 bg-white p-2 rounded-lg shadow-lg flex items-center gap-1 border z-20">
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={undo} 
                    disabled={historyStep <= 0}
                    className={historyStep <= 0 ? "opacity-30" : ""}
                 >
                    <Undo2 className="w-5 h-5" />
                 </Button>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={redo} 
                    disabled={historyStep >= history.length - 1}
                    className={historyStep >= history.length - 1 ? "opacity-30" : ""}
                 >
                    <Redo2 className="w-5 h-5" />
                 </Button>
            </div>

        </main>
      </div>
    </div>
  );
}