# Scene Conventions (Required)

Single source of truth for how scenes, components, models, and shared code are
structured in this repo. Applies to humans and AI agents (Claude, Copilot).

Pairs with:

- `docs/r3f-performance-playbook.md` — performance guidance.
- `docs/scene-performance-checklist.md` — required perf checklist.

`src/components/scenes/Template/SceneTemplate/` is a working bootstrap: copy the
folder to start a new **WorkInProgress** scene. It already wires in the four
things every WIP/Showcase scene needs (§13) — a presets folder, CameraRig,
MediaRecorder, and the overlay-button pattern — plus memoization. Its
`Component`/`getComponentControls` are intentionally empty stubs for you to
flesh out; everything else is real, running code.

For a fully fleshed-out example of the same patterns in a finished scene, read
`src/components/scenes/Showcase/WebGL/PaperStack/`.

---

## 1. Scene folder structure

Each scene is a self-contained folder under
`src/components/scenes/<Maturity>/<Renderer>/<SceneName>/`, where:

- `<Maturity>` ∈ `Template | TestLab | ToolBox | WorkInProgress | Showcase`
- `<Renderer>` ∈ `WebGL | WebGPU | shared`

Internal layout:

```
SceneName/
  SceneName.jsx            ← root, default export, orchestrator only
  components/              ← child components (+ colocated getXControls.js)
  hooks/useSceneControls.js
  presets/presets.js
  utils/sceneUtils.js
  todo.md
```

## 2. The scene is an orchestrator

- `SceneName.jsx` orchestrates: it wires children together and reads config from
  `useSceneControls`. It should not contain large amounts of scene logic itself.
- Scene logic lives in the child components, hooks, and utils it composes.
- Maintain **strong separation of concerns** and **good React design patterns**
  throughout (lift state appropriately, keep boundaries stable, derive don't
  duplicate).

## 3. Naming

- **Never prefix files, variables, consts, exports, etc. with the scene name.**
  Inside `Prayer/`, it's `useSceneControls.js`, not `usePrayerControls.js`; a
  const is `clusterCount`, not `prayerClusterCount`. The folder already provides
  the namespace.

## 4. File size — optimize for one-shot reads

- Keep every file small enough that an agent (or human) can read it **in a single
  pass** rather than paging through chunks — iterative chunked reads waste tokens
  and context.
- Practical signal: if a file is pushing past **~200 lines**, that's the cue to
  split it along its natural seams (extract a component into `components/`, a hook
  into `hooks/`, helpers into `utils/`). It's a guideline, not a hard gate — favor
  meaningful boundaries over hitting a number.

## 5. Memoization

- **Every component is memoized** (`React.memo` / `memo`) to prevent needless
  re-renders. The failure mode this prevents: changing a control for entity X
  causes unrelated entity Y to re-render. Verify boundaries hold.

## 6. No cross-scene imports

- A scene **never reaches into another scene's folder** for code.
- If code needs to be shared, **promote it** to a generic location:
  - hooks → `src/hooks`
  - components → `src/components/...` (e.g. `rigging`, `elements`)
  - utils → appropriate shared util location
- Tightly-coupled, highly-reused code becomes a **module** under `src/modules/`.
  Precedent: `src/modules/ecctrl` (a complete character-controller: components +
  hooks). A tightly-coupled control-builder + component pair (e.g. CameraRig and
  its controls builder) is a candidate to promote into a module.

## 7. GLTF models → elements

- Repo convention for a `.glb`/GLTF model:
  1. Add the file to `public/models/`.
  2. Create a corresponding component in `src/components/elements/<ModelName>/`
     (or `<ModelName>.jsx`) that wraps it for scene use.
- **Scenes reuse models from their generic `elements/` location.** Do not fork a
  model's mesh/material handling into a scene.
- **Customization flows from the model outward, not the other way:** if a scene
  needs a custom variant (e.g. a Femur with a custom material), first add support
  to the element file — extend an existing export with props, or add a new export.
  Then create a thin wrapper in the scene's `components/` that consumes that
  generic and passes the customization in.

## 8. Renderer-agnostic generic components

