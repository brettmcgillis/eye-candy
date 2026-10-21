# GhostBuster pipeline

GhostBusterCLI renders and plots the ghost — `@elements/WebGPU/ghost`'s
GhostCharacter in any GhostBuster skin — from rolled generations, and its
Live tab captures a running ghost you have posed by hand. Unlike the other
generators its look is not a three-only rig: the stage is the **real R3F
component tree**, mounted on the headless renderer by the CLI and in a
`<Canvas>` by the Live tab, so both draw exactly what GhostBuster draws. Run
`npm run ghost-buster:check` after changing any piece below.

## The shape

```
@presets/ghost/ghostSkins   GHOST_SKINS (GhostBuster's preset list), textures, base
        │
@modules/ghostBuster        three-free: option schema, roll, framing, lattice, plot SVG
@modules/ghostBusterRender  GhostStudio (R3F stage), skins, capture readbacks, createStageRoot
        ├─ @modules/renderStage  studio, backdrop, ShadowFloor, headless root, depth pass (shared)
        └─ @modules/plotKit      silhouette, shading, outline, texture layers, framing (shared)
        │                                   │
  scripts/lib/ghostBusterRender.mjs   src/dev/tools/ghostBuster
    ├─ ghost-buster-generate.mjs        GhostBusterWorkbenchPage (RollWorkbench)
    │    stills + plot, or --capture     └─ LiveGhost (Live tab)
    └─ ghost-buster-video.mjs                    │ POST /dev-api/ghostBuster/captures
         float / turntable            src/dev/server/ghostBuster → generate --capture
```

