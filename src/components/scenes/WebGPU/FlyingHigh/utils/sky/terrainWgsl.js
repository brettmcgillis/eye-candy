import { COMMON_WGSL, WORLD_WGSL } from './worldWgsl';

export const TER_N = 1024;

// Nightscape's flooded mountains, in WGSL: TERRAIN_COMMON, TERRAIN_GEN, the
// TER_H / TER_L / TER_T bakes and GROUND_FRAG. Changes from the GLSL: the
// cloud seed also shifts the terrain and town hashes (seed 0 is Nightscape's
// own ground), the light is the sky's moon or sun with a day palette blended
// in by nsDay, town lights go out by day, and lightning is not lit.
const TERRAIN_COMMON = /* wgsl */ `
const TER_LO: f32 = -100.0;
const TER_RANGE: f32 = 52.0;
const TER_TEXEL: f32 = ${320 / TER_N};
const WATER_Y: f32 = -85.0;
`;

const TERRAIN_GEN = /* wgsl */ `
fn tgrad(iIn: vec2f, per: f32) -> vec2f {
  let i = gmod2(iIn, per);
  let a = hash12(i + vec2f(per * 7.13 + nsSeed * 1.37, per * 3.71)) * 6.2831853;
  return vec2f(cos(a), sin(a));
}
fn gnoised(x: vec2f, per: f32) -> vec3f {
  let i = floor(x);
  let f = x - i;
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  let du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  let ga = tgrad(i, per);
  let gb = tgrad(i + vec2f(1.0, 0.0), per);
  let gc = tgrad(i + vec2f(0.0, 1.0), per);
  let gd = tgrad(i + vec2f(1.0, 1.0), per);
  let va = dot(ga, f);
  let vb = dot(gb, f - vec2f(1.0, 0.0));
  let vc = dot(gc, f - vec2f(0.0, 1.0));
  let vd = dot(gd, f - vec2f(1.0, 1.0));
  let k = va - vb - vc + vd;
  let v = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  let d = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd)
        + du * (u.yx * k + vec2f(vb, vc) - va);
  return vec3f(v, d);
}
fn pnoise(p: vec2f, per: f32) -> f32 { return gnoised(p * per, per).x; }
fn pfbm(p: vec2f, perIn: f32) -> f32 {
  var a = 0.0;
  var b = 0.5;
  var per = perIn;
  for (var i = 0; i < 3; i++) { a += b * pnoise(p, per); per *= 2.0; b *= 0.5; }
  return a;
}
fn groundY(p: vec2f) -> f32 {
  let q = p + 0.05 * vec2f(pfbm(p + 0.13, 3.0), pfbm(p + 0.71, 3.0));
  let base = pfbm(q, 2.0);
  var a = 0.0;
  var b = 0.5;
  var per = 6.0;
  var d = vec2f(0.0);
  for (var i = 0; i < 8; i++) {
    let n = gnoised(q * per + f32(i) * 1.7, per);
    d += n.yz;
    a += b * n.x / (1.0 + dot(d, d));
    b *= 0.5;
    per *= 2.0;
  }
  let ridge = 1.0 - abs(pnoise(q + 0.37, 9.0));
  let m = smoothstep(-0.3, 0.3, base);
  let h = base * 1.1 + a * mix(0.5, 1.25, m) + (ridge * ridge - 0.45) * 0.35 * m;
  return clamp(WATER_Y + (h + 0.04) * 34.0, TER_LO + 0.5, TER_LO + TER_RANGE - 1.0);
}
`;

