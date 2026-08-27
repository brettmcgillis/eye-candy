# Rorschach pipeline

Rorschach is not one scene. It is **one kernel with two renderers and a UI over
one of them**, and it has to be developed that way: a change to the generated
art starts in the kernel and lands in every consumer in the same commit.

This file is the source of truth for that arrangement. It applies to any change
touching `src/modules/rorschach/`, the Rorschach scene, the Rorschach CLIs, or
the Rorschach dev tool.

## The shape

```
                 src/modules/rorschach/          ← the kernel: the art itself
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
  WebGPU scene                        scripts/lib/rorschachRender.mjs
  (realtime, Leva)                    (headless: GPU capture + SVG)
                                                │
                                      rorschach-generate.mjs
                                      rorschach-video.mjs
                                                │
                                      src/dev/tools/rorschach/  ← UI over the CLI
```

| Piece                                          | Role                                                                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/rorschach/`                       | **The kernel.** Rolling a config, integrating the ODE bundles, deriving styles and overrides, projecting to SVG, and the render-option schema. |
| `src/components/scenes/WebGPU/Rorschach/`      | **Renderer A** — realtime WebGPU, Leva controls, presets, post chain.                                                                          |
| `scripts/lib/rorschachRender.mjs` + the 2 CLIs | **Renderer B** — headless stills and video.                                                                                                    |
| `src/dev/server/rorschach/`                    | Runs the CLIs as jobs and validates their options.                                                                                             |
| `src/dev/tools/rorschach/`                     | **Not a third renderer** — a browser UI over renderer B. It must never grow its own generation or option logic.                                |

## Rules

**1. The kernel is renderer-agnostic.** No React, no R3F, no Leva, no DOM, no
`node:*`. `three/webgpu` is allowed — both renderers use it. Anything that
can't obey this belongs in a renderer, not the kernel. Enforced by a
`no-restricted-imports` zone in `.eslintrc.json` and by `npm run
rorschach:check`.

**2. Consumers import the barrel, never a file inside it.** Both renderers go
through `@modules/rorschach` (or, for the headless side, `ssrLoadModule` of
`src/modules/rorschach/index.js`). Deep imports are lint errors. The headless
renderers used to path-string into the scene folder instead; that edge was
invisible to every tool in the repo and broke on any rename.

**3. Every knob is declared once, in `renderOptions.mjs`.** Its type, range,
default, and help text. The CLIs derive their defaults, validation and
`--help` from it; the workbench derives its form defaults and input
`min`/`max`/`step` from it; the dev server validates job payloads against it.
Never hand-write an option default or range in a consumer. Intentional
per-surface differences go in that file's `SURFACE_DEFAULTS` table, which
therefore doubles as the complete list of ways the surfaces disagree.

`renderOptions.mjs` is `.mjs` and **dependency-free** on purpose: the CLIs need
the schema before they can start Vite to load the rest of the kernel, and the
dev server runs inside Vite's config loader, which resolves no path aliases.
Those two import it by path; everything else gets it through the barrel.

**4. Change order: kernel → renderers → UI, in one commit.** Never fix a
visual difference by patching one renderer. A difference between the scene and
a CLI render is either a kernel bug or a listed divergence below — if it is
neither, it is a bug in whichever renderer you were about to special-case.

**5. Definition of done** for any kernel change:

- `npm run rorschach:check` passes.
- `npm run lint:fix` passes.
- A still renders: `npm run rorschach:generate -- --count 1 --views front`.
- The scene still renders in the browser (human eyeball — there are no unit
  tests here by policy).

## Known divergences

These are deliberate. Do not "fix" them by editing one renderer, and add to
this table if you introduce another.

| Difference                       | Why                                                                                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--renderer svg` bloom           | Approximates `BloomNode`'s mip chain with three fixed blur levels in sharp. `--renderer gpu` is the default and runs the scene's real post chain; the SVG path exists as a fallback and as the basis of `.svg` output. |
| Headless output never evolves    | The scene runs `advanceEvolution`/`driftCoeffs` every frame, so a long-open scene drifts away from its seed. The CLIs render the test at t=0, so a given seed is reproducible.                                         |
| Headless growth is instantaneous | The CLIs integrate every bundle fully, then reveal a fraction via `setGrowth`. The scene grows a slice per frame. Same geometry, different arrival.                                                                    |
| Overlay burn-in is headless-only | The scene draws its overlay as DOM; the CLIs composite an SVG overlay into the pixels (`--overlay`).                                                                                                                   |
| Ink is GPU-only                  | The watercolour layer is a fluid sim on the GPU and has no vector form. `--renderer svg` silently omits it and draws lines alone; SVG output stays a line-work format, which is what plotting wants anyway.            |
| Ink settles by step count        | The scene advances the sim a few steps per frame, so a blot keeps developing while you watch. A still runs `--inkSettle` steps from a clean field, which is what makes a seed reproducible rather than time-dependent. |

