# // From The Dirt

# // TODO:

[Back to main TODO](../../../../../TODO.md)

# // Intent / Use Cases

Rolling grassy terrain; letters CSG-carved from the terrain down to a common
water table; sediment strata on the cut walls; wind in the grass; sunny
afternoon with light clouds rolling through (Surrender-style cloud shade).

- [x] Shared CPU-baked heightfield (hills FBM + canvas-text carve) sampled by
      terrain (GPU displacement + per-pixel normals), grass scatter (CPU),
      and strata shading
- [x] Instanced grass (up to 150k blades, buffers allocated once), FBM gust
      field + per-blade flutter, carve-aware scatter with edge thinning
- [x] Common water table plane with noise ripple normals
- [x] Absolute-Y strata bands + surface-hugging topsoil + damp line at water
- [x] Cloud-shadow TSL Fn shared by terrain/grass/water
- [x] Near-ortho camera (fov 15, far back) with clamped orbit
- [x] Presets / CameraRig / MediaRecorder wired per conventions

- [x] Pointed-tip tapered blade geometry (rows + tip vertex, revo-style)
- [x] Cubic Bézier blade spine with per-blade bend (curved blades)
- [x] Wind = steady push + low-freq sway + high-freq cross-wind flutter,
      traveling wave phase + spatial gust field + breathing envelope
- [x] Clump scatter (jittered grid cells) → clump/blade color layering and
      clump-dome normal blending in the fragment stage
- [x] Height AO power curve + fake backlight translucency (sun through
      blades at grazing angles)

- [ ] Revisit the following since the camera gets close to the grass: LOD vertex folding, distance stochastic culling/density compensation, compute-pass
      frustum culling, view-dependent thickness tilt, distance denoising blends.

- [ ] Strata band look — want more than 2 band colors, pebble grain

- [x] Waterline foam ring + depth-tinted water (water samples the shared
      heightfield: noisy lapping foam edge + second pulsing band at shallow
      shores, darker body over deep letter floors, foam boosts opacity)
- [ ] Roots/overhang detail at the grass lip of each cut
- [x] Floating seeds in the light
- [ ] seeds look good but where do they come from? need some flowers
- [ ] Dragonflies
- [ ] butterflies
- [ ] Adaptive quality (blade count + segments by device)
- [ ] Post later per conventions (maybe subtle vignette/DoF once settled)
- [ ] Add more font options.
- [ ] Add terrain lines around exterior of plane, not just inside text
- [ ] Make text input a text area, alow for line breaks in text cut outs of grass.
- [ ] Align this todo file with repo convention!!!
- [ ] Prevent overlay hide when typing text in text box.
- [ ] Add more noise to dirt strata, lines are too clean currently. lines should follow curves of terrain too, like compacted layers over time.
- [ ] Allow rotating text up to 90\* to allow max terrain usage.
- [ ] Allow rotating terrain up to 90\* to allow max view-port usage.
- [ ] make sure wind speed over clouds, grass and water are uniform.
- [ ] might want to take a look at dev/examples/demo-2022-grass, dev/examples/demo-2022-realistic-meadow for a good grass solutions. looks much better than ours. includes lil flowers.
- [ ] could we use eztree to add some nice trees and shrubs on the terrain
- [ ] improve water apperance. might consider using the realistic ocean from RowItAlone Webgpu
- [ ] cursor + water interaction
- [ ] cursor + grass interaction
- [ ] add toggle to switch between 'chunk' of terrain with sidewalls, and an 'endless' terrain where we never see eges.
- [ ] would like a preset where the terrain height is animated and water table depth fluctuates slightly

# // Presets

# // Features

# // Bugs
