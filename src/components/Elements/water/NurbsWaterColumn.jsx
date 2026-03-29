import * as THREE from 'three';
import {
  Line2,
  LineGeometry,
  LineMaterial,
  NURBSSurface,
  ParametricGeometry,
} from 'three-stdlib';

import React, { useMemo, useRef } from 'react';

import { extend, useFrame } from '@react-three/fiber';

extend({ Line2 });

// ── Gerstner wave constants (shared between GPU + CPU) ──────────────

const RAW_WAVES = [
  { dx: 0.6, dz: 0.8, freq: 1.2, amp: 1.0 },
  { dx: -0.4, dz: 0.9, freq: 2.5, amp: 0.4 },
  { dx: 0.9, dz: -0.3, freq: 3.8, amp: 0.2 },
  { dx: -0.7, dz: -0.6, freq: 5.0, amp: 0.1 },
];

const WAVES = RAW_WAVES.map((w) => {
  const len = Math.sqrt(w.dx * w.dx + w.dz * w.dz);
  return { dx: w.dx / len, dz: w.dz / len, freq: w.freq, amp: w.amp };
});

// Module-level wave time — kept in sync by the mounted component
let waveTime = 0;

// ── CPU-side wave sampling (matches GPU shader exactly) ─────────────

export function sampleWaveHeight(x, z, waveHeight, choppiness, waveSpeed) {
  let y = 0;
  for (let i = 0; i < WAVES.length; i += 1) {
    const { dx, dz, freq, amp } = WAVES[i];
    const a = amp * waveHeight;
    const phase = waveSpeed * freq;
    const theta = (dx * x + dz * z) * freq + waveTime * phase;
    y += a * Math.cos(theta);
  }
  return y;
}

export function sampleWaveNormal(x, z, waveHeight, choppiness, waveSpeed) {
  let nx = 0;
  let ny = 1;
  let nz = 0;
  for (let i = 0; i < WAVES.length; i += 1) {
    const { dx, dz, freq, amp } = WAVES[i];
    const a = amp * waveHeight;
    const Q = choppiness / (freq * a * WAVES.length);
    const phase = waveSpeed * freq;
    const theta = (dx * x + dz * z) * freq + waveTime * phase;
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const WA = freq * a;
    nx -= dx * WA * s;
    nz -= dz * WA * s;
    ny -= Q * WA * c;
  }
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  return { x: nx / len, y: ny / len, z: nz / len };
}

// ── GLSL: Gerstner wave displacement + normal ───────────────────────

const WAVE_PREAMBLE = /* glsl */ `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveChoppiness;
  uniform float uWaveSpeed;
  uniform float uColumnTop;
  uniform float uColumnBottom;

  varying float vNormHeight;

  // Y-only wave displacement — walls stay vertical, only top undulates
  vec3 nurbsWaveDisplace(vec3 pos) {
    float normY = clamp(
      (pos.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
    );
    // Only vertices near the top move (sides lerp from 0 at bottom to full at top)
    float blend = smoothstep(0.5, 1.0, normY);

    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    float heightDisp = 0.0;
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      heightDisp += amp * cos(theta);
    }

    // Only displace in Y — no horizontal shift keeps walls flush
    return vec3(0.0, heightDisp * blend, 0.0);
  }

  vec3 nurbsWaveNormal(vec3 pos) {
    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    vec3 n = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float Q = uWaveChoppiness / (freqs[i] * amp * 4.0);
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);
      float WA = freqs[i] * amp;
      n.x -= dirs[i].x * WA * s;
      n.z -= dirs[i].y * WA * s;
      n.y -= Q * WA * c;
    }
    return normalize(n);
  }
`;

// ── Shader chunk replacements ───────────────────────────────────────

const VERTEX_COMMON_REPLACE = /* glsl */ `
  #include <common>
  ${WAVE_PREAMBLE}
`;

const BEGINNORMAL_REPLACE = /* glsl */ `
  // Blend wave normals in for top-facing surfaces only
  float _isTopFacing = step(0.5, normal.y);
  float _normY = clamp(
    (position.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  float _normalBlend = _isTopFacing * smoothstep(0.8, 1.0, _normY);
  vec3 _waveNorm = nurbsWaveNormal(position);
  vec3 objectNormal = mix(vec3(normal), _waveNorm, _normalBlend);
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`;

const BEGIN_VERTEX_REPLACE = /* glsl */ `
  vec3 waveD = nurbsWaveDisplace(position);
  vec3 transformed = position + waveD;
  vNormHeight = clamp(
    (transformed.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`;

