<!-- Copilot instructions for contributing AI agents to the Eye Candy repo -->

# Eye Candy — Copilot Instructions

These instructions give an AI coding agent the immediately useful knowledge to work productively in this repo.

**Big Picture**

- **What:** A React app using react-three-fiber + Three.js for WebGL experiments (scenes, shaders, GPU sims) and art projects.
- **Structure:** Scenes live in `src/components/scenes/*`. Shared UI + orchestration live in `src/app/*` (see `useAppScenes` to find how scenes are chosen and mounted).
- **Runtime flow:** `src/main.jsx` mounts `src/app/App.jsx`. `App` uses `useAppScenes()` which returns `CanvasWrapper` and the active `SceneComponent`.

**Key files & where to look**

- `package.json`: npm scripts (dev, build, lint, format, publish to gh-pages).
- `src/main.jsx`: app entrypoint.
- `src/app/App.jsx`: top-level renderer + overlay usage.
- `src/app/scaffold/hooks/useAppScenes.js`: scene selection and renderer configuration.
- `src/components/scenes/*`: individual scenes (default-export components). Example: `FluidTest/FluidTest.jsx` and `FluidMaterial.jsx` (shader-heavy).
- `public/`, `build/`, `src/models/`: static assets and prebuilt output.

**Dev commands (use these in examples and task work)**

- Start dev server: `npm run dev` (alias: `npm start`).
- Start HTTPS dev server: `npm run start-https`.
- Build: `npm run build`.
- Preview build: `npm run preview`.
- Lint (check/fix): `npm run lint:check` / `npm run lint:fix`.
- Format (check/fix): `npm run format:check` / `npm run format:fix`.
- Publish to GitHub Pages: `npm run publish` (runs build then `gh-pages`).

**Dev server process ownership (critical)**

- Assume the human developer owns the active dev server process.
- Do **not** run `npm run dev`, `npm start`, `npm run start-https`, or any long-lived serve/watch command unless the user explicitly asks you to do so in this chat.
- Do **not** kill, restart, or replace existing dev servers (including port-kill commands like `lsof`/`kill`, `pkill`, `killall`, or equivalents).
- If verification is needed, prefer non-server commands first (`npm run build`, targeted lint/format, static checks, and code inspection).
- If a running server seems required, ask for confirmation and expected port/process ownership before starting anything.
- If you accidentally started a background server, report it immediately and provide the exact process/terminal details so the user can decide what to do.

**Scene conventions (required — read first)**

- `docs/scene-conventions.md` is the source of truth for scene/component/model/shared-code structure (folder layout, naming, file size, memoization, no cross-scene imports, models→`elements`, presets, CameraRig, asset preloading, post-processing-last). Follow it exactly. The summary below is context only; the doc governs.
- **Do not edit a scene's `todo.md` unless the user explicitly asks you to.** It has a fixed structure (title, back-link to the root `TODO.md`, standard `# // Section` headings) — don't add a section logging what you implemented, and don't touch the back-link or existing content as a side effect of a code change. See `docs/scene-conventions.md` §15.
- **When given a reference (a repo, file, or example) to port in, port the actual mechanism it demonstrates.** Don't decompose it into parts and substitute a smaller or different subset while calling it a port of the reference. If something can't or shouldn't be ported 1:1, say so and ask before implementing — never decide unilaterally and hand back a substitute.
- **Comments: default to none.** Code should read clearly enough to not need narration. Only comment a genuinely non-obvious WHY (a hidden constraint, a workaround for a specific bug, a subtle invariant) — never WHAT the code does, and never multi-line/paragraph comment blocks.

**Project-specific conventions & patterns**

- Scenes are React components that usually default-export a component (see `src/components/scenes/FluidTest/FluidTest.jsx`). Expect cameras (drei), mesh + custom materials, and hooks for interaction.
- Shaders are often inlined as template strings inside material files (e.g., `FluidMaterial.jsx`). Treat them as code owned by the component — edits should preserve GLSL invariants.
- Shared “scaffold” code handles canvas setup, Leva debug panels, and loading UX. Avoid duplicating canvas setup; prefer `useAppScenes` / `CanvasWrapper`.
- Leva is used for runtime tweakable controls (`src/app/scaffold/leva/*`). Follow existing param shapes when adding controls.
- Use three/react-three idioms (hooks from `@react-three/fiber`, helpers from `@react-three/drei`, and postprocessing via `postprocessing` wrapper libs).

