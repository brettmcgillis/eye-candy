// GPU SDF raymarching on a bounding-box mesh.
//
// Instead of filling a voxel grid (MarchingCubes) the SDF is evaluated
// entirely on the GPU: for every back-face fragment of the bounding box,
// we cast a ray from the camera through that fragment and march through
// the same analytical drip-sphere SDF.  Zero CPU work per frame.
//
// Layout names use suffix 'bm' so they won't collide if createRaymarchNode
// is also in the bundle.
import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  atan,
  cameraPosition,
  clamp,
  cos,
  distance,
  dot,
  float,
  floor,
  fract,
  length,
  min,
  mix,
  mod,
  normalize,
  positionWorld,
  pow,
  reflect,
  sign,
  sin,
  texture,
  time,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { signedPerlinApprox } from '../../../../../elements/perlinNoiseBall/perlinNoiseNodes';

const TAU = Math.PI * 2;
// 80 steps is plenty for a unit-sphere SDF — the starting point is the
// box surface so we're already close.  Lower = faster, higher = sharper
// silhouettes on drip tips.
const STEP_COUNT = 80;

// ─── SDF helpers ────────────────────────────────────────────────────────────

const hash31bm = Fn(([p]) => {
  const v = fract(vec3(p).mul(vec3(0.1031, 0.103, 0.0973))).toVar();
  v.addAssign(dot(v, v.yzx.add(33.33)));
  return fract(v.xxy.add(v.yzz).mul(v.zyx));
}).setLayout({
  name: 'hash31bm',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'float' }],
});

const sminbm = Fn(([a, b, k]) => {
  const h = clamp(float(0.5).add(float(0.5).mul(b.sub(a).div(k))), 0, 1);
  return mix(b, a, h).sub(k.mul(h).mul(float(1).sub(h)));
}).setLayout({
  name: 'sminbm',
  type: 'float',
  inputs: [
    { name: 'a', type: 'float' },
    { name: 'b', type: 'float' },
    { name: 'k', type: 'float' },
  ],
});

const sdSegbm = Fn(([p, h, r]) => {
  const q = vec3(p).toVar();
  q.y.subAssign(clamp(q.y, 0, h));
  return length(q).sub(r);
}).setLayout({
  name: 'sdSegbm',
  type: 'float',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'h', type: 'float' },
    { name: 'r', type: 'float' },
  ],
});

const noiseVec3bm = Fn(([p]) => {
  const a = signedPerlinApprox(p).mul(0.5).add(0.5);
  const b = signedPerlinApprox(p.add(vec3(17.13, 9.71, 4.29)))
    .mul(0.5)
    .add(0.5);
  const c = signedPerlinApprox(p.add(vec3(31.77, 15.19, 28.41)))
    .mul(0.5)
    .add(0.5);
  return vec3(a, b, c);
}).setLayout({
  name: 'noiseVec3bm',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'vec3' }],
});

const fbmbm = Fn(([p, spd]) => {
  const pt = vec3(p).toVar();
  const amp = float(0.5).toVar();
  const acc = vec3(0, 0, 0).toVar();
  Loop({ start: 0, end: 3, type: 'int', condition: '<' }, () => {
    pt.y.addAssign(time.mul(spd).mul(0.005).div(amp));
    acc.addAssign(sin(noiseVec3bm(pt.div(amp)).mul(TAU)).mul(amp));
    amp.divAssign(2);
  });
  return acc;
}).setLayout({
  name: 'fbmbm',
  type: 'vec3',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'spd', type: 'float' },
  ],
});

// ─── SDF scene map ──────────────────────────────────────────────────────────
// Atlas constants must match bakeSkullSDF.js.
const SDF_BOUNDS = 1.4;
const TILES_X    = 8;
const TILES_Y    = 6;

/**
 * Sample the 2D atlas SDF with manual trilinear interpolation.
 * uvw ∈ [0,1]^3 where (x,y) = lateral, z = depth through atlas slices.
 *
 * Two z-slices are sampled and mix()ed for smooth depth interpolation.
 * A half-texel inset on x/y prevents cross-tile linear bleed.
 */
