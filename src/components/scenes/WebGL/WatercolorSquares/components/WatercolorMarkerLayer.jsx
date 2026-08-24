/* eslint-disable react/no-array-index-key */
import React from 'react';

import { FilledSquare, OutlinedSquare } from '@elements/Marker/MarkerSquare';
import {
  markerWorldSize,
  uvToConstrainedWorld,
} from '@elements/Marker/markerUtils';

const DEG_TO_RAD = Math.PI / 180;
const DIAMOND_TILT = Math.PI / 4;
// The generic rect-ring measures thickness perpendicular to each side.
// When rotated 45° the visual border is √2× wider than the old diamond-ring
// geometry which measured thickness radially. Dividing by √2 restores parity.
const THICKNESS_CORRECTION = 1 / Math.SQRT2;

export default function WatercolorMarkerLayer({ fluidConfig, viewport }) {
  // — Splat (outlined) controls —
  const splatSize = markerWorldSize(
    fluidConfig.debugStationarySplatWidth,
    viewport
  );
  const splatThickness =
    markerWorldSize(
      (fluidConfig.debugStationarySplatLineWeight ?? 2) / 100,
      viewport
    ) * THICKNESS_CORRECTION;
  const splatFill = !!fluidConfig.debugStationarySplatFill;
  const splatRotation =
    (fluidConfig.debugStationarySplatRotation ?? 0) * DEG_TO_RAD + DIAMOND_TILT;

  // — Marker (filled) controls —
  const markerSize = markerWorldSize(
    fluidConfig.debugStationaryMarkerWidth,
    viewport
  );
  const markerThickness =
    markerWorldSize(
      (fluidConfig.debugStationaryMarkerLineWeight ?? 2) / 100,
      viewport
    ) * THICKNESS_CORRECTION;
  const markerFill = fluidConfig.debugStationaryMarkerFill !== false;
  const markerRotation =
    (fluidConfig.debugStationaryMarkerRotation ?? 0) * DEG_TO_RAD +
    DIAMOND_TILT;
  const markersVisible = fluidConfig.stationaryDebugMarkersEnabled !== false;

  return (
    <>
      {fluidConfig.stationarySplats?.map((pt, i) =>
        splatFill ? (
          <FilledSquare
            key={`splat-${i}`}
            position={uvToConstrainedWorld(pt.x, pt.y, viewport)}
            size={splatSize}
            color={fluidConfig.debugStationarySplatColor}
            extraRotation={splatRotation}
          />
        ) : (
          <OutlinedSquare
            key={`splat-${i}`}
            position={uvToConstrainedWorld(pt.x, pt.y, viewport)}
            size={splatSize}
            lineThickness={splatThickness}
            color={fluidConfig.debugStationarySplatColor}
            extraRotation={splatRotation}
          />
        )
      )}

      {markersVisible &&
        fluidConfig.stationaryDebugMarkers?.map((pt, i) =>
          markerFill ? (
            <FilledSquare
              key={`fill-${i}`}
              position={uvToConstrainedWorld(pt.x, pt.y, viewport)}
              size={markerSize}
              color={fluidConfig.debugStationaryMarkerColor}
              extraRotation={markerRotation}
            />
          ) : (
            <OutlinedSquare
              key={`fill-${i}`}
              position={uvToConstrainedWorld(pt.x, pt.y, viewport)}
              size={markerSize}
              lineThickness={markerThickness}
              color={fluidConfig.debugStationaryMarkerColor}
              extraRotation={markerRotation}
            />
          )
        )}
    </>
  );
}