// R surface height (ground + canopy), G forest, B bare ground, A rock grain.
export const TER_H_WGSL = /* wgsl */ `
fn nsTerH(fragCoord: vec2f, seed: f32) -> vec4f {
  nsSeed = seed;
  let p = fragCoord / ${TER_N}.0;
  let e = 1.0 / ${TER_N}.0;
  let h0 = groundY(p);
  let slope = length(vec2f(groundY(p + vec2f(e, 0.0)) - h0, groundY(p + vec2f(0.0, e)) - h0)) / TER_TEXEL;
  let hw = h0 - WATER_Y;
  let patchN = pfbm(p + 0.29, 22.0);
  let forest = smoothstep(1.2, 0.65, slope) * smoothstep(0.1, 0.7, hw)
             * smoothstep(15.0, 10.0, hw + patchN * 8.0) * smoothstep(-0.28, -0.02, patchN);
  let cl = 0.5 + 0.35 * pnoise(p, 210.0) + 0.25 * pnoise(p + 0.5, 430.0);
  let canopy = forest * (0.1 + 0.25 * clamp(cl, 0.0, 1.0));
  let grain = 0.5 + 0.5 * pnoise(p + 0.61, 70.0) * 0.7 + 0.3 * pnoise(p, 260.0);
  return vec4f((h0 + canopy - TER_LO) / TER_RANGE, forest, (h0 - TER_LO) / TER_RANGE, clamp(grain, 0.0, 1.0));
}
${COMMON_WGSL}
${WORLD_WGSL}
${TERRAIN_COMMON}
${TERRAIN_GEN}
`;

// mode 0: light (N.L x soft shadow), sky visibility, forest, water;
// mode 1: albedo (stored as its square root); mode 2: horizons +x +z -x -z.
export const TER_L_WGSL = /* wgsl */ `
fn nsTerL(fragCoord: vec2f, mode: f32, lightDir: vec3f, hT: texture_2d<f32>, hS: sampler) -> vec4f {
  let xz = fragCoord / ${TER_N}.0 * TILE;
  let H = textureSampleLevel(hT, hS, fragCoord / ${TER_N}.0, 0.0);
  let hs = H.r * TER_RANGE + TER_LO;
  let hg = H.b * TER_RANGE + TER_LO;
  let water = hg < WATER_Y;
  let y0 = max(hs, WATER_Y) + 0.04;
  let e = TER_TEXEL;
  let n = normalize(vec3f(tH(hT, hS, xz - vec2f(e, 0.0)) - tH(hT, hS, xz + vec2f(e, 0.0)), 2.0 * e,
                          tH(hT, hS, xz - vec2f(0.0, e)) - tH(hT, hS, xz + vec2f(0.0, e))));
  if (mode < 0.5) {
    var sh = 1.0;
    var s = 0.2;
    for (var i = 0; i < 56; i++) {
      let q = vec3f(xz.x, y0, xz.y) + lightDir * s;
      if (q.y > TER_LO + TER_RANGE) { break; }
      sh = min(sh, 7.0 * (q.y - tH(hT, hS, q.xz)) / s);
      if (sh < 0.0) { break; }
      s = s * 1.07 + 0.08;
    }
    sh = smoothstep(0.0, 1.0, clamp(sh, 0.0, 1.0));
    var ndl = max(dot(n, lightDir), 0.0);
    if (water) { ndl = 1.0; }
    var vis = 0.0;
    for (var k = 0; k < 8; k++) {
      let a = f32(k) * 0.785398 + 0.39;
      let m = horizonTan(hT, hS, xz, y0, vec2f(cos(a), sin(a)));
      vis += 1.0 - m / sqrt(1.0 + m * m);
    }
    vis /= 8.0;
    vis *= mix(1.0, 0.75, H.g);
    return vec4f(ndl * sh, vis, H.g, select(0.0, 1.0, water));
  }
  if (mode < 1.5) {
    let hw = hg - WATER_Y;
    let steep = smoothstep(0.22, 0.5, 1.0 - n.y);
    let rock = vec3f(0.150, 0.145, 0.138) * (0.65 + 0.7 * H.a);
    let meadow = mix(vec3f(0.085, 0.095, 0.055), vec3f(0.12, 0.115, 0.09), H.a);
    var alb = mix(meadow, rock, max(steep, smoothstep(16.0, 24.0, hw + H.a * 4.0)));
    let crown = clamp((hs - hg) / 0.35, 0.0, 1.0);
    let trees = mix(vec3f(0.020, 0.032, 0.020), vec3f(0.040, 0.058, 0.034), crown);
    alb = mix(alb, trees, H.g);
    alb = mix(alb, vec3f(0.060, 0.056, 0.050), smoothstep(0.7, 0.05, hw) * (1.0 - H.g));
    if (water) { alb = mix(vec3f(0.07, 0.065, 0.055), alb, 0.4); }
    return vec4f(sqrt(alb), 1.0);
  }
  return vec4f(horizonTan(hT, hS, xz, y0, vec2f(1.0, 0.0)), horizonTan(hT, hS, xz, y0, vec2f(0.0, 1.0)),
               horizonTan(hT, hS, xz, y0, vec2f(-1.0, 0.0)), horizonTan(hT, hS, xz, y0, vec2f(0.0, -1.0))) * 0.5;
}
fn tH(hT: texture_2d<f32>, hS: sampler, xz: vec2f) -> f32 {
  return textureSampleLevel(hT, hS, xz / TILE, 0.0).r * TER_RANGE + TER_LO;
}
fn horizonTan(hT: texture_2d<f32>, hS: sampler, xz: vec2f, y0: f32, dir: vec2f) -> f32 {
  var m = 0.0;
  var s = 0.35;
  for (var i = 0; i < 30; i++) {
    m = max(m, (tH(hT, hS, xz + dir * s) - y0) / s);
    s *= 1.19;
  }
  return m;
}
${COMMON_WGSL}
${WORLD_WGSL}
${TERRAIN_COMMON}
`;