## Growth videos

The `growth` video mode renders a sequence of fully independent tests, each
revealed from 0% to 100% over the requested number of seconds with a fixed
view.

**Growth and ink move together.** They drive different things — growth reveals
stroke geometry, `inkPatternTime` evolves the watercolour field — so passing
`--ink` gets both in one clip. The clock is advanced off the _output_ frame
index, not the per-test one, so it runs continuously through the whole video
rather than restarting at every test or every view: one video, one clock. Same
form `breathe` uses. Without it `inkPatternTime` sits at its default for every
frame and the blot is identical throughout while only the lines move.

Note this inherits breathe's cost: `buildInkPaper` sits inside the per-frame
capture loop, so every frame rebuilds and re-settles the sim from clean at
`--inkSettle` steps. That is deliberate — it makes each frame a pure function of
(seed, patternTime) and keeps a clip reproducible — but at a high settle and
2048 resolution it is the dominant per-frame cost of a growth render. For example, five tests growing for three seconds each:

```sh
npm run rorschach:video -- \
  --mode growth \
  --count 5 \
  --hold 3 \
  --growthView front \
  --stillsOut output/rorschach-growth-sources \
  --out output/rorschach-growth.mp4
```

Use `--growthView all --growthPresentation grid` to show Front, Back, Top, and
Bottom simultaneously in a four-up frame. Use
`--growthView all --growthPresentation sequential` to give every view its own
full growth interval. Grid duration is `count × hold`; sequential duration is
`count × 4 × hold`.

The workbench exposes the same options under **Video → Growth** as Tests,
Seconds, View, and, when All is selected, Presentation.

When `--stillsOut` is set, Growth also writes one completed `final.png` or
`final.webp` plus `props.json` per test seed. The JSON contains the rolled
preset, resolved first seed, sequence position, and render options needed to
regenerate the video. The workbench enables this by default through **Keep
final images**.

## Video metadata

Every successful video render writes a JSON sidecar beside the MP4 using the
same basename: `rorschach.mp4` produces `rorschach.json`. This applies to
Stills, Growth, Turntable, and Cinematic modes. The sidecar is attached to the
video in workbench previews and follows it through Keep and Delete actions.

The versioned JSON separates the recipe from facts measured after encoding:

- `presets` contains every rolled test config used by the render, in display
  order.
- `render` contains the normalized CLI options. Modes with a contiguous test
  sequence record the resolved first seed even when the request omitted one.
- `encoding` records the encoder recipe: codec, CRF, preset, and pixel format.
- `video` contains ffprobe and filesystem results: duration, frame count and
  rate, dimensions, codec and profile, pixel and container formats, bitrate,
  and file size. Probe fields the encoded container does not expose are `null`.
- `generatedAt` records when the sidecar was written; `schemaVersion` allows
  readers to distinguish future schema changes.

For generated Stills videos, `presets` is the exact record when random seeds
were requested. For `--in` Stills videos, no tests are rolled, so `presets` is
empty and `render.in` identifies the source directory required to rebuild the
video.

## Rolling and pinning

A test has three rollable facets — **structure**, **palette** (emissive
included, since whether a bundle _can_ glow depends on that palette's contrast
against its background), and **ink** — each with its own RNG stream and its own
seed.

**One rule everywhere: what you set is pinned, what you leave alone is rolled.**
On the CLI that means a typed flag; on the workbench it means a field whose pin
checkbox is ticked. Both arrive at `rollTestConfig` as the same `pinned` object.

