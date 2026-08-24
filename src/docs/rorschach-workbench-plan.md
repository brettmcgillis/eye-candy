# Rorschach Production Workbench

## Goal

Build a dev-only production workbench around the Rorschach generator for
creating, curating, animating, rendering, and preparing stills and videos for
publishing. Preserve deterministic output and keep the existing CLI useful.

## Product Decisions

- [x] First release is a generator workbench, not a generic video editor.
- [x] Projects must support procedural Rorschach shots and rendered media.
- [x] Theatre.js motion authoring begins in the first milestone.
- [x] Social presets, batch curation, reusable projects, and publishing handoff
      are all required workflows.
- [x] OpenCut Classic is an interaction reference, not a source dependency.
- [x] Render recipes remain portable and deterministic even when Theatre.js is
      used to author their motion.

## Architecture

### Render recipe

A project owns a versioned, serializable recipe containing:

- Output profile, frame rate, duration, safe areas, and overlay settings.
- Procedural clips with seed, generated configuration, view, and duration.
- Rendered image/video clips with workspace-relative media paths.
- Theatre.js project state for camera, growth, flatten, bloom, opacity, and
  transition curves.
- Curation state such as favorites, rejects, notes, and selected outputs.
- Render history and publishing metadata.

The recipe is the durable contract. Theatre.js is the visual authoring surface,
not the only copy of project semantics.

### Server boundary

The Vite dev server owns filesystem and process access behind `/dev-api`:

- Submit, inspect, list, and cancel render jobs.
- Stream or poll structured progress and bounded logs.
- Discover generated assets without exposing arbitrary workspace paths.
- Save and load versioned projects.
- Reveal completed assets in Finder and prepare publishing metadata.

The CLI and dev API should converge on shared generator functions. Wrapping the
current CLI is acceptable for the first vertical slice, but is not the final
service boundary.

### Motion authoring

Use `@theatre/core` and `@theatre/studio` with purpose-built sheet objects.
Avoid making `@theatre/r3f` a hard dependency on the WebGPU preview because its
renderer integration is pre-release and currently assumes WebGL in parts of
its implementation. Exact-frame export sets the Theatre sequence position
before rendering each frame.

## Milestones

### 1. Generator vertical slice

- [x] Review the scene, CLI, renderer, output format, and dev-page conventions.
- [ ] Add a dev-only asynchronous render job service.
- [ ] Expose job submit/list/read/cancel endpoints through Vite middleware.
- [ ] Add a `/dev/rorschach` route and dev landing-page entry.
- [ ] Build still and video job forms from the existing CLI contract.
- [ ] Show queue state, progress, bounded logs, errors, and cancellation.
- [ ] Discover and preview completed PNG/SVG/MP4 outputs.
- [ ] Add social presets for post, story, reel, square, and custom dimensions.
- [ ] Validate CLI compatibility after the service is introduced.

### 2. Curation and projects

- [ ] Generate contact-sheet batches at preview resolution.
- [ ] Add compare, favorite, reject, notes, and render-selected actions.
- [ ] Define and validate the versioned project recipe schema.
- [ ] Save, list, rename, duplicate, load, and delete projects.
- [ ] Preserve generated configuration metadata for exact rerenders.
- [ ] Add render history and stale-output detection.

### 3. Theatre.js procedural shot

- [ ] Install compatible Theatre.js packages and verify React 19/Vite behavior.
- [ ] Add Studio initialization scoped to the dev page.
- [ ] Bind camera orbit/target/distance, growth, flatten, and bloom controls.
- [ ] Persist Theatre project state inside the workbench project.
- [ ] Add play, pause, scrub, loop, timecode, and duration controls.
- [ ] Evaluate Theatre values at exact frame times in headless rendering.
- [ ] Verify browser preview and exported frames match at sampled timecodes.

### 4. Composition timeline

- [ ] Support procedural Rorschach clips and rendered image/video clips.
- [ ] Add clip insertion, selection, reorder, trim, split, and delete.
- [ ] Add cut and crossfade transitions.
- [ ] Add frame snapping and integer frame-aligned time calculations.
- [ ] Use temporary preview edits with explicit commit/discard semantics.
- [ ] Add undo/redo for project edits.

### 5. Publishing handoff

- [ ] Add one-click post, story, and reel render profiles.
- [ ] Reveal selected outputs in Finder.
- [ ] Copy output path and publishing metadata.
- [ ] Store caption, alt text, tags, and posting notes with the project.
- [ ] Export a portable project manifest alongside final media.

### 6. Shared generator module

- [ ] Promote reusable Rorschach generation code out of the scene tree.
- [ ] Add a public barrel under `src/modules/rorschachGenerator/`.
- [ ] Update the scene, CLI, and dev service to consume the public module.
- [ ] Remove Vite SSR imports that reach directly into the scene folder.
- [ ] Keep generated seeds and existing CLI output pixel-compatible.

## Validation Gates

- [ ] `npm run rorschach:generate -- --help` remains valid.
- [ ] `npm run rorschach:video -- --help` remains valid.
- [ ] A still job completes from the UI and produces metadata plus images.
- [ ] A video job completes from the UI and produces a playable MP4.
- [ ] Cancellation terminates the child process and marks the job cancelled.
- [ ] Invalid paths and malformed payloads cannot escape allowed output roots.
- [ ] Refreshing the page recovers in-process job state while the server lives.
- [ ] Lint and formatting pass for every touched file.
- [ ] Desktop and mobile layouts are visually checked without overlap.
- [ ] Rorschach preview and render performance are spot-checked against the
      scene performance checklist.

## Handoff Notes

- The current scripts are real CLIs and are registered in `package.json`.
- `scripts/lib/rorschachRender.mjs` is shared by still and video generation.
- Headless GPU rendering pools a capturer per output size.
- Video export requires `ffmpeg`; the development machine currently has
  ffmpeg 8.0.1 at `/usr/local/bin/ffmpeg`.
- Generated output is currently written beneath `output/`.
- The existing GLTF dev service is the closest Vite middleware precedent.
- The human developer owns the dev server; do not restart it during handoff.
