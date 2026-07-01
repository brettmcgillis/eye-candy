import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { PRIORITY } from '../layers/attractorBus';
import { MAX_ATTRACTORS } from '../utils/trackingAttractors';

// Spatial debug overlay: a translucent sphere per live attractor, sitting in the
// exact same space as the particles (same grid→world transform as
// ParticleRenderer) so you can see WHERE each attractor/repeller is and its
// relative influence size against the bounds and the cloud.
//
//   colour by polarity  → green = attract, red = repel
//   colour by source    → core-repel / outline / hands / impulse / ghost
//   sphere radius        → the attractor's `radius` (grid units), so relative
//                          sizes read true; tune with Gizmo Scale.
//
// Reads the conductor's combined attractor list from `debugRef` (one frame of
// lag, invisible). HIDDEN unless controls.showAttractors is on.

const HIDDEN = new THREE.Vector3(99999, 99999, 99999);

const ATTRACT_COLOR = new THREE.Color('#34d399');
const REPEL_COLOR = new THREE.Color('#f87171');

const SOURCE_COLORS = {
  [PRIORITY.coreRepel]: new THREE.Color('#ef4444'),
  [PRIORITY.outlineCore]: new THREE.Color('#22d3ee'),
  [PRIORITY.outlineLimb]: new THREE.Color('#2dd4bf'),
  [PRIORITY.handImpulse]: new THREE.Color('#facc15'),
  [PRIORITY.face]: new THREE.Color('#e879f9'),
  [PRIORITY.hand]: new THREE.Color('#60a5fa'),
  [PRIORITY.ghost]: new THREE.Color('#e5e7eb'),
};
const FALLBACK_COLOR = new THREE.Color('#ffffff');

function AttractorDebug({ debugRef, controls }) {
  const meshRef = useRef(null);
  const dummyRef = useRef(new THREE.Object3D());
  const colorRef = useRef(new THREE.Color());

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 12, 12), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!controls.showAttractors) {
      if (mesh.visible) mesh.visible = false;
      return;
    }
    mesh.visible = true;
    material.opacity = controls.attractorOpacity;

    const dummy = dummyRef.current;
    const color = colorRef.current;
    const debug = debugRef.current;
    const list = debug.list || [];
    const depthScale = controls.particleDepthScale;
    const showImpulses = controls.showImpulseLeads;

    let drawn = 0;
    for (let i = 0; i < list.length && drawn < MAX_ATTRACTORS; i += 1) {
      const a = list[i];
      if (showImpulses || a.priority !== PRIORITY.handImpulse) {
        const r = Math.max(0.001, a.radius * controls.attractorGizmoScale);
        dummy.position.set(
          a.position.x,
          a.position.y,
          a.position.z * depthScale
        );
        dummy.scale.setScalar(r);
        dummy.updateMatrix();
        mesh.setMatrixAt(drawn, dummy.matrix);

        if (controls.colorBySource) {
          color.copy(SOURCE_COLORS[a.priority] || FALLBACK_COLOR);
        } else {
          color.copy(a.strength >= 0 ? ATTRACT_COLOR : REPEL_COLOR);
        }
        mesh.setColorAt(drawn, color);
        drawn += 1;
      }
    }

    // Park unused instances far offscreen.
    for (let i = drawn; i < MAX_ATTRACTORS; i += 1) {
      dummy.position.copy(HIDDEN);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group scale={1 / 64} position={[-0.5, 0, controls.particleZOffset]}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, MAX_ATTRACTORS]}
        frustumCulled={false}
      />
    </group>
  );
}

export default React.memo(AttractorDebug);
