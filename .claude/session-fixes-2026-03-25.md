# Session Fixes — 2026-03-25

## Problems Fixed This Session

### 1. Object clamping during drag (`object:moving`)
**File:** `pimsuea-frontend/src/pages/DesignCanvas.tsx` ~line 312

**Problem:** The `object:moving` constraint was clamping the object's CENTER to the zone boundary instead of its EDGES. For center-origin objects, this allowed half the bounding box (and visible content) to sit outside the print zone. The `clipPath` masked this in the editor, but the export would cut off the overhanging content.

**Fix:** Extracted a `clampObjectToBounds` helper that correctly clamps so `object edge = zone boundary` (not `object center = zone boundary`). `applyConstraints` now calls this helper.

---

### 2. Objects load in wrong position on reload (one-time clamp on load)
**File:** `pimsuea-frontend/src/pages/DesignCanvas.tsx` — PATH A `loadFromJSON` callback

**Problem:** When a design was loaded from the DB, objects were restored to their saved positions. If saved with the old (broken) clamping, their positions were already wrong (content outside zone). Also, if the browser window was a different size on reload, the print zone would be smaller but objects wouldn't move, making the overshoot worse.

**Fix:** After `loadFromJSON` (in PATH A), a one-time pass applies `clampObjectToBounds` to every design object, correcting positions before the canvas is rendered.

---

### 3. ScaleFactor drift between sessions (rescaling on load)
**File:** `pimsuea-frontend/src/pages/DesignCanvas.tsx` — PATH A `loadFromJSON` callback

**Problem:** `scaleFactor = min(containerW / imgW, containerH / imgH, 1) * 0.95`. If the browser window is a different size on reload, all display-pixel coordinates are wrong relative to the new print zone.

**Fix:** `saveCurrentCanvas()` now saves `bounds: printZoneBoundsRef.current` alongside the JSON. On load (PATH A from DB), if `savedBounds.width != currentBounds.width`, all object positions and scales are multiplied by `ratio = currentZoneWidth / savedZoneWidth`. Text: `fontSize *= ratio`. Images/shapes: `scaleX *= ratio, scaleY *= ratio`. Skip if old design has no saved `bounds`.

---

### 4. Stale clipPath coordinates serialized into saved JSON
**File:** `pimsuea-frontend/src/pages/DesignCanvas.tsx` — `saveCurrentCanvas()`

**Problem:** Objects have `clipPath = clipPathRef.current` (absolute-positioned Rect). When serialized, the clip rect's coordinates are locked to the current `scaleFactor`. On reload, if `scaleFactor` differs, the clip is at wrong coordinates → design appears shifted.

**Fix:** `saveCurrentCanvas()` strips clipPath from each object before saving:
```typescript
.map(({ clipPath: _cp, ...rest }: any) => rest)
```
On load (PATH A callback), fresh clipPath is reapplied from `clipPathRef.current` (which has correct coords for the current session).

---

## Remaining Known Issues (to be discussed next session)

- User reported the **edges-cut-off / object-bigger-on-reload** problem may still be present in some scenarios — the above fixes address the root causes but old saved designs may need re-saving after the fixes to get correct export files.
- Need to verify with the user whether the one-time clamp on load visually moves objects in an unexpected/jarring way (it should be a small correction, but could be noticeable for designs deliberately placed at the zone edge).
- Any other canvas bugs the user wanted to discuss.

---

## Key Architecture Reminders

- `savedDesigns.current` = `{ [templateId]: { json: FabricJSON, bounds: { left, top, width, height } } }`
- `bounds` field is NEW (added this session) — old designs in DB won't have it → rescaling skipped for those
- `clipPath` on objects = always `clipPathRef.current` (shared instance, absolutePositioned Rect = print zone + 1px ZONE_STROKE_HALF)
- `clampObjectToBounds` is now the single source of truth for all positional constraints
