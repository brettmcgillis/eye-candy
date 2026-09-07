import { shaftFloorDoorways } from '@modules/houseOfLeaves';

import buildEndlessPattern from './endlessStair';
import { TAU, buildTour } from './tour';

// The corridor's dressing repeats over this many segments. The fold slides the
// world by exactly that period, so every door and dead end lands back on itself
// and the wrap is the identity rather than a cut.
export const CORRIDOR_PERIOD = 6;

const IDENTITY = { x: 0, y: 0, z: 0, spin: 0 };

// A stretch of the route the camera actually walks. Sampled once into a
// polyline so travel can be measured in metres, which is what lets the walk and
// the folds share a single odometer.
function pathLeg(fn, samples = 96) {
  const points = [];
  for (let i = 0; i <= samples; i += 1) points.push(fn(i / samples));

  const cumulative = [0];
  for (let i = 1; i <= samples; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    cumulative.push(
      cumulative[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    );
  }

  // Facing follows the tangent, unwrapped so the helix does not spin the wrong
  // way round when its yaw crosses pi.
  const yaws = points.map((_, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(samples, i + 1)];
    return Math.atan2(-(b[0] - a[0]), -(b[2] - a[2]));
  });
  for (let i = 1; i <= samples; i += 1) {
    while (yaws[i] - yaws[i - 1] > Math.PI) yaws[i] -= TAU;
    while (yaws[i] - yaws[i - 1] < -Math.PI) yaws[i] += TAU;
  }

  const length = cumulative[samples];
  const at = (distance) => {
    const target = Math.min(Math.max(distance, 0), length);
    let i = 1;
    while (i < samples && cumulative[i] < target) i += 1;
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const f = (target - cumulative[i - 1]) / span;
    const a = points[i - 1];
    const b = points[i];
    return {
      position: [
        a[0] + (b[0] - a[0]) * f,
        a[1] + (b[1] - a[1]) * f,
        a[2] + (b[2] - a[2]) * f,
      ],
      yaw: yaws[i - 1] + (yaws[i] - yaws[i - 1]) * f,
      world: IDENTITY,
    };
  };

  return { kind: 'path', length, at, drop: points[0][1] - points[samples][1] };
}

// A fold: the camera holds still and the world moves under it instead. Because
// only relative motion is visible, handing the velocity from one to the other
// at the same speed is invisible — and because the transform is reduced modulo
// a period the geometry is congruent under, the wrap is a no-op. The fold
// therefore adds travel without consuming any of the route.
function foldLeg(length, apply) {
  return { kind: 'fold', length, apply, hold: null };
}

// Fold legs hold wherever the previous stretch left the camera, so the velocity
// hand-off happens at a matched position and facing and there is nothing to see.
function finish(rawLegs, layout) {
  let total = 0;
  const legs = rawLegs.map((leg, i) => {
    const start = total;
    total += leg.length;
    if (leg.kind !== 'fold') return { ...leg, start };
    const previous = rawLegs[i - 1];
    const end = previous.at(previous.length);
    return { ...leg, start, hold: { position: end.position, yaw: end.yaw } };
  });

  const sample = (travel) => {
    const s = Math.min(Math.max(travel, 0), total);
    let leg = legs[0];
    for (let i = 0; i < legs.length; i += 1) {
      if (s >= legs[i].start) leg = legs[i];
    }
    const d = s - leg.start;
    if (leg.kind === 'fold') {
      return { ...leg.hold, world: leg.apply(d), folding: true };
    }
    return { ...leg.at(d), folding: false };
  };

  return { ...layout, legs, length: total, sample };
}

