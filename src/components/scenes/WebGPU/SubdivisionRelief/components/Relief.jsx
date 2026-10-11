import React, { memo, useEffect, useLayoutEffect, useMemo } from 'react';

import { createReliefRig } from '@modules/subdivisionReliefRender';

import useGrowClock from '../hooks/useGrowClock';
import useMotionClock from '../hooks/useMotionClock';

// Besides the piece itself, what changes a cell's height or slide box.
const HEIGHT_KEYS = [
  'growStyle',
  'baseHeight',
  'depthBias',
  'depthWeight',
  'fieldWeight',
  'focalFalloff',
  'focalWeight',
  'heightSeed',
  'lumaInvert',
  'lumaWeight',
  'reliefHeight',
];

function Relief({ config, piece }) {
  const rig = useMemo(createReliefRig, []);
  const heightKey = HEIGHT_KEYS.map((key) => config[key]).join('|');

  useEffect(() => () => rig.dispose(), [rig]);
  useLayoutEffect(() => {
    rig.apply(config);
  }, [config, rig]);
  useLayoutEffect(() => {
    rig.setPiece(piece);
  }, [heightKey, piece, rig]);

  useGrowClock(config, piece.maxDepth, rig);
  useMotionClock(config, rig);

  return <primitive object={rig.group} />;
}

export default memo(Relief);
