import React, { memo, useEffect, useMemo } from 'react';

import createGroundGeometry from '../utils/ground';

const GroundTile = memo(function GroundTile({ bounds, cells, material }) {
  const geometry = useMemo(
    () => createGroundGeometry(bounds, cells),
    [bounds, cells]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} receiveShadow />;
});

function Ground({ cellsByDistrict, districts, material }) {
  return districts.map((district) => (
    <GroundTile
      key={district.index}
      bounds={district.bounds}
      cells={cellsByDistrict[district.index]}
      material={material}
    />
  ));
}

export default memo(Ground);
