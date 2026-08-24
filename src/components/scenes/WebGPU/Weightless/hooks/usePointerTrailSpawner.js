import { useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// Pointer spawning ported from three-sketches surface-flow/interactiveCurl:
// dragging steps along the stroke spawning trails at jittered raycast hits;
// clicking fires an expanding ring burst over ~500ms. Rays are transformed
// into the bird's bind space (inverse of the normalization matrix) and cast
// against the walk geometry's BVH, so hits map directly to walker faces.

const STROKE_STEP_PX = 2;
const STROKE_JITTER_PX = 5;
const BURST_MAX_RADIUS_PX = 100;
const BURST_MAX_TIME_MS = 500;
const BURST_MAX_HITS = 50;

const raycaster = new THREE.Raycaster();
const invNorm = new THREE.Matrix4();
const ndc = new THREE.Vector2();

export default function usePointerTrailSpawner({
  enabled,
  birdStateRef,
  systemRef,
  onSpawn,
}) {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!enabled) return undefined;

    const element = gl.domElement;
    const prevMouse = new THREE.Vector2();
    const mouse = new THREE.Vector2();
    const delta = new THREE.Vector2();
    const offset = new THREE.Vector2();
    const origin = new THREE.Vector2();
    let initialized = false;
    let burstRaf = 0;

    const triggerTrail = (clientX, clientY) => {
      const state = birdStateRef.current;
      const system = systemRef.current;
      if (!state?.fitted || !system) return;

      const rect = element.getBoundingClientRect();
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -(((clientY - rect.top) / rect.height) * 2 - 1)
      );
      raycaster.setFromCamera(ndc, camera);

      invNorm.copy(state.normMatrix).invert();
      raycaster.ray.applyMatrix4(invNorm);

      const hit = system.walk.bvh.raycastFirst(raycaster.ray, THREE.DoubleSide);
      if (hit) onSpawn(hit.point, hit.faceIndex);
    };

    const handlePointerMove = (event) => {
      mouse.set(event.clientX, event.clientY);
      if (!initialized) {
        prevMouse.copy(mouse);
        initialized = true;
      }

      delta.subVectors(mouse, prevMouse);
      let dist = delta.length();
      delta.normalize();

      while (dist > STROKE_STEP_PX) {
        prevMouse.addScaledVector(delta, STROKE_STEP_PX);
        dist -= STROKE_STEP_PX;

        offset.set(1, 0);
        offset.rotateAround(origin.set(0, 0), Math.random() * 2 * Math.PI);
        offset.multiplyScalar(STROKE_JITTER_PX);
        offset.add(prevMouse);
        triggerTrail(offset.x, offset.y);
      }
    };

    const handlePointerDown = (event) => {
      mouse.set(event.clientX, event.clientY);

      let time = 0;
      let startTime = performance.now();

      const run = () => {
        const frameDelta = performance.now() - startTime;
        const minInterp = Math.max(
          (BURST_MAX_TIME_MS - time) / BURST_MAX_TIME_MS,
          0
        );
        const minValue = 1 - minInterp ** 2;
        const maxInterp = Math.max(
          (BURST_MAX_TIME_MS - time - frameDelta) / BURST_MAX_TIME_MS,
          0
        );
        const maxValue = 1 - maxInterp ** 2;

        const hits =
          BURST_MAX_HITS *
          (1 - THREE.MathUtils.lerp(minValue, maxValue, Math.random()));
        for (let i = 0; i < hits; i += 1) {
          offset.set(1, 0);
          offset.rotateAround(origin.set(0, 0), Math.random() * 2 * Math.PI);
          offset.multiplyScalar(
            BURST_MAX_RADIUS_PX *
              THREE.MathUtils.lerp(minValue, maxValue, Math.random())
          );
          offset.add(mouse);
          triggerTrail(offset.x, offset.y);
        }

        time += frameDelta;
        startTime = performance.now();
        if (time < BURST_MAX_TIME_MS) burstRaf = requestAnimationFrame(run);
      };
      run();
    };

    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerdown', handlePointerDown);

    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(burstRaf);
    };
  }, [enabled, birdStateRef, camera, gl, onSpawn, systemRef]);
}
