# HyperCubes pipeline

HyperCubes follows Nesting Boxes' arrangement (`docs/nesting-boxes-pipeline.md`):
one kernel, two renderers, and a dev tool that is a UI over one of them.
Change the kernel first, land every consumer in the same commit, and run
`npm run hyper-cubes:check`.

## The shape

```
@modules/hyperCubes        rect subdivision + sparse octree as one tree shape, morph/grow
                           layout, roles and looks, roll, framing, plot SVG, option schema
@modules/hyperCubesRender  instanced solid / glass / frame layers, floor, studio environment,
                           createCubeRig, camera/lighting/post declarations
        │                              │
  WebGPU/HyperCubes scene       scripts/lib/hyperCubesRender.mjs
  (R3F, Leva generated)           ├─ hyper-cubes-generate.mjs   stills + plot SVG
                                  └─ hyper-cubes-video.mjs      grow / morph / turntable
                                        │
             src/dev/server/hyperCubes → src/dev/tools/hyperCubes (HyperCubesCLI)
```

| Piece                       | Rule                                                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/hyperCubes`       | **Three-free.** May import only `@modules/flora` (`createRng`) and `@utils/paletteStops`. Instances are centre + half extents with a linear-colour look, never matrices. `hyper-cubes:check` enforces it. |
| `@modules/hyperCubesRender` | The only home of the look. `createCubeRig()` is the one object the scene and the CLI draw with: `apply(config)`, `setInstances(buildInstances(…))`, `updateEnvironment(renderer, scene, config)`.         |
| `renderOptions.mjs`         | Every knob, once; the scene's Leva is generated from it (`utils/controls.js`). Facets: `structure`, `color`, `atmosphere`. `TREE_KEYS` are the keys that rebuild the tree.                                |
| Rig keys                    | `light*` / `post*` keys are declared with `rig: true`; their defaults must equal `lighting.js` / `post.js`.                                                                                               |

## The references

`WebGPU/HyperCubes/references/` holds both 0b5vr path tracers. They are
**not** path traced here (a decision, not an omission): the kernel ports
their structures exactly, and the look is raster.

- **Rect subdivision** (`rectSubdivCubes.glsl`): the per-point split loop,
  read as the tree it implies. `fs` is emulated in f32 steps; a shader's
  `sin` of a large argument is vendor-defined, so a seed matches Shadertoy
  in kind, not bit for bit. A cut clamped past a thin box's wall is pulled
  back inside it (the shader lets that box grow past its parent).
- **Octree glass** (`octreeGlassCubes.glsl`): `pcg3d` is integer arithmetic
  over float bits, so the tree is the reference's exactly. Cells are hashed
  at their centre in the unit domain, so a stretched domain keeps the tree.

Leaves carry four dice: fill, role, variation (palette stop, glass
frosting) and shape. `cellShape: mixed` reads only the shape die against
`sphereShare`, so switching to it changes shapes and nothing else; the rig
keeps one layer per shape. Roles take
consecutive slices of the role die in the order emissive, accent, dark,
light, glass, which makes both references plain weights.

## Morph and grow

Every internal node stores its cut as a fraction of its box. A side that
does not split a box **collapses** its cut onto the lower walls: the upper
octant fills the box and its descendants read as that side's leaf. So a
morph between any two trees (seeds, or rect ↔ octree) is one walk of the
union with every cut interpolated, and grow is the same walk with each cut
scaled by its depth's weight — grow 0 is one box. `hyper-cubes:check`
asserts a morph starts and ends on its trees and that grow 0 is one box.

Solids that change mesh (opaque ↔ glass) shrink out while the other grows
in; the same mesh blends its look. In the scene any `TREE_KEYS` edit morphs
in over `morphSeconds`; look edits snap.

## Look

- **Studio**: the references' emitter boxes, a two-colour sky and the floor
  are baked into a PMREM, so the cells reflect and are lit by the panels the
  path tracers used. The key light only adds a shadow.
- **Glass**: one transmission layer with dispersion and a per-cell frosting
  of up to `glassRoughness`, plus the octree's emissive core. Glass behind
  glass and emitters lighting neighbours are what the raster look gives up.
- **Post**: `mipBloom` (`@modules/tsl` `MipBloomNode`) is the rect
  reference's 13-tap/9-tap mip chain; `grade` is its present (tint,
  vignette on the encoded frame, letterbox). Tone mapping is off, as there.

## Outputs

- **Stills**: views `hero` (both references' bearing, 23° up), `front`,
  `right`, `back`, `left`, `top`; orthographic by default, fitted to the
  domain box.
- **Video**: `grow` (every cut slides in from the walls, then holds),
  `morph` (each structure holds, then morphs into the next and back to the
  first; the first structure's atmosphere is held for the clip) and
  `turntable`.
- **Plot SVG**: solid, glass and frame edges (sphere silhouettes) through the
  same camera, hidden lines dropped against the render's depth pass. One
  layer per role in that role's mean colour; frames use the frame colour.

## Definition of done

- `npm run hyper-cubes:check`
- `npm run lint:fix`
- `npm run hyper-cubes:generate -- --count 1 --svg`
- `npm run hyper-cubes:video -- --count 2 --pixelRatio 1 --hold 1`
- The scene still renders in the browser (human eyeball).
