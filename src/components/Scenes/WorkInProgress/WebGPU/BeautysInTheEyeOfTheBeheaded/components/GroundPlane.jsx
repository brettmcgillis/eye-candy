import * as THREE from 'three';

import React, { memo, useEffect, useRef } from 'react';

import { useLoader } from '@react-three/fiber';

import { textureFile } from '../../../../../../utils/appUtils';

const DIFFUSE_MAP_URL = textureFile('wood_table_diff_1k.jpg');
const DISPLACEMENT_MAP_URL = textureFile('wood_table_disp_1k.png');

function GroundPlaneInner({
  bumpScale = 0.035,
  extraLightLayer = null,
  repeat = 1.5,
  size = 14,
}) {
  const [diffuseMap, displacementMap] = useLoader(THREE.TextureLoader, [
    DIFFUSE_MAP_URL,
    DISPLACEMENT_MAP_URL,
  ]);
  const meshRef = useRef(null);

  useEffect(() => {
    diffuseMap.wrapS = THREE.RepeatWrapping;
    diffuseMap.wrapT = THREE.RepeatWrapping;
    diffuseMap.repeat.set(repeat, repeat);
    diffuseMap.colorSpace = THREE.SRGBColorSpace;
    diffuseMap.needsUpdate = true;

    displacementMap.wrapS = THREE.RepeatWrapping;
    displacementMap.wrapT = THREE.RepeatWrapping;
    displacementMap.repeat.set(repeat, repeat);
    displacementMap.needsUpdate = true;
  }, [diffuseMap, displacementMap, repeat]);

  useEffect(() => {
    if (!meshRef.current || !Number.isInteger(extraLightLayer)) {
      return;
    }

    meshRef.current.layers.enable(extraLightLayer);
  }, [extraLightLayer]);

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        bumpMap={displacementMap}
        bumpScale={bumpScale}
        color="#d8c7b0"
        map={diffuseMap}
        metalness={0.04}
        roughness={0.94}
      />
    </mesh>
  );
}

useLoader.preload(THREE.TextureLoader, DIFFUSE_MAP_URL);
useLoader.preload(THREE.TextureLoader, DISPLACEMENT_MAP_URL);

export default memo(GroundPlaneInner);
