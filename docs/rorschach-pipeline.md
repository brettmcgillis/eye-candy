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
| Ink settles by step count        | The scene advances the sim a few steps per frame, so a blot keeps developing while you watch. A still runs `--inkSettle` steps from a clean sheet, which is what makes a seed reproducible rather than time-dependent. |

## Growth videos

The `growth` video mode renders a sequence of fully independent tests, each
revealed from 0% to 100% over the requested number of seconds with a fixed
view. For example, five tests growing for three seconds each:

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

## The ink layer

`src/modules/rorschach/watercolor/` is Curtis et al., "Computer-Generated
Watercolor" (SIGGRAPH 1997): a shallow-water fluid layer, a pigment-deposition
layer, a capillary layer in the paper, and Kubelka-Munk compositing. The ODE
trajectories are the brush. Toggle it with `--ink` / the **Ink** control folder;
`--no-lines` leaves the blot alone on the paper.

It is built as fullscreen ping-pong render passes rather than compute kernels
because depositing pigment is a scatter — thousands of overlapping brush stamps
landing in one cell — and an additive draw is the only way to accumulate that
without atomics. That single constraint decides the whole file layout.

Three deposition modes, all producing the same kind of stamp list and differing
only in stride, width and strength: `brush` deposits each step as it grows (so
the blot blooms with Lines' own growth), `stamp` lays the finished trajectory
down at once and lets it bleed, `wash` uses sparse wide weak stamps that read as
poured colour.

### Deviations from the paper

Each of these is deliberate. Do not "correct" one back toward the paper without
re-checking the output — every one of them was arrived at from a visible defect.

- **Viscosity sign.** The paper prints `u += ∆t(A − µB − ...)` with `B` the
  Laplacian. With a minus sign the term is anti-diffusive and the field diverges
  within a few dozen steps; this uses `+µ∇²u`.
- **Jacobi, not Gauss-Seidel.** A fragment pass cannot read a neighbour's
  updated value inside one iteration. More iterations, same fixed point.
- **The grid is staggered in collocated storage.** A cell's `u` is the flux
  through its right face and its `v` through its top face. Storing them
  collocated _and treating them as collocated_ decouples odd and even cells, and
  the checkerboard mode that follows shows up as a fine diagonal hatch across
  the whole blot — this was a real bug, not a theoretical one.
- **A concentration ceiling and velocity clamps.** Curtis's input is a brush
  stroke; ours is thousands of stamps along retraced trajectories, which without
  a ceiling hands the sim values four orders of magnitude past what the transfer
  terms are conditioned for.
- **Four pigments.** Concentrations ride in vec4 channels, so bundles map onto
  four slots round-robin and bundles sharing a slot share a paint.
- **Pigment lightness is remapped.** A Lines palette is chosen to read against a
  near-black background — a typical test is pale strokes on black, which is
  invisible on paper. Hue and saturation carry over untouched; only lightness is
  pulled into the range a real paint occupies.

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
