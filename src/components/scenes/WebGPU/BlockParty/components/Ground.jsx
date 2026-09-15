import React, { memo, useEffect, useMemo } from 'react';

import createGroundGeometry from '../utils/ground';

function Ground({ cells, material, radius, shape }) {
  const geometry = useMemo(
    () => createGroundGeometry({ cells, radius, shape }),
    [cells, radius, shape]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}

export default memo(Ground);
