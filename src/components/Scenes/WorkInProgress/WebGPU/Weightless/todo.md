# // Weightless

# // Intent / Use Cases

Particle hummingbird. The animated hummingbird rig drives a WebGPU compute
sim: bind-pose surface samples (+ BVH interior fill) carry skin weights, and
every particle's home point is re-skinned on GPU against the live bone
matrices each frame. Bound particles swirl on/within the bird's volume with
curl noise (gpu-party style); fast-moving home points (wing tips / feathers)
shed particles that inherit wing velocity, fly free under curl noise +
pointer attractor, fade, and rebind. Afterimage post is toggleable.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] bird hover animation has a few ms of stationary hover before moving up and down. can we skip this when looping? (not attempted — needs visual inspection of the clip's loop point to trim safely, can't verify blind)
- [x] add discrete controls for bound vs emitted particles. (Emission > Emitted Size, independent of Particles > Bound Size — previously one `particleSize` drove both)
- [x] explore emitted particles growing slightly. (emitted scale now eases in over the first ~12% of life before shrinking, same curve shape as BurningCash's Embers.jsx, instead of starting at full size and only ever shrinking)
- [x] add control for ghost bird color (Bird > Ghost Color)
- [x] add control for background color (Environment > Background)

# // Presets

# // Features

- [x] Volume Fill: a genuinely bounded curl-trail system (Trails > Volume
      Fill). Each point has a fixed home anchor inside the bird and is
      spring-pulled + shell-clamped around it every frame (same
      home/spring/shell math as the GPU particle sim's bound particles),
      so it actually stays inside the bird instead of escaping — meant to
      eventually fill the body enough that Ghost Body isn't needed. Off by
      default (`volumeFillCount: 0`) in all existing presets so their
      looks didn't change; dial it in and save new presets.
      Ranges/steps are tightened vs. the field-line/surface systems
      (radius 0.005–0.4 step 0.005, flow 0–2 step 0.005, curl scale
      0.05–8 step 0.05) since the shell sits well inside the body — a
      wide range with no explicit `step` rounds to Leva's coarse ~0.01
      default, too blunt at this scale. Still likely needs live retuning;
      couldn't preview the WebGPU output to dial exact defaults.

# // Interactivity

- [ ] Pointer-curl trail interaction (stroke/click spawning Surface
      trails) doesn't reliably register hits during flapping. The pointer
      ray is only corrected for the bird's auto-fit transform
      (`birdStateRef.normMatrix`), not the current animated bone pose —
      raycasts test against the walk BVH's REST-POSE geometry
      (`buildWalkGeometry`, built once from bind-pose positions and never
      refit). While the wings are flapping, their visible position has
      moved but the BVH hasn't, so clicks miss or land on the wrong spot.
      Real fix needs either a live-skinned copy of the walk geometry
      (re-skin + `bvh.refit()` per interaction/frame) or accepting
      rest-pose-only accuracy — bigger lift, not attempted yet.

# // Bugs

- [x] "Interior" curl trails weren't actually bounded to the bird's
      volume — they spawn inside once, then advect freely along the curl
      field forever with only a probabilistic respawn pulling them back,
      so they balloon into a wandering field around the bird (this is
      what your two saved presets, Sketchbook and Magnetic north, are
      actually showing — high vs. low respawn rate). Renamed
      `interiorTrail*` → `fieldLine*` to match what the system actually
      does; all existing presets migrated to the new keys with identical
      values (Sketchbook/Magnetic north render unchanged). Genuine bounded
      interior fill is the new separate Volume Fill system above.
      `trailCurlScale` (previously shared by field lines + surface) split
      into independent `fieldLineCurlScale`/`exteriorCurlScale` — existing
      presets got both set to their old shared value, so nothing changed
      on migration, but they can now be tuned independently.
- [~] Control folder structure seems haphazard and disorganized. Trails
  folder reorganized into subfolders (Trails / Field Lines / Surface /
  Volume Fill) as part of the above; Bird/Particles/Emission/Color/
  Interaction/Post untouched — still a candidate for a fuller pass.
