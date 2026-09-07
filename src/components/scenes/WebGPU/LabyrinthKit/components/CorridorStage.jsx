import React, { memo, useEffect, useMemo } from 'react';

import {
  createShaftFloor,
  createShaftMouthRoom,
  createThreshold,
} from '@modules/houseOfLeaves';

import useKitMaterials from '../hooks/useKitMaterials';
import { segmentAt } from '../utils/corridor';
import CorridorAssembly from './CorridorAssembly';
import CorridorMotion from './CorridorMotion';
import CorridorUnit from './CorridorUnit';

const SINGLE_VARIATIONS = {
  'Corridor Segment': { kind: 'plain', side: null },
  'Corridor Tapered': { kind: 'plain', side: null },
  'Corridor + Room': { kind: 'room', side: 1 },
  'Corridor Junction': { kind: 'junction', side: 1 },
  'Junction + Dead End': { kind: 'deadEnd', side: 1 },
};

function CorridorStage({ config }) {
  const materials = useKitMaterials(config);
  const asset = config.corridorAsset;

  const segment = useMemo(() => {
    const base = segmentAt(0, config);
    if (asset === 'Corridor Tapered') return base;
    // Single-piece inspection shows a straight section unless tapering is the
    // thing being looked at.
    return {
      ...base,
      widthEnd: base.widthStart,
      heightEnd: base.heightStart,
      jump: false,
    };
  }, [asset, config]);

  const transition = useMemo(() => {
    if (asset === 'Shaft Mouth Room') {
      return createShaftMouthRoom({
        width: config.mouthRoomSize,
        depth: config.mouthRoomSize,
        height: config.mouthRoomHeight,
        holeRadius: config.voidRadius,
      });
    }
    if (asset === 'Shaft Floor') {
      return createShaftFloor({
        radius: config.voidRadius + config.stairWidth,
        skirtHeight: config.mouthRoomHeight * 2,
      });
    }
    if (asset === 'Threshold Archway') {
      return createThreshold({
        wallWidth: config.thresholdWallWidth,
        wallHeight: config.thresholdWallHeight,
        thickness: config.bulkheadThickness,
        openingWidth: config.corridorWidth,
        openingHeight: config.corridorHeight,
        archRise: config.corridorHeight * config.archRatio,
      });
    }
    return null;
  }, [asset, config]);

  useEffect(() => () => transition?.dispose(), [transition]);

  if (asset === 'Corridor Assembly')
    return <CorridorAssembly config={config} />;
  if (asset === 'Corridor Motion') return <CorridorMotion config={config} />;

  if (transition) {
    return (
      <mesh
        castShadow
        receiveShadow
        geometry={transition}
        material={materials.stone}
      />
    );
  }

  return (
    <CorridorUnit
      config={config}
      material={materials.stone}
      segment={segment}
      variation={
        SINGLE_VARIATIONS[asset] ?? SINGLE_VARIATIONS['Corridor Segment']
      }
    />
  );
}

export default memo(CorridorStage);
