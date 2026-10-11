/* eslint-disable no-param-reassign */
import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { Shape, ShapeGeometry } from 'three';

import { QUANT } from '../../utils/quantize';

const HIDE_AFTER_MS = 300;
const EASE = 0.4;
const Z = 15;

function roundedRect(width, height, radius) {
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new ShapeGeometry(shape, 6);
}

function Eraser({ eraserRef, rectRef }) {
  const groupRef = useRef(null);
  const shown = useRef({ angle: 0, u: 0, v: 0 });
  const parts = useMemo(
    () => ({
      edge: roundedRect(1.5, 1.05, 0.22),
      face: roundedRect(1.3, 0.78, 0.18),
      shadow: roundedRect(1.5, 1.05, 0.22),
    }),
    []
  );

  useFrame(() => {
    const group = groupRef.current;
    const latest = eraserRef.current;
    if (!group) return;
    const live = latest && performance.now() - latest.at < HIDE_AFTER_MS;
    group.visible = Boolean(live);
    if (!live) return;
    const s = shown.current;
    if (latest.fresh) {
      Object.assign(s, { angle: latest.a, u: latest.u, v: latest.v });
      latest.fresh = false;
    }
    s.u += (latest.u - s.u) * EASE;
    s.v += (latest.v - s.v) * EASE;
    s.angle += (latest.a - s.angle) * EASE;
    const rect = rectRef.current;
    const [x, y] = rect.toWorld(s.u, s.v);
    group.position.set(x, y, Z);
    group.rotation.z = -s.angle;
    group.scale.setScalar(2 * latest.radius * rect.size);
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={parts.shadow} position={[0.08, -0.08, 0]}>
        <meshBasicMaterial color="#000000" opacity={0.25} transparent />
      </mesh>
      <mesh geometry={parts.edge} position-z={0.1}>
        <meshBasicMaterial color="#e2688a" toneMapped={false} />
      </mesh>
      <mesh geometry={parts.face} position={[0, 0.06, 0.2]}>
        <meshBasicMaterial color="#ff9fb8" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function trackEraserOp(eraserRef, op, gridSize) {
  const n = op.p.length;
  const previous = eraserRef.current;
  eraserRef.current = {
    a: op.a,
    at: performance.now(),
    fresh: !previous || performance.now() - previous.at > HIDE_AFTER_MS,
    radius: op.r / gridSize,
    u: op.p[n - 2] / QUANT,
    v: op.p[n - 1] / QUANT,
  };
}

export default memo(Eraser);
