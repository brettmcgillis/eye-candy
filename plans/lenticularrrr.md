# Lenticularrrr

> This plan is ephemeral. Delete it when the work lands, promoting any durable
> conventions into `docs/` first.

## Goal

Build a local-only, persistent art-direction studio for designing two- or
three-frame flip lenticulars before paying for a physical proof.

The first release imports and preserves source images, provides an explicitly
uncalibrated but physically parameterized lens simulation, supports
non-destructive registration and risk diagnostics, creates 2D room mockups,
records immutable approvals, and writes final frames plus MP4/GIF previews into
each project.

Printer-ready interlacing, calibrated lens/printer profiles, embedded live-scene
capture, and a 3D gallery are later phases.

## Discovery Review

### Existing lenticular work

- `resourceArchive/Lenticulars/BurningAtBothEnds/` contains the only completed
  frame pair: two compositionally registered 1000x1400 PNGs captured through
  Chrome DevTools with `autoRotate: false`.
- The Burning pair is an extreme flip from clipped bright flames to broad gray
  smoke on black. It is a strong seed case for crosstalk and contrast analysis.
- `resourceArchive/Lenticulars/StillPullingForYou/README.md` describes a planned
  1400x1000 three-state project: Rough Waters, Still Pulling, and Sunk. It has no
  captured images.
- Root `TODO.md` records the need to avoid high subject/background contrast and
  high frame-to-frame contrast, and lists a planned static Cumulus print.
- The archive does not record vendor, physical dimensions, LPI/lens pitch,
  substrate, cost, upload package, or calibration data. Do not invent defaults
  for those unknowns.

### Existing technical foundation

- The media recorder already proves renderer-independent WebGL/WebGPU canvas
  snapshots and browser MP4/WebM recording.
- Complete scene and Leva settings are private to individual scenes, so they
  cannot yet be captured reliably through a generic screenshot hook.
- Existing dev tools provide patterns for auto-discovered pages, isolated tool
  folders, Vite `/dev-api/*` services, atomic manifests, asset streaming,
  persisted jobs, polling, and output galleries.
- `sharp` is already installed for server-side image decoding, normalization,
  transformation, and analysis.
- The repository already treats `ffmpeg` as an optional external capability.
  Use it for approval MP4 and GIF generation rather than adding a browser GIF
  encoder.

## Product Decisions

- [x] The tool is named **Lenticularrrr** and routes at `/dev/lenticularrrr`.
- [x] V1 is import-first. Embedded live-scene capture follows later.
- [x] V1 supports flip lenticulars with exactly two or three ordered frames.
- [x] Imported originals are copied immutably into the project.
- [x] Scene, preset, control, and camera provenance are optional manual metadata
      in V1; keeping the source images is mandatory.
- [x] Alignment edits are non-destructive. Flattened PNGs are explicit
      derivatives.
- [x] The simulation is physically parameterized but uncalibrated. It predicts
      transitions and crosstalk risk but never certifies a print.
- [x] Both vertical-lens/left-right viewing and horizontal-lens/up/down viewing
      are supported.
- [x] Physical dimensions accept custom inches or millimeters and reusable size
      presets.
- [x] Actual-size screen display is browser-approximate and visibly labeled.
- [x] V1 includes 2D photo mockups. A 3D gallery is deferred.
- [x] Approval outputs are written directly inside the project. Do not add ZIP
      packaging or force browser downloads.
- [x] Generate both MP4 and GIF approval previews with `ffmpeg`.
- [x] Projects have draft/approved status and soft deletion with explicit trash
      emptying.
- [x] Seed Burning At Both Ends by copying the archive files. Do not alter the
      archive.
- [x] Create a canonical tool-local `todo.md`. Do not modify scene TODO files or
      root `TODO.md` as part of this tool implementation.

## Architecture

### Shared model

Add a dependency-free model under `src/dev/shared/lenticularrrr/` that can be
used by browser and dev server code without importing another tool's internals.
It owns:

