/* eslint-disable no-nested-ternary */
import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '../../../../../../utils/appUtils';

const MODEL = modelFile('security_camera.glb');
useGLTF.preload(MODEL);

/**
 * The fake bird's "head": a surveillance camera. The asset (security_camera.glb) is
 * a wall-mounted camera authored at ~50 units: a Camera body + Lens up top sitting on
 * a Stem + Base wall mount. For a HEAD we want only the top cluster.
 *
 * Rather than hardcode node names, we read the loaded model and keep the two highest
 * meshes (camera + lens), dropping the mount. The kept geometry is recentered and
 * normalized to a ~1-unit cube so the parent can size the head in scene units. The
 * model is Y-up and points along +Z, so it renders upright as-is; aiming the lens at
 * the bird's heading is left to the parent's yaw. It slowly pans (the surveillance
 * sweep) and blinks a red REC LED.
 */
export default function CameraHead({
  sweepRange = 0.7, // radians, half-angle of the pan
  sweepSpeed = 0.5, // radians/sec phase advance
  phase = 0, // per-instance offset so a flock doesn't sweep in sync
  ledColor = '#ff2b2b',
  ledBlink = true,
  ledOffset = { x: 0, y: 0, z: 0 }, // nudge the LED in normalized head units
}) {
  const { scene } = useGLTF(MODEL);
  const sweepRef = useRef();
  const ledRef = useRef();

  // Pull the camera head straight off the loaded model: collect every mesh, keep
  // the two sitting highest (the body + lens), and normalize their combined bounds.
  // ledBase is the LED's default spot expressed in the SAME normalized (~1-unit)
  // space the parent scales, so the ledOffset control reads in intuitive units.
  const { meshes, center, invScale, ledBase } = useMemo(() => {
    const found = [];
    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.computeBoundingBox();
      const c = new THREE.Vector3();
      o.geometry.boundingBox.getCenter(c);
      found.push({ mesh: o, cy: c.y });
    });
    found.sort((a, b) => b.cy - a.cy);
    const head = found.slice(0, 2).map((f) => f.mesh);

    const box = new THREE.Box3();
    head.forEach((m) => box.union(m.geometry.boundingBox));
    const c = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(c);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    // REC LED default: front-top-center (model faces +Z, so front == box.max.z),
    // converted into normalized units relative to the recentered geometry.
    const led = new THREE.Vector3(
      0,
      (size.y * 0.28) / maxDim,
      (box.max.z - c.z) / maxDim
    );

    return { meshes: head, center: c, invScale: 1 / maxDim, ledBase: led };
  }, [scene]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (sweepRef.current) {
      sweepRef.current.rotation.y =
        Math.sin(t * sweepSpeed + phase) * sweepRange;
    }
    if (ledRef.current) {
      const on = ledBlink ? (Math.sin(t * 6 + phase) > 0.3 ? 1 : 0.04) : 1;
      ledRef.current.material.emissiveIntensity = on * 4;
    }
  });

  if (!meshes.length) return null;

  return (
    // sweepRef pans the head; inner groups normalize + recenter the kept geometry.
    // The LED lives in normalized space (sibling of the geometry) so its offset reads
    // in head-sized units instead of the model's ~50-unit geometry space.
    <group ref={sweepRef}>
      <group scale={invScale}>
        <group position={[-center.x, -center.y, -center.z]}>
          {meshes.map((m) => (
            <mesh
              key={m.uuid}
              geometry={m.geometry}
              material={m.material}
              castShadow
              receiveShadow
            />
          ))}
        </group>
      </group>
      {/* Blinking "we're watching you" LED, parked by the lens glass. */}
      <mesh
        ref={ledRef}
        position={[
          ledBase.x + ledOffset.x,
          ledBase.y + ledOffset.y,
          ledBase.z + ledOffset.z,
        ]}
      >
        <sphereGeometry args={[0.005, 12, 12]} />
        <meshStandardMaterial
          color={ledColor}
          emissive={ledColor}
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
