import React, { forwardRef, memo, useEffect, useMemo } from 'react';

import {
  createHallway,
  createLanding,
  createShaftFloor,
  createShaftMouthRoom,
  createStairSegment,
  createThreshold,
  createWallSegment,
  shaftFloorDoorways,
} from '@modules/houseOfLeaves';

import useKitMaterials from '../hooks/useKitMaterials';
import { corridorVariationFor, segmentAt } from '../utils/corridor';
import { buildTour } from '../utils/tour';
import CorridorUnit from './CorridorUnit';

// The whole descent: threshold, fixed corridor, endless corridor, fixed
// corridor, great room, fixed flights, endless flights, fixed flights, floor.
//
// The endless runs are handed out as refs. They move by exactly the symmetry
// their geometry already has — the corridor slides one segment, the stair
// screws down one flight — so their joins with the fixed runs on either side
// never shift, and the wrap is invisible.
const TourAssembly = forwardRef(({ config }, refs) => {
  const materials = useKitMaterials(config);
  const t = useMemo(() => buildTour(config), [config]);

  const parts = useMemo(() => {
    const stairOptions = {
      innerRadius: config.voidRadius,
      outerRadius: t.wallRadius,
      riser: config.riser,
      stepCount: config.stepCount,
      arcPerStep: t.arcPerStep,
      thickness: config.landingThickness,
    };
    const opening = {
      openingWidth: config.corridorWidth,
      openingHeight: config.corridorHeight,
      archRise: t.archRise,
    };
    const corridorOf = (length) =>
      createHallway({
        length,
        width: config.corridorWidth,
        height: config.corridorHeight,
        archRise: t.archRise,
        revealDepth: config.revealDepth,
      });
    const doorways = shaftFloorDoorways({
      count: config.floorExits,
      radius: t.wallRadius,
      baseWidth: config.corridorWidth,
      baseHeight: config.corridorHeight,
      variance: config.floorExitVariance,
      archRatio: config.archRatio,
      avoidAngle: t.landingAzimuth,
    });

    return {
      threshold: createThreshold({
        wallWidth: config.thresholdWallWidth,
        wallHeight: config.thresholdWallHeight,
        thickness: t.wallThickness,
        ...opening,
      }),
      fixedEntry: corridorOf(t.fixedLength),
      fixedExit: corridorOf(t.fixedLength),
      roomWall: createThreshold({
        wallWidth: t.roomSize,
        wallHeight: config.mouthRoomHeight,
        thickness: t.wallThickness,
        ...opening,
      }),
      room: createShaftMouthRoom({
        width: t.roomSize,
        depth: t.roomSize,
        height: config.mouthRoomHeight,
        holeRadius: t.holeRadius,
        doorwaySide: -1,
        doorway: { width: config.corridorWidth },
      }),
      stair: createStairSegment(stairOptions),
      landing: createLanding({
        innerRadius: config.voidRadius - config.landingOvershoot,
        outerRadius: t.wallRadius,
        arc: t.landingArc,
        thickness: config.landingThickness,
      }),
      // The shaft wall is a surface of revolution, so it needs no per-flight
      // panels: one static tube from the room floor to the shaft floor. Panels
      // tall enough to overlap between turns also stood 26m up through the
      // great room floor, and rotated with the moving section.
      shaftTube: createWallSegment({
        radius: t.wallRadius,
        arc: Math.PI * 2 * 1.002,
        columns: 192,
        base: t.floorY,
        height: 0,
      }),
      floor: createShaftFloor({
        radius: t.wallRadius,
        skirtHeight: t.landingDrop * 2,
        doorways,
      }),
      exits: doorways,
      exitCorridors: doorways.map((exit) =>
        createHallway({
          length: config.segmentLength,
          width: exit.width,
          height: exit.height,
          archRise: exit.archRise,
          revealDepth: config.revealDepth,
        })
      ),
    };
  }, [config, t]);

  useEffect(
    () => () => {
      Object.values(parts).forEach((part) => part?.dispose?.());
      parts.exitCorridors.forEach((geometry) => geometry.dispose());
    },
    [parts]
  );

  const { stone } = materials;
  // Drift and stepped jumps are off inside the endless run: its two copies have
  // to meet invisibly at the wrap, which needs a constant section. Branches are
  // free to vary.
  const corridorConfig = useMemo(
    () => ({ ...config, driftAmount: 0, stepAmount: 0 }),
    [config]
  );

  const flight = (index, key) => {
    const last = index === t.totalFlights - 1;
    return (
      <group
        key={key}
        position={[0, -index * t.landingDrop, 0]}
        rotation={[0, -index * t.flightArc, 0]}
      >
        <mesh
          castShadow
          geometry={parts.stair}
          material={stone}
          receiveShadow
        />
        {!last && (
          <mesh
            castShadow
            geometry={parts.landing}
            material={stone}
            position={[0, -t.landingDrop, 0]}
            receiveShadow
            rotation={[0, -t.spanArc, 0]}
          />
        )}
      </group>
    );
  };

  const range = (from, count, prefix) =>
    Array.from({ length: count }, (_, i) => flight(from + i, `${prefix}${i}`));

  const movingFrom = t.fixedTopFlights;
  const bottomFrom = movingFrom + t.movingFlights;

  return (
    <group>
      <mesh
        castShadow
        geometry={parts.threshold}
        material={stone}
        position={[t.thresholdX, 0, 0]}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={parts.fixedEntry}
        material={stone}
        position={[t.corridorStart, 0, 0]}
        receiveShadow
      />
      {/* The endless run carries its own rooms, junctions and dead ends. It
          wraps over the whole run rather than a single segment, and two copies
          sit back to back so sliding never uncovers the far end. The section is
          held uniform along it so the two copies meet invisibly. */}
      <group position={[t.movingStart, 0, 0]} ref={refs?.corridorRef}>
        {[0, 1].map((copy) =>
          Array.from({ length: config.tourMovingSegments }, (_, i) => (
            <group
              key={`${copy}-${i}`}
              position={[
                (copy * config.tourMovingSegments + i) * config.segmentLength,
                0,
                0,
              ]}
            >
              <CorridorUnit
                config={corridorConfig}
                material={stone}
                segment={segmentAt(i, corridorConfig)}
                variation={corridorVariationFor(i, corridorConfig)}
              />
            </group>
          ))
        )}
      </group>
      <mesh
        castShadow
        geometry={parts.fixedExit}
        material={stone}
        position={[t.exitStart, 0, 0]}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={parts.roomWall}
        material={stone}
        position={[t.roomPlane - t.wallThickness, 0, 0]}
        receiveShadow
      />
      <mesh castShadow geometry={parts.room} material={stone} receiveShadow />
      <mesh
        castShadow
        geometry={parts.shaftTube}
        material={materials.wall}
        receiveShadow
        visible={config.wallMode !== 'Hidden'}
      />

      {range(0, t.fixedTopFlights, 'top')}
      <group ref={refs?.shaftRef}>
        {/* One flight longer than the window, so screwing down by up to a
            flight never uncovers the bottom of it. */}
        {range(movingFrom, t.movingFlights + 1, 'mid')}
      </group>
      {range(bottomFrom, t.fixedBottomFlights, 'bot')}

      <mesh
        castShadow
        geometry={parts.floor}
        material={stone}
        position={[0, t.floorY, 0]}
        receiveShadow
      />
      {parts.exits.map((exit, i) => (
        <mesh
          castShadow
          geometry={parts.exitCorridors[i]}
          key={exit.angle}
          material={stone}
          position={[
            Math.cos(exit.angle) * t.wallRadius,
            t.floorY,
            Math.sin(exit.angle) * t.wallRadius,
          ]}
          receiveShadow
          rotation={[0, -exit.angle, 0]}
        />
      ))}
    </group>
  );
});

TourAssembly.displayName = 'TourAssembly';

export default memo(TourAssembly);
