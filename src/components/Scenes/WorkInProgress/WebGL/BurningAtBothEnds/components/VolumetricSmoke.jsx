import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useThree } from '@react-three/fiber';

// ── Noise helpers ─────────────────────────────────────────────────────────────
const PERLIN_2D = /* glsl */ `
  vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float perlin2d(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 *
      vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }
`;

// 3-octave FBM — lighter than 4-octave on the GPU, still wispy enough for smoke
const FBM_2D = /* glsl */ `
  mat2 fbmRot = mat2(0.8660, 0.5, -0.5, 0.8660);

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.6;
    for (int i = 0; i < 3; i++) {
      v += a * perlin2d(p);
      p = fbmRot * p * 2.08;
      a *= 0.48;
    }
    return v;
  }
`;

// ── Puff shader ───────────────────────────────────────────────────────────────
// uPhaseOffset = (lifecycle phase * scale) + (puff index * step)  — the noise
// sample position advances as the puff rises, so the silhouette visibly evolves
// rather than being a static stamp.  This is what creates the flowing illusion.
const PUFF_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PUFF_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uPhaseOffset;
  uniform vec3  uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  ${PERLIN_2D}
  ${FBM_2D}

  void main() {
    vec2 c = vUv - 0.5;
    // Slightly squashed so puffs look more ovoid (wider than tall)
    float r = length(c * vec2(1.0, 0.84));

    // Slow FBM shapes the outer silhouette — drifts and wiggles over time
    vec2 uvShape = vUv * 2.2 + vec2(uPhaseOffset * 3.4, uTime * 0.10);
    float nShape = fbm(uvShape) * 0.5 + 0.5;  // [0, 1]

    // Faster perlin creates wispy density variation inside the puff
    vec2 uvDetail = vUv * 5.2 + vec2(uPhaseOffset * 2.1 + 5.8, uTime * 0.32);
    float nDetail = perlin2d(uvDetail) * 0.5 + 0.5;  // [0, 1]

    // Noise-perturbed soft disc edge: 0.26–0.44 in UV-centred space
    float edgeR = 0.26 + nShape * 0.18;
    float alpha = smoothstep(edgeR, edgeR * 0.22, r);

    // Wispy interior — avoids the flat-disc look
    alpha *= 0.30 + nDetail * 0.70;
    alpha *= uOpacity;

    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

// ── Material ──────────────────────────────────────────────────────────────────
const SmokePuffMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uPhaseOffset: 0.0,
    uColor: new THREE.Color('#b8b8b8'),
    uOpacity: 0.0,
  },
  PUFF_VERT,
  PUFF_FRAG
);

extend({ SmokePuffMaterialImpl });

const SmokePuffMaterial = React.forwardRef(function SmokePuffMaterial(_, ref) {
  return (
    <smokePuffMaterialImpl
      ref={ref}
      transparent
      side={THREE.DoubleSide}
      depthWrite={false}
      toneMapped={false}
    />
  );
});

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_SMOKE = {
  opacity: 0.6,
  color: '#b8b8b8',
  width: 0.25,
  height: 3.0,
};

// 10 puffs gives good visual density with the lifecycle approach —
// at any moment all 10 are evenly staggered from wick (phase=0) to tip (phase=1).
const N_PUFFS = 10;
// Seconds for a puff to travel from wick to tip.  Slower = lazier, more diffuse.
const RISE_PERIOD = 4.5;
// Noise-space step between adjacent puff IDs so they visit different territories.
const PHASE_STEP = 1.7;

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Volumetric smoke column — N puffs with a continuous particle lifecycle.
 * Each puff starts at phase=0 (wick tip), rises to phase=1 (top of column),
 * then wraps back to 0.  The N puffs are uniformly staggered in phase so the
 * column is always fully populated.
 *
 * The size and opacity envelopes ( bell curve × radial spread ) produce the
 * same "grows, detaches from top, body re-fills" rhythm as VolumetricFlame.
 *
 * Props
 * ─────
 * position  – [x,y,z] world position (tip of the wick)
 * inverted  – flip for the bottom-end of the candle
 * smoke     – partial override of DEFAULT_SMOKE values
 * visible   – toggle rendering
 */
