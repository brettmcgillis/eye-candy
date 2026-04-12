# TOOLBOX REFACTOR PLAN

A cohesive set of editor tools built on a shared architecture, with consistent simulation scale, reusable hooks for WIP scenes, and clean contextual controls.

---

## Goals (Priority Order)

### 1 — Unified Architecture & Feature Parity
All toolbox scenes share a common `SplineGroup` component and per-spline controls hook. Adding a new smoke or fire type in one place automatically makes it available in every tool.

### 2 — Consistent Simulation Scale
Sims render at the same scale in both the toolbox and WIP scenes. 1 unit in SmokeTest = 1 unit in StillPullingForYou. No `SCALE = 1/300` conversion math. If a WIP scene wants to scale a sim for artistic reasons, it wraps it in a `<group scale={...}>` explicitly — that is the only sanctioned exception.

### 3 — Reusable Hooks/Components for WIP Scenes
A `useSimPreset(presetKey, overrides?)` hook lets WIP scenes load a preset and apply context-specific overrides without duplicating control logic. Overrides support: (a) whole-group placement (position/rotation), (b) per-spline param patches.

### 4 — Clean, Contextual Controls
Controls are visible only when relevant to the active type selection. Folders collapse intelligently. Layout is structured and readable.

---

## Tools Overview

### SplineEditor
Pure curve editing. Creates splines for camera/motion paths. No particle systems. Preset namespace stays separate and out of scope for this refactor.

### SmokeTest
All smoke types available — spline-based and standalone.
- Spline-based: `SmokeParticles`, `VolumetricSmokeParticles`
- Standalone: `SmokeBall`, `SmokeBallSpline`
- Attractor/repeller system

### FireTest
All fire types available — spline-based and standalone.
- Spline-based: `VolumetricFire`, `CS184VolumetricFire`
- Standalone: `Fireball`, `FireballSpline`, `Flame`, `FireballVolume`

### HotBox
Full combination of SmokeTest + FireTest. Any spline can carry any smoke or fire type. All standalone elements available in a dedicated Elements section. Designed for complex arrangements where multiple types are needed simultaneously (e.g. CS184 spline fire + standalone Fireball for a core effect).

HotBox is **additive**, not a replacement — SmokeTest and FireTest remain as focused isolation tools.

---

## Architecture

### Shared SplineGroup Component ✅
**Status:** Shipped at `src/components/elements/splineGroup/SplineGroup.jsx`

Props:
- `index` — spline index (used to key per-spline Leva paths)
- `points` — `[{ position, rotation, scale }, ...]`
- `config` — scene-level config (`pointMode`, `bgColor`, …)
- `splineConfig` — merged from `DEFAULT_SPLINE_CONFIG`; includes `type`, `smokeType`, `fireType`, all smoke + fire params
- `attractorsRef` — optional, forwarded to particle systems
- `setSplinePoints` — `(index, updater) => void`

All three scenes (SmokeTest, FireTest, HotBox) import from `../../../../elements/splineGroup/SplineGroup`.

---

### Shared Per-Spline Controls Hook ✅
**Status:** Shipped at `src/components/scenes/ToolBox/WebGL/shared/hooks/useSplineGroupControls.js`

`buildSplineGroupControls(index, cfg, { sceneLabel, setSplineConfigs, setSplines, allowedTypes })`

- Returns a Leva schema object — called inside a `useControls(() => ...)` callback
- `allowedTypes: 'smoke'` → only smoke folders rendered (SmokeTest)
- `allowedTypes: 'fire'` → only fire folders rendered (FireTest)
- `allowedTypes: 'both'` → type selector + both smoke and fire folders (HotBox)
- All sub-type folders use `render: (get) => ...` with live `get()` calls (never stale `cfg` captures)

---

### Conditional Leva Controls
Use Leva's `render` prop to gate folder visibility on the active type selection.

```js
'Particle Smoke': folder({ ... }, {
  render: (get) => get(`type_${index}`) === 'Smoke' && get(`smokeType_${index}`) === 'Particle'
})
```

Rules:
- Smoke folders hidden when `type = Fire`
- Fire folders hidden when `type = Smoke`
- Fire subfolders (Classic / RayMarch / Fireball) hidden when not the active `fireType`
- SmokeBallSpline controls hidden when SmokeBall is not the active element type

---

### Unified Preset Format
**Current state:** Separate smoke/fire/spline preset files. No shared schema. Physics params stored at authoring scale, positions sometimes manually converted.

**Target — single flat format used by all tools:**
```js
{
  splines: [
    {
      name: 'Chimney Smoke',
      type: 'Smoke' | 'Fire',
      smokeType: 'Particle' | 'Volumetric',
      fireType: 'Classic' | 'RayMarch' | 'Fireball',
      tension: 0.5,
      closed: false,
      arcSegments: 200,
      points: [{ position, rotation, scale }, ...],
      smokeConfig: { ... },
      fireConfig: { ... },
    },
    ...
  ],
  attractors: [{ position, rotation, radius, strength, type }, ...],
  scene: { bgColor, lineColor },
  // standalone non-spline elements (HotBox only)
  elements: [
    { elementType: 'SmokeBall' | 'Fireball' | 'Flame' | 'FireballVolume', position, config: { ... } },
    ...
  ]
}
```

SplineEditor presets remain in their own namespace — out of scope for this refactor.

---

### Scale Contract
**The problem:** `stillPullingForYouSmoke.js` has `const SCALE = 1/300` — spline positions authored in a large editor space were manually divided down to scene units. Physics params (particleSize, turbulence, maxDrift etc.) were then re-tuned by hand for the compressed space. This is the exact workflow we are eliminating.

