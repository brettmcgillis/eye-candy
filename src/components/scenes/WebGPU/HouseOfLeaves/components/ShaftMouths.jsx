import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  createHallway,
  createWallSegment,
  riseAt,
  wallOpeningInset,
} from '@modules/houseOfLeaves';

import Flare from './Flare';

// The hallways that leave the stair. They are built in the same reference
// frame as the wall they pierce and rebuilt with it, because a tunnel and its
// hole drifting apart by even a little would show daylight through the shaft.
//
// Like the wall, the group is carried forward by a single Y shift between
// rebuilds rather than being repositioned piece by piece.
function ShaftMouths({
  config,
  flares,
  landingFlares,
  material,
  mouths,
  uRef,
  walker,
}) {
  const groupRef = useRef(null);

  const parts = useMemo(
    () =>
      mouths.map((mouth) => ({
        // The panel carries the true arch: its column heights sit exactly on
        // the arch curve rather than being approximated by the loft's grid.
        panel: createWallSegment({
          radius: mouth.radius,
          arc: mouth.panelArc,
          base: mouth.panelBase,
          height: mouth.panelHeight,
          columns: 64,
          opening: {
            width: mouth.width,
            height: mouth.height,
            archRise: mouth.archRise,
            offset: 0,
          },
        }),
        tunnel: createHallway({
          length: config.mouthDepth,
          width: mouth.width,
          height: mouth.height,
          archRise: mouth.archRise,
          capEnd: true,
          lengthSegments: 10,
          revealDepth: config.revealDepth,
        }),
      })),
    [config.mouthDepth, config.revealDepth, mouths]
  );

  useEffect(
    () => () =>
      parts.forEach((part) => {
        part.panel.dispose();
        part.tunnel.dispose();
      }),
    [parts]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !walker.frame) return;
    // Only the rise reference: the parent group already carries the rebase and
    // the shaft's offset into the shared world.
    const { frame } = walker;
    group.position.set(0, frame.riseRef - riseAt(uRef, frame.landings), 0);
  });

  // Resolved once per rebuild: these heights are frozen into the group, and
  // the frame's own drift is carried by the group's shift instead. Keyed on
  // the mouth list rather than the frame, which changes every tick.
  const placed = useMemo(() => {
    const landings = walker.frame?.landings ?? [];
    const base = riseAt(uRef, landings);
    // Placed on the shaft's axis rather than out at the wall: both the panel
    // and the tunnel are authored in the axis frame, so one group carries the
    // pair and they cannot come apart.
    return mouths.map((mouth) => ({
      y: -(riseAt(mouth.u, landings) - base),
      x: mouth.axis.x,
      z: mouth.axis.z,
    }));
  }, [mouths, uRef]);

  const placedFlares = useMemo(() => {
    const landings = walker.frame?.landings ?? [];
    const base = riseAt(uRef, landings);
    return landingFlares.map((flare) => [
      Math.cos(flare.angle) * flare.radius,
      -(riseAt(flare.u, landings) - base),
      Math.sin(flare.angle) * flare.radius,
    ]);
  }, [landingFlares, uRef]);

  return (
    <group ref={groupRef}>
      {mouths.map((mouth, i) => (
        <group
          key={mouth.key}
          position={[placed[i].x, placed[i].y, placed[i].z]}
          rotation={[0, -mouth.angle, 0]}
        >
          <mesh
            castShadow
            geometry={parts[i].panel}
            material={material}
            receiveShadow
          />
          {/* Sunk by the arc's sagitta: a flat mouth meeting a curved wall
              leaves a sliver of daylight at each jamb otherwise. */}
          <mesh
            castShadow
            geometry={parts[i].tunnel}
            material={material}
            position={[
              mouth.radius - wallOpeningInset(mouth.radius, mouth.width),
              0,
              0,
            ]}
            receiveShadow
          />
          {mouth.flare && (
            <Flare
              config={config}
              flares={flares}
              position={[mouth.radius + config.mouthDepth * 0.6, 0, 0]}
              seed={mouth.index * 7.7 + i}
            />
          )}
        </group>
      ))}
      {landingFlares.map((flare, i) => (
        <Flare
          config={config}
          flares={flares}
          key={flare.key}
          position={placedFlares[i]}
          seed={flare.index * 3.3}
        />
      ))}
    </group>
  );
}

export default memo(ShaftMouths);
