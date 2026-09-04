# // Petri Dish

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- A non-tiled, expansive reaction-diffusion field driving a sand bed inside TheSpeedOfLightning's studio, grown/cull-mapped instead of stamped by a lightning strike.

## // TODO:

- [ ] Post-processing was left out of v1 per scene-conventions §12 — revisit once the field/cull look is settled.
- [ ] The reference shader's mouse-driven vortex-pair warp was intentionally skipped — could come back as pointer interaction over the sand.
- [ ] Tune `expansionStrength`/`reactionStrength`/`decayRate` live against `references/expansive-reaction-diffusion.glsl` — the texel-space reformulation isn't numerically identical to the original UV-space shader.

## // Presets

- [ ] Thick Bed — deep field, no culling, studio floor never visible.
- [ ] Thin Spread — shallow field, field-driven culling on, cycling growth so the visible gaps keep changing.

## // Features

## // Interactivity

## // Bugs
