import * as THREE from 'three';

import React, { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const PART_ROTATION = [-Math.PI / 2, 0, 0];
const PART_EULER = new THREE.Euler(...PART_ROTATION);

// cartoon_clouds.glb is a small "cloud kit": six separate, spatially distinct
// cloud shapes (verified via each mesh's own bounding box — they don't
// overlap, they're scattered across a ~200-unit area), not one cloud split
// into pieces.
const CLOUD_NODE_KEYS = [
  'Object_2',
  'Object_2001',
  'Object_3',
  'Object_3001',
  'Object_3002',
  'Object_4',
];

export const CLOUD_VARIANT_COUNT = CLOUD_NODE_KEYS.length;

// One of the six cloud shapes, as a plain mesh — no Merged/instancing. At the
// handful of clouds this scene has open at once, the draw-call savings
// aren't worth the extra failure surface. `variant` selects which shape;
// `color`, when given, tints a per-call material clone (untinted callers
// share the GLTF's own material, unmodified).
export function SingleCartoonCloud({ variant = 0, color, ...props }) {
  const { nodes, materials } = useGLTF(modelFile('cartoon_clouds.glb'));
  const variantIndex =
    ((variant % CLOUD_VARIANT_COUNT) + CLOUD_VARIANT_COUNT) %
    CLOUD_VARIANT_COUNT;
  const node = nodes[CLOUD_NODE_KEYS[variantIndex]];

  // Each shape's local geometry is centered wherever the original (scattered)
  // scene happened to place it, not around its own visual centroid — recenter
  // so `props.position` (set by callers to e.g. a window's rect center) lands
  // on the shape's middle instead of its arbitrary leftover pivot.
  const recenter = useMemo(() => {
    const box = new THREE.Box3().setFromBufferAttribute(
      node.geometry.attributes.position
    );
    return box.getCenter(new THREE.Vector3()).applyEuler(PART_EULER).negate();
  }, [node]);

  const material = useMemo(() => {
    const baseMaterial =
      materials['lambert2SG.001'] ?? Object.values(materials)[0];
    if (!color) return baseMaterial;
    const tinted = baseMaterial.clone();
    tinted.color.set(color);
    return tinted;
  }, [materials, color]);

  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={node.geometry}
        material={material}
        rotation={PART_ROTATION}
        position={recenter}
      />
    </group>
  );
}

useGLTF.preload(modelFile('cartoon_clouds.glb'));
