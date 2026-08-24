import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

const raycaster = new THREE.Raycaster();
const cameraDir = new THREE.Vector3();
const toCenter = new THREE.Vector3();
const closest = new THREE.Vector3();

// Pointer interactivity, two layers:
//   1. Touching the bird (ray passes near its bounding sphere) ramps the
//      internal flow speed — the swirl inside the bird quickens under a
//      finger or cursor.
//   2. The pointer also carries an attractor/repeller for the free
//      (emitted) particles, positioned on the camera-facing plane through
//      the bird's center.
function PointerInput({
  simRef,
  birdSphereRef,
  enabled,
  mode,
  strength,
  radius,
  touchBoost,
  touchRadiusScale,
}) {
  const { camera, gl } = useThree();
  const pointerNdcRef = useRef(new THREE.Vector2());
  const hasPointerRef = useRef(false);
  const boostRef = useRef(1);

  useEffect(() => {
    const element = gl.domElement;

    const resetPointer = () => {
      hasPointerRef.current = false;
    };

    const updatePointer = (event) => {
      const rect = element.getBoundingClientRect();
      pointerNdcRef.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      );
      hasPointerRef.current = true;
    };

    const handlePointerUp = (event) => {
      if (event.pointerType !== 'mouse') resetPointer();
    };

    element.addEventListener('pointerdown', updatePointer);
    element.addEventListener('pointermove', updatePointer);
    element.addEventListener('pointerleave', resetPointer);
    element.addEventListener('pointercancel', resetPointer);
    element.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('blur', resetPointer);

    return () => {
      element.removeEventListener('pointerdown', updatePointer);
      element.removeEventListener('pointermove', updatePointer);
      element.removeEventListener('pointerleave', resetPointer);
      element.removeEventListener('pointercancel', resetPointer);
      element.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('blur', resetPointer);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const entry = simRef.current;
    if (!entry) return;

    const { uniforms } = entry.sim;
    const sphere = birdSphereRef.current;
    const active = enabled && hasPointerRef.current && sphere.radius > 0;

    let touched = false;
    if (active) {
      raycaster.setFromCamera(pointerNdcRef.current, camera);
      const { ray } = raycaster;

      // Distance from pointer ray to bird center → "touching the bird".
      closest.copy(sphere.center).sub(ray.origin);
      const along = Math.max(closest.dot(ray.direction), 0);
      closest.copy(ray.direction).multiplyScalar(along).add(ray.origin);
      touched =
        closest.distanceTo(sphere.center) <= sphere.radius * touchRadiusScale;

      // Attractor on the camera-facing plane through the bird center.
      camera.getWorldDirection(cameraDir);
      toCenter.copy(sphere.center).sub(ray.origin);
      const denominator = ray.direction.dot(cameraDir);
      if (Math.abs(denominator) > 1e-5) {
        const t = toCenter.dot(cameraDir) / denominator;
        uniforms.attractorPos.value
          .copy(ray.direction)
          .multiplyScalar(t)
          .add(ray.origin);
        uniforms.attractorOn.value = 1;
      } else {
        uniforms.attractorOn.value = 0;
      }
    } else {
      uniforms.attractorOn.value = 0;
    }

    uniforms.attractorStrength.value = mode === 'repel' ? -strength : strength;
    uniforms.attractorRadius.value = radius;

    // Smoothly ramp the internal flow boost in and out of touch.
    const target = touched ? touchBoost : 1;
    const blend = Math.min(delta * 6, 1);
    boostRef.current += (target - boostRef.current) * blend;
    uniforms.touchBoost.value = boostRef.current;
  });

  return null;
}

export default memo(PointerInput);
