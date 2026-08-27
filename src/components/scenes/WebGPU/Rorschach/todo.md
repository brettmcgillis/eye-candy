# // Rorschach

# // TODO:

[Back to main TODO](../../../../../TODO.md)

- [ ] RorschachCLI and Rorschach scene:
  - [ ] can we support growth + ink videos?
  - [ ] When previewing a Test allow me to regen a new test starting with / prepoulating the form with the exact same params. this would allow me to identify cool tests and then regen them in new color schemes, go from png to svg, go from iphone to square, change dimensions, etc.
  - [ ] When previewing a test allow me to click abutton and be taken to the rorschach scene with all the image's json props applied. This would allow me to go from a still to it's 3d representation
  - [ ] allow me to create a video from a set of stills. since we have the json we could go from one or more stills to a growth video.
  - [x] when generating via cli, scene, or dev page I should be able to pass any/every param OR roll the dice or a select bunch. example: i could generate 100 random ones, or 100 of a given color pallette, or 1 test in 100 pallettes.
  - [ ] saving a still/video could also add the test as a preset in the scene presets. would love if they all followed the numbered convention we've started. On the fence on this one. might not need it.

- [ ] 3d lines (tubes) mode to extend lines mode
- [ ] might want to explore dramatic lighting when we get to particles and lines mode assuming they are spheres/tubes

- [ ] I've seen a bunch of letter A's get generated... could we get the whole alphabet? would make for a sick stills video

# // Intent/Use Cases

- This scene is a part of a larger set of code, includeing the RorschachCLI scripts and UI. Any feature that is added to this scene should generally be supported by the CLI and dev tool page UX as well.

- Generative ink-blot tests combining two references: nullHashPixel's
  Rorschach Algorithm tests (seeded formula-builder assembling a system of
  parametric ODEs, bundled and mirrored for bilateral symmetry) and
  sudoAquarelle's physically-based watercolor sim (Curtis et al. 1997
  shallow-water + pigment-deposition + capillary layers, Kubelka-Munk
  compositing).
- Three render modes sharing one ODE generator core: Lines (3D strokes),
  Points (3D point cloud), Ink (watercolor-on-paper). Lines ships first.

# // Presets

# // Features

- Phase 2: Ink mode — full Curtis-97 fluid/pigment/capillary ping-pong sim
  and Kubelka-Munk pigment compositing, paper-grain material. Curtis et al.'s watercolor model (SIGGRAPH 1997) with a fluid layer, drifting pigment and wet paper fibers.
  this mode should generate symmetric inkblots that appear to be genuine watercolor ink on paper. we will want to be able to support multiple colors and monochrome just like the lines mode. we will want some continuous mode where systems keep chaning, we will want evolution as well. there may be some parallel between bundles & colors here.

- Phase 3: Points mode — same trajectory data as an alt render mode (GPU point cloud, likely a TSL compute migration for density), plus the `mode` toggle control. we will want to do something interesting with the points here but im uncertain where to go. are the particles circle, square, noisy transparency? do they move along the line created by the system or are they stationary? if theyre stationary is there a wave of noise that travels down the line slightly pushing them out of the way as it moves past their location on the line?

# // Bugs

# // Scripts

## Rendering: two paths

The `.png` is rendered by the **real three.js WebGPU renderer running headless
in Node** (`scripts/lib/gpuCapture.mjs`), so it carries the scene's actual
post-processing — `BloomNode` with the preset's own threshold/strength/radius,
a real depth buffer, and MSAA — rather than an approximation. The `webgpu`
devDependency supplies a Dawn-backed `navigator.gpu`; three otherwise runs
exactly as it does in the browser.

The `.svg` is still drawn by the pure-JS projector in `utils/renderTestSvg.js`,
because vector output and post-processing are mutually exclusive: bloom is a
per-pixel operation on a framebuffer and has no vector representation. That
path also remains available for the PNG via `--renderer svg`.

Gotchas worth not rediscovering:

- `@kmamal/gpu` **does not work**: it sends a texture `swizzle` to Dawn on every
  `createView` (even with no descriptor), and Dawn gates that behind a
  `TextureComponentSwizzle` feature the adapter doesn't expose. Nothing renders.
  Use the `webgpu` package.
