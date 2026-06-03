import { SkyMesh } from 'three/examples/jsm/objects/SkyMesh.js';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const MILKYWAY_PATH = '/textures/blackhole/legacy-milkyway.jpg';
const SKYBOX_RADIUS = 10000;
const DEG2RAD = Math.PI / 180;

export const SKY_MODE_NIGHT = 'night';
export const SKY_MODE_DAY = 'day';

useTexture.preload(MILKYWAY_PATH);

function setSkyUniformValue(sky, key, value) {
  const uniformNode = sky?.[key];
  if (!uniformNode || uniformNode.value == null) return;
  uniformNode.value = value;
}

const SpaceSkybox = memo(function SpaceSkybox({
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  rotationEnabled = false,
  rotationSpeed = 0,
  skyMode = SKY_MODE_NIGHT,
  // Day sky uniforms
  skyTurbidity = 8,
  skyRayleigh = 3,
  skyMieCoefficient = 0.005,
  skyMieDirectionalG = 0.8,
  skyElevation = 8,
  skyAzimuth = 180,
  skyShowSunDisc = true,
  skyCloudCoverage = 0.4,
  skyCloudDensity = 0.4,
  skyCloudElevation = 0.5,
}) {
  const texture = useTexture(MILKYWAY_PATH);
  const meshRef = useRef();

  const geometry = useMemo(
    () => new THREE.SphereGeometry(SKYBOX_RADIUS, 64, 32),
    []
  );

  const sky = useMemo(() => {
    const s = new SkyMesh();
    s.scale.setScalar(SKYBOX_RADIUS);
    return s;
  }, []);

  // Keep SkyMesh uniforms in sync with props
  useEffect(() => {
    setSkyUniformValue(sky, 'turbidity', skyTurbidity);
    setSkyUniformValue(sky, 'rayleigh', skyRayleigh);
    setSkyUniformValue(sky, 'mieCoefficient', skyMieCoefficient);
    setSkyUniformValue(sky, 'mieDirectionalG', skyMieDirectionalG);
    setSkyUniformValue(sky, 'cloudCoverage', skyCloudCoverage);
    setSkyUniformValue(sky, 'cloudDensity', skyCloudDensity);
    setSkyUniformValue(sky, 'cloudElevation', skyCloudElevation);
    setSkyUniformValue(sky, 'showSunDisc', skyShowSunDisc ? 1 : 0);

    const phi = THREE.MathUtils.degToRad(90 - skyElevation);
    const theta = THREE.MathUtils.degToRad(skyAzimuth);
    sky.sunPosition.value.setFromSphericalCoords(1, phi, theta);
  }, [
    sky,
    skyTurbidity,
    skyRayleigh,
    skyMieCoefficient,
    skyMieDirectionalG,
    skyElevation,
    skyAzimuth,
    skyShowSunDisc,
    skyCloudCoverage,
    skyCloudDensity,
    skyCloudElevation,
  ]);

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => {
    return () => sky.geometry.dispose();
  }, [sky]);

  useFrame(({ clock }) => {
    if (!rotationEnabled || !meshRef.current) return;
    meshRef.current.rotation.y =
      (rotationY + clock.getElapsedTime() * rotationSpeed) * DEG2RAD;
  });

  if (skyMode === SKY_MODE_DAY) {
    return <primitive object={sky} renderOrder={-1} />;
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      renderOrder={-1}
      rotation={[rotationX * DEG2RAD, rotationY * DEG2RAD, rotationZ * DEG2RAD]}
    >
      <meshBasicMaterial
        depthWrite={false}
        map={texture}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
});

export default SpaceSkybox;
