# Rabbit pipeline

RabbitCLI renders and pen-plots the Stay Hunted rabbit — the hare in the
painting, his volley of arrows, the ribbon tied to one of them and the
graze grass — from rolled generations, and its Live tab captures a frame
you paused on by hand. It is the BirdsArentReal arrangement
(`docs/birds-arent-real-pipeline.md`): the stage is the **real R3F
component tree**, mounted on the headless renderer by the CLI and in a
`<Canvas>` by the Live tab, and the subject is the very component the
scene draws. Run `npm run rabbit:check` after changing any piece below.

## The shape

```
@modules/rabbit          three-free: option schema, roll, the volley, framing,
        │                the grass-blade mirror, fur strokes and the plot
@modules/rabbitRender    HuntedSubject (rabbit, arrows, ribbon, grass, shadow floor),
        │                RabbitStudio (the bench's paper + the scene's lights),
        │                the readbacks, createStageRoot
        │   over @elements/Rabbit, @elements/Grass, @elements/Fur,
        │        @modules/renderStage and @modules/plotKit
        ├── StayHunted scene: CameraRig + LightingRig + <HuntedSubject>
        │                     (subject folders generated from the schema)
        ├── scripts/lib/rabbitRender.mjs
        │     ├─ rabbit-generate.mjs   stills + plot, or --capture
        │     └─ rabbit-video.mjs      loop / turntable / montage
        └── src/dev/tools/rabbit      RabbitWorkbenchPage (RollWorkbench)
              └─ LiveRabbit (Live tab) → POST /dev-api/rabbit/captures
```

