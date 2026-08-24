import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import Bee2 from '@elements/Bee2/Bee2';
import Butterfly from '@elements/Butterfly/Butterfly';
import Dragonfly from '@elements/Dragonfly/Dragonfly';
import { hash01 } from '@utils/noise2d';

const BUTTERFLY_COUNT = 10;
const BEE_COUNT = 6;
const DRAGONFLY_COUNT = 5;

function buildFlowerAnchors({ config, heightField }) {
  const anchors = [];
  const half = heightField.worldSize * 0.5;
  const target = Math.max(2, Math.floor(config.flowerCount ?? 0));
  const attempts = target * 8;

  for (let i = 0; i < attempts && anchors.length < target; i += 1) {
    const x = (hash01(i, 17, config.seed + 911) * 2 - 1) * half;
    const z = (hash01(i, 29, config.seed + 977) * 2 - 1) * half;
    const carve = heightField.sampleCarve(x, z);
    if (carve < 0.12) {
      anchors.push({
        x,
        y: heightField.sampleHeight(x, z),
        z,
      });
    }
  }

  return anchors;
}

function buildPlacements({
  count,
  config,
  heightField,
  seedOffset,
  minHeight,
  span,
}) {
  const placements = [];
  const half = heightField.worldSize * 0.42;

  for (let i = 0; i < count; i += 1) {
    const x = (hash01(i, 11, config.seed + seedOffset) * 2 - 1) * half;
    const z = (hash01(i, 23, config.seed + seedOffset) * 2 - 1) * half;
    const carve = heightField.sampleCarve(x, z);
    const ground = heightField.sampleHeight(x, z);

    placements.push({
      animationOffset: hash01(i, 59, config.seed + seedOffset) * 2.2,
      animationSpeed: 0.85 + hash01(i, 67, config.seed + seedOffset) * 0.35,
      anchorJump: 1 + Math.floor(hash01(i, 73, config.seed + seedOffset) * 4),
      anchorStart: Math.floor(hash01(i, 79, config.seed + seedOffset) * 1024),
      driftPhase: hash01(i, 31, config.seed + seedOffset) * Math.PI * 2,
      flapPhase: hash01(i, 37, config.seed + seedOffset) * Math.PI * 2,
      ground,
      hoverHeight: minHeight + hash01(i, 41, config.seed + seedOffset) * span,
      radius: 0.3 + hash01(i, 47, config.seed + seedOffset) * 0.9,
      speed: 0.35 + hash01(i, 53, config.seed + seedOffset) * 0.7,
      hoverDuration: hash01(i, 91, config.seed + seedOffset),
      travelDuration: hash01(i, 97, config.seed + seedOffset),
      x,
      z,
      carve,
    });
  }

  return placements.filter((placement) => placement.carve < 0.16);
}

// Shared hover-in-place / straight-line-dash / hover-in-place cycle. `points`
// is the fixed set of stops (flower anchors, patrol waypoints, ...); each
// hop's start is the previous hop's end (chained by a single `anchorJump`
// stride) so the dash always continues from wherever the hover left off,
// instead of jumping to an unrelated point.
function resolveHopMotion({
  anchorJump,
  anchorStart,
  elapsed,
  hoverDuration,
  phase,
  points,
  travelDuration,
}) {
  const pointCount = points.length;
  const cycleDuration = hoverDuration + travelDuration;
  const local = elapsed + phase;
  const hop = Math.floor(local / cycleDuration);
  const t = local - hop * cycleDuration;
  const fromIndex = (anchorStart + hop * anchorJump) % pointCount;
  const toIndex = (fromIndex + anchorJump) % pointCount;
  const from = points[fromIndex];
  const to = points[toIndex];

  if (t < hoverDuration) {
    return { from, hovering: true, progress: t / hoverDuration, to };
  }

  const travelT = (t - hoverDuration) / travelDuration;
  const eased = travelT * travelT * (3 - 2 * travelT);
  return { eased, from, hovering: false, to };
}

// Small deterministic patrol loop around each dragonfly's own origin so it
// hovers, picks a nearby point, and dashes there in a straight line.
function buildPatrolPoints({ heightField, originX, originZ, seed }) {
  const points = [];
  const patrolRadius = 0.8 + hash01(0, 13, seed) * 0.6;

  for (let i = 0; i < 5; i += 1) {
    const angle = hash01(i, 101, seed) * Math.PI * 2;
    const dist = 0.25 + hash01(i, 103, seed) * patrolRadius;
    const x = originX + Math.cos(angle) * dist;
    const z = originZ + Math.sin(angle) * dist;
    points.push({ x, y: heightField.sampleHeight(x, z), z });
  }

  return points;
}

