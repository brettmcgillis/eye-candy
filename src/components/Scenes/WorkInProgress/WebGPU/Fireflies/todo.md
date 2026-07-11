# // Fireflies

# // Intent / Use Cases

- A standalone scene that leverages multi-browser tab cross-talk and also works as a fullscreen piece. Built around the concepts of fireflies, boids, and stylized spheres — an exact copy of the Floids reference behavior (`~/dev/examples/Floids`), just rendered as our matte-grey/glossy-black spheres instead of Floids' point sprites.
- the scene contains a flock of firefly boids from the floids example, with the option for multiple hunters.
- the hunters are glossy black spheres that reflect glints of light from the fireflies.
- the firefly are matte grey spheres that light up when firing.
- the firefly spheres also expand slightly when lighting up.
- in multi-browser mode orbit controls are disabled, and the flock/habitat is shared and grows to fill the additional screen space — see "Multi-tab model" below.
- **Volumetric fog/lighting was tried and removed** (see Bugs). This scene is intentionally NOT a re-skin of `webgpu_volume_lighting.html` anymore — it's a Floids clone with our sphere styling.

# // Multi-tab model

Host-authoritative shared simulation (`hooks/useSharedSwarm.js`), mirroring
`CrossTalk`'s `useFluidSim.js`:

- Only the elected host window (lowest-id alive window, see
  `src/modules/windowSync/WindowRegistry.js`) actually steps the flock +
  hunter physics. It broadcasts positions/clocks/hunter state over a
  throttled `BroadcastChannel` (`eyeCandy:fireflies:swarm`); every window,
  host included, renders from that shared buffer. There is one flock, not
  one per tab.
- The habitat radius grows with the number of alive windows
  (`BASE_HABITAT_RADIUS * sqrt(windows.length)`) — more open tabs means more
  room for the same flock to roam, not just more viewports onto a
  fixed-size world.