| Piece                   | Rule                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/rabbit`       | **Three-free.** May import only `@modules/flora` (`createRng`), `@modules/materialxNoise` and `@modules/plotKit`. The check enforces it.                                                          |
| `@modules/rabbitRender` | The only home of the subject. The scene mounts `HuntedSubject` and nothing else of it; the bench mounts `RabbitStudio`, which wraps the same `HuntedSubject`.                                     |
| `renderOptions.mjs`     | Every knob, once. Scene keys keep Stay Hunted's preset names. Facets: `volley` (scene keys), `pose` and `camera` (generation keys: `config: true, scene: false`, so they never land in a preset). |
| `@elements/Rabbit`      | drei-free (`@hooks/useDracoGltf` + its own `AnimationMixer`), so it loads headlessly. `startTime` sets the clip's start, `playing` stops the mixer; its ink hulls carry `userData.plot = false`.  |

## A generation

- **volley** — `painting` is the reference's four arrows (`PAINTING_VOLLEY`,
  authored at `POSE_TIME`); `rolled` is `layoutVolley(config)`: `arrowCount`
  arrows whose wounds scatter `volleySpread` metres round the same low-back
  aim, flights fanned `volleyFan` degrees about (`volleyAzimuth`,
  `volleyElevation`) and the ribbon on one of the middle arrows, all seeded
  by `volleySeed`. Up to `MAX_ARROWS` (6); the wound shader has a slot each.
  An arrow whose flight misses the skin is dropped.
- **pose** — `poseTime` is the moment of the 13.3 s graze → sit-up clip
  (`CLIP_SECONDS`; the check fails if the clip changes length); the clip
  starts `settle` seconds earlier and plays in at 60 fps, so the arrows and
  the ribbon swing into the still rather than starting at rest.
- **camera** — `viewAzimuth` is degrees round from the painting's view (his
  left rear, `PAINTING_VIEW`), so 0 always reads like the painting. Named
  views (`painting`, `front`, `left`, `right`, `back`, `high`, `low`) are
  world angles. The framing fits points sampled from the posed rabbit, every
  arrow and ribbon mesh, and the grass (`subjectPoints`).

The scene's look keys (paper, ink, fur, wound, arrow dynamics, ribbon,
grass) are not rolled: the bench renders the painting's look. The bench
lights are the scene's `LIGHTING` declaration through `createSceneLights`,
which is the Painting preset's lighting.

## The plot

`readSubject(handles, time)` reads the posed subject back: the rabbit
skinned on the CPU (`getVertexPosition`, as the GPU skins him) with his own
frame for the slices, every arrow and ribbon mesh in world space, and the
grass as its instance data, uniforms and nose press. `renderRabbitSvg`
draws, a pen each, in each part's own colour (so `svgColors` regroups by
part):

| pen | layer      | from                                                                                     |
| --- | ---------- | ---------------------------------------------------------------------------------------- |
| 0   | slices     | `sectionCuts` across the rabbit in his own frame (`svgStyle`, `svgLines`)                |
| 1   | silhouette | the rabbit-only depth pass                                                               |
| 2   | shading    | `shadePath` over the render, masked to the rabbit                                        |
| 3   | contours   | rabbit edges between a face toward the eye and one away                                  |
| 4   | outline    | the Outline-style halo                                                                   |
| 5   | creases    | rabbit folds past `svgCreaseAngle` and open edges                                        |
| 6   | fur        | `furStrokes`: seeded per face, combed back and down, thinned in the lights by the render |
| 7   | arrows     | shafts, nocks and the ragged fletching (contours + creases; flat vanes doubled)          |
| 8   | ribbon     | the strip and its wrap (doubled sheets, so every open edge draws)                        |
| 9   | grass      | each blade's spine, root to tip                                                          |
| 10  | eyes       | the eyes shaded from the render (`svgEyes`)                                              |

Hidden lines (`svgOcclusion`) use the whole subject's depth pass; the
silhouette, halo, shading and fur tone use a second pass of the rabbit
alone, so grass and arrows neither join his outline nor shade him.

**The grass mirror.** The blades are placed in the grass material's
`positionNode`, so there are no CPU vertices to read. `grass.js` evaluates
`@elements/Grass` `straightBlade` on the CPU: the MaterialX gust
(`perlin3`, bit-exact hashes), lean, droop, flutter and the capsule press,
at the capture's TSL `time`. Change the blade shader and this mirror in the
same commit. The check renders a few blades alone and requires the spines
of the camera-facing cards to land on rendered blades (≥ 90 %, in calm and
strong wind) while the same spines moved 1 cm do not. An edge-on card draws
no pixels, which is why only facing cards are scored.

## The eyes and the fur

The rabbit is one mesh, but its eyeballs, irises and teeth are separate
connected pieces of it. The eye bones carry no weights (their bind
positions are meaningless), and the eye is painted as a brown iris that
the painting's repaint would turn into white fur. `ensureSkinMasks`
(`@modules/rabbitRender` `furMask.js`) runs once per geometry, when the skin
material is built (`@elements/Rabbit` hands `customizeMaterial` the mesh),
and writes two vertex attributes:

- `furDensity` — 1 on the largest piece (the skin), fading to 0 within a few
  millimetres of the other pieces, 0 on them. The shell fur reads it through
  `ShellFurGPU`'s `densityNode`.
- `eyeMask` — 1 on the bald pieces the texture paints dark (median luminance
  under 0.2: the eyes; the teeth are pale). The skin material paints them
  as a black bead with a glossier roughness.

The plot reads the same weights: fur strokes are not rooted on bald skin
and are clipped where they would cross an eye or tooth on screen, and
`svgEyes` (pen 10) shades each visible eye from the render's absolute
darkness — crosshatch by default, any shading style, `svgEyeSpacing` apart —
so the eye reads black with its highlight left as paper.

## Headless R3F

Everything in `docs/ghost-buster-pipeline.md` § Headless R3F applies.
`@elements/Rabbit` loads through `useDracoGltf`; `ShellFurGPU` loads its
alpha texture with R3F's `useLoader(TextureLoader)` rather than drei, so
the shell fur mounts headlessly too. The capturer sets
`NeutralToneMapping` (ACES greys the paper), as the scene does.

## The Live tab

`LiveRabbit` mounts `RabbitStudio` with the form's generation, the clip
playing in from `poseTime − settle`. Space pauses; **Use this moment**
writes the clip time the rabbit is held at back as `poseTime`; **Use this
camera** writes the orbit as view keys; **Roll volley** / **Painting
volley** change the arrows; the sliders set the moment and the ribbon and
grass wind. Capture renders the frozen frame at the form's size and the
plot from the same readbacks (grass at the renderer's TSL time) and posts
them to `/captures`, with the held moment as the sidecar's `poseTime`.

## Saving to the scene

A generation's scene keys save to Stay Hunted's `PRESETS` through the dev
server (`preset.scene: 'StayHunted'`, base `SAVED_BASE`). The pose and
camera keys are generation-only and stay in the sidecar.
