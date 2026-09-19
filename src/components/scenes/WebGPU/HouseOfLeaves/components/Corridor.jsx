import React, { memo, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  corridorVariationFor,
  hash01,
  segmentAt,
} from '@modules/houseOfLeaves';

import CorridorUnit from './CorridorUnit';

// Units are built at their absolute index in the zone, so nothing about a
// unit depends on where the walker is. The window follows the walker's
// position projected onto this corridor's axis — its own zone or not, so a
// hallway seen from its far end is drawn from there.
function Corridor({ config, flares, material, walker, zone }) {
  const groupRef = useRef(null);
  const [window, setWindow] = useState({ first: 0, last: -1 });
  const count = Math.round(zone.length / config.segmentLength);

  useFrame(() => {
    const group = groupRef.current;
    const { anchor, position } = walker;
    if (group) {
      const { frame } = zone;
      group.position.set(
        frame.x - anchor.x,
        frame.y - anchor.y,
        frame.z - anchor.z
      );
      group.rotation.y = frame.rotationY;
    }
    const local = zone.frame.toLocal(position.x, position.z);
    const first = Math.max(
      0,
      Math.floor((local.x - config.streamBehind) / config.segmentLength)
    );
    const last = Math.min(
      count - 1,
      Math.ceil((local.x + config.streamAhead) / config.segmentLength)
    );
    setWindow((current) =>
      current.first === first && current.last === last
        ? current
        : { first, last }
    );
  });

  const units = useMemo(() => {
    const list = [];
    for (let index = window.first; index <= window.last; index += 1) {
      const segment = segmentAt(index, zone.profile);
      // The last unit ends at whatever the corridor leads into, which draws
      // its own wall around the corridor's mouth.
      if (index === count - 1) segment.jump = false;
      list.push({
        index,
        segment,
        variation: corridorVariationFor(index, zone.profile),
        entry: index === 0 ? zone.entry : null,
        hasFlare:
          hash01(index * 11.3 + 4.1 + zone.profile.seed) < config.flareChance,
      });
    }
    return list;
  }, [config.flareChance, count, window, zone]);

  return (
    <group ref={groupRef}>
      {units.map((unit) => (
        <group
          key={unit.index}
          position={[unit.index * config.segmentLength, 0, 0]}
        >
          <CorridorUnit
            config={config}
            entry={unit.entry}
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