| Piece                        | Rule                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@presets/ghost/ghostSkins`  | The one skin library. GhostBuster's preset menu reads it (`presets/scenePresets.js` re-exports it as `SCENE_PRESETS`), and so do this tool and PrintShop. **Add a skin there and every consumer has it** — nothing else to edit.                                                                              |
| `@modules/ghostBuster`       | **Three-free.** May import only `@modules/flora` (`createRng`), `@modules/plotKit` (the shared plot layers and framing), `@elements/WebGPU/cloth/clothTopology`, `@elements/WebGPU/cloth/clothDecay`, `@elements/WebGPU/ghost/ghostRig` and `@elements/WebGPU/rainCloud/rainCloudRig`. The check enforces it. |
| `@modules/ghostBusterRender` | The only home of the stage. `GhostStudio` is GhostBuster's studio (`StudioEnvironment` and `Backdrop` from `@modules/renderStage`, ambient, spot, orbit light, grid floor) plus the pose wrapper; `ghostProps(skin)` is GhostBuster's prop mapping.                                                           |
| `renderOptions.mjs`          | Every knob, once. Facets: `location`, `skin`, `pose`, `camera`. The skin is a `string` option the page and CLI validate against the library, so the schema stays dependency-free.                                                                                                                             |

## Headless R3F

`createStageRoot` (`@modules/renderStage`'s, with `GhostStudio` as its
stage) mounts it with `createRoot` on the headless renderer, `frameloop: 'never'`, and steps it with `advance(seconds)`. What
it takes to run the real tree in Node:

- **R3F through Vite.** `loadModules(entries, { noExternal: ['@react-three/fiber'] })`.
  Externalised, Node loads R3F's CommonJS build with its own copy of three;
  its `instanceof THREE.Color` checks then fail and colours are assigned as
  strings — every material renders black. drei is not used: its bundle pulls
  CommonJS dependencies Vite cannot transform, so the studio's
  `<Environment>`/`<Lightformer>`s are rebuilt as `StudioEnvironment`.
- **`extend(THREE)`** from `three/webgpu`; `<Canvas>` does this in the browser.
- **The canvas is the target.** `renderer.setOutputRenderTarget(target)`
  sends every "draw to canvas" (GhostCharacter's Outline always renders the
  frame itself) into the capture target with tone mapping and sRGB applied.
- **Textures** load through `scripts/lib/r3fHeadless.mjs`'s
  `TextureLoader.load` shim, which reads `public/` with sharp into a flipped
  `DataTexture`.
- **Determinism.** A generation is a fresh stage at clock 0 (`key` remount,
  R3F clock reset), mounted inside `act` so `useFrame` subscriptions exist
  before the first step, with TSL `time` (the cloth's wind noise) set every
  settle step. The wind input runs at `useFrame` priority −1, ahead of the
  ghost: subscription order otherwise depends on whether the ghost
  suspended, and a one-frame lag reshapes the drape. The same batch renders
  byte-identically, and a ghost re-rolled alone matches its batch.

## Framing and the plot

The cloth sim's positions are read back from the GPU (`readGhostLattice`)
and carried to world space by the cloth mesh's matrix. `latticeBounds`
gives the sphere round the visible drape, which `frameGhost` fits — azimuth
0 looks at the face. The plot (`renderGhostSvg`) draws UV lines across the
cloth (`rings` round the crown, `spokes`, `grid`, or `mesh`) plus its edges
(marching squares at the material's `alphaTest`, 0.01: hem, eye holes,
tears), cut where the shader cuts:

- the surface is the render mesh itself: a vertex per sim quad (corner
  mean), dead quads dropped, each cell split into the index buffer's two
  triangles; anything above alpha 0.01 is drawn, so the faded rim is cloth;
- edges and folds within two pixels of the silhouette are left to it, so the
  hem is one stroke;
- folds (`svgFolds`, own layer) are where n·v crosses zero on the cloth —
  the lines where it turns edge-on and overlaps itself;
- cutouts are in the **shader's UVs, whose v runs opposite the lattice's**;
- vertices outside the circle never leave the flat rest disk, so they are
  filled from their neighbours before sampling.

The silhouette (`svgSilhouette`, its own layer) is marching squares over
the depth pass's coverage, simplified (closed loops split before RDP) and
smoothed; `svgStyle: none` leaves the silhouette and edges alone. The depth
pass draws the cloth only, so the floor neither hides lines nor joins the
outline. Shading (`svgShading`: `crosshatch`, `halftone`, `stipple`, `squiggle`, `scribble`, `tsp`; its own layer)
reads darkness from the ghost's own render — one minus luma, masked to the
cloth's coverage, bent by `svgShadeGamma` — so it follows the skin, lights
and textures you see. Crosshatch lays up to four hatch directions at
darkness 0.2/0.4/0.6/0.8; halftone draws pen-filled dots (one stroke each:
a spiral `svgPenMm` apart, converted through `plotWidthMm`, then the rim)
on a grid turned by `svgShadeAngle`, row by row boustrophedon; stipple keeps hashed, jittered points
by darkness, so a plot repeats exactly. The line-drawing styles read tone **equalized** over the ghost's own
pixels (each darkness becomes its rank), so a pale skin's folds spread
across the whole range rather than crowding under its black eye holes, and
they lift the pen in the highlights. Squiggle draws one wave per row whose
height and frequency follow tone; scribble drags a circling pen along each
row, so shadows coil into loops; tsp is one unbroken line — a
nearest-neighbour tour through tone-weighted stipple (at most 16k points),
uncrossed by neighbour-list 2-opt.

Three layers carry the skin's surface detail:

- **rims** (`svgRims`, pen-5): the shader's cutout rim band — from each
  eye's visible edge, out by `cutoutRimOffset`, `cutoutRimWidth` wide in UV —
  filled with concentric strokes about a pen apart.
- **weave** (`svgWeave`, pen-6): `fabricWeave`'s thread height (parity, sin
  profile and slub, ported) contoured at 0.5 in the shader's UVs, so each
  thread on top is the lozenge the render shades. `svgWeaveThreads` sets the
  count (default 40; Linen's own 150 is about 2 px apart; 0 uses it).
- **texture** (`svgTexture`, pen-7, off by default): brightness contours of
  the render inside the ghost at `svgTextureLevels` equal-area tones, after a
  3 output-px box blur, keeping strokes of 15 px or more — whatever a skin paints (rims, nebula textures,
  emissive glow) comes through without a per-skin port.

The outline layer (`svgOutline`, pen-4) is the skin's Outline post effect
as lines: an exact distance transform of the coverage mask, with iso-lines
at the band's outer edge (`outline`), every stride across it (`rings`), or
crowding toward the silhouette (`glow` and the pattern modes), measured
inward for `outlineInside`. Widths are drawing-buffer pixels, as Outline's
own are; `svgOutlineWidth`/`svgOutlineStride` override them in output px. Hidden lines go through a linear-depth pass (`createDepthCapture`); note
WebGPU readbacks pad every row to 256 bytes **except the last**.

## Fills: one line per colour region

`svgFill` (`spiral` round the crown, or `rows` back and forth) fills the
cloth for a colour plot. One long line is walked through the cloth's UVs
by `@modules/plotKit`'s `regionFill`, which swings it along its normal by
tone (the render's equalized darkness), advancing the wave by distance on
screen so foreshortening can't squeeze it, and splits it wherever the
region under it changes. Each region is a layer in the skin's colour,
which the Plotterizer matches to a pen:

| Layer (pen)                    | Region                                                                                                                                                                     | Colour                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| cloth fill (20)                | cloth seen from outside, and inside slivers not seen through a hole                                                                                                        | `color`                                               |
| cloth shadow (21)              | `svgFillShades: 2`: a second line between the turns, tone above `svgFillShadow` only                                                                                       | `color` darkened                                      |
| inside fill (22)               | `svgFillInside: cloth`: the sheet's inside seen through an eye hole (inside its edge on screen); `hole`: each hole filled by a spiral of its own shape, one stroke per eye | `innerEmissiveColor` when it glows, else `innerColor` |
| goo / rot / blood fill (23–25) | clothDecay's goo, rot and blood above half                                                                                                                                 | `dripColor`, `holeRimColor`, `bloodColor`             |

The eye rims' band is left to the rims layer (now in `cutoutRimColor`).
`svgFillSpacing` is millimetres on paper (through `plotWidthMm`, the UV
pitch from the cloth's median on-screen scale). Where the drape packs
turns closer than two nibs (`svgPenMm`) only every second, fourth… turn is
drawn there, swinging that much wider, and a wave is never tighter than
four nibs.

## Decay: rot, blood, drips and brows

`@elements/WebGPU/cloth/clothDecay.js` is the three-free maths behind four
cloth looks, with `createClothSimulation` porting each formula to TSL and
GhostBuster's Leva showing them under **Decay**. Each key is flat in the
skin, and the base (Original) has them all switched off. ClothMesh takes
them as `decay` (`decayFromControls(skin)`).

| Look              | Keys                                                                        | How                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rot (Zombie)      | `holeRimWidth`, `holeRimColor`, `holeRimGlow`                               | A band round every hole and tear. The noise's distance from the cut over its gradient is a distance on the cloth, so the band keeps one UV width round real holes and stays off where the noise only nears the cut.                                                                                                                                                                                                                                |
| blood (Zombie)    | `bloodAmount`, `bloodColor`                                                 | Stains within `BLOOD_REACH` of a cut, where the noise mirrored in u clears a threshold `bloodAmount` lowers. Wet: roughness drops.                                                                                                                                                                                                                                                                                                                 |
| hem drips (Toxic) | `dripAmount`, `dripCount`, `dripSpeed`, `dripTint`, `dripColor`, `dripGlow` | The outer `dripAmount` of the disc is cut away except for seeded columns ending in a bulb, each stretching from 30% to its full (seeded) length at its own rate, then snapping back, on the R3F clock (`dripTimeU`, not TSL `time`, so a plot knows the phase). `dripTint` (0 on Toxic) and `dripGlow` set how far the goo leaves the cloth's own colour. The per-drip values live in a small texture, not a shader hash, so every backend agrees. |
| brow (Evil)       | `cutoutBrow`, `cutoutBrowSlant`                                             | Each eye hole is its circle cut by a slanted line down toward the nose (`eyeHoleDistance`); the eyeliner rim follows it.                                                                                                                                                                                                                                                                                                                           |

The plot mirrors all four: the drips and browed eyes are part of the cloth's
alpha, so the edges layer traces them; `svgDecay` (on by default) adds the
rot (pen-12), blood (pen-13) and goo-line (pen-14) outlines at half
strength. PrintShop's ghost surface takes the same maths for its alpha and
colours.

Evil's "horns" are its ear pins raised, spread and given tiny colliders: a
cloth tent can only make a cone apex, so they read as sharp devil ears.
Real horns would need horn meshes the cloth drapes over.

## Storm skins

A skin whose `cloudVisible`, `rainVisible` or `lightningVisible` is set
(**Sad** today) mounts `@elements/WebGPU/rainCloud`'s `RainCloud` beside the
ghost. Every look key is flat in the skin (the base, Original, carries them
all switched off) and GhostBuster's Leva has them under **Storm**.

| Piece                         | Rule                                                                                                                                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rainCloud/rainCloudRig.js`   | **Three-free**, so the kernel may import it: the seeded drops, where each is at a time, the strike schedule and envelope, the bolt's midpoint-displaced paths and `rainShapes`/`boltShapes`, which redraw a snapshot for the plot.       |
| `RainCloud`                   | Hangs `cloudHeight` above the point `follow(out)` writes (`ghostCrown`: the head top, read from the cloth mesh) and never tilts. Its `useFrame` runs at priority 0.5 — after the rig moves, before Outline renders the frame.            |
| the rain shadow               | A 128² top-down orthographic depth render of whatever is on `RAIN_SHADOW_LAYER` (the follower enables it on the cloth), turned into world heights; drops stop, and splash, at the texel under them. The plot reads the same texels back. |
| `strike` / `stormSeed` (pose) | `strike` (rolled half the time) adds a bolt whose main stroke peaks at the still's moment (`settle`); `stormSeed` seeds the drops and bolts. Strikes otherwise follow the seeded schedule.                                               |
| `StylizedCloud2`              | Loads drei-free through `@hooks/useDracoGltf`, so the stage mounts headlessly (the CLI installs `installGltfLoader`).                                                                                                                    |

