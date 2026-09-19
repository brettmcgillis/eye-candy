import React, { memo, useEffect, useMemo } from 'react';

import { createMouthPatch } from '@modules/houseOfLeaves';

import Flare from './Flare';

// The hallways that leave the stair, each a patch of the wall grid with the
// tunnel cut through it by one boolean. Built in the shaft's frame like the
// wall they replace, so the two share every edge.
function LandingMouths({
  config,
  flares,
  grid,
  landingFlares,
  material,
  mouths,
}) {
  const patches = useMemo(
    () =>
      mouths.map((mouth) => ({
        key: mouth.key,
        geometry: createMouthPatch({
          ring: grid.ring,
          inward: grid.inward,
          rows: mouth.rows,
          cols: mouth.cols,
          colsTotal: grid.cols,
          depth: 4,
          mouths: [mouth],
        }),
        flare: mouth.flare
          ? [
              mouth.x + Math.cos(mouth.angle) * mouth.depth * 0.6,
              mouth.y,
              mouth.z + Math.sin(mouth.angle) * mouth.depth * 0.6,
            ]
          : null,
        seed: mouth.index * 7.7 + mouth.angle,
      })),
    [grid, mouths]
  );

  useEffect(
    () => () => patches.forEach((patch) => patch.geometry.dispose()),
    [patches]
  );

  return (
    <>
      {patches.map((patch) => (
        <group key={patch.key}>
          <mesh
            castShadow
            geometry={patch.geometry}
            material={material}
            receiveShadow
          />
          {patch.flare && (
            <Flare
              config={config}
              flares={flares}
              position={patch.flare}
              seed={patch.seed}
            />
          )}
        </group>
      ))}
      {landingFlares.map((flare) => (
        <Flare
          config={config}
          flares={flares}
          key={flare.key}
          position={flare.position}
          seed={flare.index * 3.3}
        />
      ))}
    </>
  );
}

export default memo(LandingMouths);