- When building a generic component, expose **one component that internally
  detects the render type (WebGL vs WebGPU)** and renders the appropriate
  variant. This lets the component be dropped into any scene without the consumer
  thinking about renderer type. Example target: a smoke/particle sim generic
  enough to drop into either scene type.

## 9. Controls & presets

- Encapsulate scene controls in `hooks/useSceneControls.js` using `useControls` +
  `folder` from Leva. Colocate per-component control schemas as
  `components/getXControls.js`.
- Use **human-friendly Leva labels**; keep stable internal values.
- Scenes should generally use the **presets hook** so multiple presets and
  control resets work. Preset keys match the Leva schema **1:1** — flat,
  globally-unique keys, no reshaping between preset and schema. This 1:1 mapping
  is what prevents drift between presets and controls and the runtime
  control-set failures (`setControls` silently no-op'ing on unmatched keys) that
  drift causes.
- Provide a `presets/` control with `options: Object.keys(PRESETS)` plus a `reset`
  `button()` that reapplies the selected preset via `setControls`.
- Provide a dev-only `copy` button (guarded by `localEnv()` from
  `utils/appUtils`) that serializes a `controlsSnapshotRef` to a paste-friendly
  object literal.

## 10. Camera

- Scenes should generally use **`CameraRig`** (`src/components/rigging/CameraRig.jsx`)
  and its controls builder (`src/hooks/buildSceneCameraControls.js`) for maximum
  camera flexibility, rather than hand-rolling camera setup.

## 11. Asset preloading

- **Always preload assets** (models, textures, HDRs, audio). Scenes must be ready
  before the loader screen reveals them — no pop-in, and good perf.

## 12. Post-processing comes last

- **Leave post-processing out until the layout and performance are largely
  settled.** Agents tend to slap Bloom on everything, which slows the browser and
  makes scene construction harder to iterate on (you trip over the effect).
- Exceptions: scenes built _around_ an effect (e.g. GodRays), or cases where
  enabling post early drove a discovery (e.g. Aisle9 posterization). If post is
  introduced early, it should generally ship **disabled** by default.

## 13. Required WIP/Showcase scene shape

Every **WorkInProgress** and **Showcase** scene wires these four things
through `useSceneControls` (not required for ToolBox/TestLab — drop what
doesn't apply):

1. **Presets folder** — variations of the scene, applied via
   `usePresetsFolder` (`src/hooks/usePresetsFolder.js`). See §9.
2. **CameraRig + camera controls** — `<CameraRig camera={config.camera} />` in
   the scene root, fed by `useSceneCameraControls`
   (`src/hooks/useSceneCameraControls.js`) for fine-grained camera behavior
   (useful for screen recording). See §10.
3. **MediaRecorder** — `useMediaRecorder({ fileName })` from
   `src/modules/mediaRecorder`, called once inside `useSceneControls`. It
   self-registers its own Leva controls and hotkeys (screenshot + start/stop
   recording) — internalizes screen rec instead of relying on the device's
   own capture. Nothing else needs to run it.
4. **Overlay buttons (when the scene needs obvious, user-facing controls)** —
   compose `SceneButtonBar` + `OverlayIconButton`
   (`src/app/scaffold/overlay/components/`) in a scene-local
   `components/ButtonOverlay.jsx`. These are the buttons a visitor is meant to
   see and use (e.g. mic/screenshare toggles) — the reverse of the Leva panel,
   which is the hidden dev-controls panel only reachable if you know to click
   the reversal. Give `datasetKey` a scene-unique value. Example:
   `WorkInProgress/WebGPU/HorsesForCourses`.

`Template/SceneTemplate/` has all four wired in — copy it to bootstrap a new
WIP scene.

---

## Scaffold & process (do not violate)

- Never duplicate canvas/scaffold setup into a scene — it lives in
  `src/app/scaffold/*`, wired via `useAppScenes` / `CanvasWrapper`.
- The human developer owns the dev server. Do not start, kill, or restart it.
- ESLint (Airbnb) + Prettier are enforced: `npm run lint:fix`, `npm run format:fix`.
