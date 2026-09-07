import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useFlightKit from '../hooks/useFlightKit';
import useKitMaterials from '../hooks/useKitMaterials';
import { LANDING_VARIATIONS } from '../utils/assets';
import FlightUnit from './FlightUnit';

// The treadmill, built from whole flights instead of shader displacement. Each
// slot keeps a fixed variation and only ever moves to a global index congruent
// to itself, so recycling never remounts a flight's children.
function MotionPreview({ config }) {
  const materials = useKitMaterials(config);

  const kit = useFlightKit(config);
  const descentRef = useRef(0);
  const slotRefs = useRef([]);

  const slots = useMemo(() => {
    const variations = LANDING_VARIATIONS.length;
    const wraps = Math.max(1, Math.round(config.motionSlots / variations));
    const count = variations * wraps;
    return Array.from({ length: count }, (_, i) => ({
      slot: i,
      variation: LANDING_VARIATIONS[i % variations],
    }));
  }, [config.motionSlots]);

  useFrame((state, delta) => {
    const clamped = Math.min(delta, 1 / 20);
    descentRef.current += config.motionSpeed * clamped;

    const descent = descentRef.current;
    const count = slots.length;
    // Centre the live band on the camera rather than on the origin, so the
    // column always fills the view wherever the camera has been moved to.
    const cameraY = state.camera.position.y;
    const flightsFallen = (descent - cameraY) / kit.landingDrop;
    // Hold the flight at camera height at a fixed azimuth so the stair edge
    // stays in frame and the drift becomes legible.
    const spin = -(descent / kit.landingDrop) * kit.flightArc * config.spinLock;

    for (let i = 0; i < count; i += 1) {
      const group = slotRefs.current[i];
      if (group) {
        const n = i + count * Math.round((flightsFallen - i) / count);
        group.position.y = descent - n * kit.landingDrop;
        group.rotation.y = -(n * kit.flightArc + spin);
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
          <FlightUnit
            config={config}
            index={entry.slot}
            kit={kit}
            material={materials.stone}
            wallMaterial={materials.wall}
            variation={entry.variation}
          />
        </group>
      ))}
    </group>
  );
}

export default memo(MotionPreview);
