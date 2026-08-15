import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Konva from 'konva';
import { MD5 } from 'crypto-js';
import api, { getProductTemplates, getProductById, uploadFile, r2ProxyUrl, getPrice } from '../services/api';
import { compositeSingleSide, OUTPUT_SCALE } from '../utils/mockupCompositor';
import { injectPngDpi } from '../utils/canvasExporter';
import { useAuth } from '../contexts/AuthContext';
import { isLegacyDtfPrintingType } from '../constants/printing';
import type { ProductTemplate, Color } from '../types/api';
import type { CanvasImage, SerializableImage, CanvasPriceBreakdown } from '../types/canvas';
import {
    serializeCanvasImage,
    deserializeCanvasCoords,
    zoneFromTemplate,
    inferSaveScaleFactor,
    type CanvasDataMeta,
} from '../utils/canvasCoords';
import {
    startStudioSession,
    endStudioSession,
    trackStudioCanvasReady,
    trackStudioArtworkAdded,
    trackStudioPreviewOpened,
    trackStudioSaveSucceeded,
    trackStudioSaveBlockedName,
    trackStudioSaveFailed,
    trackStudioAddToCart,
    trackStudioAddToCartFailed,
    trackStudioLeft,
    trackStudioCanvasBlank,
    trackStudioTemplateLoadFailed,
    trackStudioArtworkRestoreFailed,
    trackStudioUploadFailed,
    trackStudioMockupFailed,
    type StudioSource,
} from '../lib/studioAnalytics';

export const SIDE_ORDER = ['front', 'back'];