**The contract:**
- Toolbox scenes are calibrated to the same coordinate system as WIP scenes. What looks right in SmokeTest at position `(-0.8, 1.4, -0.5)` lands at `(-0.8, 1.4, -0.5)` in a WIP scene.
- No `SCALE` constants. No `P(x,y,z)` conversion helpers. No manual re-tuning of physics params after a coord transform.
- If a WIP scene needs to resize a sim (artistic choice), it wraps it: `<group scale={0.5}><MySim /></group>`. This is explicit and intentional, not a correction for a scale mismatch.

**Migration work:**
- Recalibrate the toolbox editor camera and GridBox to match WIP scene scale
- Re-author existing "large-space" presets at correct scale (stillPullingForYouSmoke, others)
- Delete SCALE constants and conversion helpers from preset files

---

### Dev Export — Vite Write Middleware
**Current state:** Copy-to-clipboard in `localEnv`. Manual paste into preset file.

**Target flow:**
1. Load a preset by name from the dropdown (e.g. "Burning At Both Ends")
2. Edit in the toolbox
3. Hit "Save Preset" (only rendered in `localEnv`)
4. The current scene state (all splines, element configs, attractor configs, spline names) is serialized and POSTed to `POST /dev/write-preset`
5. Vite middleware resolves the preset name → source file path via a registry, writes the updated preset JS back to disk
6. Vite HMR picks up the change

**Preset registry** (needed to map name → file):
```js
// src/presets/presetRegistry.js
export const PRESET_REGISTRY = {
  smoke: {
    'Still Pulling For You': 'src/presets/smoke/stillPullingForYouSmoke.js',
    'Thats All Folks':       'src/presets/smoke/thatsAllFolksSmoke.js',
  },
  fire: {
    'Burning At Both Ends':  'src/presets/fire/burningAtBothEndsFire.js',
    'Dumpster Fire':         'src/presets/fire/dumpsterFire.js',
  },
}
```

**Vite plugin:**
```
src/server/writePresetPlugin.js
```

Constraints:
- Write target must resolve within `src/presets/` (prevent path traversal)
- Dev only — plugin is not included in production build
- Spline names from the UI are preserved in the serialized output

---

### Reusable WIP Hook — `useSimPreset`
WIP scenes use this to load a preset and optionally patch it for context-specific needs:

```js
// Whole-group placement only
const sim = useSimPreset('Still Pulling For You', {
  position: [0, 1.2, 0],
  rotation: [0, Math.PI / 4, 0],
})

// Per-spline param override (e.g. geometry is blocking, need less drift)
const sim = useSimPreset('Still Pulling For You', {
  position: [0, 1.2, 0],
  splineOverrides: {
    'Still Pulling Spline 2': { maxDrift: 0.5, turbulence: 0.2 },
  },
})
```

The hook merges preset defaults with override patches before passing down to SplineGroup components.

---

## Refactor Sequence

### Phase 1 — Foundation ✅
- [x] Finalize and document the unified preset schema → `DEFAULT_SPLINE_CONFIG` superset in `shared/splineDefaults.js`
- [x] Build `presetRegistry.js` mapping names to source files → `src/presets/presetRegistry.js`
- [x] Extract shared `SplineGroup` to `src/components/elements/splineGroup/SplineGroup.jsx`
- [x] Extract shared `useSplineGroupControls` hook → `buildSplineGroupControls` factory in `shared/hooks/useSplineGroupControls.js`
- [x] `parsePreset` handles legacy format migration (`type: 'Particle'` → `smokeType: 'Particle'`)
- [x] `serializeSplines` handles serialization to JS literal, strips view-only flags

### Phase 2 — Toolbox Scenes ✅
- [x] Refactor `SmokeTest` — `useSmokeTestControls` uses `buildSplineGroupControls(allowedTypes: 'smoke')`; scene uses shared `SplineGroup`
- [x] Refactor `FireTest` — `useFireTestControls` uses `buildSplineGroupControls(allowedTypes: 'fire')` + preset selection + attractor support; scene uses shared `SplineGroup` alongside legacy standalone elements
- [x] Refactor `HotBox` — `useHotBoxControls` uses `buildSplineGroupControls(allowedTypes: 'both')`; scene uses shared `SplineGroup`
- [x] Conditional `render` props on all type/subtype folders via Leva `get()` — smoke folders hidden for fire splines, fire sub-type folders hidden when not active
- [x] Standalone Elements section added to HotBox: SmokeBall, Fireball, Flame, FireballVolume (all at scene scale)
- [x] Feature parity: all smoke types in SmokeTest + HotBox; all fire types in FireTest + HotBox

### Phase 3 — Scale Calibration
- [ ] Define canonical scene scale (calibrate against a reference WIP scene)
- [ ] Recalibrate toolbox editor camera and GridBox to match
- [ ] Re-author all large-space presets at correct scale
- [ ] Delete SCALE constants and conversion helpers

### Phase 4 — Dev Tooling & Export
- [ ] Build `writePresetPlugin.js` Vite middleware
- [ ] Add "Save Preset" button to all toolbox scenes (localEnv only)
- [ ] Wire preset name → file resolution through the registry
- [ ] Ensure spline names are preserved in serialized output

### Phase 5 — WIP Scene Hook
- [ ] Design and implement `useSimPreset`
- [ ] Support whole-group placement overrides (position/rotation)
- [ ] Support per-spline param patch overrides
- [ ] Migrate one WIP scene as a pilot (StillPullingForYou is the obvious candidate)
