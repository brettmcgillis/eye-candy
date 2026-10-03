import React, { memo, useEffect, useMemo } from 'react';

import createCellMaterial from '../utils/cellMaterial';

function Cells({ geometry, grow, halfSize, slide }) {
  const material = useMemo(
    () => createCellMaterial({ grow, halfSize, slide }),
    [grow, halfSize, slide]
  );

  useEffect(() => () => material.dispose(), [material]);

  return <mesh frustumCulled={false} geometry={geometry} material={material} />;
}

export default memo(Cells);
