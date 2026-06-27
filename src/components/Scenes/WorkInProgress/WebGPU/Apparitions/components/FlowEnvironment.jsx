import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Fn, positionWorld, texture, uv } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useMemo } from 'react';

import { useLoader } from '@react-three/fiber';

import { modelFile, textureFile } from '../../../../../../utils/appUtils';

const FLOW_ASSETS = {
  aoMap: textureFile('apparitions/concrete_0016_ao_1k.jpg'),
  box: modelFile('apparitions/boxSlightlySmooth.obj'),
  colorMap: textureFile('apparitions/concrete_0016_color_1k.jpg'),
  hdr: textureFile('apparitions/autumn_field_puresky_1k.hdr'),
  normalMap: textureFile('apparitions/concrete_0016_normal_opengl_1k.png'),
  roughnessMap: textureFile('apparitions/concrete_0016_roughness_1k.jpg'),
};

const FLOW_TEXTURES = [
  FLOW_ASSETS.normalMap,
  FLOW_ASSETS.aoMap,
  FLOW_ASSETS.colorMap,
  FLOW_ASSETS.roughnessMap,
];

useLoader.preload(HDRLoader, FLOW_ASSETS.hdr);
useLoader.preload(OBJLoader, FLOW_ASSETS.box);
useLoader.preload(THREE.TextureLoader, FLOW_TEXTURES);

function buildFlowBoxGeometry(objectRaw) {
  const geometry = BufferGeometryUtils.mergeVertices(
    objectRaw.children[0].geometry
  );
  const uvArray = geometry.attributes.uv.array;
  for (let i = 0; i < uvArray.length; i += 1) {
    uvArray[i] *= 10;
  }
  geometry.attributes.uv.needsUpdate = true;
  return geometry;
}

export default function FlowEnvironment() {
  const hdr = useLoader(HDRLoader, FLOW_ASSETS.hdr);
  const objectRaw = useLoader(OBJLoader, FLOW_ASSETS.box);
  const [normalMap, aoMap, map, roughnessMap] = useLoader(
    THREE.TextureLoader,
    FLOW_TEXTURES
  );

  const geometry = useMemo(() => buildFlowBoxGeometry(objectRaw), [objectRaw]);
  const maps = useMemo(() => {
    const loadedTextures = [normalMap, aoMap, map, roughnessMap];
    for (let i = 0; i < loadedTextures.length; i += 1) {
      const loadedTexture = loadedTextures[i];
      loadedTexture.wrapS = THREE.RepeatWrapping;
      loadedTexture.wrapT = THREE.RepeatWrapping;
    }

    hdr.mapping = THREE.EquirectangularReflectionMapping;

    return { aoMap, hdr, map, normalMap, roughnessMap };
  }, [aoMap, hdr, map, normalMap, roughnessMap]);

  const material = useMemo(() => {
    const nextMaterial = new THREE.MeshStandardNodeMaterial({
      roughness: 0.9,
      metalness: 0,
      normalScale: new THREE.Vector3(1, 1),
      normalMap: maps.normalMap,
      aoMap: maps.aoMap,
      map: maps.map,
      roughnessMap: maps.roughnessMap,
    });

    nextMaterial.aoNode = Fn(() => {
      return texture(maps.aoMap, uv()).mul(
        positionWorld.z.div(0.4).mul(0.95).oneMinus()
      );
    })();

    nextMaterial.colorNode = Fn(() => {
      return texture(maps.map, uv()).mul(
        positionWorld.z.div(0.4).mul(0.5).oneMinus().mul(0.7)
      );
    })();

    return nextMaterial;
  }, [maps]);

  return (
    <>
      <primitive object={maps.hdr} attach="background" />
      <primitive object={maps.hdr} attach="environment" />
      <ambientLight intensity={0.1} />
      <spotLight
        position={[0, 1.2, -0.8]}
        intensity={5}
        distance={15}
        angle={Math.PI * 0.18}
        penumbra={1}
        decay={0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.005}
        shadow-camera-near={0.5}
        shadow-camera-far={5}
      />
      <object3D>
        <mesh
          geometry={geometry}
          material={material}
          rotation={[0, Math.PI, 0]}
          position={[0, -0.05, 0.22]}
          castShadow
          receiveShadow
        />
      </object3D>
    </>
  );
}
