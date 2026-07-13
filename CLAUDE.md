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
