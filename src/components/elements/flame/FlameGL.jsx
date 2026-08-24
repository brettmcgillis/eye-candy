import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import FlameMaterial from '@materials/webGL/flameMaterial';

import {
  FLAME_DEFAULT_MOTION,
  FLAME_Y_ROTATION,
  createFlameGeometry,
} from './flameShared';

export default function FlameGL({
  position = [0, 0, 0],
  inverted = false,
  motion,
  phaseOffset = 0,
}) {
  const flameMotion = { ...FLAME_DEFAULT_MOTION, ...motion };
  const groupRef = useRef();
  const frontRef = useRef();
  const backRef = useRef();
  const phaseRef = useRef(0);
  const flameGeometry = useMemo(() => createFlameGeometry(THREE), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() + phaseOffset;
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
      <mesh rotation-y={FLAME_Y_ROTATION}>
        <primitive object={flameGeometry} attach="geometry" />
        <FlameMaterial ref={frontRef} side={THREE.FrontSide} />
      </mesh>
      <mesh rotation-y={FLAME_Y_ROTATION}>
        <primitive object={flameGeometry} attach="geometry" />
        <FlameMaterial ref={backRef} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
