import React, { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

// Corrective rotation baked into every feather mesh in the source JSX below
// (Blender Z-up -> three Y-up) — reused when baking standalone instanced
// geometry so a lone feather ends up oriented the same way as it is inside
// the full tail assembly.
const PART_ROTATION = [-Math.PI / 2, 0, 0];
const PART_EULER = new THREE.Euler(...PART_ROTATION);

// The four feathers making up the assembly are individually placed to form
// a spread tail fan (see the meshes below) — those offsets recenter each
// feather *within the fan*, not around its own geometry, so they're no use
// for a scattered-particle swarm where every instance needs to pivot/scale
// around its own middle. Recomputed per-variant from each mesh's own
// bounding box instead, same trick as CartoonClouds' SingleCartoonCloud.
const FEATHER_VARIANTS = [
  { node: 'feather_1_A002_feather_1_0', material: 'feather_1' },
  { node: 'feather_2002_feather_2_0', material: 'feather_2' },
  { node: 'feather_3002_feather_3_0', material: 'feather_3' },
  { node: 'feather_4002_feather_4_0', material: 'feather_4' },
];

export default function OwlFeathers(props) {
  const { nodes, materials } = useGLTF(modelFile('owl_feathers.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.feather_1_A002_feather_1_0.geometry}
        material={materials.feather_1}
        position={[0, 0.008, -0.265]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.225}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.feather_2002_feather_2_0.geometry}
        material={materials.feather_2}
        position={[0, 0.026, -0.044]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.225}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.feather_3002_feather_3_0.geometry}
        material={materials.feather_3}
        position={[0, -0.001, 0.155]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.225}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.feather_4002_feather_4_0.geometry}
        material={materials.feather_4}
        position={[0, 0.004, 0.301]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.225}
      />
    </group>
  );
}

// The four feathers as standalone, independently-centered geometries + their
// own material — for a swarm that drives many instances via InstancedMesh
// (which can't wrap a <group>/<mesh> transform per instance). `baseSize` is
// each feather's own largest bounding dimension pre-scale, letting a caller
// convert a desired on-screen/world size into a scale factor without
// guessing the model's authored units (same role as CartoonClouds'
// MODEL_BASE_WIDTH, computed instead of hand-measured since each of the 4
// shapes differs).
export function useOwlFeatherGeometries() {
  const { nodes, materials } = useGLTF(modelFile('owl_feathers.glb'));
  return useMemo(
    () =>
      FEATHER_VARIANTS.map(({ node, material }) => {
        const source = nodes[node].geometry;
        const box = new THREE.Box3().setFromBufferAttribute(
          source.attributes.position
        );
        const center = box
          .getCenter(new THREE.Vector3())
          .applyEuler(PART_EULER);
        const size = box.getSize(new THREE.Vector3());

        return {
          geometry: bakeInstancedGeometry(source, [
            { position: center.clone().negate().toArray() },
            { rotation: PART_ROTATION },
          ]),
          material: materials[material],
          baseSize: Math.max(size.x, size.y, size.z),
        };
      }),
    [materials, nodes]
  );
}

useGLTF.preload(modelFile('owl_feathers.glb'));