export function useCanvasDesign() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCart();
    const designIdParam = searchParams.get('designId');
    const printingTypeParam = (searchParams.get('printingType') || searchParams.get('printing_type'))?.toUpperCase();
    const { user } = useAuth();

    // Block new DTF studio entry via URL param
    useEffect(() => {
        if (printingTypeParam === 'DTF' && !designIdParam && id) {
            navigate(`/studio/${id}?printingType=DTG`, { replace: true });
        }
    }, [printingTypeParam, designIdParam, id, navigate]);

    // Konva refs
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const bgNodeRef = useRef<Konva.Image>(null);
    const printZoneNodeRef = useRef<Konva.Rect>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    // Canvas state
    const [templates, setTemplates] = useState<ProductTemplate[]>([]);
    const [currentTemplate, setCurrentTemplate] = useState<ProductTemplate | null>(null);
    const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [printZone, setPrintZone] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
    const [canvasImages, setCanvasImages] = useState<CanvasImage[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [liveSizeIn, setLiveSizeIn] = useState<{ w: number; h: number } | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportedUrl, setExportedUrl] = useState<string | null>(null);

    // Color selection
    const [activeColorIds, setActiveColorIds] = useState<Set<string>>(new Set());
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Save state
    const [designId, setDesignId] = useState<string | null>(null);
    const [designName, setDesignName] = useState('Untitled Design');
    const [printingType, setPrintingType] = useState<string>(
        printingTypeParam === 'DTF' && !designIdParam ? 'DTG' : (printingTypeParam ?? 'DTG')
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [nameError, setNameError] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const markDirty = () => setIsDirty(true);

    // Pricing state
    const [priceBreakdown, setPriceBreakdown] = useState<CanvasPriceBreakdown | null>(null);
    const [priceLoading, setPriceLoading] = useState(false);

    // Order state
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Mockup state
    const [showMockup, setShowMockup] = useState(false);
    const [mockupUrl, setMockupUrl] = useState<{ side: string; url: string }[]>([]);
    const [generatingMockup, setGeneratingMockup] = useState(false);

    // Per-side storage (keyed by side name e.g. "front"/"back" — shared across all colors)
    const sideCanvasImages = useRef<Record<string, CanvasImage[]>>({});
    const sideZones = useRef<Record<string, { left: number; top: number; width: number; height: number }>>({});
    const pendingSideData = useRef<Record<string, SerializableImage[]>>({});
    const loadedCanvasMeta = useRef<CanvasDataMeta>({});
    const naturalImageSize = useRef({ width: 0, height: 0 });
    const lastScaleFactor = useRef<number | null>(null);
    const currentTemplateRef = useRef<ProductTemplate | null>(null);
    currentTemplateRef.current = currentTemplate;

    // Sidebar / library state
    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [showLayerPanel, setShowLayerPanel] = useState(false);
    const [userUploads, setUserUploads] = useState<{ name: string; url: string }[]>([]);
    const [loadingUploads, setLoadingUploads] = useState(false);
    const [uploadsError, setUploadsError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [deleteImageName, setDeleteImageName] = useState<string | null>(null);
    const [dpiWarningFile, setDpiWarningFile] = useState<{ file: File; dpi: number } | null>(null);

    const studioSessionStarted = useRef(false);
    const studioOpenedAt = useRef(0);
    const blankCanvasReported = useRef(false);
    const containerBlankReported = useRef(false);

    const hasAnyArtwork = useCallback(() => {
        if (canvasImages.length > 0) return true;
        return Object.values(sideCanvasImages.current).some((imgs) => imgs.length > 0);
    }, [canvasImages]);

    const reportStudioExit = useCallback((
        exitType: 'back' | 'leave_modal' | 'pagehide',
        isDirtyNow: boolean,
    ) => {
        trackStudioLeft({
            had_artwork: hasAnyArtwork(),
            is_dirty: isDirtyNow,
            exit_type: exitType,
        });
    }, [hasAnyArtwork]);

    // ── Studio analytics session ─────────────────────────────────────────────
    useEffect(() => {
        if (!id || studioSessionStarted.current) return;
        studioSessionStarted.current = true;
        studioOpenedAt.current = Date.now();

        const navState = location.state as { studioSource?: StudioSource } | null;
        startStudioSession({
            product_id: id,
            design_id: designIdParam,
            is_existing: !!designIdParam,
            printing_type: printingTypeParam ?? printingType ?? 'DTG',
            source: navState?.studioSource ?? (designIdParam ? 'existing_design' : 'unknown'),
        });

        return () => {
            endStudioSession();
            studioSessionStarted.current = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ── Blank canvas detector (template loaded but bg never appears) ─────────
    useEffect(() => {
        if (!currentTemplate || bgImage) return;
        const timer = window.setTimeout(() => {
            if (currentTemplateRef.current && !bgImage && !blankCanvasReported.current) {
                blankCanvasReported.current = true;
                trackStudioCanvasBlank('timeout');
            }
        }, 8000);
        return () => window.clearTimeout(timer);
    }, [currentTemplate, bgImage]);

    // ── Close color picker on outside click ──────────────────────────────────
    useEffect(() => {
        if (!showColorPicker) return;
        const handler = (e: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
                setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showColorPicker]);

    // ── Template loading ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        Promise.all([
            getProductTemplates(id),
            getProductById(id).catch(() => null),
        ]).then(async ([data, product]) => {
            const sizes = product?.available_sizes?.length ? product.available_sizes : [];
            setAvailableSizes(sizes);
            const defaultSize = sizes[0] ?? '';
            if (defaultSize) setSelectedSize(defaultSize);

            setTemplates(data);
            // Prefer is_default → then front side → then first
            const defaultTemplate = data.find(t => t.is_default)
                ?? data.find(t => t.side?.toLowerCase() === 'front')
                ?? data[0] ?? null;
            let targetTemplate = defaultTemplate;
            if (defaultTemplate?.color?.id) {
                setSelectedColorId(defaultTemplate.color.id);
                setActiveColorIds(new Set([defaultTemplate.color.id]));
            }

            if (designIdParam) {
                try {
                    const { data: design } = await api.get(`/designs/${designIdParam}`);
                    setDesignId(designIdParam);
                    if (design.design_name) setDesignName(design.design_name);
                    if (design.printing_type) setPrintingType(design.printing_type);
                    if (Array.isArray(design.available_colors) && design.available_colors.length > 0) {
                        setActiveColorIds(new Set(design.available_colors));
                    }
                    // Load price from stored print_dimensions if available
                    if (design.print_dimensions && design.printing_type) {
                        const colorId = design.available_colors?.[0] ?? defaultTemplate?.color?.id;
                        const productId = defaultTemplate?.product_id;
                        if (colorId && productId) {
                            const dims = Object.fromEntries(
                                Object.entries(design.print_dimensions as Record<string, { w: number; h: number }>)
                                    .filter(([, d]) => d.w > 0 && d.h > 0)
                            );
                            computePriceBreakdown(dims, productId, colorId, design.printing_type, defaultSize);
                        }
                    }

                    const canvasData = design.canvas_data;
                    loadedCanvasMeta.current = {
                        version: canvasData?.version,
                        stageScaleFactor: canvasData?.stageScaleFactor,
                    };
                    const firstColorId = design.available_colors?.[0] ?? null;
                    if (canvasData?.renderer === 'konva') {
                        if (canvasData.sides) {
                            if (canvasData.activeSide) {
                                // New format: sides keyed by side name ("front"/"back")
                                pendingSideData.current = canvasData.sides;
                                const saved = (firstColorId ? data.find(t => t.side === canvasData.activeSide && t.color?.id === firstColorId) : null)
                                    ?? data.find(t => t.side === canvasData.activeSide)
                                    ?? data.find(t => canvasData.sides[t.side]);
                                if (saved) { targetTemplate = saved; setSelectedColorId(saved.color?.id ?? null); }
                            } else {
                                // Old format: sides keyed by template ID — convert
                                const converted: Record<string, SerializableImage[]> = {};
                                for (const [key, imgs] of Object.entries(canvasData.sides as Record<string, SerializableImage[]>)) {
                                    const tmpl = data.find(t => t.id === key);
                                    if (tmpl) converted[tmpl.side] = imgs;
                                }
                                pendingSideData.current = converted;
                                const saved = data.find(t => t.id === canvasData.activeTemplateId)
                                    ?? (firstColorId ? data.find(t => canvasData.sides[t.id] && t.color?.id === firstColorId) : null)
                                    ?? data.find(t => canvasData.sides[t.id]);
                                if (saved) { targetTemplate = saved; setSelectedColorId(saved.color?.id ?? null); }
                            }
                        } else if (canvasData.templateId && canvasData.images?.length) {
                            // Oldest single-side format
                            const tmpl = data.find(t => t.id === canvasData.templateId);
                            if (tmpl) {
                                pendingSideData.current = { [tmpl.side]: canvasData.images };
                                targetTemplate = tmpl;
                                setSelectedColorId(tmpl.color?.id ?? null);
                            }
                        }
                    }
                } catch (err) {
                    console.error('[CanvasDesign] Failed to load design:', err);
                }
            }

            setCurrentTemplate(targetTemplate);
        });
    }, [id, designIdParam]);

    const recalculateStageSize = useCallback((rescaleImages = false) => {
        const template = currentTemplateRef.current;
        const { width: imgW, height: imgH } = naturalImageSize.current;
        if (!template || !imgW || !imgH || !containerRef.current) return;

        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        if (containerW < 16 || containerH < 16) {
            if (!containerBlankReported.current) {
                containerBlankReported.current = true;
                trackStudioCanvasBlank('container_too_small');
            }
            return;
        }

        const sf = Math.min(containerW / imgW, containerH / imgH, 1) * 0.95;
        if (!Number.isFinite(sf) || sf <= 0) return;

        if (rescaleImages && lastScaleFactor.current && lastScaleFactor.current !== sf) {
            const ratio = sf / lastScaleFactor.current;
            const rescale = (images: CanvasImage[]) =>
                images.map(ci => ({
                    ...ci,
                    x: ci.x * ratio,
                    y: ci.y * ratio,
                    width: ci.width * ratio,
                    height: ci.height * ratio,
                }));
            setCanvasImages(prev => {
                const updated = rescale(prev);
                sideCanvasImages.current[template.side] = updated;
                return updated;
            });
            for (const side of Object.keys(sideZones.current)) {
                const zone = sideZones.current[side];
                if (zone) {
                    sideZones.current[side] = {
                        left: zone.left * ratio,
                        top: zone.top * ratio,
                        width: zone.width * ratio,
                        height: zone.height * ratio,
                    };
                }
            }
        }

        lastScaleFactor.current = sf;
        setStageSize({ width: imgW * sf, height: imgH * sf });
        const pz = template.print_area_config;
        const pzScaled = { left: pz.x * sf, top: pz.y * sf, width: pz.width * sf, height: pz.height * sf };
        setPrintZone(pzScaled);
        sideZones.current[template.side] = pzScaled;
    }, []);

    // ── Background image + side restore ──────────────────────────────────────
    const restoreSideImages = useCallback((template: ProductTemplate) => {
        const pending = pendingSideData.current[template.side];
        const zone = sideZones.current[template.side];
        const sf = lastScaleFactor.current;
        const { width: imgW, height: imgH } = naturalImageSize.current;

        if (!pending?.length) {
            setCanvasImages(sideCanvasImages.current[template.side] ?? []);
            return;
        }
        if (!zone || !sf || !imgW || !imgH) return;

        delete pendingSideData.current[template.side];
        const meta = loadedCanvasMeta.current;
        const legacySfSave = meta.stageScaleFactor ?? inferSaveScaleFactor(pending, imgW, imgH);

        Promise.all(
            pending.map((d) => {
                const coords = deserializeCanvasCoords(d, zone, {
                    ...meta,
                    stageScaleFactor: legacySfSave,
                    imgW,
                    imgH,
                    sfLoad: sf,
                });
                return new Promise<CanvasImage | null>((resolve) => {
                    const i = new window.Image();
                    i.crossOrigin = 'anonymous';
                    i.onload = () => resolve({
                        id: d.id,
                        image: i,
                        src: d.src,
                        ...coords,
                        rotation: d.rotation ?? 0,
                    });
                    i.onerror = () => {
                        console.error('[CanvasDesign] Failed to restore layer image:', d.src);
                        resolve(null);
                    };
                    i.src = r2ProxyUrl(d.src);
                });
            }),
        ).then(results => {
            const loaded = results.filter((ci): ci is CanvasImage => ci !== null);
            if (loaded.length < pending.length) {
                console.warn(`[CanvasDesign] Restored ${loaded.length}/${pending.length} layer(s) on ${template.side}`);
                trackStudioArtworkRestoreFailed(loaded.length, pending.length);
            }
            sideCanvasImages.current[template.side] = loaded;
            setCanvasImages(loaded);
        });
    }, []);

    useEffect(() => {
        if (!currentTemplate) return;
        const template = currentTemplate;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            naturalImageSize.current = { width: img.width, height: img.height };
            lastScaleFactor.current = null;
            setBgImage(img);
            setSelectedId(null);

            const finishLayout = () => {
                recalculateStageSize(false);
                restoreSideImages(template);
                if (studioOpenedAt.current) {
                    trackStudioCanvasReady(Date.now() - studioOpenedAt.current);
                }
            };

            // Wait for container layout to settle (especially mobile) before restoring layers
            requestAnimationFrame(() => {
                requestAnimationFrame(finishLayout);
            });
        };
        img.onerror = () => {
            console.error('[CanvasDesign] image load failed:', template.image_url);
            trackStudioTemplateLoadFailed();
        };
        img.src = r2ProxyUrl(template.image_url);
    }, [currentTemplate, recalculateStageSize, restoreSideImages]);

    // ── Resize stage when container changes (rotation, browser chrome) ───────
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => recalculateStageSize(true));
        ro.observe(el);
        return () => ro.disconnect();
    }, [recalculateStageSize]);

    // ── Transformer attachment ────────────────────────────────────────────────
    useEffect(() => {
        const tr = transformerRef.current;
        const stage = stageRef.current;
        if (!tr || !stage) return;
        if (selectedId) {
            const node = stage.findOne(`#${selectedId}`);
            if (node) { tr.nodes([node]); tr.getLayer()?.batchDraw(); }
        } else {
            tr.nodes([]); tr.getLayer()?.batchDraw();
        }
        setLiveSizeIn(null);
    }, [selectedId]);

    // ── Fetch user uploads ────────────────────────────────────────────────────
    const fetchUserUploads = async () => {
        if (!user) return;
        setLoadingUploads(true);
        setUploadsError(null);
        try {
            const { data } = await api.get<{ name: string; url: string }[]>('/uploads/assets');
            setUserUploads(data);
        } catch (err) {
            console.error('[CanvasDesign] fetchUserUploads failed:', err);
            setUploadsError('โหลดคลังรูปไม่สำเร็จ — ลองเข้าสู่ระบบใหม่');
        } finally {
            setLoadingUploads(false);
        }
    };

    useEffect(() => {
        if (showImageLibrary && user) fetchUserUploads();
    }, [showImageLibrary, user?.id]);

    // ── Derived values ────────────────────────────────────────────────────────
    const pxPerInch = printZone && currentTemplate
        ? printZone.width / ((currentTemplate.print_area_config.physical_w_cm ?? 30.48) / 2.54)
        : null;

    const selectedImage = canvasImages.find(ci => ci.id === selectedId);
    const selectedSizeIn = selectedImage && pxPerInch
        ? { w: selectedImage.width / pxPerInch, h: selectedImage.height / pxPerInch }
        : null;
    const displaySizeIn = liveSizeIn ?? selectedSizeIn;

    const currentSides = (selectedColorId != null
        ? templates.filter(t => t.color?.id === selectedColorId)
        : templates
    ).slice().sort((a, b) => {
        const ai = SIDE_ORDER.indexOf(a.side?.toLowerCase() ?? '');
        const bi = SIDE_ORDER.indexOf(b.side?.toLowerCase() ?? '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const uniqueColors: Color[] = Array.from(
        new Map(templates.map(t => [t.color?.id, t.color])).values()
    ).filter((c): c is Color => !!c);

    // ── Layer helpers ─────────────────────────────────────────────────────────
    const moveLayer = (layerId: string, delta: 'forward' | 'backward') => {
        markDirty();
        setCanvasImages(prev => {
            const idx = prev.findIndex(ci => ci.id === layerId);
            if (idx === -1) return prev;
            const arr = [...prev];
            if (delta === 'forward' && idx < arr.length - 1) {
                [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
            } else if (delta === 'backward' && idx > 0) {
                [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
            }
            return arr;
        });
    };

    const handleDesignNameChange = (name: string) => {
        setDesignName(name);
        setNameError(false);
        markDirty();
    };

    // ── Side / color helpers ──────────────────────────────────────────────────
    const saveCurrentSide = () => {
        if (currentTemplate) sideCanvasImages.current[currentTemplate.side] = canvasImages;
    };

    const handleColorSelect = (colorId: string) => {
        saveCurrentSide();
        setSelectedColorId(colorId);
        markDirty();
        const sameSide = templates.find(t => t.color?.id === colorId && t.side === currentTemplate?.side);
        const first = sameSide ?? templates.find(t => t.color?.id === colorId);
        if (first) setCurrentTemplate(first);
    };

    const handleColorAdd = (colorId: string) => {
        setActiveColorIds(prev => new Set([...prev, colorId]));
        handleColorSelect(colorId);
    };

    const handleColorRemove = (colorId: string) => {
        const next = new Set(activeColorIds);
        next.delete(colorId);
        setActiveColorIds(next);
        if (selectedColorId === colorId) handleColorSelect([...next][0]);
    };

    // ── Image helpers ─────────────────────────────────────────────────────────
    const addImageFromUrl = (url: string, method: 'upload' | 'library' = 'library') => {
        if (!printZone) return;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const scale = Math.min(printZone.width / img.width, printZone.height / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = printZone.left + (printZone.width - w) / 2;
            const y = printZone.top + (printZone.height - h) / 2;
            const newId = Math.random().toString(36).substring(7);
            setCanvasImages(prev => {
                const next = [...prev, { id: newId, image: img, src: url, x, y, width: w, height: h }];
                trackStudioArtworkAdded(method, next.length);
                return next;
            });
            setSelectedId(newId);
            markDirty();
        };
        img.src = r2ProxyUrl(url);
    };

    const handleSidebarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        const physW_cm = currentTemplate?.print_area_config?.physical_w_cm ?? 30.48;
        const physH_cm = currentTemplate?.print_area_config?.physical_h_cm ?? 40.64;
        const dpi = await new Promise<number>(resolve => {
            const img = new window.Image();
            const url = URL.createObjectURL(file);
            img.onload = () => { URL.revokeObjectURL(url); resolve(Math.min(img.naturalWidth / (physW_cm / 2.54), img.naturalHeight / (physH_cm / 2.54))); };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(Infinity); };
            img.src = url;
        });
        if (dpi < 150) { setDpiWarningFile({ file, dpi: Math.round(dpi) }); return; }
        await proceedWithUpload(file);
    };

    const proceedWithUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const url = await uploadFile(file, 'asset');
            addImageFromUrl(url, 'upload');
            fetchUserUploads();
        } catch (err) {
            console.error('[CanvasDesign] upload failed:', err);
            const status = (err as { response?: { status?: number } })?.response?.status;
            trackStudioUploadFailed(status ? `http_${status}` : 'unknown');
        } finally {
            setIsUploading(false);
            setDpiWarningFile(null);
        }
    };

    const confirmDeleteImage = async () => {
        if (!deleteImageName) return;
        try {
            await api.delete(`/uploads/assets/${encodeURIComponent(deleteImageName)}`);
            setUserUploads(prev => prev.filter(f => f.name !== deleteImageName));
        } catch (err) {
            console.error('[CanvasDesign] delete failed:', err);
        } finally {
            setDeleteImageName(null);
        }
    };

    // ── Stage event handlers (called from CanvasStage) ────────────────────────
    const handleStageDragEnd = (imgId: string, x: number, y: number) => {
        setCanvasImages(prev => prev.map(item => item.id === imgId ? { ...item, x, y } : item));
        markDirty();
    };

    const handleStageTransform = (scaledW: number, scaledH: number) => {
        if (!pxPerInch) return;
        setLiveSizeIn({ w: Math.max(10, scaledW) / pxPerInch, h: Math.max(10, scaledH) / pxPerInch });
    };

    const handleStageTransformEnd = (imgId: string, x: number, y: number, scaledW: number, scaledH: number, rotation: number) => {
        setCanvasImages(prev => prev.map(item =>
            item.id === imgId ? { ...item, x, y, width: Math.max(10, scaledW), height: Math.max(10, scaledH), rotation } : item
        ));
        setLiveSizeIn(null);
        markDirty();
    };

    const applySizeIn = (w: number, h: number) => {
        if (!selectedId || !pxPerInch) return;
        setCanvasImages(prev => prev.map(ci =>
            ci.id === selectedId
                ? { ...ci, width: Math.max(10, w * pxPerInch), height: Math.max(10, h * pxPerInch) }
                : ci
        ));
        markDirty();
    };

    // ── Print helpers ─────────────────────────────────────────────────────────
    const computeSideAabb = (
        images: CanvasImage[],
        pzScaled: { left: number; top: number; width: number; height: number },
        physW_cm: number, physH_cm: number,
        imgZoneW: number, imgZoneH: number,
    ): { w: number; h: number; x_cm: number; y_cm: number; px_x: number; px_y: number; px_w: number; px_h: number } | null => {
        if (!images.length) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const ci of images) {
            minX = Math.min(minX, ci.x); minY = Math.min(minY, ci.y);
            maxX = Math.max(maxX, ci.x + ci.width); maxY = Math.max(maxY, ci.y + ci.height);
        }
        const cx = Math.max(minX, pzScaled.left);
        const cy = Math.max(minY, pzScaled.top);
        const cx2 = Math.min(maxX, pzScaled.left + pzScaled.width);
        const cy2 = Math.min(maxY, pzScaled.top + pzScaled.height);
        if (cx2 <= cx || cy2 <= cy) return null;
        const rx = cx - pzScaled.left, ry = cy - pzScaled.top;
        const rw = cx2 - cx, rh = cy2 - cy;
        const sfW = imgZoneW / pzScaled.width, sfH = imgZoneH / pzScaled.height;
        return {
            w: rw * physW_cm / pzScaled.width, h: rh * physH_cm / pzScaled.height,
            x_cm: rx * physW_cm / pzScaled.width, y_cm: ry * physH_cm / pzScaled.height,
            px_x: Math.round(rx * sfW), px_y: Math.round(ry * sfH),
            px_w: Math.round(rw * sfW), px_h: Math.round(rh * sfH),
        };
    };

    const capturePrintBlob = async (): Promise<Blob | null> => {
        if (!stageRef.current || !printZone || !currentTemplate) return null;
        const pz = currentTemplate.print_area_config;
        const pixelRatio = ((pz.physical_w_cm ?? 30.48) / 2.54 * 300) / printZone.width;
        const tr = transformerRef.current;
        const prevNodes = tr?.nodes() ?? [];
        tr?.nodes([]);
        bgNodeRef.current?.hide();
        printZoneNodeRef.current?.hide();
        stageRef.current.getLayers()[0]?.batchDraw();
        const dataURL = stageRef.current.toDataURL({
            x: printZone.left, y: printZone.top,
            width: printZone.width, height: printZone.height,
            pixelRatio, mimeType: 'image/png',
        });
        bgNodeRef.current?.show();
        printZoneNodeRef.current?.show();
        if (prevNodes.length) tr?.nodes(prevNodes);
        stageRef.current.getLayers()[0]?.batchDraw();
        const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
        const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return new Blob([new Uint8Array(injectPngDpi(raw, 300))], { type: 'image/png' });
    };

    const captureOffScreenBlob = async (tmpl: ProductTemplate, images: CanvasImage[]): Promise<Blob | null> => {
        if (!images.length) return null;
        const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new window.Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = r2ProxyUrl(tmpl.image_url);
        });
        const containerW = containerRef.current?.clientWidth || window.innerWidth - 80;
        const containerH = (containerRef.current?.clientHeight || window.innerHeight) - 48;
        const sf = Math.min(containerW / bgImg.width, containerH / bgImg.height, 1) * 0.95;
        const pz = tmpl.print_area_config;
        const pzScaled = { left: pz.x * sf, top: pz.y * sf, width: pz.width * sf, height: pz.height * sf };
        const pixelRatio = ((pz.physical_w_cm ?? 30.48) / 2.54 * 300) / pzScaled.width;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(pzScaled.width * pixelRatio);
        canvas.height = Math.round(pzScaled.height * pixelRatio);
        const ctx = canvas.getContext('2d')!;
        ctx.scale(pixelRatio, pixelRatio);
        ctx.translate(-pzScaled.left, -pzScaled.top);
        images.forEach(ci => ctx.drawImage(ci.image, ci.x, ci.y, ci.width, ci.height));
        const base64 = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
        const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return new Blob([new Uint8Array(injectPngDpi(raw, 300))], { type: 'image/png' });
    };

    // ── Price calculation ─────────────────────────────────────────────────────
    const computePriceBreakdown = async (
        printDimensions: Record<string, { w: number; h: number }>,
        productId: string,
        colorId: string,
        pType: string,
        size?: string,
    ) => {
        const sizeToUse = size ?? selectedSize;
        if (!sizeToUse) return;
        const entries = Object.entries(printDimensions).filter(([, d]) => d.w > 0 && d.h > 0);
        if (!entries.length) return;
        setPriceLoading(true);
        try {
            const sideResults: CanvasPriceBreakdown['sides'] = [];
            let shirt_per_unit = 0;
            for (const [side, dims] of entries) {
                try {
                    const bd = await getPrice({
                        printingType: pType as 'DTG' | 'DTF',
                        aabb_w_cm: dims.w,
                        aabb_h_cm: dims.h,
                        quantity: 1,
                        productId,
                        color_id: colorId,
                        size: sizeToUse,
                    });
                    shirt_per_unit = bd.shirt_per_unit;
                    sideResults.push({ side, tier: bd.tier, print_per_unit: bd.print_per_unit });
                } catch { /* skip sides with no pricing match */ }
            }
            if (sideResults.length > 0) {
                const total_print_per_unit = sideResults.reduce((s, r) => s + r.print_per_unit, 0);
                const selectedColor = templates.find(t => t.color?.id === colorId)?.color ?? null;
                setPriceBreakdown({
                    sides: sideResults,
                    shirt_per_unit,
                    total_print_per_unit,
                    total_per_unit: shirt_per_unit + total_print_per_unit,
                    color_name: selectedColor?.name ?? null,
                    color_hex: selectedColor?.hex_code ?? null,
                });
            }
        } catch (err) {
            console.error('[CanvasDesign] computePriceBreakdown failed:', err);
        } finally {
            setPriceLoading(false);
        }
    };

    // ── Export ────────────────────────────────────────────────────────────────
    const handleExport = async () => {
        if (!currentTemplate || !printZone) return;
        setIsExporting(true);
        setExportedUrl(null);
        try {
            const blob = await capturePrintBlob();
            if (!blob) return;
            const url = await uploadFile(blob, 'print', `${Math.random().toString(36).substring(7)}_konva_test.png`);
            setExportedUrl(url);
        } catch (err) {
            console.error('[CanvasDesign] Export failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    // ── Mockup ────────────────────────────────────────────────────────────────
    const captureDesignDataUrl = (placement: { w: number; h: number }): string | null => {
        if (!stageRef.current || !printZone) return null;
        const pixelRatio = (placement.w * OUTPUT_SCALE) / printZone.width;
        const tr = transformerRef.current;
        const prevNodes = tr?.nodes() ?? [];
        tr?.nodes([]);
        bgNodeRef.current?.hide();
        printZoneNodeRef.current?.hide();
        stageRef.current.getLayers()[0]?.batchDraw();
        const dataUrl = stageRef.current.toDataURL({
            x: printZone.left, y: printZone.top,
            width: printZone.width, height: printZone.height,
            pixelRatio,
        });
        bgNodeRef.current?.show();
        printZoneNodeRef.current?.show();
        if (prevNodes.length) tr?.nodes(prevNodes);
        stageRef.current.getLayers()[0]?.batchDraw();
        return dataUrl;
    };

    const captureOffScreenDataUrl = async (
        tmpl: ProductTemplate,
        images: CanvasImage[],
        placement: { w: number; h: number },
    ): Promise<string | null> => {
        if (!images.length) return null;
        const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new window.Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = r2ProxyUrl(tmpl.image_url);
        });
        const containerW = containerRef.current?.clientWidth || window.innerWidth - 80;
        const containerH = (containerRef.current?.clientHeight || window.innerHeight) - 48;
        const sf = Math.min(containerW / bgImg.width, containerH / bgImg.height, 1) * 0.95;
        const pz = tmpl.print_area_config;
        const pzScaled = { left: pz.x * sf, top: pz.y * sf, width: pz.width * sf, height: pz.height * sf };
        const pixelRatio = (placement.w * OUTPUT_SCALE) / pzScaled.width;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(pzScaled.width * pixelRatio);
        canvas.height = Math.round(pzScaled.height * pixelRatio);
        const ctx = canvas.getContext('2d')!;
        ctx.scale(pixelRatio, pixelRatio);
        ctx.translate(-pzScaled.left, -pzScaled.top);
        images.forEach(ci => ctx.drawImage(ci.image, ci.x, ci.y, ci.width, ci.height));
        return canvas.toDataURL('image/png');
    };

    const handleMockup = async () => {
        saveCurrentSide();
        setGeneratingMockup(true);
        try {
            const results: { side: string; url: string }[] = [];
            const colorTemplates = templates.filter(t => t.color?.id === selectedColorId && t.mockup_config);
            for (const tmpl of colorTemplates) {
                const placement = tmpl.mockup_config!.placement;
                const images = tmpl.side === currentTemplate?.side
                    ? canvasImages
                    : (sideCanvasImages.current[tmpl.side] ?? []);
                if (!images.length) continue;
                const designDataUrl = tmpl.side === currentTemplate?.side
                    ? captureDesignDataUrl(placement)
                    : await captureOffScreenDataUrl(tmpl, images, placement);
                if (!designDataUrl) continue;
                const composited = await compositeSingleSide(
                    r2ProxyUrl(tmpl.mockup_config!.image_url),
                    placement,
                    designDataUrl,
                );
                results.push({ side: tmpl.side, url: composited });
            }
            results.sort((a, b) => {
                const ai = SIDE_ORDER.indexOf(a.side.toLowerCase());
                const bi = SIDE_ORDER.indexOf(b.side.toLowerCase());
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });
            setMockupUrl(results);
            setShowMockup(true);
            trackStudioPreviewOpened();
        } catch (err) {
            console.error('[CanvasDesign] Mockup failed:', err);
            trackStudioMockupFailed(err instanceof Error ? err.message : 'unknown');
        } finally {
            setGeneratingMockup(false);
        }
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    type SaveResult = { savedDesignId: string; printFileUrl: string; previewUrl: string; canvasData: object };

    const handleSave = async (): Promise<SaveResult | null> => {
        if (!currentTemplate || !printZone || !stageRef.current) return null;
        const trimmedName = designName.trim();
        if (!trimmedName || trimmedName.toLowerCase() === 'untitled design') {
            setSaveStatus('error');
            setNameError(true);
            trackStudioSaveBlockedName();
            return null;
        }
        setIsSaving(true);
        setSaveStatus('idle');
        const isFirstSave = !designId;
        try {
            sideCanvasImages.current[currentTemplate.side] = canvasImages;
            const sf = lastScaleFactor.current ?? 1;
            const sides = Object.fromEntries(
                Object.entries(sideCanvasImages.current)
                    .filter(([, imgs]) => imgs.length > 0)
                    .map(([sideName, imgs]) => {
                        const zone = sideZones.current[sideName]
                            ?? (() => {
                                const tmpl = templates.find(t => t.side === sideName && t.color?.id === selectedColorId)
                                    ?? templates.find(t => t.side === sideName);
                                return tmpl ? zoneFromTemplate(tmpl.print_area_config, sf) : null;
                            })();
                        if (!zone) {
                            return [sideName, imgs.map(ci => ({
                                id: ci.id, src: ci.src, x: ci.x, y: ci.y,
                                width: ci.width, height: ci.height, rotation: ci.rotation ?? 0,
                            }))];
                        }
                        return [sideName, imgs.map(ci => serializeCanvasImage(ci, zone))];
                    }),
            );
            const canvasData = {
                renderer: 'konva',
                version: '3',
                stageScaleFactor: sf,
                activeSide: currentTemplate.side,
                sides,
            };
            const hash = MD5(JSON.stringify(canvasData)).toString();

            let existingDesign: any = null;
            if (designId) {
                try { ({ data: existingDesign } = await api.get(`/designs/${designId}`)); } catch {}
            }

            // Preview
            const previewDataUrl = stageRef.current.toDataURL({ pixelRatio: 0.5 });
            const previewBlob = await fetch(previewDataUrl).then(r => r.blob());
            const colorKey = selectedColorId ?? 'default';
            const previewUrl = await uploadFile(previewBlob, 'preview', `preview_${colorKey}_${Date.now()}.png`);
            const previewMap = JSON.stringify({ [colorKey]: previewUrl });

            // Print files
            let printFileUrl: string | null = null;
            if (existingDesign?.design_hash === hash && existingDesign?.print_file_url) {
                printFileUrl = existingDesign.print_file_url;
            } else {
                const printFiles: Record<string, string> = {};
                const currentBlob = await capturePrintBlob();
                if (currentBlob) {
                    const url = await uploadFile(currentBlob, 'print', `print_${Math.random().toString(36).substring(7)}.png`);
                    printFiles[currentTemplate.side.toLowerCase()] = url;
                }
                for (const [sideName, imgs] of Object.entries(sideCanvasImages.current)) {
                    if (sideName === currentTemplate.side || !imgs.length) continue;
                    const tmpl = templates.find(t => t.side === sideName && t.color?.id === selectedColorId)
                        ?? templates.find(t => t.side === sideName);
                    if (!tmpl) continue;
                    const blob = await captureOffScreenBlob(tmpl, imgs);
                    if (blob) {
                        const url = await uploadFile(blob, 'print', `print_${Math.random().toString(36).substring(7)}.png`);
                        printFiles[sideName.toLowerCase()] = url;
                    }
                }
                printFileUrl = JSON.stringify(printFiles);
            }

            // print_dimensions
            const print_dimensions: Record<string, ReturnType<typeof computeSideAabb>> = {};
            const pz = currentTemplate.print_area_config;
            const aabb = computeSideAabb(canvasImages, printZone, pz.physical_w_cm ?? 30.48, pz.physical_h_cm ?? 40.64, pz.width, pz.height);
            if (aabb) print_dimensions[currentTemplate.side.toLowerCase()] = aabb;
            for (const [sideName, imgs] of Object.entries(sideCanvasImages.current)) {
                if (sideName === currentTemplate.side || !imgs.length) continue;
                const zone = sideZones.current[sideName];
                const tmpl = templates.find(t => t.side === sideName && t.color?.id === selectedColorId)
                    ?? templates.find(t => t.side === sideName);
                if (!tmpl || !zone) continue;
                const pzT = tmpl.print_area_config;
                const a = computeSideAabb(imgs, zone, pzT.physical_w_cm ?? 30.48, pzT.physical_h_cm ?? 40.64, pzT.width, pzT.height);
                if (a) print_dimensions[sideName.toLowerCase()] = a;
            }

            const payload = {
                design_name: designName,
                canvas_data: canvasData,
                preview_image_url: previewMap,
                print_file_url: printFileUrl,
                design_hash: hash,
                available_colors: Array.from(activeColorIds),
                printing_type: printingType,
                base_product_id: currentTemplate.product_id,
                print_dimensions: Object.keys(print_dimensions).length > 0 ? print_dimensions : undefined,
            };

            let savedDesignId = designId ?? '';
            if (designId) {
                await api.put(`/designs/${designId}`, payload);
            } else {
                const { data } = await api.post('/designs', payload);
                if (data?.design?.id) { setDesignId(data.design.id); savedDesignId = data.design.id; }
            }

            setSaveStatus('saved');
            setIsDirty(false);
            setTimeout(() => setSaveStatus('idle'), 2500);
            trackStudioSaveSucceeded(isFirstSave);

            // Compute price from the freshly saved print_dimensions
            if (currentTemplate && selectedColorId) {
                const dims = Object.fromEntries(
                    Object.entries(print_dimensions).filter((e): e is [string, NonNullable<typeof e[1]>] => e[1] != null)
                        .map(([k, v]) => [k, { w: v.w, h: v.h }])
                );
                computePriceBreakdown(dims, currentTemplate.product_id, selectedColorId, printingType);
            }

            return { savedDesignId, printFileUrl: printFileUrl ?? '', previewUrl, canvasData };
        } catch (err) {
            console.error('[CanvasDesign] Save failed:', err);
            const status = (err as { response?: { status?: number } })?.response?.status;
            trackStudioSaveFailed(status, err instanceof Error ? err.message : 'unknown');
            setSaveStatus('error');
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    // ── Add to cart ───────────────────────────────────────────────────────────
    const handleAddToCart = async (navigateToOrder: boolean) => {
        if (!currentTemplate || !user) return;
        if (isLegacyDtfPrintingType(printingType)) return;
        setIsAddingToCart(true);
        try {
            const result = await handleSave();
            if (!result) throw new Error('Auto-save failed');
            addToCart({
                product_id: currentTemplate.product_id,
                color_id: selectedColorId || '',
                size: selectedSize,
                quantity,
                design_id: result.savedDesignId || undefined,
                print_file_url: result.printFileUrl,
                design_json: result.canvasData,
                preview_url: result.previewUrl,
                design_name: designName,
            });
            trackStudioAddToCart(navigateToOrder);
            if (navigateToOrder) navigate('/checkout');
        } catch (err) {
            console.error('[CanvasDesign] Add to cart failed:', err);
            trackStudioAddToCartFailed(err instanceof Error ? err.message : 'unknown');
        } finally {
            setIsAddingToCart(false);
        }
    };

    return {
        // Refs (attached to JSX elements by the page)
        stageRef, containerRef, transformerRef, bgNodeRef, printZoneNodeRef, colorPickerRef,
        // Template / color
        templates, currentTemplate, setCurrentTemplate, selectedColorId, currentSides, uniqueColors,
        // Canvas
        bgImage, stageSize, printZone, canvasImages, setCanvasImages,
        selectedId, setSelectedId, liveSizeIn, pxPerInch, displaySizeIn,
        isExporting, exportedUrl,
        // Color picker
        activeColorIds, setActiveColorIds, showColorPicker, setShowColorPicker,
        // Save + pricing
        designName, setDesignName, handleDesignNameChange, isSaving, saveStatus, nameError, isDirty, markDirty, priceBreakdown, priceLoading, printingType,
        // Sidebar
        showImageLibrary, setShowImageLibrary, showLayerPanel, setShowLayerPanel,
        userUploads, loadingUploads, uploadsError, isUploading,
        deleteImageName, setDeleteImageName, dpiWarningFile, setDpiWarningFile,
        // Actions
        saveCurrentSide, handleColorSelect, handleColorAdd, handleColorRemove,
        addImageFromUrl, handleSidebarUpload, proceedWithUpload, confirmDeleteImage,
        moveLayer, handleExport, handleSave, handleMockup,
        showMockup, setShowMockup, mockupUrl, generatingMockup,
        selectedSize, setSelectedSize, availableSizes, quantity, setQuantity,
        isAddingToCart, handleAddToCart,
        handleStageDragEnd, handleStageTransform, handleStageTransformEnd, applySizeIn,
        reportStudioExit, hasAnyArtwork,
    };
}