const FRAGMENT_COMMON_INJECT = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  varying float vNormHeight;
`;

const COLOR_FRAGMENT_REPLACE = /* glsl */ `
  #include <color_fragment>
  diffuseColor.rgb = mix(uBottomColor, uTopColor, vNormHeight);
`;

// ── NURBS surface builders ──────────────────────────────────────────

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
  // Normal order so cross(du,dv) faces −Y
  const xs = [-hw, -hw / 3, hw / 3, hw];
  const zs = [-hd, -hd / 3, hd / 3, hd];
  const cp = xs.map((x) => zs.map((z) => new THREE.Vector4(x, botY, z, 1)));
  return new NURBSSurface(3, 3, knots, knots, cp);
}

function buildSideSurface(uVals, getPos, botY, topY) {
  // degree 3 (width, 4 CPs) × degree 2 (height, 3 CPs)
  // Flat vertical plane — mid CP sits exactly between top/bottom (no bulge)
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

function buildAllSurfaces({ width, depth, height }) {
  const hw = width / 2;
  const hd = depth / 2;
  const topY = height / 2;
  const botY = -height / 2;

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

function buildGeometries(surfaces, segments, height, maxDim) {
  const heightSegs = Math.max(8, Math.round(segments * (height / maxDim)));
  const lowSegs = Math.max(4, Math.round(segments / 4));
  const evalFn = (surface) => (u, v, target) => surface.getPoint(u, v, target);

  return [
    new ParametricGeometry(evalFn(surfaces.top), segments, segments),
    new ParametricGeometry(evalFn(surfaces.bottom), lowSegs, lowSegs),
    new ParametricGeometry(evalFn(surfaces.front), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.back), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.right), segments, heightSegs),
    new ParametricGeometry(evalFn(surfaces.left), segments, heightSegs),
  ];
}

// ── Edge line helpers ────────────────────────────────────────────────

const EDGE_SEGS = 32; // subdivisions per top edge for smooth wave following

function buildEdgeGeometries(hw, hd, topY, botY) {
  // Bottom rectangle (static, closed loop)
  const bottomGeo = new LineGeometry();
  bottomGeo.setPositions([
    -hw,
    botY,
    -hd,
    hw,
    botY,
    -hd,
    hw,
    botY,
    hd,
    -hw,
    botY,
    hd,
    -hw,
    botY,
    -hd,
  ]);

  // 4 vertical corner lines (bottom → top, updated each frame at top end)
  const corners = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  const vertGeos = corners.map(([cx, cz]) => {
    const geo = new LineGeometry();
    geo.setPositions([cx, botY, cz, cx, topY, cz]);
    return { geo, cx, cz };
  });

  // 4 top edges, each subdivided so they can follow the wave contour
  const topEdges = [
    { x0: -hw, z0: -hd, x1: hw, z1: -hd }, // back
    { x0: hw, z0: -hd, x1: hw, z1: hd }, // right
    { x0: hw, z0: hd, x1: -hw, z1: hd }, // front
    { x0: -hw, z0: hd, x1: -hw, z1: -hd }, // left
  ];
  const topGeos = topEdges.map((edge) => {
    const positions = [];
    for (let i = 0; i <= EDGE_SEGS; i += 1) {
      const t = i / EDGE_SEGS;
      positions.push(
        edge.x0 + (edge.x1 - edge.x0) * t,
        topY,
        edge.z0 + (edge.z1 - edge.z0) * t
      );
    }
    const geo = new LineGeometry();
    geo.setPositions(positions);
    return { geo, edge };
  });

  return { bottomGeo, vertGeos, topGeos };
}

// ── Component ───────────────────────────────────────────────────────

export default function NurbsWaterColumn({
  width = 3.6,
  depth = 3.6,
  height = 6.0,
  segments = 24,
  topColor = '#9edff0',
  bottomColor = '#246f98',
  opacity = 0.34,
  transmission = 0.5,
  roughness = 0.3,
  ior = 1.12,
  thickness = 0.35,
  waveHeight = 0.15,
  waveChoppiness = 0.5,
  waveSpeed = 0.6,
  edgeColor = '#1f4455',
  edgeOpacity = 0.65,
  edgeLineWidth = 1,
  showEdges = true,
}) {
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: timeRef.current },
      uWaveHeight: { value: waveHeight },
      uWaveChoppiness: { value: waveChoppiness },
      uWaveSpeed: { value: waveSpeed },
      uColumnTop: { value: height / 2 },
      uColumnBottom: { value: -height / 2 },
      uTopColor: { value: new THREE.Color(topColor) },
      uBottomColor: { value: new THREE.Color(bottomColor) },
    }),
    [topColor, bottomColor, height]
  );

  const geometries = useMemo(() => {
    const surfaces = buildAllSurfaces({ width, depth, height });
    return buildGeometries(surfaces, segments, height, Math.max(width, depth));
  }, [width, depth, height, segments]);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      transparent: true,
      opacity,
      transmission,
      roughness,
      metalness: 0.0,
      ior,
      thickness,
      side: THREE.FrontSide,
      depthWrite: true,
    });

    // eslint-disable-next-line no-param-reassign
    mat.onBeforeCompile = (s) => {
      const sh = s;
      Object.entries(uniforms).forEach(([key, u]) => {
        sh.uniforms[key] = u;
      });

      sh.vertexShader = sh.vertexShader.replace(
        '#include <common>',
        VERTEX_COMMON_REPLACE
      );
      sh.vertexShader = sh.vertexShader.replace(
        '#include <beginnormal_vertex>',
        BEGINNORMAL_REPLACE
      );
      sh.vertexShader = sh.vertexShader.replace(
        '#include <begin_vertex>',
        BEGIN_VERTEX_REPLACE
      );
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <common>',
        `#include <common>\n${FRAGMENT_COMMON_INJECT}`
      );
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <color_fragment>',
        COLOR_FRAGMENT_REPLACE
      );
    };

    return mat;
  }, [uniforms, opacity, transmission, roughness, ior, thickness]);

  const edgeData = useMemo(() => {
    if (!showEdges) return null;
    const hw = width / 2;
    const hd = depth / 2;
    return buildEdgeGeometries(hw, hd, height / 2, -height / 2);
  }, [showEdges, width, height, depth]);

  const edgeMat = useMemo(
    () =>
      new LineMaterial({
        transparent: true,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  useFrame((state, delta) => {
    timeRef.current += delta;
    uniforms.uTime.value = timeRef.current;
    uniforms.uWaveHeight.value = waveHeight;
    uniforms.uWaveChoppiness.value = waveChoppiness;
    uniforms.uWaveSpeed.value = waveSpeed;
    waveTime = timeRef.current;

    // Update edge material properties imperatively to avoid re-creating it
    if (showEdges && edgeMat) {
      edgeMat.color.set(edgeColor);
      edgeMat.opacity = edgeOpacity;
      edgeMat.linewidth = edgeLineWidth;
      edgeMat.resolution.set(state.size.width, state.size.height);
    }

    // Animate top edges + vertical corner tops to follow waves
    if (edgeData) {
      const topY = height / 2;
      const botY = -height / 2;
      // Update top edge subdivisions
      edgeData.topGeos.forEach(({ geo, edge }) => {
        const positions = [];
        for (let i = 0; i <= EDGE_SEGS; i += 1) {
          const t = i / EDGE_SEGS;
          const px = edge.x0 + (edge.x1 - edge.x0) * t;
          const pz = edge.z0 + (edge.z1 - edge.z0) * t;
          const wY = sampleWaveHeight(
            px,
            pz,
            waveHeight,
            waveChoppiness,
            waveSpeed
          );
          positions.push(px, topY + wY, pz);
        }
        geo.setPositions(positions);
      });
      // Update vertical corner top-end vertex
      edgeData.vertGeos.forEach(({ geo, cx, cz }) => {
        const wY = sampleWaveHeight(
          cx,
          cz,
          waveHeight,
          waveChoppiness,
          waveSpeed
        );
        geo.setPositions([cx, botY, cz, cx, topY + wY, cz]);
      });
    }
  });

  return (
    <group>
      {geometries.map((geo, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <mesh key={idx} geometry={geo} material={material} />
      ))}

      {showEdges && edgeData && (
        <>
          {/* eslint-disable react/no-unknown-property */}
          <line2 geometry={edgeData.bottomGeo} material={edgeMat} />
          {edgeData.vertGeos.map(({ geo }, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <line2 key={`v${i}`} geometry={geo} material={edgeMat} />
          ))}
          {edgeData.topGeos.map(({ geo }, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <line2 key={`t${i}`} geometry={geo} material={edgeMat} />
          ))}
          {/* eslint-enable react/no-unknown-property */}
        </>
      )}
    </group>
  );
}
