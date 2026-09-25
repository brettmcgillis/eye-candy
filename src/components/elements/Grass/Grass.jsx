import React, { memo, useEffect, useMemo } from 'react';

import createGrassMaterial from './grassMaterial';
import { createGrassStore } from './grassStore';

function Grass({ material, maxCount, scatter, uniforms, ...meshProps }) {
  const store = useMemo(() => createGrassStore(maxCount), [maxCount]);

  useEffect(() => {
    scatter(store);
  }, [scatter, store]);

  const nodeMaterial = useMemo(
    () => createGrassMaterial({ ...material, store, uniforms }),
    [material, store, uniforms]
  );

  useEffect(() => () => nodeMaterial.dispose(), [nodeMaterial]);
  useEffect(() => () => store.geometry.dispose(), [store]);

  return (
    <mesh
      frustumCulled={false}
      geometry={store.geometry}
      material={nodeMaterial}
      {...meshProps}
    />
  );
}

export default memo(Grass);