```bash
# a hundred random tests
--count 100
# a hundred random tests that all share a palette
--count 100 --palette Ameena
# one blot through a hundred palettes
--count 100 --structureSeed 42 --inkSeed 42
```

Separate streams are what make the third line possible. A single sequential
stream makes every draw depend on every draw before it, so holding one facet
while another moves cannot be expressed — and appending a new roll anywhere
re-rolls every seed that came before it.

**The schema is the single source.** A spec in `renderOptions.mjs` carries its
validation range (`min`/`max` — what the renderer will accept) and, when it is
rollable, a `facet` and an art-directed `roll` window (what is worth looking
at). `rollConfig` derives its tables from those specs rather than keeping its
own copy. A spec with a `facet` but no `roll` block (framingShape, palette,
monochrome) is rolled by bespoke logic, because a gradient name is not a number.
A spec with no facet is never rolled — that is how camera, growth, evolution,
post and the sim's resolution hold still across a batch, expressed as data
rather than as a comment.

**The palette roll draws from four-stop gradients and up.** Fewer than four is a
two-colour ramp rather than a palette: the ink samples four pigment slots across
the gradient and the Lines layer samples one stop per bundle, so a two-stop
entry gives both layers almost nothing to traverse — and with `paletteExact` it
collapses to literally two colours across every slot. The cut is severe, and
worth knowing before reading a batch: 373 of the 423 gradients have three stops
or fewer, so the dice draw from 50, and a 400-roll batch lands on about 37
distinct palettes with the most frequent repeating a dozen times. It applies to
the roll only — a name the dice will not choose is still worth choosing on
purpose, so the dropdowns and `--palette` keep the full library.

**The ink's windows are narrower than its controls**, deliberately. Softness
past ~0.1 ramps across most of the field's range and washes the whole sheet; a
high Wash with no Flow lands as a hard stencil. The windows are pulled in so an
unattended roll stays inside the region that reads as a watercolour blot. Cell
pixelation and ink bloom are chance-gated rather than always-on, the way
emissive bundles already were.

**The scene needs no pins, and nothing disabled.** It is not a batch generator:
there is one config, every value of it is already on screen, and the only
question a live editor has to answer is what Regenerate is allowed to
overwrite. So holding is the default and rolling is the verb — a **Roll** folder
with one button per facet, each applying only that facet's keys. The CLI and the
workbench have to declare what to _hold_ precisely because their values are
never seen; a hundred tests are rolled sight unseen. Same capability, inverted
to suit the surface.

**A trap the workbench walked into.** `appendFlags` forwarded every option it
held, which after `normalizeOptions` merges defaults is _all_ of them — so every
job from the dev page pinned the entire test and nothing could roll. The server
now forwards a rollable option only when the client actually sent it, and the
page sends only the fields whose pins are ticked.

## The ink layer

`src/modules/rorschach/watercolor/` is Curtis et al., "Computer-Generated
Watercolor" (SIGGRAPH 1997), painting the classic pattern. Toggle it with
`--ink` / the **Layers** control folder; `--no-lines` leaves the blot alone.

**The ink is the pattern, and there is no sheet of paper.** It used to also
stamp the ODE trajectories onto an opaque card, which put the blot in
competition with a white rectangle and with the Lines layer for the same
shapes — preset 010 read as a brown sheet washing to white. Trajectories are the
Lines layer's job. The ink draws the blot, transparently, over whatever the
scene or the still renders behind it, and that backdrop is the only substrate
Kubelka-Munk needs. Both layers can run alone or together.

**Three passes per step, and it has to stay that way.** water, suspended
pigment, deposited pigment. Kubelka-Munk runs only in the material's colour
node, never in the loop.

This file first implemented the paper literally — one pass per step named in the
pseudocode, 21 of them, 12 being Jacobi pressure relaxation. That was faithful
to the paper's _structure_ and unusable: the scene ran at 0.05fps, and every
control read as broken because a change took twenty seconds to appear. The
rewrite fuses the same physics the way an interactive watercolour sim is
actually written, which took `sim.step()` from 17.2ms to 2.05ms and the scene
from 0.05fps to 61fps.

If you are tempted to split a pass out "for clarity", don't. Pass count is the
budget here.

