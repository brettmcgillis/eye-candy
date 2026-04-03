import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import FlameMaterial from '../../materials/webGL/flameMaterial';

const DEFAULT_MOTION = {
  baseSpeed: 1.15,
  minSpeed: 0.28,
  slowFreq: 0.7,
  slowAmp: 0.55,
  fastFreq: 2.6,
  fastAmp: 0.25,
  microFreq: 5.7,
  microAmp: 0.08,
  swayX: 0.015,
  swayZ: 0.014,
  pulseFreq: 3.4,
  pulseAmp: 0.04,
  scaleX: 1,
  scaleY: 1,
};

export default function Flame({
  position = [0, 0, 0],
  inverted = false,
  motion,
}) {
  const flameMotion = { ...DEFAULT_MOTION, ...motion };
  const groupRef = useRef();
  const frontRef = useRef();
  const backRef = useRef();
  const phaseRef = useRef(0);
  const flameGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.5, 32, 32);
    geo.translate(0, 0.5, 0);
    return geo;
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const speed =
      flameMotion.baseSpeed +
      Math.sin(t * flameMotion.slowFreq) * flameMotion.slowAmp +
      Math.sin(t * flameMotion.fastFreq + 1.4) * flameMotion.fastAmp +
      Math.sin(t * flameMotion.microFreq) * flameMotion.microAmp;

    phaseRef.current += delta * Math.max(flameMotion.minSpeed, speed);

    if (frontRef.current) frontRef.current.time = phaseRef.current;
    if (backRef.current) backRef.current.time = phaseRef.current;

    if (groupRef.current) {
      const swayX = Math.sin(t * 3.2) * flameMotion.swayX;
      const swayZ = Math.cos(t * 2.4 + 0.8) * flameMotion.swayZ;
      groupRef.current.rotation.x = (inverted ? Math.PI : 0) + swayX;
      groupRef.current.rotation.z = swayZ;

      const pulse =
        1 +
        Math.sin(phaseRef.current * flameMotion.pulseFreq) *
          flameMotion.pulseAmp;
      groupRef.current.scale.set(
        flameMotion.scaleX,
        pulse * flameMotion.scaleY,
        flameMotion.scaleX
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <mesh rotation-y={THREE.MathUtils.degToRad(-45)}>
        <primitive object={flameGeometry} attach="geometry" />
        <FlameMaterial ref={frontRef} side={THREE.FrontSide} />
      </mesh>
      <mesh rotation-y={THREE.MathUtils.degToRad(-45)}>
        <primitive object={flameGeometry} attach="geometry" />
        <FlameMaterial ref={backRef} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
