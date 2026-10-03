# IsoLinesRelief pipeline

IsoLinesRelief is the relief half of the IsoLines pair: the same field and
contours (`docs/iso-lines-pipeline.md`, read it first) built as real,
lit, shadowed geometry — the depth the reference Shadertoys only fake.
Change the shared kernel first, land both pipelines in the same commit, and
run `npm run iso-lines:check` and `npm run iso-lines-relief:check`.

## The shape

```
@modules/isoLines              the shared kernel (field, grid, contours, segments, trail builder)
@modules/isoLinesRelief        the relief schema, roller, segmentMode, bounds, 3d framing,
                               the build / rise cycle
@modules/isoLinesReliefRender  createReliefRig: layer planes, walls, skirts, contour boxes,
                               lights (over isoLinesRender's createShading)
        │                              │                                       │
  WebGPU/IsoLinesRelief scene   scripts/lib/isoLinesReliefRender.mjs   darkroom/techniques/isoLinesRelief
  (R3F, CameraRig, Leva           ├─ iso-lines-relief-generate.mjs   stills per view + plan SVG
   generated, worker)             └─ iso-lines-relief-video.mjs      flow / build / rise / turntable
                                        │
          src/dev/server/isoLinesRelief → src/dev/tools/isoLinesRelief (IsoLinesReliefCLI)
```

| Piece                           | Rule                                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/isoLinesRelief`       | **Three-free.** May import only `@modules/isoLines` (its barrel) and, from `renderOptions.mjs`, `../isoLines/optionSpecs.mjs`.                       |
| `@modules/isoLinesReliefRender` | The only home of the relief look. `createReliefRig()`: `apply(config)`, `setBuild(build)`, `setMotion`, `setTime`, `setPixelRatio`.                  |
| `renderOptions.mjs`             | IsoLines' field, image, contour and colour specs plus `form`, the cycle and the cameras. Facets: `field`, `contours`, `color`, `form`, `atmosphere`. |
| Builds                          | Every consumer asks the kernel for `segmentMode(config)`'s geometry: `walls`, `lines`, `trail` or none.                                              |

## Look

The piece lies on the ground (map up is world -z, height world +y); a frame
height is 2 world units and `relief`, `lineHeight` and `lineThickness` are in
frame heights.

- **terraced**: one plane per level, instanced, each at its level's height
  and shown where the field reaches it, so from above each band is the top of
  its own layer. `wallMode: solid` adds a wall along every contour (one band
  step, facing downhill) and skirts round the domain; `floating` leaves bare
  stacked planes. Layer edges are coverage antialiased (alpha to coverage)
  and outlined (`outlineWidth`, px).
- **smooth**: the terraces with the steps smoothed away — one sheet at grid
  resolution, displaced by the field, normals from its neighbouring samples,
  banded and outlined like the terraces, with the same skirts. Its height is
  band k's floor plus the band's own rise eased by `x^p`, `p = 1 / (1 −
terraceSharpness)`: 0 is the field itself, and toward 1 each band flattens
  and its rise steepens into the next level, so it walks from smooth hills
  to soft terraces whose risers sit on the contours. No segment geometry.
- **lines**: every contour as a mitred box. `lineExtrude: height` stands
  each at its level; `time` is Isolines 1's trail made literal: the present
  on top and the contours of each past `trailSeconds` tick stacked beneath it
  over `trailSlices`, fading toward the background. A slice is traced once at
  its own tick and handed over once; the rig ages it on the GPU from
  `setTime`, so a live webcam's trail is the history of what it saw.
- One shadowed key light (`lightAzimuth`, `lightElevation`) and a hemisphere
  fill; a ground plane takes the shadows.

## Motion

- **flow**: the field's time moves.
- **build**: heights are capped at a cutoff that rises 0 → 1, holds and
  falls back, so terraces stack up level by level.
- **rise**: flat and unlit to full relief and back (relief and lighting
  scale together; at 0 the colour is all emissive).
- **turntable** (video): orbit a still field. `orbit` drifts the camera round
  the other clips.

## Outputs

- **Stills**: one per `views` (`top`, `hero`, `front`, `side`, `low`),
  fitted to the piece's bounding box.
- **Video**: `flow`, `build`, `rise`, `turntable`.
- **Plot SVG** (`plan.svg`): the contours in plan, as IsoLines draws them — a
  plotter draws a map, not a perspective.
- **Darkroom**: `techniques/isoLinesRelief`.

## Definition of done

- `npm run iso-lines-relief:check`
- `npm run lint:fix`
- `npm run iso-lines-relief:generate -- --count 1 --svg`
- `npm run iso-lines-relief:video -- --count 1 --pixelRatio 1 --hold 2`
- The scene still renders in the browser (human eyeball).