### Departures from the paper, each load-bearing

- **No pressure projection.** Curtis relaxes divergence to zero every step. That
  iteration was the single largest cost, and an interactive implementation does
  without it. Flow is driven directly by the gradient of the wet-height field
  (saturation plus paper tooth), which gives the same outward creep to a wet
  edge.
- **Edge darkening from drying, not from a blurred mask.** Pigment settles
  faster the drier a cell is, so the last place holding water keeps the least
  paint. Same rim, no blur passes.
- **Velocities are staggered in collocated storage** — a cell's `u` is the flux
  through its _right_ face. Treating them as truly collocated decouples odd and
  even cells, and the checkerboard reads as a diagonal hatch across the blot.
- **Lift is gated on water motion.** Settled pigment only returns to suspension
  where the water is actually moving. Gated on wetness alone, a finished blot
  dissolves itself — deposited pigment peaks around step three and is gone by
  step twenty.
- **A concentration ceiling.** Curtis's input is a brush stroke; ours is a wash
  the pattern re-asserts every step.
- **Four pigments,** carried in vec4 channels, bundles mapped round-robin.
- **Pigment lightness has a ceiling.** A Lines palette is chosen to read against
  a near-black background; pale paint on pale paper is nothing at all. Hue and
  saturation carry over untouched.

### The classic pattern as physics

`watercolor/patternField.js` **is** the RorschachCLI dev page's background
shader — five octaves of gradient noise whose third dimension is time (so it
evolves in place rather than scrolling), mirrored in x, thresholded.

Singular, not "ported from". The dev page kept a hand-maintained GLSL copy of
the same shader, and that is exactly how the page and the ink drifted apart: the
same slider names meant different fields, so a look tuned on the page did not
transfer. The page now renders `patternField.js` directly through a small
`WebGPURenderer` quad, and `mapPatternSettings` is the one place friendly knobs
become uniforms. Dev page, scene and CLI cannot disagree.

**Drawn and read are two different reads of the field, and must be.**
`computeField` returns `intensity` (thresholded at the caller's Sharpness — the
blot you see) and `wash` (the same value ramped over `inkPatternSoftness`). The
sim reads `wash`. Sharpness 0.95, the value that makes the drawn blot look like
a Rorschach card at all, maps to a smoothstep band of **0.0026** — a step
function. Feeding that to the sim handed the fluid a hard silhouette as both its
pigment source and its wet mask, so bleed, pooling, edge darkening and
granulation were all mathematically unreachable: Flow could be run from 0 to 1
without changing the picture at all. `inkPatternSoftness` is the width of the
gradient the physics gets, and so how far paint travels — 0.03 holds the
pattern's silhouette with a bled rim, 0.06 is properly painterly, past ~0.2 the
whole sheet washes over.

It is both drawn and read as physics, via these controls:

- **`inkPatternFlow`** — the pattern's gradient contributes to water velocity,
  and its value is the _only_ thing that wets the field. At 0 nothing flows and
  the wash lands as the pattern's own hard edge; as it rises the same blot
  bleeds. This is the wetness knob.
- **`inkPatternWash`** — the pattern deposits its own pigment, into slot 0 so it
  reads as one colour rather than smearing the palette.
- **`inkPatternFade`** — how fast paint is reclaimed. See below; it sets how
  much history the sheet keeps, not how dark it gets.

**Cell pixelation.** A square-grid quantization of the pattern's coordinate, so
the field is constant across each cell and the blot's edges break into blocks
instead of bleeding smoothly. A second, independent Perlin field decides
_where_ — the same reveal idiom as GetWrecked's Torn Open (threshold at
`1 - density`, smoothstep over a fixed 0.12 band). Because the quantization
happens in the field, the ink genuinely lands in cells; it is not a pixelation
filter applied on the way out. Cell coordinates are offset before hashing, since
WGSL cannot hash a negative one — the trap Block Deconstruct documents.

**`inkCellSymmetry` runs the full 0-1, unlike `inkPatternSymmetry`'s 0.5-1.**
The cell _grid_ needs no mirroring of its own: the blot folds on `abs(x)`, and a
grid whose cells straddle x = 0 symmetrically satisfies
`abs(quantize(x)) === quantize(abs(x))`. Only _where_ the pixelation appears is
asymmetric, so that is what the control mirrors — crossfading the reveal field
with its folded copy, not blending `x` toward `abs(x)`, which would flatten the
left half to a constant at every value in between.

