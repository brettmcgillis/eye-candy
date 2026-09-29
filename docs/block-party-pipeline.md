# Block Party pipeline

Block Party follows Fungi's arrangement (`docs/fungi-pipeline.md`): one
kernel, two renderers, and a dev tool that is a UI over one of them. Change
the kernel first, land every consumer in the same commit, and run
`npm run block-party:check`.

## The shape

```
@modules/blockParty        quadtree city, roles, layers (boxes), rebuild state machine,
                           palette roles/tones, roll, plot SVG, option schema
@modules/blockPartyRender  materials, reveal, ground/pedestal, createCityRig, uniforms,
                           palette LUT, camera/lighting/post declarations
        │                              │
  WebGPU/BlockParty scene       scripts/lib/blockPartyRender.mjs
  (R3F, Leva generated)           ├─ block-party-generate.mjs   stills + plot SVG
                                  └─ block-party-video.mjs      build / rebuild / turntable
                                        │
             src/dev/server/blockParty → src/dev/tools/blockParty (BlockPartyCLI)
```

| Piece                       | Rule                                                                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/blockParty`       | **Three-free.** May import only `@modules/flora` (`createRng`) and `@utils/paletteStops`. Layers are boxes `[x, anchorY, z, w, h, d]`, never matrices. `block-party:check` enforces it.       |
| `@modules/blockPartyRender` | The only home of the look. `createCityRig({ uniforms })` is the one object the scene and the CLI draw with.                                                                                   |
| `renderOptions.mjs`         | Every knob, once. `section` is the Leva top folder and `group` the folder inside it — the scene's controls are **generated** (`utils/controls.js`). Facets: `composition`, `form`, `palette`. |
| Rig keys                    | `light*` / `post*` keys are declared with `rig: true` so presets and renders carry them; the lighting and post rigs build their own Leva. Their defaults must equal `lighting.js`/`post.js`.  |

## The city

The Lehmer stream is the composition: the order of `random()` calls in
`quadTree` → `dressing` is load-bearing, so reordering them changes every city
at the same seed. The city seed (`seed`) belongs to the **composition** facet,
so holding composition holds the city itself. Batches are named by a separate
`batch` seed (`batch`, `batch-1`…) that also seeds the facet rolls.

`COMPOSITION_KEYS` rebuild the model; `FORM_KEYS` only re-lay instances;
surface, motion and palette values are uniforms.

## Palette

`palette: None` keeps the authored surface colours, pixel for pixel. A named
gradients.json palette does two things:

- **Roles** (`paletteRoles`): the lightest stop is the paper, the darkest the
  ink, the most saturated stops the accents. Each surface colour moves
  `paletteSurfaces` of the way from its authored value to its role.
- **Cells**: each instance carries a `tone` from `colorBy` (district, radial,
  size, random, x, y, role). `colorTarget` picks what takes it (towers, cards,
  accents = neon + glow rings, all, none), blended by `cellStrength`.

`paletteCoordinate` (repeat, shift, mirrored fold, reverse) has a GPU twin in
`blockPartyRender/nodes.js`; change both together, or the SVG picks a
different pen than the render shows. The LUT is one 256-texel nearest texture
rewritten in place, so a palette swap never rebuilds a material.

## Motion

Idle motion reads `uniforms.time`, not TSL `time`, so a headless frame is
deterministic. The rolling rebuild is `createRebuildState` + `stepRebuild` on
the build clock; the scene steps it in `useFrame`, the video CLI per frame,
and `random` rebuild order draws from a seeded stream.

## Outputs

- **Stills**: views `front`, `right`, `back`, `left` (isometric at the sketch's
  asin 0.62 elevation) and `plan`. The orthographic camera fits the
  **unzoomed** pedestal, so the seed crop enlarges the city inside the frame
  just as it does in the scene. Tone mapping is off and the scene's post chain
  runs through `createPostChain` from `@modules/postRig`.
- **Video**: `build` (clock from 0, then `hold`), `rebuild` (a settled city
  rebuilding for `hold` seconds), `turntable` (`turns` per `hold`). A moving
  camera fits the cylinder round the pedestal so the zoom never breathes.
- **Plot SVG**: the settled city's edges through the same camera, hidden lines
  dropped against the render's depth buffer (orthographic depth is already
  linear — PassNode's viewZ assumes perspective, so it is not used). Towers are
  ghosts: all their edges plot, plus a ring each time the sketch's per-stroke
  alpha accumulates to one stroke. Pits plot their strata. One Inkscape layer
  per colour, no background rect, clipped to the frame.

## Definition of done

- `npm run block-party:check`
- `npm run lint:fix`
- `npm run block-party:generate -- --count 1 --svg`
- `npm run block-party:video -- --count 1 --pixelRatio 1 --hold 2`
- The scene still renders in the browser (human eyeball).
