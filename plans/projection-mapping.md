# Projection Mapping Dev Tool

## Goal

Build a local-only projection-mapper workbench for composing multiple live Eye
Candy scenes and supporting media into a calibrated projector output. The
controller owns editing and persistence; a separate output window stays free of
controls and receives mapping changes live.

## Product Decisions

- [x] Multiple live WebGL and WebGPU scene layers are supported.
- [x] Image, video, color, and calibration-grid layers are supported.
- [x] Arbitrary external sites and screen capture are out of scope.
- [x] Controller and output use independent scene instances; mapping and preset
      state match, but unseeded animation need not be frame-identical.
- [x] Authoring uses fixed output coordinates, initially 1920x1080, which fit
      into preview and projector viewports without changing calibration.
- [x] Named mapping JSON persists in localStorage; imported media persists in
      IndexedDB.
- [x] Recording, edge blending, masks, and multi-projector spanning are deferred.

## Architecture

### Project model

A versioned project stores output dimensions, background, selected layer, and
an ordered layer stack. Every layer has a stable id, source descriptor,
visibility, lock, opacity, blend mode, and four output-pixel corners ordered
top-left, top-right, bottom-right, bottom-left.

Scene layers reference registered scene paths and presets. Image and video
layers reference IndexedDB asset ids rather than object URLs. Color and grid
layers are generated locally.

### Rendering

Every layer is a DOM surface transformed from its source rectangle into its
destination quadrilateral with a projective CSS `matrix3d`. The same stage is
used by the controller preview and clean output. Invalid or self-intersecting
quadrilaterals retain their last valid transform.

Each live scene runs in an isolated same-origin host using its registered route
with scene UI hidden. This allows several WebGL and WebGPU renderers and avoids
global Leva/query-parameter collisions between scene components.

### Synchronization

The controller is the sole writer. It autosaves versioned project snapshots and
broadcasts revisioned updates through a project-scoped `BroadcastChannel`. The
output loads persisted state first, then accepts newer live revisions. Output
presence and fullscreen state are acknowledged to the controller.

## Milestones

### 1. Core vertical slice

- [ ] Register `/dev/projection-mapper` through a colocated config.
- [ ] Add the canonical tool `todo.md` and ESLint cross-tool boundary.
- [ ] Define and normalize the versioned project schema.
- [ ] Add named-project localStorage persistence.
- [ ] Implement validated quadrilateral homography math.
- [ ] Render color and calibration-grid layers in a fixed-resolution stage.
- [ ] Add corner and whole-surface dragging.
- [ ] Add a synchronized clean output mode.

### 2. Live Eye Candy scenes

- [ ] Enumerate registered scenes by renderer and area.
- [ ] Discover colocated preset exports without importing another dev tool.
- [ ] Add independent scene layers with hidden app UI.
- [ ] Add scene interaction enable/disable controls.
- [ ] Report active renderer count and allow controller-preview suspension.
- [ ] Validate simultaneous WebGL and WebGPU scenes.

### 3. Layer workflow and precision

- [ ] Add sortable layer ordering with `@dnd-kit`.
- [ ] Add rename, duplicate, delete, visibility, lock, opacity, and blend mode.
- [ ] Add fit, reset, proportional scale, wheel scale, and +/-15 degree rotation.
- [ ] Add selected-corner and whole-layer 1px/10px keyboard nudging.
- [ ] Add configurable grid snapping.
- [ ] Preserve corners when changing a layer source.

### 4. Persistent media and projects

- [ ] Add image/video import and IndexedDB blob persistence.
- [ ] Clean up object URLs on source changes and unmount.
- [ ] Recover blocked video autoplay after an output-window gesture.
- [ ] Add create, rename, duplicate, load, and delete project actions.
- [ ] Handle corrupt data, missing assets, and controller/output reconnects.

### 5. Output and validation

- [ ] Open or focus one stable output window per project.
- [ ] Add a transient user-gesture affordance for browser fullscreen.
- [ ] Hide output cursor after inactivity and render no permanent controls.
- [ ] Validate drag, nudge, fit, rotate, snap, lock, and invalid quads.
- [ ] Profile mixed WebGL/WebGPU layers with controller and output active.
- [ ] Run focused format/lint, full lint, and production build.
- [ ] Confirm projection-mapper code is absent from production output.

## Validation Gates

- [ ] `/dev` and `/dev/projection-mapper` load on the human-owned dev server.
- [ ] Output route refreshes independently and reconnects after controller refresh.
- [ ] Projector resizing/fullscreen does not alter authored corner coordinates.
- [ ] Degenerate and self-crossing quads never produce NaN or blank the stage.
- [ ] Uploaded media survives refresh and missing media fails visibly in controller.
- [ ] The output contains no dev chrome or mapping handles.
- [ ] Lint, format, build, and production-exclusion checks pass.

Delete this plan when implementation is complete. Promote any lasting rules to
`docs/` before deletion.