`inkPatternSpeed` scales the clock; 0 freezes the field where it stands while
still letting it drive flow and wash.

Both fold into the existing water and suspended passes. **The pattern is baked
into its own target once per _frame_, not per step**, because five octaves of
noise per neighbour tap is far too expensive inline — so a step is still three
passes no matter how many steps a frame runs.

### The wash is a source, not a target

The pattern feeds wet pigment into **suspension only**, so paint has to travel
through the fluid to reach the paper — that trip is where bleed, edge darkening
and granulation come from. Separately, every cell loses a fixed **fraction** of
its pigment per step (`inkPatternFade`), uniformly, so decay cannot encode the
pattern's shape.

This was a per-cell servo: measure `pattern - (suspended + deposited)` here and
correct it every step, draining both layers where a cell held more than the
pattern asked for. It held the sheet exactly to the pattern's silhouette, which
meant it undid the fluid sim's entire job — pigment carried past the edge was
removed on arrival, pigment carried out of a cell was topped straight back up.

Decay still does what the drain was there for. The pattern evolves, so an
add-only wash paints the union of every position it has drifted through and
fills to a solid mass in about ten seconds (measured: pigment/cell 0.06 → 0.60);
a fractional decay gives paint a finite lifetime, so old positions fade while the
current one is re-supplied. It has to reach the deposited layer too — pigment
settles out of suspension within a few steps, so anything touching only
suspended pigment finds nothing left to take.

Rates are chosen so `inkPatternWash` keeps its meaning: a cell decays by
`fade * dt` and gains `pattern * wash * maxConcentration * fade * dt`, so the
steady state is exactly the servo's old target, **reached rather than enforced**.
Note a still has no drift problem at all — it pins the clock — so low Fade plus a
long `--inkSettle` is the deep, heavily bled still, and the live scene wants
more.

Two more things that bit during implementation:

- **The dev page's friendly knobs are not the shader's uniforms.** Density and
  Sharpness go through curves (`mapPatternSettings`, reproduced exactly) —
  Sharpness 0.95 maps to a threshold width of **0.0026**, a hard two-tone edge.
  Feeding 0.95 straight in makes the pattern a soft gradient that washes the
  whole sheet instead of a blot.

### The palette on the wash

The wash used to go entirely into pigment slot 0, so a blot was one flat colour
no matter what palette the test carried. It is now split across all four slots
by a low-frequency field baked into the pattern target's `z` channel, so the
sheet divides into broad regions of each palette colour — one wash is one colour
over a good span of paper, the way a loaded brush behaves.

- **The weights are a partition of unity.** Overlapping linear tents centred on
  0, 1/3, 2/3 and 1; at that spacing and width they sum to exactly 1 for any t.
  That keeps total pigment — and so the blot's density — independent of which
  colour a region lands on. Weights that did not sum to 1 would read as the
  palette field modulating opacity: a brightness stain over the whole picture
  that no control could remove.
- **Where two tents overlap the sim carries both pigments in the same cell,** and
  Kubelka-Munk mixes them subtractively in the colour node. Blue over magenta
  goes violet because that is what the paint does, not because anything lerped
  two swatches.
- **`inkPaletteSymmetry` folds the colour field on abs(x),** like the blot. A
  Rorschach is a folded sheet: the paint that transfers to one half is the paint
  that was on the other, so at 1 both halves carry the same colours. Below that
  each half takes its own path through the palette while the silhouette stays
  mirrored — the most useful asymmetry the scene has, since it breaks the fold
  without touching the shape that makes the image read as a Rorschach at all.
  Crossfaded between the two sampled values, exactly as `inkCellSymmetry` is,
  and for the same reason: blending the coordinate from x toward abs(x) instead
  collapses the left half to a constant at every setting in between.
