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

# // TODO

- [ ] Art direction: pick color mode + palette, tune emission/curl defaults
- [ ] Frame a default camera preset once the scene is eyeballed live
- [ ] Perf pass on mobile (particle count budget, count vs. size tradeoff)
- [ ] Consider spatial touch response (local flow boost near touch point
      instead of global)
- [ ] Presets beyond Default once tuned

# // Bugs

- (none known yet — not yet verified against the live dev server)
