import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackStudioOrderOpened } from "../lib/studioAnalytics";
import { useCanvasDesign } from "../hooks/useCanvasDesign";
import { useStudioTools } from "../hooks/useStudioTools";
import { useStudioAccountPrompt } from "../hooks/useStudioAccountPrompt";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useBulkOrder } from "../hooks/useBulkOrder";
import { ImageLibraryPanel } from "../components/canvas/ImageLibraryPanel";
import { LayerPanel } from "../components/canvas/LayerPanel";
import { BottomContextPanel } from "../components/canvas/BottomContextPanel";
import { CanvasStage } from "../components/canvas/CanvasStage";
import { PriceCard } from "../components/canvas/PriceCard";
import { LeaveConfirmModal } from "../components/canvas/LeaveConfirmModal";
import { MockupModal } from "../components/canvas/MockupModal";
import { OrderPanel } from "../components/canvas/OrderPanel";
import { StudioHeader } from "../components/canvas/StudioHeader";
import { SaveStatusBar } from "../components/canvas/SaveStatusBar";
import { CanvasToolbar } from "../components/canvas/CanvasToolbar";
import { StudioToolRail } from "../components/canvas/StudioToolRail";
import { MobilePriceSheet } from "../components/canvas/MobilePriceSheet";
import { MobilePriceChip } from "../components/canvas/MobilePriceChip";
import { LowResModal } from "../components/canvas/LowResModal";
import { DeleteImageModal } from "../components/canvas/DeleteImageModal";
import { SignupSheet } from "../components/auth/SignupSheet";
import { useLanguage } from "@/i18n/LanguageContext";

