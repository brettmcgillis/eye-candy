# NetworkTest pipeline

NetworkTest follows HyperCubes' arrangement (`docs/hyper-cubes-pipeline.md`):
one kernel, two renderers, and a dev tool that is a UI over one of them.
Change the kernel first, land every consumer in the same commit, and run
`npm run network-test:check`.

## The shape

```
@modules/networkTest        point generators, composition, wiring rules, growth order, drift,
                            pulses, instances, framing, plot SVG, roll, option schema
@modules/networkTestRender  instanced ribbon + sprite layers, createNetworkRig, camera/post
        │                              │
  WebGPU/NetworkTest scene      scripts/lib/networkTestRender.mjs
  (R3F, Leva generated,           ├─ network-test-generate.mjs   stills + plot SVG
   builds in a worker)            └─ network-test-video.mjs      grow / drift / pulse / turntable
                                        │
             src/dev/server/networkTest → src/dev/tools/networkTest (NetworkTestCLI)
```

| Piece                        | Rule                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@modules/networkTest`       | **Three-free.** May import only `@modules/flora` (`createRng`) and `@utils/paletteStops`. It runs in Node, in the scene's worker and on the main thread alike. `network-test:check` enforces it. |
| `@modules/networkTestRender` | The only home of the look. `createNetworkRig()` is the one object the scene and the CLI draw with: `apply(config)`, `setInstances(buildInstances(…))`, `setDepthRange(near, far)`.               |
| `renderOptions.mjs`          | Every knob, once; the scene's Leva is generated from it (`utils/controls.js`). Facets: `points`, `wiring`, `color`, `atmosphere`. `POINT_KEYS` move points; `WIRING_KEYS` only relink them.      |
| Rig keys                     | `post*` keys are declared with `rig: true`; their defaults must equal `post.js`.                                                                                                                 |

## Points: a composition, blended

A network is `shapeCount` placements. Each draws a family by weight
(`weightPrimitive`, `weightNoise`, `weightAttractor`, `weightCluster`) and a
kind (`*Kind`; `any` rolls one), fills a unit frame, and is scaled, turned
and set in the domain. Then one domain warp runs over every point
(`warpAmount`), which blurs which generator made what, and a Poisson thinning
(`minSpacing`) evens the density. Generators emit in order with a chain id,
so a curve, a trajectory or an arm can be followed by the chain rule.

- **primitive** — ring, sphere, torus, helix, knot, lissajous, lattice, phyllotaxis
- **noise** — blob (fbm threshold), filament (the fbm zero set), shell (displaced sphere)
- **attractor** — lorenz, aizawa, thomas, halvorsen (RK2, normalised), flow (curl-noise streamlines)
- **cluster** — gaussian clumps, hub (bent spokes), galaxy (log-spiral arms)

Solo a technique by zeroing the other family weights; pin a kind to see one
generator plainly. `network-test:check` solos every kind.

## Image source

`imageShare` of the budget is scattered over a source picture (`image.js`):
a plane facing +z, fitted inside the domain's x/y at the picture's aspect.
Luma is auto-levelled per frame (2nd–98th percentile), so a flat webcam
frame spans the full range. Density follows the mood so the picture is never
a negative: glow gathers on bright, ink on dark, and `imageInvert` flips
either. It blends toward Sobel edge strength by `imageEdges` and is raised to
`imageContrast`. `imageDepth` pushes bright points toward the camera;
`imageColor` tints nodes and links with the picture's own colour
(`network.rgb`). Candidates come from one fixed quasi-random sequence, each
kept when the density beats its own die, so consecutive frames keep nearly
the same points — but not the same indices, so a rebuild calls
`pulses.retarget(previous, next)` to move each signal to the nearest new
point and onto a real edge. A source with `imageShare` 0 is drawn alone
(share 1) by every consumer.

- **Scene**: `sourceImage` (a path under `public/`), an upload, or the webcam
  (`webcam`, `webcamFacing`, `webcamRate`); each new frame rebuilds in the
  worker.
- **CLI**: `--sourceImage path`, decoded by `scripts/lib/sourceImage.mjs`
  (shared with Subdivision).
- **Darkroom**: `techniques/networkTest/technique.js`, image-only presets,
  `flat` is the straight-on view.

## Wiring: rules as keep-weights

Each rule proposes its own edge set and its weight is the share of those
edges kept (a stable die per edge), so weights blend rules and zeroing all
but one solos it. Candidates are the 16 nearest neighbours from a k-d tree.

| Rule      | Edges                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------- |
| `chain`   | consecutive points of one generator path, under 8× the typical spacing                         |
| `mst`     | Kruskal over the candidates (a forest where the candidate graph is disconnected)               |
| `rng`     | relative neighbourhood: no third point nearer to both ends (tested over both ends' candidates) |
| `gabriel` | no third point inside the sphere on the edge                                                   |
| `knn`     | each point to its `knnK` nearest                                                               |
| `band`    | the original NetworkTest: pairs in `[bandMin, bandMax]`, filled to min then max links          |
| `bridge`  | placement to placement, along a spanning tree of their centroids first, optionally arced       |

`maxDegree` caps every rule but bridges. Rules apply in the order above, so
an earlier rule wins the degree budget.

## Motion

- **Grow**: arrival time per point is a multi-source Dijkstra along edge
  length, one root per connected piece (its point nearest the centroid),
  normalised to `[0, 1]`. An edge draws from its earlier end. `growAt` loops
  grow → hold → grow back into the roots → rest (no fade); the scene reseeds
  during the rest. Points drift (`driftAmount`, no rewiring) and signals
  walk throughout, but only on edges grown that far.
- **Drift**: points wander a time-scrolled noise field around home; every
  `rewireSeconds` the wiring is rebuilt on the moved points and
  `createEdgeFades` fades links in and out over `fadeSeconds`. The scene
  rewires in its worker; the CLI uses `createDriftClock` synchronously.
- **Pulses**: stateful walkers, stepped on a fixed clock so a clip is
  reproducible. At a node a pulse takes the straightest way on (plus a
  little wander), so it flows along paths in a dense net instead of
  jittering. Stills freeze them at
  `stillTime`.

## Look

`mood: glow` is additive light into a mip bloom on a dark ground; `mood: ink`
is normal blending on paper with bloom off. Each placement takes a palette
stop; edges blend their ends' colours toward `edgeColor` by `edgeTint`;
bridges take `bridgeColor`. Lines and sprites narrower than a pixel are drawn
a pixel wide and fainter rather than shimmering. `depthFade` fades the far
side of the network across the range the rig is given.

## Outputs

- **Stills**: views `hero`, `front`, `right`, `back`, `left`, `top`, fitted to
  the points' silhouette (perspective by default).
- **Video**: `grow` (the scene's full cycle, `hold` seconds grown), `drift`,
  `pulse` (settled network carrying signals),
  `turntable`; `orbit` drifts the camera round a non-turntable clip.
- **Plot SVG**: no GPU. Every link through the same camera, clipped to the
  frame and chained end to end into strokes; one Inkscape layer per class
  (edge, bridge, node) and depth band (`svgDepthPens`), in the layer's mean
  colour. Wires do not hide each other, so there is no hidden-line pass;
  links fainter than `svgMinAlpha` (after length and depth fade) are dropped.

## Definition of done

- `npm run network-test:check`
- `npm run lint:fix`
- `npm run network-test:generate -- --count 1 --svg`
- `npm run network-test:video -- --count 1 --pixelRatio 1 --hold 2`
- The scene still renders in the browser (human eyeball).