export default function VolumetricSmoke({
  position = [0, 0, 0],
  inverted = false,
  smoke,
  visible = true,
}) {
  const cfg = { ...DEFAULT_SMOKE, ...smoke };
  const { camera } = useThree();

  const matRefs = useRef([]);
  const sliceRefs = useRef([]);
  const colorObj = useMemo(() => new THREE.Color(cfg.color), [cfg.color]);
  const splinePoint = useMemo(() => new THREE.Vector3(), []);

  // Geometry size scales with column height so N puffs cover it with overlap.
  // At height=3.0 → 1.26 world units wide.  Disc edge at UV r≈0.38 →
  // world disc radius ≈ 0.24, adjacent spacing = height/N ≈ 0.30,
  // so puffs overlap nicely in the body of the column.
  const puffGeo = useMemo(
    () => new THREE.PlaneGeometry(cfg.height * 0.42, cfg.height * 0.42, 1, 1),
    [cfg.height]
  );

  const dir = inverted ? -1 : 1;

  // 5-point spline — extra interior points give a more natural lazy curve.
  const spline = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, cfg.height * 0.22 * dir, 0),
        new THREE.Vector3(0, cfg.height * 0.5 * dir, 0),
        new THREE.Vector3(0, cfg.height * 0.78 * dir, 0),
        new THREE.Vector3(0, cfg.height * dir, 0),
      ]),
    [cfg.height, dir]
  );

  useFrame(({ clock }) => {
    if (!visible) return;
    const t = clock.getElapsedTime();

    // Lazy sway — slower and smaller than flame, matching diffuse smoke drift.
    const swayX = Math.sin(t * 0.55) * 0.1 + Math.sin(t * 1.4 + 0.5) * 0.028;
    const swayZ = Math.cos(t * 0.45 + 1.2) * 0.065 + Math.cos(t * 1.2) * 0.018;

    // Quadratic lean: straight at base, full sway at tip — matches VolumetricFlame.
    spline.points[1].set(swayX * 0.14, cfg.height * 0.22 * dir, swayZ * 0.14);
    spline.points[2].set(swayX * 0.44, cfg.height * 0.5 * dir, swayZ * 0.44);
    spline.points[3].set(swayX * 0.78, cfg.height * 0.78 * dir, swayZ * 0.78);
    spline.points[4].set(swayX, cfg.height * dir, swayZ);

    for (let i = 0; i < N_PUFFS; i += 1) {
      // Lifecycle phase [0,1]: 0 = just born at wick, 1 = dying at tip.
      // Fract ensures continuous cycling; uniform stagger keeps column full.
      const phase = (((t / RISE_PERIOD + i / N_PUFFS) % 1) + 1) % 1;

      const g = sliceRefs.current[i];
      if (g) {
        spline.getPoint(phase, splinePoint);
        g.position.copy(splinePoint);
        g.quaternion.copy(camera.quaternion);

        // Size: bell curve × outward spread.
        // Produces small→ growing→ large→ shrinking so the puff pinches off
        // at the top — same visual rhythm as VolumetricFlame.
        const sizeEnv = Math.sin(phase * Math.PI) ** 0.72;
        const radialSpread = 0.28 + phase * 0.95;
        g.scale.setScalar(sizeEnv * radialSpread);
      }

      const m = matRefs.current[i];
      if (m) {
        // Noise sample position advances with lifecycle phase, so each puff's
        // silhouette visibly evolves as it rises — the flow illusion.
        m.uPhaseOffset = phase * 4.5 + i * PHASE_STEP;
        m.uTime = t;
        m.uColor.copy(colorObj);

        // Quick fade-in at wick; power-curve fade-out near tip.
        const opacityEnv = smoothstep(0, 0.09, phase) * (1 - phase ** 1.5);
        m.uOpacity = cfg.opacity * Math.max(0, opacityEnv);
      }
    }
  });

  if (!visible) return null;

  return (
    <group position={position}>
      {Array.from({ length: N_PUFFS }, (_, i) => (
        <group
          key={i}
          ref={(r) => {
            sliceRefs.current[i] = r;
          }}
        >
          <mesh geometry={puffGeo}>
            <SmokePuffMaterial
              ref={(r) => {
                matRefs.current[i] = r;
              }}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
