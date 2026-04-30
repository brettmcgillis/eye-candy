# Plan 2 — Rideable TadpolCopter (6DOF Fly/Swim)

Depends on Plan 1 (Rideable Infrastructure + RC Car) being complete.
Reuses `useRideableState`, the `setPosition` Ecctrl imperative API, and the mount/dismount
wiring in Experience.jsx already established in Plan 1.

---

## New files

### `src/components/elements/models/tadpolcopter/RideableTadpolCopter.jsx`

6DOF physics controller wrapping the existing `TadpolCopter` visual model.

**Props:**

```jsx
<RideableTadpolCopter
  id="tadpolcopter-1" // unique rideable id
  position={[0, 3, 0]}
  ecctrlRef={ecctrlRef} // null in standalone mode
  mounted={false} // controlled externally in mixed scene
  onMount={fn} // ({ id, groupRef }) => void
  onDismount={fn} // () => void
  standalone={false} // true = always active, no mount/dismount
/>
```

**Physics architecture:**

Single `<RigidBody type="dynamic" gravityScale={isActive ? 0 : 1}>`:

- `gravityScale={0}` while mounted/active — player has no gravity
- `gravityScale={1}` while parked/unmounted — copter sits on the ground like a prop
- All other scene objects retain their own gravity unaffected

Collider: `<CapsuleCollider args={[0.4, 0.6]}>`  
(matches the visual hull size at the 0.01 scale factor in TadpolCopter.jsx)

**6DOF input in `useFrame`:**

Movement is camera-relative — same `CameraBasedMovement` principle already in Ecctrl:

```js
// Derive axes from camera (pivot quaternion from useFollowCam)
const camQuat = pivot.quaternion; // or follow the ecctrl pivot
const fwdAxis = new THREE.Vector3(0, 0, -1)
  .applyQuaternion(camQuat)
  .normalize();
const rightAxis = new THREE.Vector3(1, 0, 0)
  .applyQuaternion(camQuat)
  .normalize();
const upAxis = new THREE.Vector3(0, 1, 0); // world up, no banking

// Read input — same keys as on-foot movement
const velocity = new THREE.Vector3();
if (forward) velocity.addScaledVector(fwdAxis, flySpeed);
if (backward) velocity.addScaledVector(fwdAxis, -flySpeed);
if (leftward) velocity.addScaledVector(rightAxis, -flySpeed);
if (rightward) velocity.addScaledVector(rightAxis, flySpeed);
if (jump) velocity.addScaledVector(upAxis, flySpeed); // space = ascend
if (run) velocity.addScaledVector(upAxis, -flySpeed); // shift = descend

// Apply as direct velocity (not impulse) for responsive, predictable flight feel
copterRef.current.setLinvel(velocity, true);
```

Rotation — yaw only to face movement direction, no pitch/roll banking:

```js
if (velocity.lengthSq() > 0.001) {
  const targetY = Math.atan2(velocity.x, velocity.z);
  modelEuler.y = THREE.MathUtils.lerp(modelEuler.y, targetY, delta * turnSpeed);
  copterGroupRef.current.rotation.y = modelEuler.y;
  // Keep physics body upright
  copterRef.current.setRotation(
    {
      x: 0,
      y: Math.sin(modelEuler.y / 2),
      z: 0,
      w: Math.cos(modelEuler.y / 2),
    },
    true
  );
}
```

Rotor animation — drive blade spin from `useAnimations` in TadpolCopter.jsx.
When active, play the rotor animation at speed proportional to fly input magnitude.

**"Invisible passenger" pattern — identical to RC Car:**

```js
// Each frame while mounted && ecctrlRef provided
const seatPos = getWorldPosition(copterGroupRef).add(SEAT_OFFSET); // SEAT_OFFSET ≈ {0, 0.3, 0}
ecctrlRef.current?.setPosition(seatPos);
```

Capsule is frozen (`disableControl`, `gravityScale=0`) inside Plan 1's Experience wiring.

**Mount sensor:**

```jsx
<CylinderCollider
  sensor
  args={[0.8, 1.2]}
  onIntersectionEnter={() => setNearPlayer(true)}
  onIntersectionExit={() => setNearPlayer(false)}
/>
```

Mount trigger is identical to RideableRcCar — action1 key when near.

---

## Modified files

### `src/components/scenes/ToolBox/CharacterController/Experience.jsx`

**1. Import:**

```js
import RideableTadpolCopter from '../../../elements/models/tadpolcopter/RideableTadpolCopter';
```

**2. Add Leva option (inside existing `rideablesEnabled` block from Plan 1):**

```js
rideableTypes: {
  value: { rcCar: true, copter: true },
  // or individual toggles per rideable
}
```

**3. Add to Physics block alongside `<RideableRcCar>`:**

```jsx
{
  rideablesEnabled && (
    <RideableTadpolCopter
      id="tadpolcopter-1"
      position={[0, 1.5, 6]}
      ecctrlRef={ecctrlRef}
      mounted={mountedId === 'tadpolcopter-1'}
      onMount={mount}
      onDismount={dismount}
    />
  );
}
```

No other changes to Experience.jsx — `effectiveDisableControl`, `gravityScale`, and
the `mount`/`dismount` callbacks from Plan 1 handle everything.

---

### `src/components/scenes/ToolBox/CharacterController/hooks/useMultiplayer.ts`

Plan 1 already extended `CharacterStateData` with `mountedRideableId`. No further
changes needed unless flight-specific state (e.g. altitude, pitch) is wanted for
remote player ghost rendering. That can be deferred.

---

## Leva controls for RideableTadpolCopter

```js
useControls(
  'TadpolCopter',
  {
    flySpeed: { value: 6, min: 1, max: 25, step: 0.5 },
    turnSpeed: { value: 8, min: 1, max: 20, step: 0.5 },
  },
  { collapsed: true }
);
```

Much simpler tuning surface than the car — only 2 physics values matter.

---

## Step order

1. Confirm Plan 1 is fully working (car mounts, dismounts, camera follows).
2. `RideableTadpolCopter.jsx` — physics + visual + mount sensor.
3. `Experience.jsx` — add copter to Physics block (2-line change + import).
4. Test 6DOF movement, tune `flySpeed` and `turnSpeed` in Leva.
5. Test mount/dismount with copter and car both in scene simultaneously.
6. Test standalone mode (no Ecctrl) for a dedicated flight scene.

---

## Standalone flight scene usage (no capsule)

```jsx
// In a dedicated flight scene — no Ecctrl needed
<Physics gravity={[0, -9.81, 0]}>
  {' '}
  {/* scene has normal gravity */}
  <RideableTadpolCopter standalone position={[0, 5, 0]} />
  <Floor />
  <RigidObjects /> {/* these still have gravity */}
</Physics>
```

The copter's own `gravityScale={0}` is set internally on its RigidBody.
Everything else in the scene keeps normal gravity. No scene-level gravity override needed.

---

## Key differences from RC Car physics

| Aspect          | RC Car                                        | TadpolCopter                        |
| --------------- | --------------------------------------------- | ----------------------------------- |
| Physics impulse | `applyImpulseAtPoint` per wheel               | `setLinvel` directly                |
| Gravity player  | Scene default → `gravityScale=0` when mounted | Always `gravityScale=0` when active |
| Vertical axis   | Ground-locked (suspension)                    | Free (6DOF)                         |
| Rotation        | Yaw via torque impulse                        | Yaw via direct quaternion set       |
| Complexity      | ~150 lines physics logic                      | ~80 lines physics logic             |
| Tuning params   | 8 Leva controls                               | 2 Leva controls                     |