function ButterflySwarm({ config, heightField }) {
  const refs = useRef([]);
  const placements = useMemo(
    () =>
      buildPlacements({
        config,
        count: BUTTERFLY_COUNT,
        heightField,
        minHeight: 1.4,
        seedOffset: 1301,
        span: 0.35,
      }),
    [config, heightField]
  );

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    placements.forEach((placement, index) => {
      const group = refs.current[index];
      if (!group) {
        return;
      }

      const angle = elapsed * placement.speed + placement.driftPhase;
      const x = placement.x + Math.cos(angle) * placement.radius;
      const z = placement.z + Math.sin(angle * 0.9) * placement.radius * 0.6;
      const y =
        placement.ground +
        placement.hoverHeight +
        Math.sin(elapsed * (2.4 + placement.speed) + placement.driftPhase) *
          0.12;

      group.position.set(x, y, z);
      group.rotation.y = -angle + Math.PI * 0.5;
      group.rotation.z = Math.sin(elapsed * 3.2 + placement.flapPhase) * 0.08;
    });
  });

  return placements.map((placement, index) => (
    <group
      key={`butterfly-${placement.x.toFixed(2)}-${placement.z.toFixed(2)}-${placement.driftPhase.toFixed(3)}`}
      ref={(node) => {
        refs.current[index] = node;
      }}
    >
      <Butterfly
        animationOffset={placement.animationOffset}
        animationSpeed={placement.animationSpeed * 1.35}
        scale={2}
      />
    </group>
  ));
}

const DRAGONFLY_TURN_RATE = 6; // rad/sec — fast but not an instant snap

function shortestAngleDelta(target, current) {
  const twoPi = Math.PI * 2;
  let diff = (target - current) % twoPi;
  if (diff > Math.PI) {
    diff -= twoPi;
  } else if (diff < -Math.PI) {
    diff += twoPi;
  }
  return diff;
}

function DragonflySwarm({ config, heightField }) {
  const refs = useRef([]);
  const headingRefs = useRef([]);
  const placements = useMemo(() => {
    const base = buildPlacements({
      config,
      count: DRAGONFLY_COUNT,
      heightField,
      minHeight: 1.0,
      seedOffset: 2503,
      span: 0.3,
    });

    return base.map((placement, index) => ({
      ...placement,
      // Hover a beat, then dart to the next patrol point in a straight line.
      hoverDuration: 0.8 + placement.hoverDuration * 1.2,
      points: buildPatrolPoints({
        heightField,
        originX: placement.x,
        originZ: placement.z,
        seed: config.seed + 2503 + index * 97,
      }),
      travelDuration: 0.35 + placement.travelDuration * 0.35,
    }));
  }, [config, heightField]);

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    placements.forEach((placement, index) => {
      const group = refs.current[index];
      if (!group) {
        return;
      }

      const hop = resolveHopMotion({
        anchorJump: placement.anchorJump,
        anchorStart: placement.anchorStart,
        elapsed,
        hoverDuration: placement.hoverDuration,
        phase: placement.driftPhase,
        points: placement.points,
        travelDuration: placement.travelDuration,
      });

      let x;
      let z;
      const targetHeading = Math.atan2(
        hop.to.x - hop.from.x,
        hop.to.z - hop.from.z
      );
      const bobY =
        Math.sin(elapsed * (5 + placement.speed * 2) + placement.flapPhase) *
        0.03;

      if (hop.hovering) {
        // Tight, twitchy hover-in-place jitter — no drift toward the target.
        const jitterX =
          Math.sin(elapsed * 9 + placement.flapPhase) * 0.04 +
          Math.sin(elapsed * 17 + placement.driftPhase) * 0.02;
        const jitterZ =
          Math.cos(elapsed * 8 + placement.flapPhase) * 0.04 +
          Math.cos(elapsed * 15 + placement.driftPhase) * 0.02;
        x = hop.from.x + jitterX;
        z = hop.from.z + jitterZ;
      } else {
        x = THREE.MathUtils.lerp(hop.from.x, hop.to.x, hop.eased);
        z = THREE.MathUtils.lerp(hop.from.z, hop.to.z, hop.eased);
      }

      // Rate-limited turn: the target heading can jump between hops (the
      // next waypoint may sit back toward where it came from), but the body
      // always rotates toward it at a bounded rate instead of snapping.
      const currentHeading = headingRefs.current[index] ?? targetHeading;
      const turn = THREE.MathUtils.clamp(
        shortestAngleDelta(targetHeading, currentHeading),
        -DRAGONFLY_TURN_RATE * delta,
        DRAGONFLY_TURN_RATE * delta
      );
      const heading = currentHeading + turn;
      headingRefs.current[index] = heading;

      const y =
        THREE.MathUtils.lerp(
          hop.from.y,
          hop.to.y,
          hop.hovering ? 0 : hop.eased
        ) +
        placement.hoverHeight +
        bobY;

      group.position.set(x, y, z);
      group.rotation.y = heading;
      group.rotation.x = hop.hovering ? 0 : 0.12;
    });
  });

  return placements.map((placement, index) => (
    <group
      key={`dragonfly-${placement.x.toFixed(2)}-${placement.z.toFixed(2)}-${placement.driftPhase.toFixed(3)}`}
      ref={(node) => {
        refs.current[index] = node;
      }}
    >
      <Dragonfly
        animationOffset={placement.animationOffset}
        animationSpeed={placement.animationSpeed * 1.8}
        scale={1.2}
      />
    </group>
  ));
}

