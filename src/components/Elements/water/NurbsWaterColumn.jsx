import * as THREE from 'three';
import { NURBSSurface, ParametricGeometry } from 'three-stdlib';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

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

  vec3 nurbsWaveDisplace(vec3 pos) {
    float normY = clamp(
      (pos.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
    );
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

    vec3 disp = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float Q = uWaveChoppiness / (freqs[i] * amp * 4.0);
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);
      disp.x -= Q * amp * dirs[i].x * s;
      disp.z -= Q * amp * dirs[i].y * s;
      disp.y += amp * c;
    }

    return disp * blend;
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

function buildSideSurface(uVals, getPos, bulgeDir, bulgeFactor, botY, topY) {
  // degree 3 (width, 4 CPs) × degree 2 (height, 3 CPs)
  const knotsU = [0, 0, 0, 0, 1, 1, 1, 1];
  const knotsV = [0, 0, 0, 1, 1, 1];
  const midY = (botY + topY) / 2;

  const cp = uVals.map((uVal) => {
    const b = getPos(uVal, botY);
    const t = getPos(uVal, topY);
    return [
      new THREE.Vector4(b.x, b.y, b.z, 1),
      new THREE.Vector4(
        (b.x + t.x) / 2 + bulgeDir.x * bulgeFactor,
        midY,
        (b.z + t.z) / 2 + bulgeDir.z * bulgeFactor,
        1
      ),
      new THREE.Vector4(t.x, t.y, t.z, 1),
    ];
  });

  return new NURBSSurface(3, 2, knotsU, knotsV, cp);
}

function buildAllSurfaces({ width, depth, height, bulgeFactor }) {
  const hw = width / 2;
  const hd = depth / 2;
  const topY = height / 2;
  const botY = -height / 2;

  return {
    top: buildTopSurface(hw, hd, topY),
    bottom: buildBottomSurface(hw, hd, botY),
    // Front (z=+hd) normal +z: u along X left→right
    front: buildSideSurface(
      [-hw, -hw / 3, hw / 3, hw],
      (x, y) => ({ x, y, z: hd }),
      { x: 0, z: 1 },
      bulgeFactor,
      botY,
      topY
    ),
    // Back (z=−hd) normal −z: u reversed
    back: buildSideSurface(
      [hw, hw / 3, -hw / 3, -hw],
      (x, y) => ({ x, y, z: -hd }),
      { x: 0, z: -1 },
      bulgeFactor,
      botY,
      topY
    ),
    // Right (x=+hw) normal +x: u along Z reversed
    right: buildSideSurface(
      [hd, hd / 3, -hd / 3, -hd],
      (z, y) => ({ x: hw, y, z }),
      { x: 1, z: 0 },
      bulgeFactor,
      botY,
      topY
    ),
    // Left (x=−hw) normal −x: u along Z normal
    left: buildSideSurface(
      [-hd, -hd / 3, hd / 3, hd],
      (z, y) => ({ x: -hw, y, z }),
      { x: -1, z: 0 },
      bulgeFactor,
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

// ── Component ───────────────────────────────────────────────────────

export default function NurbsWaterColumn({
  width = 3.6,
  depth = 3.6,
  height = 6.0,
  segments = 24,
  bulgeFactor = 0.08,
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
    const surfaces = buildAllSurfaces({ width, depth, height, bulgeFactor });
    return buildGeometries(surfaces, segments, height, Math.max(width, depth));
  }, [width, depth, height, segments, bulgeFactor]);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      transparent: true,
      opacity,
      transmission,
      roughness,
      metalness: 0.0,
      ior,
      thickness,
      side: THREE.DoubleSide,
      depthWrite: false,
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

  const edgesGeo = useMemo(() => {
    if (!showEdges) return null;
    const box = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, [showEdges, width, height, depth]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    uniforms.uTime.value = timeRef.current;
    uniforms.uWaveHeight.value = waveHeight;
    uniforms.uWaveChoppiness.value = waveChoppiness;
    uniforms.uWaveSpeed.value = waveSpeed;
    waveTime = timeRef.current;
  });

  return (
    <group>
      {geometries.map((geo, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <mesh key={idx} geometry={geo} material={material} />
      ))}

      {showEdges && edgesGeo && (
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial
            color={edgeColor}
            transparent
            opacity={edgeOpacity}
            toneMapped={false}
          />
        </lineSegments>
      )}
    </group>
  );
}
