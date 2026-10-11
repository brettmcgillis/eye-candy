# SubdivisionRelief pipeline

SubdivisionRelief is the relief half of the Subdivision pair: the same tree
(`docs/subdivision-pipeline.md`, read it first) with every cell raised into a
lit, shadowed prism. Change the shared kernel first, land both pipelines in
the same commit, and run `npm run subdivision:check` and
`npm run subdivision-relief:check`.

## The shape

```
@modules/subdivision               the shared kernel (tree, fields, shade, grow, plot SVG)
@modules/subdivisionRelief         the relief schema, roller, heights, cell placement,
                                   framing, the grow clock and motion
@modules/subdivisionReliefRender   createReliefRig: instanced prisms, the plate, the
                                   cell material; the scene's camera and lighting
        │                              │                                    │
  WebGPU/SubdivisionRelief scene   scripts/lib/subdivisionReliefRender.mjs   darkroom/techniques/relief
  (R3F, CameraRig, LightingRig,      ├─ subdivision-relief-generate.mjs   stills per view + plan SVG
   Leva generated)                   └─ subdivision-relief-video.mjs      growth / motion / sway
                                        │
     src/dev/server/subdivisionRelief → src/dev/tools/subdivisionRelief (SubdivisionReliefCLI)
```

| Piece                              | Rule                                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/subdivisionRelief`       | **Three-free.** May import only `@modules/subdivision` (its barrel) and, from `renderOptions.mjs`, `../subdivision/renderOptions.mjs`.                                                                              |
| `@modules/subdivisionReliefRender` | The only home of the relief look. `createReliefRig()`: `apply(config)`, `setPiece(piece)`, `setGrow(levels)`, `setMotion({ mix, noisePhase, wavePhase })`.                                                          |
| `renderOptions.mjs`                | Subdivision's options as they are (`subdivision-relief:check` holds ranges and defaults equal), minus the outline band, plus `relief`, `motion` and the cameras. Facets: `structure`, `field`, `palette`, `relief`. |
| Pieces                             | Every consumer builds one with `buildReliefPiece(config, { canvas, image, stops })`: Subdivision's `buildPiece` over the flat defaults for the keys the relief drops, plus `maxDepth`.                              |
| Presets                            | The scene's presets are Subdivision's, piece for piece, each with a relief; SubdivisionReliefCLI appends saved generations to the same `PRESETS`.                                                                   |

## Look

The panel lies in the xy plane with heights along +z; a canvas px is 0.01
world units (`WORLD_SCALE`), so the canvas is the layout as in Subdivision.

- Every placed node is an instance: a unit cube (quad, rect) or triangular
  prism (tri) scaled into place. Quads are clamped to the canvas; a tri is
  kept whole when its centroid is on it.
- **Heights** (`computeHeights`): depth jitter, luminance, the field and
  focal nearness, averaged by weight, so `reliefHeight` stays the ceiling
  over `baseHeight`. A hole sinks into a pit.
- **Growth** is Subdivision's split rule with height: children start as
  their parent's prism, at its height and in its colour, then over one level
  their gaps open, their colours move to their own and their tops rise or
  sink to their own height. `growStyle: slide` grows a cell out of its
  parent's sweeping cut.
- **Motion**: noise and a travelling wave offset the heights, finer cells
  more (`motionDepth`). The scene accumulates phases and eases `animate`;
  the CLIs read `motionAt(config, seconds)` on a fixed clock.
- One shadowed key, a fill and a hemisphere sky (`SUBDIVISION_RELIEF_LIGHTING`),
  shared by the scene's LightingRig, the CLIs and Darkroom.

## Outputs

- **Stills**: one per `views` (`front`, `hero`, `left`, `right`, `high`,
  `low`), each fitted to the piece's actual cells and heights.
- **Video**: `growth` (split, hold, recombine — the scene's loop), `motion`
  (the grown piece in noise and wave motion), `sway` (the camera swings
  ±`orbit` degrees, `turns` times). A moving camera is fitted once across its
  whole swing, so the zoom holds.
- **Plot SVG** (`plan.svg`): Subdivision's plot of the same piece — a
  plotter draws the plan, not a perspective.
- **Darkroom**: `techniques/relief`.
- Source images share Subdivision's upload pool
  (`public/images/subdivision-sources/`, `sourceImageRoutes` in
  `src/dev/server/renderJobs/sourceImages.js`).

## Definition of done

- `npm run subdivision-relief:check`
- `npm run lint:fix`
- `npm run subdivision-relief:generate -- --count 1 --svg`
- `npm run subdivision-relief:video -- --count 1 --pixelRatio 1`
- The scene still renders in the browser (human eyeball).
