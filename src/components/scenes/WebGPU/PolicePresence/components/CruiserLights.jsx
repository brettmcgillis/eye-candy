import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { BEACONS, BRAKE_LIGHTS, HEADLIGHTS } from '../utils/cruiser';

const BULB = new THREE.SphereGeometry(1, 12, 8);
const DEG = Math.PI / 180;

// An unlit, untonemapped bulb material, recoloured by its owner.
function useBulb() {
  return useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
}

// Each beacon in the light bar spins a red and a blue beam back to back;
// the second beacon turns the other way, a quarter turn out of phase.
function Sirens({ config }) {
  const beams = useMemo(
    () =>
      BEACONS.flatMap((at, beacon) =>
        ['sirenRed', 'sirenBlue'].map((colorKey, side) => ({
          at,
          colorKey,
          phase: beacon * (Math.PI / 2) + side * Math.PI,
          spin: beacon === 0 ? 1 : -1,
          target: new THREE.Object3D(),
        }))
      ),
    []
  );
  const bulbs = useRef([]);
  const materials = [useBulb(), useBulb(), useBulb(), useBulb()];

  useFrame(({ clock }) => {
    const turn = clock.elapsedTime * config.sirenSpeed * Math.PI * 2;
    beams.forEach((beam, i) => {
      const angle = beam.spin * turn + beam.phase;
      const dx = Math.cos(angle);
      const dz = Math.sin(angle);
      const [x, y, z] = beam.at;
      beam.target.position.set(x + dx * 3, y - 0.5, z + dz * 3);
      beam.target.updateMatrixWorld();
      bulbs.current[i]?.position.set(x + dx * 0.05, y, z + dz * 0.05);
      materials[i].color
        .set(config[beam.colorKey])
        .multiplyScalar(config.sirenGlow);
    });
  });

  return beams.map((beam, i) => (
    <group key={`${beam.colorKey}-${beam.phase}`}>
      <primitive object={beam.target} />
      <spotLight
        angle={config.sirenAngle * DEG}
        color={config[beam.colorKey]}
        decay={2}
        distance={config.sirenDistance}
        intensity={config.sirenIntensity}
        penumbra={0.6}
        position={beam.at}
        target={beam.target}
      />
      <mesh
        ref={(mesh) => {
          bulbs.current[i] = mesh;
        }}
        geometry={BULB}
        material={materials[i]}
        scale={0.03}
      />
    </group>
  ));
}

// The car alarm: all four headlamps flash together.
function Headlights({ config }) {
  const lights = useRef([]);
  const material = useBulb();

  useFrame(({ clock }) => {
    const on = (clock.elapsedTime * config.headlightRate) % 1 < 0.55 ? 1 : 0;
    for (let i = 0; i < lights.current.length; i += 1) {
      if (lights.current[i]) {
        lights.current[i].intensity = config.headlightIntensity * on;
      }
    }
    material.color
      .set(config.headlightColor)
      .multiplyScalar(config.headlightGlow * on);
  });

  return HEADLIGHTS.map((at, i) => (
    <group key={at.join()} position={at}>
      <pointLight
        ref={(light) => {
          lights.current[i] = light;
        }}
        color={config.headlightColor}
        decay={2}
        distance={config.headlightDistance}
      />
      <mesh geometry={BULB} material={material} scale={[0.01, 0.045, 0.06]} />
    </group>
  ));
}

// Parking brake on: both tail lamps lit steady.
function BrakeLights({ config }) {
  const material = useBulb();
  material.color.set(config.brakeColor).multiplyScalar(config.brakeGlow);

  return BRAKE_LIGHTS.map((at) => (
    <group key={at.join()} position={at}>
      <pointLight
        color={config.brakeColor}
        decay={2}
        distance={config.brakeDistance}
        intensity={config.brakeIntensity}
      />
      <mesh geometry={BULB} material={material} scale={[0.01, 0.04, 0.09]} />
    </group>
  ));
}

function CruiserLights({ config }) {
  return (
    <>
      {config.sirenOn ? <Sirens config={config} /> : null}
      {config.headlightOn ? <Headlights config={config} /> : null}
      {config.brakeOn ? <BrakeLights config={config} /> : null}
    </>
  );
}

export default memo(CruiserLights);
