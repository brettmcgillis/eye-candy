# DrippingSkull — Scene Plan

## Vision

A skull perpetually dripping with liquid — water, oil, blood, mercury — rendered in true 3D space
with full physical lighting, orbiting camera, and extensive artistic controls. The reference demo
(Shadertoy "Metal Melting Flavor") gives us the drip logic and iridescent look. We use it as a
technique source, not a rendering target.

---

## Architecture Decisions

| Decision             | Choice                                         | Reason                                                 |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| Sphere mode renderer | Fullscreen PostProcessing (fixed)              | Faithful to demo look; self-contained                  |
| Skull mode renderer  | Marching Cubes + real mesh                     | True 3D, orbitable, proper lighting/shadows            |
| Skull SDF            | Analytic approximation (3–4 sphere primitives) | Mesh→SDF is expensive; coated liquid hides imprecision |
| Material             | TSL NodeMaterial, IQ palette-based             | Shared look across sphere and skull modes              |
| Drip logic           | CPU SDF evaluated per MC field update          | MC grid is CPU-side; drip SDF ports cleanly to JS      |
| Post stack           | Godrays pattern (pass + bloom)                 | Consistent with codebase patterns                      |

---

## Diagnosis: Why the Sphere Doesn't Match the Demo

### Bug 1 — Drip blobs fly outside march bounds (critical)

In the reference GLSL, the detaching blob uses:

```glsl
shape = length(p - vec3(0, pow(anim, 10.) * 200. + h, 0)) - .05;
```

`pow(anim, 10) * 200` sends the blob to y ≈ 200 units. But `maxDist = 4.0` stops the
march at 4 units. Blob is always outside the visible region. The drip segment renders
but its head is invisible, creating disconnected-looking geometry.

**Fix:** Change 200 → a `dripDropletFall` uniform (default 3.0). The blob falls ~3 units
then disappears naturally.

### Bug 2 — Color controls wired in Leva but never reach the shader

`tintA`, `tintB`, `tintMix`, `bgColor` exist in `useSceneControls` and presets but are
never passed as uniforms. Shader hardcodes `vec3(1, .3, 6)` palette and `vec3(0.2)` bg.

**Fix:** Pass palette and background as uniforms. Map tintA/tintB to IQ palette a/b params.

### Bug 3 — Step count at 50 undersamples complex geometry

50 raymarch steps for a scene with FBM noise + 8 polar drip segments + blobs is borderline.
Fine geometry (drip necks, surface perturbation) can be missed on first pass.

**Fix:** Increase default to 100. No Leva control needed in Phase 1.

### Note on PostProcessing vs R3F

`RaymarchPass` calls `post.render()` in `useFrame`. R3F calls `renderer.render(scene, camera)`
before useFrame runs. For sphere mode the post pass overwrites R3F's output entirely — this is
intentional and not a visual bug. For skull mode, the skull renders via R3F and is NOT overwritten
because skull mode doesn't mount `RaymarchPass`. The render flow is currently fine.

---

## Phase 1 — Fix the Sphere (current)

**Goal:** Sphere mode visually matches the Shadertoy reference.

### Changes

- **`createRaymarchNode.js`**
  - Add uniforms: `paletteA` (vec3), `paletteB` (vec3), `paletteBrightness` (float),
    `paletteContrast` (float), `paletteSpeed` (float), `bgColor` (vec3),
    `dripCount` (float), `dripDropletFall` (float)
  - Fix blob trajectory: `pow(anim, 10).mul(uniforms.dripDropletFall).add(height)`
  - Dynamic drip count via `dripCount` in the polar modulo
  - Replace hardcoded palette with IQ palette driven by paletteA/B/brightness/contrast/speed
  - Replace hardcoded background with `bgColor`
  - Bump `STEP_COUNT` constant to 100

- **`RaymarchPass.jsx`**
  - Declare all new uniforms in useMemo
  - Update all from config in useFrame (Color hex → THREE.Color)

- **`useSceneControls.js`**
  - Add controls: `dripCount` (select 4/6/8/10/12/16), `dripDropletFall` (1–6, "Drip Length"),
    `paletteSpeed` (0–2), `paletteBrightness` (0.5–4), `paletteContrast` (0–2)

- **`presets.js`**
  - Add new fields to all six presets

### Controls added in Phase 1

| Control           | Range          | Label         |
| ----------------- | -------------- | ------------- |
| tintA             | color          | Tint A        |
| tintB             | color          | Tint B        |
| paletteBrightness | 0.5 – 4        | Brightness    |
| paletteContrast   | 0 – 2          | Contrast      |
| paletteSpeed      | 0 – 2          | Palette Speed |
| dripCount         | 4/6/8/10/12/16 | Drip Count    |
| dripDropletFall   | 1 – 6          | Drip Length   |
| bgColor           | color          | Background    |

