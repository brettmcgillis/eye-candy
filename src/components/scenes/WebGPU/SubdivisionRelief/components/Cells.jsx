import React, { memo, useEffect, useMemo } from 'react';

import createCellMaterial from '../utils/cellMaterial';

function Cells({ geometry, grow, motion }) {
  const material = useMemo(
    () => createCellMaterial({ grow, motion }),
    [grow, motion]
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      castShadow
      frustumCulled={false}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
}

export default memo(Cells);
