import { useLayoutEffect, useMemo, useRef } from 'react';

import createCellGeometry, {
  cellCount,
  writeCells,
} from '../utils/cellBuffers';

const MIN_CAPACITY = 1024;

// One geometry, grown by doubling and never shrunk, so a webcam piece every
// frame rewrites buffers instead of allocating them. Disposal is a layout
// effect: three's dispose frees whatever geometry the render object holds
// now, so a frame drawn with the new geometry first leaks the old buffers.
export default function useCellGeometry(
  piece,
  { outlineStrength, outlineWidth }
) {
  const capacityRef = useRef(MIN_CAPACITY);
  const needed = cellCount(piece, { outlineStrength, outlineWidth });
  while (capacityRef.current < needed) capacityRef.current *= 2;
  const capacity = capacityRef.current;

  const geometry = useMemo(() => createCellGeometry(capacity), [capacity]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    writeCells(geometry, piece, { outlineStrength, outlineWidth });
  }, [geometry, outlineStrength, outlineWidth, piece]);

  return geometry;
}
