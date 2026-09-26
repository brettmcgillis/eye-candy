import React, { memo, useEffect, useMemo } from 'react';

import createBeadMaterial from '../utils/beadMaterial';
import {
  createBlobMaterial,
  createInvaderSkinMaterial,
} from '../utils/skinMaterials';
import createVoxelMaterial from '../utils/voxelMaterial';

function CreatureField({ skinMode, store, uniforms }) {
  const materials = useMemo(
    () => ({
      beads: createBeadMaterial(store, uniforms),
      blob: createBlobMaterial(store, uniforms),
      invader: createInvaderSkinMaterial(store, uniforms),
      voxels: createVoxelMaterial(store, uniforms),
    }),
    [store, uniforms]
  );

  useEffect(() => {
    store.setMaterials(materials);

    return () => Object.values(materials).forEach((m) => m.dispose());
  }, [materials, store]);

  useEffect(() => {
    store.setSkinMode(skinMode);
  }, [skinMode, store]);

  return (
    <>
      <mesh
        castShadow
        frustumCulled={false}
        geometry={store.voxels}
        material={materials.voxels}
        receiveShadow
      />
      <mesh
        castShadow
        frustumCulled={false}
        geometry={store.beads}
        material={materials.beads}
        receiveShadow
      />
      <primitive object={store.skins} />
    </>
  );
}

export default memo(CreatureField);
