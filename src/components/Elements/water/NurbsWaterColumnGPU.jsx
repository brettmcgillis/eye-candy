// NurbsWaterColumnGPU — WebGPU/TSL port of NurbsWaterColumn.
// Geometry is built via shared waterUtils (NURBSSurface + ParametricGeometry).
// Wave displacement, normal perturbation, and colour gradient are expressed
// as TSL node graphs on MeshPhysicalNodeMaterial instead of onBeforeCompile
// GLSL injection. Edge lines use THREE.Line (no fat-line dependency).
import {
  Fn,
  clamp,
  cos,
  dot,
  float,
  mix,
  normalLocal,
  normalize,
  positionLocal,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  WAVES,
  buildAllSurfaces,
  buildGeometries,
  sampleWaveHeight,
  setWaveTime,
} from './waterUtils';

const EDGE_SEGS = 32;

// ── Edge geometry helpers (WebGPU: use THREE.BufferGeometry + THREE.Line) ───

const CORNER_OFFSETS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

const TOP_EDGE_PAIRS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

function buildEdgeData(hw, hd, topY, botY, mat) {
  const group = new THREE.Group();

  // Bottom rectangle (static, closed loop — 5 points)
  const bottomPts = [
    new THREE.Vector3(-hw, botY, -hd),
    new THREE.Vector3(hw, botY, -hd),
    new THREE.Vector3(hw, botY, hd),
    new THREE.Vector3(-hw, botY, hd),
    new THREE.Vector3(-hw, botY, -hd),
  ];
  group.add(
    new THREE.Line(new THREE.BufferGeometry().setFromPoints(bottomPts), mat)
  );

  // 4 vertical corner lines — top Y is dynamic (follows wave)
  const corners = CORNER_OFFSETS.map(([sx, sz]) => {
    const cx = sx * hw;
    const cz = sz * hd;
    const positions = new Float32Array([cx, botY, cz, cx, topY, cz]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.attributes.position.usage = THREE.DynamicDrawUsage;
    group.add(new THREE.Line(geo, mat));
    return { geo, cx, cz };
  });

  // Corners by index for edge referencing
  const cornerPositions = CORNER_OFFSETS.map(([sx, sz]) => ({
    x: sx * hw,
    z: sz * hd,
  }));

  // 4 top edge lines — each subdivided so Y follows the wave surface
  const topEdges = TOP_EDGE_PAIRS.map(([ia, ib]) => {
    const a = cornerPositions[ia];
    const b = cornerPositions[ib];
    const n = EDGE_SEGS + 1;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      const t = i / EDGE_SEGS;
      positions[i * 3] = a.x + (b.x - a.x) * t;
      positions[i * 3 + 1] = topY;
      positions[i * 3 + 2] = a.z + (b.z - a.z) * t;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.attributes.position.usage = THREE.DynamicDrawUsage;
    group.add(new THREE.Line(geo, mat));
    return { geo, a, b };
  });

  return { group, corners, topEdges };
}

// ── Component ───────────────────────────────────────────────────────────────

export default function NurbsWaterColumnGPU({
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
  showEdges = true,
}) {
  const timeRef = useRef(0);

  // ── TSL uniform nodes — one set per mounted instance ──────────────────────
  const u = useMemo(
    () => ({
      time: uniform(0),
      waveHeight: uniform(waveHeight),
      waveSpeed: uniform(waveSpeed),
      waveChop: uniform(waveChoppiness),
      colTop: uniform(height / 2),
      colBot: uniform(-height / 2),
      topColor: uniform(new THREE.Color(topColor)),
      botColor: uniform(new THREE.Color(bottomColor)),
    }),
    [] // stable — all values updated imperatively in useFrame
  );

  // ── TSL material ───────────────────────────────────────────────────────────
  const material = useMemo(() => {
    const {
      time,
      waveHeight: uWH,
      waveSpeed: uWS,
      waveChop,
      colTop,
      colBot,
      topColor: uTC,
      botColor: uBC,
    } = u;

    // Y-only wave displacement — walls stay vertical, top surface undulates
    const dispY = Fn(() => {
      const pos = positionLocal;
      const normY = clamp(pos.y.sub(colBot).div(colTop.sub(colBot)), 0.0, 1.0);
      const blend = smoothstep(0.5, 1.0, normY);
      const d = float(0).toVar();
      WAVES.forEach(({ dx, dz, freq, amp }) => {
        const theta = dot(vec2(dx, dz), pos.xz)
          .mul(freq)
          .add(time.mul(uWS).mul(freq));
        d.addAssign(float(amp).mul(uWH).mul(cos(theta)));
      });
      return d.mul(blend);
    });

    // Wave normal blended over top-facing surfaces near the top rim
    const waveNorm = Fn(() => {
      const pos = positionLocal;
      const normY = clamp(pos.y.sub(colBot).div(colTop.sub(colBot)), 0.0, 1.0);
      const isTop = normalLocal.y.greaterThan(0.5);
      const nBlend = isTop.select(smoothstep(0.8, 1.0, normY), float(0));

      const nx = float(0).toVar();
      const ny = float(1).toVar();
      const nz = float(0).toVar();

      WAVES.forEach(({ dx, dz, freq, amp }) => {
        const Q = waveChop.div(freq * amp * 4.0);
        const WA = float(freq * amp);
        const theta = dot(vec2(dx, dz), pos.xz)
          .mul(freq)
          .add(time.mul(uWS).mul(freq));
        nx.subAssign(float(dx).mul(WA).mul(sin(theta)));
        nz.subAssign(float(dz).mul(WA).mul(sin(theta)));
        ny.subAssign(Q.mul(WA).mul(cos(theta)));
      });

      return mix(normalLocal, normalize(vec3(nx, ny, nz)), nBlend);
    });

    // Height-based colour gradient (bottom → top)
    const gradColor = Fn(() => {
      const normY = clamp(
        positionLocal.y.sub(colBot).div(colTop.sub(colBot)),
        0.0,
        1.0
      );
      return mix(uBC, uTC, normY);
    });

    const mat = new THREE.MeshPhysicalNodeMaterial({
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
    });

    mat.opacity = opacity;
    mat.transmission = transmission;
    mat.roughness = roughness;
    mat.metalness = 0;
    mat.ior = ior;
    mat.thickness = thickness;

    mat.positionNode = positionLocal.add(vec3(0, dispY(), 0));
    mat.normalNode = waveNorm();
    mat.colorNode = gradColor();

    return mat;
  }, [u, opacity, transmission, roughness, ior, thickness]);

  // ── NURBS mesh geometries ──────────────────────────────────────────────────
  const geometries = useMemo(() => {
    const surfaces = buildAllSurfaces({ width, depth, height });
    return buildGeometries(surfaces, segments, height, Math.max(width, depth));
  }, [width, depth, height, segments]);

  // ── Edge line objects ──────────────────────────────────────────────────────
  const edgeData = useMemo(() => {
    if (!showEdges) return null;
    const hw = width / 2;
    const hd = depth / 2;
    const mat = new THREE.LineBasicNodeMaterial({
      color: new THREE.Color(edgeColor),
      opacity: edgeOpacity,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    });
    return buildEdgeData(hw, hd, height / 2, -height / 2, mat);
  }, [showEdges, width, height, depth]); // intentionally excludes edgeColor/edgeOpacity — updated imperatively in useFrame

  // ── Animation loop ─────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Keep WebGL module waveTime in sync so FloatingTugboat CPU sampling works
    setWaveTime(t);

    u.time.value = t;
    u.waveHeight.value = waveHeight;
    u.waveSpeed.value = waveSpeed;
    u.waveChop.value = waveChoppiness;
    u.topColor.value.set(topColor);
    u.botColor.value.set(bottomColor);

    if (!showEdges || !edgeData) return;

    const topY = height / 2;

    edgeData.edgeMat?.color.set(edgeColor);
    if (edgeData.edgeMat) edgeData.edgeMat.opacity = edgeOpacity;

    // Update vertical corner top endpoints
    edgeData.corners.forEach(({ geo, cx, cz }) => {
      const wY = sampleWaveHeight(
        cx,
        cz,
        waveHeight,
        waveChoppiness,
        waveSpeed
      );
      const arr = geo.attributes.position.array;
      arr[4] = topY + wY; // second point Y
      // eslint-disable-next-line no-param-reassign
      geo.attributes.position.needsUpdate = true;
    });

    // Update subdivided top edge lines
    edgeData.topEdges.forEach(({ geo, a, b }) => {
      const arr = geo.attributes.position.array;
      const n = EDGE_SEGS + 1;
      for (let i = 0; i < n; i += 1) {
        const tv = i / EDGE_SEGS;
        const px = a.x + (b.x - a.x) * tv;
        const pz = a.z + (b.z - a.z) * tv;
        const wY = sampleWaveHeight(
          px,
          pz,
          waveHeight,
          waveChoppiness,
          waveSpeed
        );
        arr[i * 3 + 1] = topY + wY;
      }
      // eslint-disable-next-line no-param-reassign
      geo.attributes.position.needsUpdate = true;
    });
  });

  return (
    <group>
      {geometries.map((geo, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <mesh key={idx} geometry={geo} material={material} />
      ))}
      {showEdges && edgeData && <primitive object={edgeData.group} />}
    </group>
  );
}
