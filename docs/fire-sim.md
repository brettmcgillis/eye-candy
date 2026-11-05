# Fire sim and curl smoke

The fluid fire and sorted curl smoke from Burning At Both Ends, shared by
every scene that burns something. WebGPU only (compute).

```
@modules/fireSim     createFireSim: the webgpu_volume_fire solver on a box, capsule
        │              emitters, a baked guide field, realistic/cartoon/clay marches,
        │              pluggable occluder
@modules/curlSmoke   createCurlSmoke: laminar-to-curl particles along paths, bitonic
        │              sort, realistic/cartoon/clay draws
        ├─ @modules/candleRender   SimFlames (one wick emitter + waxOccluder),
        │                            CurlSmokeLayer (mirror: true)
        └─ @elements/SimFire       SplineSimFire / SplineCurlSmoke over authored
                                     Fire / Smoke splines, simFireControls (Leva),
                                     applySmokeConfig
             ├─ WebGPU/PolicePresence     SplineSimFire only; its smoke is its own
             │                              SmokePlume (below)
             ├─ WebGPU/FlyingHigh
             └─ WebGPU/StillPullingForYou   StackSmoke: live paths + cursor
```

Run `npm run candle:check -- --render` after changing either module: the
candle is the one consumer with headless checks.

## `@modules/fireSim`

`createFireSim({ size, resolution, forceHeight, occluder })`. The solver is
documented in `docs/candle-pipeline.md` (cubic cells, forces scaled by
`forceHeight`, age-gated thermal turbulence). What is generic:

- **Emitters.** Up to `MAX_EMITTERS` (8) capsules in box space:
  `setEmitter(i, { a, b, radius, strength })`, `setEmitterCount(n)` zeroes
  the rest. Unused emitters keep radius 1 and strength 0 (radius 0 would
  divide by zero in every cell). They are uniforms unrolled into the dye
  pass, not a uniform array, because `uniformArray` updates per render and
  is not refreshed for compute.
- **Guide.** `setGuides(paths)` bakes polylines (`bakeGuide.js`, on the CPU)
  into a half-float 3D texture of target velocity (xyz) and weight (w).
  The velocity pass relaxes toward it at `guidePull`: 0 is pure buoyancy,
  higher hugs the path. `taper` fades the weight toward a path's end so the
  gas leaves it under its own buoyancy. Each bake walks every cell and
  segment, so it runs when the layout changes, not per frame.
- **Occluder.** `'depth'` (`depthOccluder`) clips the march where the
  camera ray meets the opaque scene's depth buffer, converted to box-space
  `t`. It works for a box inside a uniformly scaled parent. A function
  `(eye, dir) => t` supplies an analytic one. The candle uses its
  `waxOccluder` because the viewport depth reads 0 headlessly. `null`
  never clips.
