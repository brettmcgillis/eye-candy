import * as THREE from 'three/webgpu';

import React, { useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { ENVIRONMENTS } from '../presets/presets';
import FlowEnvironment from './FlowEnvironment';

export default function Environment({ controls }) {
  const { gl, scene } = useThree();
  const rendererSnapshotRef = useRef(null);
  const useFlowEnvironment = controls.environmentMode === ENVIRONMENTS.flow;

  useEffect(() => {
    if (!rendererSnapshotRef.current) {
      rendererSnapshotRef.current = {
        shadowMapEnabled: gl.shadowMap.enabled,
        shadowMapType: gl.shadowMap.type,
        toneMappingExposure: gl.toneMappingExposure,
      };
    }

    if (useFlowEnvironment) {
      scene.environmentIntensity = controls.flowEnvironmentIntensity;
      scene.backgroundRotation = new THREE.Euler(0, 2.15, 0);
      scene.environmentRotation = new THREE.Euler(0, -2.15, 0);
      gl.toneMappingExposure = 0.66;
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      return undefined;
    }

    scene.background = new THREE.Color(controls.outsideBackgroundColor);
    scene.environment = null;
    scene.environmentIntensity = 1;
    scene.backgroundRotation = new THREE.Euler(0, 0, 0);
    scene.environmentRotation = new THREE.Euler(0, 0, 0);
    gl.toneMappingExposure = 1;

    return undefined;
  }, [
    controls.flowEnvironmentIntensity,
    controls.outsideBackgroundColor,
    gl,
    scene,
    useFlowEnvironment,
  ]);

  useEffect(() => {
    return () => {
      const rendererSnapshot = rendererSnapshotRef.current;
      if (!rendererSnapshot) return;

      gl.shadowMap.enabled = rendererSnapshot.shadowMapEnabled;
      gl.shadowMap.type = rendererSnapshot.shadowMapType;
      gl.toneMappingExposure = rendererSnapshot.toneMappingExposure;
    };
  }, [gl]);

  return (
    <>
      {useFlowEnvironment && <FlowEnvironment />}
      {!useFlowEnvironment && (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight position={[0.8, 1.5, -0.4]} intensity={2.4} />
        </>
      )}
    </>
  );
}
