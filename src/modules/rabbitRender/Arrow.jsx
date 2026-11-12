import React, { forwardRef, useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import {
  EMBED_DEPTH,
  FLETCH_HEIGHT,
  FLETCH_INSET,
  FLETCH_LENGTH,
  RIBBON_TIE_INSET,
  RIBBON_WIDTH,
  RIBBON_WRAP_RADIUS,
  SHAFT_RADIUS,
} from '@modules/rabbit';

const VANES = 3;
const HULL = { plot: false };
const SHEET = { doubleSided: true };
const WRAP = { doubleSided: true, plotPart: 'ribbon' };
const BARBS = 22;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// A ragged feather: barbs of uneven length raked back toward the nock, low
// at the leading edge and fullest near the back.
function vaneGeometry(seed) {
  const rand = seeded(seed);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let i = 0; i < BARBS; i += 1) {
    const t = (i + 0.5) / BARBS;
    const profile =
      Math.min(1, t * 1.4) ** 0.7 * (1 - Math.max(0, t - 0.88) * 5);
    const barb = FLETCH_HEIGHT * profile * (0.75 + rand() * 0.55);
    const rake = (FLETCH_LENGTH / BARBS) * (1.2 + rand() * 1.2);
    shape.lineTo(barb * (0.45 + rand() * 0.2), FLETCH_LENGTH * (i / BARBS));
    shape.lineTo(barb, FLETCH_LENGTH * t + rake);
  }
  shape.lineTo(0, FLETCH_LENGTH);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.translate(SHAFT_RADIUS * 0.6, 0, 0);
  return geometry;
}

function createArrowGeometries(length, seed) {
  const shaftLength = length + EMBED_DEPTH;
  const shaft = new THREE.CylinderGeometry(
    SHAFT_RADIUS,
    SHAFT_RADIUS,
    shaftLength,
    10
  );
  shaft.translate(0, shaftLength / 2 - EMBED_DEPTH, 0);
  const nock = new THREE.CylinderGeometry(
    SHAFT_RADIUS * 1.15,
    SHAFT_RADIUS * 1.15,
    0.008,
    10
  );
  nock.translate(0, length - 0.004, 0);
  const vanes = Array.from({ length: VANES }, (_, i) => vaneGeometry(seed + i));
  const tie = new THREE.CylinderGeometry(
    RIBBON_WRAP_RADIUS,
    RIBBON_WRAP_RADIUS,
    RIBBON_WIDTH,
    20,
    1,
    true
  );
  tie.translate(0, length - RIBBON_TIE_INSET, 0);
  [nock, shaft, tie, ...vanes].forEach((geometry, index) => {
    geometry.setAttribute(
      'arrowIdentity',
      new THREE.Float32BufferAttribute(
        new Float32Array(geometry.attributes.position.count).fill(
          seed * 64 + index
        ),
        1
      )
    );
  });
  return { nock, shaft, tie, vanes };
}

const Arrow = forwardRef(function Arrow(
  { length, materials, outlineMaterial, ribbon, seed },
  ref
) {
  const geometries = useMemo(
    () => createArrowGeometries(length, seed),
    [length, seed]
  );
  useEffect(
    () => () => {
      const { vanes, ...rest } = geometries;
      [...vanes, ...Object.values(rest)].forEach((g) => g.dispose());
    },
    [geometries]
  );
  const vaneY = length - FLETCH_INSET - FLETCH_LENGTH;

  return (
    <group ref={ref}>
      <mesh castShadow geometry={geometries.shaft} material={materials.shaft} />
      <mesh
        geometry={geometries.shaft}
        material={outlineMaterial}
        userData={HULL}
      />
      <mesh geometry={geometries.nock} material={materials.nock} />
      {geometries.vanes.map((vane, i) => (
        <mesh
          castShadow
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          geometry={vane}
          material={materials.fletching}
          position-y={vaneY}
          rotation-y={(i / VANES) * Math.PI * 2 + seed}
          userData={SHEET}
        />
      ))}
      {ribbon && (
        <mesh
          geometry={geometries.tie}
          material={materials.tie}
          userData={WRAP}
        />
      )}
    </group>
  );
});

export default Arrow;
