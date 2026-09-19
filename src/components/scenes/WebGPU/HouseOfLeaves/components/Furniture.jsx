import React, { memo, useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import PersianRug from '@elements/PersianRug/PersianRug';
import RetroTv from '@elements/RetroTv/RetroTv';
import CRTShowWebGPU from '@materials/WebGPU/crt/crtShowMaterial';

// The room's contents, in the room's local frame: +X is the north wall, the
// room lies in -X, the sofa against the east wall (+Z) looking across at the
// television on the west wall (-Z). Blockout furniture — proportion and
// silhouette — until the modelled pieces are brought in; each piece is a
// contract (position, footprint) a GLTF can replace without touching the
// rest.
function Furniture({ config, zone }) {
  const { depth, width } = zone;
  const mid = -depth * 0.5;
  const east = width * 0.5;

  const materials = useMemo(
    () => ({
      fabric: new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#5a4a3a'),
        roughness: 0.95,
      }),
      cushion: new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#6d5a45'),
        roughness: 0.9,
      }),
      wood: new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#3b2a1c'),
        roughness: 0.6,
      }),
      shade: new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#e8d3a8'),
        emissive: new THREE.Color(config.lampColor),
        emissiveIntensity: config.lampIntensity * 0.02,
        roughness: 1,
        side: THREE.DoubleSide,
      }),
      night: new THREE.MeshBasicNodeMaterial({
        color: new THREE.Color('#0a1020'),
      }),
      frame: new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#d8d2c4'),
        roughness: 0.8,
      }),
    }),
    [config.lampColor, config.lampIntensity]
  );
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials]
  );

  return (
    <group>
      {/* Sofa against the east wall, facing the television. */}
      <group position={[mid, 0, east - 0.55]}>
        <mesh
          castShadow
          material={materials.fabric}
          position={[0, 0.22, 0]}
          receiveShadow
        >
          <boxGeometry args={[1.9, 0.44, 0.9]} />
        </mesh>
        <mesh
          castShadow
          material={materials.cushion}
          position={[0, 0.5, 0.05]}
          receiveShadow
        >
          <boxGeometry args={[1.8, 0.14, 0.75]} />
        </mesh>
        <mesh
          castShadow
          material={materials.fabric}
          position={[0, 0.6, 0.38]}
          receiveShadow
        >
          <boxGeometry args={[1.9, 0.5, 0.18]} />
        </mesh>
        <mesh
          castShadow
          material={materials.fabric}
          position={[-1.0, 0.45, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.2, 0.55, 0.9]} />
        </mesh>
        <mesh
          castShadow
          material={materials.fabric}
          position={[1.0, 0.45, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.2, 0.55, 0.9]} />
        </mesh>
      </group>
      {/* Side table and lamp, the room's practical light. */}
      <group position={[mid - 1.45, 0, east - 0.5]}>
        <mesh
          castShadow
          material={materials.wood}
          position={[0, 0.5, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.45, 0.04, 0.45]} />
        </mesh>
        <mesh castShadow material={materials.wood} position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        </mesh>
        <mesh material={materials.wood} position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.02, 0.05, 0.36, 10]} />
        </mesh>
        <mesh material={materials.shade} position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 0.3, 16, 1, true]} />
        </mesh>
        <pointLight
          castShadow
          color={config.lampColor}
          decay={2}
          distance={14}
          intensity={config.lampIntensity}
          position={[0, 1.02, 0]}
          shadow-bias={-0.002}
          shadow-mapSize-height={512}
          shadow-mapSize-width={512}
        />
      </group>
      {/* Coffee table between sofa and television. */}
      <group position={[mid, 0, east - 1.8]}>
        <mesh
          castShadow
          material={materials.wood}
          position={[0, 0.4, 0]}
          receiveShadow
        >
          <boxGeometry args={[1.1, 0.04, 0.55]} />
        </mesh>
        {[-0.5, 0.5].flatMap((x) =>
          [-0.22, 0.22].map((z) => (
            <mesh
              key={`${x}${z}`}
              material={materials.wood}
              position={[x, 0.19, z]}
            >
              <boxGeometry args={[0.05, 0.38, 0.05]} />
            </mesh>
          ))
        )}
      </group>
      <PersianRug position={[mid, 0.005, east - 1.7]} scale={0.9} />
      {/* The television on its stand against the west wall. */}
      <group position={[mid, 0, -east + 0.45]}>
        <mesh
          castShadow
          material={materials.wood}
          position={[0, 0.25, 0]}
          receiveShadow
        >
          <boxGeometry args={[1.2, 0.5, 0.5]} />
        </mesh>
        <group
          position={[0, 0.5, 0.02]}
          rotation={[0, 0, 0]}
          scale={config.tvScale}
        >
          <RetroTv screen={<CRTShowWebGPU vignette={0.6} />} />
        </group>
        <pointLight
          color={config.tvColor}
          decay={2}
          distance={9}
          intensity={config.tvIntensity}
          position={[0, 0.9, 0.9]}
        />
      </group>
      {/* A window on the south wall with the night behind it. */}
      <group
        position={[-depth + 0.02, 1.45, -0.3]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <mesh material={materials.frame} position={[0, 0, -0.03]}>
          <boxGeometry args={[1.5, 1.3, 0.05]} />
        </mesh>
        <mesh material={materials.night} position={[0, 0, 0.0]}>
          <planeGeometry args={[1.32, 1.12]} />
        </mesh>
        <mesh material={materials.frame} position={[0, 0, 0.01]}>
          <boxGeometry args={[0.04, 1.12, 0.02]} />
        </mesh>
        <mesh material={materials.frame} position={[0, 0, 0.01]}>
          <boxGeometry args={[1.32, 0.04, 0.02]} />
        </mesh>
      </group>
    </group>
  );
}

export default memo(Furniture);