---

## Phase 2 — Marching Cubes Skull

**Goal:** Skull mode uses true 3D geometry — orbitable, shadow-casting, physically lit.

### Architecture

```
Surface.jsx
├── sphere mode  →  RaymarchPass (Phase 1, fixed)
└── skull mode   →  DrippingSkullMC
                    ├── MCField.js         (CPU SDF evaluation → MarchingCubes field)
                    ├── LiquidMaterial.js  (TSL NodeMaterial, shared look)
                    └── MarchingCubes mesh (Three.js addons)
```

### Skull SDF approximation

A coarse analytic skull is sufficient — thick liquid coating hides imprecision.

```js
// ~skull shape in unit space
function skullSDF(x, y, z) {
  const cranium = sdSphere(x, y - 0.15, z, 1.0);
  const jaw = sdSphere(x, y - 0.8, z * 0.9, 0.72);
  const brow = sdBox(x, y + 0.9, z - 0.3, 0.8, 0.12, 0.6);
  return smin(smin(cranium, jaw, 0.35), brow, 0.25);
}
```

### MC field evaluation

Each frame, for every grid cell, evaluate:

```js
field[i] = 1.0 - mapSDF(worldX, worldY, worldZ, time, config);
// MC finds field > isolevel (default 0.8) — tweakable as "Coating Thickness"
```

where `mapSDF` ports the same drip logic from Phase 1 but with `skullSDF` as the base
instead of `sdSphere`.

### Material

Single `MeshStandardNodeMaterial` (or `MeshPhysicalNodeMaterial`) with:

- IQ palette as emissive/color (same params as sphere mode)
- Metalness + roughness drives the "liquid type" look
- Fresnel rim glow node

### Controls added in Phase 2

| Control         | Range       | Label             |
| --------------- | ----------- | ----------------- |
| mcResolution    | 32/48/64/80 | MC Quality        |
| isolevel        | 0.5 – 1.2   | Coating Thickness |
| metalness       | 0 – 1       | Metalness         |
| roughness       | 0 – 1       | Roughness         |
| fresnelStrength | 0 – 1       | Rim Glow          |

---

## Phase 3 — Polish and Post Stack

- Bloom (via Godrays pattern, `pass(scene, camera)` + bloomBlur)
- Godrays from key light
- Mouse interaction in skull mode (MC field responds to pointer position)
- "Liquid type" preset shortcuts (Water / Oil / Blood / Mercury / Custom)
- Skull mesh visibility toggle (show/hide underlying skull geometry)

---

## Full Controls Reference (target state)

### Mode

- Shape: Sphere / Skull
- Mouse: Press / Hover

### Drip Dynamics

- Drip Speed (0 – 3)
- Viscosity / smin blend (0 – 1)
- Drip Count (4 / 6 / 8 / 10 / 12 / 16)
- Drip Length (1 – 6)
- Drip Thickness (via pointer radius)

### Surface

- Noise Scale (0.5 – 12)
- Noise Strength (0 – 1)
- Coating Thickness / isolevel (Phase 2+)

### Color

- Background color
- Tint A + Tint B (IQ palette)
- Palette Brightness (0.5 – 4)
- Palette Contrast (0 – 2)
- Palette Speed (0 – 2)

### Lighting

- Ambient intensity
- Key intensity + color
- Rim intensity + color
- Fresnel Rim Glow (Phase 2+)

### Post

- Bloom strength + threshold (Phase 3)
- Godrays (Phase 3)

### Skull (skull mode only)

- Scale
- MC Quality (Phase 2+)

---

## File Map

```
DrippingSkull/
├── DrippingSkull.jsx           orchestrator
├── plan.md                     this file
├── todo.md
├── components/
│   ├── Lighting.jsx
│   ├── RaymarchPass.jsx        sphere mode — fullscreen post
│   ├── Surface.jsx             mode switch: sphere vs skull
│   └── DrippingSkullMC.jsx     (Phase 2) skull mode — marching cubes
├── hooks/
│   ├── usePointerState.js
│   └── useSceneControls.js
├── presets/
│   └── presets.js
├── referenceMaterial/          Shadertoy GLSL source (read only)
│   ├── bufferA.glsl
│   ├── bufferB.glsl
│   ├── common.glsl
│   └── image.glsl
└── utils/
    ├── camera.js
    ├── createRaymarchNode.js   sphere raymarch TSL
    └── MCField.js              (Phase 2) CPU SDF for marching cubes
```
