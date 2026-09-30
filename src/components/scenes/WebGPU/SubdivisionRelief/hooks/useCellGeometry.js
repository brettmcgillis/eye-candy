import { useLayoutEffect, useMemo, useRef } from 'react';

import createCellGeometry, { writeCells } from '../utils/cellBuffers';

const MIN_CAPACITY = 1024;
const HEIGHT_KEYS = [
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

// Grown by doubling and never shrunk, so a webcam piece rewrites buffers
// instead of allocating them. Disposal is a layout effect: three frees the
// geometry the render object holds now, so a frame drawn with the new one
// first leaks the old buffers.
export default function useCellGeometry(piece, config) {
  const capacityRef = useRef(MIN_CAPACITY);
  while (capacityRef.current < piece.nodes.length) capacityRef.current *= 2;
  const capacity = capacityRef.current;
  const heightKey = HEIGHT_KEYS.map((key) => config[key]).join('|');

  const geometry = useMemo(
    () => createCellGeometry(capacity, config.lattice),
    [capacity, config.lattice]
  );
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    writeCells(geometry, piece, config);
  }, [geometry, heightKey, piece]);

  return geometry;
}
