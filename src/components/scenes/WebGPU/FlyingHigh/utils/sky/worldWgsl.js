// Nightscape (weeblabs.github.io/Nightscape) COMMON, WORLD and BAKED, in
// WGSL. Changes from the GLSL: textures are passed down as arguments, GLSL
// mod is gmod, the sky and light colours blend toward a day palette by
// nsDay (0 keeps Nightscape's night exactly), and nsSeed / nsShape modulate
// the field (seed 0 with the default shape is Nightscape's own field).
// A low sun warms the horizon and the light.
export const COMMON_WGSL = /* wgsl */ `
var<private> nsDay: f32;

fn hash12(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
fn hash42(p: vec2f) -> vec4f {
  var p4 = fract(vec4f(p.xyxy) * vec4f(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
fn hash33(q: vec3f) -> vec3f {
  var p3 = fract(q * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}
fn ign(p: vec2f) -> f32 { return fract(52.9829189 * fract(dot(p, vec2f(0.06711056, 0.00583715)))); }
fn gmod(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }
fn gmod2(x: vec2f, y: f32) -> vec2f { return x - y * floor(x / y); }
fn pathX(z: f32) -> f32 { return 4.5 * sin(z * 0.019634954) + 1.6 * sin(z * 0.039269908 + 1.3); }

// How much the sky glows with sunrise or sunset: from the sun ~7 degrees
// under the horizon, gone by ~10 over it.
fn nsDusk(sun: vec3f) -> f32 {
  return smoothstep(-0.13, -0.03, sun.y) * (1.0 - smoothstep(0.03, 0.17, sun.y));
}
// How golden the key light is: the sun's, low in the sky (dayCycle's
// sunWarmth).
fn nsWarm(key: vec3f, sun: vec3f) -> f32 {
  return step(0.9999, dot(key, sun)) * (1.0 - smoothstep(0.02, 0.25, sun.y));
}

// Sky without disk or stars: gradient, warm horizon glow, halo round the
// moon (or, by day, the sun).
fn skyBase(rd: vec3f, moon: vec3f, sun: vec3f) -> vec3f {
  let y = rd.y;
  let zen = mix(vec3f(0.0003, 0.0008, 0.0034), vec3f(0.050, 0.140, 0.420), nsDay);
  let mid = mix(vec3f(0.0012, 0.0031, 0.0098), vec3f(0.120, 0.260, 0.550), nsDay);
  let hor = mix(vec3f(0.0060, 0.0112, 0.0245), vec3f(0.420, 0.520, 0.620), nsDay);
  var col = mix(hor, mid, smoothstep(-0.02, 0.22, y));
  col = mix(col, zen, smoothstep(0.18, 0.85, y));
  let hd = normalize(rd.xz + 1e-5);
  let azM = max(dot(hd, normalize(moon.xz + 1e-5)), 0.0);
  let azS = max(dot(hd, normalize(sun.xz + 1e-5)), 0.0);
  let band = exp(-abs(y + 0.015) * 16.0);
  let wide = exp(-abs(y + 0.015) * 5.0);
  col += vec3f(0.34, 0.19, 0.09) * band
       * mix(0.20 * (0.03 + 0.97 * pow(azM, 6.0)), 0.30 * (0.03 + 0.97 * pow(azS, 6.0)), nsDay);
  col += vec3f(0.10, 0.10, 0.12) * wide * mix(0.08 * pow(azM, 3.0), 0.60 * pow(azS, 3.0), nsDay);
  // Sunset or sunrise: a warm band and glow along the horizon, strongest
  // under the sun, while the sun is near it.
  let dusk = nsDusk(sun);
  col += vec3f(1.00, 0.42, 0.16) * band * (0.25 + 0.75 * pow(azS, 4.0)) * dusk * 0.35;
  col += vec3f(0.90, 0.50, 0.35) * wide * (0.30 + 0.70 * pow(azS, 2.0)) * dusk * 0.12;
  // The moon's halo by night, the sun's by day, each where its body is.
  let am = 2.0 * asin(clamp(length(rd - moon) * 0.5, 0.0, 1.0));
  let sa = 2.0 * asin(clamp(length(rd - sun) * 0.5, 0.0, 1.0));
  col += (vec3f(0.30, 0.46, 0.90) * 0.0035 * exp(-am * 2.4) + vec3f(0.55, 0.66, 0.88) * 0.0150 * exp(-am * 8.5)
        + vec3f(1.00, 0.90, 0.74) * 0.1100 * exp(-am * 28.0) + vec3f(1.00, 0.93, 0.80) * 0.4500 * exp(-am * 90.0))
       * (1.0 - nsDay);
  col += (vec3f(0.40, 0.45, 0.55) * 0.12 * exp(-sa * 2.4) + vec3f(0.90, 0.85, 0.70) * 0.30 * exp(-sa * 8.5)
        + vec3f(1.00, 0.90, 0.75) * 1.20 * exp(-sa * 28.0) + vec3f(1.00, 0.95, 0.85) * 6.00 * exp(-sa * 90.0))
       * nsDay;
  return col;
}
`;

