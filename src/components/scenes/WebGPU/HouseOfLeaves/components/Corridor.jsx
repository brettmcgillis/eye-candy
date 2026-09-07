import React, { memo, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  corridorVariationFor,
  hash01,
  segmentAt,
} from '@modules/houseOfLeaves';

import CorridorUnit from './CorridorUnit';

// The corridor is not folded and does not wrap: units are built at their
// absolute index, so nothing about a unit depends on where the walker is and
// the corridor is genuinely unbounded rather than a short loop pretending.
//
// The window is React state rather than a per-frame pool. Segments arrive one
// every sixteen seconds at a walk, so the churn is nothing, and each unit's
// pieces — a branch, a room, a bulkhead, a flare — differ far too much to
// share pooled slots.
function Corridor({ config, flares, material, walker }) {
  const groupRef = useRef(null);
  const [first, setFirst] = useState(0);

  const count = useMemo(
    () =>
      Math.ceil(
        (config.streamAhead + config.streamBehind) / config.segmentLength
      ) + 2,
    [config.segmentLength, config.streamAhead, config.streamBehind]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (group) {
      const { anchor, zone } = walker;
      const origin = zone?.origin ?? { x: 0, y: 0, z: 0 };
      // The way back is this same corridor laid down a spoke, so the group
      // carries the zone's placement as well as the rebase. Local +X maps to
      // the heading, which is a rotation of its negative.
      group.position.set(
        origin.x - anchor.x,
        (origin.y ?? 0) - anchor.y,
        origin.z - anchor.z
      );
      group.rotation.y = -(zone?.heading ?? 0);
    }
    const next = Math.floor(
      (walker.progress - config.streamBehind) / config.segmentLength
    );
    setFirst((current) => (current === next ? current : next));
  });

  const units = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const index = first + i;
        return {
          index,
          segment: segmentAt(index, config),
          variation: corridorVariationFor(index, config),
          hasFlare: hash01(index * 11.3 + 4.1) < config.flareChance,
        };
      }),
    [config, count, first]
  );

  return (
    <group ref={groupRef}>
      {units.map((unit) => (
        <group
          key={unit.index}
          position={[unit.index * config.segmentLength, 0, 0]}
        >
          <CorridorUnit
            config={config}
            flares={flares}
            hasFlare={unit.hasFlare}
            material={material}
            segment={unit.segment}
            variation={unit.variation}
          />
        </group>
      ))}
    </group>
  );
}

export default memo(Corridor);
