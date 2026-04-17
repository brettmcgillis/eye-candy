# // GhostBuster

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- A stationary character design workbench for developing Ghost from a simplistic cloth sim into a playable character.
- The ghost stays centered at the origin — no real movement. WASD/arrows/joystick simulate directional wind to preview how the ghost reacts to movement forces.
- The scene includes a small grid material floor (like NetworkTest), basic lighting, and the ghost at center.
- The scene includes all requisite controls to govern the appearance of the background, lighting, grid floor, and ghost.
- WASD/arrow keys control wind direction and strength (W = headwind from +Z, S = tailwind, A/D = side wind). Diagonal combos normalize. Gamepad left stick provides analog direction + strength.
- Spacebar triggers an in-place jump animation (squash → stretch → settle). No Y displacement — just animation preview.
- Number keys 1-5 trigger facial expression animations (mappings TBD as expressions develop).
- The ghost has two "hand" spheres (smaller spheres L/R of main sphere) that trail opposite the wind via spring-follow physics.
- Fixed front-facing camera by default, with a Leva toggle to enable OrbitControls for free-look.
- Eye animations deferred until elliptical cutout shader work is done — placeholder Leva folder ready.

# // Presets

- [ ] Regular all-white sheet gh0st
- [ ] Fluid material sheet gh0st
- [ ] Contrasting inner color sheet gh0st.
- [ ] Tattered Damaged gh0st

# // Build Plan

**Phase 1: Scene Scaffolding**

Files to create:

- `GhostBuster.jsx` — grid floor via GridMaterial on a plane, basic lighting, fixed front camera + orbit toggle, centered ghost group
- `useSceneControls.js` — Leva folders: Background, Lighting, Floor, Character, Hands, Camera (orbit toggle), Eyes (placeholder), Animation
- Leva "Reset Cloth" button that calls `ghostRef.current.resetSim()` for recovering from bad cloth states

Reference files:

- `src/components/scenes/TestLab/WebGPU/NetworkTest/NetworkTest.jsx` — grid floor pattern
- `src/components/materials/webGPU/gridMaterial.jsx` — GridMaterial component

**Phase 2: Ghost Character Component (shared element)**

Files to create:

- `src/components/elements/webgpu/ghost/GhostCharacter.jsx` — fork from `AllMyFriendsAreGhosts/components/Ghost.jsx`
  - Lives in shared elements folder so both GhostBuster and CharacterController import from the same source
  - Keep: ClothMesh with cloth params, sphere collider at local origin, pinRing, cutouts, eye lights
  - **Fix: Pin center tracks sphere** — cloth pin positions dynamically follow the sphere's world-space position each frame so the cloth always drapes centered on the head and never falls off during movement/bobbing. Currently pins are set once at init; need per-frame pin position updates in the sim or a binding that moves pinned vertices with the collider.
  - **Fix: Sphere-relative eye cutouts** — cutout positions calculated relative to sphere center (world-space projection) rather than static UV coords, so eyes stay fixed on the "face" regardless of cloth deformation or sphere movement. Replaces the current UV-space cutout placement which drifts.
  - Add: two hand spheres (L/R), visible meshes + cloth colliders (slots 2-3)
  - Add: spring-follow physics for hands (`handPos.lerp(targetPos, springFactor * dt)`)
  - Wind externally managed: `windManaged` on ClothMesh, write `sim.windU` / `sim.windDirU` in useFrame from props
  - Hands trail opposite wind direction
  - Props interface (generic for both scenes): `{ wind, windDirX, windDirZ, color, eyeColor, eyeIntensity, stiffness, dampening, handSize, handSpacing, handColor, handVisible, cursorCollider, cursorRadius }`
  - Expose imperative ref with `resetSim()` passthrough from ClothMesh
  - No camera code — camera is each scene's responsibility

Reference files:

- `src/components/scenes/WorkInProgress/WebGPU/AllMyFriendsAreGhosts/components/Ghost.jsx` — fork source
- `src/components/elements/webgpu/cloth/ClothMesh.jsx` — collider slots, windManaged
- `src/components/elements/webgpu/cloth/pinHelpers.js` — pinRing

**Phase 3: Input Hook**

Files to create:

- `hooks/useAnimationInput.js` — returns `{ windDir, windStrength, jumpTriggered, expressionKey }`
  - WASD/arrows: W/Up = headwind +Z, S/Down = tailwind -Z, A/Left = +X, D/Right = -X. Diagonals normalize.
  - Gamepad left stick: analog direction + strength
  - Spacebar / Gamepad A: jumpTriggered for one frame
  - Number keys 1-5: expressionKey for one frame
  - isTypingTarget guard (skip input when Leva focused)
  - Y-direction wind during jump (animation hook feeds back vertical phase)

Reference: PenPlotter isTypingTarget pattern

**Phase 4: Animation Hook**

Files to create:

