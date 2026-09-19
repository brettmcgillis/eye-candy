import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { mix, smoothstep, uniform, uv } from 'three/tsl';
import * as THREE from 'three/webgpu';

import PersianRug from '@elements/PersianRug/PersianRug';
import useRenderScale from '@hooks/useRenderScale';

import buildMaterial from '../utils/material';
import { createUniforms, syncUniforms } from '../utils/uniforms';

function RugRoom({ config }) {
  const configRef = useRef(config);
  configRef.current = config;
  const timeRef = useRef(0);
  const { pattern } = config;

  useRenderScale(config.renderScale);

  const uniforms = useMemo(createUniforms, []);
  const material = useMemo(
    () => buildMaterial(uniforms, { model: true, pattern }),
    [pattern, uniforms]
  );
  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#6b5545'),
        roughness: 1,
      }),
    []
  );
  const wallMaterial = useMemo(() => {
    const nextMaterial = new THREE.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      toneMapped: false,
    });
    const height = smoothstep(0.05, 0.82, uv().y);
    nextMaterial.colorNode = mix(
      uniform(new THREE.Color('#6b5545')),
      uniform(new THREE.Color('#211b1a')),
      height
    );
    return nextMaterial;
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(
    () => () => {
      floorMaterial.dispose();
      wallMaterial.dispose();
    },
    [floorMaterial, wallMaterial]
  );

  useFrame((_, delta) => {
    const { seed, timeScale } = configRef.current;
    timeRef.current += delta * timeScale;
    syncUniforms(uniforms, configRef.current, timeRef.current + seed);
  });

  return (
    <group>
      <ambientLight intensity={0.3} />
      <directionalLight
        castShadow
        intensity={2.4}
        position={[3, 6, 4]}
        shadow-bias={-0.002}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <mesh receiveShadow rotation-x={-Math.PI / 2} scale={8}>
        <circleGeometry args={[1, 96]} />
        <primitive attach="material" object={floorMaterial} />
      </mesh>
      <mesh position-y={3}>
        <cylinderGeometry args={[8, 8, 6, 96, 1, true]} />
        <primitive attach="material" object={wallMaterial} />
      </mesh>
      <PersianRug material={material} position={[0, 0.01, 0]} />
    </group>
  );
}

export default RugRoom;
