import React, { memo, useEffect, useMemo } from 'react';

import createCellMaterial from '../utils/cellMaterial';

function Cells({ geometry, grow, halfSize }) {
  const material = useMemo(
    () => createCellMaterial({ grow, halfSize }),
    [grow, halfSize]
  );

  useEffect(() => () => material.dispose(), [material]);

  return <mesh frustumCulled={false} geometry={geometry} material={material} />;
}

export default memo(Cells);