export const WORLD_WGSL = /* wgsl */ `
const TILE: f32 = 320.0;
const CELL: f32 = 320.0 / 13.0;
const SEA_TOP: f32 = 8.2;
const Y_MIN: f32 = -8.5;
const Y_MAX: f32 = 52.0;
const CLOUD_BASE: f32 = -1.75;
const F_A: f32 = 3.0 / 320.0;
const F_B: f32 = 11.0 / 320.0;
const F_COV: f32 = 2.0 / 320.0;
const F_DECK: f32 = 2.0 / 320.0;
const F_DECK2: f32 = 6.0 / 320.0;
const F_BIL: f32 = 26.0 / 320.0;
const F_DET: f32 = 42.0 / 320.0;
const F_LOB: f32 = 9.0 / 320.0;
const CB_CELL: f32 = 320.0 / 3.0;
const WIND: vec2f = vec2f(0.8, -0.6);

// Seed and shape: every noise lookup shifts by nsShift, every cell hash by
// nsSeed; nsShape is coverage bias, deck lift, heap chance, storm chance.
var<private> nsSeed: f32;
var<private> nsShift: vec3f;
var<private> nsShape: vec4f;
var<private> nsStormH: f32;

fn setField(seed: f32, shape: vec4f, stormH: f32) {
  nsSeed = seed;
  nsShift = fract(vec3f(seed * 0.6180339, seed * 0.3819660, seed * 0.7548777));
  nsShape = shape;
  nsStormH = stormH;
}

fn nz(nT: texture_3d<f32>, nS: sampler, p: vec3f) -> vec4f {
  return textureSampleLevel(nT, nS, p + nsShift, 0.0);
}

fn pdist(a: f32) -> f32 { return abs(gmod(a + 0.5 * TILE, TILE) - 0.5 * TILE); }

fn coverageAt(nT: texture_3d<f32>, nS: sampler, xz: vec2f, a: f32) -> f32 {
  let c = nz(nT, nS, vec3f(xz * F_COV + 0.21, 0.713)).b;
  return 0.6 * c + 0.4 * a + nsShape.x;
}
fn seaHeight(nT: texture_3d<f32>, nS: sampler, xz: vec2f) -> f32 {
  let a = nz(nT, nS, vec3f(xz * F_A, 0.137)).b;
  let b = nz(nT, nS, vec3f(xz.yx * F_B + 0.31, 0.583)).b;
  let h = -1.05 + a * 1.75 + b * 0.85;
  let k = smoothstep(0.43, 0.57, coverageAt(nT, nS, xz, a) + (b - 0.5) * 0.24);
  return mix(-4.2, h, k);
}
fn deckOffset(nT: texture_3d<f32>, nS: sampler, xz: vec2f) -> f32 {
  let o = nz(nT, nS, vec3f(xz * F_DECK + 0.47, 0.391)).b;
  let o2 = nz(nT, nS, vec3f(xz.yx * F_DECK2 + 0.13, 0.857)).b;
  let off = mix(-5.2, 4.6, smoothstep(0.16, 0.84, o)) + (o2 - 0.5) * 2.8 + nsShape.y;
  let dx = pdist(xz.x - pathX(xz.y));
  let allow = mix(-1.2, 5.5, smoothstep(6.0, 20.0, dx));
  let h = clamp(0.5 + 0.5 * (allow - off) / 1.4, 0.0, 1.0);
  return mix(allow, off, h) - 1.4 * h * (1.0 - h);
}
fn seaSD(nT: texture_3d<f32>, nS: sampler, p: vec3f, bil: f32) -> f32 {
  let off = deckOffset(nT, nS, p.xz);
  let top = seaHeight(nT, nS, p.xz) + off + (bil - 0.5) * 2.0 - p.y;
  let bottom = p.y - (CLOUD_BASE + off * 0.8 - (bil - 0.5) * 0.9);
  return min(top, bottom);
}
fn billow(nT: texture_3d<f32>, nS: sampler, p: vec3f) -> f32 {
  let q = p * F_BIL;
  let q2 = vec3f(2.0 * q.x + q.z, 2.0 * q.y, 2.0 * q.z - q.x);
  return 0.64 * nz(nT, nS, q).r + 0.36 * nz(nT, nS, q2 + 0.37).r;
}
fn detailN(nT: texture_3d<f32>, nS: sampler, p: vec3f) -> f32 { return nz(nT, nS, p * F_DET).g; }

fn smax(a: f32, b: f32, k: f32) -> f32 {
  let h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(b, a, h) + k * h * (1.0 - h);
}

fn lobes(nT: texture_3d<f32>, nS: sampler, p: vec3f) -> f32 {
  return 0.62 * nz(nT, nS, p * F_LOB + vec3f(0.53, 0.11, 0.29)).r
       + 0.38 * nz(nT, nS, p * (2.0 * F_LOB) + vec3f(0.17, 0.71, 0.41)).r;
}

fn towers(p: vec3f, bil: f32, lob: f32) -> f32 {
  let g = p.xz / CELL - 0.5;
  let i0 = floor(g);
  var best = -8.0;
  for (var j = 0; j < 2; j++) {
    for (var i = 0; i < 2; i++) {
      let id = i0 + vec2f(f32(i), f32(j));
      let idw = gmod2(id, 13.0) + nsSeed * 17.31;
      let h = hash42(idw + 31.7);
      if (h.x < nsShape.z) { continue; }
      let c = (id + 0.2 + 0.6 * h.yz) * CELL;
      let h5 = hash12(idw * 1.37 + 7.1);
      let Rb = 2.8 + 3.0 * h.w;
      let H = Rb * (0.5 + 1.3 * h5);
      if (pdist(c.x - pathX(c.y)) < Rb * 2.0 + 3.0) { continue; }
      let dc = p.xz - c;
      let reach = Rb * 2.3 + 3.0;
      if (dot(dc, dc) > reach * reach || p.y > H + Rb + 2.0) { continue; }
      var cl = -1e3;
      for (var k = 0; k < 6; k++) {
        let hk = hash42(idw * 3.7 + f32(k) * 11.3 + 5.1);
        let tk = f32(k) / 5.0;
        let rk = Rb * mix(1.0, 0.5, tk) * (0.75 + 0.5 * hk.x);
        let ang = hk.y * 6.2832;
        let off = Rb * 0.75 * (1.0 - 0.6 * tk) * sqrt(hk.z);
        let cxz = c + vec2f(cos(ang), sin(ang)) * off + WIND * tk * Rb * 0.4;
        var d = p - vec3f(cxz.x, -0.5 + tk * H + rk * 0.2, cxz.y);
        d.y *= 1.15;
        cl = smax(cl, rk - length(d), rk * 0.45);
      }
      cl = min(cl, p.y - (CLOUD_BASE - 0.4));
      cl += (lob - 0.5) * Rb * 0.7 + (bil - 0.5) * (2.4 + 0.2 * Rb);
      best = max(best, cl);
    }
  }
  return best;
}

fn cumulonimbus(p: vec3f, bil: f32, lob: f32) -> f32 {
  let g = p.xz / CB_CELL - 0.5;
  let i0 = floor(g);
  var best = -40.0;
  for (var j = 0; j < 2; j++) {
    for (var i = 0; i < 2; i++) {
      let id = i0 + vec2f(f32(i), f32(j));
      let idw = gmod2(id, 3.0) + nsSeed * 5.77;
      let h = hash42(idw * 7.31 + 113.7);
      if (h.x < nsShape.w) { continue; }
      let c = (id + 0.3 + 0.4 * h.yz) * CB_CELL;
      let R0 = 9.0 + 6.0 * h.w;
      if (pdist(c.x - pathX(c.y)) < R0 * 2.2 + 9.0) { continue; }
      let h2 = hash12(idw * 3.17 + 41.3);
      let H = 16.0 + nsStormH * h2 * h2;
      let anvil = smoothstep(24.0, 34.0, H);
      let A = 4.0 + 4.0 * fract(h2 * 7.13);
      let Ra = R0 * (1.6 + 0.8 * fract(h2 * 13.7));
      let tt = clamp((p.y - CLOUD_BASE) / (H - CLOUD_BASE), 0.0, 1.0);
      let col = c + WIND * tt * tt * R0 * 0.7;
      let colR = R0 * (0.9 + 0.3 * tt + 0.15 * exp(-tt * 7.0));
      let an = smoothstep(H - A - 4.0, H - A + 1.0, p.y) * anvil;
      let ctr = mix(col, c + WIND * (Ra - R0) * 0.6, an);
      let rad = mix(colR, Ra * (0.8 + 0.4 * lob), an);
      var sd = min(rad - length(p.xz - ctr), H - p.y);
      let ov = vec3f(p.x - col.x, (p.y - (H + 0.5)) * 1.6, p.z - col.y);
      sd = max(sd, R0 * 0.85 - length(ov));
      sd = min(sd, p.y - (CLOUD_BASE - 1.0));
      let lump = mix(R0 * 0.55, 1.2, an);
      sd += (lob - 0.5) * 2.0 * lump + (bil - 0.5) * (4.0 - 2.6 * an);
      best = max(best, sd);
    }
  }
  return best;
}

fn sceneSD(nT: texture_3d<f32>, nS: sampler, p: vec3f) -> f32 {
  let bil = billow(nT, nS, p);
  let lob = lobes(nT, nS, p);
  var sea: f32;
  if (p.y > SEA_TOP) { sea = min(SEA_TOP - p.y, -0.4); } else { sea = seaSD(nT, nS, p, bil); }
  let tw = towers(p, bil, lob);
  let cb = cumulonimbus(p, bil, lob);
  return smax(smax(sea, tw, 0.9), cb, 1.2);
}
fn sceneSDFull(nT: texture_3d<f32>, nS: sampler, p: vec3f) -> f32 {
  let bil = billow(nT, nS, p);
  let lob = lobes(nT, nS, p);
  return smax(smax(seaSD(nT, nS, p, bil), towers(p, bil, lob), 0.9), cumulonimbus(p, bil, lob), 1.2);
}
fn densLight(sd: f32) -> f32 { return clamp((sd + 0.1) * 1.3, 0.0, 1.0); }
`;

