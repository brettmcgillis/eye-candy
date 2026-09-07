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
  every step; 1.0 is the Shadertoy's own behaviour.
- **Every length control is in fractal units** and is multiplied by
  `Cavern Scale` on sync, so changing the scale doesn't break the surface
  epsilon, AO reach, or shadow bias.
- Lighting is a point light plus an SDF soft shadow and AO — not GI. If it
  reads flat, the escalation path is written down in `plans/explorer.md`.

## // TODO:

- [ ] Smoke: TSL compute particles emitted from the sphere's surface, advected
      by curl noise, depth-sorted and alpha blended
- [ ] Light the smoke off the sphere and self-shadow it against the fractal
- [ ] Bloom, last and shipped disabled
- [ ] Tune the chase spring — it currently has no roll, so banking through a
      turn reads as a slide
- [ ] Decide mobile render scale default

## // Presets

- **Ember** — the default warm sphere in the open lattice.
- **Cold Signal** — the same flight, blue.
- **Tight Passage** — smaller caverns, shorter follow, wider lens.
- **The Sculpture** — the Shadertoy's own framing: confined, parked, free camera.

## // Features

## // Interactivity

## // Bugs