**Leva controls, presets and local-dev helpers**

- Prefer encapsulating scene controls in a `useXControls` hook that uses `useControls` + `folder` from `leva` (see `src/components/scenes/PaperStack/usePaperStackControls.js`).
- Prefer human-friendly labels for Leva controls so UI labels stay readable while code keeps stable internal values.
- Provide a `Presets` folder with an options control (string `options: Object.keys(MY_PRESETS)`) plus a `reset` `button()` to reapply the currently-selected preset via `setControls(preset)`.
- Keep a small snapshot/ref of the current control values (e.g., `controlsSnapshotRef`) so the `copy` button can serialize them.
- Expose a `copy` button only in local dev (guarded by a helper like `localEnv()` in `utils/appUtils`) that writes a neat object-literal to the clipboard. PaperStack shows an example:
  - File: `src/components/scenes/PaperStack/usePaperStackControls.js` — uses `button`, `folder`, `useControls`, `setControls`, `navigator.clipboard.writeText(...)` and `localEnv()`.
  - File: `src/components/scenes/PaperStack/PaperStack.jsx` — consumes the config hook and shows how materials and scene logic read from `config`.
- For the clipboard format: JSON-stringify the snapshot, pretty-print, then (optionally) replace quoted object keys with unquoted identifiers to create a paste-friendly object literal for quick copy/paste back into the IDE (see the regex used in PaperStack).

**Integration points & external deps**

- `three`, `@react-three/fiber`, `@react-three/drei` — 3D rendering.
- `leva` — developer controls panels.
- `@mediapipe/*`, `@strudel.*`, `@sparkjsdev/spark` — optional ML/audio/visual libs used by some scenes; inspect individual scene code before refactoring.
- Build & dev powered by Vite (`vite.config.js`).

**Examples & small recipes**

- Add a new scene: create `src/components/scenes/MyScene/MyScene.jsx` default-exporting the component, add any controls under that folder, then register or ensure `useAppScenes` will pick it up (it auto-discovers scene modules in the scaffold).
- Edit a shader: edit the shader string in the material file (e.g., `FluidMaterial.jsx`), run `npm run dev`, open the browser console — shader compile errors surface there.

**Linting & formatting expectations**

- ESLint with Airbnb + Prettier is enforced. Run `npm run lint:check` during task work when relevant. Use `npm run lint:fix` and `npm run format:fix` for auto-fixes.

**What to avoid / common pitfalls**

- Do not move canvas setup out of the scaffold.
- Be careful when editing shader code: GLSL errors crash the shader; prefer incremental edits and local dev testing.
- Don't assume tests exist — there are no unit tests in the repo; rely on local dev server and visual checks.

**Performance & FPS (important)**

- This is an art/graphics project — scenes, components, shaders and controls must be optimized for high frame rates (target 60fps).
- Canonical performance guidance lives in `docs/r3f-performance-playbook.md`.
- Scene/material/shader changes must satisfy `docs/scene-performance-checklist.md`.
- Keep this file as a thin wrapper for context and examples; avoid duplicating detailed performance rules here.

**Where to look for examples**

- `src/components/scenes/FluidTest/FluidMaterial.jsx`: GPU simulation + multiple shader passes; a reference for render-to-texture patterns and performance tradeoffs.
- `src/components/scenes/FluidTest/FluidTest.jsx`: input handling and pointer-to-sim wiring — shows how to minimize event work and pass compact pointers to the material.
- `src/components/scenes/PaperStack/*`: demonstrates using `useMemo` for geometries/materials and careful use of Leva-controlled parameters.
- `src/app/scaffold/hooks/useAppScenes.js`: centralized renderer/canvas configuration — changes here affect all scenes' performance characteristics.

Follow these guidelines strictly when touching shaders, scene loops, or adding new controls to avoid regressions in runtime frame rate.

For agent prompt snippets, use `docs/agent-snippets.md`.

If anything here is unclear or you'd like more examples (e.g., how scenes register with `useAppScenes`), tell me which area to expand and I'll update this file.