- Manifest and schema version constants.
- Project defaults and validation.
- Two- or three-slot ordered frame configuration.
- Immutable imported versions and active-version selection.
- Crop, translation, scale, rotation, and background-fill transforms.
- Physical print dimensions, units, aspect lock, and reusable size presets.
- Lens orientation, nominal viewing cone, LPI, phase, crosstalk, and transition
  softness.
- Preview and auto-rock settings.
- Optional scene, preset, settings, camera, and source-path notes.
- 2D mockup state.
- Draft/approved state, approval references, and `deletedAt` metadata.
- Angle-to-source-view weighting used by both interactive preview and exports.

Keep the schema forward-compatible with future effect and printer profile
fields, but accept only `flip` projects in V1.

### Project storage

Store generated local data under:

```text
output/lenticularrrr/projects/<projectId>/
  project.json
  sources/
  derivatives/
  mockups/
  approvals/<approvalId>/
```

Requirements:

- `project.json` is the atomic source of project truth.
- Originals are immutable and carry SHA-256 checksums.
- Generated derivatives never overwrite originals.
- Approval directories are immutable.
- IDs are UUID-backed and paths are normalized and guarded against traversal.
- Validate MIME, byte limits, decoded dimensions, and image content with
  `sharp`.
- Write temporary files and rename them into place.
- Add `/output/lenticularrrr/` to `.gitignore`.

### Dev API

Add `src/dev/server/lenticularrrr/` and expose a focused
`/dev-api/lenticularrrr` API for:

- Capabilities, including `ffmpeg` availability.
- List, create, read, update, duplicate, soft-delete, and restore projects.
- Upload an image into a named frame slot.
- Select active versions and update transforms or optional metadata.
- Render flattened derivatives.
- Serve project assets with correct content types and byte-range support.
- Create and poll persisted approval jobs.
- List and explicitly empty project trash.

Use the repository-standard success/error envelopes, typed 4xx errors, bounded
request sizes, and guarded filesystem access. Register the plugin only through
`src/dev/server/devServerPlugins.js`.

### Optical simulation contract

The virtual preview must not be a decorative crossfade. At a supplied viewing
angle, use the configured lens direction, nominal viewing cone, phase, LPI,
and frame order to select two or three discrete source views. Model leakage
between neighboring views with crosstalk and transition softness.

Use exactly the same angle-to-view weighting for:

- Drag-to-tilt preview.
- Auto-rock playback.
- 2D room mockups.
- Approval MP4 and GIF frame generation.

Label the profile **Uncalibrated simulation**. A screen preview can expose harsh
transitions, likely leakage, and registration errors, but it cannot certify a
physical print without a measured lens/printer profile.

## Milestones

### 1. Model, persistence, and seed project

- [ ] Define the shared, dependency-free Lenticularrrr project schema.
- [ ] Add normalization and validation for two- and three-frame flip projects.
- [ ] Implement angle-to-source-view weighting in the shared model.
- [ ] Add guarded, atomic project persistence under `output/lenticularrrr/`.
- [ ] Preserve immutable originals with checksums.
- [ ] Add source, derivative, mockup, approval, and trash lifecycle handling.
- [ ] Add `/output/lenticularrrr/` to `.gitignore`.
- [ ] Implement an idempotent Burning At Both Ends seed migration.
- [ ] Assign Enlightened to slot A and Extinguished to slot B.
- [ ] Record the known 1000x1400, Chrome DevTools, and `autoRotate: false`
      provenance while leaving unknown print fields unset.
- [ ] Add and register the `/dev-api/lenticularrrr` server plugin.
- [ ] Stream full and byte-range project assets safely.

### 2. Registration and project library

- [ ] Add `src/dev/tools/lenticularrrr/devPage.config.js` with a lazy component,
      slug, label, description, and order.
- [ ] Confirm automatic registration on the `/dev` devToolz landing page.
- [ ] Confirm automatic Cataloggr registration through `toCatalogDevTool()` as
      `Dev Tool / Local Only`; do not add a manual catalog record.
- [ ] Add the canonical `src/dev/tools/lenticularrrr/todo.md` with title,
      root-TODO back-link, intent, and durable V1/future tasks.
