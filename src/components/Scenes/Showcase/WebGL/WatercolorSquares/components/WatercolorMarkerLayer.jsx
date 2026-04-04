/* eslint-disable react/no-array-index-key */
import React from 'react';

import { markerWorldSize, uvToConstrainedWorld } from '../utils/markerUtils';
import { FilledSquare, OutlinedSquare } from './SquareMarker';

/**
 * Renders the watercolor square markers as Three.js geometry.
 *
 * stationarySplats  → outlined diamonds (mark fluid emitter positions)
 * stationaryDebugMarkers → filled diamonds (the visual "squares" of the composition)
 *
 * Both use uvToConstrainedWorld so the grid layout is bounded by the shorter
 * viewport dimension and stays proportional on wide desktop screens.
 */
export default function WatercolorMarkerLayer({ fluidConfig, viewport }) {
  const splatSize = markerWorldSize(
    fluidConfig.debugStationarySplatWidth,
    viewport
  );
  const fillSize = markerWorldSize(
    fluidConfig.debugStationaryMarkerWidth,
    viewport
  );

  return (
    <>
      {fluidConfig.stationarySplats?.map((pt, i) => (
        <OutlinedSquare
          key={`splat-${i}`}
          position={uvToConstrainedWorld(pt.x, pt.y, viewport)}
          size={splatSize}
          color={fluidConfig.debugStationarySplatColor}
        />
      ))}

      {fluidConfig.stationaryDebugMarkers?.map((pt, i) => (
        <FilledSquare
          key={`fill-${i}`}
          position={uvToConstrainedWorld(pt.x, pt.y, viewport)}
          size={fillSize}
          color={fluidConfig.debugStationaryMarkerColor}
        />
      ))}
    </>
  );
}
