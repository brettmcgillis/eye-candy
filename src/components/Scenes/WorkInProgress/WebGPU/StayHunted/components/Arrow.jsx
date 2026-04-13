import * as THREE from 'three/webgpu';

import React, { useMemo } from 'react';

// ── Arrow dimensions ──
const SHAFT_RADIUS = 0.008;
const SHAFT_LENGTH = 2.0;
const HEAD_LENGTH = 0.06;
const HEAD_RADIUS = 0.018;
const NOCK_LENGTH = 0.03;
const NOCK_RADIUS = 0.01;

// ── Fletching dimensions ──
const VANE_LENGTH = 0.18;
const VANE_HEIGHT = 0.03;
const VANE_COUNT = 3;
const VANE_OFFSET = 0.15; // distance from nock end

function createArrowGeometries() {
  const shaft = new THREE.CylinderGeometry(
    SHAFT_RADIUS,
    SHAFT_RADIUS,
    SHAFT_LENGTH,
    8
  );
  const head = new THREE.ConeGeometry(HEAD_RADIUS, HEAD_LENGTH, 6);
  const nock = new THREE.CylinderGeometry(
    NOCK_RADIUS,
    SHAFT_RADIUS,
    NOCK_LENGTH,
    6
  );
  const vane = new THREE.PlaneGeometry(VANE_LENGTH, VANE_HEIGHT);

  return { shaft, head, nock, vane };
}

function createArrowMaterials() {
  const wood = new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color('#8b7355'),
    roughness: 0.8,
    metalness: 0.0,
  });
  const metal = new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color('#4a4a4a'),
    roughness: 0.3,
    metalness: 0.7,
  });
  const feather = new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color('#d4cbb8'),
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  return { wood, metal, feather };
}

export default function Arrow({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const geos = useMemo(createArrowGeometries, []);
  const mats = useMemo(createArrowMaterials, []);

  const halfShaft = SHAFT_LENGTH / 2;
  const headY = halfShaft + HEAD_LENGTH / 2;
  const nockY = -halfShaft - NOCK_LENGTH / 2;

  // Build fletching vanes evenly spaced around shaft, near nock end
  const vanes = useMemo(() => {
    const configs = [];
    for (let i = 0; i < VANE_COUNT; i += 1) {
      const angle = (i / VANE_COUNT) * Math.PI * 2;
      configs.push({
        key: `vane-${i}`,
        position: [
          Math.cos(angle) * SHAFT_RADIUS,
          -halfShaft + VANE_OFFSET + VANE_LENGTH / 2,
          Math.sin(angle) * SHAFT_RADIUS,
        ],
        rotation: [0, -angle, 0],
      });
    }
    return configs;
  }, [halfShaft]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Shaft */}
      <mesh geometry={geos.shaft} material={mats.wood} />

      {/* Arrowhead */}
      <mesh
        geometry={geos.head}
        material={mats.metal}
        position={[0, headY, 0]}
      />

      {/* Nock */}
      <mesh
        geometry={geos.nock}
        material={mats.wood}
        position={[0, nockY, 0]}
      />

      {/* Fletching vanes */}
      {vanes.map((v) => (
        <mesh
          key={v.key}
          geometry={geos.vane}
          material={mats.feather}
          position={v.position}
          rotation={v.rotation}
        />
      ))}
    </group>
  );
}