- [ ] Confirm Cataloggr's Todos workspace discovers and edits the tool TODO.
- [ ] Add Lenticularrrr to every existing dev-tool ESLint restriction list.
- [ ] Add Lenticularrrr's own cross-tool restriction override.
- [ ] Build the project library, including create, rename, duplicate, trash,
      restore, and explicit empty-trash actions.
- [ ] Build PNG, JPEG, WebP, and TIFF drag/drop and file-picker imports.
- [ ] Show upload, decode, normalization, and dimension errors clearly.
- [ ] Preserve frame-slot version history and active-version selection.

### 3. Registration workspace

- [ ] Build a stable output rectangle with configurable aspect and resolution.
- [ ] Add onion-skin, blink, split, and side-by-side comparisons.
- [ ] Add crop, translate, scale, rotate, and background-fill controls.
- [ ] Add transform reset and copy-to-other-frame actions.
- [ ] Keep all edits non-destructive in `project.json`.
- [ ] Add an explicit full-resolution flattened PNG derivative action.
- [ ] Support two registered frames and optional third-frame insertion/removal.

### 4. Virtual lenticular preview

- [ ] Build the GPU-backed artwork preview using the shared optical model.
- [ ] Add drag-to-tilt interaction.
- [ ] Add auto-rock range, speed, hold, pause, and direction controls.
- [ ] Support vertical and horizontal lens/viewing directions.
- [ ] Support reversible frame order.
- [ ] Add ideal flip, simulated crosstalk, side-by-side, and lenticule debug
      modes.
- [ ] Add adjustable viewing cone, LPI, phase, crosstalk, and transition
      softness.
- [ ] Provide a magnified lens-rib view because literal screen-scale LPI can
      alias.
- [ ] Add browser-approximate physical-size display with a visible warning.

### 5. Diagnostics

- [ ] Generate absolute RGB and luminance difference heatmaps.
- [ ] Analyze A/B and each adjacent pair for three-frame projects.
- [ ] Show changed-pixel percentage plus mean and peak luminance deltas.
- [ ] Report clipped-highlight and clipped-shadow counts.
- [ ] Add registration overlays.
- [ ] Add configurable advisory frame-to-frame contrast warnings.
- [ ] Add configurable advisory subject/background contrast warnings.
- [ ] Keep diagnostics explanatory and dismissible rather than pass/fail gates.

### 6. Two-dimensional room mockups

- [ ] Include a neutral bundled wall mockup.
- [ ] Support imported room photos copied into the project.
- [ ] Add artwork position, scale, rotation, perspective, frame, and mat controls.
- [ ] Scale physical print dimensions relative to a manually supplied wall
      reference.
- [ ] Drive the placed artwork with the same pointer and auto-rock simulation.
- [ ] Keep the artwork surface renderer reusable by a future Three.js gallery.

### 7. Approvals and exports

- [ ] Add named approval creation.
- [ ] Require two or three active registered frame versions before approval.
- [ ] Snapshot project state, simulation, dimensions, diagnostics, transforms,
      warnings, optional provenance, checksums, timestamps, and app version.
- [ ] Render deterministic full-resolution flattened PNG frames.
- [ ] Run approval rendering as a persisted job that survives page refresh.
- [ ] Generate MP4 and GIF auto-rock previews with `ffmpeg` and the shared
      optical weighting model.
- [ ] Show a clear capability/error state when `ffmpeg` is unavailable.
- [ ] Write all approval files directly under
      `approvals/<approvalId>/`; do not generate a ZIP.
- [ ] Add approval history and frozen-approval inspection.
- [ ] Compare the current draft with an earlier approval.
- [ ] Prevent edits to prior approvals.
- [ ] Let later project edits return the working copy to draft without mutating
      approved artifacts.

### 8. Polish and documentation

- [ ] Handle loading, empty, corrupt-manifest, upload-progress,
      unsupported-image, mismatched-aspect, missing-ffmpeg, job-failure, and
      trash/restore states.
- [ ] Keep preview and control dimensions stable when changing modes or frames.
- [ ] Make the dense desktop workbench usable at narrow viewport widths.
- [ ] Document project storage, supported imports/exports, `ffmpeg`, recovery,
      trash, and the uncalibrated-simulation contract.
