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
             ├─ WebGPU/StillPullingForYou   StackSmoke: live paths + cursor
             └─ WebGPU/WildHorses

@modules/plumeVolume  fire and smoke as one raymarched volume along trails, cloud-lit,
        │               marched at reduced resolution and depth-composited
        ├─ WebGPU/FlyingHigh       engine and wing-root trails in the plane's space
        └─ WebGPU/PolicePresence   one trail per vent, wound into a leaning column,
                                     siren and headlamp beams as spot lights
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

## `@modules/plumeVolume`

Fire and smoke for a scene where both read as one mass rather than a sim
and a particle layer: Flying High's volume, promoted when Police Presence
became its second consumer. WebGPU only; no compute.

- **Trails.** Each trail is `{ path, salt, scale, span }`: a polyline of
  exactly `pathSamples` points in the volume's space, a billow offset, a
  width against `shape`, and how far along it stops (`span`, default 1). A
  short trail with `span` < 1 that ends inside a long one shares its width
  and heat where they meet: that is how tongues join a body of fire. Give
  trails that make one fire the same `salt`; a per-trail salt seams where
  the volume's choice of nearest trails changes. `plumeBounds` sizes
  the box (`cell`, `margin`), `plumePointsTexture` packs the trails,
  `bakePlumeGuide(trails, enabled, bounds)` bakes, per voxel, the distance
  to the nearest enabled trail, how far along it, and the nearest two
  segments. The bake walks every voxel and segment on the CPU, so rebuild it
  when the trails or a toggle change, not per frame.
- **Blend.** Only two trails are known per voxel. They melt into each other
  over `blend` trail widths (default 0.6, Flying High's). Where a third comes
  within that band the pair changes voxel to voxel and the volume shows
  squares on the guide's grid, so trails packed together want a narrow band
  (Police Presence uses 0.2).
- **March.** `createPlumeVolume({ bounds, guide, noise, pathSamples, points,
u })` returns `(scenePass) => { frame, smoke }`: `smoke` is an RTT node to
  `setResolutionScale` each frame, `frame` the scene with the volume laid
  over it. Smoke is Beer-Lambert soot with a two-lobe Henyey-Greenstein
  phase, three self-shadow taps toward `lightDir` and an ambient that darkens
  toward each trail's core. Fire is emission over the first `fire.x` of every
  trail. Skips and strides are whole steps, so each ray keeps its jitter;
  a free-length skip lands neighbouring rays on the same depths and the
  slices show as rings. The composite drops a smoke texel wherever the scene
  is nearer than where that texel's smoke starts, so thin geometry in front
  stays crisp.
- **Tongues.** `lick.x` > 0 carves the flames with a rising, upright-stretched
  noise (`lick.y` speed, `lick.z` scale, `lick.w` vertical squash): the base
  stays nearly whole and only the peaks survive toward the flame tips, so the
  fire licks instead of filling a smooth tube. Off by default.
- **Uniforms.** `createPlumeUniforms()`; the consumer writes the look from
  its controls, and calls `updatePlumeCamera(u, camera, gl)` and sets
  `u.toLocal` (world to the volume's space, identity for a world-space
  volume) each frame.
- **Spots.** With `spots: n` and `spotTexture` from `createSpotTexture(n)`,
  `n` cone lights (written with `writeSpot`, already in the volume's space)
  light the smoke (`haze.z`) and a thin haze in clear air (`haze.x` per unit
  length, thinning with height over `haze.w`), so their beams show. While
  haze is on, empty-space skips are capped at `haze.y`. The haze only adds
  light. With no spots the WGSL is the Flying High march unchanged.
- `noise` is `sharedNoise()` from `@utils/tileableNoise3d`, the same texture
  Flying High's sky reads.

## Police Presence

The car burns in daylight on white paper. Its fire and smoke are one
`@modules/plumeVolume` (`hooks/useFireVolume`, composited by
`components/PostStack` ahead of bloom). The blaze is the cabin: two wide
`core` sources inside it (`utils/cruiser.js` `OPENINGS`, Cabin) rise through
the roof and carry on up one column that leans downwind, each keeping part of
its offset and turning round the axis so the column reads as billows wound
together. Every opening (windshield, the four side windows, rear glass, hood)
is a short trail that lips out, climbs the body beside it, and ends inside
the cabin's fire over the roof (`span`), so the car burns as one fire with
tongues. An earlier layout ran every opening out and up its own way into the
column; orbiting showed a ring of jets round an empty cabin
(`utils/trails.js`; Column controls rebake). With Cabin off there is no
column, only the tongues. The light bar's
four rotating beams and the alarm-flashed headlamps are written as spots each
frame from `utils/beams.js`, the same math the scene's lamps use, so red and
blue sweep through the smoke in step with the bulbs.

Alongside the volume: flickering fire point lights (the cabin one casts the
car's shadow), GPU embers (`@modules/embers`, motion-streaked sprites that
write depth so the composite keeps the ones in front of the smoke), the
cruiser's materials swapped for charred copies (`utils/charMaterial.js`: soot
round each vent and over the roof, streaks run down the doors, glowing
blisters, a burning cabin, smoked glass that no longer writes depth so the
fire inside shows through), lamp flares that wink as a beam faces the lens,
and a scorched floor.

TSL gotcha met here: `a.mix(b, t)` is `mix(b, t, a)`, the node is the
factor. Write `mix(a, b, t)`.