// R the warm light lamps throw on the ground round them, G the lamps.
export const TER_T_WGSL = /* wgsl */ `
fn nsTerT(fragCoord: vec2f, seed: f32, hT: texture_2d<f32>, hS: sampler) -> vec4f {
  nsSeed = seed;
  let xz = fragCoord / ${TER_N}.0 * TILE;
  let tc = floor(xz / (TILE / TOWN_N));
  var T: array<vec4f, 9>;
  for (var k = 0; k < 9; k++) { T[k] = townAt(tc + vec2f(f32(k % 3) - 1.0, f32(k / 3) - 1.0)); }
  var irr = 0.0;
  var dots = 0.0;
  let lc0 = floor(xz / LC);
  for (var j = -3; j <= 3; j++) {
    for (var i = -3; i <= 3; i++) {
      let lc = lc0 + vec2f(f32(i), f32(j));
      let lh = hash33(vec3f(gmod2(lc, LAMP_N), 3.7 + nsSeed * 0.71));
      let lp = (lc + 0.15 + 0.7 * lh.xy) * LC;
      var dens = 0.0015;
      for (var k = 0; k < 9; k++) {
        if (T[k].z <= 0.0) { continue; }
        let d = wrapd(lp - T[k].xy);
        let r = length(d);
        if (r > T[k].z) { continue; }
        let ca = cos(T[k].w);
        let sa = sin(T[k].w);
        let g = abs(fract(vec2f(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) / 1.1) - 0.5);
        var street = 0.3;
        if (min(g.x, g.y) < 0.12) { street = 0.95; }
        let edge = smoothstep(T[k].z, T[k].z * 0.3, r * (0.85 + 0.3 * lh.z));
        dens = max(dens, edge * street);
      }
      if (lh.z > dens) { continue; }
      let hg = gH(hT, hS, lp);
      if (hg - WATER_Y < 0.25) { continue; }
      let sl = length(vec2f(gH(hT, hS, lp + vec2f(0.3, 0.0)) - hg, gH(hT, hS, lp + vec2f(0.0, 0.3)) - hg)) / 0.3;
      if (sl > 0.45) { continue; }
      let P = 0.6 + 0.8 * fract(lh.z * 13.7 + lh.x * 7.1);
      let dv = wrapd(xz - lp);
      let d2 = dot(dv, dv);
      irr += P * 0.03 / (0.03 + d2) * exp(-sqrt(d2) * 0.9);
      dots += P * exp(-d2 / 0.026);
    }
  }
  for (var b = 0; b < 25; b++) {
    let cb = tc + vec2f(f32(b % 5) - 2.0, f32(b / 5) - 2.0);
    let TA = townAt(cb);
    if (TA.z <= 0.0) { continue; }
    for (var e = 0; e < 4; e++) {
      var off = vec2f(0.0, 1.0);
      if (e == 0) { off = vec2f(1.0, -1.0); }
      else if (e == 1) { off = vec2f(1.0, 0.0); }
      else if (e == 2) { off = vec2f(1.0, 1.0); }
      let TB = townAt(cb + off);
      if (TB.z <= 0.0) { continue; }
      let ab = TB.xy - TA.xy;
      let L = length(ab);
      if (L > 80.0) { continue; }
      let dir = ab / L;
      let nrm = vec2f(-dir.y, dir.x);
      let pa = wrapd(xz - TA.xy);
      let sp = dot(pa, dir);
      if (sp < -2.0 || sp > L + 2.0) { continue; }
      let h = hash12(gmod2(cb, TOWN_N) * 3.1 + f32(e) * 1.7 + 0.3 + nsSeed * 0.53);
      let bow = (h - 0.5) * 0.3 * L;
      let c0 = bow * sin(3.14159 * clamp(sp / L, 0.0, 1.0)) + 1.2 * sin(sp * 0.21 + h * 20.0);
      if (abs(dot(pa, nrm) - c0) > 2.6) { continue; }
      let SP = 0.9;
      let i0 = floor((sp - 1.8) / SP);
      for (var q = 0; q < 6; q++) {
        let ls = (i0 + f32(q)) * SP;
        if (ls < TA.z * 0.8 || ls > L - TB.z * 0.8) { continue; }
        let hl = hash12(vec2f(i0 + f32(q), h * 91.0));
        if (hl < 0.18) { continue; }
        let lp = TA.xy + dir * ls + nrm * (bow * sin(3.14159 * ls / L) + 1.2 * sin(ls * 0.21 + h * 20.0));
        let hg = gH(hT, hS, lp);
        if (hg - WATER_Y < 0.25) { continue; }
        let sl = length(vec2f(gH(hT, hS, lp + vec2f(0.3, 0.0)) - hg, gH(hT, hS, lp + vec2f(0.0, 0.3)) - hg)) / 0.3;
        if (sl > 0.6) { continue; }
        let P = 0.45 + 0.35 * hl;
        let dv = wrapd(xz - lp);
        let d2 = dot(dv, dv);
        irr += P * 0.03 / (0.03 + d2) * exp(-sqrt(d2) * 0.9);
        dots += P * exp(-d2 / 0.026);
      }
    }
  }
  return vec4f(irr, dots, 0.0, 1.0);
}
const TOWN_N: f32 = 7.0;
const LAMP_N: f32 = 580.0;
const LC: f32 = 320.0 / 580.0;
fn wrapd(v: vec2f) -> vec2f { return gmod2(v + 0.5 * TILE, TILE) - 0.5 * TILE; }
fn gH(hT: texture_2d<f32>, hS: sampler, xz: vec2f) -> f32 {
  return textureSampleLevel(hT, hS, xz / TILE, 0.0).b * TER_RANGE + TER_LO;
}
fn townAt(cell: vec2f) -> vec4f {
  let h = hash42(gmod2(cell, TOWN_N) * 1.31 + 7.7 + nsSeed * 2.39);
  if (h.x > 0.36) { return vec4f(0.0); }
  return vec4f((cell + 0.2 + 0.6 * h.yz) * (TILE / TOWN_N), 2.5 + 5.5 * h.w * h.w, h.x * 23.0);
}
${COMMON_WGSL}
${WORLD_WGSL}
${TERRAIN_COMMON}
`;

