import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  HEADLIGHT_BEAMS,
  SIREN_BEAMS,
  alarmLevel,
  sirenDirection,
} from '../utils/beams';
import { BRAKE_LIGHTS, HEADLIGHTS } from '../utils/cruiser';
import createFlare from '../utils/flare';

const BULB = new THREE.SphereGeometry(1, 12, 8);
const DEG = Math.PI / 180;
const toEye = new THREE.Vector3();
const dir = new THREE.Vector3();

// An unlit, untonemapped bulb material, recoloured by its owner.
function useBulb() {
  return useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
}

function useFlares(count) {
  const flares = useMemo(
    () => Array.from({ length: count }, createFlare),
    [count]
  );
  useEffect(() => () => flares.forEach((f) => f.dispose()), [flares]);
  return flares;
}

// How squarely a lamp looks down the lens: a rotating reflector winks as
// it sweeps past the camera.
const facing = (beamDir, from, camera, power) => {
  toEye.copy(camera.position).sub(from).normalize();
  return Math.max(0, beamDir.dot(toEye)) ** power;
};

// Each beacon in the light bar spins a red and a blue beam back to back;
// the second beacon turns the other way, a quarter turn out of phase.
function Sirens({ config }) {
  const beams = useMemo(
    () =>
      SIREN_BEAMS.map((beam) => ({
        ...beam,
        origin: new THREE.Vector3(...beam.at),
        target: new THREE.Object3D(),
      })),
    []
  );
  const bulbs = useRef([]);
  const materials = [useBulb(), useBulb(), useBulb(), useBulb()];
  const flares = useFlares(beams.length);

  useFrame(({ camera, clock }) => {
    beams.forEach((beam, i) => {
      sirenDirection(beam, clock.elapsedTime, config.sirenSpeed, dir);
      const [x, y, z] = beam.at;
      beam.target.position.set(x + dir.x * 3, y + dir.y * 3, z + dir.z * 3);
      beam.target.updateMatrixWorld();
      bulbs.current[i]?.position.set(x + dir.x * 0.05, y, z + dir.z * 0.05);
      materials[i].color
        .set(config[beam.colorKey])
        .multiplyScalar(config.sirenGlow);
      const wink = facing(dir, beam.origin, camera, 12);
      const flare = flares[i];
      flare.sprite.position.set(x + dir.x * 0.1, y, z + dir.z * 0.1);
      flare.sprite.scale.setScalar(config.sirenFlareSize * (0.35 + wink));
      flare.uniforms.color.value.set(config[beam.colorKey]);
      flare.uniforms.strength.value =
        config.sirenFlare * (0.08 + wink * wink * 1.5);
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
      <primitive object={flares[i].sprite} />
    </group>
  ));
}

// The car alarm: all four headlamps flash together, each side throwing a
// beam ahead that flashes with them.
function Headlights({ config }) {
  const lights = useRef([]);
  const beams = useRef([]);
  const material = useBulb();
  const flares = useFlares(HEADLIGHTS.length);
  const targets = useMemo(
    () =>
      HEADLIGHT_BEAMS.map(({ at, dir: d }) => {
        const target = new THREE.Object3D();
        target.position.copy(at).addScaledVector(d, 4);
        target.updateMatrixWorld();
        return target;
      }),
    []
  );
  const lamps = useMemo(
    () => HEADLIGHTS.map((p) => new THREE.Vector3(...p)),
    []
  );

  useFrame(({ camera, clock }) => {
    const on = alarmLevel(clock.elapsedTime, config.headlightRate);
    for (let i = 0; i < HEADLIGHTS.length; i += 1) {
      const light = lights.current[i];
      if (light) light.intensity = config.headlightIntensity * on;
    }
    for (let i = 0; i < HEADLIGHT_BEAMS.length; i += 1) {
      const beam = beams.current[i];
      if (beam) beam.intensity = config.headlightBeam * on;
    }
    material.color
      .set(config.headlightColor)
      .multiplyScalar(config.headlightGlow * on);
    for (let i = 0; i < flares.length; i += 1) {
      const { sprite, uniforms } = flares[i];
      const face = facing(
        HEADLIGHT_BEAMS[i < 2 ? 0 : 1].dir,
        lamps[i],
        camera,
        3
      );
      sprite.position.copy(lamps[i]);
      sprite.position.x += 0.04;
      sprite.scale.setScalar(config.headlightFlareSize * (0.5 + face));
      uniforms.color.value.set(config.headlightColor);
      uniforms.strength.value = config.headlightFlare * on * (0.15 + face);
    }
  });

  return (
    <>
      {HEADLIGHTS.map((at, i) => (
        <group key={at.join()} position={at}>
          <pointLight
            ref={(light) => {
              lights.current[i] = light;
            }}
            color={config.headlightColor}
            decay={2}
            distance={config.headlightDistance}
          />
          <mesh
            geometry={BULB}
            material={material}
            scale={[0.01, 0.045, 0.06]}
          />
        </group>
      ))}
      {HEADLIGHT_BEAMS.map(({ at }, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <group key={i}>
          <primitive object={targets[i]} />
          <spotLight
            ref={(light) => {
              beams.current[i] = light;
            }}
            angle={config.headlightAngle * DEG}
            color={config.headlightColor}
            decay={2}
            distance={config.headlightRange}
            penumbra={0.5}
            position={at}
            target={targets[i]}
          />
        </group>
      ))}
      {flares.map((flare, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <primitive key={i} object={flare.sprite} />
      ))}
    </>
  );
}

// Parking brake on: both tail lamps lit steady.
function BrakeLights({ config }) {
  const material = useBulb();
  const flares = useFlares(BRAKE_LIGHTS.length);
  material.color.set(config.brakeColor).multiplyScalar(config.brakeGlow);
  for (let i = 0; i < flares.length; i += 1) {
    const { sprite, uniforms } = flares[i];
    const [x, y, z] = BRAKE_LIGHTS[i];
    sprite.position.set(x - 0.04, y, z);
    sprite.scale.setScalar(config.brakeFlareSize);
    uniforms.color.value.set(config.brakeColor);
    uniforms.strength.value = config.brakeFlare;
  }

  return BRAKE_LIGHTS.map((at, i) => (
    <group key={at.join()}>
      <group position={at}>
        <pointLight
          color={config.brakeColor}
          decay={2}
          distance={config.brakeDistance}
          intensity={config.brakeIntensity}
        />
        <mesh geometry={BULB} material={material} scale={[0.01, 0.04, 0.09]} />
      </group>
      <primitive object={flares[i].sprite} />
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
