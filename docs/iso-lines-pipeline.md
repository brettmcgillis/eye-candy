# IsoLines pipeline

IsoLines is the flat half of a pair: the field drawn as a contour map, with
no fake depth. Its relief twin, IsoLinesRelief
(`docs/iso-lines-relief-pipeline.md`), builds the same field into real
geometry over the same kernel — as Subdivision and SubdivisionRelief share
theirs. Change the kernel first, land every consumer of both in the same
commit, and run `npm run iso-lines:check` and `npm run iso-lines-relief:check`.

## The shape

```
@modules/isoLines        the shared kernel: field drivers, grid, contours, segments, trail,
                         colour mirror, plan SVG, roller — plus the flat schema
                         (renderOptions.mjs) and the specs both schemas share (optionSpecs.mjs)
@modules/isoLinesRender  createIsoRig (the flat plane) and createShading (the field + colour
                         uniforms and textures, shared with the relief rig)
        │                              │                                  │
  WebGPU/IsoLines scene      scripts/lib/isoLinesRender.mjs        darkroom/techniques/isoLines
  (R3F, Leva generated,        ├─ iso-lines-generate.mjs   flat stills + plan SVG
   builds in a worker)         └─ iso-lines-video.mjs      the field flowing
                                        │
             src/dev/server/isoLines → src/dev/tools/isoLines (IsoLinesCLI)
```

| Piece                     | Rule                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/isoLines`       | **Three-free.** May import only `@modules/flora` (`createRng`), `@utils/noise2d` and `@utils/paletteStops`. It runs in Node, in both scenes' workers and in Darkroom.                       |
| `optionSpecs.mjs`         | The field, image, contour, colour, post and output specs both schemas take, and `createIsoSchema`. IsoLinesRelief's schema imports it by relative path — the one way in besides the barrel. |
| `@modules/isoLinesRender` | The only home of the flat look. `createIsoRig()`: `apply(config)`, `setBuild(build)`, `setPixelRatio`.                                                                                      |
| `renderOptions.mjs`       | Every flat knob, once; the scene's Leva is generated from it. Facets: `field`, `contours`, `color`, `atmosphere`.                                                                           |
| Rig keys                  | `post*` keys are declared with `rig: true`; their defaults must equal `post.js`.                                                                                                            |

## The references

Two Shadertoys started it — Isolines 1 (MdfcRS) and Isolines 2, its
analytic-derivative rewrite. Both fake depth in 2D: Isolines 2 quantises the
noise into 20 bands and darkens each band with an offset shadow sample;
Isolines 1 draws isolines into a feedback buffer that fades and drifts, so
old lines smear into what reads as extruded walls. IsoLines keeps their
field and line math and drops the illusions; IsoLinesRelief makes the depth
real.

- `referenceNoise` is the reference's `noise3` (IQ trilinear value noise,
  its `sin` hash and its `4375.5453`) averaged with a copy 11.5 cells off.
  `fieldSeed` 0 and `noiseScale` 8 / `noiseSpeed` 0.1 are the reference.
- `terraced` is Isolines 2's band colour (`floor(n·L)/L` through
  `.5 + .5·cos(12n + (0, 2.1, -2.1))`) and its `tanh` band edge, with no
  shadow. `lines` is Isolines 1's `smoothstep(1, 0, .5·|v| / fwidth(v))`
  isoline, with no trail; its colour is the cosine a quarter turn on
  (`cosinePhase` 4.7124 is the reference's `sin`).

## Field: drivers, blended

`createField` averages four drivers by weight; a weight of 1 with the rest at
0 solos one. One domain warp runs over all of them, then `fieldContrast`
stretches the result about 0.5 and it is clamped to 0..1.

- **noise**: `referenceNoise`, flowing along z with time.
- **shape**: Subdivision's procedural fields (fbm, ridged, rings, stripes,
  blobs, radial), each with a slow motion of its own.
- **image**: the source's luma (over white), auto-levelled between its 2nd
  and 98th percentiles and box-blurred (`imageBlur`), covering the frame.
  Bright is high ground; `imageInvert` flips it. A source with weight 0 is
  drawn alone by every consumer.
- **focal**: gaussian peaks round wandering points (SubdivisionRelief's focal
  driver).

The field is sampled on a vertex grid, `resolution` rows by
`resolution · aspect` columns, at one moment. The grid is the one truth: the
rigs read it as a float texture with a manual bilinear (`textureLoad` ×4),
exactly the surface the CPU contours assume. `referencePlane(z)` caches the z
mix of each lattice corner, so a grid costs about 2 ms. Texture nodes are
copied when sampled, so `createShading` registers each one and swaps its
`value` when the grid changes size.

## Contours

Level k sits at `(k + levelOffset) / levels`; band k is the field between
level k and k + 1. `traceContours` is marching squares over every crossed
level at once: each cell is walked counter-clockwise, every exit from
`f ≥ level` is joined to an entry, so a segment always has the higher ground
on its left, saddles follow the cell's centre (the bilinear surface), and a
crossing on a shared edge ends one cell's segment and starts its
neighbour's. Segments chain into polylines that are closed or end on the
domain's edge — `iso-lines:check` asserts all three. The flat look never
needs them; the plan SVG and the relief do (`createIsoBuilder().build(config,
{ mode, withLines })`).

## Look and motion

One plane, orthographic, edge to edge (the field takes the frame's aspect),
unlit. Colours: `cosine` (the reference), a gradients.json `palette`, or a
`ramp`; `imageColor` pulls toward the source's own colour. Line widths are
output px (`setPixelRatio` scales them to the render). A field clamped flat
sits exactly on a level, so lines are only drawn where the field has a
gradient. The scene's only motion is `flow` (the drivers' speeds, scaled by
`timeScale`); its worker builds one field at a time and newer requests
coalesce into the next build.

## Outputs

- **Stills**: `flat.png` / `.webp`.
- **Video**: the field flowing for `hold` seconds.
- **Plot SVG** (`plan.svg`): the contours chained, one Inkscape layer per
  pen; levels share `svgPens` low to high, each in its levels' mean colour.
  No background rect.
- **Darkroom**: `techniques/isoLines` — the picture as the field (generators
  can be mixed back in).

## Definition of done

- `npm run iso-lines:check`
- `npm run lint:fix`
- `npm run iso-lines:generate -- --count 1 --svg`
- `npm run iso-lines:video -- --count 1 --pixelRatio 1 --hold 2`
- The scene still renders in the browser (human eyeball).
