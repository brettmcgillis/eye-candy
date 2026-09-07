import React, { memo, useEffect, useMemo } from 'react';

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

import { corridorVariationFor, segmentAt } from '../utils/corridor';
import { CORRIDOR_PERIOD, TAU } from '../utils/route';
import CorridorUnit from './CorridorUnit';

// The whole route as one continuous arrangement: threshold, corridor, great
// room, shaft, floor, laid out where they actually are relative to one another.
// Nothing is duplicated and nothing is teleported between — the endless
// stretches are folds in the camera's progress, not separate places.
function WorldContent({ config, route, materials }) {
  const { stone, shell, wall } = materials;
  const t = route.tour;

  const parts = useMemo(() => {
    const opening = {
      openingWidth: config.corridorWidth,
      openingHeight: config.corridorHeight,
      archRise: t.archRise,
    };
    const made = {};

    made.threshold = createThreshold({
      wallWidth: config.thresholdWallWidth,
      wallHeight: config.thresholdWallHeight,
      thickness: t.wallThickness,
      ...opening,
    });
    made.roomWall = createThreshold({
      wallWidth: t.roomSize,
      wallHeight: config.mouthRoomHeight,
      thickness: t.wallThickness,
      ...opening,
    });
    made.room = createShaftMouthRoom({
      width: t.roomSize,
      depth: t.roomSize,
      height: config.mouthRoomHeight,
      holeRadius: t.holeRadius,
      doorwaySide: -1,
      doorway: { width: config.corridorWidth },
    });

    made.stairs = route.pattern.flights.map((f) =>
      createStairSegment({
        innerRadius: config.voidRadius,
        outerRadius: t.wallRadius,
        riser: f.riser,
        stepCount: f.stepCount,
        arcPerStep: t.arcPerStep,
        thickness: config.landingThickness,
      })
    );
    made.landings = route.pattern.flights.map((f) =>
      createLanding({
        innerRadius: config.voidRadius - f.overshoot,
        outerRadius: t.wallRadius,
        arc: f.landingArc,
        thickness: config.landingThickness,
      })
    );
    made.topLanding = createLanding({
      innerRadius: config.voidRadius - config.landingOvershoot,
      outerRadius: t.wallRadius,
      arc: t.landingArc,
      thickness: config.landingThickness,
    });

    made.tube = createWallSegment({
      radius: t.wallRadius,
      arc: TAU * 1.002,
      columns: 192,
      base: route.floorY,
      height: 0,
    });

    const doorways = shaftFloorDoorways({
      count: config.floorExits,
      radius: t.wallRadius,
      baseWidth: config.corridorWidth,
      baseHeight: config.corridorHeight,
      variance: config.floorExitVariance,
      archRatio: config.archRatio,
      avoidAngle: route.stairAngle,
    });
    made.doorways = doorways;
    made.floor = createShaftFloor({
      radius: t.wallRadius,
      skirtHeight: -route.floorY + config.riser,
      doorways,
    });
    made.exitCorridors = doorways.map((exit) =>
      createHallway({
        length: route.hide + config.segmentLength,
        width: exit.width,
        height: exit.height,
        archRise: exit.archRise,
        revealDepth: config.revealDepth,
        mouthCurveRadius: t.wallRadius,
      })
    );
    return made;
  }, [config, route, t]);

  useEffect(
    () => () => {
      Object.values(parts).forEach((part) => part?.dispose?.());
      parts.stairs?.forEach((geometry) => geometry.dispose());
      parts.landings?.forEach((geometry) => geometry.dispose());
      parts.exitCorridors?.forEach((geometry) => geometry.dispose());
    },
    [parts]
  );

  // The dressing repeats on a fixed period, which is what the corridor fold
  // slides by. Reusing the same index modulo that period is what makes the
  // wrap exact rather than merely far away.
  const corridor = useMemo(() => {
    const uniform = { ...config, driftAmount: 0, stepAmount: 0 };
    return Array.from({ length: route.corridorSegments }, (_, i) => ({
      index: i,
      x: route.corridorStart + i * config.segmentLength,
      segment: segmentAt(i % CORRIDOR_PERIOD, uniform),
      variation: corridorVariationFor(i % CORRIDOR_PERIOD, uniform),
      config: uniform,
    }));
  }, [config, route]);

  const stack = [];
  for (let r = 0; r < route.repeats; r += 1) {
    route.pattern.flights.forEach((f) => {
      stack.push(
        <group
          key={`${r}-${f.index}`}
          position={[0, f.y - r * route.patternRise, 0]}
          rotation={[0, f.angle - r * route.pattern.totalArc, 0]}
        >
          <mesh
            castShadow
            geometry={parts.stairs[f.index]}
            material={stone}
            receiveShadow
          />
          <mesh
            castShadow
            geometry={parts.landings[f.index]}
            material={stone}
            position={[0, -f.rise, 0]}
            receiveShadow
            rotation={[0, -f.spanArc, 0]}
          />
        </group>
      );
    });
  }

  return (
    <group>
      <mesh
        castShadow
        geometry={parts.threshold}
        material={shell}
        position={[route.thresholdX, 0, 0]}
        receiveShadow
      />
      {corridor.map((unit) => (
        <group key={unit.index} position={[unit.x, 0, 0]}>
          <CorridorUnit
            config={unit.config}
            material={shell}
            segment={unit.segment}
            variation={unit.variation}
          />
        </group>
      ))}
      <mesh
        castShadow
        geometry={parts.roomWall}
        material={shell}
        position={[route.roomPlane - t.wallThickness, 0, 0]}
        receiveShadow
      />
      <mesh castShadow geometry={parts.room} material={shell} receiveShadow />
      <mesh
        castShadow
        geometry={parts.tube}
        material={wall}
        receiveShadow
        visible={config.wallMode !== 'Hidden'}
      />
      {/* A landing flush with the room floor so the helix can be stepped onto
          rather than beginning a riser down in mid-air. */}
      <group rotation={[0, route.stairAngle, 0]}>
        <mesh
          castShadow
          geometry={parts.topLanding}
          material={stone}
          receiveShadow
          rotation={[0, t.landingArc, 0]}
        />
        {stack}
      </group>
      <mesh
        castShadow
        geometry={parts.floor}
        material={stone}
        position={[0, route.floorY, 0]}
        receiveShadow
      />
      {parts.doorways.map((exit, i) => (
        <mesh
          castShadow
          geometry={parts.exitCorridors[i]}
          key={exit.angle}
          material={shell}
          position={[
            Math.cos(exit.angle) * t.wallRadius,
            route.floorY,
            Math.sin(exit.angle) * t.wallRadius,
          ]}
          receiveShadow
          rotation={[0, -exit.angle, 0]}
        />
      ))}
    </group>
  );
}

export default memo(WorldContent);
