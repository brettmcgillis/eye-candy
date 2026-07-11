# // Weightless

[Back to main TODO](../../../../../../TODO.md)

# // Intent

Particle hummingbird. The animated hummingbird rig drives a WebGPU compute
sim: bind-pose surface samples (+ BVH interior fill) carry skin weights, and
every particle's home point is re-skinned on GPU against the live bone
matrices each frame. Bound particles swirl on/within the bird's volume with
curl noise (gpu-party style); fast-moving home points (wing tips / feathers)
shed particles that inherit wing velocity, fly free under curl noise +
pointer attractor, fade, and rebind. Afterimage post is toggleable.

# // Architecture notes

- `utils/sampleBird.js` — CPU sampling. Area-weighted surface sampling
  across all skinned meshes; interior points via three-mesh-bvh inward
  raycast on the body mesh. Skin indices from the nearest triangle corner.
  emitterMask encoding: 0 interior, 1 surface, 2 feather.
- `utils/createParticleSimulation.js` — TSL storage buffers + one compute
  kernel (exactly 8 storage buffers — the WebGPU per-stage limit). 714-joint
  rig → bone matrices uploaded per frame as a vec4 storage buffer (4 columns
  per bone). In three's 'attached' bind mode the bone matrices alone produce
  world space (bindMatrix baked into basePos) — no model matrix needed, and
  group transforms above the bird flow in through the bones.
- Auto-fit: first frame CPU-skins ~512 samples (measureSkinnedBounds) and
  normalizes a wrapper group so the bird is origin-centered at ~2.2 units;
  re-measured from identity on rebuilds so it never compounds.
- Emission is purely speed-driven (home-point velocity), so wing tips emit
  most without any bone-name tagging. `feathersOnly` restricts to feather
  meshes.
- Color modes: solid / gradient (bind-pose height) / velocity — art
  direction TBD, all three supported.
- Touching the bird (pointer ray vs bounding sphere) boosts internal flow;
  pointer is an attractor/repeller for free particles.

## Curl trails (three-sketches port)

- Per-system enable toggles (`particlesEnabled`, `trailsEnabled`) with
  presets as the differentiation mechanism: 'Curl Trails' (default —
  schema defaults mirror it), 'Particle Bird', 'Everything'. ParticleBird
  always owns the rig + auto-fit and publishes rig state (bone matrices,
  norm matrix, scale) through `birdStateRef` for CurlTrails.
- `utils/vendor/` — verbatim MIT ports from gkjohnson/three-sketches:
  perlin noise, CurlGenerator (CPU simplex curl), HalfEdgeMap,
  SurfaceWalker (geodesic walk).
- `utils/trails/InstancedTrails.js` — ring-buffer LineSegments port; r182
  addUpdateRange, creationSec float, per-vertex skin attrs.
- `utils/trails/createTrailMaterial.js` — TSL port of FadeLineMaterial
  (age-fade) + `trailSpace` switch: 'world' = vertices CPU-skinned at push
  (smear ribbons through the air as wings flap), 'surface' = vertices
  re-skinned live on GPU (ribbons ride the flapping surface). Switching
  resets the ribbons (different coordinate spaces).
- `utils/trails/buildWalkGeometry.js` — all skinned meshes merged in bind
  space (bindMatrix baked, skin attrs kept), MeshBVH built FIRST (it sorts
  the index) so face indices agree across BVH / walker / samplers.
- Interior = curl/trails.js: normalized-curl advection, ±dir by parity,
  random respawn (BVH inward-cast spawn). Exterior = interactiveCurl +
  galacticSurface: SurfaceWalker steps with edge-crossing pushes, life +
  perpendicular-field kill, ambient respawn, pointer stroke/burst spawning
  (rays cast in bind space via inverse norm matrix).
- Skipped from refs: drawTrails' two-pass GreaterDepth occlusion trick
  (conflicts with the PostProcessing pipeline) — ghost body depth gives
  partial occlusion instead. Pointer raycasts use the bind-pose BVH, so
  hits on a mid-flap wing are approximate.

# // TODO

- [ ] Tune trail defaults live (speeds/curl scale/fade are best guesses in
      world units; A/B trailSpace world vs surface)
- [ ] Consider porting drawTrails' occluded-pass look if the ghost-body
      depth occlusion isn't enough
- [ ] Art direction: pick color mode + palette, tune emission/curl defaults
- [ ] Frame a default camera preset once the scene is eyeballed live
- [ ] Perf pass on mobile (particle count budget, count vs. size tradeoff)
- [ ] Consider spatial touch response (local flow boost near touch point
      instead of global)
- [ ] Presets beyond Default once tuned
- [ ] crete a version of the hummingbird that allows for glowing eyes (emissive materail)
- [x] get rid of the dumbass overlay button.
- [ ] bird hover animation has a few ms of stationary hover before moving up and down. can we skip this when looping?

# // Bugs

- [ ] cant copy preset values after changing controls, empty obj returned.