function BeeSwarm({ config, heightField }) {
  const refs = useRef([]);
  const flowerAnchors = useMemo(
    () => buildFlowerAnchors({ config, heightField }),
    [config, heightField]
  );
  const placements = useMemo(() => {
    const base = buildPlacements({
      config,
      count: BEE_COUNT,
      heightField,
      minHeight: 0.65,
      seedOffset: 1901,
      span: 0.25,
    });

    return base.map((placement) => ({
      ...placement,
      // Linger at the flower, then wander off to the next one.
      hoverDuration: 1.4 + placement.hoverDuration * 1.6,
      travelDuration: 0.6 + placement.travelDuration * 0.6,
    }));
  }, [config, heightField]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const hasRoute = flowerAnchors.length >= 2;

    placements.forEach((placement, index) => {
      const group = refs.current[index];
      if (!group) {
        return;
      }

      let { x } = placement;
      let { z } = placement;
      let y =
        placement.ground +
        placement.hoverHeight +
        Math.sin(elapsed * (4.5 + placement.speed) + placement.driftPhase) *
          0.06;
      let heading = elapsed * placement.speed;

      if (hasRoute) {
        const hop = resolveHopMotion({
          anchorJump: placement.anchorJump,
          anchorStart: placement.anchorStart,
          elapsed,
          hoverDuration: placement.hoverDuration,
          phase: placement.driftPhase,
          points: flowerAnchors,
          travelDuration: placement.travelDuration,
        });

        const buzzX =
          Math.sin(elapsed * 14 + placement.flapPhase) * 0.03 +
          Math.sin(elapsed * 27 + placement.driftPhase) * 0.015;
        const buzzZ =
          Math.cos(elapsed * 13 + placement.flapPhase) * 0.03 +
          Math.cos(elapsed * 25 + placement.driftPhase) * 0.015;

        const posT = hop.hovering ? 0 : hop.eased;
        x = THREE.MathUtils.lerp(hop.from.x, hop.to.x, posT) + buzzX;
        z = THREE.MathUtils.lerp(hop.from.z, hop.to.z, posT) + buzzZ;
        y =
          THREE.MathUtils.lerp(hop.from.y, hop.to.y, posT) +
          placement.hoverHeight +
          Math.sin(elapsed * (6 + placement.speed) + placement.flapPhase) *
            0.045;

        const dx = hop.to.x - hop.from.x;
        const dz = hop.to.z - hop.from.z;
        heading = Math.atan2(dx, dz);
      }

      group.position.set(x, y, z);
      group.rotation.y = heading;
      group.rotation.z = Math.sin(elapsed * 8 + placement.flapPhase) * 0.06;
    });
  });

  return placements.map((placement, index) => (
    <group
      key={`bee-${placement.x.toFixed(2)}-${placement.z.toFixed(2)}-${placement.anchorStart}`}
      ref={(node) => {
        refs.current[index] = node;
      }}
    >
      <Bee2
        animationOffset={placement.animationOffset}
        animationSpeed={placement.animationSpeed}
        scale={0.02}
      />
    </group>
  ));
}

function Insects({ config, heightField }) {
  return (
    <group>
      {(config.butterfliesEnabled ?? true) && (
        <ButterflySwarm config={config} heightField={heightField} />
      )}
      {(config.beesEnabled ?? true) && (
        <BeeSwarm config={config} heightField={heightField} />
      )}
      {(config.dragonfliesEnabled ?? true) && (
        <DragonflySwarm config={config} heightField={heightField} />
      )}
    </group>
  );
}

export default memo(Insects);
