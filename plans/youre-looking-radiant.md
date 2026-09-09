# You're Looking Radiant

WebGPU / WIP. Radiance-cascade 2D GI lighting a small swarm (20–200) of
particles that trade between emitting light and occluding it.

Delete this file when the scene lands.

## References

- `references/radianceCascades2D.glsl` — youssef_afella, https://www.shadertoy.com/view/3cKczD.
  The RC port target: 5 cascades, 4 rays/probe, one pass per cascade merging
  downward. Its scene SDF is analytic, which is why it is capped at ~12 arcs.
- `references/skyAndGearFix.glsl` — kornelski, https://www.shadertoy.com/view/XffcD7.
  Sky term (the light-vs-dark background switch) and the interval-dithering
  gear fix for ringing around small lights.
- `~/dev/examples/Shaders_RadianceCascades` — SimonDev, MIT. Second full RC
  implementation; the probe/bilinear-merge maths is spelled out more legibly
  than either shadertoy.
- `~/dev/examples/three-particles` — cullenwebber. The particle _look_: candy
  pastel shaded sphere impostors on curl noise with life/respawn, soft tinted
  shadows, gradient background.
- https://www.shadertoy.com/view/t3GcWV — glass disks. Deferred, see todo.md.

## Decisions

- **Pure 2D**, fullscreen quad. RC is inherently 2D; 3D would need a whole
  extra cascade dimension and would not look like the references.
- **CPU sim, GPU lighting.** 20–200 particles with short trail histories is
  nothing for JS, and it makes the role modalities trivial to author and
  extend. The GPU does splat → cascades → compose.
- **Splatted distance field, not analytic SDF in the march.** Each trail
  segment rasterizes a quad writing its exact analytic capsule distance;
  the depth test (`depthNode` = distance) resolves nearest-wins, so the colour
  attachment carries `vec4(emission, distance)` in one instanced draw. Cost
  stops scaling with element count, distances stay sub-texel-exact near
  surfaces so thin trails keep crisp edges, and circles / capsules / later
  glass disks are all the same code path.
- **Trail polyline particles.** Each particle keeps a ring buffer of recent
  positions; `trailLength` takes it from a circle (history 1) through a dash
  to a long snake that genuinely curves along the curl flow.
- **Sky intensity is the background switch.** Dark and light presets are the
  same pipeline with the sky term at 0 vs turned up.

## Passes per frame

1. CPU: advance swarm (curl noise + pointer attractor), push trail points,
   update each particle's emit/occlude role.
2. Splat: instanced quads → seed RT (`rgb` = emission, `a` = distance),
   depth test resolving min distance.
3. Cascades: N passes, top → 0, each `CastAndMerge` sphere-tracing the seed
   RT. Top cascade merges the sky instead of a higher cascade.
4. Compose: bilinear cascade 0, overlay the seed SDF to fix low-res edges,
   tonemap.

## Role modalities (`utils/roleModes.js`)

Keyed registry so more can be added without touching the sim:

- `age` — born emitting, fades to opaque, dies, respawns (three-particles
  life/dieSpeed model).
- `oscillate` — per-particle phase and period, cycling emissive ↔ occluding
  forever, no deaths.
- `wave` — a front sweeps the field flipping particles as it passes.

## Open

- Whether the cascade passes can run at full res or need half. Measure.
- Whether the splat footprint alone gives the march enough reach or a short
  Jump Flood pass is needed to propagate far-field distance. Start without.
