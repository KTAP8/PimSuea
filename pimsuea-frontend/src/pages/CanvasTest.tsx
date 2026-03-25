import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { Upload, ImageIcon, X, Trash2, Loader2, Save, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { MD5 } from 'crypto-js';
import api, { getProductTemplates, uploadFile, r2ProxyUrl } from '../services/api';
import { injectPngDpi } from '../utils/canvasExporter';
import { useAuth } from '../contexts/AuthContext';
import type { ProductTemplate, Color } from '../types/api';

interface CanvasImage {
    id: string;
    image: HTMLImageElement;
    src: string;   // original URL (for serialization)
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function CanvasTest() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const designIdParam = searchParams.get('designId');
    const { user } = useAuth();
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const bgNodeRef = useRef<Konva.Image>(null);
    const printZoneNodeRef = useRef<Konva.Rect>(null);

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

    // Save state
    const [designId, setDesignId] = useState<string | null>(null);
    const [designName, setDesignName] = useState('Untitled Design');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    // Per-side image storage (keyed by template ID, mirrors DesignCanvas savedDesigns pattern)
    const sideCanvasImages = useRef<Record<string, CanvasImage[]>>({});
    // Per-side scaled print zone (populated when each template's bg image loads)
    const sideZones = useRef<Record<string, { left: number; top: number; width: number; height: number }>>({});
    // Serializable pending side data to load once the background image renders (keyed by template ID)
    type SerializableImage = { id: string; src: string; x: number; y: number; width: number; height: number };
    const pendingSideData = useRef<Record<string, SerializableImage[]>>({});

    // Sidebar / library state
    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [showLayerPanel, setShowLayerPanel] = useState(false);
    const [userUploads, setUserUploads] = useState<{ name: string; url: string }[]>([]);
    const [loadingUploads, setLoadingUploads] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deleteImageName, setDeleteImageName] = useState<string | null>(null);
    const [dpiWarningFile, setDpiWarningFile] = useState<{ file: File; dpi: number } | null>(null);

    // ── Template loading ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        getProductTemplates(id).then(async data => {
            setTemplates(data);
            const firstColorId = data[0]?.color?.id ?? null;
            let targetTemplate = (firstColorId != null
                ? data.find(t => t.color?.id === firstColorId)
                : data[0]) ?? data[0] ?? null;

            if (designIdParam) {
                try {
                    const { data: design } = await api.get(`/designs/${designIdParam}`);
                    setDesignId(designIdParam);
                    if (design.design_name) setDesignName(design.design_name);
                    const canvasData = design.canvas_data;
                    if (canvasData?.renderer === 'konva') {
                        // New multi-side format: { sides: { [templateId]: SerializableImage[] } }
                        if (canvasData.sides) {
                            pendingSideData.current = canvasData.sides;
                            const activeId = canvasData.activeTemplateId;
                            const savedTemplate = data.find(t => t.id === activeId) ?? data.find(t => canvasData.sides[t.id]);
                            if (savedTemplate) { targetTemplate = savedTemplate; setSelectedColorId(savedTemplate.color?.id ?? null); }
                        // Old single-side format: { templateId, images: [] }
                        } else if (canvasData.templateId && canvasData.images?.length) {
                            pendingSideData.current = { [canvasData.templateId]: canvasData.images };
                            const savedTemplate = data.find(t => t.id === canvasData.templateId);
                            if (savedTemplate) { targetTemplate = savedTemplate; setSelectedColorId(savedTemplate.color?.id ?? null); }
                        }
                    }
                } catch (err) {
                    console.error('[CanvasTest] Failed to load design:', err);
                }
            }

            setCurrentTemplate(targetTemplate);
        });
    }, [id, designIdParam]);

    // ── Background image + side restore ──────────────────────────────────────
    useEffect(() => {
        if (!currentTemplate) return;
        const template = currentTemplate; // capture to avoid stale closure
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const containerW = containerRef.current?.clientWidth || window.innerWidth - 80;
            const containerH = (containerRef.current?.clientHeight || window.innerHeight) - 48;
            const sf = Math.min(containerW / img.width, containerH / img.height, 1) * 0.95;
            setStageSize({ width: img.width * sf, height: img.height * sf });
            setBgImage(img);
            const pz = template.print_area_config;
            const pzScaled = { left: pz.x * sf, top: pz.y * sf, width: pz.width * sf, height: pz.height * sf };
            setPrintZone(pzScaled);
            sideZones.current[template.id] = pzScaled;
            setSelectedId(null);

            // If there's pending serializable data for this side, load it now
            const pending = pendingSideData.current[template.id];
            if (pending) {
                delete pendingSideData.current[template.id];
                Promise.all(pending.map(d => new Promise<CanvasImage>((resolve, reject) => {
                    const i = new window.Image();
                    i.crossOrigin = 'anonymous';
                    i.onload = () => resolve({ id: d.id, image: i, src: d.src, x: d.x, y: d.y, width: d.width, height: d.height });
                    i.onerror = reject;
                    i.src = r2ProxyUrl(d.src);
                }))).then(loaded => {
                    sideCanvasImages.current[template.id] = loaded;
                    setCanvasImages(loaded);
                }).catch(err => console.error('[CanvasTest] Failed to restore side images:', err));
            } else {
                // Restore previously saved images for this side (in-session switch)
                setCanvasImages(sideCanvasImages.current[template.id] ?? []);
            }
        };
        img.onerror = () => console.error('[CanvasTest] image load failed:', template.image_url);
        img.src = r2ProxyUrl(template.image_url);
    }, [currentTemplate]);

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
        try {
            const { data } = await api.get<{ name: string; url: string }[]>('/uploads/assets');
            setUserUploads(data);
        } catch (err) {
            console.error('[CanvasTest] fetchUserUploads failed:', err);
        } finally {
            setLoadingUploads(false);
        }
    };

    useEffect(() => {
        if (showImageLibrary) fetchUserUploads();
    }, [showImageLibrary]);

    // ── Derived values ────────────────────────────────────────────────────────
    const pxPerInch = printZone && currentTemplate
        ? printZone.width / ((currentTemplate.print_area_config.physical_w_cm ?? 30.48) / 2.54)
        : null;

    const selectedImage = canvasImages.find(ci => ci.id === selectedId);
    const selectedSizeIn = selectedImage && pxPerInch
        ? { w: selectedImage.width / pxPerInch, h: selectedImage.height / pxPerInch }
        : null;
    const displaySizeIn = liveSizeIn ?? selectedSizeIn;

    const currentSides = selectedColorId != null
        ? templates.filter(t => t.color?.id === selectedColorId)
        : templates;
    const uniqueColors: Color[] = Array.from(
        new Map(templates.map(t => [t.color?.id, t.color])).values()
    ).filter((c): c is Color => !!c);

    // ── Layer order helpers ───────────────────────────────────────────────────
    const moveLayer = (id: string, delta: 'front' | 'forward' | 'backward' | 'back') => {
        setCanvasImages(prev => {
            const idx = prev.findIndex(ci => ci.id === id);
            if (idx === -1) return prev;
            const arr = [...prev];
            if (delta === 'front') {
                const [item] = arr.splice(idx, 1);
                arr.push(item);
            } else if (delta === 'back') {
                const [item] = arr.splice(idx, 1);
                arr.unshift(item);
            } else if (delta === 'forward' && idx < arr.length - 1) {
                [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
            } else if (delta === 'backward' && idx > 0) {
                [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
            }
            return arr;
        });
    };

    // ── Save current side before switching ───────────────────────────────────
    const saveCurrentSide = () => {
        if (currentTemplate) sideCanvasImages.current[currentTemplate.id] = canvasImages;
    };

    // ── Canvas image helpers ──────────────────────────────────────────────────
    const handleColorSelect = (colorId: string) => {
        saveCurrentSide();
        const oldColorId = selectedColorId;
        // Copy designs from old color → new color for all other sides (same as DesignCanvas)
        if (oldColorId && oldColorId !== colorId) {
            const oldSideTemplates = templates.filter(t => t.color?.id === oldColorId);
            for (const oldTmpl of oldSideTemplates) {
                if (oldTmpl.id === currentTemplate?.id) continue; // current side handled by saveCurrentSide
                const saved = sideCanvasImages.current[oldTmpl.id];
                if (!saved) continue;
                const newTmpl = templates.find(t => t.color?.id === colorId && t.side === oldTmpl.side);
                if (newTmpl && !sideCanvasImages.current[newTmpl.id]) {
                    sideCanvasImages.current[newTmpl.id] = saved;
                }
            }
        }
        setSelectedColorId(colorId);
        const sameSide = templates.find(t => t.color?.id === colorId && t.side === currentTemplate?.side);
        const first = sameSide ?? templates.find(t => t.color?.id === colorId);
        if (first) setCurrentTemplate(first);
    };

    const addImageFromUrl = (url: string) => {
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
            setCanvasImages(prev => [...prev, { id: newId, image: img, src: url, x, y, width: w, height: h }]);
            setSelectedId(newId);
        };
        img.src = r2ProxyUrl(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !printZone) return;
        const objectUrl = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
            const scale = Math.min(printZone.width / img.width, printZone.height / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = printZone.left + (printZone.width - w) / 2;
            const y = printZone.top + (printZone.height - h) / 2;
            const newId = Math.random().toString(36).substring(7);
            // Keep objectUrl alive (not revoked) so img.src remains valid
            setCanvasImages(prev => [...prev, { id: newId, image: img, src: objectUrl, x, y, width: w, height: h }]);
            setSelectedId(newId);
        };
        img.src = objectUrl;
        e.target.value = '';
    };

    // ── Sidebar upload ────────────────────────────────────────────────────────
    const handleSidebarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const physW_cm = currentTemplate?.print_area_config?.physical_w_cm ?? 30.48;
        const physH_cm = currentTemplate?.print_area_config?.physical_h_cm ?? 40.64;
        const dpi = await new Promise<number>(resolve => {
            const img = new window.Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(Math.min(img.naturalWidth / (physW_cm / 2.54), img.naturalHeight / (physH_cm / 2.54)));
            };
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
            addImageFromUrl(url);
            fetchUserUploads();
        } catch (err) {
            console.error('[CanvasTest] upload failed:', err);
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
            console.error('[CanvasTest] delete failed:', err);
        } finally {
            setDeleteImageName(null);
        }
    };

    // ── Compute per-side AABB for print_dimensions ────────────────────────────
    const computeSideAabb = (
        images: CanvasImage[],
        pzScaled: { left: number; top: number; width: number; height: number },
        physW_cm: number,
        physH_cm: number,
        imgZoneW: number,
        imgZoneH: number,
    ): { w: number; h: number; x_cm: number; y_cm: number; px_x: number; px_y: number; px_w: number; px_h: number } | null => {
        if (!images.length) return null;

        // Union AABB of all images in canvas (scaled) coords
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const ci of images) {
            minX = Math.min(minX, ci.x);
            minY = Math.min(minY, ci.y);
            maxX = Math.max(maxX, ci.x + ci.width);
            maxY = Math.max(maxY, ci.y + ci.height);
        }

        // Clamp to print zone
        const cx = Math.max(minX, pzScaled.left);
        const cy = Math.max(minY, pzScaled.top);
        const cx2 = Math.min(maxX, pzScaled.left + pzScaled.width);
        const cy2 = Math.min(maxY, pzScaled.top + pzScaled.height);
        if (cx2 <= cx || cy2 <= cy) return null;

        // Relative to print zone origin
        const rx = cx - pzScaled.left;
        const ry = cy - pzScaled.top;
        const rw = cx2 - cx;
        const rh = cy2 - cy;

        const w_cm = rw * physW_cm / pzScaled.width;
        const h_cm = rh * physH_cm / pzScaled.height;
        const x_cm = rx * physW_cm / pzScaled.width;
        const y_cm = ry * physH_cm / pzScaled.height;

        const sfW = imgZoneW / pzScaled.width;
        const sfH = imgZoneH / pzScaled.height;

        return {
            w: w_cm, h: h_cm, x_cm, y_cm,
            px_x: Math.round(rx * sfW),
            px_y: Math.round(ry * sfH),
            px_w: Math.round(rw * sfW),
            px_h: Math.round(rh * sfH),
        };
    };

    // ── Capture print file (imperative hide/show — no React re-render needed) ─
    const capturePrintBlob = async (): Promise<Blob | null> => {
        if (!stageRef.current || !printZone || !currentTemplate) return null;

        const pz = currentTemplate.print_area_config;
        const physW_cm = pz.physical_w_cm ?? 30.48;
        const pixelRatio = (physW_cm / 2.54 * 300) / printZone.width;

        // Imperatively hide bg, print zone, and transformer handles
        const tr = transformerRef.current;
        const prevNodes = tr?.nodes() ?? [];
        tr?.nodes([]);
        bgNodeRef.current?.hide();
        printZoneNodeRef.current?.hide();
        stageRef.current.getLayers()[0]?.batchDraw();

        const dataURL = stageRef.current.toDataURL({
            x: printZone.left,
            y: printZone.top,
            width: printZone.width,
            height: printZone.height,
            pixelRatio,
            mimeType: 'image/png',
        });

        // Restore visibility
        bgNodeRef.current?.show();
        printZoneNodeRef.current?.show();
        if (prevNodes.length) tr?.nodes(prevNodes);
        stageRef.current.getLayers()[0]?.batchDraw();

        const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
        const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const pngWithDpi = injectPngDpi(raw, 300);
        return new Blob([new Uint8Array(pngWithDpi)], { type: 'image/png' });
    };

    // ── Capture a non-active side off-screen ─────────────────────────────────
    const captureOffScreenBlob = async (tmpl: ProductTemplate, images: CanvasImage[]): Promise<Blob | null> => {
        if (!images.length) return null;

        // Use same sizing logic as the background image effect
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
        const physW_cm = pz.physical_w_cm ?? 30.48;
        const pixelRatio = (physW_cm / 2.54 * 300) / pzScaled.width;

        // Draw directly onto an HTML canvas — synchronous, no batchDraw/RAF race condition
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(pzScaled.width * pixelRatio);
        canvas.height = Math.round(pzScaled.height * pixelRatio);
        const ctx = canvas.getContext('2d')!;
        ctx.scale(pixelRatio, pixelRatio);
        ctx.translate(-pzScaled.left, -pzScaled.top);
        images.forEach(ci => ctx.drawImage(ci.image, ci.x, ci.y, ci.width, ci.height));

        const dataURL = canvas.toDataURL('image/png');
        const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
        const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const pngWithDpi = injectPngDpi(raw, 300);
        return new Blob([new Uint8Array(pngWithDpi)], { type: 'image/png' });
    };

    // ── Export (download / upload print file only) ────────────────────────────
    const handleExport = async () => {
        if (!currentTemplate || !printZone) return;
        setIsExporting(true);
        setExportedUrl(null);
        try {
            const blob = await capturePrintBlob();
            if (!blob) return;
            const suffix = Math.random().toString(36).substring(7);
            const url = await uploadFile(blob, 'print', `${suffix}_konva_test.png`);
            setExportedUrl(url);
        } catch (err) {
            console.error('[CanvasTest] Export failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    // ── Save design to user_designs ───────────────────────────────────────────
    const handleSave = async () => {
        if (!currentTemplate || !printZone || !stageRef.current) return;
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            // 1. Sync current side into ref, then build multi-side canvas data
            sideCanvasImages.current[currentTemplate.id] = canvasImages;
            const sides = Object.fromEntries(
                Object.entries(sideCanvasImages.current)
                    .filter(([, imgs]) => imgs.length > 0)
                    .map(([tid, imgs]) => [tid, imgs.map(ci => ({ id: ci.id, src: ci.src, x: ci.x, y: ci.y, width: ci.width, height: ci.height }))])
            );
            const canvasData = {
                renderer: 'konva',
                version: '2',
                activeTemplateId: currentTemplate.id,
                sides,
            };
            const canvasDataStr = JSON.stringify(canvasData);
            const hash = MD5(canvasDataStr).toString();

            // 2. Fetch existing design once (for hash check + existing print URLs)
            let existingDesign: any = null;
            if (designId) {
                try { ({ data: existingDesign } = await api.get(`/designs/${designId}`)); } catch {}
            }

            // 3. Preview — full stage at 0.5x (bg visible)
            const previewDataUrl = stageRef.current.toDataURL({ pixelRatio: 0.5 });
            const previewBlob = await fetch(previewDataUrl).then(r => r.blob());
            const colorKey = selectedColorId ?? 'default';
            const previewUrl = await uploadFile(previewBlob, 'preview', `preview_${colorKey}_${Date.now()}.png`);
            const previewMap = JSON.stringify({ [colorKey]: previewUrl });

            // 4. Print files — all sides, transparent bg, 300 DPI
            let printFileUrl: string | null = null;
            if (existingDesign?.design_hash === hash && existingDesign?.print_file_url) {
                printFileUrl = existingDesign.print_file_url;
            } else {
                const printFiles: Record<string, string> = {};

                // Current side — use live stage (most reliable)
                const currentBlob = await capturePrintBlob();
                if (currentBlob) {
                    const url = await uploadFile(currentBlob, 'print', `print_${Math.random().toString(36).substring(7)}.png`);
                    printFiles[currentTemplate.side.toLowerCase()] = url;
                }

                // Other sides — render off-screen
                for (const [tid, imgs] of Object.entries(sideCanvasImages.current)) {
                    if (tid === currentTemplate.id || !imgs.length) continue;
                    const tmpl = templates.find(t => t.id === tid);
                    if (!tmpl) continue;
                    const blob = await captureOffScreenBlob(tmpl, imgs);
                    if (blob) {
                        const url = await uploadFile(blob, 'print', `print_${Math.random().toString(36).substring(7)}.png`);
                        printFiles[tmpl.side.toLowerCase()] = url;
                    }
                }

                printFileUrl = JSON.stringify(printFiles);
            }

            // 5. Compute print_dimensions (AABB per side in cm + original image px)
            const print_dimensions: Record<string, ReturnType<typeof computeSideAabb>> = {};
            // Current side
            if (printZone) {
                const pz = currentTemplate.print_area_config;
                const aabb = computeSideAabb(
                    canvasImages, printZone,
                    pz.physical_w_cm ?? 30.48, pz.physical_h_cm ?? 40.64,
                    pz.width, pz.height,
                );
                if (aabb) print_dimensions[currentTemplate.side.toLowerCase()] = aabb;
            }
            // Other sides
            for (const [tid, imgs] of Object.entries(sideCanvasImages.current)) {
                if (tid === currentTemplate.id || !imgs.length) continue;
                const tmpl = templates.find(t => t.id === tid);
                const zone = sideZones.current[tid];
                if (!tmpl || !zone) continue;
                const pz = tmpl.print_area_config;
                const aabb = computeSideAabb(
                    imgs, zone,
                    pz.physical_w_cm ?? 30.48, pz.physical_h_cm ?? 40.64,
                    pz.width, pz.height,
                );
                if (aabb) print_dimensions[tmpl.side.toLowerCase()] = aabb;
            }

            // 6. Upsert design
            const payload = {
                design_name: designName,
                canvas_data: canvasData,
                preview_image_url: previewMap,
                print_file_url: printFileUrl,
                design_hash: hash,
                available_colors: selectedColorId ? [selectedColorId] : [],
                printing_type: 'DTG',
                base_product_id: currentTemplate.product_id,
                print_dimensions: Object.keys(print_dimensions).length > 0 ? print_dimensions : undefined,
            };

            if (designId) {
                await api.put(`/designs/${designId}`, payload);
            } else {
                const { data } = await api.post('/designs', payload);
                if (data?.design?.id) setDesignId(data.design.id);
            }

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch (err) {
            console.error('[CanvasTest] Save failed:', err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-gray-50">

            {/* Top toolbar */}
            <div className="flex items-center gap-2 p-2 bg-white border-b flex-wrap shrink-0">
                <span className="text-xs font-medium text-gray-500 mr-1">Side:</span>
                {currentSides.map(t => (
                    <button key={t.id} onClick={() => { saveCurrentSide(); setCurrentTemplate(t); }}
                        className={`px-3 py-1 rounded border text-sm ${t.id === currentTemplate?.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                        {t.side}
                    </button>
                ))}

                <span className="text-xs font-medium text-gray-500 ml-3 mr-1">Color:</span>
                {uniqueColors.map(color => (
                    <button key={color.id} onClick={() => handleColorSelect(color.id)} title={color.name}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${color.id === selectedColorId ? 'border-blue-600 scale-110' : 'border-gray-300'}`}
                        style={{ backgroundColor: color.hex_code ?? '#ccc' }} />
                ))}

                {displaySizeIn && (
                    <span className="text-[10px] font-mono text-gray-700 tabular-nums px-2 py-1 bg-gray-100 rounded ml-2">
                        {displaySizeIn.w.toFixed(2)}" × {displaySizeIn.h.toFixed(2)}"
                    </span>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} disabled={!printZone}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 disabled:opacity-40 ml-2">
                    + Add Image
                </button>

                <button onClick={() => setShowLayerPanel(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-sm transition-colors ${showLayerPanel ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <Layers className="w-3.5 h-3.5" />
                    Layers{canvasImages.length > 0 && <span className="opacity-60">{canvasImages.length}</span>}
                </button>

                {selectedId && (
                    <button onClick={() => { setCanvasImages(prev => prev.filter(ci => ci.id !== selectedId)); setSelectedId(null); }}
                        className="px-3 py-1.5 text-red-600 border border-red-200 rounded text-sm hover:bg-red-50">
                        Remove
                    </button>
                )}

                {/* Design name input */}
                <input
                    value={designName}
                    onChange={e => setDesignName(e.target.value)}
                    className="ml-auto border border-gray-200 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-blue-400"
                    placeholder="Design name"
                />

                {/* Save button */}
                <button onClick={handleSave} disabled={isSaving || !currentTemplate}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                        saveStatus === 'saved' ? 'bg-green-600 text-white' :
                        saveStatus === 'error' ? 'bg-red-500 text-white' :
                        'bg-gray-800 text-white hover:bg-black'
                    }`}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
                </button>

                {/* Export button */}
                <button onClick={handleExport} disabled={isExporting || !currentTemplate}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50 hover:bg-blue-700">
                    {isExporting ? 'Exporting…' : 'Export 300 DPI'}
                </button>
            </div>

            {/* Main content: sidebar + canvas */}
            <div className="flex flex-row flex-1 overflow-hidden relative">

                {/* Left sidebar */}
                <aside className="w-20 bg-white border-r flex flex-col items-center py-4 gap-4 z-10 shrink-0">
                    <div className="flex flex-col items-center gap-1 cursor-pointer">
                        <label className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isUploading ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 hover:bg-black hover:text-white'}`}>
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : <Upload className="w-5 h-5" />}
                            <input type="file" className="hidden" accept="image/*" onChange={handleSidebarUpload} disabled={isUploading} />
                        </label>
                        <span className="text-[10px] text-gray-500 font-medium">{isUploading ? '...' : 'อัปโหลด'}</span>
                    </div>

                    <div className={`flex flex-col items-center gap-1 cursor-pointer w-full ${showImageLibrary ? 'bg-slate-100 border-r-4 border-black' : ''}`}
                        onClick={() => setShowImageLibrary(v => !v)}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${showImageLibrary ? 'bg-black text-white' : 'bg-gray-100 hover:bg-black hover:text-white'}`}>
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">คลังรูป</span>
                    </div>
                </aside>

                {/* Image library panel */}
                {showImageLibrary && (
                    <div className="w-80 bg-white shadow-2xl rounded-2xl border flex flex-col z-40 absolute left-24 top-4 bottom-4 overflow-hidden">
                        <div className="p-5 border-b flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-lg">คลังรูปภาพ</h3>
                            <button onClick={() => setShowImageLibrary(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 border-b">
                            <label className={`w-full h-11 text-white rounded-xl flex items-center justify-center cursor-pointer gap-2 transition-all ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}>
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span className="text-sm font-semibold">{isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปใหม่'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleSidebarUpload} disabled={isUploading} />
                            </label>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
                            {loadingUploads ? (
                                <div className="col-span-2 flex justify-center py-10">
                                    <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
                                </div>
                            ) : userUploads.length === 0 ? (
                                <div className="col-span-2 flex flex-col items-center justify-center text-center text-gray-400 py-10 gap-2">
                                    <ImageIcon className="w-10 h-10 opacity-20" />
                                    <span className="text-sm">ไม่มีรูปภาพ</span>
                                </div>
                            ) : (
                                userUploads.map((file, i) => (
                                    <div key={i}
                                        className="relative w-full pb-[100%] bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-black hover:ring-1 hover:ring-black hover:shadow-md transition-all group"
                                        onClick={() => addImageFromUrl(file.url)}>
                                        <div className="absolute inset-0 p-2 flex items-center justify-center bg-gray-50/50">
                                            <img src={file.url} alt={file.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" />
                                        </div>
                                        <button
                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                                            onClick={e => { e.stopPropagation(); setDeleteImageName(file.name); }}>
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Layer panel */}
                {showLayerPanel && (
                    <div className="w-52 bg-white shadow-2xl rounded-2xl border flex flex-col z-40 absolute right-4 top-4 bottom-4 overflow-hidden">
                        <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4" /> Layers
                            </h3>
                            <button onClick={() => setShowLayerPanel(false)}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                            {canvasImages.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-8">No layers yet</p>
                            ) : (
                                // Display front-first (reverse of render order)
                                [...canvasImages].reverse().map((ci, displayIdx) => {
                                    const realIdx = canvasImages.length - 1 - displayIdx;
                                    const isSelected = ci.id === selectedId;
                                    return (
                                        <div key={ci.id}
                                            onClick={() => setSelectedId(ci.id)}
                                            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer group border transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'border-transparent hover:bg-gray-50'}`}>
                                            {/* Thumbnail */}
                                            <div className="w-8 h-8 rounded bg-gray-100 shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                                                <img src={ci.src.startsWith('blob:') ? ci.src : r2ProxyUrl(ci.src)}
                                                    className="w-full h-full object-contain" alt="" />
                                            </div>
                                            {/* Label */}
                                            <span className="flex-1 text-xs text-gray-600 truncate min-w-0">
                                                Layer {canvasImages.length - displayIdx}
                                            </span>
                                            {/* Reorder */}
                                            <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={e => { e.stopPropagation(); moveLayer(ci.id, 'forward'); }}
                                                    disabled={realIdx >= canvasImages.length - 1}
                                                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30" title="Bring Forward">
                                                    <ChevronUp className="w-3 h-3" />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); moveLayer(ci.id, 'backward'); }}
                                                    disabled={realIdx <= 0}
                                                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30" title="Send Backward">
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                            {/* Delete */}
                                            <button onClick={e => { e.stopPropagation(); setCanvasImages(prev => prev.filter(x => x.id !== ci.id)); if (selectedId === ci.id) setSelectedId(null); }}
                                                className="shrink-0 p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Canvas area */}
                <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden">
                    <Stage ref={stageRef} width={stageSize.width} height={stageSize.height}
                        onMouseDown={e => { if (e.target === e.target.getStage() || e.target.name() === 'bg') setSelectedId(null); }}
                        onTouchStart={e => { if (e.target === e.target.getStage() || e.target.name() === 'bg') setSelectedId(null); }}>
                        <Layer>
                            {bgImage && (
                                <KonvaImage ref={bgNodeRef} name="bg" image={bgImage}
                                    width={stageSize.width} height={stageSize.height} visible={!isExporting} />
                            )}
                            {canvasImages.map(ci => (
                                <KonvaImage
                                    key={ci.id} id={ci.id}
                                    image={ci.image} x={ci.x} y={ci.y} width={ci.width} height={ci.height}
                                    draggable
                                    onClick={() => setSelectedId(ci.id)}
                                    onTap={() => setSelectedId(ci.id)}
                                    onDragEnd={e => {
                                        const node = e.target;
                                        setCanvasImages(prev => prev.map(item =>
                                            item.id === ci.id ? { ...item, x: node.x(), y: node.y() } : item
                                        ));
                                    }}
                                    onTransform={e => {
                                        if (!pxPerInch) return;
                                        const node = e.target;
                                        setLiveSizeIn({
                                            w: Math.max(10, node.width() * node.scaleX()) / pxPerInch,
                                            h: Math.max(10, node.height() * node.scaleY()) / pxPerInch,
                                        });
                                    }}
                                    onTransformEnd={e => {
                                        const node = e.target;
                                        const scaleX = node.scaleX();
                                        const scaleY = node.scaleY();
                                        node.scaleX(1);
                                        node.scaleY(1);
                                        setCanvasImages(prev => prev.map(item =>
                                            item.id === ci.id ? {
                                                ...item,
                                                x: node.x(), y: node.y(),
                                                width: Math.max(10, node.width() * scaleX),
                                                height: Math.max(10, node.height() * scaleY),
                                            } : item
                                        ));
                                        setLiveSizeIn(null);
                                    }}
                                />
                            ))}
                            <Transformer ref={transformerRef} rotateEnabled={false} keepRatio={true}
                                boundBoxFunc={(oldBox, newBox) => newBox.width < 10 || newBox.height < 10 ? oldBox : newBox} />
                            {printZone && (
                                <Rect ref={printZoneNodeRef}
                                    x={printZone.left} y={printZone.top}
                                    width={printZone.width} height={printZone.height}
                                    stroke="red" strokeWidth={1} visible={!isExporting} dash={[4, 4]} listening={false} />
                            )}
                        </Layer>
                    </Stage>
                </div>
            </div>

            {/* Export result */}
            {exportedUrl && (
                <div className="p-2 text-xs bg-green-50 border-t break-all shrink-0">
                    <span className="font-medium text-green-700 mr-1">Exported:</span>
                    <a href={exportedUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{exportedUrl}</a>
                </div>
            )}

            {/* Delete confirmation */}
            {deleteImageName && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
                        <h3 className="font-bold text-base mb-2">ลบรูปภาพ?</h3>
                        <p className="text-sm text-gray-500 mb-5">รูปภาพนี้จะถูกลบออกจากคลัง ไม่สามารถกู้คืนได้</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDeleteImageName(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">ยกเลิก</button>
                            <button onClick={confirmDeleteImage} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">ลบ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DPI warning */}
            {dpiWarningFile && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
                        <h3 className="font-bold text-base mb-2">ความละเอียดต่ำ</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            รูปภาพนี้มีความละเอียดเพียง <span className="font-semibold text-orange-500">{dpiWarningFile.dpi} DPI</span> ซึ่งอาจทำให้งานพิมพ์ไม่คมชัด (แนะนำ 150+ DPI)
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDpiWarningFile(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">ยกเลิก</button>
                            <button onClick={() => proceedWithUpload(dpiWarningFile.file)} className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600">อัปโหลดต่อ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
