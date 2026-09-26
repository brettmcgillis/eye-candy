import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { createTubeGeometry } from '@modules/gpuTubes';

import { TANGLE_KEYS, computeLayout } from '../utils/layout';
import {
  createLookUniforms,
  createSphereMaterial,
  createWireMaterial,
  syncLookUniforms,
} from '../utils/materials';
import createTangle from '../utils/tangle/createTangle';

const RADIAL_SEGMENTS = 6;

function createSphereGeometry(count) {
  const sphere = new THREE.SphereGeometry(1, 48, 32);
  const geometry = new THREE.InstancedBufferGeometry().copy(sphere);
  sphere.dispose();
  geometry.instanceCount = count;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
  return geometry;
}

function Tangle({ config }) {
  const configRef = useRef(config);
  configRef.current = config;
  const renderer = useThree((state) => state.gl);

  const tangleKey = TANGLE_KEYS.map((key) => config[key]).join('|');
  const tangle = useMemo(
    () => createTangle(configRef.current, computeLayout(configRef.current)),
    [tangleKey]
  );
  const look = useMemo(createLookUniforms, []);

  const tubularSegments = tangle.layout.pointsPerWire - 1;
  const wires = useMemo(
    () => ({
      geometry: createTubeGeometry({
        instanceCount: tangle.layout.wireCount,
        radialSegments: RADIAL_SEGMENTS,
        tubularSegments,
      }),
      material: createWireMaterial(tangle, look, tubularSegments),
    }),
    [look, tangle, tubularSegments]
  );
  const spheres = useMemo(
    () => ({
      geometry: createSphereGeometry(tangle.sphereCount),
      material: createSphereMaterial(tangle, look),
    }),
    [look, tangle]
  );

  useEffect(
    () => () => {
      [wires, spheres].forEach(({ geometry, material }) => {
        geometry.dispose();
        material.dispose();
      });
    },
    [spheres, wires]
  );

  useEffect(() => {
    tangle.sync(config);
    syncLookUniforms(look, config);
  }, [config, look, tangle]);

  useFrame((_, delta) => {
    tangle.step(renderer, configRef.current, delta);
  });

  return (
    <>
      <mesh
        castShadow
        frustumCulled={false}
        geometry={wires.geometry}
        material={wires.material}
        receiveShadow
      />
      <mesh
        castShadow
        frustumCulled={false}
        geometry={spheres.geometry}
        material={spheres.material}
        receiveShadow
      />
    </>
  );
}

export default memo(Tangle);
