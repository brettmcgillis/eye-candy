import React, { useEffect, useMemo } from 'react';

import { createRng } from '@modules/flora';
import {
  acquireWashTexture,
  createPigmentTexture,
} from '@modules/paintedRender';
import { radians } from '@utils/math';

import createCloudMaterial from './cloudMaterial';

export default function PaintedCloud({ controls: c }) {
  const pigment = useMemo(createPigmentTexture, []);
  const native = useMemo(acquireWashTexture, []);
  useEffect(() => () => native.dispose(), [native]);
  useEffect(() => () => pigment.dispose(), [pigment]);
  const puffs = useMemo(() => {
    const rng = createRng(String(c.cloudSeed));
    return Array.from({ length: Math.min(32, c.cloudSegments) }, (_, i) => ({
      id: i,
      position: [
        (rng() - 0.5) * c.cloudBoundsX * 2,
        (rng() - 0.5) * c.cloudBoundsY,
        (rng() - 0.5) * c.cloudBoundsZ,
      ],
      size: 0.9 + rng() * 1.2,
      rotation: (rng() - 0.5) * Math.PI,
    }));
  }, [
    c.cloudSeed,
    c.cloudSegments,
    c.cloudBoundsX,
    c.cloudBoundsY,
    c.cloudBoundsZ,
  ]);
  const materials = useMemo(
    () =>
      puffs.map(({ rotation, id }) => {
        const puff = createCloudMaterial(pigment, id + 1, c, native.map);
        puff.rotation = rotation;
        return puff;
      }),
    [
      pigment,
      native,
      puffs,
      c.cloudSeed,
      c.paintScale,
      c.paintBleed,
      c.paintPooling,
      c.paintInk,
      c.paintFollowPalette,
      c.paletteName,
      c.paletteExact,
      c.cloudColor,
      c.ringsPalette,
      c.ringsPaletteExact,
    ]
  );
  materials.forEach((puff, i) => {
    Object.assign(puff, { opacity: c.cloudOpacity * (0.8 + (i % 5) * 0.04) });
  });
  useEffect(
    () => () => materials.forEach((puff) => puff.dispose()),
    [materials]
  );
  return (
    <group
      position={[c.cloudPosition.x, c.cloudPosition.y, c.cloudPosition.z]}
      scale={c.cloudScale}
      rotation={[
        radians(c.cloudRotation.x),
        radians(c.cloudRotation.y),
        radians(c.cloudRotation.z),
      ]}
      userData={{ plotCloud: true }}
    >
      {puffs.map(({ id, position, size }) => (
        <sprite
          key={id}
          material={materials[id]}
          position={position}
          scale={[size, size * 0.8, 1]}
        />
      ))}
    </group>
  );
}