- `hooks/useGhostAnimations.js` — returns `{ bob, tiltX, tiltZ, squash, windBoost, windDirX, windDirZ, jumpPhase }`
  - **Two animation modes** (same hook, different inputs):
    1. **Canned mode (GhostBuster)**: `jumpTriggered` boolean drives squash → stretch → settle. WASD drives wind direction. No external state.
    2. **Ecctrl state mode (CharacterController)**: accepts `curAnimation` string from ecctrl's `useGame` store + `velocity` vector. Maps discrete states to procedural behaviors with velocity as intensity:
       - `'idle'` → gentle bob, base wind
       - `'walk'` → mild tilt + wind (intensity from velocity magnitude)
       - `'run'` → strong tilt + wind (intensity from velocity magnitude)
       - `'jump'` → stretch up, upward cloth billow
       - `'jumpIdle'` → hang/float at apex, cloth settles
       - `'jumpLand'` → squash on landing, downward cloth burst
       - `'fall'` → elongate body, cloth billows upward
       - `'action1'`–`'action4'` → expression triggers / special poses
    3. Mode is determined by which params are provided: if `curAnimation` is passed, ecctrl mode activates. If only `jumpTriggered`, canned mode.
  - Idle: gentle vertical bob (sine), subtle sway, base wind for cloth liveliness
  - Wind input (WASD held): tilt into wind direction, increased cloth wind, hands trail opposite
  - Turn simulation: quick direction change → brief bank overshoot with spring-back
  - All intensities from Leva controls

**Phase 5: Integration & Wiring**

Wire in GhostBuster.jsx:

- `useSceneControls()` → config
- `useAnimationInput()` → windDir, windStrength, jumpTriggered, expressionKey
- `useGhostAnimations(windDir, windStrength, jumpTriggered, config)` → bob, tilt, squash, effective wind (no velocityY — uses canned jump)
- Apply to ghost group: rotation.x = tiltX, rotation.z = tiltZ, scale.y = squash, position.y += bob
- Pass effective wind to GhostCharacter for cloth sim + hand trailing
- Fixed camera at [0, 0.3, 2.5] looking at origin; OrbitControls conditional on Leva toggle

# // Features

**Scaffolding**

- [ ] GhostBuster.jsx with grid floor, lighting, fixed camera, orbit toggle
- [ ] useSceneControls.js with all Leva folders
- [ ] Leva "Reset Cloth" button
- [ ] Scene already registered in useWebGPUToolScenes.jsx

**Ghost Character (shared element at `src/components/elements/webgpu/ghost/`)**

- [ ] GhostCharacter.jsx forked from Ghost.jsx with cloth + sphere + eye lights
- [ ] Pin center tracks sphere: cloth pins dynamically follow sphere position each frame (fixes cloth falling off)
- [ ] Generic props interface usable by both GhostBuster and CharacterController
- [ ] Imperative ref with resetSim() passthrough
- [ ] Hand spheres (two smaller spheres, L/R, visible, cloth collider slots 2-3)
- [ ] Hand spring-follow physics (trail opposite wind)
- [ ] Externally managed wind (windManaged + sim.windU / sim.windDirU writes)

**Input**

- [ ] WASD/arrow wind direction input (continuous while held)
- [ ] Gamepad left stick analog wind
- [ ] Spacebar / Gamepad A jump trigger
- [ ] Number keys 1-5 expression triggers (mapping TBD)
- [ ] isTypingTarget guard for Leva safety

**Animations**

- [ ] Idle: vertical bob, subtle sway, base wind
- [ ] Wind input: tilt into wind direction, increased cloth wind
- [ ] Jump (canned mode): in-place squash → stretch → settle, cloth billows
- [ ] Ecctrl state mode: curAnimation string + velocity drives procedural animation (used by CharacterController)
- [ ] Ecctrl state mapping: idle/walk/run/jump/jumpIdle/jumpLand/fall → procedural behaviors
- [ ] Ecctrl action1-4 → expression triggers (same mapping as number keys 1-4)
- [ ] Turn simulation: bank overshoot with spring-back on quick direction change
- [ ] Y-direction wind during jump ascent/descent phases
- [ ] All intensities Leva-controllable

**Eyes**

- [ ] Shader-based animated eye cutouts (elliptical with rotation transforms)
- [ ] Sphere-relative eye cutouts: world-space projection relative to sphere center (fixes eye drift during movement/deformation)
- [ ] Extend createClothSimulation.js cutout system for 2x2 rotation+scale matrix per cutout
- [ ] Eye shape uniforms: eyeSquish, eyeRotation, eyeOpenness, eyeSpacing, eyeVerticalPos
- [ ] Blink animation, expression states (happy, surprised, angry, sleepy)
- [ ] Fluid material eye mode (Leva toggle, future)

# // Verification

1. WebGPU → Toolbox → GhostBuster loads without errors
2. Ghost renders centered on grid floor with eye holes, eye glow lights, hand spheres
3. No keys pressed: gentle bob, subtle cloth wind
4. Press W: headwind, ghost tilts forward, hands trail back
5. Press A+W: diagonal wind, ghost tilts forward-left, hands trail back-right
6. Release keys: ghost settles to idle
7. Gamepad stick: analog wind, smooth transitions
8. Spacebar: squash → stretch → settle, cloth billows
9. Leva orbit toggle: enables orbit controls
10. All Leva controls update real-time
11. Reset Cloth button recovers cloth sim state
12. `npm run build` succeeds
13. Lint passes on all new files

# // Bugs
