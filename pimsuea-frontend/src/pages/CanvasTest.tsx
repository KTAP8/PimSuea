import { Upload, ImageIcon, Layers, Loader2, Save, Trash2 } from 'lucide-react';
import { useCanvasDesign } from '../hooks/useCanvasDesign';
import { ImageLibraryPanel } from '../components/canvas/ImageLibraryPanel';
import { LayerPanel } from '../components/canvas/LayerPanel';
import { BottomContextPanel } from '../components/canvas/BottomContextPanel';
import { CanvasStage } from '../components/canvas/CanvasStage';
import { PriceCard } from '../components/canvas/PriceCard';
import { SizeEditor } from '../components/canvas/SizeEditor';

export default function CanvasTest() {
    const d = useCanvasDesign();

    return (
        <div className="flex flex-col h-screen bg-background">

            {/* ── Top header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b shadow-sm z-20 shrink-0 sticky top-0">
                <div className="flex items-center gap-4 w-1/3">
                    <span className="font-bold text-primary tracking-tight text-lg">Design Canvas</span>
                </div>

                <div className="flex-1 flex justify-center w-1/3">
                    <input
                        value={d.designName}
                        onChange={e => d.setDesignName(e.target.value)}
                        className="border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-2 text-sm font-semibold w-64 text-center focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action transition-all placeholder-gray-400"
                        placeholder="Untitled Design"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 w-1/3">
                    <button onClick={d.handleSave} disabled={d.isSaving || !d.currentTemplate}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                            d.saveStatus === 'saved' ? 'bg-green-600 text-white shadow-green-600/20' :
                            d.saveStatus === 'error' ? 'bg-destructive text-white shadow-red-500/20' :
                            'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                        }`}>
                        {d.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {d.isSaving ? 'Saving…' : d.saveStatus === 'saved' ? 'Saved!' : d.saveStatus === 'error' ? 'Error' : 'Save'}
                    </button>

                    <button onClick={d.handleExport} disabled={d.isExporting || !d.currentTemplate}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-action text-white rounded-xl text-sm font-semibold shadow-sm shadow-action/20 transition-all hover:bg-action/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                        {d.isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {d.isExporting ? 'Exporting…' : 'Export 300 DPI'}
                    </button>
                </div>
            </div>

            {/* ── Main content ─────────────────────────────────────────────────── */}
            <div className="flex flex-row flex-1 overflow-hidden relative">

                {/* Left sidebar */}
                <aside className="w-24 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col items-center py-6 gap-6 z-10 shrink-0 border-r border-gray-100">

                    {/* Upload */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer w-full group text-gray-400 hover:text-gray-700">
                        <label className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-transparent group-hover:border-gray-200 ${d.isUploading ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-50 group-hover:bg-gray-100 text-gray-600'}`}>
                            {d.isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Upload className="w-5 h-5" />}
                            <input type="file" className="hidden" accept="image/*" onChange={d.handleSidebarUpload} disabled={d.isUploading} />
                        </label>
                        <span className="text-[10px] font-semibold">{d.isUploading ? '...' : 'Upload'}</span>
                    </div>

                    {/* Library toggle */}
                    <div className={`flex flex-col items-center gap-1.5 cursor-pointer w-full group ${d.showImageLibrary ? 'text-primary' : 'text-gray-400 hover:text-gray-700'}`}
                        onClick={() => d.setShowImageLibrary(v => !v)}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border border-transparent ${d.showImageLibrary ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-50 group-hover:bg-gray-100 text-gray-600 group-hover:border-gray-200'}`}>
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold">Library</span>
                    </div>

                    <div className="w-10 h-px bg-gray-100 my-1" />

                    {/* Layers toggle */}
                    <div className={`flex flex-col items-center gap-1.5 cursor-pointer w-full group ${d.showLayerPanel ? 'text-primary' : 'text-gray-400 hover:text-gray-700'}`}
                        onClick={() => d.setShowLayerPanel(v => !v)}>
                        <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all border border-transparent ${d.showLayerPanel ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-50 group-hover:bg-gray-100 text-gray-600 group-hover:border-gray-200'}`}>
                            <Layers className="w-5 h-5" />
                            {d.canvasImages.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                    {d.canvasImages.length}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-semibold">Layers</span>
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
                        }}
                        onClose={() => d.setShowLayerPanel(false)}
                    />
                )}

                {/* Canvas area */}
                <div ref={d.containerRef} className="flex-1 flex items-center justify-center overflow-hidden relative">

                    {/* Top-right overlay: price card */}
                    <div className="absolute top-6 right-6 z-10">
                        <PriceCard priceBreakdown={d.priceBreakdown} priceLoading={d.priceLoading} />
                    </div>

                    {/* Top-left overlay: size editor + remove button */}
                    <div className="absolute top-6 left-6 flex items-center gap-3 z-10 pointer-events-none">
                        <SizeEditor displaySizeIn={d.displaySizeIn} onApply={d.applySizeIn} />
                        {d.selectedId && (
                            <button
                                onClick={() => { d.setCanvasImages(prev => prev.filter(ci => ci.id !== d.selectedId)); d.setSelectedId(null); }}
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

            {/* Export result */}
            {d.exportedUrl && (
                <div className="p-2 text-xs bg-green-50 border-t break-all shrink-0">
                    <span className="font-medium text-green-700 mr-1">Exported:</span>
                    <a href={d.exportedUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{d.exportedUrl}</a>
                </div>
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