- Each window is a fixed-size peephole onto that shared world: its content
  group is translated by its real OS screen-position offset from the host
  window (`Fireflies.jsx`'s `worldOffset`, `WORLD_UNITS_PER_PIXEL`). The
  camera itself never moves or resizes.
- Cursor interaction (attract/flee) only reacts to the HOST window's own
  pointer — a deliberate simplification, not a bug. Relaying every window's
  pointer to the host would need its own broadcast channel for
  comparatively little payoff.

# // References

- `~/dev/examples/floids`

# // Presets

# // Features

- [x] Floids-inspired flock simulation (CPU, matching upstream Floids —
      deliberately not GPU-compute) with synchronized flash phases and up to
      3 hunters that pursue the nearby flock. Neighbor search uses a
      spatial grid (utils/createSpatialGrid.js, adapted from Floids' own
      UnitGrid) instead of the O(n^2) brute-force scan the original port
      used.
- [x] Each visible firefly drives its own real point light; WebGPU clustered
      lighting keeps the reflective hunter(s) responsive to the same state.
- [x] Glossy black hunter sphere(s) (`meshPhysicalMaterial`, near-black,
      clearcoat) that reflect the firefly lights. Fireflies are matte grey
      and lerp toward a warm glow color as they fire, instead of a
      permanent per-index rainbow.
- [x] Shared, host-authoritative multi-tab simulation — see "Multi-tab
      model" above. Replaces an earlier per-window-local-sim +
      cosmetic-"ghost"-echo design that didn't actually expand the
      explorable space.

# // Interactivity

- [x] boids flock to cursor mode
- [x] boids flee from cursor mode
- [x] multi-browsertab mode: one shared flock/hunter world, habitat grows
      with window count, each window views a different real-screen-position
      slice of it, orbit controls disable once a sibling window is alive.

# // Needs live tuning

- `WORLD_UNITS_PER_PIXEL` (Fireflies.jsx) and `BASE_HABITAT_RADIUS` /
  `BROADCAST_HZ` (hooks/useSharedSwarm.js) are reasoned first-pass values,
  not analytically derived — need tuning against the live multi-window
  scene (open two+ browser tabs/windows at this scene's route side by
  side).
- `fireflyCount` preset defaults were tuned down conservatively from the
  original 220-320/full-res-fog defaults; now that the O(n^2) flocking bug
  and the volumetric layer are both gone, there's likely headroom to raise
  them again — needs a live spot-check per
  docs/scene-performance-checklist.md.

# // Bugs

None currently tracked. Fixed in order:

1. O(n^2) brute-force flocking with no spatial grid (bad framerate at
   200+ agents).
2. Dead `hunterCount` control (only one hardcoded hunter ever rendered).
3. Wrong firefly/hunter materials (rainbow fireflies, light-grey hunter)
   vs. matte-grey/glossy-black per intent.
4. Hand-rolled camera instead of CameraRig.
5. No multi-tab wiring at all.
6. Fireflies barely moved ("suspended, slowly bobbing") — `desiredSpeed`
   and hunter speed were carried over from Floids' own unit-sphere-scale
   constants unscaled, ~10x too slow for this port's 10x-bigger habitat.
7. A shadow-casting volumetric proxy light (added while (wrongly) trying
   to keep the fog) doubled point-light shadow-cubemap cost — extremely
   slow.
8. Volumetric fog/lighting looked bad regardless of tuning — removed
   entirely per direction: this scene is a Floids clone with our sphere
   styling, not a volume-lighting demo.
9. Hard multi-second browser freeze at fireflyCount=700 (worse than slow —
   locked the whole tab). Cause: `renderer.lighting = new
ClusteredLighting(fireflyCount + 2, ...)` gave every single firefly a
   real WebGPU point light and recreated the lighting system's shader
   graph (forcing every lit material's pipeline to recompile) every time
   the count changed. Floids' own 700 agents are cheap unlit sprites, not
   lights — this port never should have scaled real light count 1:1 with
   agent count. Fixed by decoupling them: `fireflyCount` (up to 1000) only
   drives cheap instanced-mesh draws; real point lights are now a fixed
   pool (`MAX_REAL_LIGHTS = 64` in FloidsSwarm.jsx, never recreated),
   claimed first-come-first-served each frame by whichever fireflies are
   currently bright enough (`BRIGHT_THRESHOLD`). Every firefly still gets
   its correct matte-grey-to-glow body color regardless of whether it
   currently holds a real light — only the light-casting/hunter-reflection
   contribution is capped.
10. Fireflies would stutter then suddenly fly off-screen/vanish entirely
    (most visible right as framerate recovered from a stutter — more
    frames per second meant the bug compounded faster, not slower). Root
    cause: the speed-restoration term in `step()` was a POST-HOC
    correction applied directly to the already-integrated velocity
    (`restore = (desiredSpeed - speed) \* (dt/TAU_SPEED); vx += (vx/speed)
    - restore`) — an explicit-Euler step on an exponential relaxation,
    unconditionally unstable once `dt/TAU_SPEED > 2`. With `TAU_SPEED =
      0.01`and`dt`clamped up to`1/30`, that ratio reaches ~3.3 during
    any stutter (dt pinned at its clamp ceiling) — instead of damping
    toward `desiredSpeed`it overshot and grew every frame, an
    exponential blowup. Pre-existing in the original port (unchanged
    through several earlier fixes), just never practically triggered
    until agents were actually moving with real force and the scene was
    heavy enough to stutter. Fixed by folding the restoration into the
    force accumulator (matching Floids' own`restoreVelocity()`exactly —
    a force, integrated once via the same`velocity += force \* dt`as
    everything else) instead of a separate post-hoc correction. Also
    added a hard`MAX_SPEED_MULTIPLE` velocity clamp as a backstop,
    independent of that fix.
11. Simulation constants were a patchwork of invented per-control fudge
    factors (habitat radius 8 with no stated relationship to Floids' 0.8;
    `neighborRadius * 0.026`, `separationRadius * 0.026`,
    `hunterRadius * 0.13`, `hunterSpeed * 0.0016`/`0.016` — none
    traceable to anything in Agents.js/Hunter.js; `hunterRadius` silently
    doubling as both the hunter's visual size AND the flock's flee-trigger
    distance, which Floids treats as unrelated). Redone as a literal port:
    one documented `WORLD_SCALE = 10` constant
    (createFloidsSimulation.js), every simulation constant either derived
    from it with a comment citing the exact Floids source value
    (`FLEE_RADIUS`, `BASE_HABITAT_RADIUS`, `HUNTER_HABITAT_RATIO`,
    `HUNTER_SIGHT_RADIUS`, `HUNTER_CHASE_FACTOR`, etc.) or explicitly
    marked as this scene's own addition with no Floids equivalent
    (`fireflyGlow`, `lightIntensity`, `cursorMode`/`cursorRadius`,
    `hunterCount`, `hunterRadius` as a purely visual size). `fireflySpeed`,
    `hunterSpeed`, `separationRadius`, `neighborRadius` Leva controls are
    now direct pass-throughs into those units (see the comments in
    getFireflyControls.js/getFlockingControls.js/getHunterControls.js) —
    no hidden conversion between what the slider shows and what the sim
    consumes.
