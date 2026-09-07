# Explorer — plan

Delete this file when the work lands (`plans/README.md`).

## Decisions taken (from the vision Q&A)

- **Two scenes, not three.** `Apollian` keeps only the 4D slice. The gnarly-tree
  domain comes out of it and _becomes_ `Explorer` — the tree's branch structure is
  the cavern system the sphere flies through.
- **Both scenes are WebGPU/TSL.** `Apollian` is ported off its WebGL fragment
  shader in the same pass, so there is exactly one Apollonian distance estimator
  in the repo. This also closes Apollian's own "port to WebGPU/TSL" todo item.
- **Shared code becomes a module**, mirroring `@modules/radialShadow`: generic TSL
  SDF vocabulary in `src/modules/sdf`, scene-specific assembly in each scene's
  `utils/sceneTSL.js`.
- **Smoke is lit, self-shadowed, and faintly emissive** (see Lighting below).
- **Chase camera**, lagging behind the sphere with spring damping.

## Why there is no global illumination here

A point light inside a signed distance field is the one case where real shadows
are almost free. At each fractal hit the marcher already has `df`, so:

- direct term = `lightColor * intensity / dist^2 * max(dot(n, L), 0)`
- shadow = one sphere-trace from hit toward the sphere, taking the running
  `min(k*d/t)` for a soft penumbra
- ambient = the existing 12-tap AO march, which already darkens crevices

The crevice darkening from AO plus the inverse-square falloff is what reads as
bounced light. Nothing is actually bounced.

### If the visuals miss the mark, the rejected options, in order of escalation

1. **Drop smoke self-shadowing.** Particles keep falloff and emission but ignore
   the fractal. Cheapest; the plume hugs the sphere so it mostly still reads.
2. **Smoke lights the fractal back.** Sample N secondary point lights along the
   trail and add them to the marcher's direct term. Closest to real GI, and it
   costs one extra shadow march per light per hit — the marcher is the hot loop,
   so this is the expensive one.
3. **Fake one bounce off the walls.** At each hit, march a short ray along the
   normal and add the light reaching _that_ point, tinted by the wall colour.
   Half the cost of (2) and it fills the pitch-black side of chambers.

## Module: `src/modules/sdf`

Generic TSL vocabulary, no scene knowledge. Barrel exports only.

| File           | Holds                                                            |
| -------------- | ---------------------------------------------------------------- |
| `constants.js` | march step caps, hit epsilon, max trace                          |
| `folds.js`     | `rot2`, `mod1`, `modMirror2` — domain folds, `.toVar()` in-place |
| `shapes.js`    | `sdBox`, `sdSphere`, `sdPlane`                                   |
| `fractals.js`  | `apollian4` (4D slice), `apollianTree` (gnarly tree)             |
| `march.js`     | `marchSDF` (returns `t` + `iter`), `softShadow`                  |
| `shading.js`   | `sdfNormal`, `sdfAO`                                             |

Every function takes and returns nodes; the distance estimator is passed in as a
**JS closure**, never as a pre-built node — a node built in one helper and passed
to another codegens as `unresolved value 'null'` and renders blank with no error.

The 2D sigil scene is a later consumer of `folds.js` + a 2D Apollonian fold; the
module is shaped for that but does not ship it yet.

## Scene: `WebGPU/Explorer`

```
Explorer/
  Explorer.jsx
  components/  Caverns.jsx  Sphere.jsx  Smoke.jsx  getXControls.js
  hooks/       useSceneControls.js
  utils/       sceneTSL.js  agent.js  smokeSim.js  sort.js  camera.js
  presets/     presets.js
  todo.md
```

### Caverns — fullscreen raymarch that writes depth

A `MeshBasicNodeMaterial` on a screen-filling mesh, with `colorNode` from the
march and `material.depthNode` set from `viewZToPerspectiveDepth` at the hit
point. This is the `Aisle9/SingularityBlackHole` pattern, and it is what lets
real particle geometry occlude correctly behind cavern walls — without it the
smoke draws on top of everything.

### Sphere — the light, and the agent

One emissive sphere. `utils/agent.js` steers it using the SDF itself: probe a
small fixed set of directions with `df`, steer toward the most open one, hold a
heading with momentum, and slow down in tight passages. "Exploring" is that
momentum plus occasional pauses, not a scripted path.

### Smoke

TSL compute, following `Weightless/createParticleSimulation.js` for buffer
packing discipline (8 storage buffers per stage is a hard WebGPU limit).

- Emitted from points sampled on the **sphere's surface**, not a volume.
- Advected by `curlNoise` from `@modules/tsl`.
- Many particles, low per-particle opacity, opacity driven by age — overlap is
  what makes the dense regions. This is the whole trick from the TouchDesigner
  note; resist the urge to make individual particles look good.
- **Sorted back-to-front by view depth each frame**, then alpha blended. A GPU
  bitonic sort over the index buffer. Nothing in the repo does this yet.
  It lives in `Explorer/utils/sort.js` until a second scene wants it, then it
  gets promoted (§0 rule 1).

## Order of work

1. `src/modules/sdf` + Node smoke test of the graph.
2. Port `Apollian` to WebGPU over the module; drop the tree domain and its
   preset. Hand to the user for a parity eyeball against the WebGL original.
3. `Explorer` skeleton: caverns + depth, chase camera, a plain unlit sphere.
4. Sphere as point light: direct + soft shadow + AO. Eyeball.
5. Agent steering.
6. Smoke: sim, then sorting, then lighting the particles.
7. Bloom last, shipped disabled (§12).
