import React, { memo } from 'react';

import SquareTileMesh from './SquareTileMesh';
import TriangularTileMesh from './TriangularTileMesh';

function TileGrid({ config }) {
  if (config.gridMode === 'triangular') {
    return <TriangularTileMesh config={config} />;
  }
  return <SquareTileMesh config={config} />;
}

export default memo(TileGrid);
