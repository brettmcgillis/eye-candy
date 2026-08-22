import { useMemo } from 'react';

import { useBretNodes } from '../../../../../elements/bret/Bret';
import { useReversalNodes } from '../../../../../elements/reversal/Reversal';
import { MODEL_TARGETS } from '../utils/targetGeometry';

// Returns the source meshes for a model target, or null for the primitives and
// the ocean. Cloning is left to the consumer so the geometries' lifetime is tied
// to the runtime that disposes them.
export default function useTargetNodes(mode) {
  const bret = useBretNodes();
  const reversal = useReversalNodes();

  return useMemo(() => {
    const spec = MODEL_TARGETS[mode];

    if (!spec) {
      return null;
    }

    const source = spec.model === 'bret' ? bret : reversal;

    return spec.parts.map((part) => source[part]);
  }, [bret, mode, reversal]);
}
