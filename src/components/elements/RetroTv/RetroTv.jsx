import React, { memo, useEffect, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import { modelFile } from '@utils/appUtils';

const MODEL = modelFile('retro_tv.glb');

// A wooden-cabinet CRT. The screen is a slot: pass a material element as
// `screen` (one of the CRT channel materials, say) and it is applied to the
// screen mesh; otherwise the tube is dark glass.
function RetroTv({ screen = null, bodyColor = '#1a1210', ...props }) {
  const { nodes } = useGLTF(MODEL);

  const materials = useMemo(
    () => ({
      body: new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color(bodyColor),
        roughness: 0.55,
        metalness: 0.05,
      }),
      trim: new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#0b0b0b'),
        roughness: 0.35,
        metalness: 0.2,
      }),
      glass: new THREE.MeshStandardNodeMaterial({
        color: new THREE.Color('#0a0c10'),
        roughness: 0.15,
        metalness: 0.6,
      }),
    }),
    [bodyColor]
  );
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials]
  );

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        geometry={nodes.retro_tv.geometry}
        material={materials.body}
        receiveShadow
      />
      {['knob_01', 'knob_02', 'dial_01', 'dial_02', 'dial_03'].map((name) =>
        nodes[name] ? (
          <mesh
            geometry={nodes[name].geometry}
            key={name}
            material={materials.trim}
            position={nodes[name].position}
            rotation={nodes[name].rotation}
            scale={nodes[name].scale}
          />
        ) : null
      )}
      <mesh
        geometry={nodes.screen.geometry}
        material={screen ? undefined : materials.glass}
        position={nodes.screen.position}
        rotation={nodes.screen.rotation}
        scale={nodes.screen.scale}
      >
        {screen}
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL);

export default memo(RetroTv);
