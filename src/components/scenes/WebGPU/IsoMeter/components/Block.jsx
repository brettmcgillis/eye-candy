import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { toHex } from '@modules/isoMeter';

import useExplorer from '../hooks/useExplorer';
import usePiece from '../hooks/usePiece';
import Lattice from './Lattice';
import VoxelLattice from './VoxelLattice';

function Block({ config }) {
  const explorer = useExplorer(config);
  const piece = usePiece(config, explorer.offset);
  useSceneBackdrop({ color: toHex(piece.background) });

  const View = config.view === 'voxel' ? VoxelLattice : Lattice;
  return (
    <View
      config={config}
      onBuilt={explorer.onBuilt}
      piece={piece}
      replay={config.replay}
    />
  );
}

export default memo(Block);
