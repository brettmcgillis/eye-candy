import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { FISH_TANK_PANE_KEYS } from '@elements/fishTank/FishTank';

const SHARD_LIFETIME_SECONDS = 1.2;
const SHARD_LAYOUTS = [
  {
    id: 'upper-left',
    burst: 0.6,
    drift: -0.05,
    lift: 0.58,
    offsetX: -0.18,
    offsetY: 0.14,
    scaleX: 0.16,
    scaleY: 0.18,
    spinX: 2.1,
    spinY: -1.4,
    spinZ: 1.2,
  },
  {
    id: 'upper-mid-left',
    burst: 0.72,
    drift: 0.02,
    lift: 0.66,
    offsetX: -0.05,
    offsetY: 0.28,
    scaleX: 0.12,
    scaleY: 0.16,
    spinX: -2.4,
    spinY: 1.7,
    spinZ: -1.5,
  },
  {
    id: 'center-mid',
    burst: 0.84,
    drift: 0.08,
    lift: 0.61,
    offsetX: 0.08,
    offsetY: 0.08,
    scaleX: 0.14,
    scaleY: 0.14,
    spinX: 1.9,
    spinY: 2.3,
    spinZ: 1.6,
  },
  {
    id: 'right-mid',
    burst: 0.68,
    drift: -0.09,
    lift: 0.52,
    offsetX: 0.18,
    offsetY: -0.02,
    scaleX: 0.11,
    scaleY: 0.13,
    spinX: -1.7,
    spinY: -2.1,
    spinZ: 1.4,
  },
  {
    id: 'lower-left',
    burst: 0.57,
    drift: 0.11,
    lift: 0.49,
    offsetX: -0.12,
    offsetY: -0.18,
    scaleX: 0.13,
    scaleY: 0.15,
    spinX: 1.4,
    spinY: -1.9,
    spinZ: -1.8,
  },
  {
    id: 'upper-right',
    burst: 0.76,
    drift: 0.04,
    lift: 0.72,
    offsetX: 0.14,
    offsetY: 0.22,
    scaleX: 0.09,
    scaleY: 0.12,
    spinX: -2.2,
    spinY: 1.2,
    spinZ: 2.2,
  },
];

const PANE_FRAMES = {
  back: {
    lateral: [1, 0, 0],
    normal: [0, 0, -1],
    rotationY: Math.PI,
  },
  front: {
    lateral: [1, 0, 0],
    normal: [0, 0, 1],
    rotationY: 0,
  },
  left: {
    lateral: [0, 0, 1],
    normal: [-1, 0, 0],
    rotationY: -Math.PI / 2,
  },
  right: {
    lateral: [0, 0, 1],
    normal: [1, 0, 0],
    rotationY: Math.PI / 2,
  },
};

export default function GlassShards({ runtime, tank }) {
  const shardRefs = useRef({});

  useFrame(() => {
    const nowSeconds = performance.now() / 1000;

    FISH_TANK_PANE_KEYS.forEach((paneKey) => {
      const paneShards = shardRefs.current[paneKey] ?? [];
      const breakEvent = runtime?.getPaneBreakEvent(paneKey);

      if (!paneShards.length || !breakEvent?.id) {
        paneShards.forEach((shard) => {
          const fragment = shard;

          if (fragment) {
            fragment.visible = false;
          }
        });
        return;
      }

      const elapsed = nowSeconds - breakEvent.atSeconds;

      if (elapsed < 0 || elapsed > SHARD_LIFETIME_SECONDS) {
        paneShards.forEach((shard) => {
          const fragment = shard;

          if (fragment) {
            fragment.visible = false;
          }
        });
        return;
      }

      const frame = PANE_FRAMES[paneKey];
      const [baseX, baseY, baseZ] = breakEvent.point;

      paneShards.forEach((shard, index) => {
        const layout = SHARD_LAYOUTS[index];
        const fragment = shard;

        if (!fragment || !layout) {
          return;
        }

        const gravityDrop = elapsed * elapsed * 1.75;
        const x =
          baseX +
          frame.lateral[0] * (layout.offsetX + layout.drift * elapsed) +
          frame.normal[0] * layout.burst * elapsed;
        const y = baseY + layout.offsetY + layout.lift * elapsed - gravityDrop;
        const z =
          baseZ +
          frame.lateral[2] * (layout.offsetX + layout.drift * elapsed) +
          frame.normal[2] * layout.burst * elapsed;

        fragment.visible = true;
        fragment.position.set(x, y, z);
        fragment.rotation.set(
          layout.spinX * elapsed,
          frame.rotationY + layout.spinY * elapsed,
          layout.spinZ * elapsed
        );
        fragment.scale.set(
          layout.scaleX,
          layout.scaleY,
          tank.glassThickness * 0.3
        );
      });
    });
  });

  return FISH_TANK_PANE_KEYS.flatMap((paneKey) =>
    SHARD_LAYOUTS.map((layout, index) => (
      <mesh
        key={`glass-shard-${paneKey}-${layout.id}`}
        ref={(node) => {
          if (!shardRefs.current[paneKey]) {
            shardRefs.current[paneKey] = [];
          }

          shardRefs.current[paneKey][index] = node;
        }}
        castShadow
        receiveShadow
        visible={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={tank.glassColor}
          metalness={0.08}
          opacity={Math.min(tank.glassOpacity + 0.14, 0.38)}
          roughness={0.06}
          transparent
        />
      </mesh>
    ))
  );
}
