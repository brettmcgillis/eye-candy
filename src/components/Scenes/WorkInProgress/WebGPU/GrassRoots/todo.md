# Grass Roots (working title — scene unnamed so far)

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

## To verify (human eyeball on live server)

- [ ] Text reads upright from the default camera (v-flip in
      utils/heightField.js `sampleMask(u, 1 - v)` — flip if mirrored)
- [ ] Wall steepness vs Wall Softness (canvas blur px) feels right
- [ ] Perf: 320² terrain + 60k blades + terrain castShadow on mobile —
      consider quality control / lower defaults if it chugs
- [ ] Strata band look — may want more than 2 band colors, pebble grain

## Next ideas

- [ ] Real name for the scene
- [ ] Waterline decal/foam ring where walls meet water
- [ ] Roots/overhang detail at the grass lip of each cut
- [ ] Dragonflies / floating seeds in the light
- [ ] Adaptive quality (blade count + segments by device)
- [ ] Post later per conventions (maybe subtle vignette/DoF once settled)
- [ ] Add more fonts.
- [ ] Add terrain laines around exterior of plane, not just inside text
- [ ] Make text input a text area, alow for line breaks in text cut outs of grass.
- [ ] Align this todo file with repo convention
- [ ] Prevent overlay hide when typing text in text box.
- [ ] Add more noise to dirt strata, lines are too clean currently. lines should follow curves of terrain too, like compacted layers over time.
- [ ] Allow rotating text up to 90\* to allow max terrain usage.
- [ ] make sure wind speed over clouds, grass and water are uniform.
