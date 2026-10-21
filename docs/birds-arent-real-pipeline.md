# BirdsArentReal pipeline

BirdsArentRealCLI renders and plots flocks of FakeBirds — the
BirdsArentReal pigeon with its security-camera head — from rolled
generations, and its Live tab captures a running flock you have posed by
hand. It is the GhostBuster arrangement (`docs/ghost-buster-pipeline.md`):
the stage is the **real R3F component tree**, mounted on the headless
renderer by the CLI and in a `<Canvas>` by the Live tab, and the bird is
the very component the scene draws. Run `npm run birds-arent-real:check`
after changing any piece below.

## The shape

```
@elements/FakeBird            FakeBird, CameraHead, CursorTracker, birds.js (species)
        │                       (BirdsArentReal, PrintShop's pigeon and this tool all read it)
@modules/birdsArentReal       three-free: option schema, roll, flock layout, framing, mesh plot
@modules/birdsArentRealRender BirdStudio (R3F stage), readFlockMesh, createStageRoot
        │   over @modules/renderStage (studio, ShadowFloor, root, depth) and @modules/plotKit
        │                                   │
  scripts/lib/birdsArentRealRender.mjs   src/dev/tools/birdsArentReal
    ├─ birds-arent-real-generate.mjs       BirdsArentRealWorkbenchPage (RollWorkbench)
    │    stills + plot, or --capture        └─ LiveFlock (Live tab)
    └─ birds-arent-real-video.mjs                  │ POST /dev-api/birdsArentReal/captures
         idle / turntable                src/dev/server/birdsArentReal → generate --capture
```