function sampleAtlasSDF(atlasTexNode, N, uvw) {
  // Continuous z index [0, N-1]
  const zFloat = uvw.z.mul(N - 1);
  const z0     = floor(zFloat);
  const z1     = min(z0.add(1), float(N - 1));
  const fz     = fract(zFloat);

  // x,y within tile — clamp half a texel from tile edges to prevent bleed
  const inset  = float(0.5 / N);
  const safeX  = clamp(uvw.x, inset, float(1.0 - 1.0 / N));
  const safeY  = clamp(uvw.y, inset, float(1.0 - 1.0 / N));

  // Tile origin in atlas space [0,1]^2
  const tileOrigin = (z) => vec2(
    mod(z, float(TILES_X)).div(float(TILES_X)),
    floor(z.div(float(TILES_X))).div(float(TILES_Y))
  );

  const uv0 = tileOrigin(z0).add(vec2(safeX.div(float(TILES_X)), safeY.div(float(TILES_Y))));
  const uv1 = tileOrigin(z1).add(vec2(safeX.div(float(TILES_X)), safeY.div(float(TILES_Y))));

  const raw = mix(atlasTexNode.sample(uv0).r, atlasTexNode.sample(uv1).r, fz);
  // Decode 8-bit encoding: raw ∈ [0,1] → dist ∈ [−SDF_BOUNDS, +SDF_BOUNDS]
  return raw.sub(0.5).mul(2 * SDF_BOUNDS);
}

