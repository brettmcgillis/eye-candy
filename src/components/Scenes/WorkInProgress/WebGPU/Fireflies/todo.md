# // Fireflies

# // Intent / Use Cases

- A standalone scene built around fireflies, boids, and stylized spheres.
  Instead of building it as a new CrossTalk preset, it lives here as its own
  scene — see "Multi-tab" below for why cross-talk is deliberately deferred.
- The scene contains a flock of firefly boids (`~/dev/examples/boids-js`
  grid/obstacle model) with one or more hunters and realistic flash-sync
  behavior (`~/dev/examples/Floids`).
- The scene contains static obstacles the flock steers around, boids-js
  style — Floids has no equivalent (it's just a spherical habitat).
- v1 renders everything as plain spheres: matte grey fireflies that lerp
  toward a warm glow color and expand slightly when they flash, glossy black
  hunter(s), neutral grey obstacles. No real point lights yet (see
  "Deferred" below) and no volumetric/fog treatment.
- World is a box (not Floids' unit sphere) so obstacles and a boids-js-style
  boundary make sense together — see "the scene initially should look like
  the boids-js example" in the original brief.

# // Multi-tab (deferred)

The old version of this scene (since deleted, see git history at commit
`33aeb6c` and earlier) built windowSync cross-talk and standalone rendering
together from the start, and still ended up scrapped. This rebuild
deliberately does standalone-only first — smaller surface to debug at each
step. Cross-talk (host-authoritative shared sim over
`src/modules/windowSync`, mirroring CrossTalk's `useFluidSim.js`) is a
planned second pass once the flock/hunter/flash feel right standalone.

# // References

- `~/dev/examples/boids-js` — flock grid, obstacle avoidance, boundary
  avoidance (`BoidsController`).
- `~/dev/examples/Floids` — hunter chase behavior (`Hunter.js`), realistic
  per-agent flash-sync timing (`Agents.js` `fire()`/`nudge()`).

# // Presets

- [x] Default — see `presets/presets.js`.

# // Features

- [x] CPU boid flock (`utils/stepFlock.js`) with alignment/cohesion/
      separation/obstacle-avoidance/box-boundary forces, spatial-grid
      neighbor queries (`utils/createSpatialGrid.js`) so it stays O(n) not
      O(n²).
- [x] Floids-style flash-sync clock per firefly (`utils/stepFlash.js`):
      free-running clock, fires + briefly flashes on wrap, nudges nearby
      agents' clocks toward its own phase so an initially-desynced flock
      gradually starts flashing together.
- [x] Hunter(s) chase nearby flock members and relax back to a cruise speed
      (`utils/stepHunters.js`, ported from Floids' `Hunter.js`), using the
      same box-boundary force as the flock instead of Floids' spherical
      habitat constraint.
- [x] Static obstacle spheres (`utils/createHabitat.js` spawn +
      `components/Obstacles.jsx` render) the flock avoids.
- [x] Respawn button (Flocking folder) reseeds flock/hunter/obstacle layout
      from scratch with the current counts.

# // Deferred

- Real point lights on bright fireflies (so the glossy hunter shows
  reflected glints) — the old version's worst perf bug came from exactly
  this (a real WebGPU light per bright firefly, lighting pipeline
  recompiling on every count change). v1 uses instanceColor + a scale bump
  instead; revisit once the sim itself is solid.
- Multi-tab cross-talk — see "Multi-tab" above.
- Cursor interactivity (flock-to-cursor / flee-from-cursor).

# // Interactivity

None yet — see Deferred.

# // Bugs

None currently tracked. First live pass still needed to tune
`utils/camera.js` framing and the Default preset's weights/radii against
the actual running scene (see docs/scene-performance-checklist.md).
