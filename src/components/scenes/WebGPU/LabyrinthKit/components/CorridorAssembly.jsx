import React, { memo } from 'react';

import useKitMaterials from '../hooks/useKitMaterials';
import { corridorVariationFor, segmentAt } from '../utils/corridor';
import CorridorUnit from './CorridorUnit';

// Static chain of corridor segments, laid out by the same arithmetic the
// moving preview uses.
function CorridorAssembly({ config }) {
  const materials = useKitMaterials(config);
  const segments = [];
  let x = 0;
  for (let i = 0; i < config.corridorCount; i += 1) {
    const segment = segmentAt(i, config);
    segments.push({ segment, x, variation: corridorVariationFor(i, config) });
    x += segment.length;
  }

  return (
    <group
      position={[-config.corridorCount * config.segmentLength * 0.35, 0, 0]}
    >
      {segments.map((entry) => (
        <group key={entry.segment.index} position={[entry.x, 0, 0]}>
          <CorridorUnit
            config={config}
            material={materials.stone}
            segment={entry.segment}
            variation={entry.variation}
          />
        </group>
      ))}
    </group>
  );
}

export default memo(CorridorAssembly);
