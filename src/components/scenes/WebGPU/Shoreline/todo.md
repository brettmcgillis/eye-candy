# // Shoreline

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- Swell rolling onto a rocky shelf and breaking, in real 3D rather than a top-down field: a baked bathymetry drives a shallow-water solve, and the foam it throws is its own advected field.
- Reference: aerial footage of surf over dark rock, where the foam networks read almost like a reaction-diffusion pattern. The Overhead preset is that framing; the default view is the 3D one.

## // TODO:

- [ ] Spray and airborne droplets at breaking cells — the solver already computes the breaking term the spawner would read.
- [ ] Wet-sheen memory on the rock: the waterline is a static height ramp right now, so a wave that ran up does not leave the rock dark behind it.
- [ ] Post-processing left out per scene-conventions §12.
- [ ] The virtual-pipe solve resolves the swell but nothing shorter than a cell (~0.5m). Fine detail is analytic ripples in the water material, not simulation.
- [ ] Shore controls rebake the bed and reflood the solver, which drops the current wave state. Consider rebaking without a reflood.
- [ ] No environment map — the sky tint is a flat fresnel term. A small HDR would carry the reflections better.
- [ ] Solver runs at a fixed 256², independent of render scale. Worth a resolution control once the look is settled.

## // Presets

- [ ] Tune Overhead against the reference footage — foam coverage and rock contrast are the two that matter.
- [ ] A storm preset: short period, high drive, foam everywhere.

## // Features

- [ ] Wave-maker directionality, so the swell can arrive at an angle to the shore.
- [ ] Tide level, moving the whole waterline over minutes.

## // Interactivity

## // Bugs
