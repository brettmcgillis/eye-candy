import * as THREE from 'three/webgpu';

import React, { useMemo } from 'react';

const POLE_BOTTOM_Y = -0.8;
const POLE_TOP_Y = 0.95;
const POLE_HEIGHT = POLE_TOP_Y - POLE_BOTTOM_Y;
const POLE_CENTER_Y = (POLE_TOP_Y + POLE_BOTTOM_Y) / 2;
const FINIAL_RADIUS = 0.025;
const FINIAL_Y = POLE_TOP_Y; // center at pole top so it overlaps
const POLE_RADIUS_TOP = 0.012;
const POLE_RADIUS_BOTTOM = 0.016;

// Flag attachment ring dimensions
const RING_MAJOR_RADIUS = 0.022; // encircles the pole
const RING_TUBE_RADIUS = 0.003;

// Must match cloth geometry in Flag.jsx
const FLAG_TOP_Y = 0.9;
const CLOTH_HEIGHT = 0.7;
const NUM_RINGS = 3;

export default function FlagPole({
  poleColor = '#2a2a2a',
  poleMetalness = 0.6,
  poleRoughness = 0.4,
  finialColor = '#3a3a3a',
  finialMetalness = 0.7,
  finialRoughness = 0.3,
  ringColor = '#444444',
  ringMetalness = 0.8,
  ringRoughness = 0.3,
}) {
  const poleGeo = useMemo(
    () =>
      new THREE.CylinderGeometry(
        POLE_RADIUS_TOP,
        POLE_RADIUS_BOTTOM,
        POLE_HEIGHT,
        12
      ),
    []
  );
  const finialGeo = useMemo(
    () => new THREE.SphereGeometry(FINIAL_RADIUS, 16, 16),
    []
  );
  const ringGeo = useMemo(
    () => new THREE.TorusGeometry(RING_MAJOR_RADIUS, RING_TUBE_RADIUS, 8, 16),
    []
  );
  const poleMat = useMemo(() => new THREE.MeshStandardNodeMaterial(), []);
  poleMat.color.set(poleColor);
  poleMat.metalness = poleMetalness;
  poleMat.roughness = poleRoughness;

  const finialMat = useMemo(() => new THREE.MeshStandardNodeMaterial(), []);
  finialMat.color.set(finialColor);
  finialMat.metalness = finialMetalness;
  finialMat.roughness = finialRoughness;

  const ringMat = useMemo(() => new THREE.MeshStandardNodeMaterial(), []);
  ringMat.color.set(ringColor);
  ringMat.metalness = ringMetalness;
  ringMat.roughness = ringRoughness;

  // Place rings evenly along the pinned edge: top, middle, bottom
  const ringPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < NUM_RINGS; i += 1) {
      positions.push(FLAG_TOP_Y - (i / (NUM_RINGS - 1)) * CLOTH_HEIGHT);
    }
    return positions;
  }, []);

  return (
    <group>
      <mesh
        position={[0, POLE_CENTER_Y, 0]}
        geometry={poleGeo}
        material={poleMat}
        castShadow
        receiveShadow
      />
      <mesh
        position={[0, FINIAL_Y, 0]}
        geometry={finialGeo}
        material={finialMat}
        castShadow
        receiveShadow
      />
      {ringPositions.map((ry) => (
        <mesh
          key={ry}
          position={[0, ry, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          geometry={ringGeo}
          material={ringMat}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}
