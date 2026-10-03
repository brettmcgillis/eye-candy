# Apollian pipeline

Apollian follows HyperCubes' arrangement (`docs/hyper-cubes-pipeline.md`):
one kernel, two renderers, and a dev tool that is a UI over one of them.
Change the kernel first, land every consumer in the same commit, and run
`npm run apollian:check`.

## The shape

```
@modules/apollian         four fields (CPU mirrors), the exact Soddy packing, bounds,
                          slice frame + sampling + contours, hatch, stack occlusion,
                          palette coordinate, motion, roll, framing, plot SVG, option schema
@modules/apollianRender   TSL twins of the fields, the full-screen stage march (object,
                          plinth, floor), four surfaces, the 2D slice view, createApollianRig
        │                              │
  WebGPU/Apollian scene         scripts/lib/apollianRender.mjs
  (R3F, Leva generated)           ├─ apollian-generate.mjs   stills per view + slice.svg
                                  └─ apollian-video.mjs      turntable / sweep / evolve / morph
                                        │
             src/dev/server/apollian → src/dev/tools/apollian (ApollianCLI)
```

| Piece                     | Rule                                                                                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/apollian`       | **Three-free.** May import only `@modules/flora` (`createRng`), `@modules/isoLines` (`traceContours`) and `@utils/paletteStops`. `apollian:check` enforces it.                                        |
| `@modules/apollianRender` | The only home of the look. `createApollianRig()` is the one object the scene and the CLI draw with: `apply(config, { stops, view, width, height })`. It reuses `@modules/apollonian`'s march helpers. |
| `renderOptions.mjs`       | Every knob, once; the scene's Leva is generated from it (`utils/controls.js`). Facets: `form`, `slice`, `look`, `stage`. `svg` keys are still-only and not scene keys.                                |
| Rig keys                  | `post*` keys are declared with `rig: true`; their defaults must equal `post.js`.                                                                                                                      |

## The references

`WebGPU/Apollian/references/` holds the originals verbatim: `slice4d.glsl`
and `twist.glsl` (mrange, CC0), `disc.glsl` (no author or licence given) and
`kleinian.glsl` (Sébastien Durand, **CC BY-NC-SA 3.0** — the scene todo
tracks the decision on keeping it).

## Families

The solid is `field − thickness < 0`, intersected with the bound and, when
on, the section cut. Each field is ported line for line on both sides:

- **`apollian4`**: mrange's 4D fract-fold inversion, lifted to `w` and turned
  in the xw/yw/zw planes. `sheets` is the twist shader's `|p.y|/scale` (gasket
  curves in a slice) with its radial `w` bend; `tubes` is the 4D slicer's
  distance to two 2-planes (curves in 3D, specks in a slice).
- **`disc`**: reference 3's homogeneous mod fold. Its `y = 0` plane is itself
  a sheet, so a slice exactly there is solid — slices sit off it.
- **`kleinian`**: knighty's box fold + inversion with Durand's 16 keyframes
  of `mins`/`maxs`; `kleinKey` walks them. Its `z = 0` is a mirror sheet too.
- **`classic`**: the exact Apollonian sphere packing of the unit ball, built
  by Descartes reflection (`k' = Σ k_j − k_i`, linear in curvature × centre).
  The 3D Apollonian group has relations, so quintuples are deduplicated as
  sets. A ball-preserving inversion warps it. The GPU marches it through a
  16³ grid in storage buffers: every sphere within one cell of a cell is on
  its list, so `min(listed, margin)` is a true lower bound.

The thin fields (`apollian4`, `disc`) are unsigned; their slices draw best as
`bands` on the `outside`. The signed ones (`kleinian`, `classic`) take
`inside` bands.

## Colour

One palette from gradients.json colours the object, the slice view and the
plot pens. The colour source is a weighted blend of orbit trap, fold depth,
radius and height; `paletteCoordinate` (repeat, shift, mirrored fold,
reverse) has a GPU twin in `apollianRender/palette.js` — change both
together. `stagePalette` pulls the backdrop, plinth and floor toward the
palette's darkest stops.

## Look

- **Stage**: one full-screen march over the object (in its own rotated,
  scaled frame), an SDF plinth and an analytic floor, bounded by the stage
  sphere. Lighting is analytic — a sky gradient, the key as a lobe that widens
  with roughness, marched soft shadows and SDF AO — so a headless frame is
  the scene's frame. The lit result is ACES-fitted in the shader; the
  backdrop is not, and the renderer runs with no tone mapping.
- **Floor** is a shadow catcher: unshadowed it is the backdrop itself, and
  only the soft shadow and contact AO darken it toward `floorColor`, fading
  out a few plinth-widths away. The stage has its own soft shadow because
  `@modules/apollonian`'s darkens any ray that runs past `maxDist` (right for
  Explorer's lantern, black for a studio).
- **Rolls** reject a form whose solid fills under 1% of its bound, re-aim a
  slice plane until it covers 4–92% of the frame, drop a section cut that
  empties the object, and never give the paper-thin families glass. Stage
  rolls keep the plinth and sky light whatever the backdrop.
- **Surfaces** compile per family × surface (`matte`, `glass`, `iridescent`,
  `metal`). Glass marches the interior along the refracted ray; iridescent is
  reference 3's folded-reflection bands with its cosine palette swapped for
  the gradient.
- **Slice view**: the twist shader from above — two lights drop the slice's
  shadow onto paper below, the solid glows — plus band lines or a stack of
  planes, front plane winning.
- Every field `Fn` has a `setLayout`, which makes it a WGSL function. Without
  one TSL inlines the fold loop at every call site (march, four normal taps,
  AO, shadow, info) and Metal's compiler gives up.

## Outputs

- **Stills**: views `hero`, `front`, `side`, `top` (perspective by default,
  fitted to the object and plinth) and `slice`.
- **Plot SVG** (`slice.svg`, one per object): the slice traced by marching
  squares over the CPU field. `outline` is one ink; `pens` splits contours
  into Inkscape layers by colour (section), band or stack plane; `hatch`
  fills the solid (or each band ring) one angle per pen. A stack is drawn as
  displaced planes with hidden lines dropped against nearer planes' grids.
  Packing slices keep exact `<circle>`s wherever nothing hides them.
- **Video**: `turntable` (camera orbits; in the slice view the plane turns),
  `sweep` (the plane travels; the object view cuts at it), `evolve` (each
  family's own motion: 4D rotation, disc drift, kleinian keyframes, packing
  spin) and `morph` (objects of one family blend, the first one's stage held).

## Definition of done

- `npm run apollian:check` — includes a CPU/GPU parity test: the rig's slice
  view drawn white-on-black must match the CPU field's sign on ≥ 97% of
  decided pixels for every family (it measures 100%).
- `npm run lint:fix`
- `npm run apollian:generate -- --count 2 --svg`
- `npm run apollian:video -- --count 1 --pixelRatio 1 --hold 2`
- The scene still renders in the browser (human eyeball).
