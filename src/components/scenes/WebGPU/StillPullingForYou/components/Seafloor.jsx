// SeafloorGPU — WebGPU/TSL port of the WebGL Seafloor component.
// The WebGL version injects GLSL via onBeforeCompile which is not supported by
// WebGPURenderer. This version uses MeshStandardNodeMaterial + TSL colorNode
// for the same height-gradient colour effect.
import React, { useEffect, useMemo } from 'react';

import { NURBSSurface, ParametricGeometry } from 'three-stdlib';
import { clamp, mix, positionLocal, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// ── Constants ─────────────────────────────────────────────────────────────────

const SEGMENTS = 20;
// Top of the seafloor aligns with the water column bottom (waterHeight / 2 = 1.0)
const TOP_Y = -1.0;

// ── Geometry builders (identical logic to WebGL Seafloor) ─────────────────────

function buildTopSurface(hw, hd, topY) {
  const knots = [0, 0, 0, 0, 1, 1, 1, 1];
  // u reversed (+hw → −hw) so cross(du,dv) faces +Y
  const xs = [hw, hw / 3, -hw / 3, -hw];
  const zs = [-hd, -hd / 3, hd / 3, hd];
  const cp = xs.map((x) => zs.map((z) => new THREE.Vector4(x, topY, z, 1)));
  return new NURBSSurface(3, 3, knots, knots, cp);
}

function buildBottomSurface(hw, hd, botY) {
  const knots = [0, 0, 0, 0, 1, 1, 1, 1];
  const xs = [-hw, -hw / 3, hw / 3, hw];
  const zs = [-hd, -hd / 3, hd / 3, hd];
  const cp = xs.map((x) => zs.map((z) => new THREE.Vector4(x, botY, z, 1)));
  return new NURBSSurface(3, 3, knots, knots, cp);
}

function buildSideSurface(uVals, getPos, botY, topY) {
  const knotsU = [0, 0, 0, 0, 1, 1, 1, 1];
  const knotsV = [0, 0, 0, 1, 1, 1];
  const midY = (botY + topY) / 2;

  const cp = uVals.map((uVal) => {
    const b = getPos(uVal, botY);
    const t = getPos(uVal, topY);
    return [
      new THREE.Vector4(b.x, b.y, b.z, 1),
      new THREE.Vector4((b.x + t.x) / 2, midY, (b.z + t.z) / 2, 1),
      new THREE.Vector4(t.x, t.y, t.z, 1),
    ];
  });

  return new NURBSSurface(3, 2, knotsU, knotsV, cp);
}

function buildAllSurfaces({ width, depth, height, topY }) {
  const hw = width / 2;
  const hd = depth / 2;
  const botY = topY - height;

  return {
    top: buildTopSurface(hw, hd, topY),
    bottom: buildBottomSurface(hw, hd, botY),
    front: buildSideSurface(
      [-hw, -hw / 3, hw / 3, hw],
      (x, y) => ({ x, y, z: hd }),
      botY,
      topY
    ),
    back: buildSideSurface(
      [hw, hw / 3, -hw / 3, -hw],
      (x, y) => ({ x, y, z: -hd }),
      botY,
      topY
    ),
    right: buildSideSurface(
      [hd, hd / 3, -hd / 3, -hd],
      (z, y) => ({ x: hw, y, z }),
      botY,
      topY
    ),
    left: buildSideSurface(
      [-hd, -hd / 3, hd / 3, hd],
      (z, y) => ({ x: -hw, y, z }),
      botY,
      topY
    ),
  };
}

// Layered sine bumps for organic terrain — fades to 0 at edges
function seafloorBump(x, z, hw, hd, bumpHeight, freq, detail) {
  const ex = 1 - (Math.abs(x) / hw) ** 4;
  const ez = 1 - (Math.abs(z) / hd) ** 4;
  const fade = Math.max(0, ex * ez);

  const f = freq;
  const bump =
    Math.sin(x * 3.2 * f + 0.5) * Math.cos(z * 2.8 * f + 1.1) * bumpHeight +
    Math.sin(x * 7.1 * f + z * 5.3 * f) * bumpHeight * 0.5 * detail +
    Math.sin(x * 13 * f - z * 11 * f) * bumpHeight * 0.19 * detail;
  return bump * fade;
}

function buildGeometries(surfaces, segments, height, maxDim, hw, hd, bump) {
  const topSegs = segments * 2;
  const heightSegs = Math.max(8, Math.round(segments * (height / maxDim)));
  const lowSegs = Math.max(4, Math.round(segments / 4));
  const evalFn = (surface) => (u, v, target) => surface.getPoint(u, v, target);

  // Build top with post-displacement bumps
  const topGeo = new ParametricGeometry(evalFn(surfaces.top), topSegs, topSegs);
  const pos = topGeo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(
      i,
      pos.getY(i) +
        seafloorBump(x, z, hw, hd, bump.height, bump.freq, bump.detail)
    );
  }
  topGeo.computeVertexNormals();

  return [
    topGeo,
    new ParametricGeometry(evalFn(surfaces.bottom), lowSegs, lowSegs),
    new ParametricGeometry(evalFn(surfaces.front), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.back), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.right), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.left), segments, heightSegs),
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Seafloor({
  visible,
  color,
  width = 4.0,
  depth = 4.0,
  height = 0.6,
  bumpHeight = 0.08,
  bumpFrequency = 1.0,
  bumpDetail = 1.0,
}) {
  // ── TSL uniform nodes ──────────────────────────────────────────────────────
  const u = useMemo(
    () => ({
      colTop: uniform(TOP_Y),
      colBot: uniform(TOP_Y - height),
      topColor: uniform(new THREE.Color(color)),
      botColor: uniform(new THREE.Color(color).multiplyScalar(0.55)),
    }),
    [] // created once — values updated imperatively in useEffect
  );

  useEffect(() => {
    u.colTop.value = TOP_Y;
    u.colBot.value = TOP_Y - height;
    u.topColor.value.set(color);
    u.botColor.value.set(color).multiplyScalar(0.55);
  }, [color, height, u]);

  // ── TSL material with height-gradient colorNode ────────────────────────────
  const material = useMemo(() => {
    const normY = clamp(
      positionLocal.y.sub(u.colBot).div(u.colTop.sub(u.colBot)),
      0.0,
      1.0
    );

    const mat = new THREE.MeshStandardNodeMaterial({
      roughness: 0.95,
      metalness: 0.05,
    });
    mat.colorNode = mix(u.botColor, u.topColor, normY);
    return mat;
  }, [u]);

  // ── NURBS geometries ───────────────────────────────────────────────────────
  const geometries = useMemo(() => {
    const surfaces = buildAllSurfaces({ width, depth, height, topY: TOP_Y });
    const hw = width / 2;
    const hd = depth / 2;
    const bump = {
      height: bumpHeight,
      freq: bumpFrequency,
      detail: bumpDetail,
    };
    return buildGeometries(
      surfaces,
      SEGMENTS,
      height,
      Math.max(width, depth),
      hw,
      hd,
      bump
    );
  }, [width, depth, height, bumpHeight, bumpFrequency, bumpDetail]);

  if (!visible) return null;

  return (
    <group>
      {geometries.map((geo, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <mesh key={idx} geometry={geo} material={material} receiveShadow />
      ))}
    </group>
  );
}
