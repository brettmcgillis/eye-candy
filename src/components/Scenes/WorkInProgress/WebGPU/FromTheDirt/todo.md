# From The Dirt

Rolling grassy terrain; letters CSG-carved from the terrain down to a common
water table; sediment strata on the cut walls; wind in the grass; sunny
afternoon with light clouds rolling through (Surrender-style cloud shade).

## Done (first pass)

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

## Grass v2 (from references)

Studied `~/dev/examples/r3f-procedural-grass` (Ghost-of-Tsushima style) and
revo-realms `src/entities/Vegetation/Grass.ts` (TSL). Adopted:

- [x] Pointed-tip tapered blade geometry (rows + tip vertex, revo-style)
- [x] Cubic Bézier blade spine with per-blade bend (curved blades)
- [x] Wind = steady push + low-freq sway + high-freq cross-wind flutter,
      traveling wave phase + spatial gust field + breathing envelope
- [x] Clump scatter (jittered grid cells) → clump/blade color layering and
      clump-dome normal blending in the fragment stage
- [x] Height AO power curve + fake backlight translucency (sun through
      blades at grazing angles)

Deliberately skipped (fixed far camera makes them low-value here): LOD vertex
folding, distance stochastic culling/density compensation, compute-pass
frustum culling, view-dependent thickness tilt, distance denoising blends.
Revisit if the camera ever gets close to the grass.

## To verify (human eyeball on live server)

- [ ] Text reads upright from the default camera (v-flip in
      utils/heightField.js `sampleMask(u, 1 - v)` — flip if mirrored)
- [ ] Wall steepness vs Wall Softness (canvas blur px) feels right
- [ ] Perf: 320² terrain + 60k blades + terrain castShadow on mobile —
      consider quality control / lower defaults if it chugs
- [ ] Strata band look — may want more than 2 band colors, pebble grain

## Next ideas

- [x] Waterline foam ring + depth-tinted water (water samples the shared
      heightfield: noisy lapping foam edge + second pulsing band at shallow
      shores, darker body over deep letter floors, foam boosts opacity)
- [ ] Roots/overhang detail at the grass lip of each cut
- [x] Floating seeds in the light (GPU-only sprites: hash-derived homes,
      wind-drift with wrap, hover over sampled heightfield, radial-falloff
      glow + twinkle; Seeds Leva folder) — dragonflies still open
- [ ] Dragonflies
- [ ] Adaptive quality (blade count + segments by device)
- [ ] Post later per conventions (maybe subtle vignette/DoF once settled)
