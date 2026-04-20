# // CharacterController

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- This scene develops the Ghost character's spatial movement, physics, and collisions using `ecctrl` (pmndrs floating capsule character controller) + `@react-three/rapier` for physics.
- Ghost should be refined enough in GhostBuster (appearance, animations) before being brought here.
- The scene imports GhostCharacter from the shared element (`src/components/elements/webgpu/ghost/GhostCharacter.jsx`) and places it inside an `<Ecctrl>` capsule.
- Ecctrl provides: WASD/arrow/gamepad input, third-person follow camera, floating capsule physics, jump, sprint, slopes, moving platforms, auto-balance, and animation state machine.
- The ghost's cloth sim reads ecctrl's velocity to drive wind direction/strength and procedural animations (tilt, squash, hand trailing).
- Using ecctrl as a dependency (not forked) aligns with the rest of the pmndrs stack (drei, fiber, rapier). It also provides conventional GLTF + animation support for future non-ghost characters.
- Environment includes a floor with ramps and platforms at different heights for testing collisions and slope handling.

# // Dependencies

- `ecctrl` — floating capsule character controller (pmndrs)
- `@react-three/rapier` — Rapier WASM physics engine bindings

# // Known Quirks (work around, don't fork)

- **Leva ownership**: ecctrl has its own `useControls` calls internally. Our scene controls must coexist — use separate Leva folders to avoid collisions. Disable ecctrl's debug mode (`debug={false}`) and expose only the props we want to tune via our own `useSceneControls.js`.
- **Mobile joystick outside canvas**: ecctrl's `EcctrlJoystick` renders as a DOM overlay outside the R3F canvas. If we need mobile controls, either use their joystick as-is (it works, just not inside canvas) or build our own in-canvas joystick later. Not a blocker for desktop-first development.

# // Presets

- [ ] Movement presets (e.g., default, floaty, heavy, zippy) mapping to ecctrl props

# // Build Plan

**Why ecctrl as a dependency:**

- pmndrs ecosystem — consistent with drei, fiber, rapier already in use.
- Battle-tested floating capsule physics: slopes, moving platforms, auto-balance, air drag, ground detection.
- GLTF animation system built in — future characters with skeletal animations work out of the box via `<EcctrlAnimation>`.
- Ghost (procedural) works by setting `animated={true}`, skipping `<EcctrlAnimation>`, and subscribing to `useGame(state => state.curAnimation)` to drive procedural behaviors.
- ~1500 lines of controller code we don't have to maintain.

**Integration Pattern**

```
<Physics>
  <KeyboardControls map={keyboardMap}>
    <Ecctrl animated={true} debug={false}
      capsuleHalfHeight={0.3} capsuleRadius={0.2} floatHeight={0.3}>
      <GhostCharacter />  {/* cloth sim reads ecctrl velocity for wind */}
    </Ecctrl>
  </KeyboardControls>
  <RigidBody type="fixed"><Floor /><Ramps /><Platforms /></RigidBody>
</Physics>
```

**What ecctrl provides (no custom hooks needed):**

- WASD/arrow + gamepad input with sprint
- Third-person follow camera with collision detection
- Jump physics with gravity, air drag, slopes, moving platforms
- Auto-balance (keeps character upright)
- Animation state machine via `useGame` zustand store (idle → walk → run → jump → jumpIdle → jumpLand → fall → action1-4)

**What we build:**

- GhostCharacter visual (imported from shared `src/components/elements/webgpu/ghost/`)
- Velocity → wind adapter: each frame, read `rigidBody.linvel()` from ecctrl's Rapier RigidBody ref → compute `windDir = -normalize(velocity.xz)`, `windStrength = magnitude(velocity.xz)` → pass as props to GhostCharacter
- Ecctrl state → procedural animation: subscribe to `useGame(state => state.curAnimation)` + read velocity. Pass both `curAnimation` and `velocity` to `useGhostAnimations` (ecctrl state mode). The state tells us WHAT (discrete: idle/walk/run/jump/fall), velocity tells us HOW MUCH (continuous intensity).
- Environment geometry with Rapier RigidBody colliders
- Leva controls for ecctrl prop tuning (our own folders, ecctrl debug off)
- Leva "Reset Cloth" button via ghostRef.current.resetSim()

**Files to create:**

- `CharacterController.jsx` — scene with Physics, KeyboardControls, Ecctrl, environment, velocity→wind adapter
- `useSceneControls.js` — Leva controls for ecctrl props, environment, lighting (our folders only)
- `components/Environment.jsx` — floor, ramps, platforms with RigidBody colliders

**Ecctrl animation integration (resolved — no GLTF needed for ghost):**

- Set `animated={true}` on `<Ecctrl>` — this enables ecctrl's state machine (idle/walk/run/jump/jumpIdle/fall/action1-4 state calls each frame)
- Do NOT wrap GhostCharacter in `<EcctrlAnimation>` — that component is GLTF-specific (loads a GLTF, uses drei `useAnimations`, calls `actions[clip].play()`). Ghost has no skeleton.
- Instead, call `initializeAnimationSet()` from ecctrl's `useGame` store with our own state names:
  ```
  { idle: 'idle', walk: 'walk', run: 'run', jump: 'jump',
    jumpIdle: 'jumpIdle', jumpLand: 'jumpLand', fall: 'fall',
    action1: 'action1', action2: 'action2', action3: 'action3', action4: 'action4' }
  ```