export function buildRoute(config) {
  const t = buildTour(config);
  // Two turns of variety is enough to read as non-repeating, and the pattern's
  // rise is the fold's period — a longer one only makes the fixed descent
  // either side of the anchor longer for no gain.
  const pattern = buildEndlessPattern(config, {
    ...t,
    movingFlights: t.flightsPerTurn * 2,
  });
  const eye = config.corridorHeight * 0.35;

  // Nothing that is not periodic may sit closer to an anchor than the fog
  // reaches: during a fold the far ends of the world shift by up to one period,
  // and that shift must never be visible.
  const hide = config.fogEnabled ? config.fogFar : config.segmentLength * 8;

  const period = CORRIDOR_PERIOD * config.segmentLength;
  const margin = hide + config.segmentLength * config.tourFixedSegments;
  // The fold slides the world backwards, so everything ahead of the anchor
  // closes on the camera by up to one period before wrapping. The corridor
  // ahead therefore has to cover the fog *plus* that slide, or the great room
  // wall walks into view partway through the fold.
  const runBefore = Math.ceil(margin / period) * period;
  const runAfter = Math.ceil((margin + period) / period) * period;
  const roomPlane = -t.roomSize * 0.5;
  const anchorX = roomPlane - t.wallThickness - runAfter;
  const corridorStart = anchorX - runBefore;
  const thresholdX = corridorStart - t.wallThickness;
  const corridorSegments = Math.round(
    (runBefore + runAfter) / config.segmentLength
  );

  const flightsPerPattern = pattern.flights.length;
  const patternRise = pattern.totalRise;
  const stairMargin = hide + config.tourFixedFlights * t.landingDrop;
  // Same asymmetry: the screw lifts the world, so the shaft floor rises toward
  // the camera by up to one pattern while the room floor above only recedes.
  const repeatsAbove = Math.max(1, Math.ceil(stairMargin / patternRise));
  const repeatsBelow = Math.max(
    1,
    Math.ceil((stairMargin + patternRise) / patternRise)
  );
  const repeats = repeatsAbove + repeatsBelow;
  const floorY = -repeats * patternRise - config.riser;

  // The stair is turned so its top landing meets the room's doorway wall, which
  // is what makes stepping off the room floor onto the helix a straight walk.
  const stairAngle = Math.PI;
  const pathRadius = (config.voidRadius + t.wallRadius) * 0.5;

  const nodeAt = (n) => {
    const repeat = Math.floor(n / flightsPerPattern);
    const flight = pattern.flights[n - repeat * flightsPerPattern];
    return {
      y: flight.y - repeat * patternRise,
      angle: flight.angle - repeat * pattern.totalArc,
    };
  };

  const helixAt = (u) => {
    const k = Math.floor(u);
    const frac = u - k;
    const a = nodeAt(k);
    const b = nodeAt(k + 1);
    const angle = stairAngle + a.angle + (b.angle - a.angle) * frac;
    return [
      Math.cos(angle) * pathRadius,
      a.y + (b.y - a.y) * frac + eye,
      Math.sin(angle) * pathRadius,
    ];
  };

  const anchorFlight = repeatsAbove * flightsPerPattern;
  const lastFlight = repeats * flightsPerPattern;

  // The exits are derived here as well as in the geometry, from the same call,
  // so the route cannot walk at a doorway that was cut somewhere else.
  const exits = shaftFloorDoorways({
    count: config.floorExits,
    radius: t.wallRadius,
    baseWidth: config.corridorWidth,
    baseHeight: config.corridorHeight,
    variance: config.floorExitVariance,
    archRatio: config.archRatio,
    avoidAngle: stairAngle,
  });
  const exit = exits[0] ?? { angle: 0 };
  const wellRadius = config.voidRadius * 0.45;
  const exitReach = t.wallRadius + config.segmentLength * 0.45;

  const lerp3 = (a, b) => (u) => [
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
  ];

  const start = [thresholdX - config.segmentLength * 0.9, eye, 0];
  const anchor = [anchorX, eye, 0];
  const stairTop = helixAt(0);

  const approach = pathLeg(lerp3(start, anchor), 8);
  const corridorFold = foldLeg(
    Math.max(
      period,
      Math.round((config.tourMovingSegments * config.segmentLength) / period) *
        period
    ),
    (d) => ({ x: -(d % period), y: 0, z: 0, spin: 0 })
  );
  const intoRoom = pathLeg(lerp3(anchor, stairTop), 16);
  const descend = pathLeg((u) => helixAt(u * anchorFlight), 256);

  // Vertical drop per metre travelled, chosen so the screw carries a point at
  // the camera's radius past it at exactly one metre per metre. Anything else
  // is a change of speed at the hand-off, which is the one thing that would
  // give the fold away.
  const dropRate =
    1 / Math.hypot(1, (pathRadius * pattern.totalArc) / patternRise);
  const foldDrop = Math.max(
    patternRise,
    Math.round((config.tourMovingFlights * t.landingDrop) / patternRise) *
      patternRise
  );
  const stairFold = foldLeg(foldDrop / dropRate, (d) => {
    const phase = (d * dropRate) % patternRise;
    return {
      x: 0,
      y: phase,
      z: 0,
      spin: (phase / patternRise) * pattern.totalArc,
    };
  });

  const toFloor = pathLeg(
    (u) => helixAt(anchorFlight + u * (lastFlight - anchorFlight)),
    256
  );

  // Out along the exit's own bearing: leaving the well on any other heading
  // meets the doorway side-on and clips its jamb.
  const floorEye = floorY + eye;
  const onBearing = (radius) => [
    Math.cos(exit.angle) * radius,
    floorEye,
    Math.sin(exit.angle) * radius,
  ];
  const acrossFloor = pathLeg(
    lerp3(helixAt(lastFlight), onBearing(wellRadius)),
    16
  );
  const outExit = pathLeg(
    lerp3(onBearing(wellRadius), onBearing(exitReach)),
    16
  );

  const legs = [
    approach,
    corridorFold,
    intoRoom,
    descend,
    stairFold,
    toFloor,
    acrossFloor,
    outExit,
  ];

  const layout = {
    tour: t,
    pattern,
    eye,
    hide,
    period,
    thresholdX,
    corridorStart,
    corridorSegments,
    roomPlane,
    anchorX,
    anchorDrop: repeatsAbove * patternRise,
    repeats,
    flightsPerPattern,
    patternRise,
    stairAngle,
    pathRadius,
    floorY,
    wellRadius,
    exitReach,
    exits,
  };

  return finish(legs, layout);
}

export { TAU };
