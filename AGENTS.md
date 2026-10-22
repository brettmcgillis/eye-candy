# Eye Candy — Agent Guide

**This file is the agent-agnostic source of truth.** Every agent entry point
points here rather than restating anything:

| Agent                        | Entry file                        |
| ---------------------------- | --------------------------------- |
| Claude Code                  | `CLAUDE.md`                       |
| GitHub Copilot               | `.github/copilot-instructions.md` |
| Codex / Cursor / Aider / Zed | `AGENTS.md` (this file)           |

Rules live here and in `docs/`. Do not duplicate them into an agent-specific
file — update this one, and every agent gets the change.

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

**Placement rules (`docs/scene-conventions.md` §0) — read before adding a file.**
Depth means specificity: generality decreases as you go deeper, dependencies
point rootward, modules are imported through their `index.js` barrel (never
their internals), and scenes never import from other scenes — a Showcase or WIP
scene especially never imports from a Test Lab or Toolbox scene. Imports outside
the current scene folder go through path aliases (`@elements`, `@modules`,
`@utils`, …), never `../../../..` chains (§1b).

## Required reading before touching src/dev

- **`docs/dev-tooling.md`** — the local-only dev-tooling boundary, tool
  organization, dev-page registration, cross-tool import enforcement, and dev
  server code under `src/dev/`. This is the source of truth; follow it
  exactly. None of this ships to GitHub Pages.

## Required reading before touching a render workbench

- **`docs/render-workbench.md`** — the plumbing every generator shares: option
  specs declared with `@modules/optionSchema`'s builders and `standard`
  factories, scene Leva from `@modules/schemaControls`, the `RollWorkbench`
  page, `createSchemaToolPlugin` on the dev server, and the checklist for a
  new one. Read it before adding or changing any `renderOptions.mjs`, scene
  `utils/controls.js`, workbench page or `src/dev/server/<tool>/plugin.js`.

## Required reading before touching Apollian

