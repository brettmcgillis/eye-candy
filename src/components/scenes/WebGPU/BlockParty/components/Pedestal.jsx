import React, { memo, useEffect, useMemo } from 'react';

import createPedestalGeometry from '../utils/pedestal';

function Pedestal({ depth, material, size }) {
  const geometry = useMemo(
    () => createPedestalGeometry(size, depth),
    [depth, size]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}

export default memo(Pedestal);
