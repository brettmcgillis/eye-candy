import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

// Far outside any reasonable touch radius, so the falloff in bladeMaterial
// reads as fully inactive without needing a separate enabled uniform.
const FAR_AWAY = 1e5;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointerNdc = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const hitPoint = new THREE.Vector3();
const localHit = new THREE.Vector3();
const heightPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// A flat y=0 plane only matches the actual hilled/carved terrain by
// coincidence, so the bend (and the grass/dirt hit-test below) can land
// visibly off from the cursor on sloped ground. A few plane-vs-heightfield
// passes converge it onto the real surface: sample the terrain height under
// the current guess, re-intersect a plane at that height (rotation around Y
// never changes a point's height, so the sampled local-space height doubles
// as the next world-space plane), and repeat.
const HEIGHT_REFINE_ITERATIONS = 3;

// Matches the rejection threshold in utils/grass.js's scatterBlades — below
// this, the heightfield's carve channel is meadow (grass gets placed there);
// at or above it, the surface is carved-out dirt/pit/strata (no blades).
const GRASS_CARVE_THRESHOLD = 0.3;

// Refines a world-space ground-plane hit onto the actual heightfield surface
// in place, returning the matching local-space (pre-yaw) point.
function refineHitOnHeightField(heightField, terrainYaw) {
  if (!heightField?.sampleHeight) {
    return localHit.copy(hitPoint).applyAxisAngle(Y_AXIS, -terrainYaw);
  }

  for (let i = 0; i < HEIGHT_REFINE_ITERATIONS; i += 1) {
    localHit.copy(hitPoint).applyAxisAngle(Y_AXIS, -terrainYaw);
    heightPlane.constant = -heightField.sampleHeight(localHit.x, localHit.z);
    if (!raycaster.ray.intersectPlane(heightPlane, hitPoint)) {
      break;
    }
  }

  return localHit.copy(hitPoint).applyAxisAngle(Y_AXIS, -terrainYaw);
}

// Cursor-grass interaction: raycasts the pointer onto a ground plane every
// frame and exposes the hit as a live TSL uniform for bladeMaterial to bend
// blades away from. Ported from the vanilla-three example in
// `reference/interactiveGrass.js` (player-proximity push), swapped for a
// continuous distance falloff instead of a hard collider radius. Radius and
// strength are plain artistic uniforms, owned and synced by Grass.jsx like
// the rest of its config-driven uniforms — this hook only owns the position.
//
// A press is checked once, at pointerdown, against the actual grass coverage
// — same as DumpsterFire deciding once whether you grabbed a trash object.
// This raycasts the real terrain/wall meshes (tagged with
// `userData.touchGrassSurface` in Terrain.jsx) rather than a flat math
// plane: the visible "dirt" in this scene is mostly the terrain's vertical
// wall meshes (chunk-edge mode), which a horizontal plane can't locate at
// all — clicking a wall would resolve to some unrelated point wherever the
// ray happens to cross y=0, often still reading as grass. Hitting an actual
// wall mesh is unambiguous; hitting the terrain surface falls back to the
// heightfield's carve channel (matches utils/grass.js's blade-rejection
// threshold) to tell meadow from carved-out pit floor. If it lands on grass,
// the whole gesture is held back from OrbitControls via a capture-phase
// listener on `window` (guaranteed to run before OrbitControls' own
// listeners on the canvas regardless of mount order) using
// `stopPropagation`, so OrbitControls never learns the gesture happened —
// it's never reversed mid-gesture. A press on sky, a wall, or a carved pit
// floor is left completely alone, so it orbits normally.
export default function useCursorTouch({ enabled, heightField, terrainYaw }) {
  const { camera, gl, scene } = useThree();
  const hasPointerRef = useRef(false);
  const grassPointersRef = useRef(new Set());
  const surfacesRef = useRef([]);

  const touchPosition = useMemo(
    () => uniform(new THREE.Vector3(FAR_AWAY, 0, FAR_AWAY)),
    []
  );

  useEffect(() => {
    const element = gl.domElement;
    const grassPointers = grassPointersRef.current;

    const updatePointer = (clientX, clientY) => {
      const rect = element.getBoundingClientRect();
      pointerNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -(((clientY - rect.top) / rect.height) * 2 - 1)
      );
      hasPointerRef.current = true;
    };

    const isOverGrass = (clientX, clientY) => {
      updatePointer(clientX, clientY);
      raycaster.setFromCamera(pointerNdc, camera);

      surfacesRef.current.length = 0;
      scene.traverse((object) => {
        if (object.userData?.touchGrassSurface) {
          surfacesRef.current.push(object);
        }
      });

      const hits = raycaster.intersectObjects(surfacesRef.current, false);
      if (hits.length === 0) {
        return false; // sky, or nothing tagged under the cursor
      }

      const closest = hits[0];
      if (closest.object.userData.touchGrassSurface === 'wall') {
        return false; // exposed dirt/strata wall — never grass
      }

      if (!heightField?.sampleCarve) {
        return true;
      }

      localHit.copy(closest.point).applyAxisAngle(Y_AXIS, -terrainYaw);
      return (
        heightField.sampleCarve(localHit.x, localHit.z) < GRASS_CARVE_THRESHOLD
      );
    };

    // Plain hover (no button/finger down) still reaches here on every move,
    // which is what makes desktop's no-click grass bend work.
    const handleLeave = () => {
      hasPointerRef.current = false;
    };

    const handleCaptureDown = (event) => {
      if (
        !element.contains(event.target) ||
        !isOverGrass(event.clientX, event.clientY)
      ) {
        return;
      }

      grassPointers.add(event.pointerId);
      event.stopPropagation();
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const handleCaptureMove = (event) => {
      if (element.contains(event.target)) {
        updatePointer(event.clientX, event.clientY);
      }

      if (!grassPointers.has(event.pointerId)) {
        return;
      }

      event.stopPropagation();
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const clearPointer = (event) => {
      grassPointers.delete(event.pointerId);
    };

    element.addEventListener('pointerleave', handleLeave);
    window.addEventListener('pointerdown', handleCaptureDown, true);
    window.addEventListener('pointermove', handleCaptureMove, true);
    window.addEventListener('pointerup', clearPointer, true);
    window.addEventListener('pointercancel', clearPointer, true);

    return () => {
      element.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('pointerdown', handleCaptureDown, true);
      window.removeEventListener('pointermove', handleCaptureMove, true);
      window.removeEventListener('pointerup', clearPointer, true);
      window.removeEventListener('pointercancel', clearPointer, true);
    };
  }, [camera, gl, heightField, scene, terrainYaw]);

  useFrame(() => {
    if (!enabled || !hasPointerRef.current) {
      touchPosition.value.setX(FAR_AWAY).setZ(FAR_AWAY);
      return;
    }

    raycaster.setFromCamera(pointerNdc, camera);

    if (!raycaster.ray.intersectPlane(GROUND_PLANE, hitPoint)) {
      touchPosition.value.setX(FAR_AWAY).setZ(FAR_AWAY);
      return;
    }

    const local = refineHitOnHeightField(heightField, terrainYaw);
    touchPosition.value.copy(local);
  });

  return touchPosition;
}
