import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import api, { uploadFile, getPrice, r2ProxyUrl } from "@/services/api";
import { exportDesignForProduction, renderSideForMockup } from "@/utils/canvasExporter";
import { compositeSingleSide, OUTPUT_SCALE } from "@/utils/mockupCompositor";
import { useCart } from "@/contexts/CartContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getDesignById, updateDesign as _updateDesign } from "@/services/api";
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

// Replace r2.dev URLs in a canvas JSON blob with backend proxy URLs so that
// Fabric.js can load them with crossOrigin: 'anonymous' without CORS errors.
function proxyCanvasJson(json: string | object): object {
  const str = typeof json === 'string' ? json : JSON.stringify(json);
  const proxied = str.replace(
    /https?:\/\/[^"\\]*\.r2\.dev\/[^"\\]*/g,
    (url) => r2ProxyUrl(url),
  );
  return JSON.parse(proxied);
}

export default function DesignCanvas() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const designId = searchParams.get('designId');
  // Normalize to uppercase — DB ids are 'dtg'/'dtf', backend expects 'DTG'/'DTF'
  const rawPrintingType = searchParams.get('printingType') || searchParams.get('printing_type');
  const normalizedPrintingType = rawPrintingType?.toUpperCase();
  const printingType = (normalizedPrintingType === 'DTG' || normalizedPrintingType === 'DTF') ? normalizedPrintingType : null;
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
  const guideLinesRef = useRef<fabric.Line[]>([]);
  const SNAP_THRESHOLD = 8; // canvas pixels (divided by zoom at runtime)
  const PRINT_TIERS = {
    '3x4': [4,  3 ],  // W=4", H=3" (landscape)
    'A5':  [6,  8 ],
    'A4':  [8,  12],
    'A3':  [12, 16],
  } as const;
  type TierKey = keyof typeof PRINT_TIERS;
  // Safety factor: real image content (shadows, antialiased edges) bleeds ~3-7% beyond
  // the geometric bounding box. Targeting 97% of the tier ensures actual ink stays within bounds.
  const TIER_SAFETY_FACTOR = 0.97;
  
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
  const [sizeLockAxis, setSizeLockAxis] = useState<'width' | 'height'>('width');

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
      const oldColorId = selectedColorId;
      if (fabricRef.current && currentSide) {
          const json = fabricRef.current.toJSON(['name', 'selectable', 'evented']);
          // Filter out background image since that will change
          if (json.objects) {
             json.objects = json.objects.filter((o: any) => o.name !== 'static_bg' && o.name !== 'print_zone' && o.name !== 'smart_guide');
          }
           pendingDesignRef.current = { json, side: currentSide };
      }

      // 3. Copy all other saved sides from old color → new color, so that switching
      //    sides after a color change doesn't show a blank canvas.
      //    Skip the current side (handled by pendingDesignRef above) and skip
      //    any side that already has its own saved design on the target color.
      if (oldColorId && oldColorId !== colorId) {
          const oldColorTemplates = templates.filter(t => t.color?.id === oldColorId);
          for (const oldTmpl of oldColorTemplates) {
              if (oldTmpl.side === currentSide) continue; // handled by pendingDesignRef
              const saved = savedDesigns.current[oldTmpl.id];
              if (!saved) continue;
              const newTmpl = templates.find(t => t.color?.id === colorId && t.side === oldTmpl.side);
              if (newTmpl && !savedDesigns.current[newTmpl.id]) {
                  savedDesigns.current[newTmpl.id] = saved;
              }
          }
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
  const [selectedSize] = useState('M');
  const [quantity] = useState(1);

  // Mockup State
  const [showMockup, setShowMockup] = useState(false);
  const [mockupUrl, setMockupUrl] = useState<{ side: string; url: string }[]>([]);
  const [generatingMockup, setGeneratingMockup] = useState(false);

  // Unsaved changes tracking
  const isDirtyRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);

  // Pricing — effectivePrintingType persists across URL navigations and loads from saved design
  const [effectivePrintingType, setEffectivePrintingType] = useState<string | null>(printingType);

  interface SidePriceBreakdown {
    side: string;
    tier: string;
    print_per_unit: number;
  }
  interface MultiSidePriceBreakdown {
    sides: SidePriceBreakdown[];
    shirt_per_unit: number;
    total_print_per_unit: number;
    total_per_unit: number;
  }
  const [priceBreakdown, setPriceBreakdown] = useState<MultiSidePriceBreakdown | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  
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

  // DPI Warning Dialog State
  const [dpiWarningFile, setDpiWarningFile] = useState<{ file: File; dpi: number } | null>(null);

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

  // Smart Guide Helpers
  // Lock history during guide add/remove so object:added / object:removed
  // events don't create spurious history entries. Save & restore the previous
  // lock state so we don't accidentally unlock while an undo/redo is in flight.
  const clearGuides = (canvas: fabric.Canvas) => {
    const prev = isHistoryLocked.current;
    isHistoryLocked.current = true;
    guideLinesRef.current.forEach(l => canvas.remove(l));
    guideLinesRef.current = [];
    isHistoryLocked.current = prev;
  };

  const addGuide = (canvas: fabric.Canvas, x1: number, y1: number, x2: number, y2: number) => {
    const prev = isHistoryLocked.current;
    isHistoryLocked.current = true;
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: '#3b82f6',
      strokeWidth: 1,
      strokeDashArray: [5, 4],
      selectable: false,
      evented: false,
      name: 'smart_guide',
      opacity: 0.85,
    });
    canvas.add(line);
    guideLinesRef.current.push(line);
    isHistoryLocked.current = prev;
  };

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

         // ── Smart Guides ──────────────────────────────────────────────────
         clearGuides(canvas);
         if (bounds) {
           const zoom = canvas.getZoom();
           const thresh = SNAP_THRESHOLD / zoom;
           const M = 20; // guide extends 20px beyond zone edges

           const zoneCX = bounds.left + bounds.width  / 2;
           const zoneCY = bounds.top  + bounds.height / 2;

           // All user objects use originX/Y = 'center'
           const objCX     = obj.left!;
           const objCY     = obj.top!;
           const objLeft_  = objCX - objWidth  / 2;
           const objTop_   = objCY - objHeight / 2;
           const objRight_ = objLeft_ + objWidth;
           const objBot_   = objTop_  + objHeight;

           // Center X → vertical guide
           if (Math.abs(objCX - zoneCX) < thresh) {
             obj.set({ left: zoneCX });
             addGuide(canvas, zoneCX, bounds.top - M, zoneCX, bounds.top + bounds.height + M);
           }
           // Center Y → horizontal guide
           if (Math.abs(objCY - zoneCY) < thresh) {
             obj.set({ top: zoneCY });
             addGuide(canvas, bounds.left - M, zoneCY, bounds.left + bounds.width + M, zoneCY);
           }
           // Snap to the inner edge of the zone border stroke (strokeWidth/2 = 1px inset)
           // so snapped objects sit cleanly inside the print area, not straddling the stroke centre.
           const S = 1; // half of print zone strokeWidth: 2
           // Left edge
           if (Math.abs(objLeft_ - (bounds.left + S)) < thresh) {
             obj.set({ left: bounds.left + S + objWidth / 2 });
             addGuide(canvas, bounds.left, bounds.top - M, bounds.left, bounds.top + bounds.height + M);
           }
           // Right edge
           if (Math.abs(objRight_ - (bounds.left + bounds.width - S)) < thresh) {
             obj.set({ left: bounds.left + bounds.width - S - objWidth / 2 });
             addGuide(canvas, bounds.left + bounds.width, bounds.top - M, bounds.left + bounds.width, bounds.top + bounds.height + M);
           }
           // Top edge
           if (Math.abs(objTop_ - (bounds.top + S)) < thresh) {
             obj.set({ top: bounds.top + S + objHeight / 2 });
             addGuide(canvas, bounds.left - M, bounds.top, bounds.left + bounds.width + M, bounds.top);
           }
           // Bottom edge
           if (Math.abs(objBot_ - (bounds.top + bounds.height - S)) < thresh) {
             obj.set({ top: bounds.top + bounds.height - S - objHeight / 2 });
             addGuide(canvas, bounds.left - M, bounds.top + bounds.height, bounds.left + bounds.width + M, bounds.top + bounds.height);
           }

           canvas.renderAll();
         }
     });

     canvas.on('object:modified', (e) => {
       clearGuides(canvas);

       // Normalize text scale → fontSize so the font size display stays accurate.
       // When the user drags a corner handle, Fabric changes scaleX/Y but keeps
       // fontSize fixed. We bake the scale into fontSize and reset scale to 1.
       const obj = e.target;
       if (obj && obj.type === 'i-text') {
         const text = obj as fabric.IText;
         const sx = text.scaleX ?? 1;
         const sy = text.scaleY ?? 1;
         if (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001) {
           const effectiveSize = Math.max(5, Math.round((text.fontSize ?? 30) * sx));
           text.set({ fontSize: effectiveSize, scaleX: 1, scaleY: 1 });
         }
       }

       canvas.renderAll();
     });
  };

  const saveCurrentCanvas = () => {
      if (fabricRef.current && currentTemplate) {
          console.log("Saving design for:", currentTemplate.id);
          const json = fabricRef.current.toJSON(['name', 'selectable', 'evented']);
          if (json.objects) {
              json.objects = json.objects.filter((o: any) => o.name !== 'static_bg' && o.name !== 'print_zone' && o.name !== 'smart_guide');
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
                let parsedData = design.canvas_data;
                if (typeof parsedData === 'string') {
                    try {
                        parsedData = JSON.parse(parsedData);
                    } catch (e) {
                        console.error("Failed to parse canvas_data", e);
                    }
                }
                savedDesigns.current = parsedData;
                // Set Design Name
                if (design.design_name) setDesignName(design.design_name);
                // Set printing type from saved design (used for pricing)
                if (design.printing_type) setEffectivePrintingType(design.printing_type);
                // Set Preview URL
                if (design.preview_image_url) setCurrentPreviewUrl(design.preview_image_url);
                // Restore Active Colors
                let loadFirstColorId: string | null = null;
                let loadMatchingTemplate: any = null;
                if (design.available_colors && Array.isArray(design.available_colors) && design.available_colors.length > 0) {
                     setActiveColorIds(new Set(design.available_colors));

                     // Set Initial Color & Template from Saved Data
                     loadFirstColorId = design.available_colors[0];
                     setSelectedColorId(loadFirstColorId);

                     loadMatchingTemplate = data.find((t: any) =>
                        t.color?.id === loadFirstColorId && t.side.toLowerCase() === 'front'
                     ) || data.find((t: any) => t.color?.id === loadFirstColorId);

                     if (loadMatchingTemplate) {
                         setCurrentTemplate(loadMatchingTemplate);
                     }
                }

                // Calculate pricing immediately from stored print_dimensions
                if (design.print_dimensions && design.printing_type) {
                    const colorId = loadFirstColorId || data[0]?.color?.id;
                    const productId = loadMatchingTemplate?.product_id || data[0]?.product_id;
                    if (colorId && productId) {
                        setPriceLoading(true);
                        const entries = Object.entries(design.print_dimensions as Record<string, { w: number; h: number }>)
                            .filter(([, d]) => d.w > 0 && d.h > 0);
                        const sideResults: { side: string; tier: string; print_per_unit: number }[] = [];
                        let shirt_per_unit = 0;
                        for (const [side, dims] of entries) {
                            try {
                                const bd = await getPrice({
                                    printingType: design.printing_type as 'DTG' | 'DTF',
                                    aabb_w_cm: dims.w,
                                    aabb_h_cm: dims.h,
                                    quantity: 1,
                                    productId,
                                    color_id: colorId,
                                    size: 'M',
                                });
                                shirt_per_unit = bd.shirt_per_unit;
                                sideResults.push({ side, tier: bd.tier, print_per_unit: bd.print_per_unit });
                            } catch { /* skip if no pricing match */ }
                        }
                        if (sideResults.length > 0) {
                            const total_print_per_unit = sideResults.reduce((s, r) => s + r.print_per_unit, 0);
                            setPriceBreakdown({
                                sides: sideResults,
                                shirt_per_unit,
                                total_print_per_unit,
                                total_per_unit: shirt_per_unit + total_print_per_unit,
                            });
                        }
                        setPriceLoading(false);
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






    fabric.Image.fromURL(r2ProxyUrl(currentTemplate.image_url), (img) => {
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
        
        // Expand clip by strokeWidth/2 (1px) so objects snapped to the zone edge
        // are never sitting exactly on the clip boundary, which causes sub-pixel
        // cropping in the exported print file at high multipliers.
        const ZONE_STROKE_HALF = 1; // half of the print zone rect's strokeWidth: 2
        const clipRect = new fabric.Rect({
            left: scaledLeft - ZONE_STROKE_HALF,
            top: scaledTop - ZONE_STROKE_HALF,
            width: scaledWidth + ZONE_STROKE_HALF * 2,
            height: scaledHeight + ZONE_STROKE_HALF * 2,
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
           // Deep clone sourceFields because React StrictMode's double-render 
           // causes Fabric.js to mutate the original object in the first pass
           const clonedSource = proxyCanvasJson(
             typeof sourceFields === 'string' ? sourceFields : JSON.parse(JSON.stringify(sourceFields))
           );
           newCanvas.loadFromJSON(clonedSource, () => {
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
                  name: 'print_zone',
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
         isDirtyRef.current = true;
         setIsDirty(true);
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
            .filter(o => o.name !== 'static_bg' && o.name !== 'print_zone' && o.name !== 'smart_guide')
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

  }, [currentTemplate, loading]);

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
          if (obj.name === 'static_bg' || obj.name === 'print_zone') {
              // Always keep background and print area locked
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
             // Only unlock objects that are NOT static backgrounds or print zone
             if (obj.name !== 'static_bg' && obj.name !== 'print_zone') {
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
              historyIndex.current = prevIndex;
              setHistoryStep(prevIndex);
              isHistoryLocked.current = false;
              // Sync layer panel
              const objs = fabricRef.current?.getObjects()
                .filter(o => o.name !== 'static_bg' && o.name !== 'print_zone' && o.name !== 'smart_guide')
                .reverse() ?? [];
              setLayers([...objs]);
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
              historyIndex.current = nextIndex;
              setHistoryStep(nextIndex);
              isHistoryLocked.current = false;
              // Sync layer panel
              const objs = fabricRef.current?.getObjects()
                .filter(o => o.name !== 'static_bg' && o.name !== 'print_zone' && o.name !== 'smart_guide')
                .reverse() ?? [];
              setLayers([...objs]);
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
      const objs = canvas.getObjects().filter(o => o.name !== 'static_bg' && o.name !== 'smart_guide').reverse();
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
      
      const objs = canvas.getObjects().filter(o => o.name !== 'static_bg' && o.name !== 'smart_guide').reverse();
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
          const { data } = await api.get<{ name: string; url: string }[]>('/uploads/assets');
          setUserUploads(data);
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
        await api.delete(`/uploads/assets/${encodeURIComponent(deleteImageName)}`);

        // Remove from local state
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
             message: err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบ'
        });
    } finally {
        setDeleteImageName(null);
    }
  };

  // Execute the actual upload after DPI check passes
  const proceedWithUpload = async (file: File) => {
    setIsUploading(true);
    try {
        const publicUrl = await uploadFile(file, 'asset');
        addImageToCanvas(publicUrl);
        fetchUserUploads();
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

  // Handle Image Upload with Persistent Storage
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !fabricRef.current) return;
    if (!user) {
        alert("กรุณาเข้าสู่ระบบเพื่ออัพโหลดรูปภาพ");
        return;
    }

    const file = e.target.files[0];
    // Reset input so the same file can be re-selected after a cancel
    e.target.value = '';

    // DPI check: measure image pixel dimensions vs print zone physical size
    const physW = currentTemplate?.print_area_config?.physical_w_cm ?? 30.48;
    const physH = currentTemplate?.print_area_config?.physical_h_cm ?? 40.64;

    const effectiveDpi = await new Promise<number>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const dpiW = img.naturalWidth / (physW / 2.54);
            const dpiH = img.naturalHeight / (physH / 2.54);
            resolve(Math.min(dpiW, dpiH));
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(Infinity); };
        img.src = url;
    });

    if (effectiveDpi < 150) {
        setDpiWarningFile({ file, dpi: Math.round(effectiveDpi) });
        return;
    }

    await proceedWithUpload(file);
  };

  // Add Uploaded Image to Canvas (from sidebar click)
  const addImageToCanvas = (url: string) => {
    if (!fabricRef.current) return;

    fabric.Image.fromURL(r2ProxyUrl(url), (img) => {
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
  const applyPresetSize = (tier: TierKey, axis: 'width' | 'height') => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || !canvas || !printZoneBoundsRef.current) return;

    const physW_in = (currentTemplate?.print_area_config?.physical_w_cm ?? 30.48) / 2.54;
    const pxPerInch = printZoneBoundsRef.current.width / physW_in;

    const [tierW, tierH] = PRINT_TIERS[tier];

    const curW = (obj.width ?? 1) * (obj.scaleX ?? 1);
    const curH = (obj.height ?? 1) * (obj.scaleY ?? 1);
    const ratio = curW / curH;

    let targetW_px: number, targetH_px: number;
    const maxW_px = tierW * TIER_SAFETY_FACTOR * pxPerInch;
    const maxH_px = tierH * TIER_SAFETY_FACTOR * pxPerInch;
    if (axis === 'width') {
      targetW_px = maxW_px;
      targetH_px = targetW_px / ratio;
      // If height still exceeds the tier, constrain by height instead
      if (targetH_px > maxH_px) {
        targetH_px = maxH_px;
        targetW_px = targetH_px * ratio;
      }
    } else {
      targetH_px = maxH_px;
      targetW_px = targetH_px * ratio;
      // If width still exceeds the tier, constrain by width instead
      if (targetW_px > maxW_px) {
        targetW_px = maxW_px;
        targetH_px = targetW_px / ratio;
      }
    }

    const newScaleX = targetW_px / (obj.width ?? 1);
    const newScaleY = targetH_px / (obj.height ?? 1);
    obj.set({ scaleX: newScaleX, scaleY: newScaleY });

    // Normalize text: fold scale into fontSize (same as object:modified handler)
    if (obj.type === 'i-text') {
      const text = obj as fabric.IText;
      const effectiveSize = Math.max(5, Math.round((text.fontSize ?? 30) * newScaleX));
      text.set({ fontSize: effectiveSize, scaleX: 1, scaleY: 1 });
    }

    canvas.renderAll();
    canvas.fire('object:modified', { target: obj });
  };

  const deleteSelected = () => {
     if (!fabricRef.current || !selectedObject) return;
     
     fabricRef.current.remove(selectedObject);
     fabricRef.current.discardActiveObject();
     
     // Update the React state so the "Delete" button disappears
     setSelectedObject(null); 
     
     // IMPORTANT: Explicit re-render
     fabricRef.current.renderAll();
  };

const saveDesign = async (silent = false): Promise<{ targetId: string | null, printFilePayload: string, print_dimensions: Record<string, { w: number; h: number }> } | null> => {
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
        
        // 3. Upload to Backend (which proxies to Supabase)
        // We pass 'preview' type and let backend handle path/timestamp
        const previewFilename = `${currentTemplate.side}.png`; 
        const previewUrl = await uploadFile(blob, 'preview', previewFilename);
      
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
                {
                    crop: printZoneBoundsRef.current || undefined,
                    physicalSize: {
                        w_cm: currentTemplate.print_area_config?.physical_w_cm ?? 30.48,
                        h_cm: currentTemplate.print_area_config?.physical_h_cm ?? 40.64,
                    },
                }
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
                    
                    const clonedJson = proxyCanvasJson(
                      typeof json === 'string' ? json : JSON.parse(JSON.stringify(json))
                    );
                    await new Promise<void>(resolve => staticCanvas.loadFromJSON(clonedJson, () => resolve()));
                    
                    // Determine Bounds
                    let bounds = saved?.bounds;
                    if (!bounds && tmpl.print_area_config) {
                         // Recalculate if missing (same logic as before)
                         try {
                             const img = await new Promise<any>((resolve, reject) => {
                                 fabric.Image.fromURL(r2ProxyUrl(tmpl.image_url), (img) => {
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

                    const url = await exportDesignForProduction(staticCanvas, {
                        crop: bounds,
                        physicalSize: {
                            w_cm: tmpl.print_area_config?.physical_w_cm ?? 30.48,
                            h_cm: tmpl.print_area_config?.physical_h_cm ?? 40.64,
                        },
                    });
                    if (url) {
                        printFiles[tmpl.side.toLowerCase()] = url;
                    }
                    staticCanvas.dispose();
                }
            }
            
            printFilePayload = JSON.stringify(printFiles);
        }

        // -------------------------------------------------------------------
        // 3. Calculate design AABB in cm per side for pricing tier lookup
        // -------------------------------------------------------------------
        const print_dimensions: Record<string, { w: number; h: number; x_cm: number; y_cm: number; px_x: number; px_y: number; px_w: number; px_h: number }> = {};

        const computeSideAabb = (
            objects: fabric.Object[],
            pz: { left: number; top: number; width: number; height: number },
            physW: number,
            physH: number,
            imgZoneW: number, // print zone width in original background image pixels
            imgZoneH: number, // print zone height in original background image pixels
        ): { w: number; h: number; x_cm: number; y_cm: number; px_x: number; px_y: number; px_w: number; px_h: number } | null => {
            const designObjs = objects.filter((o: any) => o.name !== 'static_bg' && o.name !== 'print_zone' && o.name !== 'smart_guide');
            if (designObjs.length === 0) return null;
            const xs: number[] = [];
            const ys: number[] = [];
            designObjs.forEach((obj: fabric.Object) => {
                const rect = obj.getBoundingRect(true);
                xs.push(rect.left, rect.left + rect.width);
                ys.push(rect.top, rect.top + rect.height);
            });
            const minX = Math.max(Math.min(...xs), pz.left);
            const maxX = Math.min(Math.max(...xs), pz.left + pz.width);
            const minY = Math.max(Math.min(...ys), pz.top);
            const maxY = Math.min(Math.max(...ys), pz.top + pz.height);
            const bboxW = Math.max(0, maxX - minX);
            const bboxH = Math.max(0, maxY - minY);
            const w    = parseFloat(((bboxW / pz.width)  * physW).toFixed(2));
            const h    = parseFloat(((bboxH / pz.height) * physH).toFixed(2));
            const x_cm = parseFloat((((minX - pz.left) / pz.width)  * physW).toFixed(2));
            const y_cm = parseFloat((((minY - pz.top)  / pz.height) * physH).toFixed(2));
            // px values in original background image pixel space
            // pz coords are scaled (canvas px), imgZoneW/H are unscaled (original image px)
            // ratio = 1/scaleFactor, so: orig_px = canvas_px * (imgZoneW / pz.width)
            return {
                w, h, x_cm, y_cm,
                px_x: Math.round((minX - pz.left) / pz.width  * imgZoneW),
                px_y: Math.round((minY - pz.top)  / pz.height * imgZoneH),
                px_w: Math.round(bboxW             / pz.width  * imgZoneW),
                px_h: Math.round(bboxH             / pz.height * imgZoneH),
            };
        };

        // Current (active) side
        if (printZoneBoundsRef.current) {
            const physW    = currentTemplate.print_area_config?.physical_w_cm ?? 30.48;
            const physH    = currentTemplate.print_area_config?.physical_h_cm ?? 40.64;
            const imgZoneW = currentTemplate.print_area_config?.width  ?? printZoneBoundsRef.current.width;
            const imgZoneH = currentTemplate.print_area_config?.height ?? printZoneBoundsRef.current.height;
            const result = computeSideAabb(fabricRef.current.getObjects(), printZoneBoundsRef.current, physW, physH, imgZoneW, imgZoneH);
            if (result) {
                print_dimensions[currentTemplate.side] = result;
            }
        }

        // Other sides for the same color
        const otherSideTemplates = templates.filter(
            t => t.color?.id === selectedColorId && t.id !== currentTemplate.id
        );
        const canvasW = fabricRef.current.getWidth();
        const canvasH = fabricRef.current.getHeight();

        for (const tmpl of otherSideTemplates) {
            const saved = savedDesigns.current[tmpl.id];
            const json = saved?.json || saved;
            if (!json) continue;

            const sideCanvas = new fabric.StaticCanvas(null, { width: canvasW, height: canvasH });
            const clonedSideJson = proxyCanvasJson(
              typeof json === 'string' ? json : JSON.parse(JSON.stringify(json))
            );
            await new Promise<void>(resolve => sideCanvas.loadFromJSON(clonedSideJson, () => resolve()));

            const sidePz = saved?.bounds || printZoneBoundsRef.current;
            if (sidePz) {
                const physW    = tmpl.print_area_config?.physical_w_cm ?? 30.48;
                const physH    = tmpl.print_area_config?.physical_h_cm ?? 40.64;
                const imgZoneW = tmpl.print_area_config?.width  ?? sidePz.width;
                const imgZoneH = tmpl.print_area_config?.height ?? sidePz.height;
                const result = computeSideAabb(sideCanvas.getObjects(), sidePz, physW, physH, imgZoneW, imgZoneH);
                if (result) {
                    print_dimensions[tmpl.side] = result;
                }
            }
            sideCanvas.dispose();
        }

        // -------------------------------------------------------------------
        // 4. Save to Backend
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
                print_file_url: printFilePayload,
                design_hash: currentHash,
                print_dimensions: Object.keys(print_dimensions).length > 0 ? print_dimensions : undefined,
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
                print_file_url: printFilePayload,
                design_hash: currentHash,
                print_dimensions: Object.keys(print_dimensions).length > 0 ? print_dimensions : undefined,
             };

             const response = await api.post('/designs', createPayload);
             if (response.data?.design?.id) {
                 targetId = response.data.design.id;
             }
        }
        
        // Success Actions
        setCurrentPreviewUrl(previewUrl);
        isDirtyRef.current = false;
        setIsDirty(false);

        if (!silent) {
            setNotification({ type: 'success', title: 'บันทึกสำเร็จ', message: 'บันทึกงานออกแบบเรียบร้อยแล้ว' });
        }
        
        return { targetId, printFilePayload, print_dimensions }; // Return useful data

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

const handleMockup = async () => {
    saveCurrentCanvas();
    setGeneratingMockup(true);
    try {
        const results: { side: string; url: string }[] = [];
        for (const [templateId, saved] of Object.entries(savedDesigns.current)) {
            const template = templates.find(t => t.id === templateId);
            if (!template || template.color?.id !== selectedColorId) continue;
            if (!template.mockup_config) continue;
            const savedData = (saved as any).json || saved;
            const bounds = (saved as any).bounds ?? printZoneBoundsRef.current;
            if (!savedData || !bounds) continue;
            const designUrl = await renderSideForMockup(savedData, bounds, template.mockup_config.placement.w * OUTPUT_SCALE);
            const composited = await compositeSingleSide(
                template.mockup_config.image_url,
                template.mockup_config.placement,
                designUrl
            );
            results.push({ side: template.side, url: composited });
        }
        results.sort((a, b) => (a.side.toLowerCase() === 'front' ? 0 : 1) - (b.side.toLowerCase() === 'front' ? 0 : 1));
        setMockupUrl(results);
        setShowMockup(true);
    } finally {
        setGeneratingMockup(false);
    }
};

const handleManualSave = async () => {
    const result = await saveDesign(false);
    if (result?.targetId && result.targetId !== designId) {
        // We just created a new design, navigate to its edit page
        // Format: /design/:productId?designId=:newDesignId
        navigate(`/design/${id}?designId=${result.targetId}`, { replace: true });
    }

    // Calculate price per side, sum print costs, add shirt once
    if (result?.print_dimensions && effectivePrintingType && selectedColorId && currentTemplate) {
        const entries = Object.entries(result.print_dimensions).filter(([, d]) => d.w > 0 && d.h > 0);
        if (entries.length > 0) {
            setPriceLoading(true);
            const sideResults: { side: string; tier: string; print_per_unit: number }[] = [];
            let shirt_per_unit = 0;
            for (const [side, dims] of entries) {
                try {
                    const breakdown = await getPrice({
                        printingType: effectivePrintingType as 'DTG' | 'DTF',
                        aabb_w_cm: dims.w,
                        aabb_h_cm: dims.h,
                        quantity: 1,
                        productId: currentTemplate.product_id,
                        color_id: selectedColorId,
                        size: selectedSize,
                    });
                    shirt_per_unit = breakdown.shirt_per_unit;
                    sideResults.push({ side, tier: breakdown.tier, print_per_unit: breakdown.print_per_unit });
                } catch {
                    // Skip sides with no pricing match
                }
            }
            if (sideResults.length > 0) {
                const total_print_per_unit = sideResults.reduce((sum, s) => sum + s.print_per_unit, 0);
                setPriceBreakdown({
                    sides: sideResults,
                    shirt_per_unit,
                    total_print_per_unit,
                    total_per_unit: shirt_per_unit + total_print_per_unit,
                });
            }
            setPriceLoading(false);
        }
    }
};

  // Manual guard for in-app navigation (BrowserRouter doesn't support useBlocker)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const handleBackClick = () => {
    if (isDirtyRef.current) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/my-products');
    }
  };

  // Block browser close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

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

      {/* UNSAVED CHANGES DIALOG */}
      <AlertDialog open={showUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยังไม่ได้บันทึก</AlertDialogTitle>
            <AlertDialogDescription>
              งานออกแบบยังไม่ได้บันทึก หากออกตอนนี้การเปลี่ยนแปลงจะหายไป ต้องการออกหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>อยู่ต่อ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setShowUnsavedDialog(false); navigate('/my-products'); }}
            >
              ออกโดยไม่บันทึก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HEADER */}
      <div className="h-16 bg-white border-b flex items-center justify-between px-4 z-10 w-full shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <input 
                type="text" 
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="text-lg font-bold px-3 py-1 -ml-3 rounded-md border border-transparent hover:border-border hover:bg-secondary/30 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all h-auto bg-transparent focus:outline-none placeholder-gray-400 w-full"
                placeholder="ตั้งชื่อผลงาน..."
            />

          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMockup} disabled={!templates.some(t => t.color?.id === selectedColorId && t.mockup_config) || generatingMockup}>
                {generatingMockup ? <Loader2 className="w-3 h-3 animate-spin" /> : 'ตัวอย่าง'}
            </Button>
            <Button size="sm" variant={isDirty ? "default" : "outline"} onClick={handleManualSave} disabled={saving}>
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
            <div className="w-80 bg-white shadow-2xl rounded-2xl border flex flex-col z-40 animate-in slide-in-from-left-2 absolute left-24 top-4 bottom-4 overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-lg">คลังรูปภาพ</h3>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-200" onClick={() => setShowImageLibrary(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                
                <div className="p-5 border-b">
                    <label className={`w-full h-12 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all gap-2 shadow-sm ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5'}`}>
                         {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                         <span className="text-sm font-semibold">{isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปใหม่'}</span>
                         <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-5 content-start">
                    {loadingUploads ? (
                        <div className="col-span-2 flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : userUploads.length === 0 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center text-center text-gray-400 py-12 gap-3">
                            <ImageIcon className="w-12 h-12 opacity-20" />
                            <span className="text-sm font-medium">ไม่มีรูปภาพ</span>
                        </div>
                    ) : (
                        userUploads.map((file, i) => (
                           <div key={i} className="relative w-full pb-[100%] bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-black hover:ring-1 hover:ring-black hover:shadow-lg transition-all group" onClick={() => addImageToCanvas(file.url)}>
                               <div className="absolute inset-0 p-3 flex items-center justify-center bg-gray-50/50">
                                   <img src={file.url} alt={file.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                               </div>
                               <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors duration-300 rounded-xl" />
                               <Button 
                                   variant="destructive" 
                                   size="icon" 
                                   className="absolute top-2 right-2 w-7 h-7 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                   onClick={(e) => handleDeleteClick(file.name, e)}
                               >
                                   <Trash2 className="w-3.5 h-3.5" />
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

                    <div className="w-px h-6 bg-gray-200 mx-1" />

                    {/* Print Size Presets */}
                    <span className="text-[10px] text-gray-500 shrink-0">Size</span>
                    <button
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${sizeLockAxis === 'width' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300'}`}
                        onClick={() => setSizeLockAxis('width')}
                        title="Lock width to tier"
                    >W</button>
                    <button
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${sizeLockAxis === 'height' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300'}`}
                        onClick={() => setSizeLockAxis('height')}
                        title="Lock height to tier"
                    >H</button>
                    {(['3x4', 'A5', 'A4', 'A3'] as TierKey[]).map(tier => (
                        <button
                            key={tier}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-700"
                            onClick={() => applyPresetSize(tier, sizeLockAxis)}
                            title={`Resize to ${tier} (${PRINT_TIERS[tier][0]}×${PRINT_TIERS[tier][1]}")`}
                        >
                            {tier === '3x4' ? '3×4' : tier}
                        </button>
                    ))}

                    <div className="w-px h-6 bg-gray-200 mx-1" />

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

                {/* PRICE CARD — always visible */}
                <div className="w-48 bg-white p-3 rounded-xl shadow-xl border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase text-gray-400 font-bold">ราคาโดยประมาณ</span>
                        {priceLoading
                            ? <Loader2 className="w-3 h-3 text-gray-300 animate-spin" />
                            : <span className="text-[9px] text-gray-300">1 ชิ้น</span>
                        }
                    </div>
                    {priceLoading ? (
                        <div className="space-y-2 py-1">
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/5 mt-3" />
                        </div>
                    ) : priceBreakdown ? (
                        <>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>เสื้อ (size {selectedSize})</span>
                                <span>฿{priceBreakdown.shirt_per_unit.toLocaleString()}</span>
                            </div>
                            {priceBreakdown.sides.map(s => (
                                <div key={s.side} className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>พิมพ์ {s.side} ({s.tier})</span>
                                    <span>฿{s.print_per_unit.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm font-bold border-t pt-2 mt-1">
                                <span>รวม/ชิ้น</span>
                                <span className="text-teal-700">฿{priceBreakdown.total_per_unit.toLocaleString()}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-gray-300 text-center py-3">บันทึกเพื่อดูราคา</p>
                    )}
                </div>

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
                                        src={(obj as fabric.Image).getSrc() || undefined}
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
            {/* DPI Warning Dialog */}
            <AlertDialog open={!!dpiWarningFile} onOpenChange={(open) => !open && setDpiWarningFile(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ความละเอียดรูปภาพต่ำ</AlertDialogTitle>
                        <AlertDialogDescription>
                            รูปภาพนี้มีความละเอียดประมาณ <strong>{dpiWarningFile?.dpi} DPI</strong> ซึ่งต่ำกว่า 150 DPI ที่แนะนำสำหรับงานพิมพ์{' '}
                            ผลลัพธ์การพิมพ์อาจไม่คมชัดหรือเบลอได้ คุณต้องการอัปโหลดต่อหรือไม่?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDpiWarningFile(null)}>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                const file = dpiWarningFile!.file;
                                setDpiWarningFile(null);
                                proceedWithUpload(file);
                            }}
                        >
                            อัปโหลดต่อ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
        {/* Mockup Preview Dialog */}
        <Dialog open={showMockup} onOpenChange={setShowMockup}>
            <DialogContent className="max-w-4xl p-8 bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-black text-center tracking-tight uppercase">
                        Mockup Preview
                    </DialogTitle>
                    <p className="text-center text-sm text-gray-500 mt-1">
                        ตรวจสอบตัวอย่างงานสกรีนบนเสื้อก่อนสั่งซื้อ
                    </p>
                </DialogHeader>
                <div className="flex gap-6 flex-wrap justify-center items-stretch mt-4">
                    {mockupUrl.map(({ side, url }) => (
                        <div key={side} className="flex flex-col items-center gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 w-[300px]">
                            <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">{side}</p>
                            <div className="relative group overflow-hidden rounded-xl bg-white w-full aspect-[4/5] flex items-center justify-center border border-slate-100/50">
                                <img src={url} alt={`mockup-${side}`} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </div>
                            <a href={url} download={`mockup-${side}.png`} className="w-full mt-auto">
                                <Button variant="outline" className="w-full rounded-xl hover:bg-black hover:text-white transition-colors border-slate-200 shadow-sm">
                                    ดาวน์โหลดรูปภาพ
                                </Button>
                            </a>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}