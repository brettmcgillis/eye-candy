# // Touch Grass

# // TODO:

[Back to main TODO](../../../../../TODO.md)

# // Intent / Use Cases

Rolling grassy terrain; letters CSG-carved from the terrain down to a common
water table; sediment strata on the cut walls; wind in the grass; sunny
afternoon with light clouds rolling through (Surrender-style cloud shade).

- [x] Shared CPU-baked heightfield (hills FBM + canvas-text carve) sampled by terrain (GPU displacement + per-pixel normals), grass scatter (CPU), and strata shading
- [x] Instanced grass (up to 150k blades, buffers allocated once), FBM gust field + per-blade flutter, carve-aware scatter with edge thinning
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
- [x] Strata band look — want more than 2 band colors, pebble grain
- [x] Waterline foam ring + depth-tinted water (water samples the shared heightfield: noisy lapping foam edge + second pulsing band at shallow shores, darker body over deep letter floors, foam boosts opacity)
- [x] Floating seeds in the light
- [x] fix seeds - currently following terrain down into text cutouts, should just go across the top where the terrain would have been.
- [x] Add more font options.
- [x] Add terrain lines around exterior of plane, not just inside text
- [x] Make text input a text area, alow for line breaks in text cut outs of grass.
- [x] Prevent overlay hide when typing text in text box.
- [x] Add more noise to dirt strata, lines are too clean currently. lines should follow curves of terrain too, like compacted layers over time.
- [x] Allow rotating text up to 90\* to allow max terrain usage.
- [x] Allow rotating terrain up to 90\* to allow max view-port usage.
- [x] make sure wind speed over clouds, grass and water are uniform.
- [x] add toggle to switch between 'chunk' of terrain with sidewalls, and an 'endless' terrain where we never see eges.
- [x] would like a preset where the terrain height is animated and water table depth fluctuates slightly
- [x] the curves of fonts are looking pixelated. try and fix/smooth that out
- [x] add a preset for, and enable water to have the characteristics of dirty black oil.

- [x] allow rotating text on x-axis so the hole goes into the earth on a slant
- [x] Dragonflies & Butterflies & Bees (good example in `~/dev/examples/demo-2022-grass` )
- [x] seeds look good but where do they come from? -> need some flowers (good example in `~/dev/examples/demo-2022-grass`)
- [x] make flowers sway in wind
- [x] Post later per conventions (SnowSystem-style parity pass implemented: DoF-style blur, bloom, and film grade with vignette/grain/chroma/contrast/saturation)
- [ ] use `ez-tree` dependency to add some nice trees and shrubs on the terrain
- [x] Roots/overhang detail at the grass lip of each cut (root-lip instanced strands + stronger layered strata/ledge shading)
- [ ] Ambient audio & audio toggle overlay button
- [ ] Revisit the following since the camera gets close to the grass: LOD vertex folding, distance stochastic culling/density compensation, compute-pass frustum culling, view-dependent thickness tilt, distance denoising blends. Studied `~/dev/examples/r3f-procedural-grass` (Ghost-of-Tsushima style) & revo realms (TSL) `~/dev/examples/revo-realms`
- [ ] might want to take a look at `~/dev/examples/demo-2022-grass`,`~/dev/examples/demo-2022-realistic-meadow` for a good grass solutions. looks much better than ours. includes lil flowers.
- [ ] improve water apperance. might consider using the realistic ocean from RowItAlone Webgpu
- [ ] replace bee & dragonfly with simplistic approximations like butterfly.
- [ ] add a preset for Cut Grass. see `cutGrass.js`

# // Presets

# // Features

# // Interactivity

- [ ] cursor + water interaction
- [x] cursor + grass interaction
- [ ] could we cut the grass? if so then we add an overlay button to allow enabling mower. add control for mower width. as user moves cursor grass gets 'cut' down to a specific length, or removed all together. grass grows back after a few seconds

# // Bugs
