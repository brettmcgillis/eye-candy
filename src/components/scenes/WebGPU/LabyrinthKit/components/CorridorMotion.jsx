import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useKitMaterials from '../hooks/useKitMaterials';
import { corridorVariationFor, segmentAt } from '../utils/corridor';
import CorridorUnit from './CorridorUnit';

// Travelling forward down an endless corridor. Segments scroll toward the
// camera and recycle ahead of it; each slot keeps a fixed identity so its
// geometry is never rebuilt mid-flight.
function CorridorMotion({ config }) {
  const materials = useKitMaterials(config);
  const travelRef = useRef(0);
  const slotRefs = useRef([]);

  const slots = useMemo(
    () =>
      Array.from({ length: config.corridorCount }, (_, i) => ({
        slot: i,
        segment: segmentAt(i, config),
        variation: corridorVariationFor(i, config),
      })),
    [config]
  );

  useFrame((state, delta) => {
    travelRef.current += config.travelSpeed * Math.min(delta, 1 / 20);
    const count = slots.length;
    const length = config.segmentLength;
    const travelled = travelRef.current / length;
    // Keep the band ahead of the camera: mostly corridor in front, a little
    // behind, so the way forward is never empty.
    const lead = config.corridorLead;
    for (let i = 0; i < count; i += 1) {
      const group = slotRefs.current[i];
      if (group) {
        const n = i + count * Math.round((travelled + lead - i) / count);
        group.position.x = n * length - travelRef.current;
      }
    }
  });

  return (
    <group>
      {slots.map((entry) => (
        <group
          key={entry.slot}
          ref={(node) => {
            slotRefs.current[entry.slot] = node;
          }}
        >
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

export default memo(CorridorMotion);