| Piece                           | Rule                                                                                                                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@elements/FakeBird`            | The one bird. **Add a species to `birds.js`** (its GLB, head bone, clips, aim joints and `cam` defaults) and the scene's Bird Type, the workbench's species choice and the roll all have it. No drei: see Headless R3F. |
| `@modules/birdsArentReal`       | **Three-free.** May import only `@modules/flora` (`createRng`) and `@modules/plotKit`. The check enforces it.                                                                                                           |
| `@modules/birdsArentRealRender` | The only home of the stage. `BirdStudio` is GhostBuster's Lightformer studio, ambient fill, a shadow-casting key light, the shadow-catching floor, the flock and bloom.                                                 |
| `renderOptions.mjs`             | Every knob, once. Facets: `location`, `flock`, `bird`, `pose`, `camera`; `post` (bloom) and the light levels are not rolled. The species is a `string` option the page and CLI validate against `birds.js`.             |

## The flock

`layoutFlock(config)` places `birdCount` birds and is a pure function of
the config — `flockSeed` seeds the scatter, the headings and each bird's
`phase` (its clip offset and lens-sweep offset) — so a preset or sidecar
reproduces its flock exactly.

- **cluster** scatters birds over a disc with at least `spacing` between
  them; **line** stands them in a row along X, as on a ledge; **ring** puts
  them round an empty middle. `scatter` jitters line and ring places.
- **facing**: `forward` faces +Z (an azimuth-0 camera), `random` any way,
  `inward`/`outward` toward or away from the flock's middle;
  `headingJitter` turns each bird off it. The roll pairs facings with
  arrangements (rings face in or out, lines mostly forward).
- **gaze**: `sweep` pans each lens by `sweepRange` at `sweepSpeed`; `ahead`
  holds the lens on the head; `camera` makes every lens stare at the camera
  (FakeBird's cursor-follow aim, fed the camera position ahead of the birds'
  own frame callbacks). The CLI aims the camera at the hero view before the
  settle, so the stare is in place when the still is taken; other views
  keep the hero stare (a still steps with zero delta, and the head aim is
  damped), and in a turntable the heads follow the camera round.

`BIRD_BOX` is the box one posed bird fills in its own frame, measured over
the whole look-around clip with the largest camera head the roll gives.
`flockBounds` turns every bird's box into world corners: `framePoints`
fits the camera to them (a flat, wide flock in a sphere fit would be
letterboxed) and the key light's shadow camera covers their sphere. The
check re-measures a posed bird and fails when it leaves the box.

## Headless R3F

Everything in `docs/ghost-buster-pipeline.md` § Headless R3F applies. On
top of it, a GLB:

- **No drei.** FakeBird and CameraHead load through `@hooks/useDracoGltf` —
  R3F's `useLoader(GLTFLoader)` with drei's Draco decoder path — and
  animate through their own `AnimationMixer` (updated ahead of the head
  aim, as `useAnimations` was). `SkeletonUtils` comes from three's addons.
- **The GLTF shim** (`scripts/lib/r3fHeadless.mjs`, `installGltfLoader`)
  reads the GLB from `public/` with gltf-transform, decodes Draco, re-encodes
  WebP textures as PNG (GLTFLoader's WebP check needs an `<img>`), drops
  those two extensions and parses the result. Embedded images arrive at the
  texture shim as `blob:` URLs and are decoded unflipped, as glTF textures
  are.
- A stage is mounted when every bird has its three meshes (body, camera
  body, lens); the LED is marked `userData.plot = false`.

## The plot

`readFlockMesh` reads the posed flock back on the CPU — each skinned
vertex through `SkinnedMesh.getVertexPosition` (the GPU's skinning), the
camera head through its world matrix — with the rest positions beside it.
`weldMesh` joins vertices that share a rest position, so UV and normal
seams read as one surface. From there (`renderFlockSvg`):

- **sections** (`svgStyle`, pen-0): level cuts through each bird in its own
  frame — `slices` across its height, `sections` across its length, `grid`
  both — `svgLines` per bird, on the faces toward the camera.
- **contours** (`svgContours`, pen-3): edges between a face toward the eye
  and one away — wing over body, head over neck.
- **creases** (`svgEdges`, pen-5): edges bent past `svgCreaseAngle` with a
  visible face, plus open boundaries — the camera body, lens rim, beak.
- the image layers from `@modules/plotKit`, read from the render and the
  birds-only depth pass: silhouette (pen-1), shading (pen-2: crosshatch …
  tsp), an Outline-style halo (pen-4) and texture contours (pen-6).

For colour plots the sections take the render's inks: `svgColors` (0 off)
picks that many colours from the birds' own pixels (`@modules/plotKit`'s
`imagePalette`: k-means in CIELAB, farthest-first seeds, so small vivid
areas — feet, neck, LED — get an ink of their own at 6 or more) and
`colorRuns` splits every section where the ink under it changes, a layer
each (`sections N`, pens 10+) in that colour; the outline layers stay
black. `svgWiggle` (mm) swings the sections across themselves by tone
(`wiggleRuns`, never tighter than four nibs of `svgPenMm`), so the lines
carry the shading. Render with 6–8 inks and let the Plotterizer's **Fit to
N pens** choose the pens.

3D strokes are chained by their mesh keys, sampled every 1.5 px, cut by
the depth probe (`svgOcclusion`) and, for contours and creases, where they
lie on the silhouette the outline layer already draws. The depth pass draws
the flock only, so the shadow floor neither hides lines nor joins the
silhouette.

## The Live tab

`LiveFlock` mounts `BirdStudio` with the form's generation: Space pauses,
F frames the flock, **Use this camera** writes the orbit back as camera
keys, the gaze buttons (`1`–`3`) and the sweep / key-light sliders write the
form's options live, and **Stare at cursor** (`T`) turns every lens toward
the pointer (the scene's Cursor Follow). Capture renders the frozen frame
at the form's size into an offscreen target and the plot from the same
readbacks, then posts them to `/captures`; the server stages them and
queues `birds-arent-real-generate --capture <dir>`, which finishes the
capture like any still.

## Adding a location

`location` has one choice (`blank`) today. A location is a component
`BirdStudio` mounts for its choice, plus its keys in the schema; the
BirdsArentReal street set (wet ground, curb, bus stop, trash can, manhole,
litter, with birds on its perches) is the planned one, and the CCTV look
(SurveillancePost's scanlines and HUD, a Bird POV view) after it — see the
tool's `todo.md`. Its props must load without drei, as FakeBird does.