- three's `copyTextureToBuffer` returns the buffer with each row padded to 256
  bytes and does **not** unpad it. Any width that isn't a multiple of 64 pixels
  shears progressively down the frame unless the caller strips the padding.
- Rendering through a `RenderPipeline` into an sRGB `RenderTarget` encodes sRGB
  twice — a `#5a5a5a` background reads back as 161. The target must be
  `NoColorSpace` and let the pipeline's output node do the single conversion.
- MSAA on the scene pass comes from `pass(scene, camera, { samples })`; the
  renderer's own `antialias` flag applies to a canvas a headless capture never
  draws to. It measurably changes ~7% of pixels and costs nothing.

## rorschach:generate — stills + props JSON

`scripts/rorschach-generate.mjs`. Fully headless: no browser, no GPU. Rolls a
config with `utils/rollConfig.js`, grows the test, and renders it with
`utils/renderTestSvg.js`. Writes `<out>/<seed>/` containing `props.json` plus
an `.svg` and `.png` per view.

`props.json` is `{ preset, render }` — paste `preset` into the Leva panel to
get the exact test back. That's the object to attach to a post/NFT or print on
the back of a plot.

| Flag                   | Default            | Notes                                             |
| ---------------------- | ------------------ | ------------------------------------------------- |
| `--count N`            | 1                  | how many tests                                    |
| `--seed S`             | random             | first test's seed; later tests increment from it  |
| `--out DIR`            | `output/rorschach` | gitignored                                        |
| `--width` / `--height` | 1080               | output pixels                                     |
| `--views LIST`         | all 4              | `front,back,top,bottom`                           |
| `--stroke PX`          | auto               | 0 scales from `--width`                           |
| `--simplify PX`        | 0.4                | screen-space decimation floor                     |
| `--chunkPoints N`      | 24                 | points per depth-sorted chunk; 0 sorts per bundle |
| `--fov DEG`            | 42                 | matches `utils/camera.js`                         |
| `--distance N`         | 22                 | lower crops in tighter than the scene does        |
| `--flatten N`          | 0                  | 0-1 squash toward 2D                              |
| `--flattenAxis A`      | `z`                | `z` or `y`                                        |
| `--bloomStrength N`    | 0.5                | additive glow gain                                |
| `--bloomRadius N`      | 0.3                | glow spread, 0-1                                  |
| `--no-bloom`           | off                | skips bloom entirely                              |

```bash
# one test, all 4 views, print resolution
npm run rorschach:generate -- --seed 12345 --width 2160 --height 2160

# a month of IG posts, front view only, framed a little tighter
npm run rorschach:generate -- --count 30 --views front --distance 18 --out output/ig

# reproduce a saved test exactly, as a flat 2D plate for plotting
npm run rorschach:generate -- --seed 705 --flatten 1 --views front --no-bloom

# sweep a seed range to audition the roll's rails
npm run rorschach:generate -- --count 12 --seed 700 --views front --width 600 --height 600
```

Notes:

- SVG is a first-class output, not a byproduct — it's what goes to a plotter.
- The `.svg` is exact except for bloom: the generator is pure JS and the
  strokes are unlit flat-color lines, so an SVG polyline lands where the GPU
  would have drawn it.
- **Bloom differs between the two outputs.** The `.png` gets the real
  `BloomNode`. The `.svg` can't express that, so it falls back to a
  single-radius `feGaussianBlur` filter per emissive bundle — fine on its own,
  but overlapping bundles don't accumulate, and it clamps emissive colour to
  sRGB 1.0, so an intensity-5 bundle glows far less than it should. For
  plotting, use `--no-bloom` anyway.
- `--renderer svg` also has no depth buffer — it painter-sorts short chunks of
  stroke (see `--chunkPoints`). The `gpu` renderer has real per-fragment depth,
  which is why orbit and turntable no longer pop.
- Loads the scene's modules through Vite's `ssrLoadModule`, because they use
  extensionless imports and a JSON import that plain Node can't resolve.

- `--overlay` burns the scene overlay (Scenemoji, version, name, date) into the
  PNG; off by default here. `--ig story|reel|post|none` picks the safe-area
  insets (default `post`) and only applies alongside `--overlay`.
