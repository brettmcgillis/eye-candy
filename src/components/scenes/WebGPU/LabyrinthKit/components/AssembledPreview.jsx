import React, { memo, useMemo } from 'react';

import useFlightKit from '../hooks/useFlightKit';
import useKitMaterials from '../hooks/useKitMaterials';
import { variationFor } from '../utils/assets';
import FlightUnit from './FlightUnit';

// Static assembly, no motion: flights stacked by the same arithmetic the
// moving preview uses, so it is obvious whether the pieces meet before
// anything starts to scroll.
function AssembledPreview({ config }) {
  const materials = useKitMaterials(config);

  const kit = useFlightKit(config);

  const flights = useMemo(() => {
    const list = [];
    for (let i = 0; i < config.flights; i += 1) {
      list.push({
        index: i,
        angle: i * kit.flightArc,
        y: -i * kit.landingDrop,
        variation: variationFor(i),
      });
    }
    return list;
  }, [config.flights, kit]);

  // Straddle the origin so the camera sitting in the well has as much column
  // above it as below, rather than starting at the top of the stack.
  const centreOffset = ((config.flights - 1) * kit.landingDrop) / 2;

  return (
    <group position={[0, centreOffset, 0]}>
      {flights.map((flight) => (
        <group
          key={flight.index}
          position={[0, flight.y, 0]}
          rotation={[0, -flight.angle, 0]}
        >
          <FlightUnit
            config={config}
            index={flight.index}
            kit={kit}
            material={materials.stone}
            wallMaterial={materials.wall}
            variation={flight.variation}
            withLanding={flight.index < config.flights - 1}
          />
        </group>
      ))}
    </group>
  );
}

export default memo(AssembledPreview);