- [ ] Document the future calibration and live-capture boundaries.

## Expected Files

```text
src/dev/shared/lenticularrrr/
  model.mjs

src/dev/tools/lenticularrrr/
  LenticularrrrPage.jsx
  LenticularrrrPage.css
  devPage.config.js
  todo.md
  components/
  hooks/
  utils/

src/dev/server/lenticularrrr/
  plugin.js
  projectService.js
  imageService.js
  approvalService.js
```

Existing files expected to change:

- `.eslintrc.json`
- `.gitignore`
- `src/dev/server/devServerPlugins.js`

Existing behavior to verify, not duplicate or manually register:

- `src/dev/devPageRegistry.js`
- `src/dev/shell/DevLandingPage.jsx`
- `src/dev/tools/cataloggr/catalogData.js`
- `src/dev/server/cataloggr/todoService.js`

Useful implementation references whose internals must not be imported across
tool boundaries:

- `src/dev/server/cataloggr/service.js`
- `src/dev/server/rorschach/jobService.js`
- `src/modules/mediaRecorder/utils/recording.js`
- `resourceArchive/Lenticulars/BurningAtBothEnds/`

## Verification

- [ ] Run focused ESLint on the new shared model, tool, server, plugin registry,
      and `.eslintrc.json`.
- [ ] Run formatting checks/fixes for touched files.
- [ ] Load `/dev` and confirm the Lenticularrrr card appears automatically.
- [ ] Load `/dev/lenticularrrr` directly and refresh it successfully.
- [ ] Confirm the workbench is not eagerly loaded before navigation.
- [ ] Load `/dev/cataloggr` with all channels and areas selected.
- [ ] Confirm the `Dev Tool / Local Only` Lenticularrrr card, posting state,
      source link, and editable tool TODO.
- [ ] API-smoke create, read, update, duplicate, upload, flatten, delete, restore,
      empty trash, and asset range responses.
- [ ] Reject corrupt, oversized, unsupported, and path-traversal inputs.
- [ ] Verify original source checksums remain unchanged after all edits.
- [ ] Exercise the seeded Burning pair in ideal and crosstalk modes.
- [ ] Verify horizontal and vertical viewing directions and reversed frame order.
- [ ] Verify exact 1000x1400 flattened Burning derivatives.
- [ ] Add a synthetic third frame and verify ordering plus adjacent-pair
      diagnostics.
- [ ] Render multiple derivatives and switch active version history.
- [ ] Approve, edit the draft, and confirm old approval assets remain byte-stable.
- [ ] Generate and inspect playable MP4 and GIF approval previews.
- [ ] Repeat approval without `ffmpeg` and confirm a recoverable error without
      losing project state.
- [ ] Import a room photo and verify physical sizing, placement, scrub, and
      auto-rock at desktop and narrow viewport sizes.
- [ ] Run `npm run build`.
- [ ] Search production output for `Lenticularrrr`,
      `/dev-api/lenticularrrr`, and tool-specific chunks to prove the dev tool is
      absent from production bundles.
- [ ] Compare the Burning simulation with the physical print when convenient;
      preserve useful findings for the later calibration phase.

## Later Phases

### Embedded scene capture

- Load real eye-candy scenes inside the workbench.
- Freeze and capture named shots.
- Record scene, renderer, route, preset, complete controls, camera, viewport,
  animation time, and seeds.
- Solve project-owned or explicitly exposed Leva/control snapshots instead of
  scraping private scene state.

### Printer-ready production

- Add vendor, lens sheet, printer, substrate, cost, order, and proof records.
- Add calibration charts and measured pitch/phase correction.
- Generate calibrated interlaced output.
- Add bleed, trim, safe-area, gamut, ICC/CMYK, TIFF, and vendor package support.
- Attach received-proof photographs and postmortem notes.

### Additional lenticular effects

- Animation.
- Parallax/3D.
- Morph.
- Zoom.

### Three-dimensional gallery

- Reuse the project model and artwork surface simulator in a Three.js room.
- Drive frame visibility from the viewer's real angle to the artwork.
