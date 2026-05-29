import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  BlackHoleSimulation,
  createBlackHoleGeometry,
} from '../utils/blackHoleSimulation';

export default function BlackHoleField({ config, enabled = true }) {
  const { camera, gl, size } = useThree();
  const simulation = useMemo(() => new BlackHoleSimulation(config, size), []);
  const geometry = useMemo(() => createBlackHoleGeometry(), []);
  const material = useMemo(() => simulation.createMaterial(), [simulation]);
  const isBackgroundField =
    enabled && config.presentationMode === 'backgroundField';

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
  }, [gl]);

  useEffect(() => {
    material.depthTest = false;
    material.depthWrite = false;
  }, [material]);

  useEffect(() => {
    simulation.updateUniforms(config);
  }, [config, simulation]);

  useEffect(() => {
    simulation.onResize(size.width, size.height);
  }, [simulation, size.height, size.width]);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry.dispose();
    };
  }, [geometry, material]);

  useFrame((_, deltaTime) => {
    simulation.update(deltaTime, camera);
  });

  if (!isBackgroundField) {
    return null;
  }

  return (
    <mesh
      frustumCulled={false}
      geometry={geometry}
      material={material}
      renderOrder={-1000}
    />
  );
}