- **The overlay is scaled by an emulated device pixel ratio**, not by the raw
  output size: it lays out in CSS pixels and scales by `width / --viewport`.
  `--viewport` defaults to 390 with `--ig` (a vertical iPhone's CSS viewport —
  1170x2532 at DPR 3) and 1440 otherwise. Which CSS branch applies is decided by
  that viewport against the app's own `max-width: 900px` media query, so the IG
  offsets only exist when the mobile branch is in play, exactly as in the app.
  Scaling off the output size instead drew a phone export at roughly 1x, with
  chips about a third of their real size and insets shrunk to match.
- The burned-in Scenemoji is the **Showcase** form: mark — scene icon, with no
  area icon. The live app puts a wrench there for WIP scenes and a posted image
  should never carry it.

## rorschach:video — stills, turntable, cinematic

`scripts/rorschach-video.mjs`. Same renderer and same bloom as the stills, so
a frame here and a still of the same test are pixel-identical. Needs `ffmpeg`
on PATH. Shares `--width/--height/--seed/--bloom*/--distance/--ig/--overlay` with
`rorschach:generate`, with two different defaults: the overlay is **on**
(`--no-overlay` turns it off), and the frame is **1170x2532** — a vertical
iPhone (19.5:9). That is taller than Instagram's 9:16, so a reel will letterbox
or crop; pass `--width 1080 --height 1920` for an IG-native frame.

| Mode               | What it renders                                                     | Mode flags                                               |
| ------------------ | ------------------------------------------------------------------- | -------------------------------------------------------- |
| `stills` (default) | one rolled test per shot, held then crossfaded                      | `--count`, `--in DIR`, `--hold`, `--crossfade`, `--view` |
| `turntable`        | one finished test, orbited                                          | `--turns`, `--hold` (seconds per revolution)             |
| `cinematic`        | a new system grows each half-revolution, flattening at the far side | `--systems`, `--hold` (seconds per half-revolution)      |

```bash
# stitch a month of posts into a reel
npm run rorschach:video -- --mode stills --count 30 --hold 2 --crossfade 0.6 --ig reel \
  --width 1080 --height 1920 --out output/reel.mp4

# stitch stills a previous run already wrote
npm run rorschach:video -- --mode stills --in output/rorschach --view front

# turntable of one test, 6s per revolution
npm run rorschach:video -- --mode turntable --seed 12345 --turns 2 --hold 6

# the cinematic sweep, 4 systems
npm run rorschach:video -- --mode cinematic --systems 4 --hold 8 --out output/cine.mp4
```

Notes:

- `stills` duration is `count * hold + crossfade`; `--crossfade 0` uses hard
  cuts (concat demuxer) instead of the xfade chain.
- Depth is a painter's sort over short chunks of stroke, not whole bundles.
  Per-bundle ordering looks fine head-on but breaks under rotation: two
  interpenetrating bundles swap places all at once when their mean depths
  cross, which reads as the form popping inside out mid-orbit. `--chunkPoints`
  tunes the granularity; smaller is more correct and a bigger SVG.
- Cinematic timing lives in `utils/cinematic.js`, shared with the in-app
  Cinematic Mode so the rendered sweep and the live one can't drift.
- Roughly 0.4-0.9s per frame at 480-1080px, so a long clip is minutes, not
  seconds. The overlay is built and rasterised once per run, not per frame.
- Every long step reports progress (`scripts/lib/progress.mjs`): a rewritten
  bar with an ETA on a terminal, plain 10% lines when piped to a log. Encodes
  get theirs from ffmpeg's own `-progress pipe:1` frame counter, which matters
  most for `--in`, where encoding is the _only_ step and would otherwise sit
  silent for a minute.

## Cinematic Mode (in-app)

Leva → Rorschach → Cinematic. Orbits the camera continuously; each
half-revolution grows a fresh rolled test, flattens it as the camera reaches
the far side, and re-rolls as the camera passes behind. Growth Speed is derived
from Seconds Per System rather than read from the Growth folder, so growth and
rotation stay locked; turning the mode off restores the Growth Speed you had.
Flatten is animated through a ref, not a Leva control, so the sweep doesn't
re-render the scene every frame.

## Planned

- [ ] IG posting — CLI or Graph API, taking a directory from
      `rorschach:generate` and using `props.json` as the caption.
- [ ] `--mode cinematic` currently re-rolls with sequential seeds
      (`seed + systemIndex`); a random seed per system would suit a long clip
      better.