export default function DesignStudio() {
  const d = useCanvasDesign();
  const tools = useStudioTools(d);
  const account = useStudioAccountPrompt({ designId: d.designId });
  const navigate = useNavigate();
  const { t } = useLanguage();
  const s = t.studio;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const designNameInputRef = useRef<HTMLInputElement | null>(null);
  const bulk = useBulkOrder({
    open: showOrderPanel, productId: d.currentTemplate?.product_id, colorId: d.selectedColorId,
    printingType: d.printingType, sizes: d.availableSizes, defaultSize: d.selectedSize,
    getSides: d.collectPrintDimensionsForPricing,
  });
  const orderColors = d.uniqueColors.filter((c) => d.activeColorIds.has(c.id));
  const addLines = () => d.handleAddToCart(false,
    bulk.lines.map((l) => ({ ...l, unit: bulk.quote?.lines.find((q) => q.size === l.size)?.unit })), d.selectedColorId);

  const contextPanelProps = {
    currentSides: d.currentSides, currentTemplate: d.currentTemplate, selectedColorId: d.selectedColorId,
    activeColorIds: d.activeColorIds, showColorPicker: d.showColorPicker, uniqueColors: d.uniqueColors,
    colorPickerRef: d.colorPickerRef, onSideChange: d.handleSideChange, onColorSelect: d.handleColorSelect,
    onToggleColorPicker: () => d.setShowColorPicker((p) => !p), onColorAdd: d.handleColorAdd, onColorRemove: d.handleColorRemove,
  } as const;

  const cartErrorMessage = { auth: s.cartErrorAuth, save: null, cart: s.cartErrorCart, dtf: s.cartErrorDtf }[d.cartError ?? ""] ?? null;
  const mockupDisabled = !d.templates.some((tp) => tp.color?.id === d.selectedColorId && tp.mockup_config);

  const handleSaveClick = async () => {
    const wasNew = !d.designId;
    const result = await d.handleSave();
    if (result && wasNew) account.afterFirstSave();
  };
  const openOrderPanel = () => { trackStudioOrderOpened(); d.setCartError(null); setShowOrderPanel(true); };
  const handleBack = () => {
    if (d.isDirty) return setShowLeaveModal(true);
    d.reportStudioExit("back", false);
    navigate(-1);
  };

  useEffect(() => {
    if (!d.shouldFocusDesignName || !designNameInputRef.current) return;
    designNameInputRef.current.focus();
    designNameInputRef.current.select();
    d.setShouldFocusDesignName(false);
  }, [d.shouldFocusDesignName, d.setShouldFocusDesignName, d.designName]);

  // Live price: re-quote shortly after any artwork/size/colour change (deduped by a cache key in the hook).
  useEffect(() => {
    const timer = setTimeout(() => { void d.refreshDisplayPrice(); }, 400);
    return () => clearTimeout(timer);
  }, [d.priceRefreshSignal, d.selectedSize, d.selectedColorId, d.printingType, d.refreshDisplayPrice]);

  // Track abandon on tab close (the local draft keeps the work, so no blocking prompt).
  useEffect(() => {
    const onPageHide = () => { d.flushDraft(); d.reportStudioExit("pagehide", d.isDirty); };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [d.isDirty, d.reportStudioExit, d.flushDraft]);

  return (
    <div className="flex flex-col h-dvh-screen max-h-dvh min-h-0 overflow-hidden bg-background">
      <StudioHeader designName={d.designName} onNameChange={d.handleDesignNameChange} nameInputRef={designNameInputRef}
        isDirty={d.isDirty} onBack={handleBack} onMockup={d.handleMockup} mockupDisabled={mockupDisabled}
        generatingMockup={d.generatingMockup} onOrder={openOrderPanel} orderDisabled={!d.currentTemplate}
        onSave={handleSaveClick} isSaving={d.isSaving} saveStatus={d.saveStatus} />
      <SaveStatusBar saveStatus={d.saveStatus} saveError={d.saveError} cartErrorMessage={cartErrorMessage}
        onRetry={handleSaveClick} onOrder={openOrderPanel} />

      <div className="flex-1 min-h-0 overflow-hidden grid grid-rows-[minmax(0,1fr)_auto] md:grid-rows-none md:flex md:flex-row">
        <StudioToolRail variant="rail" active={tools.panel} onToggle={tools.toggle} isUploading={d.isUploading}
          onUpload={d.handleSidebarUpload} layerCount={d.canvasImages.length} />

        <div className="grid grid-rows-[minmax(0,1fr)_auto] min-h-0 overflow-hidden md:flex md:flex-col md:flex-1 md:basis-0 md:min-h-0">
          <div ref={d.containerRef} className="flex-1 min-h-0 relative overflow-hidden bg-gray-50/30" {...tools.dropHandlers}>
            <CanvasToolbar canUndo={d.canUndo} canRedo={d.canRedo} onUndo={d.undo} onRedo={d.redo}
              displaySizeIn={d.displaySizeIn} printableIn={tools.printableIn} onApplySize={d.applySizeIn}
              onApplyPreset={tools.applyPreset} hasSelection={Boolean(d.selectedId)}
              onRemove={() => d.selectedId && d.removeCanvasLayer(d.selectedId)} />

            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 hidden md:block">
              <PriceCard priceBreakdown={d.priceBreakdown} priceLoading={d.priceLoading} />
            </div>
            {isDesktop && <BottomContextPanel layout="floating" {...contextPanelProps} />}
            {tools.panel === null && <MobilePriceChip priceBreakdown={d.priceBreakdown} onOpen={() => tools.open("price")} />}

            {d.currentTemplate && !d.bgImage && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50/80">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            {tools.dragging && (
              <div className="absolute inset-2 z-30 rounded-3xl border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center gap-2 text-primary font-semibold pointer-events-none">
                <Upload className="w-8 h-8" aria-hidden="true" />{t.studioTools.dropHere}
              </div>
            )}

            <CanvasStage stageRef={d.stageRef} bgNodeRef={d.bgNodeRef} printZoneNodeRef={d.printZoneNodeRef}
              transformerRef={d.transformerRef} bgImage={d.bgImage} stageSize={d.stageSize} printZone={d.printZone}
              canvasImages={d.canvasImages} selectedId={d.selectedId} isExporting={d.isExporting} pxPerInch={d.pxPerInch}
              onSelect={d.setSelectedId} onDragEnd={d.handleStageDragEnd} onTransform={d.handleStageTransform}
              onTransformEnd={d.handleStageTransformEnd} onUndo={d.undo} onRedo={d.redo} />
          </div>
          {!isDesktop && <BottomContextPanel layout="bar" {...contextPanelProps} />}
        </div>

        <StudioToolRail variant="tabs" active={tools.panel} onToggle={tools.toggle} isUploading={d.isUploading}
          onUpload={d.handleSidebarUpload} layerCount={d.canvasImages.length} />

        {d.showImageLibrary && (
          <ImageLibraryPanel userUploads={d.userUploads} loadingUploads={d.loadingUploads} uploadsError={d.uploadsError}
            isUploading={d.isUploading} onClose={() => tools.open(null)} onAddImage={d.addImageFromUrl}
            onUpload={d.handleSidebarUpload} onDeleteRequest={d.setDeleteImageName} />
        )}
        {d.showLayerPanel && (
          <LayerPanel canvasImages={d.canvasImages} selectedId={d.selectedId} onSelect={d.setSelectedId}
            onMove={d.moveLayer} onDelete={d.removeCanvasLayer} onClose={() => tools.open(null)} />
        )}
      </div>

      {tools.panel === "price" && (
        <MobilePriceSheet priceBreakdown={d.priceBreakdown} priceLoading={d.priceLoading} displaySizeIn={d.displaySizeIn}
          printableIn={tools.printableIn} onApplySize={d.applySizeIn} onApplyPreset={tools.applyPreset} onClose={() => tools.open(null)} />
      )}

      {showOrderPanel && (
        <OrderPanel sizes={d.availableSizes} grid={bulk.grid} onQtyChange={bulk.setQty} totalQty={bulk.totalQty}
          quote={bulk.quote} quoteLoading={bulk.loading} onAddMore={bulk.addMore}
          colors={orderColors} colorId={d.selectedColorId} onColorChange={d.handleColorSelect}
          cartErrorMessage={cartErrorMessage} isAddingToCart={d.isAddingToCart} isSaving={d.isSaving} printingType={d.printingType}
          onAddToCart={async () => { if ((await addLines()).ok) setShowOrderPanel(false); }}
          onOrderNow={async () => {
            if (!(await addLines()).ok) return;
            setShowOrderPanel(false);
            account.goToCheckout();
          }}
          onClose={() => { d.setCartError(null); setShowOrderPanel(false); }} />
      )}

      <SignupSheet {...account.sheet} />
      {d.deleteImageName && <DeleteImageModal onCancel={() => d.setDeleteImageName(null)} onConfirm={d.confirmDeleteImage} />}
      {d.showMockup && <MockupModal results={d.mockupUrl} onClose={() => d.setShowMockup(false)} />}
      {showLeaveModal && (
        <LeaveConfirmModal
          onKeep={() => { d.flushDraft(); d.reportStudioExit("leave_modal", true); navigate(-1); }}
          onDiscard={() => { d.discardDraft(); d.reportStudioExit("leave_modal", true); navigate(-1); }}
          onCancel={() => setShowLeaveModal(false)} />
      )}
      {d.dpiWarningFile && (
        <LowResModal dpi={d.dpiWarningFile.dpi} isUploading={d.isUploading} onCancel={() => d.setDpiWarningFile(null)}
          onProceed={() => d.proceedWithUpload(d.dpiWarningFile!.file)} />
      )}
    </div>
  );
}
