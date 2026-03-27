import { useEffect, useState } from 'react';
import { ArrowLeft, Upload, ImageIcon, Layers, Loader2, Save, ShoppingCart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCanvasDesign } from '../hooks/useCanvasDesign';
import { ImageLibraryPanel } from '../components/canvas/ImageLibraryPanel';
import { LayerPanel } from '../components/canvas/LayerPanel';
import { BottomContextPanel } from '../components/canvas/BottomContextPanel';
import { CanvasStage } from '../components/canvas/CanvasStage';
import { PriceCard } from '../components/canvas/PriceCard';
import { SizeEditor } from '../components/canvas/SizeEditor';
import { LeaveConfirmModal } from '../components/canvas/LeaveConfirmModal';
import { MockupModal } from '../components/canvas/MockupModal';
import { OrderPanel } from '../components/canvas/OrderPanel';

export default function DesignStudio() {
    const d = useCanvasDesign();
    const navigate = useNavigate();
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showOrderPanel, setShowOrderPanel] = useState(false);

    // Block browser tab close / refresh when there are unsaved changes
    useEffect(() => {
        if (!d.isDirty) return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [d.isDirty]);

    const handleBack = () => {
        if (d.isDirty) {
            setShowLeaveModal(true);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">

            {/* ── Top header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-20 shrink-0 sticky top-0 gap-2 md:gap-0">
                <div className="flex items-center gap-2 md:gap-3 flex-none md:w-1/3">
                    <button onClick={handleBack}
                        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-gray-800 tracking-tight text-sm hidden md:inline">Design Canvas</span>
                </div>

                <div className="flex-1 flex items-center justify-center md:w-1/3">
                    <div className="relative flex flex-col items-center max-w-full">
                        <input
                            value={d.designName}
                            onChange={e => d.handleDesignNameChange(e.target.value)}
                            className="relative z-10 bg-transparent hover:bg-gray-100/60 focus:bg-white border text-center border-transparent focus:border-gray-200 rounded-xl px-2 md:px-4 py-1.5 text-xs md:text-sm font-bold text-gray-800 w-32 min-w-[120px] md:w-64 focus:outline-none focus:ring-4 focus:ring-gray-100/50 transition-all placeholder-gray-400 cursor-pointer focus:cursor-text truncate"
                            placeholder="Untitled Design"
                        />
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 pointer-events-none flex justify-center ${d.isDirty ? 'opacity-100 translate-y-1' : 'opacity-0 -translate-y-2 scale-95'}`}>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-200/60 shadow-[0_2px_8px_-2px_rgba(251,191,36,0.2)] text-[10.5px] font-bold tracking-wide whitespace-nowrap">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                </span>
                                ยังไม่ได้บันทึก
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 md:gap-2.5 flex-none md:w-1/3">
                    <button
                        onClick={d.handleMockup}
                        disabled={d.generatingMockup || !d.templates.some(t => t.color?.id === d.selectedColorId && t.mockup_config)}
                        title="Mockup Preview"
                        className="flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold transition-all hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        {d.generatingMockup ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <ImageIcon className="w-4 h-4 md:hidden" />
                        )}
                        <span className={d.generatingMockup ? "text-xs md:text-sm" : "hidden md:inline"}>
                            {d.generatingMockup ? 'กำลังสร้าง…' : 'ตัวอย่าง'}
                        </span>
                    </button>

                    <div className="hidden md:block w-px h-5 bg-gray-200 mx-1 rounded-full"></div>

                    <button
                        onClick={() => setShowOrderPanel(true)}
                        disabled={!d.currentTemplate}
                        title="Order"
                        className="flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 bg-action text-white rounded-xl text-sm font-bold shadow-sm shadow-action/20 transition-all hover:bg-action/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none">
                        <ShoppingCart className="w-4 h-4" />
                        <span className="hidden md:inline">สั่งซื้อ</span>
                    </button>

                    <button onClick={d.handleSave} disabled={d.isSaving || !d.currentTemplate}
                        title="Save"
                        className={`flex items-center justify-center gap-2 px-3 md:px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
                            d.saveStatus === 'saved' ? 'bg-green-500 text-white hover:bg-green-600' :
                            d.saveStatus === 'error' ? 'bg-destructive text-white' :
                            'bg-primary text-white hover:bg-primary/90'
                        }`}>
                        {d.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="hidden md:inline">
                            {d.isSaving ? 'Saving…' : d.saveStatus === 'saved' ? 'Saved!' : d.saveStatus === 'error' ? 'ตั้งชื่อก่อน' : 'Save'}
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Main content ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">

                {/* Sidebar (Bottom bar on Mobile) */}
                <aside className="w-full h-16 md:w-24 md:h-auto bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.02)] md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-row md:flex-col justify-around md:justify-start items-center px-4 py-2 md:py-6 gap-2 md:gap-6 z-30 shrink-0 border-t md:border-t-0 md:border-r border-gray-100 order-last md:order-first">

                    {/* Upload */}
                    <div className="flex flex-col items-center justify-center gap-1 cursor-pointer group text-gray-400 hover:text-gray-700">
                        <label className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-transparent group-hover:border-gray-200 ${d.isUploading ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-50 group-hover:bg-gray-100 text-gray-600'}`}>
                            {d.isUploading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-primary" /> : <Upload className="w-4 h-4 md:w-5 md:h-5" />}
                            <input type="file" className="hidden" accept="image/*" onChange={d.handleSidebarUpload} disabled={d.isUploading} />
                        </label>
                        <span className="text-[9px] md:text-[10px] font-semibold hidden sm:block md:block">{d.isUploading ? '...' : 'Upload'}</span>
                    </div>

                    {/* Library toggle */}
                    <div className={`flex flex-col items-center justify-center gap-1 cursor-pointer group ${d.showImageLibrary ? 'text-primary' : 'text-gray-400 hover:text-gray-700'}`}
                        onClick={() => d.setShowImageLibrary(v => !v)}>
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all border border-transparent ${d.showImageLibrary ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-50 group-hover:bg-gray-100 text-gray-600 group-hover:border-gray-200'}`}>
                            <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <span className="text-[9px] md:text-[10px] font-semibold hidden sm:block md:block">Library</span>
                    </div>

                    <div className="h-6 w-px md:w-10 md:h-px bg-gray-100 mx-1 md:my-1" />

                    {/* Layers toggle */}
                    <div className={`flex flex-col items-center justify-center gap-1 cursor-pointer group ${d.showLayerPanel ? 'text-primary' : 'text-gray-400 hover:text-gray-700'}`}
                        onClick={() => d.setShowLayerPanel(v => !v)}>
                        <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all border border-transparent ${d.showLayerPanel ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-50 group-hover:bg-gray-100 text-gray-600 group-hover:border-gray-200'}`}>
                            <Layers className="w-4 h-4 md:w-5 md:h-5" />
                            {d.canvasImages.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 md:h-4 md:w-4 items-center justify-center rounded-full bg-primary text-[8px] md:text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                    {d.canvasImages.length}
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] md:text-[10px] font-semibold hidden sm:block md:block">Layers</span>
                    </div>
                </aside>

                {/* Image library panel */}
                {d.showImageLibrary && (
                    <ImageLibraryPanel
                        userUploads={d.userUploads}
                        loadingUploads={d.loadingUploads}
                        isUploading={d.isUploading}
                        onClose={() => d.setShowImageLibrary(false)}
                        onAddImage={d.addImageFromUrl}
                        onUpload={d.handleSidebarUpload}
                        onDeleteRequest={d.setDeleteImageName}
                    />
                )}

                {/* Layer panel */}
                {d.showLayerPanel && (
                    <LayerPanel
                        canvasImages={d.canvasImages}
                        selectedId={d.selectedId}
                        onSelect={d.setSelectedId}
                        onMove={d.moveLayer}
                        onDelete={id => {
                            d.setCanvasImages(prev => prev.filter(ci => ci.id !== id));
                            if (d.selectedId === id) d.setSelectedId(null);
                            d.markDirty();
                        }}
                        onClose={() => d.setShowLayerPanel(false)}
                    />
                )}

                {/* Canvas area */}
                <div ref={d.containerRef} className="flex-1 flex items-center justify-center overflow-hidden relative">

                    {/* Top-right overlay: price card */}
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 scale-90 md:scale-100 origin-top-right">
                        <PriceCard priceBreakdown={d.priceBreakdown} priceLoading={d.priceLoading} />
                    </div>

                    {/* Top-left overlay: size editor + remove button */}
                    <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 z-10 pointer-events-none scale-90 md:scale-100 origin-top-left">
                        <SizeEditor displaySizeIn={d.displaySizeIn} onApply={d.applySizeIn} />
                        {d.selectedId && (
                            <button
                                onClick={() => { d.setCanvasImages(prev => prev.filter(ci => ci.id !== d.selectedId)); d.setSelectedId(null); d.markDirty(); }}
                                className="pointer-events-auto px-4 py-1.5 bg-white backdrop-blur-sm border border-red-100 text-red-500 rounded-lg shadow-sm text-xs font-semibold hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-1.5">
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                        )}
                    </div>

                    {/* Bottom context panel */}
                    <BottomContextPanel
                        currentSides={d.currentSides}
                        currentTemplate={d.currentTemplate}
                        selectedColorId={d.selectedColorId}
                        activeColorIds={d.activeColorIds}
                        showColorPicker={d.showColorPicker}
                        uniqueColors={d.uniqueColors}
                        colorPickerRef={d.colorPickerRef}
                        onSideChange={t => { d.saveCurrentSide(); d.setCurrentTemplate(t); }}
                        onColorSelect={d.handleColorSelect}
                        onToggleColorPicker={() => d.setShowColorPicker(p => !p)}
                        onColorAdd={d.handleColorAdd}
                        onColorRemove={d.handleColorRemove}
                    />

                    {/* Konva stage */}
                    <CanvasStage
                        stageRef={d.stageRef}
                        bgNodeRef={d.bgNodeRef}
                        printZoneNodeRef={d.printZoneNodeRef}
                        transformerRef={d.transformerRef}
                        bgImage={d.bgImage}
                        stageSize={d.stageSize}
                        printZone={d.printZone}
                        canvasImages={d.canvasImages}
                        selectedId={d.selectedId}
                        isExporting={d.isExporting}
                        pxPerInch={d.pxPerInch}
                        onSelect={d.setSelectedId}
                        onDragEnd={d.handleStageDragEnd}
                        onTransform={d.handleStageTransform}
                        onTransformEnd={d.handleStageTransformEnd}
                    />
                </div>
            </div>

            {/* Order panel */}
            {showOrderPanel && (
                <OrderPanel
                    selectedSize={d.selectedSize}
                    onSizeChange={d.setSelectedSize}
                    quantity={d.quantity}
                    onQuantityChange={d.setQuantity}
                    priceBreakdown={d.priceBreakdown}
                    isAddingToCart={d.isAddingToCart}
                    isSaving={d.isSaving}
                    onAddToCart={() => { setShowOrderPanel(false); d.handleAddToCart(false); }}
                    onOrderNow={() => { setShowOrderPanel(false); d.handleAddToCart(true); }}
                    onClose={() => setShowOrderPanel(false)}
                />
            )}

            {/* Delete confirmation modal */}
            {d.deleteImageName && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
                        <h3 className="font-bold text-base mb-2">ลบรูปภาพ?</h3>
                        <p className="text-sm text-gray-500 mb-5">รูปภาพนี้จะถูกลบออกจากคลัง ไม่สามารถกู้คืนได้</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => d.setDeleteImageName(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">ยกเลิก</button>
                            <button onClick={d.confirmDeleteImage} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">ลบ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mockup preview modal */}
            {d.showMockup && (
                <MockupModal results={d.mockupUrl} onClose={() => d.setShowMockup(false)} />
            )}

            {/* Leave confirmation modal */}
            {showLeaveModal && (
                <LeaveConfirmModal
                    onConfirm={() => navigate(-1)}
                    onCancel={() => setShowLeaveModal(false)}
                />
            )}

            {/* DPI warning modal */}
            {d.dpiWarningFile && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
                        <h3 className="font-bold text-base mb-2">ความละเอียดต่ำ</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            รูปภาพนี้มีความละเอียดเพียง <span className="font-semibold text-orange-500">{d.dpiWarningFile.dpi} DPI</span> ซึ่งอาจทำให้งานพิมพ์ไม่คมชัด (แนะนำ 150+ DPI)
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => d.setDpiWarningFile(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">ยกเลิก</button>
                            <button onClick={() => d.proceedWithUpload(d.dpiWarningFile!.file)} className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600">อัปโหลดต่อ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
