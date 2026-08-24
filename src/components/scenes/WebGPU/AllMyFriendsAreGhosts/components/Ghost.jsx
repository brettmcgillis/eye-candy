import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import ClothMesh from '@elements/WebGPU/cloth/ClothMesh';
import { pinRing } from '@elements/WebGPU/cloth/pinHelpers';

// Ghost cloth parameters (derived from ghostCloth preset)
const SEG_X = 28;
const SEG_Y = 28;
const SPHERE_BASE_Y = -0.15;
const SPHERE_RADIUS = 0.15;

const CUTOUTS = [
  { u: 0.43, v: 0.6, radius: 0.06 },
  { u: 0.57, v: 0.6, radius: 0.06 },
];

// Stable pins computed once (same for every ghost instance)
const PINS = pinRing(
  Math.round(SEG_X / 2),
  Math.round(SEG_Y / 2),
  2,
  SEG_X,
  SEG_Y
);

function Ghost({
  color = '#f5f0e8',
  eyeColor = '#88ccff',
  eyeIntensity = 3,
  wind = 0.3,
  windDirX = 1,
  windDirZ = 0,
  stiffness = 0.15,
  dampening = 0.99,
  cursorCollider = true,
  cursorRadius = 0.12,
  bobYArray = null,
  velArrays = null,
  ghostIndex = 0,
}) {
  const clothRef = useRef();
  const lightLeftRef = useRef();
  const lightRightRef = useRef();

  // Per-instance mutable Vector3 for the sphere collider position
  const spherePos = useMemo(() => new THREE.Vector3(0, SPHERE_BASE_Y, 0), []);

  const colliders = useMemo(
    () => [{ position: spherePos, radius: SPHERE_RADIUS }],
    [spherePos]
  );

  // Stable materialProps object — only changes when color changes
  const materialProps = useMemo(
    () => ({
      color,
      roughness: 0.8,
      metalness: 0,
      opacity: 1,
    }),
    [color]
  );

  // Update sphere collider + light positions each frame based on bobY
  // Combine base wind (from controls) with movement headwind
  useFrame(() => {
    const bobY = bobYArray ? bobYArray[ghostIndex] : 0;
    const y = SPHERE_BASE_Y + bobY;
    spherePos.y = y;

    if (lightLeftRef.current) lightLeftRef.current.position.y = y;
    if (lightRightRef.current) lightRightRef.current.position.y = y;

    // Write combined wind directly to sim uniforms (windManaged skips
    // ClothMesh’s own overwrite so these values reach the compute step).
    const sim = clothRef.current?.sim;
    if (sim) {
      // Base wind from controls
      const fx = wind * windDirX;
      let fz = wind * windDirZ;

      // Add headwind from movement velocity (local +Z)
      if (velArrays) {
        const vdx = velArrays.dx[ghostIndex];
        const vdz = velArrays.dz[ghostIndex];
        // speed is tiny (dt=0.01 derivative), scale up to meaningful wind
        fz += Math.sqrt(vdx * vdx + vdz * vdz) * 600;
      }

      const strength = Math.sqrt(fx * fx + fz * fz);
      sim.windU.value = strength;
      if (strength > 0.0001) {
        sim.windDirU.value.set(fx / strength, 0, fz / strength);
      }
    }
  });

  return (
    <group>
      <ClothMesh
        ref={clothRef}
        width={1.0}
        height={1.0}
        segmentsX={SEG_X}
        segmentsY={SEG_Y}
        pins={PINS}
        centered
        orientation="horizontal"
        shape="circle"
        gravity={0.00008}
        stepsPerSecond={360}
        maxVelocity={0.01}
        wind={wind}
        windDirX={windDirX}
        windDirZ={windDirZ}
        windManaged
        stiffness={stiffness}
        dampening={dampening}
        cursorCollider={cursorCollider}
        cursorRadius={cursorRadius}
        colliders={colliders}
        alphaSeed={42}
        alphaScale={4}
        edgeFade={0.15}
        holeAmount={0.2}
        tatterEdge={0}
        cutouts={CUTOUTS}
        materialProps={materialProps}
      />

      {/* Point lights for eye glow through cutout holes */}
      <pointLight
        ref={lightLeftRef}
        position={[-0.05, SPHERE_BASE_Y, 0]}
        color={eyeColor}
        intensity={eyeIntensity * 0.3}
        distance={0.5}
        decay={2}
      />
      <pointLight
        ref={lightRightRef}
        position={[0.05, SPHERE_BASE_Y, 0]}
        color={eyeColor}
        intensity={eyeIntensity * 0.3}
        distance={0.5}
        decay={2}
      />
    </group>
  );
}

export default memo(Ghost);