- **Daylight and cost knobs** (realistic look; defaults leave every other
  consumer's output unchanged). `flameOpacity` lets hot luminous gas hide
  what is behind it: emission alone is additive and vanishes into a pale
  background. `sootColor` is the light soot scatters (black absorbs only).
  `stepLength` (> 0) marches at a fixed world step instead of `span / steps`,
  so short rays take fewer samples; `steps` stays the cap. `skipBelow`
  skips the shading of samples whose soot + temperature is under it (-1
  never skips). `cutoff` ends a ray once its transmittance falls below it.
  Every ray stops where the occluder hides it.
- A sim step is one compute submit (its passes share every uniform); the
  per-dispatch overhead of ten submits was most of a step's cost.
- `sootDensity` scales soot extinction. The candle's 22 is far too dense
  at metre scale.

## `@modules/curlSmoke`

`createCurlSmoke({ count, look, mirror, clayMaterial })`. The particle model
is documented in `docs/candle-pipeline.md` (thread then eddies, per-age
opacity, the curlNoise window and its wrapped drift). What is generic:

- **Paths.** `setPaths([{ origin, points }])`, up to `MAX_PATHS` (4).
  Points are relative to `origin` and resampled to `PATH_SAMPLES` equally
  spaced points. Particles share out over the paths (`i % pathCount`), each
  tracking its arc length in its own buffer. Rise, the meander, the pull
  back to the thread and the spawn disc all work in the path's frame.
  Past either end a path carries on along its end tangent. The default
  path is straight up, which is the candle.
- `emitRadius` (spawn disc), `lightReach` (falloff of the warm light from
  `flameTop` / `flameBottom`). `mirror` draws the half-turn copy round
  `emitterBottom`. `clayMaterial(u, colorNode)` is injected for the clay
  look, so the module does not import a consumer.
- `attractor` / `attraction` / `attractRadius`: one point attractor in
  world space, pulling at `attraction` (negative repels) and fading to
  nothing at `attractRadius`. Off (0) by default.
- Per-particle alpha falls with sprite area. At metre scale, opacity has to
  be several times the candle's before the column reads at all.

## `@elements/SimFire`

- `SplineSimFire({ splines, fire })`: one sim box round all the given
  Fire splines (bounds plus `padding` and `guideRadius`, plus `headroom`
  above). Each spline emits along its first `emitLength` and guides along
  all of it. Optional per-spline `simScale` / `simStrength` / `simGuide`
  keys scale an emitter's radius, rate and guide weight. It includes a
  flickering point light over the emitters. The box is rebuilt only when
  its size, `resolution` or `forceHeight` changes. Every other knob is a
  uniform. `fire` may also carry the daylight and cost knobs above
  (`flameOpacity`, `sootColor`, `stepLength`, `skipBelow`, `cutoff`);
  `fireConfig` does not map them, so a scene adds its own controls.
- `SplineCurlSmoke({ splines, smoke, glowAt })`: one smoke system along up
  to four Smoke splines, warm-lit near up to two `glowAt` points.
- `applySmokeConfig(instance, smoke, glowAt)` writes a `smokeConfig` onto
  a curl smoke's uniforms, for a consumer that drives `createCurlSmoke`
  itself.
- `simFireControls.js`: `fireFolder` / `smokeFolder` (Leva, seeded from the
  preset snapshot, flat `fire*` / `smoke*` keys) and
  `fireConfig` / `smokeConfig` mapping controls to props. Both scenes use
  the same keys, so presets carry between them.
- Splines are in the space of the group the component sits in. Flying High
  mounts both inside the plane's transform, so `@presets/fire/flyingHighFire`
  is authored in the Boeing737 model's own space.

## Still Pulling For You

`StackSmoke` drives `createCurlSmoke` directly because its paths move: the
runtime smoke splines follow the stack anchor every frame (Rough Waters
moves only the first point), so it calls `setPaths` each frame. Each path's
origin stays at the authored spline's first point, since particles are
stored relative to the origin and a moving origin would drag the whole
plume with the boat. The cursor attractor feeds the module's attractor
uniforms, and `flameTop` sits on the stack anchor for the `smokeGlow` warm
light. The smoke splines draw no smoke of their own; Edit Splines shows
them for authoring.

## Police Presence

The car burns in daylight on white paper, so its fire turns on
`flameOpacity` and `sootColor`, and each `@presets/fire/policePresenceFire`
spline is a short emitter lying along one opening (windshield, four side
windows, rear glass, roof, hood) with no guide pull: buoyancy and wind make
the tongues. The smoke is not curl smoke, which builds candle wisps from
tens of thousands of tiny sprites (a wig at car scale, and ~1 G blended
fragments a frame). `components/SmokePlume` draws ~1k lit cauliflower puffs
from `utils/smokePlume.js`: rising, slowing and swelling as they cool,
sheared by wind that grows with height, near-black and fire-lit at the base,
grey up top. Each bitonic sort pass owns its (k, j) uniforms so the update,
keys and the whole network share one compute submit. Smoke draws before the
fire (renderOrder 1 vs 2), so flames always read over it.
