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
