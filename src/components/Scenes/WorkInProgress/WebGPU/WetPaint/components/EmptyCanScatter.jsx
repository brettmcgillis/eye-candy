import * as THREE from 'three';

import React, { memo, useMemo } from 'react';

import InstancedSprayCanSeparated, {
  Instances,
} from '../../../../../elements/SprayCanSeparated/InstancedSprayCanSeparated';
import { REALISTIC_CAN_SCALE, createSeededRandom } from '../utils/sceneUtils';

// Can diameter is ~0.073m at REALISTIC_CAN_SCALE — six-pack spacing sits
// just wide enough that cans read as packed together without intersecting.
const PACK_SPACING = 0.082;
const PACK_GAP = 1.1;

function randomCanColor(rng) {
  // Bias away from near-black/near-white so discarded cans read as "used up"
  // spray colors rather than random muddy grey.
  return new THREE.Color().setHSL(rng.next(), 0.75, 0.3 + rng.next() * 0.35);
}

// Day preset: cans grouped like six-packs on the sidewalk (todo item 45) —
// 2x3 grids, packs spaced along the curb, each pack slightly rotated so the
// rows don't read as a machine-perfect lattice.
function buildSixPacks({ count, curbLength, seed }) {
  const rng = createSeededRandom(seed);
  const packCount = Math.ceil(count / 6);
  const totalSpan = (packCount - 1) * PACK_GAP;
  const cans = [];

  for (let pack = 0; pack < packCount; pack += 1) {
    const packX = -totalSpan / 2 + pack * PACK_GAP + rng.range(-0.1, 0.1);
    const packZ = rng.range(-0.15, 0.15);
    const packYaw = rng.range(0, Math.PI * 2);
    const cos = Math.cos(packYaw);
    const sin = Math.sin(packYaw);

    for (let i = pack * 6; i < Math.min(count, pack * 6 + 6); i += 1) {
      const slot = i % 6;
      const localX = ((slot % 3) - 1) * PACK_SPACING;
      const localZ = (Math.floor(slot / 3) - 0.5) * PACK_SPACING;
      cans.push({
        key: `can-${i}`,
        position: [
          packX + localX * cos - localZ * sin,
          0,
          packZ + localX * sin + localZ * cos,
        ],
        rotation: [0, rng.range(0, Math.PI * 2), 0],
        color: randomCanColor(rng),
        scale: REALISTIC_CAN_SCALE * rng.range(0.96, 1.04),
      });
    }
  }

  // Guard against packs drifting past the curb on high counts.
  return cans.filter((can) => Math.abs(can.position[0]) < curbLength / 2);
}

function buildLitter({ count, curbLength, seed }) {
  const rng = createSeededRandom(seed);

  return Array.from({ length: count }, (_, i) => {
    const tipped = rng.next() < 0.6;
    return {
      key: `can-${i}`,
      position: [
        rng.range(-curbLength / 2, curbLength / 2),
        tipped ? 0.03 : 0,
        rng.range(-0.3, 1.2),
      ],
      rotation: tipped
        ? [Math.PI / 2, rng.range(0, Math.PI * 2), 0]
        : [0, rng.range(0, Math.PI * 2), 0],
      color: randomCanColor(rng),
      scale: REALISTIC_CAN_SCALE * rng.range(0.94, 1.06),
    };
  });
}

// Empty cans on the sidewalk. Day preset: tidy six-packs. Night preset:
// knocked around like litter. Seeded so layouts are reproducible across
// reloads. Each can gets its own leftover color, reflected in its body/ring
// tint AND its slider positions (todo item 35).
function EmptyCanScatter({
  count = 6,
  curbLength = 10,
  layout = 'neat',
  position = [0, 0, 0],
  seed = 1,
}) {
  const cans = useMemo(() => {
    const builder = layout === 'litter' ? buildLitter : buildSixPacks;
    return builder({ count, curbLength, seed });
  }, [count, curbLength, layout, seed]);

  return (
    <group position={position}>
      <Instances>
        {cans.map((can) => (
          <InstancedSprayCanSeparated
            key={can.key}
            position={can.position}
            rotation={can.rotation}
            scale={can.scale}
            color={can.color}
            sliderValues={{ r: can.color.r, g: can.color.g, b: can.color.b }}
          />
        ))}
      </Instances>
    </group>
  );
}

export default memo(EmptyCanScatter);