function buildMap(u) {
  return Fn(([pt, mouse]) => {
    const p = vec3(pt).toVar();
    const p0 = vec3(pt).toVar(); // original position for noise + mouse

    // ── Base shape: sphere or baked skull SDF atlas ───────────────────────
    const sphereD = length(p).sub(1);
    const uvw     = p.div(SDF_BOUNDS).mul(0.5).add(0.5); // [0,1]^3
    const skullD  = sampleAtlasSDF(u.skullTex, 48, uvw);
    const d = u.isSkull.greaterThan(0.5).select(skullD, sphereD).toVar();

    // Polar repeat — N evenly-spaced drip channels
    const angle = float(TAU).div(u.dripCount);
    const pa = atan(p.z, p.x).add(angle.mul(0.5)).toVar();
    const pr = length(p.xz).toVar();
    const cell = floor(pa.div(angle)).toVar();
    pa.assign(mod(pa, angle).sub(angle.mul(0.5)));
    p.xz.assign(vec2(cos(pa), sin(pa)).mul(pr));
    If(abs(cell).greaterThanEqual(u.dripCount.div(2)), () => {
      cell.assign(abs(cell));
    });

    const rng = hash31bm(cell).toVar();
    p.x.subAssign(0.5);
    rng.x.addAssign(sign(p.x).mul(0.5));
    p.x.assign(abs(p.x).sub(0.2));
    p.y.mulAssign(-1); // flip so drips hang downward in world space

    const lt = time.mul(u.dripSpeed).mul(0.2).add(rng.x).toVar();
    const anim = fract(lt).toVar();
    const wave = sin(anim.mul(3.14)).toVar();
    const ht = float(0.7)
      .add(float(0.3).mul(pow(wave, 4)))
      .toVar();
    const sz = float(0.03)
      .sub(float(0.03).mul(float(1).sub(wave)))
      .mul(u.pointerRadius)
      .div(0.65)
      .toVar();

    // Drip stream (capsule)
    d.assign(sminbm(d, sdSegbm(p, ht, sz), u.dripBlend));

    // Detaching drip head
    const headY = pow(anim, 10).mul(u.dripDropletFall).add(ht);
    d.assign(
      sminbm(
        d,
        length(p.sub(vec3(0, headY, 0))).sub(0.05),
        float(0.3).mul(pow(anim, 0.5)).mul(u.dripBlend)
      )
    );

    // Mouse dent
    const mr = u.pointerStrength.mul(0.5).add(0.1);
    d.assign(sminbm(d, distance(p0, mouse.negate()).sub(mr), mr));

    // Surface noise
    const nv = fbmbm(p0.mul(u.noiseScale.mul(0.025)), u.dripSpeed);
    d.subAssign(nv.x.mul(0.05).mul(u.noiseStrength));

    return d.mul(0.5);
  }).setLayout({
    name: 'mapDripBM',
    type: 'float',
    inputs: [
      { name: 'pt', type: 'vec3' },
      { name: 'mouse', type: 'vec3' },
    ],
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function createSDFUniforms(dummySDF3D) {
  return {
    isSkull: uniform(0), // 0 = sphere, 1 = skull (set to 1 once baking completes)
    // Baked skull SDF — swap .value once bakeSkullSDF() finishes.
    // dummySDF3D is a 1×1×1 all-outside placeholder (R=255 → d=+SDF_BOUNDS).
    skullTex: texture(dummySDF3D),
    dripSpeed: uniform(1.0),
    dripCount: uniform(8),
    dripDropletFall: uniform(3.0),
    dripBlend: uniform(0.12),
    pointerRadius: uniform(0.65),
    pointerStrength: uniform(0.0),
    noiseScale: uniform(3.0),
    noiseStrength: uniform(1.0),
    paletteA: uniform(new THREE.Color(0.35, 0.3, 0.4)),
    paletteB: uniform(new THREE.Color(0.25, 0.1, 0.1)),
    paletteBrightness: uniform(3.0),
    paletteSpeed: uniform(0.2),
  };
}

/**
 * Creates a MeshBasicNodeMaterial that raymarches the drip-sphere SDF.
 * Attach to a BoxGeometry with side=BackSide for proper 3D rendering.
 *
 * Fragments that don't hit the SDF return alpha=0 (transparent), so the
 * scene background / fog shows through without needing a depth pass.
 */
export function createSDFMaterial(u) {
  const map = buildMap(u);

  const mat = new THREE.MeshBasicNodeMaterial();
  mat.side = THREE.BackSide; // render inside of bounding box
  mat.transparent = true;
  mat.depthWrite = false; // box surface depth shouldn't occlude scene

  // outputNode = full RGBA control (vec4).  colorNode only exposes RGB.
  mat.outputNode = Fn(() => {
    const ro = cameraPosition.toVar(); // ray origin = camera world pos
    const rd = normalize(positionWorld.sub(cameraPosition)).toVar(); // ray dir
    const mouse = vec3(0, 0, 0).toVar(); // world-space pointer (placeholder)

    // ── Sphere trace ──────────────────────────────────────────
    const maxDist = float(12); // bounding box diagonal ≈ 11.7
    const total = float(0).toVar();
    const shade = float(0).toVar();
    const hit = float(0).toVar();

    Loop(
      { start: 0, end: STEP_COUNT, type: 'int', condition: '<' },
      ({ i }) => {
        const p = ro.add(rd.mul(total)).toVar();
        const dist = map(p, mouse).toVar();

        If(dist.lessThan(0.001).or(total.greaterThan(maxDist)), () => {
          shade.assign(float(STEP_COUNT).sub(float(i)).div(float(STEP_COUNT)));
          hit.assign(total.lessThan(maxDist).select(1, 0));
          Break();
        });

        total.addAssign(dist);
      }
    );

    // ── Miss → transparent ────────────────────────────────────
    const result = vec4(0, 0, 0, 0).toVar();

    If(hit.greaterThan(0.5), () => {
      // ── Hit → shade surface ───────────────────────────────
      const pos = ro.add(rd.mul(total)).toVar();
      const eps = float(0.001);
      const nd = map(pos, mouse).toVar();
      const normal = normalize(
        nd.sub(
          vec3(
            map(pos.sub(vec3(eps, 0, 0)), mouse),
            map(pos.sub(vec3(0, eps, 0)), mouse),
            map(pos.sub(vec3(0, 0, eps)), mouse)
          )
        )
      ).toVar();

      // IQ palette — vertical position shifts hue as drips fall
      const phase = time.mul(u.paletteSpeed).add(pos.y.mul(3));
      const tint = u.paletteA
        .add(u.paletteB.mul(cos(vec3(1, 0.3, 6).mul(TAU).add(phase))))
        .mul(u.paletteBrightness)
        .toVar();

      const baseLight = pow(
        dot(normal, vec3(0, -1, 0))
          .mul(0.5)
          .add(0.5),
        10
      );
      const refl = reflect(rd, normal);
      const top = dot(refl, vec3(0, 1, 0))
        .mul(0.4)
        .add(0.5);
      const glow = dot(normal, rd).mul(0.7).add(0.5);

      const col = tint.mul(baseLight).toVar();
      col.addAssign(vec3(0.7, 0.2, 0.7).mul(pow(clamp(top, 0, 1), 1.5)));
      col.addAssign(vec3(4, 1, 1).mul(pow(glow, 2)));
      col.mulAssign(pow(shade, 0.5));

      result.assign(vec4(col, 1));
    });

    return result;
  })();

  return mat;
}