- **`inkCellFlatten` decides whether a pixelated cell is one flat colour.** Only
  the pattern's _amount_ is quantized, so by default the palette field runs
  through a cell unquantized and every block comes out internally graded —
  measured at ~14% of a channel's range across a single cell. That reads as
  painterly blocks; a pixel is one flat colour. It works by contracting the
  sample coordinate toward its own cell centre rather than flattening the
  result, which makes the control continuous — at 0.5 the within-cell variation
  is simply halved. Safe here in a way the symmetry controls are not: a
  coordinate lerped toward its quantized self is monotonic and collapses
  nothing, whereas lerping x toward abs(x) would flatten a whole half of the
  sheet. Scaled by `reveal`, so only pixelated regions go flat.
- **`inkPaletteMix` 0 returns to the single-pigment behaviour**, which is also
  what a `monochrome` test produces anyway — all four slots hold the same colour,
  so there is nothing to spread.
- **The four slots must span the whole style run.** They used to take the first
  style in each round-robin residue class, so on a six-bundle test they reached
  gradient positions t = 0, 0.2, 0.4 and 0.6 and the last 40% of every palette
  was unreachable by the ink while the Lines layer showed it in full.
- **Ink pigment keeps a lightness ceiling**, and the reason changed with the
  sheet. It is no longer about paint reading against pale stock; it is that both
  layers now draw from one palette, and lines at the same hue and lightness as
  the wash vanish into it exactly where they cross — which is where the
  composition wants them most.

### Bloom on the ink

`kubelkaMunkReflectance` returns a _reflectance_ — the fraction of light coming
back — so it is bounded at 1 by construction. The scene's bloom threshold sits
just above what a non-emissive stroke reaches, which means the ink could never
cross it no matter what: the pass was always willing, the values simply could
not get there. Dropping the threshold works and is the wrong lever, because
there is one bloom pass for the whole scene and every stroke would bloom with
it.

`inkBloom` pushes the ink's own output past 1 instead — the same idiom
`TestStrokes` uses for emissive bundles, so ink and lines glow independently
against one shared threshold. Neither path has a real emissive channel; both
materials are unlit, and "emissive" here only ever meant an untonemapped colour
driven past the threshold.

**The threshold is on _luminance_, which is a hue bias worth knowing about.**
`BloomNode` high-passes on `luminance(rgb)` with the working space's
coefficients — 0.2126 / 0.7152 / 0.0722. So what blooms depends on hue as much
as on how hard it is pushed. At an emissive intensity of 5:

| colour           | luminance | at threshold 1   |
| ---------------- | --------- | ---------------- |
| green `#00ff00`  | 3.58      | blooms hard      |
| yellow `#ffff00` | 4.64      | blooms hard      |
| red `#ff0000`    | 1.06      | only just clears |
| blue `#0000ff`   | 0.36      | **never blooms** |

That is a ~10x spread, and it is why a red emissive bundle at intensity 5 glows
while a blue one at the same setting does nothing. **The Lines layer still has
this**; its intensities are hand-tuned per bundle and changing it would move
every preset that uses one.

The ink does not. A flat multiply would have inherited the whole bias — on a
dark blue palette the ink would refuse to glow while a pale one glowed easily,
at identical settings — so `inkBloomStrength` instead solves for the gain that
lands the colour's luminance a fixed distance _past_ the threshold. It is an
absolute distance, not a multiplier, which is why its useful range is ~0-1 and
not ~0-6.

**Weighted, never flat.** A uniform multiply is a brightness slider and washes
the blot out — which is what preset 010's old `bloomEnabled: false` note was
complaining about, back when there was still a sheet of paper under it.
`inkBloomSource` chooses what drives it:

- **thickness** — dense cores glow, thin bled edges stay matte. Follows the
  painting, and works whatever the water is doing.
- **wetness** — still-wet paint glows and dried paint goes matte, so the blot
  reads as alive where it is wet. Free, since the sim already tracks saturation,
  but it needs `inkPatternFlow` above 0 to have anything to glow.

**`inkBloomEmissiveOnly` is what makes the ink agree with the strokes.** The
Lines layer glows per _bundle_ — only the ones marked emissive. Without the same
rule the entire blot lights up the instant Ink Bloom is switched on, while the
strokes beside it glow for one bundle: the same palette obeying two different
rules in one frame.

