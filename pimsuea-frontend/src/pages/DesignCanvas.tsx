import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MD5 } from 'crypto-js';
import { fabric } from "fabric";
import { getProductTemplates } from "@/services/api";
import type { ProductTemplate, Color } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FontPicker } from "@/components/FontPicker";
import WebFont from "webfontloader";
import { ArrowLeft, Loader2, Upload, Type, Trash2, ZoomIn, ZoomOut, Hand, MousePointer2, RotateCcw, Bold, Italic, Underline, Minus, Plus, Undo2, Redo2, Layers, ChevronUp, ChevronDown, Save, Image as ImageIcon, X, CheckCircle2, AlertCircle, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { exportDesignForProduction } from "@/utils/canvasExporter";
import { useCart } from "@/contexts/CartContext";

import { getDesignById, updateDesign } from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSearchParams } from "react-router-dom";

export default function DesignCanvas() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const designId = searchParams.get('designId');
  // Support both cases
  const printingType = searchParams.get('printingType') || searchParams.get('printing_type'); 
  console.log("Captured Printing Type:", printingType); // DEBUG
  const navigate = useNavigate();
  
  // Design Name State
  const [designName, setDesignName] = useState('Untitled Design');
  
  
  // Refs & State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // To measure available space
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const clipPathRef = useRef<fabric.Rect | null>(null); // Store the clipping rect
  const printZoneBoundsRef = useRef<{ left: number, top: number, width: number, height: number } | null>(null); // To center objects
  
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<ProductTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------------
  // Color & Template Logic
  // ------------------------------------------------------------------
  // Compute available colors and organize templates
  const colors = Array.from(new Set(templates.map(t => t.color?.id))).filter(Boolean) as string[];
  const uniqueColors = colors.map(id => templates.find(t => t.color?.id === id)?.color).filter((c): c is Color => !!c);
  
  // State for current color
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [activeColorIds, setActiveColorIds] = useState<Set<string>>(new Set()); // User selected colors
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  // Initialize Color on Template Load
  useEffect(() => {
    if (templates.length > 0 && !selectedColorId) {
        // Prefer default template's color, or first one
        const defaultTemplate = templates.find(t => t.is_default) || templates[0];
        if (defaultTemplate?.color?.id) {
            setSelectedColorId(defaultTemplate.color.id);
            setActiveColorIds(new Set([defaultTemplate.color.id])); // Init with default color only
            
            // Also set initial template to Front view of this color if possible
            const frontTemplate = templates.find(t => 
                t.color?.id === defaultTemplate.color?.id && 
                t.side.toLowerCase() === 'front'
            );
            if (frontTemplate) {
                setCurrentTemplate(frontTemplate);
            } else {
                setCurrentTemplate(defaultTemplate);
            }
        }
    }
  }, [templates]);

  // Filter templates for current color and sort (Front first)
  const currentTemplates = templates
    .filter(t => t.color?.id === selectedColorId)
    .sort((a, b) => {
        const sideA = a.side.toLowerCase();
        const sideB = b.side.toLowerCase();
        if (sideA === 'front') return -1;
        if (sideB === 'front') return 1;
        return 0;
    });

  // Switch Color Handler
  const handleColorChange = (colorId: string) => {
      // 1. Save current state first (as normal)
      saveCurrentCanvas();
      
      // 2. Capture current design for persistence if side matches
      const currentSide = currentTemplate?.side;
      if (fabricRef.current && currentSide) {
          const json = fabricRef.current.toJSON(['name', 'selectable', 'evented']);
          // Filter out background image since that will change
          if (json.objects) {
             json.objects = json.objects.filter((o: any) => o.name !== 'static_bg' && o.name !== 'print_zone');
          }
           pendingDesignRef.current = { json, side: currentSide };
      }

      setSelectedColorId(colorId);
      
      // Try to find the same side in the new color
      const newTemplate = templates.find(t => t.color?.id === colorId && t.side === currentSide);
      
      // If found, switch to it. If not, switch to first available for that color.
      if (newTemplate) {
          setCurrentTemplate(newTemplate);
      } else {
          const firstForColor = templates.find(t => t.color?.id === colorId);
          if (firstForColor) setCurrentTemplate(firstForColor);
      }
  };


  
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  // Tools State
  // Ref to track if we are switching colors to persist design
  const pendingDesignRef = useRef<{ json: any, side: string } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [saving, setSaving] = useState(false);
  // isGenerating no longer needed for Add to Cart, but we use 'saving' for both now
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Cart State (Defaults for now)
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  
  // Image Library State
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [userUploads, setUserUploads] = useState<{name: string, url: string}[]>([]);

  const [loadingUploads, setLoadingUploads] = useState(false);
  
  // Custom Notification State
  const [notification, setNotification] = useState<{type: 'success' | 'error', title: string, message: string} | null>(null);
  
  // Track current preview URL for cleanup
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);

  // Upload Loading State
  const [isUploading, setIsUploading] = useState(false);

  // New Delete Dialog State
  const [deleteImageName, setDeleteImageName] = useState<string | null>(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Panning Refs
  const isDragging = useRef(false);
  const lastPosX = useRef(0);
  const lastPosY = useRef(0);
  
  // State Persistence
  // Stores { json: ..., bounds: ... } keyed by templateId
  const savedDesigns = useRef<Record<string, any>>({});
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
          const json = fabricRef.current.toJSON(['name', 'selectable', 'evented']);
          if (json.objects) {
              json.objects = json.objects.filter((o: any) => o.name !== 'static_bg' && o.name !== 'print_zone');
          }
          // Store JSON AND Bounds for export later
          savedDesigns.current[currentTemplate.id] = { 
              json, 
              bounds: printZoneBoundsRef.current 
          };
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
        // If Edit Mode: Fetch design data
        if (designId) {
            console.log("Loading Saved Design:", designId);
            const design = await getDesignById(designId);
            if (design && design.canvas_data) {
                // Populate savedDesignsRef
                savedDesigns.current = design.canvas_data;
                // Set Design Name
                if (design.design_name) setDesignName(design.design_name);
                // Set Preview URL
                if (design.preview_image_url) setCurrentPreviewUrl(design.preview_image_url);
                // Restore Active Colors
                if (design.available_colors && Array.isArray(design.available_colors) && design.available_colors.length > 0) {
                     setActiveColorIds(new Set(design.available_colors));
                     
                     // Set Initial Color & Template from Saved Data
                     const firstColorId = design.available_colors[0];
                     setSelectedColorId(firstColorId);
                     
                     const matchingTemplate = data.find((t: any) => 
                        t.color?.id === firstColorId && t.side.toLowerCase() === 'front'
                     ) || data.find((t: any) => t.color?.id === firstColorId);
                     
                     if (matchingTemplate) {
                         setCurrentTemplate(matchingTemplate);
                     }
                }
                
                console.log("Loaded Canvas Data:", Object.keys(savedDesigns.current));
            }
        }
        
        // Update Templates State LAST (trigers watchers)
        setTemplates(data);
        
        // Template initialization is handled by the useEffect hook watching 'templates'
        // BUT if we set selectedColorId above, the watcher won't override it.

      } catch (err) {
        console.error("Failed to load templates or design:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [id, designId]);

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
      
      // Check for Pending Design (Color Switch)
      let sourceFields = null;
      if (pendingDesignRef.current && pendingDesignRef.current.side === currentTemplate.side) {
           console.log("Applying persisted design from previous color");
           sourceFields = pendingDesignRef.current.json;
           pendingDesignRef.current = null; // Clear usage
      } 
      // Fallback to Saved Design
      else if (savedDesigns.current[currentTemplate.id]) {
           // Handle legacy (just json) vs new (object with json)
           const saved = savedDesigns.current[currentTemplate.id];
           sourceFields = saved.json || saved; 
      }

      if (sourceFields) {
           // PATH A: Restore (from pending or saved)
           newCanvas.loadFromJSON(sourceFields, () => {
               // Ensure we remove unwanted bg constraints from JSON if any
               newCanvas.getObjects().forEach(o => {
                  if (o.name === 'static_bg') newCanvas.remove(o);
               });
               
               newCanvas.setWidth(finalWidth);
               newCanvas.setHeight(finalHeight);
               
               // Re-add Background Image (New Color)
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

               // Re-add Visual Zone (Dotted Line)
               if (printZoneBoundsRef.current) {
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
                      name: 'print_zone' 
                    });
                    newCanvas.add(visualZone);
               }

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
          // Filter out static_bg AND print_zone
          // We want Top -> Bottom for the UI list
          const objs = newCanvas.getObjects()
            .filter(o => o.name !== 'static_bg' && o.name !== 'print_zone')
            .reverse();
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

    }, { crossOrigin: 'anonymous' }); 

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



  // Fetch User Uploads
  const fetchUserUploads = async () => {
      if (!user) return;
      setLoadingUploads(true);
      try {
          const { data, error } = await supabase.storage
              .from('design-assets')
              .list(`uploads/${user.id}`, {
                  limit: 50,
                  offset: 0,
                  sortBy: { column: 'created_at', order: 'desc' },
              });
              
          if (error) throw error;
          
          console.log("Fetched Uploads Raw Data:", data);

          if (data) {
              const uploads = data.map(file => {
                  const { data: { publicUrl } } = supabase.storage
                      .from('design-assets')
                      .getPublicUrl(`uploads/${user.id}/${file.name}`);
                  return { name: file.name, url: publicUrl };
              });
              console.log("Processed Uploads:", uploads);
              setUserUploads(uploads);
          }
      } catch (error) {
          console.error("Error fetching uploads:", error);
      } finally {
          setLoadingUploads(false);
      }
  };

  useEffect(() => {
      if (showImageLibrary && user) {
          fetchUserUploads();
      }
  }, [showImageLibrary, user]);

  // Handle Image Deletion Step 1: Click (Open Dialog)
  const handleDeleteClick = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteImageName(fileName);
  };

  // Handle Image Deletion Step 2: Confirm (Actual Delete)
  const confirmDeleteImage = async () => {
    if (!user || !deleteImageName) return;

    try {
        const { error } = await supabase.storage
            .from('design-assets')
            .remove([`uploads/${user.id}/${deleteImageName}`]);

        if (error) throw error;

        // Optimistic Remove
        setUserUploads(prev => prev.filter(f => f.name !== deleteImageName));
        
        setNotification({
             type: 'success', 
             title: 'ลบรูปภาพสำเร็จ', 
             message: 'ลบรูปภาพออกจากคลังเรียบร้อยแล้ว' 
        });

    } catch (err: any) {
        console.error("Delete failed:", err);
        setNotification({
             type: 'error', 
             title: 'ลบไม่สำเร็จ', 
             message: err.message || 'เกิดข้อผิดพลาดในการลบ' 
        });
    } finally {
        setDeleteImageName(null);
    }
  };

  // Handle Image Upload with Persistent Storage
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !fabricRef.current) return;
    if (!user) {
        alert("กรุณาเข้าสู่ระบบเพื่ออัพโหลดรูปภาพ");
        return;
    }
    
    setIsUploading(true);
    const file = e.target.files[0];

    // 1. Create Placeholder on Canvas - REMOVED (Using Skeleton Overlay instead)
    
    try {
        // Upload to 'design-assets' bucket
        const timestamp = Date.now();
        const fileName = `uploads/${user.id}/${timestamp}_${file.name.replace(/\s+/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage
            .from('design-assets') 
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('design-assets')
            .getPublicUrl(fileName);

        console.log("Uploaded Public URL:", publicUrl);

        // Add to canvas (this will be the "replacement" of the placeholder)
        addImageToCanvas(publicUrl);
        
        // Refresh Library if open
        if (showImageLibrary) fetchUserUploads();

    } catch (err: any) {
        console.error("Upload failed:", err);
        setNotification({
            type: 'error',
            title: 'อัพโหลดล้มเหลว',
            message: err.message || 'ไม่สามารถอัพโหลดรูปภาพได้'
        });
    } finally {
        setIsUploading(false);
    }
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
    }, { crossOrigin: 'anonymous' });
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

const saveDesign = async (silent = false): Promise<{ targetId: string | null, printFilePayload: string } | null> => {
    if (!currentTemplate || !fabricRef.current) return null;
    if (!user) {
        alert('กรุณาเข้าสู่ระบบเพื่อบันทึกงานออกแบบ');
        return null;
    }
    
    setSaving(true);
    try {
        // 1. Prepare Data: Update current view
        saveCurrentCanvas();
        
        // 2. Generate Preview
        const previewDataUrl = fabricRef.current.toDataURL({
            format: 'png',
            multiplier: 0.5,
        });
        
        const res = await fetch(previewDataUrl);
        const blob = await res.blob();
        
        // 3. Upload to Supabase Storage
        const timestamp = Date.now();
        const fileName = `uid_${user.id}/${timestamp}_${currentTemplate.side}.png`;
        const { error } = await supabase.storage
          .from('design-previews')
          .upload(fileName, blob, {
              cacheControl: '3600',
              upsert: false
          });

      if (error) throw error;
      
      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('design-previews')
        .getPublicUrl(fileName);
        
      const previewUrl = publicUrl;
      
      let targetId = designId;

        // -------------------------------------------------------------------
        // 2. Generate Print Files (Optimized with Hashing)
        // -------------------------------------------------------------------
        
        // Ensure state is up to date
        saveCurrentCanvas();
        const fullCanvasData = JSON.stringify(savedDesigns.current);
        const currentHash = MD5(fullCanvasData).toString();
        let printFilePayload = "";
        let shouldGenerate = true;
        let printFiles: Record<string, string> = {};

        if (targetId) {
             console.log("Checking hash for optimization...");
             try {
                const { data: dbDesign } = await supabase
                    .from('user_designs')
                    .select('design_hash, print_file_url')
                    .eq('id', targetId)
                    .single();
                    
                // Use strict check: Hash match AND existing file
                if (dbDesign && dbDesign.design_hash === currentHash && dbDesign.print_file_url) {
                    console.log("Optimization: Hash matches, skipping generation.");
                    printFilePayload = dbDesign.print_file_url;
                    shouldGenerate = false;
                }
             } catch(e) {
                 console.warn("Failed to check hash optimization", e);
             }
        }

        if (shouldGenerate) {
            console.log("Generating new print files...");
            
            // A. Export Current Side (Online)
            const currentPrintUrl = await exportDesignForProduction(
                fabricRef.current, 
                user.id,
                { crop: printZoneBoundsRef.current || undefined }
            );
            if (currentPrintUrl) {
                printFiles[currentTemplate.side.toLowerCase()] = currentPrintUrl;
            }

            // B. Export Other Sides (Offline)
            const otherTemplates = templates.filter(t => 
                t.color?.id === selectedColorId && t.id !== currentTemplate.id
            );

            for (const tmpl of otherTemplates) {
                const saved = savedDesigns.current[tmpl.id];
                // Support both new { json, bounds } and legacy json structure
                const json = saved?.json || saved; 
                
                if (json) {
                    const width = fabricRef.current.getWidth();
                    const height = fabricRef.current.getHeight();
                    const staticCanvas = new fabric.StaticCanvas(null, { width, height });
                    
                    await new Promise<void>(resolve => staticCanvas.loadFromJSON(json, () => resolve()));
                    
                    // Determine Bounds
                    let bounds = saved?.bounds;
                    if (!bounds && tmpl.print_area_config) {
                         // Recalculate if missing (same logic as before)
                         try {
                             const img = await new Promise<any>((resolve, reject) => {
                                 fabric.Image.fromURL(tmpl.image_url, (img) => {
                                     if (!img) reject("Failed to load image");
                                     else resolve(img);
                                 }, { crossOrigin: 'anonymous' });
                             });

                             if (img.width && img.height) {
                                 const containerWidth = containerRef.current?.clientWidth || 800;
                                 const containerHeight = containerRef.current?.clientHeight || 800;
                                 const TARGET_WIDTH = containerWidth - 60; 
                                 const TARGET_HEIGHT = containerHeight - 60;
                                 const scaleX = TARGET_WIDTH / img.width;
                                 const scaleY = TARGET_HEIGHT / img.height;
                                 const scaleFactor = Math.min(scaleX, scaleY, 1) * 0.95;
                                 const { x, y, width: w, height: h } = tmpl.print_area_config;
                                 bounds = {
                                     left: x * scaleFactor,
                                     top: y * scaleFactor,
                                     width: w * scaleFactor,
                                     height: h * scaleFactor
                                 };
                             }
                         } catch (e) { console.warn("Bounds calc fail", e); }
                    }

                    const url = await exportDesignForProduction(staticCanvas, user.id, { crop: bounds });
                    if (url) {
                        printFiles[tmpl.side.toLowerCase()] = url;
                    }
                    staticCanvas.dispose();
                }
            }
            
            printFilePayload = JSON.stringify(printFiles);
        }

        // -------------------------------------------------------------------
        // 3. Save to Backend
        // -------------------------------------------------------------------
        // Capture current canvas JSON
        saveCurrentCanvas(); // Update ref
        const canvasDataFull = savedDesigns.current; 

        if (designId) {
            // UPDATE
            await api.put(`/designs/${designId}`, {
                design_name: designName,
                canvas_data: canvasDataFull,
                preview_image_url: previewUrl,
                available_colors: Array.from(activeColorIds),
                printing_type: printingType,
                print_file_url: printFilePayload, // Pass the high-res URLs
                design_hash: currentHash
            });
            // Cleanup old preview if URL changed (optional optimization)
        } else {
             // CREATE
             const createPayload = {
                base_product_id: currentTemplate.product_id,
                design_name: designName,
                canvas_data: canvasDataFull,
                preview_image_url: previewUrl,
                available_colors: Array.from(activeColorIds),
                printing_type: printingType, 
                print_file_url: printFilePayload, // Pass the high-res URLs
                design_hash: currentHash
             };

             const response = await api.post('/designs', createPayload);
             if (response.data?.design?.id) {
                 targetId = response.data.design.id;
             }
        }
        
        // Success Actions
        setCurrentPreviewUrl(previewUrl); 
        
        if (!silent) {
            setNotification({ type: 'success', title: 'บันทึกสำเร็จ', message: 'บันทึกงานออกแบบเรียบร้อยแล้ว' });
        }
        
        return { targetId, printFilePayload }; // Return useful data

    } catch (error: any) {
        console.error("Save failed:", error);
        if (!silent) {
            setNotification({ type: 'error', title: 'บันทึกไม่สำเร็จ', message: 'กรุณาลองใหม่อีกครั้ง' });
        }
        return null;
    } finally {
        setSaving(false);
    }
};

const handleAddToCart = async () => {
    if (!fabricRef.current || !currentTemplate || !user) {
         if (!user) {
             setNotification({ type: 'error', title: 'กรุณาเข้าสู่ระบบ', message: 'ต้องเข้าสู่ระบบก่อนเพิ่มสินค้าลงตระกร้า' });
         }
         return;
    }

    setIsGenerating(true);
    try {
        // 1. Force Save First to get High-Res files and persist state
        const result = await saveDesign(true); // Silent save
        if (!result) throw new Error("Auto-save failed");
        
        const { targetId, printFilePayload } = result;
        
        // 2. Construct Cart Item
        // We can now use the ID of the saved design and the generated payload
        const designJson = fabricRef.current.toJSON(['name', 'selectable', 'evented']);
        
        const cartItem = {
           product_id: currentTemplate.product_id,
           color_id: selectedColorId || '',
           size: selectedSize,
           quantity: quantity,
           design_id: targetId || undefined, // Link to the saved design!
           print_file_url: printFilePayload, // Use the one we just generated/saved
           design_json: designJson,
           preview_url: currentPreviewUrl || ''
        };

        // 3. Save to Cart Context
        addToCart(cartItem);

        // 4. Redirect
        // If it was a new design, we might want to navigate to '?designId=XX' or just go to order.
        // Since we are going to Order page, it's fine.
        navigate('/order');

    } catch (error) {
        console.error("Add to cart error:", error);
        setNotification({
            type: 'error',
            title: 'เกิดข้อผิดพลาด',
            message: 'ไม่สามารถเพิ่มลงตระกร้าได้'
        });
    } finally {
        setIsGenerating(false);
    }
};

const handleOrderNow = async () => {
    const result = await saveDesign(true); // Silent save
    if (result?.targetId) {
        navigate(`/order?initialDesignId=${result.targetId}`);
    }
};

const handleManualSave = async () => {
    const result = await saveDesign(false);
    if (result?.targetId && result.targetId !== designId) {
        // We just created a new design, navigate to its edit page
        // Format: /design/:productId?designId=:newDesignId
        navigate(`/design/${id}?designId=${result.targetId}`, { replace: true });
    }
};

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Notification Toast */}
      {notification && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[150] w-96 animate-in slide-in-from-top-5 fade-in duration-300">
            <Alert variant={notification.type === 'error' ? "destructive" : "default"} className={notification.type === 'success' ? "border-green-500 bg-green-50 text-green-900" : ""}>
                {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{notification.title}</AlertTitle>
                <AlertDescription>
                    {notification.message}
                </AlertDescription>
            </Alert>
          </div>
      )}

      {/* HEADER */}
      <div className="h-16 bg-white border-b flex items-center justify-between px-4 z-10 w-full shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/my-products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <input 
                type="text" 
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="text-lg font-bold border-none focus:ring-0 p-0 h-auto bg-transparent w-full outline-none placeholder-gray-400"
                placeholder="ตั้งชื่อผลงาน..."
            />

          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {}} disabled={true}>
                 ตัวอย่าง
            </Button>
            <Button size="sm" variant="outline" onClick={handleManualSave} disabled={saving}>
                {saving ? (
                    <>
                       <Loader2 className="w-4 h-4 animate-spin mr-2" />
                       กำลังบันทึก...
                    </>
                ) : (
                    <>
                       <Save className="w-4 h-4 mr-2" />
                       บันทึก{designId ? 'การแก้ไข' : ''}
                    </>
                )}
            </Button>
            <Button 
                size="sm" 
                variant="secondary"
                onClick={handleAddToCart} 
                disabled={saving || isGenerating}
                className="min-w-[140px]"
            >
                {isGenerating ? (
                    <>
                       <Loader2 className="w-4 h-4 animate-spin mr-2" />
                       Preparing...
                    </>
                ) : (
                    <>
                       <ShoppingCart className="w-4 h-4 mr-2" />
                       เพิ่มลงตระกร้า
                    </>
                )}
            </Button>
            {/* 
            <Button size="sm" onClick={handleOrderNow} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                สั่งซื้อทันที
            </Button>
            */}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT TOOLBAR */}
        <aside className="w-20 bg-white border-r flex flex-col items-center py-4 gap-4 z-10 overflow-y-auto shrink-0 no-scrollbar">
            {/* Template Side Selector Removed */}

            {/* Removed Color Selector from here */}

            {/* Upload Tool */}
            <div className="flex flex-col items-center gap-1 cursor-pointer group relative">
                <label className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isUploading ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 hover:bg-black hover:text-white'}`}>
                     {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : <Upload className="w-5 h-5" />}
                     <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                </label>
                <span className="text-[10px] text-gray-500 font-medium">{isUploading ? '...' : 'อัปโหลด'}</span>
            </div>

            {/* Image Library Tool */}
            <div 
                className={`flex flex-col items-center gap-1 cursor-pointer group ${showImageLibrary ? 'bg-slate-100 w-full border-r-4 border-black' : ''}`}
                onClick={() => setShowImageLibrary(!showImageLibrary)}
            >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${showImageLibrary ? 'bg-black text-white' : 'bg-gray-100 hover:bg-black hover:text-white'}`}>
                     <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">คลังข้อมูล</span>
            </div>

            {/* Text Tool */}
            <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={addText}>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                     <Type className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-500 font-medium">ข้อความ</span>
            </div>
        </aside>

        {/* Image Library Panel */}
        {showImageLibrary && (
            <div className="w-72 bg-white border-r flex flex-col z-[100] shadow-2xl animate-in slide-in-from-left-5 absolute left-0 top-0 bottom-0">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold">คลังรูปภาพ</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowImageLibrary(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                
                <div className="p-4 border-b bg-gray-50">
                    <label className={`w-full h-10 text-white rounded-md flex items-center justify-center cursor-pointer transition-colors gap-2 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}>
                         {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                         <span className="text-sm font-medium">{isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปใหม่'}</span>
                         <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2 content-start">
                    {loadingUploads ? (
                        <div className="col-span-2 flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : userUploads.length === 0 ? (
                        <div className="col-span-2 text-center text-sm text-gray-400 py-8">
                            ไม่มีรูปภาพ
                        </div>
                    ) : (
                        userUploads.map((file, i) => (
                           <div key={i} className="aspect-square border rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-black relative group" onClick={() => addImageToCanvas(file.url)}>
                               <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                               <Button 
                                   variant="destructive" 
                                   size="icon" 
                                   className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                   onClick={(e) => handleDeleteClick(file.name, e)}
                               >
                                   <Trash2 className="w-3 h-3" />
                               </Button>
                           </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* CENTER WORKSPACE */}
        <main className="flex-1 bg-gray-100 relative flex items-center justify-center overflow-auto p-8" ref={containerRef}>
            {/* Canvas Container
                We force a min-height to ensure it is visible even if image fails
             */}
            <div className="relative shadow-2xl bg-white min-h-[500px] min-w-[500px]">
                <canvas ref={canvasRef} />
                {isUploading && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                        <Skeleton className="h-[200px] w-[200px] rounded-xl bg-gray-200/80 animate-pulse shadow-sm border border-gray-100" />
                    </div>
                )}
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
                {currentTemplates.map(t => {
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

            {/* RIGHT PANEL: Colors & Layers */}
            <div className="absolute top-20 right-6 z-20 flex flex-col gap-4 items-end">
                
                {/* Color Selector (Moved from Sidebar) */}
                {/* Color Selector (Horizontal) */}
                {uniqueColors.length > 0 && (
                    <div className="bg-white p-3 rounded-xl shadow-xl border flex flex-col gap-2 w-48 z-50">
                        <span className="text-[10px] uppercase text-gray-400 font-bold">สี</span>
                        <div className="flex flex-wrap gap-2">
                            {uniqueColors.filter(c => activeColorIds.has(c.id)).map(c => (
                                <button
                                    key={c.id}
                                    className={`w-8 h-8 rounded-full border shadow-sm transition-all hover:scale-110 ${
                                        selectedColorId === c.id ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'border-white'
                                    }`}
                                    style={{ backgroundColor: c.hex_code }}
                                    onClick={() => handleColorChange(c.id)}
                                    title={c.name}
                                />
                            ))}
                            
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-full border-dashed border-2 p-0 hover:bg-gray-50 shrink-0">
                                        <Plus className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" side="left" align="start">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm leading-none mb-2">เลือกสีเพิ่มเติม</h4>
                                        <ScrollArea className="h-[200px] pr-2">
                                            <div className="space-y-3">
                                                {uniqueColors.map(color => (
                                                    <div key={color.id} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`c-${color.id}`} 
                                                            checked={activeColorIds.has(color.id)}
                                                            onCheckedChange={(checked) => {
                                                                const next = new Set(activeColorIds);
                                                                if (checked) {
                                                                    next.add(color.id);
                                                                } else {
                                                                    next.delete(color.id);
                                                                    // Prevent removing the currently selected color
                                                                    if (selectedColorId === color.id && activeColorIds.size > 1) {
                                                                       // Switch to another available one
                                                                       const remaining = Array.from(next);
                                                                       if (remaining.length > 0) handleColorChange(remaining[0]);
                                                                    }
                                                                }
                                                                // Ensure at least one color is active
                                                                if (next.size > 0) setActiveColorIds(next);
                                                            }}
                                                        />
                                                        <Label htmlFor={`c-${color.id}`} className="flex items-center gap-2 cursor-pointer w-full text-sm font-normal">
                                                            <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: color.hex_code }} />
                                                            {color.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )}

                {/* LAYERS PANEL */}
                <div className="w-48 bg-white p-3 rounded-lg shadow-xl border flex flex-col gap-3 max-h-[60vh]">
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
            {/* Delete Confirmation Dialog for Image Library */}
            <AlertDialog open={!!deleteImageName} onOpenChange={(open) => !open && setDeleteImageName(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ลบรูปภาพ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณแน่ใจหรือไม่ที่จะลบรูปภาพนี้ออกจากคลัง? การกระทำนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteImage} className="bg-red-600 hover:bg-red-700">ลบรูปภาพ</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
    </div>
  );
}