export const BAKED_WGSL = /* wgsl */ `
// The bake is double-buffered: while the light moves, the next direction
// bakes into one buffer and the two cross-fade by nsBakeMix.
var<private> nsBakeMix: f32;
fn bakeSample(bA: texture_3d<f32>, bB: texture_3d<f32>, bS: sampler, uvw: vec3f) -> vec4f {
  return mix(textureSampleLevel(bA, bS, uvw, 0.0), textureSampleLevel(bB, bS, uvw, 0.0), nsBakeMix);
}
fn bakedSD(bA: texture_3d<f32>, bB: texture_3d<f32>, bS: sampler, p: vec3f) -> f32 {
  let w = (p.y - Y_MIN) / (Y_MAX - Y_MIN);
  if (w >= 1.0) { return -4.0 - (p.y - Y_MAX); }
  if (w < 0.0) { return -6.0; }
  return bakeSample(bA, bB, bS, vec3f(p.x / TILE, p.z / TILE, w)).b * 16.0 - 10.0;
}
fn shapeSD(bA: texture_3d<f32>, bB: texture_3d<f32>, bS: sampler, nT: texture_3d<f32>, nS: sampler, p: vec3f) -> f32 {
  let sd = bakedSD(bA, bB, bS, p);
  if (sd < -1.2) { return sd + 0.6; }
  var q = p * F_BIL;
  q = vec3f(2.0 * q.x + q.z, 2.0 * q.y, 2.0 * q.z - q.x) + 0.37;
  return sd + (nz(nT, nS, q).r - 0.5) * 0.9;
}
`;