`pigmentsFromStyles` already carries each bundle's `emissive` flag and
intensity into its pigment slot, so the sim can weight the lift by how much of
the paint in a cell came from an emissive bundle. Mass-weighted, so a cell
holding mostly non-emissive pigment barely glows even when a trace of an
emissive one has drifted into it. Intensity carries too, normalised against
`testGenerator`'s default of 2 — a bundle left at the default lifts the ink by
exactly `inkBloomStrength`, one pushed to 5 lifts it 2.5x further, the same
ordering the strokes show.

Turn it off and the whole blot glows, which is the older behaviour and still
useful when the ink is running without lines at all.

The scene's own `bloomEnabled` still has to be on; `inkBloom` only decides
whether the ink reaches the threshold. And with Emissive Only on and no bundle
marked emissive, Ink Bloom does nothing at all — which is exactly what the
strokes do, and is the point rather than a fault. `bloomEnabled` folds into the weight
rather than gating the branch, so that at 0 the target is the colour's own
luminance and the gain is exactly 1 — otherwise "off" would still lift dim ink
all the way up to the threshold.

### Reading the ink as a layer behind the lines

Both layers draw from one palette, so without help they render the same colour
and the line work is swallowed by the wash exactly where it crosses it — which
is where the composition wants it most. Three controls separate them, and the
first two are the ones that matter.

**`inkTonalGap` guarantees the layers never match.** This was a one-sided clamp
on pigment lightness at 0.5, which only bit when a palette stop was _lighter_
than that. Most are not: Midnight 15 — the palette in preset 012 — has 11 of its
15 stops at or below 0.5, Deep Space has 2 of 2. On those the clamp did nothing
whatever and the ink came out identical to the lines. The gap pushes the ink
away from the line's lightness instead: darker by preference, since ink under
line reads as the denser layer, and lighter only when the palette is already on
the floor with no room below. Hue and saturation carry over untouched.

**`inkRecede` and `inkDesaturate` are atmospheric perspective.** The far layer
loses chroma and settles toward the colour of the air between. Be honest about
which half does what: `recede` mixes toward the backdrop, and since the ink is
alpha-composited over that same backdrop, that half behaves much like lowering
its opacity. `desaturate` is the part that genuinely reads as _distance_ rather
than as transparency, and it is the stronger cue of the two — a wash that has
lost its chroma sits behind saturated line work even at equal value.

Both are applied before the bloom lift, so a receded ink also glows less;
pushing something back and then making it burn brighter reads as neither.

None of the three are rollable. They are legibility, not stylistic variation: a
batch wants its layers readable for the same reason every frame of it does.

### Depth state on the ink

`depthWrite: false`, `depthTest: true`. Depth is written per fragment whatever
the alpha is, and the ink is one large quad that is mostly empty — so writing
depth lays an invisible occluder across the entire sheet and clips any stroke
drawn afterwards behind it. Back-to-front sorting hides this whenever the two
layers are cleanly separated in depth, which is what makes it nasty: it only
appears once the sheet intersects the test, and then it silently eats geometry.
Measured with a horizontal sheet cutting through an unflattened test: 15,888
pixels changed, and the strands below the plane came back.

Tested against, though, so strokes genuinely in front of the sheet still occlude
it. `TestStrokes` keeps `depthWrite: true` for the opposite reason — strokes are
thin geometry with no large empty region, and writing depth is what stops them
blending into mush.

### Traps this code has already fallen into

Every one of these presented as "the controls don't work":

- An **opaque `NodeMaterial` forces output alpha to 1**, corrupting the fourth
  channel of every field — the wet mask, and the fourth pigment. Sim passes must
  be `transparent: true` with `NoBlending`.
- **Advection must pair each face with its own cell's velocity.** Reading the
  right neighbour's `u` for the right face stops the scheme conserving pigment.
- **A constant tuned against a thresholded field is not tuned at all.** The
  pattern-gradient velocity source carried a bare gain of 8, survivable only
  because the field it read was a step: the gradient was zero everywhere except
  one cell, so the term almost never fired. Handed the soft field it fired along
  the whole blot edge, drove velocity into its ±0.9 clamp, and formed a shock at
  the convergence contour **within three steps** — a crisp bright wire tracing
  the blot, measurably ~80% above its neighbours. The gain is now scaled by
  Softness, since the gradient's magnitude goes as 1 / the ramp width; that
  makes the push scale-free and keeps it inside the clamp (ridge pixels: 7616 →
  0).
