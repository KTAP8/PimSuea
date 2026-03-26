# CanvasTest Refactor

**Date:** 2026-03-25
**Original file:** `pimsuea-frontend/src/pages/CanvasTest.tsx` (~1030 lines)

## What Was Done

Split the monolithic `CanvasTest.tsx` into focused files:

| File | Lines | Purpose |
|------|-------|---------|
| `src/types/canvas.ts` | 18 | Shared types: `CanvasImage`, `SerializableImage` |
| `src/hooks/useCanvasDesign.ts` | ~280 | All state, effects, and business logic |
| `src/components/canvas/ImageLibraryPanel.tsx` | ~55 | Floating image library panel |
| `src/components/canvas/LayerPanel.tsx` | ~65 | Floating layer panel (reorder, delete) |
| `src/components/canvas/BottomContextPanel.tsx` | ~75 | Bottom pill: side switcher + color picker |
| `src/components/canvas/CanvasStage.tsx` | ~100 | Konva Stage + images + Transformer + print zone rect |
| `src/pages/CanvasTest.tsx` | ~175 | Layout + wiring only (consumes the hook + components) |

## Key Design Decisions

### `useCanvasDesign` hook
- Owns all state, refs, and side-effects
- Returns a flat object (`d`) consumed by `CanvasTest`
- Refs (`stageRef`, `bgNodeRef`, etc.) are created here and passed down as props — valid React pattern since refs are mutable objects
- All stage event handlers (`handleStageDragEnd`, `handleStageTransform`, `handleStageTransformEnd`) are defined here so they can close over state setters

### `CanvasStage`
- Pure controlled component — no internal state
- Owns the drag-clamp `onDragMove` logic inline (needs `printZone` which is a prop)
- `onTransformEnd` imperatively resets scale to 1 on the Konva node before calling the parent callback

### Ref types
All refs are typed as `RefObject<T | null>` (React 19 / strict mode compatible):
```tsx
stageRef: React.RefObject<Konva.Stage | null>
bgNodeRef: React.RefObject<Konva.Image | null>
printZoneNodeRef: React.RefObject<Konva.Rect | null>
transformerRef: React.RefObject<Konva.Transformer | null>
colorPickerRef: React.RefObject<HTMLDivElement | null>
```

### Color actions
Two explicit callbacks instead of one generic toggle:
- `handleColorAdd(colorId)` — adds to `activeColorIds` + switches canvas view to it
- `handleColorRemove(colorId)` — removes from `activeColorIds`, auto-switches view if it was the active one

### No functionality changes
All features are identical to the original:
- Multi-side design storage keyed by side name (`"front"` / `"back"`)
- Print zone drag/resize clamping
- Multi-color selection with `activeColorIds`
- Layer panel reorder / delete
- Save → hash check → upload preview + print files + print_dimensions
- Off-screen capture for non-active sides
- DPI warning on upload
- Backward-compatible loading of old canvas_data formats