- **`docs/apollian-pipeline.md`** — the HyperCubes arrangement for the
  Apollonian fractal objects: `@modules/apollian` (three-free CPU mirrors of
  the four fields, the exact Soddy packing, slice sampling and contours, plot
  SVG, roll and option schema; the scene's Leva is generated from it),
  `@modules/apollianRender` (`createApollianRig`, the full-screen stage
  march, surfaces and slice view), the headless CLIs, and ApollianCLI. Run
  `npm run apollian:check` after changing any of them.

## Required reading before touching ExhibitA

- **`docs/exhibit-a-pipeline.md`** — the Apollian arrangement for the museum
  exhibits: `@modules/exhibitA` (three-free registry, builders, framing,
  motion, roll and option schema; the scene's Leva is generated from it),
  `@modules/exhibitARender` (`createExhibitRig`, the stage and materials), the
  headless CLIs (`exhibit-a:generate`, `exhibit-a:video`), and ExhibitACLI. Run
  `npm run exhibit-a:check` after changing any of them.

## Required reading before touching Brutalist / BrutalistMaquette

- **`docs/brutalist-pipeline.md`** — the HyperCubes arrangement with two
  scenes over one kernel: `@modules/brutalist` (three-free family grammars,
  parts and disjoint cutters, siting, moods, roll, framing, plot SVG and the
  stage-tagged option schema both scenes' Leva is generated from),
  `@modules/brutalistRender` (`createBrutalistRig`: CSG carving, procedural
  concrete, ez-tree forest, height fog, PetriDish studio), the headless CLIs
  and BrutalistCLI. Run `npm run brutalist:check` after changing any of them.

## Required reading before touching Rorschach

- **`docs/rorschach-pipeline.md`** — Rorschach is one kernel
  (`src/modules/rorschach/`) with two renderers over it: the WebGPU scene and
  the headless stills/video CLIs, with the dev tool as a UI over the latter.
  Changes start in the kernel and land in every consumer in the same commit;
  render options are declared once in `renderOptions.mjs`. This is the source
  of truth; follow it exactly.

## Required reading before touching Flora

- **`docs/flora-pipeline.md`** — the same kernel/renderers/dev-tool
  arrangement as Rorschach: `@modules/flora` (three-free generator and option
  schema), `@modules/floraRender` (the look, shared by scene and CLI), the
  headless CLIs, and FloraCLI. Run `npm run flora:check` after changing any of
  them.

## Required reading before touching Fungi

- **`docs/fungi-pipeline.md`** — the Flora arrangement for fungi:
  `@modules/fungi` (three-free generator and option schema),
  `@modules/fungiRender` (the shared specimen rig), the headless CLIs, and
  FungiCLI. Run `npm run fungi:check` after changing any of them.

## Required reading before touching GhostBuster skins / GhostBusterCLI

- **`docs/ghost-buster-pipeline.md`** — the ghost skin library
  (`@presets/ghost/ghostSkins`, authored in GhostBuster and read by every
  ghost consumer), `@modules/ghostBuster` (three-free option schema, roll,
  framing, lattice and plot SVG), `@modules/ghostBusterRender` (the real R3F
  stage, mounted headlessly by the CLIs and live by the workbench), the
  headless CLIs and GhostBusterCLI with its Live tab. Run
  `npm run ghost-buster:check` after changing any of them.

## Required reading before touching BirdsArentRealCLI

- **`docs/birds-arent-real-pipeline.md`** — the GhostBuster arrangement for
  flocks of FakeBirds: `@elements/FakeBird` (the bird the scene and the
  workbench share, drei-free so it mounts headlessly), `@modules/birdsArentReal`
  (three-free option schema, roll, flock layout, framing and the mesh plot),
  `@modules/birdsArentRealRender` (`BirdStudio`, the real R3F stage), the
  headless CLIs and BirdsArentRealCLI with its Live tab. Run
  `npm run birds-arent-real:check` after changing any of them.

## Required reading before touching DumpsterFire / DumpsterFireCLI

- **`docs/dumpster-fire-pipeline.md`** — the BirdsArentReal arrangement for
  the Dumpster Fire scene: `@modules/dumpsterFire` (three-free option schema,
  roll, trash / wall / smoke layouts, framing, the MaterialX flame-noise
  mirror and the plot; the scene's Generation folders are generated from
  it), `@modules/dumpsterFireRender` (`DumpsterStage`, the real R3F stage,
  plus the sidewalk, cinderblocks, fire lights and smoke authoring the scene
  shares), the headless CLIs and DumpsterFireCLI with its Live tab. Run
  `npm run dumpster-fire:check` after changing any of them.

## Required reading before touching Kumiko

- **`docs/kumiko-pipeline.md`** — the Fungi arrangement for kumiko panels:
  `@modules/kumiko` (three-free tilings, patterns, mixing, arrangement and
  option schema), `@modules/kumikoRender` (CSG slab / strip geometry and the
  rig), the headless CLI, and KumikoCLI. Run `npm run kumiko:check` after
  changing any of them.

## Required reading before touching Block Party

- **`docs/block-party-pipeline.md`** — the Fungi arrangement for the
  isometric city: `@modules/blockParty` (three-free quadtree city, rebuild
  state machine, palette roles, plot SVG and option schema; the scene's Leva
  is generated from it), `@modules/blockPartyRender` (`createCityRig`, the
  look), the headless CLIs, and BlockPartyCLI. Run `npm run block-party:check`
  after changing any of them.

## Required reading before touching Fractal Automata

- **`docs/fractal-automata-pipeline.md`** — the Nesting Boxes arrangement for
  the voxel CA: `@modules/fractalAutomata` (three-free rule tables, facet roll
  and option schema; the scene's Leva is generated from it),
  `@modules/fractalAutomataRender` (GPU CA, voxel build, light rig, godrays
  slot), the headless CLIs, and FractalAutomataCLI. Run
  `npm run fractal-automata:check` after changing any of them.

## Required reading before touching Nesting Boxes

- **`docs/nesting-boxes-pipeline.md`** — the Fungi arrangement for the tree
  of boxes: `@modules/nestingBoxes` (three-free CPU mirror of the tree
  kernel, motion, colour pens, facet roll, plot SVG and option schema; the
  scene's Leva is generated from it), `@modules/nestingBoxesRender`
  (`createBoxRig`, the compute kernel and the look), the headless CLIs, and
  NestingBoxesCLI. Run `npm run nesting-boxes:check` after changing any of
  them.

## Required reading before touching HyperCubes

- **`docs/hyper-cubes-pipeline.md`** — the Nesting Boxes arrangement for the
  subdivided cubes: `@modules/hyperCubes` (three-free rect-subdivision and
  octree trees, morph/grow layout, looks, roll, plot SVG and option schema;
  the scene's Leva is generated from it), `@modules/hyperCubesRender`
  (`createCubeRig`, the studio environment and the look), the headless CLIs,
  and HyperCubesCLI. Run `npm run hyper-cubes:check` after changing any of
  them.

## Required reading before touching NetworkTest

- **`docs/network-test-pipeline.md`** — the HyperCubes arrangement for
  generative networks: `@modules/networkTest` (three-free composition of point
  generators, the wiring rules, grow/drift/pulse motion, instances, plot SVG
  and option schema; the scene's Leva is generated from it),
  `@modules/networkTestRender` (`createNetworkRig`, the look), the headless
  CLIs, and NetworkTestCLI. Run `npm run network-test:check` after changing
  any of them.

## Required reading before touching Push Comes to Shove

- **`docs/push-comes-to-shove-pipeline.md`** — the HyperCubes arrangement
  for the holed panel over its cable tangle: `@modules/pushComesToShove`
  (three-free layout, hole field and panel mesh, seeding, palette maths with
  the CPU hash mirror, roll, field fitting, framing, loop planner, plot SVG
  and option schema; the scene's Leva is generated from it),
  `@modules/pushComesToShoveRender` (`createShoveRig`, the GPU cable sim and
  the look), the headless CLIs, and PushComesToShoveCLI. Run
  `npm run push-comes-to-shove:check` after changing any of them.

## Required reading before touching Imperfection

- **`docs/imperfection-pipeline.md`** — the TSL port of the Imperfection
  Shadertoy bundles: `@modules/imperfection` (three-free reference
  composition verbatim, lite/wild presets, layout warp, palette shifts, roll
  and option schema; the scene's Leva is generated from it),
  `@modules/imperfectionRender` (the ported passes and `createPaintRig`), the
  headless CLIs and ImperfectionCLI. Run `npm run imperfection:check` after
  changing any of them.

## Required reading before touching IsoLines / IsoLinesRelief

- **`docs/iso-lines-pipeline.md`** — the flat pair half and the shared
  kernel: `@modules/isoLines` (three-free field drivers including the
  reference noise port, the vertex grid, marching-squares contours, segments
  and trail, plan SVG, the flat schema and the specs both schemas share),
  `@modules/isoLinesRender` (the flat rig and the shared shading), the
  headless CLIs, IsoLinesCLI and its Darkroom technique.
- **`docs/iso-lines-relief-pipeline.md`** — the relief half over the same
  kernel: `@modules/isoLinesRelief` (schema, roller, framing, cycle),
  `@modules/isoLinesReliefRender` (`createReliefRig`), its CLIs,
  IsoLinesReliefCLI and its Darkroom technique. Run `npm run iso-lines:check`
  and `npm run iso-lines-relief:check` after changing either.

## Required reading before touching IsoMeter

- **`docs/iso-meter-pipeline.md`** — the port of Vanhoutte's Isoverse:
  `@modules/isoMeter` (three-free RNG/noise mirrors, the triangle lattice,
  the three pieces, palette remap, voxel meshing, painters, option schema and
  roll; the scene's Leva is generated from it), `@modules/isoMeterRender`
  (the voxel objects, Winterkammer stage and framing the scene and the voxel
  CLI share), the WebGPU scene's flat, Canvas2D and voxel views, the headless
  CLIs and IsoMeterCLI. Run
  `npm run iso-meter:check` after changing any of them; its goldens come from
  the live originals.

## Required reading before touching Subdivision

- **`docs/subdivision-pipeline.md`** — `@modules/subdivision` is a three-free
  kernel (fractalPixelate's split loop on the CPU, shading, hatching, SVG)
  drawn by the WebGPU scene and by the headless CLI, with SubdivisionCLI over
  the latter. Run `npm run subdivision:check` after changing any of them.

## Required reading before touching SubdivisionRelief

- **`docs/subdivision-relief-pipeline.md`** — the relief half over the same
  kernel: `@modules/subdivisionRelief` (three-free schema, roller, heights,
  cell placement, framing, grow clock and motion; the scene's Leva is
  generated from it), `@modules/subdivisionReliefRender` (`createReliefRig`,
  the prisms and plate), the headless CLIs, SubdivisionReliefCLI and the
  Darkroom relief technique. Run `npm run subdivision:check` and
  `npm run subdivision-relief:check` after changing either.

## Required reading before touching Rug Pull

- **`docs/rug-pull-pipeline.md`** — the Kumiko arrangement for generative
  Persian rugs: `@modules/rugPull` (three-free knot-grid cartoon — designs,
  motifs, borders, house motifs, palettes, finishing, verlet cloth and the
  option schema; the scene's Leva is generated from it),
  `@modules/rugPullRender` (`createRugRig`, the pile and the room), the
  headless CLI and RugPullCLI. Run `npm run rug-pull:check` after changing
  any of them.

## Required reading before touching Trucheterie3D

- **`docs/trucheterie3d-pipeline.md`** — the Trucheterie blob field as
  tubes: `@modules/trucheterie3d` (three-free tube solve over
  `@modules/trucheterieBlob`: strands, chains, heights, retraction, crossing
  lift, the no-intersection invariants and their verifier, the mesh sweep,
  the quilted-membrane strips, option schema; the scene's Leva is generated
  from it), `@modules/trucheterie3dRender` (`createTubeRig`, the GPU
  membrane solver ported from 260421_CatenaryCanopy), the headless CLIs and
  Trucheterie3DCLI. Run `npm run trucheterie3d:check` after changing any of
  them, and `npm run trucheterie:check` too if you touch the blob modules.

## Required reading before touching Trucheterie designs

- **`docs/trucheterie-designs.md`** — hand-made blob fields: the design
  model, neighbour rule and codec in `@modules/trucheterieBlob`
  (`design.js`, `fieldFromConfig`, `designs/*.json`), the shared editor in
  `@modules/trucheterieDesigner`, both scenes' Design folders,
  TrucheterieDesigner and the CLIs' `--blobDesign`. Run
  `npm run trucheterie:check` after changing any of them.

## Required reading before touching the Plotterizer or plot export

- **`docs/plotterizer.md`** — the plot-prep tool every bench SVG goes
  through for the cutter: the pure `kernel/*.mjs` (parse, optimise, crowding,
  plot jobs, DXF for Silhouette Studio), the gallery hand-off, re-rendering a
  generation at its plot size, and the job format. Benches write SVG only;
  DXF is the Plotterizer's.

## Required reading before touching PrintShop

- **`docs/print-shop-pipeline.md`** — the 3D-print export tool: the
  three-free mesh kernel under `src/dev/tools/printShop/kernel/`, the
  glob-registered printables (`printables/<id>/printable.js`), the
  CLI (`npm run print-shop:export`) and the job runner. Gh0st's pose comes
  from `@elements/WebGPU/ghost/ghostRig` and the CPU cloth mirror
  (`cloth/clothTopology.js`, `cloth/clothCpu.js`), which GhostCharacter and
  `createClothSimulation` share. Run `npm run print-shop:check` after
  changing any of them.

## Orientation

- Scenes: `src/components/scenes/<Renderer>/<SceneName>/` (`WebGL | WebGPU |
Shared`). Maturity is the `area` field in `scene.config.jsx`, not a folder —
  promoting a scene is a one-line edit, nothing moves.
- Reusable model wrappers: `src/components/elements/<ModelName>/`.
- Shared hooks: `src/hooks/`. Promoted modules: `src/modules/` (e.g. `ecctrl`,
  `cameraRig`, `lightingRig`, `handTracking`, `poseTracking`, `webcam`, `tsl`,
  `trashCatalog`) — each
  behind an `index.js` barrel.
- Rorschach kernel: `src/modules/rorschach/` — see the required reading above
  before changing anything the scene and the CLIs share.
- Shared authored data: `src/presets/` (fire/smoke/spline libraries authored by
  the Toolbox scenes and consumed by ordinary scenes).
- Scaffold (canvas, Leva, loading): `src/app/scaffold/*`, wired via `useAppScenes`.
- Entry: `src/main.jsx` → `src/app/App.jsx`.
- Local dev tooling (not deployed): `src/dev/tools/<tool>/`, mounted only in
  dev via `src/app/App.jsx`. See "Required reading before touching src/dev"
  above.

## WebGPU / TSL function reference

Don't guess or search for what TSL functions exist — read the export lists
directly from the local three.js checkout:

- `~/dev/examples/three.js/src/nodes/TSL.js` — the TSL fluent function API
  (what you actually call in shader code: math/utils/lighting/PBR helpers,
  etc.). This is the one to check when writing or porting a shader.
- `~/dev/examples/three.js/src/nodes/Nodes.js` — the underlying Node classes
  (lower-level; check this when you need a class, not a TSL helper function).

## Writing things down

- **`plans/<topic>.md`** — ephemeral. Design/approach docs for work in flight;
  **delete the plan when the work lands** (`plans/README.md` explains why).
  If a plan produced a durable rule, promote it into `docs/` first.
- **`<Scene>/todo.md`** — durable, colocated, read-only unless asked (§15).
- **Root `TODO.md`** — read-only unless asked, except for adding a new scene's
  `todo.md` link to its durable scene index. Cataloggr owns unregistered scene
  ideas and publishing state (§16).
- **`docs/`, `AGENTS.md`** — durable conventions and references.

## Process

- The human developer owns the dev server — do not start, kill, or restart it.
- No unit tests; rely on the live dev server and human-in-the-loop visual checks.
- Lint/format are enforced: `npm run lint:fix`, `npm run format:fix`.
- A scene's `todo.md` is **read-only unless the user explicitly asks you to
  update it** — don't add sections logging what you built, and don't touch its
  back-link or existing content as a side effect of implementing something.
  See `docs/scene-conventions.md` §15.
- **New scenes and local presets self-register in Cataloggr** through their
  existing config and preset files. When creating a scene or dev tool,
  scaffold its `todo.md` with `npm run todo:new -- <dir> "<Name>"` (never
  hand-write one — all six sections are required, empty is fine), and finish
  with a clean `npm run todo:check -- <dir>`. Add its `todo.md`
  link to the matching group in root `TODO.md`; add loose scene ideas to
  Cataloggr, and do not add scene status or publishing checklists to the root
  TODO. See `docs/scene-conventions.md` §16.
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
