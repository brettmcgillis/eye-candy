import * as THREE from 'three';

import { useEffect, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../../../utils/appUtils';
import { INSTANCED_TRASH_ASSET_DEFS } from '../utils/sceneData';
import { bakeInstancedGeometry } from '../utils/sceneUtils';

export default function useInstancedTrashVisual(assetKey) {
  const assetDef = INSTANCED_TRASH_ASSET_DEFS[assetKey];
  const { nodes, materials } = useGLTF(modelFile(assetDef.modelPath));

  const geometry = useMemo(
    () =>
      bakeInstancedGeometry(
        nodes[assetDef.geometryName].geometry,
        assetDef.transformChain
      ),
    [assetDef, nodes]
  );

  const material = useMemo(() => {
    if (assetDef.customMaterialProps) {
      return new THREE.MeshPhysicalMaterial(assetDef.customMaterialProps);
    }

    return materials[assetDef.materialName].clone();
  }, [assetDef, materials]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose?.();
    },
    [geometry, material]
  );

  return { geometry, material };
}
