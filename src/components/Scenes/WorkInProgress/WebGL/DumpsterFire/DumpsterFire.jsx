import { useControls } from 'leva';
import * as THREE from 'three';

import React, { useMemo } from 'react';

import { Environment, PerspectiveCamera } from '@react-three/drei';

import { radians } from '../../../../../utils/math';
import Dumpster from '../../../../elements/dumpster/Dumpster';
import Smoke2D from '../../../../elements/smoke/Smoke2D';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import VolumetricSmokeParticles from '../../../../elements/smoke/VolumetricSmokeParticles';
import SplineLine from '../../../../elements/spline/SplineLine';
import VolumetricFire from '../../../../elements/volumetricFire/VolumetricFire';
import CameraRig from '../../../../rigging/CameraRig';

// ---------------------------------------------------------------------------
// Smoke spline — open curve from dumpster top flowing up and to the right,
// matching the composition of the reference painting. More control points
// keep particles hugging the intended plume shape.
// ---------------------------------------------------------------------------
const SMOKE_SPLINE = [
  new THREE.Vector3(-1.0, 1.4, 0),
  new THREE.Vector3(-0.6, 1.9, 0.05),
  new THREE.Vector3(-0.1, 2.4, 0.1),
  new THREE.Vector3(0.5, 2.9, 0.0),
  new THREE.Vector3(1.2, 3.3, -0.08),
  new THREE.Vector3(2.0, 3.8, 0.1),
  new THREE.Vector3(3.0, 4.3, -0.05),
  new THREE.Vector3(4.2, 4.8, 0.15),
  new THREE.Vector3(5.5, 5.3, -0.1),
  new THREE.Vector3(7.0, 5.8, 0.0),
];

// Volumetric layer — soft, wide density that fills the plume body.
const VOL_SMOKE_CONFIG = {
  volParticleCount: 20000,
  volSize: 45,
  volColor: '#6a6a6a',
  volOpacity: 0.032,
  volBlendMode: 'Normal',
  volSpringK: 5.0,
  volDamping: 0.14,
  volTurbulence: 90,
  volTurbulenceSpeed: 0.18,
  volSpread: 40,
  volMaxDrift: 350,
  fadeRate: 4,
  closed: false,
  tension: 0.5,
  flowSpeed: 0.03,
};

// Textured particle layer — puff-billowed shapes that give visible cloud
// structure within the plume (matches the painting's internal detail).
const PARTICLE_SMOKE_CONFIG = {
  particleCount: 8000,
  particleSize: 55,
  particleColor: '#555555',
  opacity: 0.04,
  growth: 2.5,
  fadeExponent: 1.0,
  blendMode: 'Normal',
  closed: false,
  tension: 0.5,
  springK: 6.0,
  flowSpeed: 0.03,
  damping: 0.15,
  turbulence: 70,
  turbulenceSpeed: 0.22,
  spawnSpread: 30,
  maxDrift: 300,
  buoyancy: 8,
  rotSpeed: 0.15,
  fadeRate: 4,
};

export default function DumpsterFire() {
  const { showSplines } = useControls(
    'Dumpster Fire',
    {
      showSplines: { label: 'Show Splines', value: false },
    },
    { collapsed: true }
  );

  const smokePoints = useMemo(() => SMOKE_SPLINE.map((v) => v.clone()), []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[1, 3, 14]} fov={50} />
      <CameraRig />

      {/* White background */}
      <color attach="background" args={['#e8e8e8']} />
      <fog attach="fog" args={['#e8e8e8', 16, 35]} />

      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 3]} intensity={1.0} />

      {/* Dumpster — both lids open */}
      <Dumpster
        position={[-2, -1, 0]}
        rightLidRotation={-radians(521)}
        leftLidRotation={-radians(521)}
      />

      {/* Volumetric fire emerging from the dumpster opening */}
      <VolumetricFire
        position={[-2, 0.5, 0]}
        width={0.9}
        height={1.2}
        depth={0.5}
        animated
        animSpeed={0.5}
        brightness={1.6}
        magnitude={1.4}
      />

      {/* Wispy 2D smoke at the fire source */}
      <Smoke2D
        position={[-1.6, 1.4, 0]}
        smoke={{ opacity: 0.3, height: 2.5, color: '#888', width: 0.35 }}
      />
      <Smoke2D
        position={[-2.3, 1.4, 0.1]}
        smoke={{ opacity: 0.25, height: 2.0, color: '#999', width: 0.3 }}
      />

      {/* Main smoke plume — two layers for depth and structure */}
      <VolumetricSmokeParticles
        points={smokePoints}
        config={VOL_SMOKE_CONFIG}
      />
      <SmokeParticles points={smokePoints} config={PARTICLE_SMOKE_CONFIG} />

      {/* Debug spline visualization */}
      <SplineLine
        points={smokePoints}
        tension={0.5}
        closed={false}
        color="#ff4444"
        visible={showSplines}
        arcSegments={200}
      />

      <Environment preset="city" />
    </>
  );
}
