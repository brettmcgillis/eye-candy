import React, { memo, useEffect, useMemo } from 'react';

import createCellGeometry from '../utils/cellBuffers';
import createCellMaterial from '../utils/cellMaterial';

function Cells({ config, grow, halfSize, piece }) {
  const { outlineStrength, outlineWidth } = config;
  const geometry = useMemo(
    () => createCellGeometry(piece, { outlineStrength, outlineWidth }),
    [outlineStrength, outlineWidth, piece]
  );
  const material = useMemo(
    () => createCellMaterial({ grow, halfSize }),
    [grow, halfSize]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return <mesh frustumCulled={false} geometry={geometry} material={material} />;
}

export default memo(Cells);
