import React, { memo } from 'react';

import BlobFieldMesh from './BlobFieldMesh';
import SquareTileMesh from './SquareTileMesh';
import TriangularTileMesh from './TriangularTileMesh';

function TileGrid({ config }) {
  if (config.gridMode === 'triangular') {
    return <TriangularTileMesh config={config} />;
  }
  if (config.gridMode === 'field') {
    return <BlobFieldMesh config={config} />;
  }
  return <SquareTileMesh config={config} />;
}

export default memo(TileGrid);