- **A TSL node built in one helper may not survive being handed into another.**
  The palette field originally took `computeField`'s `reveal` as an argument.
  The graph built fine and the Node smoke test passed; the generated WGSL came
  out referencing `unresolved value 'null'`, the pass failed to compile, and the
  symptom was a **blank sheet** rather than anything resembling an error in the
  graph. Bisecting showed the `mix()` and the uniform were both fine and only
  the passed-in node was at fault. Computing the palette inside `computeField`,
  where `reveal` already lives, fixes it. This is precisely the gap the Node
  smoke test documents — codegen errors only surface on a real rendered frame —
  so a headless graph build is not evidence that a pass compiles.
- **Diagnose which field an artifact lives in before theorising about it.** That
  wire cost three plausible, well-argued and completely wrong fixes — ramping
  the wet mask, adding pigment diffusion, replacing a `max()` with relaxation —
  none of which moved it. Two cheap experiments identified it immediately:
  `--inkPatternFlow 0` took the ridge to zero (so: velocity-driven), and
  `--inkSettle 3` showed it already fully formed (so: not accumulation). Note
  the diffusion attempt was _also_ gated on the wet mask, which is ~0 at exactly
  the cells that were piling up — a fix switched off precisely where it was
  needed.
- **Every field must be cleared at construction.** A render target that has
  never been written has no GPU texture at all — `readRenderTargetPixelsAsync`
  throws on its missing descriptor — and sampling one gives undefined contents.
  That reads as fully saturated pigment across the whole sheet, so the scene's
  first frames show solid ink colour draining away, which looks exactly like the
  ink and background colours being swapped. The headless renderer never hit it
  because it resets and settles before its first render.
- **Never render-gate a Leva folder on a toggle** (see also
  `buildBundleOverrideSchema`): the folder unmounts, and a preset that sets the
  gate and the fields inside it in one `setControls()` call has those updates
  silently dropped.

## Breathe videos

`--mode breathe` holds one test and one view still and lets the classic pattern
evolve underneath it — the picture changes because the field driving the ink is
changing. It only means anything with `--ink`.

```sh
npm run rorschach:video -- \
  --mode breathe --ink --no-lines \
  --seed 12345 --hold 8 --fps 30 \
  --inkPatternWash 0.9 --inkPatternFlow 0.2 --inkPatternSpeed 1 \
  --out output/rorschach-breathe.mp4
```

Every frame rebuilds and re-settles the sim from a clean sheet at that frame's
pattern time. That costs a full settle per frame, and it is deliberate: each
frame becomes a pure function of (seed, patternTime), so a clip is reproducible
and a dropped frame cannot desynchronise the rest. It also means the _fluid_ is
not continuous between frames — only the pattern is — which is why the wash
being target-seeking matters, since it makes each frame converge to its own
pattern rather than depend on the previous one.

## Enforcement

Prose doesn't hold a boundary on its own, so three of these rules are checked:

- **`.eslintrc.json`** — a zone keeping React/R3F/Leva/scene imports out of the
  kernel, and zones keeping the scene and the dev tool on the barrel. Note
  ESLint overrides _replace_ a rule rather than merging it, so each of those
  entries restates the patterns it inherits; add to them rather than adding a
  new override for the same files.
- **`npm run rorschach:check`** — kernel purity, `renderOptions.mjs` staying
  dependency-free, every `kernel.x` the headless renderers call being a real
  barrel export, and every workbench field naming a real option. That third
  check is the one that earns its keep: those calls are runtime property
  lookups that nothing else catches until a render fails.
- **`npm run build`** — resolves the scene's imports.

`rorschach:check` covers option coverage in _both_ directions. The reverse
direction is the one that caught something real: eleven ink and pattern options
shipped with no workbench control at all, so they were CLI-flag-only and
untestable from the dev page, and a check that only verified workbench fields
name real options never noticed. Options the job runner owns rather than the
operator (`in`, `stillsOut`) are marked `cliOnly` in the schema.