`svgStorm` (on by default) adds four layers: **cloud** (pen-8: its
silhouette, plus the puff boundaries — the cloud's normal pass split where
the surface folds back into a valley or jumps in depth, each region grown
into those bands so a boundary is one stroke), **rain** (pen-9), **splashes**
(pen-10, rings on what they hit, tilted to its slope: the normal comes from the rain shadow's neighbouring texels, ignoring steps over the hem or onto the floor) and **lightning** (pen-11, when a strike is
bright at the capture). Hidden lines are cut against the ghost and cloud
together; the ghost's silhouette drops what the cloud hides, and shading and
texture contours cover both. The cloud model is an unwelded triangle soup
whose cracks leave pinholes in a pass, so `readStormPlot` closes small
enclosed holes before anything is traced. Framing (`withStorm`) grows the
ghost's sphere to take in the cloud.

## Animated stills (flip books)

`animation` (`none`, `wave`, `clap`; pose facet, never rolled) starts that
GhostBuster action once the cloth has settled, and `animationAt` is how
many seconds into it the still is taken (`stillTime(config)` = `settle` +
`animationAt`, which a storm's forced strike also peaks at). An animated
still is framed on the fixed `MOTION_BOUNDS` sphere, not its own drape, so
a run of them — one job per frame, every one re-simulated from clock 0 —
keeps one camera and flips as a single shot. Pin every rollable key (wind,
tilt, camera, location) when queuing frames, or each frame rolls its own.

## The Live tab

`LiveGhost` mounts `GhostStudio` in the page with the form's generation:
Space pauses (frameloop `never`; orbiting re-renders at the frozen clock),
WASD gusts, the cursor pokes the cloth, F frames the drape, and **Use this
camera** writes the orbit back as camera keys. The panel above the stage
drives the ghost: Wave/Clap toggle the imperative `playAnimation` clips
(`1`/`2`, `0` idles), Jump (`J`) pulses `jumpRef` into the rig's
`jumpTriggered` for one frame, and the Wind from / Wind / Gust sliders write
the form's `windAngle`/`windStrength`/`windGust` live (the form and the
sliders are the same options). Held WASD still overrides them. Action
buttons are disabled while paused — a paused frame has no time to advance. Capture renders the frozen
frame at the form's size into an offscreen target and the plot from the
same readbacks, then posts them to `/captures`; the server stages them and
queues `ghost-buster-generate --capture <dir>`, which finishes the capture
like any still (formats, overlay, sidecar) without a renderer.

## Adding a location

`location` is a facet with one choice (`blank`) today. A location is a
component `GhostStudio` mounts beside the ghost for its choice, plus its
keys in the schema; the All My Friends Are Ghosts settings are the planned
ones (see the tool's `todo.md`).

## The shadow floor

`ShadowFloor` (`@modules/renderStage`) is the shadow-catching floor
BirdsArentRealCLI stands its flock on: a plane that draws only the shadows
falling on it, over any backdrop, transparent included. GhostStudio does not
mount it yet. To give the ghost one: add a `floor` choice for it in
`renderOptions.mjs`, mount `<ShadowFloor opacity={…} y={-0.9} />` for that
choice beside the grid floor, and make one light cast shadows (the studio's
spot casts none today, and the Live tab's `WebGPUCanvas` already has
`shadows`; the headless capturer enables the shadow map).
