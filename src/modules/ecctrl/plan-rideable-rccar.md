# Plan 1 — Rideable Infrastructure + RC Car

Builds the full mount/dismount system used by all rideables, then implements the RC Car as the first rideable.
Plan 2 (TadpolCopter) depends on this plan being complete first.

---

## New files

### `src/modules/ecctrl/rideables/useRideableState.ts`

Zustand store. Single source of truth for which rideable (if any) is active.

```ts
import type React from 'react';

import { create } from 'zustand';

type RideableState = {
  mountedId: string | null;
  mountedGroupRef: React.RefObject<THREE.Group> | null;
  mount: (id: string, groupRef: React.RefObject<THREE.Group>) => void;
  dismount: () => void;
};

export const useRideableState = create<RideableState>((set) => ({
  mountedId: null,
  mountedGroupRef: null,
  mount: (id, groupRef) => set({ mountedId: id, mountedGroupRef: groupRef }),
  dismount: () => set({ mountedId: null, mountedGroupRef: null }),
}));
```

---

### `src/components/elements/models/rcCar/RideableRcCar.jsx`

Chassis physics + wheel raycasts + traction/slip + mount sensor.

**Props:**

```jsx
<RideableRcCar
  id="rccar-1" // unique rideable id
  position={[5, 0.5, 0]}
  ecctrlRef={ecctrlRef} // null in standalone mode
  mounted={false} // controlled externally in mixed scene
  onMount={fn} // ({ id, groupRef }) => void
  onDismount={fn} // () => void
  standalone={false} // true = always active, no mount/dismount
/>
```

**Physics architecture:**

Chassis: `<RigidBody type="dynamic">` with `<BoxCollider args={[1.0, 0.3, 1.8]}>`

Wheel contact points (local offsets from chassis center):

```
FL: [-0.9,  0, +1.2]
FR: [+0.9,  0, +1.2]
RL: [-0.9,  0, -1.2]
RR: [+0.9,  0, -1.2]
```

Per-wheel in `useFrame` (using `world.castRay` — same pattern as Ecctrl.tsx line 1426):

```js
// ray origin = worldpos of wheel slot
// ray dir = {x:0, y:-1, z:0}, length = suspensionRestLen (0.5)
if (rayHit && rayHit.timeOfImpact < suspensionRestLen) {
  const compression = suspensionRestLen - rayHit.timeOfImpact;
  // Spring force up
  chassisRef.current.applyImpulseAtPoint(
    { x: 0, y: springK * compression - linvel.y * dampingC, z: 0 },
    wheelWorldPos,
    true
  );

  // Traction/slip — forward impulse on front wheels only (rear-wheel option later)
  const chassisFwd = getChassisForward(chassisRef); // normalize chassis Z axis
  const throttle = (forward ? 1 : backward ? -1 : 0) * maxThrottle;
  chassisRef.current.applyImpulseAtPoint(
    chassisFwd.multiplyScalar(throttle * delta),
    wheelWorldPos,
    true
  );

  // Lateral damping (slip resistance) at each grounded wheel
  const lateralAxis = getChassisRight(chassisRef);
  const lateralVel = currentLinvel.dot(lateralAxis);
  chassisRef.current.applyImpulse(
    lateralAxis.multiplyScalar(-lateralVel * lateralDampingC),
    true
  );
}
```

Steering:

```js
// steerAngle accumulates from left/right input, clamped to ±maxSteerAngle (0.45 rad)
// Applied as a yaw torque impulse on the chassis
const steerInput = leftward ? 1 : rightward ? -1 : 0;
steerAngle = clamp(
  steerAngle + steerInput * steerSpeed * delta,
  -maxSteerAngle,
  maxSteerAngle
);
// Decay steer angle back to 0 when no input
if (!leftward && !rightward)
  steerAngle = lerp(steerAngle, 0, steerDecay * delta);
chassisRef.current.applyTorqueImpulse(
  { x: 0, y: steerAngle * steerTorqueMult * delta, z: 0 },
  true
);
```

Mount sensor (mixed scene only, skipped when `standalone=true`):

```jsx
<CylinderCollider
  sensor
  args={[1.0, 1.5]}
  onIntersectionEnter={() => setNearPlayer(true)}
  onIntersectionExit={() => setNearPlayer(false)}
/>
```

Mount/dismount trigger (action1 key or joystick button1):

```js
// subscribe to action1 via useKeyboardControls subscribeKeys
// when nearPlayer && !mounted && action1 pressed → onMount({ id, groupRef })
// when mounted && action1 pressed → onDismount()
```

**"Invisible passenger" pattern when mounted:**
Each frame while `mounted && ecctrlRef` is provided:

```js
// Position capsule at car seat offset so ecctrl camera follows car
const seatPos = getWorldPosition(chassisGroupRef).add(SEAT_OFFSET);
ecctrlRef.current?.setPosition(seatPos); // requires Ecctrl.tsx change below
```