// GROUND_FRAG: for rays that leave through the base of the deck with light
// to spare, the ground or lake they meet, the town lights, the radio masts
// and the air between, behind what the cloud pass left. Packed like it.
export const GROUND_WGSL = /* wgsl */ `
fn nsGround(fragUv: vec2f, fragCoord: vec2f, camPos: vec3f, camR: vec3f, camU: vec3f, camF: vec3f,
            keyDir: vec3f, moonDir: vec3f, sunDir: vec3f, keyI: f32, terMix: f32,
            tanHalf: f32, aspect: f32, time: f32, day: f32, seed: f32, shape: vec4f,
            lamps: f32, terTop: f32, pixAngC: f32, mast0: vec4f, mast1: vec4f, mastN: f32,
            tCloud: texture_2d<f32>, nT: texture_3d<f32>, nS: sampler,
            terH: texture_2d<f32>, terA0: texture_2d<f32>, terA1: texture_2d<f32>, terB: texture_2d<f32>,
            terC: texture_2d<f32>, terL: texture_2d<f32>, terS: sampler) -> vec4f {
  nsDay = day;
  nsKeyI = keyI;
  nsTerMix = terMix;
  nsMoon = moonDir;
  nsSun = sunDir;
  setField(seed, shape, 0.0);
  let c = textureLoad(tCloud, vec2i(fragCoord), 0);
  let dq = floor(c.a);
  let depthC = dq / 32.0;
  let T = (c.a - dq) / 0.999;
  let ndc = fragUv * 2.0 - 1.0;
  let rd = normalize(camF + camR * ndc.x * tanHalf * aspect + camU * ndc.y * tanHalf);
  let ro = camPos;
  if (!(rd.y < 0.0 && T > 0.003 && (Y_MIN - ro.y) / rd.y <= 200.0)) { return c; }
  let g = groundView(ro, rd, dot(rd, keyDir), keyDir, time, lamps, terTop, pixAngC, mast0, mast1, mastN,
                     nT, nS, terH, terA0, terA1, terB, terC, terL, terS);
  let S = c.rgb + T * g.rgb;
  return vec4f(S, floor(clamp(mix(depthC, g.a, T), 0.0, 250.0) * 32.0));
}

var<private> nsKeyI: f32;
var<private> nsTerMix: f32;
var<private> nsMoon: vec3f;
var<private> nsSun: vec3f;

fn terLod(t: f32, pixAngC: f32) -> f32 { return clamp(log2(max(t * pixAngC, 1e-4) / TER_TEXEL), 0.0, 6.0); }
fn terY(terH: texture_2d<f32>, terS: sampler, xz: vec2f, lod: f32) -> f32 {
  return textureSampleLevel(terH, terS, xz / TILE, lod).r * TER_RANGE + TER_LO;
}

fn groundView(ro: vec3f, rd: vec3f, cosT: f32, moonDir: vec3f, time: f32, lamps: f32, terTop: f32, pixAngC: f32,
              mast0: vec4f, mast1: vec4f, mastN: f32, nT: texture_3d<f32>, nS: sampler,
              terH: texture_2d<f32>, terA0: texture_2d<f32>, terA1: texture_2d<f32>, terB: texture_2d<f32>,
              terC: texture_2d<f32>, terL: texture_2d<f32>, terS: sampler) -> vec4f {
  let MOON_COOL = mix(vec3f(0.74, 0.84, 1.00), vec3f(1.00, 0.97, 0.92), nsDay);
  let MOON_WARM = mix(vec3f(1.00, 0.88, 0.70), vec3f(1.00, 0.82, 0.62), nsDay);
  let MOON_G = mix(vec3f(1.10, 1.22, 1.42), vec3f(9.5, 9.2, 8.6), nsDay) * nsKeyI
             * mix(vec3f(1.0), vec3f(1.00, 0.60, 0.35), 0.8 * nsWarm(moonDir, nsSun));
  let SKY_G = mix(vec3f(0.0050, 0.0068, 0.0120), vec3f(0.25, 0.32, 0.45), nsDay);
  let LAMP_C = vec3f(1.00, 0.44, 0.13);
  let lampsOn = lamps * (1.0 - nsDay);
  let tW = (WATER_Y - ro.y) / rd.y;
  var t = max((terTop - ro.y) / rd.y, 0.0);
  let kS = 1.0 / (-rd.y + 1.4 * length(rd.xz));
  var land = false;
  var tPrev = t;
  for (var i = 0; i < 90; i++) {
    if (t >= tW) { break; }
    let p = ro + rd * t;
    let dy = p.y - terY(terH, terS, p.xz, terLod(t, pixAngC));
    if (dy < 0.0) { land = true; break; }
    tPrev = t;
    t += max(dy * kS, t * 0.0012);
  }
  if (land) {
    var a = tPrev;
    var b = min(t, tW);
    for (var i = 0; i < 6; i++) {
      let m = 0.5 * (a + b);
      let p = ro + rd * m;
      if (p.y < terY(terH, terS, p.xz, terLod(m, pixAngC))) { b = m; } else { a = m; }
    }
    t = 0.5 * (a + b);
  } else { t = tW; }
  let po = ro + rd * t;
  let uv = po.xz / TILE;
  let lod = terLod(t, pixAngC);
  let A = mix(textureSampleLevel(terA0, terS, uv, lod), textureSampleLevel(terA1, terS, uv, lod), nsTerMix);
  let pc = po + moonDir * ((CLOUD_BASE + 1.0 - po.y) / max(moonDir.y, 0.02));
  let aC = nz(nT, nS, vec3f(pc.xz * F_A, 0.137)).b;
  let open = 1.0 - smoothstep(0.42, 0.52, coverageAt(nT, nS, pc.xz, aC));
  let lit = mix(0.12, 1.0, open);
  var alb = textureSampleLevel(terB, terS, uv, lod).rgb;
  alb *= alb;
  var col: vec3f;
  if (land) {
    let fine = nz(nT, nS, vec3f(po.xz * 0.8, 0.37)).g;
    alb *= mix(1.0, 0.5 + fine, smoothstep(420.0, 140.0, t) * mix(0.3, 1.0, A.b));
    col = alb * (MOON_G * A.r * lit + SKY_G * A.g);
    let L = textureSampleLevel(terL, terS, uv, lod).rg;
    col += LAMP_C * lampsOn * (alb * L.x * 1.3 + L.y * 0.6);
  } else {
    let r = reflect(rd, vec3f(0.0, 1.0, 0.0));
    let cv = max(-rd.y, 1e-3);
    let fres = 0.02 + 0.98 * pow(1.0 - cv, 5.0);
    let az = normalize(r.xz + 1e-5);
    let wgt = max(vec4f(az.x, az.y, -az.x, -az.y), vec4f(0.0));
    let hT = dot(wgt, textureSampleLevel(terC, terS, uv, lod) * 2.0) / max(dot(wgt, vec4f(1.0)), 1e-3);
    let rT = r.y / max(length(r.xz), 1e-3);
    let mtn = smoothstep(rT - 0.04, rT + 0.04, hT);
    let am = 2.0 * asin(clamp(length(r - nsMoon) * 0.5, 0.0, 1.0));
    let sa = 2.0 * asin(clamp(length(r - nsSun) * 0.5, 0.0, 1.0));
    let skyR = skyBase(r, nsMoon, nsSun)
             - (vec3f(1.00, 0.90, 0.74) * 0.1100 * exp(-am * 28.0) + vec3f(1.00, 0.93, 0.80) * 0.4500 * exp(-am * 90.0)) * (1.0 - nsDay)
             - (vec3f(1.00, 0.90, 0.75) * 1.20 * exp(-sa * 28.0) + vec3f(1.00, 0.95, 0.85) * 6.00 * exp(-sa * 90.0)) * nsDay;
    let refl = mix(skyR, mix(vec3f(0.0009, 0.0012, 0.0016), vec3f(0.05, 0.07, 0.06), nsDay), mtn);
    let wind = smoothstep(0.3, 0.75, nz(nT, nS, vec3f(po.xz * 0.011 + 0.3, 0.61)).b);
    let a2 = pow(mix(0.045, 0.14, wind), 2.0);
    let hv = normalize(moonDir - rd);
    let nh = hv.y;
    let D = a2 / (3.14159 * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
    let fh = 0.02 + 0.98 * pow(1.0 - max(dot(hv, -rd), 0.0), 5.0);
    let moonSeen = A.r * lit * (1.0 - mtn) * nsKeyI;
    let depth = WATER_Y - (textureSampleLevel(terH, terS, uv, lod).b * TER_RANGE + TER_LO);
    let below = mix(vec3f(0.0010, 0.0017, 0.0026), vec3f(0.02, 0.04, 0.05), nsDay)
              + alb * (MOON_G * A.r * lit * 0.5 + SKY_G) * 0.4 * exp(-max(depth, 0.0) * 1.6);
    col = below * (1.0 - fres) + refl * fres + MOON_WARM * mix(0.0035, 0.03, nsDay) * D * fh / cv * moonSeen;
    col += LAMP_C * lampsOn * textureSampleLevel(terL, terS, uv, lod + 3.0).x * 0.10 * (0.35 + fres);
  }
  let WARN_C = vec3f(1.00, 0.05, 0.02);
  let MAST_H = 1.8;
  let MAST_W = 0.07;
  var beacons = vec3f(0.0);
  let rxz = max(dot(rd.xz, rd.xz), 1e-6);
  for (var m = 0; m < 2; m++) {
    if (f32(m) >= mastN) { break; }
    var M = mast0;
    if (m == 1) { M = mast1; }
    var mp = po.xz + gmod2(M.xy - po.xz + 0.5 * TILE, TILE) - 0.5 * TILE;
    let q = ro.xz + rd.xz * clamp(dot(mp - ro.xz, rd.xz) / rxz, 0.0, t);
    mp = q + gmod2(M.xy - q + 0.5 * TILE, TILE) - 0.5 * TILE;
    let sH = dot(mp - ro.xz, rd.xz) / rxz;
    if (sH <= 0.0 || sH > t + 2.0) { continue; }
    let on = smoothstep(0.0, 0.04, fract(time * 0.5 + M.w)) * smoothstep(0.36, 0.26, fract(time * 0.5 + M.w));
    let px = pixAngC * sH;
    let hgt = ro.y + rd.y * sH - M.z;
    if (hgt > -0.3 && hgt < MAST_H) {
      let dh = length(ro.xz + rd.xz * sH - mp);
      let w = max(px, MAST_W);
      let cov = MAST_W / w * max(1.0 - dh / w, 0.0);
      let steel = 0.10 * (MOON_G * 0.5 * lit + SKY_G) + WARN_C * 0.04 * on;
      col = mix(col, steel, cov * 0.85);
    }
    for (var k = 0; k < 2; k++) {
      var up = 0.5;
      var I = 0.7;
      if (k == 0) { up = 1.0; I = 3.0 * on; }
      let v = vec3f(mp.x, M.z + MAST_H * up, mp.y) - ro;
      let s = dot(v, rd);
      if (s > t + 2.0) { continue; }
      let r = length(v - rd * s) / (pixAngC * s);
      beacons += WARN_C * I * (exp(-r * r * 1.4) + 0.04 * exp(-r * 0.5)) * exp(-s * 0.0028 * 0.8);
    }
    if (land) {
      let dg = po.xz - mp;
      col += WARN_C * on * alb * 0.25 / (1.0 + dot(dg, dg) * 2.0);
    }
  }
  let haze = 1.0 - exp(-(t - (Y_MIN - ro.y) / rd.y) * 0.0028);
  let hazeC = mix(vec3f(0.0030, 0.0052, 0.0115), vec3f(0.30, 0.38, 0.48), nsDay)
            + MOON_COOL * mix(0.010, 0.08, nsDay) * pow(max(cosT, 0.0), 6.0);
  return vec4f(mix(col, hazeC, haze * 0.8) + beacons, t);
}
${COMMON_WGSL}
${WORLD_WGSL}
${TERRAIN_COMMON}
`;
