# // Explorer

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- An emissive sphere trailing smoke, exploring the dark caverns of an
  Apollonian fractal. The sphere is the scene's only light source.
- The fractal is mrange's "gnarly apollian tree", which came out of the
  Apollian scene when that scene narrowed to the 4D slice. Unconfined, its
  mirrored lattice is an infinite cavern system rather than a sculpture; the
  `Confine to Tree` control puts the original's bounding box and ground plane
  back to see it as the Shadertoy framed it.
- The distance estimator is shared with Apollian through `@modules/sdf` — one
  Apollonian fold in the repo, not two.

## // Notes

- **The field is written twice.** `utils/treeDistance.js` is a CPU mirror of
  `apollianTree` in `@modules/sdf`, because the agent steers by probing the
  field and there is no cheap way to read the GPU's copy back per frame. They
  take the same control values and must stay identical.
- **Measured before it was built.** A survey of the field at the shipped
  defaults: chambers top out around 0.22 across in fractal units; at a
  clearance of 0.02 about 31% of the volume is free and 99% of that free space
  is a single connected pocket; at a clearance of 0.12 it is 11% free with 82%
  still connected. That connectivity is why the agent can fly at all.
- **The field is not 1-Lipschitz** — its gradient peaks around 2.3 — so a
  full-length march step can tunnel through a thin branch. `Step Safety` scales
  every step and 1.0 is the Shadertoy's own behaviour, but it is a **look**
  control, not a quality one: the estimator is conservative enough that shorter
  steps keep finding more geometry and the image never converges. Mean frame
  luminance runs 49 / 33 / 17 at 0.6 / 1.0 / 2.0. Raising it is not free speed,
  it deletes thin branches.
- **`Range` is the perf control**, not `Max Steps`. Capping the march where the
  lantern dies took the frame from 79 to 39 ns/pixel; at the shipped Range the
  step budgets are slack enough that 96 → 56 steps and 24 → 12 shadow steps
  give a byte-identical frame. `utils/lantern.js` derives the march cap, the
  fog density and the inverse-square falloff from that one number — set apart
  they disagree and the cap reads as a sphere of nothing instead of a fade.
- **Every length control is in fractal units** and is multiplied by
  `Cavern Scale` on sync, so changing the scale doesn't break the surface
  epsilon, AO reach, or shadow bias.
- Lighting is a point light plus an SDF soft shadow and AO — not GI. If it
  reads flat, the escalation path is written down in `plans/explorer.md`.
- **Render Scale goes through `@hooks/useRenderScale`, never `setDpr`** —
  R3F's `Canvas` re-runs `configure()` on every render and writes its `dpr`
  prop back over anything a scene set, silently.
- **Measuring this scene:** Leva keeps control values across HMR, so editing a
  default and letting it hot-reload does not change the live value. Any A/B
  needs `localStorage.clear()` and a full reload, with the live config read
  back alongside the timing — and the agent parked, or the flying camera swamps
  the difference.
- **Dead ends, measured, don't retry:** Keinert over-relaxed sphere tracing
  (its overlap test fires on nearly every step, because an estimator carrying
  `0.25 *` never produces overlapping spheres); a looser `Surface Epsilon` (no
  effect — the rays traverse, they don't creep); fewer `Folds` (_slower_, less
  geometry means rays fly further before they hit).

## // TODO:

- [x] Smoke: TSL compute particles emitted from the sphere's surface, advected
      by curl noise, depth-sorted and alpha blended
- [x] Light the smoke off the sphere and self-shadow it against the fractal
- [ ] Re-enable smoke. It is built and lit but ships **off** — it is the last
      polish pass, and it was 18% of the frame back when the frame was 336ms.
      Re-measure it against the current budget before turning it back on.
- [ ] Bloom, last and shipped disabled
- [ ] Tune the chase spring — it currently has no roll, so banking through a
      turn reads as a slide
- [ ] Decide mobile render scale default

## // Presets

- **Ember** — the default warm sphere in the open lattice.
- **Cold Signal** — the same flight, blue.
- **Tight Passage** — smaller caverns, shorter follow, wider lens, short lantern.
- **Wide Dark** — the lantern opened up to 2.2, at a lower render scale to pay
  for it. The one to load to see how much lattice is actually out there.
- **The Sculpture** — the Shadertoy's own framing: confined, parked, free camera.

## // Features

## // Interactivity

## // Bugs
