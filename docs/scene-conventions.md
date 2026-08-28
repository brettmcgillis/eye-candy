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
`src/components/scenes/WebGL/PaperStack/`.

---

## 0. Where code lives — depth means specificity

Four rules govern placement. They apply to **code and to data (presets) alike**.

1. **Generality decreases with depth.** The closer to `src/`, the more reusable
   and generic a thing must be. `src/utils/math.js` is used everywhere;
   `WebGPU/Aisle9/utils/sceneUtils.js` is used by exactly one scene. If
   something at root serves only one consumer, it belongs deeper. If something
   deep is being reached for by several consumers, promote it (§6).
2. **Dependencies point rootward.** A deeper module may import a shallower one;
   the reverse is a layering inversion. A file in `src/hooks/` must not import
   `src/hooks/someCluster/detail.js`, and nothing in `src/components/` should
   reach into `src/app/` — `app/` is the shell, and it consumes components, not
   the other way round.
3. **Import a module through its barrel, not its internals.** `@modules/ecctrl`,
   never `@modules/ecctrl/stores/useGame`. The barrel is the module's public
   surface; reaching past it couples callers to internal layout and blocks
   refactors. A module's own files import each other relatively, never through
   their own barrel (that's a cycle).
4. **Scenes never import from other scenes** — see §6. In particular, a
   Showcase or WIP scene must not import from a Test Lab or Toolbox scene.
   Those two areas exist to _explore_ (`testlab`) and to _author_ (`toolbox`);
   what they produce reaches scenes by being **promoted to a shared location**,
   not by being imported across the scene tree.

`src/presets/` is the worked example of rule 4 done right: the fire/smoke/spline
preset library is authored by the FireTest, HotBox, and SplineEditor toolbox
scenes, aggregated at root, and consumed by ordinary scenes — a rootward
dependency, not a scene-to-scene one. Individual preset files there are
scene-named but genuinely shared, since each is an entry in a browsable library
(and the Save Preset middleware requires them to resolve under `src/presets/`).

### Root buckets

| Bucket                                         | Holds                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `src/utils/`                                   | pure, dependency-light helpers                                       |
| `src/hooks/`                                   | generic React hooks                                                  |
| `src/modules/`                                 | tightly-coupled clusters behind an `index.js` barrel                 |
| `src/components/elements/`                     | reusable visuals — GLTF wrappers (§7) and generic non-GLTF visuals   |
| `src/components/materials/`, `postprocessing/` | shared materials / post passes                                       |
| `src/presets/`                                 | shared authored data (see above)                                     |
| `src/app/`                                     | the application shell — imports from everything, imported by nothing |

`elements/` is exempt from rule 1 by §7: every `.glb` gets a wrapper there even
when only one scene uses it today, because models are inherently reusable assets.

**`postprocessing/` is the only home for post-processing.** Generic non-GLTF
visuals (flow fields, particle generators, lightning) go in `elements/`.

## 1. Scene folder structure

Each scene is a self-contained folder under
`src/components/scenes/<Renderer>/<SceneName>/`, where `<Renderer>` ∈
`WebGL | WebGPU | Shared`.

**The folder carries no meaning beyond the renderer.** A scene's maturity —
Showcase, Work in Progress, Test Lab, Toolbox — is the `area` field in its
`scene.config.jsx` and nothing else. Promoting a scene is a one-line edit to
that field; nothing moves on disk. See §16.

`Shared/` holds renderer-agnostic scene bodies that a WebGL and a WebGPU
scene both wrap (e.g. `Shared/FurLab/Scene.jsx`), plus scenes registered under
both channels from one folder (§8).

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

## 1b. Import aliases

Anything outside the current scene folder is imported through a **path alias**,
never a `../../../..` chain. Aliases are declared once in `vite.config.js`
(`resolve.alias`), `jsconfig.json` (`paths`), and `.eslintrc.json`
(`settings.import/resolver.alias`) — add to all three or none.

| Alias             | Path                            | Alias      | Path          |
| ----------------- | ------------------------------- | ---------- | ------------- |
| `@app`            | `src/app`                       | `@modules` | `src/modules` |
| `@components`     | `src/components`                | `@hooks`   | `src/hooks`   |
| `@elements`       | `src/components/elements`       | `@utils`   | `src/utils`   |
| `@materials`      | `src/components/materials`      | `@presets` | `src/presets` |
| `@postprocessing` | `src/components/postprocessing` | `@store`   | `src/store`   |
| `@scenes`         | `src/components/scenes`         | `@styles`  | `src/styles`  |
| `@server`         | `src/server`                    |            |               |

Inside a scene folder, keep imports relative (`./components/Foo`,
`../hooks/useSceneControls`) — that's what makes the folder movable.

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

- A scene **never reaches into another scene's folder** for code — in either
  direction, and regardless of area. Showcase/WIP importing from Test Lab or
  Toolbox is the most common form (see §0 rule 4), but a Toolbox scene reading a
  Showcase scene's data is the same violation with the arrow reversed.
- If code needs to be shared, **promote it** to a generic location:
  - hooks → `src/hooks` (`@hooks`)
  - components → `src/components/...` (`@elements`, `@materials`, `@postprocessing`)
  - utils → appropriate shared util location (`@utils`)
- A scene folder is also never reached into from `src/` at large. Shared code
  lives outside the scene tree, not behind a re-export shim pointing back into
  a scene.
- Tightly-coupled, highly-reused code becomes a **module** under `src/modules/`.
  Precedents: `src/modules/ecctrl` (a complete character-controller: components +
  hooks), and the rigs `src/modules/cameraRig` and `src/modules/lightingRig` —
  each a control-builder + runtime utils + drop-in component that only make
  sense together, exposed through an `index.js` barrel. Current modules:
  `cameraRig`, `lightingRig`, `ecctrl`, `handTracking`, `poseTracking`,
  `mediaRecorder`, `splineAuthoring`, `trashAudio`, `trashCatalog`, `tsl`,
  `verletPhysics`, `windowSync`. When a
  control-builder + component pair grows this tightly coupled, promote it the
  same way rather than scattering it across `hooks/` and `components/`.

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
- **Every `folder(...)` is collapsed by default** — pass `{ collapsed: true }`
  (every existing folder call in the repo does this; there's no exception).
  This applies to sub-folders (`Camera`, per-component folders, nested
  subsections); it does not apply to the implicit top-level grouping created
  by `useControls(SCENE_LABEL, () => ({...}))` itself, which stays expanded
  so the panel isn't empty on open.
- **`Presets` is always the first folder and `Camera` is always the second**
  in the object passed to `useControls`, in that order. When a scene uses
  `LightingRig`, its **`Lighting` folder is always third**. Any scene-specific
  folders come after. See §13 for the full required order.
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

- Scenes should generally use **`CameraRig`** for maximum camera flexibility,
  rather than hand-rolling camera setup. It lives in the **`src/modules/cameraRig`**
  module (component + controls builder + runtime utils); import from the barrel:
  `import { CameraRig, useSceneCameraControls } from '.../modules/cameraRig'`.
- **Control changes must never reset the camera.** `CameraRig` re-applies the
  camera frame whenever the `camera` object passed to it changes _identity_.
  `useControls`' `controls` object gets a new identity on **every** Leva edit,
  so `useMemo(() => buildCamera(controls), [buildCamera, controls])` rebuilds
  — and snaps — the camera on any unrelated tweak (lighting, materials,
  whatever). Instead, memoize `buildCamera(controls)` on a key derived only
  from camera-relevant control values: use
  `getCameraControlsKey(controls)` from `src/modules/cameraRig` (it
  already knows the `camera*`/`fixed*`/`orbit*`/`spline*`/`operator*`/`preset`
  key prefixes `buildSceneCameraControls` generates) as the `useMemo`
  dependency instead of `controls` itself. See
  `Template/SceneTemplate/hooks/useSceneControls.js` for the pattern.
- **A preset's camera values apply on first mount, not just after "reset."**
  `buildSceneCameraControls` seeds the camera folder's Leva schema from
  `controlsSnapshotRef.current` (the active preset's snapshot, already
  populated by `usePresetsFolder` before `useSceneCameraControls` runs) —
  falling back to the scene's static `camera.js` declaration only for keys
  the preset doesn't set. This is automatic as long as you follow the
  standard call order (`usePresetsFolder` before `useSceneCameraControls`,
  its `controlsSnapshotRef` passed straight through — see
  `Template/SceneTemplate/hooks/useSceneControls.js`); don't build
  `cameraControls` from `camera.js` alone or a preset's `cameraMode`/
  `orbitAutoRotate`/`orbitDesktopPosition`/etc. will silently only take
  effect after the presets folder's "reset" button is pressed.

## 10a. Lighting

- Scenes that light anything should generally use **`LightingRig`**
  and `useSceneLightingControls` from the **`src/modules/lightingRig`** module
  (`import { LightingRig, useSceneLightingControls } from '.../modules/lightingRig'`)
  rather than hand-rolling light JSX.
  It is **optional** — not a fourth required item in §13. Scenes that light
  nothing simply don't wire it, and carry no `Lighting` folder.
- A scene declares **named light slots** in `utils/lighting.js` (sibling to
  `utils/camera.js`). Slot ids drive the flat preset keys — a slot named `key`
  produces `lightKeyColor`, `lightKeyIntensity`, `lightKeyPosition`, … so
  **renaming a slot is a preset migration**. Types: `ambient`, `hemisphere`,
  `directional`, `point`, `spot`, `rectArea`.
- **When a scene uses LightingRig, `Lighting` is the third folder**, after
  `Presets` and `Camera` and before any scene-specific folders (§9).
- **Shadows are declared, not flagged.** A slot casts shadows only if it
  declares `shadow`, and the declaration is the map size: `shadow: 2048`, or
  `shadow: { mapSize, bias, normalBias, near, far, extent }` to tune. Absence
  means no shadow. There is no separate `castShadow` boolean to forget, and no
  named quality tier to look up. Every caster is an extra render pass and a
  shadow-casting **point** light is a cube map — six. Roughly two thirds of the
  lights in this repo don't cast, so opting in is the exception.
- **Position accepts XYZ or spherical.** `position: [5, 8, 5]` or
  `position: { azimuth, elevation, radius }`. Spherical is usually the better
  handle for aiming a sun or key light.
- **Control changes must never churn the rig.** Same rule and same reason as
  the camera (§10): memoize `buildLighting(controls)` on
  `getLightingControlsKey(controls)` from `src/modules/lightingRig`,
  never on `controls` itself, or every unrelated Leva edit remounts the lights
  and throws away their shadow maps.
- **A preset's lighting values apply on first mount**, via the same
  `controlsSnapshotRef` seeding the camera folder uses — automatic as long as
  `usePresetsFolder` runs before `useSceneLightingControls` and its
  `controlsSnapshotRef` is passed straight through.
- **Disabled slots unmount** rather than linger at intensity 0, so anything
  holding a light instance (a postprocess raymarching its shadow map, say) must
  not rely on a plain ref — a ref never re-triggers the consumer's effects.
  Pass `onLightChange(slotId, light)` (a stable `useCallback`) and hold the
  light in state. `Windswept` + `Godrays` is the worked example.
- **Per-slot `layer` restricts what a light touches.** `layer: 1` (or
  `{ mode: 'set', channel: 1 }`) moves the light to that layer _exclusively_;
  `{ mode: 'enable', channel: 1 }` adds a layer while keeping the existing
  ones. Use it when a key light should hit a hero object without washing out
  everything else in the scene.

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

Every **WorkInProgress** and **Showcase** scene wires the first three of
these through `useSceneControls`, **in this order** (not required for
ToolBox/TestLab — drop what doesn't apply):

1. **Presets folder** — variations of the scene, applied via
   `usePresetsFolder` (`src/hooks/usePresetsFolder.js`). See §9.
2. **CameraRig + camera controls** — `<CameraRig camera={config.camera} />` in
   the scene root, fed by `useSceneCameraControls`
   (`src/modules/cameraRig`) for fine-grained camera behavior
   (useful for screen recording). See §10.
3. **MediaRecorder** — `useMediaRecorder({ fileName })` from
   `src/modules/mediaRecorder`, called once inside `useSceneControls`. It
   self-registers its own Leva controls and hotkeys (screenshot + start/stop
   recording) — internalizes screen rec instead of relying on the device's
   own capture. Nothing else needs to run it.

**`LightingRig` is optional, not a fourth required item** — but when a scene
does use it, its `Lighting` folder goes third in the `useControls` object,
between `Camera` and the scene-specific folders (§9, §10a).

**Overlay buttons are the exception, not a fourth required item.** Only add
them when the scene's spec explicitly calls for user-facing controls outside
Leva (e.g. mic/screenshare toggles) — **don't go looking for a reason to add
one.** Most scenes don't need this. When a scene genuinely does, compose
`SceneButtonBar` + `OverlayIconButton` (`src/app/scaffold/overlay/components/`)
in a scene-local `components/ButtonOverlay.jsx`. These are the buttons a
visitor is meant to see and use — the reverse of the Leva panel, which is the
hidden dev-controls panel only reachable if you know to click the reversal.
Give `datasetKey` a scene-unique value. Example:
`WebGPU/HorsesForCourses`.

`Template/SceneTemplate/` has the three required items wired in — copy it to
bootstrap a new WIP scene. It also ships `components/ButtonOverlay.jsx` as a
reference for the overlay-button pattern, but it is **not** wired into
`SceneTemplate.jsx` by default — wire it in only if your scene's spec calls
for it, and delete the file otherwise.

## 14. Scene registration

- Every scene folder owns a colocated `scene.config.jsx` (sibling to
  `SceneName.jsx`) that registers the scene: `id`, `label`, `channel`, `area`,
  `icon`, and `Component: lazy(() => import('./SceneName'))`.
  `src/app/sceneRegistry.jsx` discovers every one of these via
  `import.meta.glob('../components/scenes/**/scene.config.jsx')` and builds
  routing, the scene dropdown, and the Leva scene list from them.
- **Never hand-edit `sceneRegistry.jsx` to add, remove, or move a scene.**
  Moving a scene between areas (e.g. WIP → Showcase) or channels is a
  one-line edit to that scene's own `area`/`channel` field — the registry
  adapts automatically, and **no files move**. The file only holds glob/build infrastructure and
  should stay roughly fixed-size regardless of scene count.
- `export default` is a single object for a normal scene, or an **array of
  objects** when one renderer-agnostic component (§8) registers under both
  channels from a single folder (e.g. `Shared/FireTest/scene.config.jsx`
  exports two entries, one per channel) — copy that file's shape for similar
  cases.
- `route` is optional and defaults to `id`. Set it explicitly only when a
  scene needs a URL slug distinct from its sibling in the other channel — the
  repo convention is an explicit `-webgpu` suffix (e.g. `crtTest-webgpu`).
  Don't rely on the registry's collision auto-suffixing (`-2`, `-3`, ...) to
  disambiguate, since scan order across scene folders isn't guaranteed.
- Colocate the icon as a small `SceneIcon` component inside `scene.config.jsx`
  (react-icons, or an `<img>` via `iconFile` from `utils/appUtils`). Even if
  two scenes want a visually identical icon, duplicate the few lines rather
  than importing one scene's icon into another's config — per §6, a scene
  (its `scene.config.jsx` included) never reaches into another scene's
  folder.
- Prefix the filename with `_` (`_scene.config.jsx`) to keep a scene out of
  the registry entirely — used by `Template/SceneTemplate/` so the bootstrap
  template itself never appears as a real scene. Remove the underscore to
  register it for real.
- The `noScene` ("None") entry for each channel/area pair is generated
  programmatically inside `sceneRegistry.jsx`, not authored per-scene.

## 14b. Plans are ephemeral, docs are durable

Design/approach documents live in **`plans/<topic>.md`** at the repo root and
are **deleted when the work lands**. A plan describes work in flight; once the
thing is built, the code and `docs/` are the truth, and a leftover plan reads
to the next agent as current intent.

- Never leave a plan as the only record of a decision. If it produced a rule
  worth keeping, promote the rule into this file and delete the plan.
- Do not scatter plans next to the code they describe — one directory, so it
  is obvious what is still outstanding.
- A scene's `todo.md` is _not_ a plan: it is durable and colocated (§15).

## 15. Scene and dev-tool `todo.md` files — read-only unless explicitly asked

- Every scene and registered dev tool's `todo.md` follows a fixed shape: a
  `# // Name` title, a
  `[Back to main TODO](...)` link to the root `TODO.md` (relative depth
  matches the scene's folder nesting), then optional H2 sections in this
  order: `Intent / Use Cases`, `TODO`, `Presets`, `Features`, `Interactivity`,
  and `Bugs`. Omit sections that do not apply. Nest supporting material under
  these sections at H3 or deeper rather than creating one-off top-level
  sections. Adding a reusable top-level section is a schema change here and
  in Cataloggr, not a per-scene exception.
- Action items under `TODO`, `Presets`, `Features`, `Interactivity`, and `Bugs`
  use Markdown task checkboxes. Completed items stay in place as durable
  context and can be filtered in Cataloggr.
- Cataloggr's Todos workspace audits this shape and edits the colocated
  Markdown files directly. Format migration is explicit and reviewable;
  opening or editing a file must not silently normalize it.
- **Do not edit a scene or dev tool's `todo.md` as a side effect of implementing
  something.** Don't add new sections to log what you just built, don't turn
  it into a changelog, and don't remove or alter the back-link or existing
  headings/content — even if they look stale or redundant with what you did.
- Only touch a `todo.md` when the user **explicitly** asks you to update it
  (e.g. "check off X," "add Y to the todo," "update Prayer's todo.md"). If you
  want to record what changed, that belongs in the commit message, PR
  description, or your response to the user — not the scene's `todo.md`.

## 16. New scenes self-register in Cataloggr and the TODO index

Cataloggr (`/dev/cataloggr`) discovers `scene.config.jsx` entries and
scene-local preset exports automatically. New items appear unposted until
checked in Cataloggr. Posting state is stored in
`src/dev/tools/cataloggr/catalog.json`; no manual catalog entry is required.
Loose, unregistered scene ideas also live in Cataloggr's checked-in Ideas
backlog, where they are removed when implementation begins.
Curated Toolbox and Test Lab demo scenes join Showcase scenes in Cataloggr's
Post workflow; the catalog stores their scene ids and uses normal scene posting
status. Registered dev pages appear there automatically with independent
checked-in posting status.

When creating a scene, add its `todo.md` link under the matching area in root
`TODO.md`'s `### Scene TODO Files` index, alphabetized within the group. This is
the only proactive root `TODO.md` edit; scene status and publishing oversight
and unregistered scene ideas belong in Cataloggr rather than checkbox
inventories in the root TODO.

---

## Scaffold & process (do not violate)

- Never duplicate canvas/scaffold setup into a scene — it lives in
  `src/app/scaffold/*`, wired via `useAppScenes` / `CanvasWrapper`.
- The human developer owns the dev server. Do not start, kill, or restart it.
- ESLint (Airbnb) + Prettier are enforced: `npm run lint:fix`, `npm run format:fix`.
