# Eye Candy — Agent Guide

React + react-three-fiber + Three.js playground for 3D/shader/GPU-sim experiments
and art projects. WebGL and WebGPU scenes.

## Required reading before touching scenes

- **`docs/scene-conventions.md`** — how scenes, components, models, and shared
  code are structured. This is the source of truth; follow it exactly.
- **`docs/scene-performance-checklist.md`** — required perf checklist for any
  change touching scenes, materials, shaders, controls, loading, or postprocessing.
- **`docs/r3f-performance-playbook.md`** — performance guidance (target 60fps,
  mobile-first).

Canonical scene layout to copy: `src/components/scenes/Template/SceneTemplate/`.

## Orientation

- Scenes: `src/components/scenes/<Maturity>/<Renderer>/<SceneName>/`.
- Reusable model wrappers: `src/components/elements/<ModelName>/`.
- Shared hooks: `src/hooks/`. Promoted modules: `src/modules/` (e.g. `ecctrl`).
- Scaffold (canvas, Leva, loading): `src/app/scaffold/*`, wired via `useAppScenes`.
- Entry: `src/main.jsx` → `src/app/App.jsx`.

## Process

- The human developer owns the dev server — do not start, kill, or restart it.
- No unit tests; rely on the live dev server and human-in-the-loop visual checks.
- Lint/format are enforced: `npm run lint:fix`, `npm run format:fix`.
- A scene's `todo.md` is **read-only unless the user explicitly asks you to
  update it** — don't add sections logging what you built, and don't touch its
  back-link or existing content as a side effect of implementing something.
  See `docs/scene-conventions.md` §15.
- **When the user gives you a reference (a repo, file, or example) to port
  in, port the actual mechanism it demonstrates.** Don't decompose it into
  parts and substitute a smaller or different subset while calling it a port
  of the reference. If something can't or shouldn't be ported 1:1, say so and
  ask before implementing — don't decide unilaterally and hand back a
  substitute for the user to discover isn't what they asked for.
- **Comments: default to none.** Code should read clearly enough to not need
  narration. Only comment a genuinely non-obvious WHY (a hidden constraint, a
  workaround for a specific bug, a subtle invariant) — never WHAT the code
  does, and never multi-line/paragraph comment blocks.
