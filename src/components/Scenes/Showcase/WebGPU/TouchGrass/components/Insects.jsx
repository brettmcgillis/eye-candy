import * as THREE from 'three';

import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import Bee2 from '../../../../../elements/Bee2/Bee2';
import Butterfly from '../../../../../elements/Butterfly/Butterfly';
import { hash01 } from '../utils/noise2d';

const BUTTERFLY_COUNT = 10;
const BEE_COUNT = 6;

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
      anchorStride: 1 + Math.floor(hash01(i, 83, config.seed + seedOffset) * 5),
      driftPhase: hash01(i, 31, config.seed + seedOffset) * Math.PI * 2,
      flapPhase: hash01(i, 37, config.seed + seedOffset) * Math.PI * 2,
      ground,
      hoverHeight: minHeight + hash01(i, 41, config.seed + seedOffset) * span,
      radius: 0.3 + hash01(i, 47, config.seed + seedOffset) * 0.9,
      speed: 0.35 + hash01(i, 53, config.seed + seedOffset) * 0.7,
      x,
      z,
      carve,
    });
  }

  return placements.filter((placement) => placement.carve < 0.16);
}

function ButterflySwarm({ config, heightField }) {
  const refs = useRef([]);
  const placements = useMemo(
    () =>
      buildPlacements({
        config,
        count: BUTTERFLY_COUNT,
        heightField,
        minHeight: 0.55,
        seedOffset: 1301,
        span: 0.8,
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
        scale={1.25}
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
  const placements = useMemo(
    () =>
      buildPlacements({
        config,
        count: BEE_COUNT,
        heightField,
        minHeight: 0.75,
        seedOffset: 1901,
        span: 0.65,
      }),
    [config, heightField]
  );

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
        const routeRate = 0.2 + placement.speed * 0.16;
        const routeTime = elapsed * routeRate + placement.driftPhase;
        const hop = Math.floor(routeTime);
        const fromIndex =
          (placement.anchorStart + hop * placement.anchorStride) %
          flowerAnchors.length;
        const toIndex =
          (fromIndex + placement.anchorJump) % flowerAnchors.length;
        const from = flowerAnchors[fromIndex];
        const to = flowerAnchors[toIndex];
        const rawT = routeTime - hop;
        const t = rawT * rawT * (3 - 2 * rawT);

        const buzzX =
          Math.sin(elapsed * 14 + placement.flapPhase) * 0.03 +
          Math.sin(elapsed * 27 + placement.driftPhase) * 0.015;
        const buzzZ =
          Math.cos(elapsed * 13 + placement.flapPhase) * 0.03 +
          Math.cos(elapsed * 25 + placement.driftPhase) * 0.015;

        x = THREE.MathUtils.lerp(from.x, to.x, t) + buzzX;
        z = THREE.MathUtils.lerp(from.z, to.z, t) + buzzZ;
        y =
          THREE.MathUtils.lerp(from.y, to.y, t) +
          placement.hoverHeight +
          Math.sin(elapsed * (6 + placement.speed) + placement.flapPhase) *
            0.045;

        const dx = to.x - from.x;
        const dz = to.z - from.z;
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
      <ButterflySwarm config={config} heightField={heightField} />
      <BeeSwarm config={config} heightField={heightField} />
    </group>
  );
}

export default memo(Insects);