**Standalone mode:**
When `standalone={true}`, the component owns its own `useFollowCam` directly (or accepts a `cameraTarget` ref from the parent scene). Mount sensor and ecctrlRef logic are skipped entirely.

---

## Modified files

### `src/modules/ecctrl/Ecctrl.tsx`

**Change 1:** Add `setPosition` to `CustomEcctrlRigidBody` interface (line ~1914):

```ts
export interface CustomEcctrlRigidBody {
  group: THREE.Group | null;
  rotateCamera: (x: number, y: number) => void;
  rotateCharacterOnY: (rad: number) => void;
  setPosition: (pos: THREE.Vector3) => void; // NEW
}
```

**Change 2:** Expose `setPosition` via `useImperativeHandle` (line ~180):

```ts
useImperativeHandle(
  ref,
  () => ({
    get group() {
      return characterModelRef.current;
    },
    rotateCamera,
    rotateCharacterOnY,
    setPosition: (pos: THREE.Vector3) => {
      // NEW
      characterRef.current?.setTranslation(pos, true);
      characterRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
    },
  }),
  []
);
```

No other changes to Ecctrl.tsx. Both changes are purely additive.

---

### `src/components/scenes/WebGL/CharacterController/Experience.jsx`

**1. Import:**

```js
import { useRideableState } from '../../../../modules/ecctrl/rideables/useRideableState';
import RideableRcCar from '../../../elements/models/rcCar/RideableRcCar';
```

**2. Mount state:**

```js
const { mountedId, mount, dismount } = useRideableState();
```

**3. Merge with existing `disableControl` Leva control:**

```js
const effectiveDisableControl = disableControl || !!mountedId;
```

**4. Pass to Ecctrl:**

```jsx
<Ecctrl
  ref={ecctrlRef}
  disableControl={effectiveDisableControl}   // was: disableControl
  gravityScale={mountedId ? 0 : undefined}   // NEW — freeze capsule when mounted
  ...
>
```

**5. Add rideable to Physics block:**

```jsx
<RideableRcCar
  id="rccar-1"
  position={[4, 0.5, 4]}
  ecctrlRef={ecctrlRef}
  mounted={mountedId === 'rccar-1'}
  onMount={mount}
  onDismount={dismount}
/>
```

**6. Add Leva toggle to enable/disable rideables in scene:**

```js
rideablesEnabled: { value: false, label: 'Rideables' }
// Only render <RideableRcCar> when rideablesEnabled is true
```

---

### `src/components/scenes/WebGL/CharacterController/hooks/useMultiplayer.ts`

**1. Extend `CharacterStateData`:**

```ts
export interface CharacterStateData {
  ...existing fields...
  mountedRideableId?: string | null;   // NEW
}
```

**2. Broadcast in sync interval:**

```ts
const { mountedId } = useRideableState.getState();
data: {
  ...existing fields...
  mountedRideableId: mountedId ?? null,
}
```

Remote player representation doesn't need to change — remote players just show the character at whatever position is broadcast.

---

## Leva controls for RideableRcCar (inside the component)

```js
useControls(
  'RC Car',
  {
    maxThrottle: { value: 8, min: 1, max: 30, step: 0.5 },
    maxSteerAngle: { value: 0.45, min: 0.1, max: 1.0, step: 0.01 },
    steerSpeed: { value: 2.5, min: 0.5, max: 8, step: 0.1 },
    steerDecay: { value: 4, min: 1, max: 10, step: 0.5 },
    steerTorqueMult: { value: 0.8, min: 0.1, max: 3, step: 0.05 },
    suspensionRestLen: { value: 0.45, min: 0.1, max: 1.0, step: 0.01 },
    springK: { value: 18, min: 5, max: 60, step: 1 },
    dampingC: { value: 2.5, min: 0.5, max: 10, step: 0.1 },
    lateralDampingC: { value: 6, min: 1, max: 20, step: 0.5 },
  },
  { collapsed: true }
);
```

---

## Step order

1. `useRideableState.ts` — no dependencies
2. `Ecctrl.tsx` — add `setPosition` (2 small additive changes)
3. `RideableRcCar.jsx` — physics core, no Experience dependency
4. `Experience.jsx` — wire in mount state + rideable
5. `useMultiplayer.ts` — extend broadcast payload
6. Tune Leva values in local dev

---

## Standalone car scene usage (no capsule)

```jsx
// In a dedicated car scene component — no Ecctrl needed
<Physics>
  <RideableRcCar standalone position={[0, 0.5, 0]} />
  <Floor />
</Physics>
```

The component detects `standalone={true}` and:

- Skips mount sensor and ecctrlRef positioning
- Is always in active/driving state
- Owns its own camera target (passes its group ref up to the scene for useFollowCam)
