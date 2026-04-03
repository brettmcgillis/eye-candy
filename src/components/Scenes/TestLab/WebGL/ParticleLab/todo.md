# // ParticleLab

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] Hoist Mycellium out into a Showcase level scene.
  - Scene should "evlolve" controls over time for more generative experience.
  - Use datetime as a seed so each instance is unique
  - Scene should contain a glitch mode that does dramatic jumps in control settings to cause extreme sudden shifts.
  - Scene should be audio reactive as a final touch

# // Features

- [x] Build the attractors system into the lab as an option
- [x] Build Repellers in addition to attractors

## Particle Systems To Explore

### Well known systems

- [x] Lorenz Attractor
  - Classic, instantly recognizable butterfly lobes.
  - `dx = sigma*(y-x), dy = x*(rho-z)-y, dz = x*y-beta*z`
- [x] Rossler Attractor
  - Clean spiraling ribbons, great for motion trails.
  - `dx = -y-z, dy = x+a*y, dz = b+z*(x-c)`
- [x] Dadras Attractor
  - Dense folded sheets, very nebula-like.
  - `dx = y-a*x+b*y*z, dy = c*y-x*z+z, dz = d*x*y-e*z`
- [x] Halvorsen Attractor
  - Threefold symmetry, braided cloud feel.
  - `dx = -a*x-4*y-4*z-y*y (+ cyclic perms)`
- [x] Chen Attractor
  - Lorenz-like but sharper and more explosive.
  - `dx = a*(y-x), dy = (c-a)*x - x*z + c*y, dz = x*y - b*z`

### Obscure / Weird Ones

- [x] Rabinovich-Fabrikant
  - Wild toroidal tearing and knotty bursts; dramatic with slight parameter drift.
- [x] Arneodo
  - Thin filament sculpture look, almost calligraphic in 3D.
- [x] Burke-Shaw
  - Compact chaotic clover-like structures that rotate well.
- [x] Sprott Systems (A/B/C/... families)
  - Many compact equations; strong morphology variety for algorithm roulette.
- [x] Lorenz 83
  - Seasonal-chaos style Lorenz variant with broad folded sheets.
- [x] Three-Scroll Unified Chaotic System
  - Multi-scroll chaotic structure with dramatic lobe transitions.
- [x] Chen-Lee
  - Alternative Chen-family formulation matching the DynamicMath equation set.
- [x] Ikeda Map (2D map, embed as z modulation)
  - Photon-orbit feel with rich output and low math cost.
- [x] Gumowski-Mira Map (2D, lift to 3D)
  - Organic flower/frond structures; responds well to parameter sweeps.
- [x] Svensson Map (2D, lift to 3D)
  - Fast to compute with wide visual diversity, often woven-smoke-like.
- [x] Popcorn / Pickover map variants
  - Speckled cosmic dust and curved fold structures.

### Non-Attractor Families

- [ ] IFS Fractals in 3D
  - Weighted affine transforms for fern/coral/crystal growth clouds.
- [x] L-Systems + noisy turtle in 3D
  - Branching vascular and tree-like particle structures.
- [x] Quaternion Julia / Mandelbulb point sampling
  - Very high detail dense static clouds with depth coloring.
- [ ] Strange attractor + curl-noise advection hybrid
  - Seed points on an attractor, then advect through divergence-free fields.
- [x] Hopf fibration sampling
  - Elegant linked-circle structures with distinct geometry.