- Subscribe to `useGame(state => state.curAnimation)` inside a wrapper or in `useGhostAnimations`
- Map ecctrl states to procedural behaviors (tilt, squash, bob, wind, expressions) with velocity as intensity
- Action1-4 map to ghost expressions (same mappings as GhostBuster's number keys 1-4)
- Future GLTF characters can use `<EcctrlAnimation>` normally — the ghost workaround is ghost-specific

**Reference files:**

- `src/components/elements/webgpu/ghost/GhostCharacter.jsx` — import (shared element)
- `src/components/scenes/ToolBox/WebGPU/GhostBuster/hooks/useGhostAnimations.js` — import (ecctrl state mode: pass curAnimation + velocity)
- `src/components/materials/webGPU/gridMaterial.jsx` — floor material

**Velocity → wind adapter (small, lives in CharacterController.jsx or a local hook):**

- Each frame in useFrame: `const vel = ecctrlRef.current?.rigidBody?.linvel()`
- `windStrength = Math.sqrt(vel.x² + vel.z²)`
- `windDirX = windStrength > 0.01 ? -vel.x / windStrength : 0`
- `windDirZ = windStrength > 0.01 ? -vel.z / windStrength : 0`
- Pass to GhostCharacter as wind props

**Ecctrl state → procedural animation (the key bridge):**

- `const curAnimation = useGame(state => state.curAnimation)` — subscribe to ecctrl's zustand store
- Pass `curAnimation` + `velocity` (full vec3) to `useGhostAnimations` (ecctrl state mode)
- `curAnimation` gives discrete state (WHAT): idle, walk, run, jump, jumpIdle, jumpLand, fall, action1-4
- `velocity` gives continuous intensity (HOW MUCH): tilt angle ∝ speed, wind strength ∝ speed
- State mapping:
  - `'idle'` → gentle bob, subtle sway, base wind
  - `'walk'` → mild tilt into movement dir, moderate cloth wind
  - `'run'` → strong tilt, strong cloth wind, hands trail far back
  - `'jump'` → stretch up, upward cloth billow
  - `'jumpIdle'` → hang/float at apex, cloth settles
  - `'jumpLand'` → squash on landing, downward cloth burst
  - `'fall'` → elongate body, cloth billows upward (like a parachute)
  - `'action1'`–`'action4'` → expression triggers / special poses

**Does NOT import from GhostBuster:**

- Does NOT use `useAnimationInput` — ecctrl handles all input
- Does NOT use GhostBuster's camera setup — ecctrl has its own follow camera

# // Features

**Scene Setup**

- [ ] Install `ecctrl` and `@react-three/rapier` dependencies
- [ ] Create `CharacterController.jsx` with `<Physics>` + `<KeyboardControls>` + `<Ecctrl>` wrapping GhostCharacter
- [ ] Register keyboard map (WASD, arrows, space for jump, shift for sprint, 1-4 for actions)
- [ ] Leva controls hook (`useSceneControls.js`) for tuning ecctrl props, environment, and lighting
- [ ] Disable ecctrl's built-in debug/Leva (`debug={false}`) — use our own Leva folders
- [ ] Leva "Reset Cloth" button via ghostRef.current.resetSim()

**Character Integration**

- [ ] Import GhostCharacter from shared element (`src/components/elements/webgpu/ghost/`)
- [ ] Place GhostCharacter inside `<Ecctrl>` as the visual child
- [ ] Velocity → wind adapter: read `rigidBody.linvel()` each frame → windDir, windStrength
- [ ] Pass wind props to GhostCharacter for cloth sim + hand trailing
- [ ] Set `animated={true}` on `<Ecctrl>`, call `initializeAnimationSet()` with our state names
- [ ] Subscribe to `useGame(state => state.curAnimation)` for ecctrl state
- [ ] Pass `curAnimation` + `velocity` to `useGhostAnimations` (ecctrl state mode)
- [ ] Map ecctrl states to procedural behaviors (idle/walk/run/jump/jumpIdle/jumpLand/fall)
- [ ] Map ecctrl action1-4 to ghost expression triggers
- [ ] Do NOT use `<EcctrlAnimation>` — that's GLTF-specific, ghost is procedural
- [ ] Tune ecctrl capsule size (capsuleHalfHeight, capsuleRadius) to match ghost proportions
- [ ] Tune floatHeight for ghost hover feel

**Camera**

- [ ] Use ecctrl's built-in follow camera (camInitDis, camMaxDis, camMinDis, camUpLimit, camLowLimit)
- [ ] Leva controls for camera distance, height, damping
- [ ] Camera collision with environment obstacles

**Environment**

- [ ] Floor plane with GridMaterial + `<RigidBody type="fixed">`
- [ ] Ramps at various angles (test slopeMaxAngle, slopeUpExtraForce, slopeDownExtraForce)
- [ ] Platforms at different heights (test jump reach, floating height)
- [ ] Moving platform (test ecctrl's moving/rotating platform support)
- [ ] Simple box obstacles for collision testing

**Physics Tuning**

- [ ] Expose key ecctrl props via our Leva: maxVelLimit, jumpVel, sprintMult, turnSpeed, floatHeight, springK, dampingC
- [ ] Tune airDragMultiplier for ghostly air control
- [ ] Tune fallingGravityScale for ghost fall feel (floaty vs snappy)
- [ ] Auto-balance spring/damping for ghost stability

**Gamepad**

- [ ] Verify gamepad works via ecctrl's built-in controller support
- [ ] Map controller buttons to actions (ecctrl controllerKeys prop)

**Mobile Controls (deferred)**

- [ ] Evaluate ecctrl's `EcctrlJoystick` (renders outside canvas — works but not ideal)
- [ ] If needed, build in-canvas joystick alternative later

# // Bugs
