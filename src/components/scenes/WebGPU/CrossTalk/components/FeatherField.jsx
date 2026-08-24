import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import { useOwlFeatherGeometries } from '@elements/OwlFeathers/OwlFeathers';

const dummy = new THREE.Object3D();
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const headingQuat = new THREE.Quaternion();
const tumbleQuat = new THREE.Quaternion();
// Stable per-particle depth jitter so overlapping feathers don't z-fight —
// same role as CloudField's zOffset, just keyed by particle index instead of
// window id since feathers aren't one-per-window entities.
const Z_JITTER = 60;
// Radians/sec range for each particle's own continuous tumble.
const MIN_TUMBLE_SPEED = 0.6;
const MAX_TUMBLE_SPEED = 2.2;

function hashUnit(seed) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

// A feather rendered flat-on to the camera (rotation only around the view
// axis, as this used to do) never turns enough to show its own curve — it
// reads as a flat cutout no matter how the swarm moves. Each particle gets
// its own stable rotation axis + angular speed (seeded from its index, not
// Math.random, so it doesn't reshuffle every frame) and free-tumbles around
// that axis continuously; the swarm's own velocity heading (`angle`, from
// the physics buffer) is layered on top as a Z bank so the feather still
// generally orients with the direction it's being blown, rather than
// tumbling in a way disconnected from its own motion.
function makeTumble(index) {
  const axis = new THREE.Vector3(
    hashUnit(index * 3 + 1) * 2 - 1,
    hashUnit(index * 3 + 2) * 2 - 1,
    hashUnit(index * 3 + 3) * 2 - 1
  ).normalize();
  const speed =
    MIN_TUMBLE_SPEED +
    hashUnit(index * 7 + 11) * (MAX_TUMBLE_SPEED - MIN_TUMBLE_SPEED);
  const phase = hashUnit(index * 13 + 5) * Math.PI * 2;
  return { axis, speed, phase };
}

// Renders the shared feather swarm (see hooks/useFeatherSwarm.js) as one
// InstancedMesh per feather variant — real instancing, not a `<mesh>` per
// particle, so the draw-call count stays at 4 regardless of particleCount.
// `bufferRef`/`countRef` are refs, not state: a new physics frame never
// triggers a React re-render (see scene-performance-checklist.md). Particle
// index -> variant is a fixed round-robin over `maxParticles`, computed once,
// so it stays stable across both host and every non-host window without
// needing to be broadcast.
function FeatherField({ bufferRef, countRef, maxParticles, scale }) {
  const assets = useOwlFeatherGeometries();
  const meshRefs = useRef([]);

  const buckets = useMemo(() => {
    const perVariant = assets.map(() => []);
    for (let i = 0; i < maxParticles; i += 1) {
      perVariant[i % assets.length].push(i);
    }
    return perVariant;
  }, [assets, maxParticles]);

  const zOffsets = useMemo(
    () =>
      Array.from(
        { length: maxParticles },
        (_, i) => (hashUnit(i + 1) - 0.5) * Z_JITTER
      ),
    [maxParticles]
  );

  const tumbles = useMemo(
    () => Array.from({ length: maxParticles }, (_, i) => makeTumble(i)),
    [maxParticles]
  );

  useFrame(() => {
    const src = bufferRef.current;
    const liveCount = Math.min(countRef.current, maxParticles);
    // Wall-clock, not clock.elapsedTime (page-load-relative) — two browser
    // windows/tabs load at different times, so an elapsedTime basis would
    // put the same particle at a different tumble phase in each, an obvious
    // seam where overlapping windows show the same shared feather spinning
    // out of sync with itself.
    const t = Date.now() / 1000;

    buckets.forEach((indices, variantIndex) => {
      const mesh = meshRefs.current[variantIndex];
      if (!mesh) return;

      const renderScale = scale / assets[variantIndex].baseSize;
      let instanceCount = 0;
      indices.forEach((particleIndex) => {
        if (particleIndex >= liveCount) return;

        dummy.position.set(
          src[3 * particleIndex],
          src[3 * particleIndex + 1],
          zOffsets[particleIndex]
        );

        const tumble = tumbles[particleIndex];
        headingQuat.setFromAxisAngle(Z_AXIS, src[3 * particleIndex + 2]);
        tumbleQuat.setFromAxisAngle(
          tumble.axis,
          t * tumble.speed + tumble.phase
        );
        dummy.quaternion.multiplyQuaternions(headingQuat, tumbleQuat);

        dummy.scale.setScalar(renderScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(instanceCount, dummy.matrix);
        instanceCount += 1;
      });

      mesh.count = instanceCount;
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <>
      {assets.map(({ geometry, material }, i) => (
        <instancedMesh
          key={geometry.uuid}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          args={[geometry, material, buckets[i].length || 1]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
}

export default memo(FeatherField);
