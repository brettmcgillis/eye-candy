import React, { memo, useEffect, useMemo } from 'react';

import createPedestalGeometry from '../utils/pedestal';

function Pedestal({ depth, material, radius, shape }) {
  const geometry = useMemo(
    () => createPedestalGeometry({ depth, radius, shape }),
    [depth, radius, shape]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}

export default memo(Pedestal);
