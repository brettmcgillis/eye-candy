import { BAKED_WGSL, COMMON_WGSL, WORLD_WGSL } from './worldWgsl';

export const BAKE_N = 256;
export const BAKE_NY = 96;

// Nightscape's BAKE_FRAG as one voxel of a compute pass, written straight
// into the 3D texture instead of an atlas read back through the CPU: optical
// depth toward the light (r) and straight up (g), and the shape field (b).
export const BAKE_WGSL = /* wgsl */ `
fn nsBake(id: u32, levelBase: f32, lightDir: vec3f, seed: f32, shape: vec4f, stormH: f32,
          nT: texture_3d<f32>, nS: sampler) -> vec4f {
  setField(seed, shape, stormH);
  let n = ${BAKE_N}u;
  let p = vec3f(
    (f32(id % n) + 0.5) / ${BAKE_N}.0 * TILE,
    Y_MIN + (levelBase + f32(id / (n * n)) + 0.5) / ${BAKE_NY}.0 * (Y_MAX - Y_MIN),
    (f32((id / n) % n) + 0.5) / ${BAKE_N}.0 * TILE
  );
  var od = 0.0;
  var ds = 0.12;
  var tt = 0.0;
  for (var i = 0; i < 150; i++) {
    let q = p + lightDir * (tt + ds * 0.5);
    if (q.y > Y_MAX) { break; }
    od += densLight(sceneSD(nT, nS, q)) * ds * exp(-tt * 0.02);
    tt += ds;
    ds = min(ds * 1.07, 3.0);
  }
  var up = 0.0;
  ds = 0.3;
  tt = 0.0;
  for (var i = 0; i < 14; i++) {
    let q = p + vec3f(0.0, tt + ds * 0.5, 0.0);
    up += densLight(sceneSD(nT, nS, q)) * ds;
    tt += ds;
    ds *= 1.15;
  }
  return vec4f(1.0 - exp(-od * 0.25), 1.0 - exp(-up * 0.4),
               clamp((sceneSDFull(nT, nS, p) + 10.0) / 16.0, 0.0, 1.0), 1.0);
}
${COMMON_WGSL}
${WORLD_WGSL}
`;

// Nightscape's CLOUD_FRAG (PACK on: alpha carries depth and transmittance).
// Rays leaving through the base of the deck keep their transmittance for the
// ground pass; lightning is not lit.
export const CLOUD_WGSL = /* wgsl */ `
fn nsClouds(fragUv: vec2f, fragCoord: vec2f, camPos: vec3f, camR: vec3f, camU: vec3f, camF: vec3f,
            keyDir: vec3f, moonDir: vec3f, sunDir: vec3f, keyI: f32, bakeMix: f32,
            tanHalf: f32, aspect: f32, frame: f32, day: f32, seed: f32,
            nT: texture_3d<f32>, nS: sampler, bA: texture_3d<f32>, bB: texture_3d<f32>, bS: sampler) -> vec4f {
  nsDay = day;
  nsBakeMix = bakeMix;
  nsSeed = seed;
  nsShift = fract(vec3f(seed * 0.6180339, seed * 0.3819660, seed * 0.7548777));
  let MOON_COOL = mix(vec3f(0.74, 0.84, 1.00), vec3f(1.00, 0.97, 0.92), day);
  let MOON_WARM = mix(vec3f(1.00, 0.88, 0.70), vec3f(1.00, 0.82, 0.62), day);
  let AMB_LO = mix(vec3f(0.0060, 0.0085, 0.0170), vec3f(0.10, 0.14, 0.22), day);
  let AMB_HI = mix(vec3f(0.040, 0.060, 0.118), vec3f(0.38, 0.50, 0.72), day)
             * mix(vec3f(1.0), vec3f(1.2, 0.82, 0.68), 0.7 * nsDusk(sunDir));

  let ndc = fragUv * 2.0 - 1.0;
  let rd = normalize(camF + camR * ndc.x * tanHalf * aspect + camU * ndc.y * tanHalf);
  let ro = camPos;

  let tFar = mix(200.0, 320.0, smoothstep(0.0, 0.04, rd.y));
  var tMax = tFar;
  if (rd.y > 0.0) { tMax = min(tMax, (Y_MAX - ro.y) / rd.y); }
  else { tMax = min(tMax, (Y_MIN - ro.y) / rd.y); }

  let cosT = dot(rd, keyDir);
  let ph0 = mix(hg(cosT, -0.22), hg(cosT, 0.80), 0.70);
  let ph1 = mix(hg(cosT, -0.11), hg(cosT, 0.42), 0.70);
  let ph2 = mix(hg(cosT, -0.05), hg(cosT, 0.20), 0.70);
  let backlit = smoothstep(0.35, 0.97, cosT);
  let fogC = skyBase(rd, moonDir, sunDir) * 0.94;
  let AIR_C = mix(vec3f(0.0060, 0.0112, 0.0245), vec3f(0.420, 0.520, 0.620), day) * 0.94;

  let jit = ign(fragCoord + gmod(frame, 64.0) * 5.588238);
  var S = vec3f(0.0);
  var T = 1.0;
  var dSum = 0.0;
  var wSum = 0.0;
  let rz = -rd.z;
  let planar = rz > 0.25;
  var t: f32;
  if (planar) { t = nextPlaneT(ro.z, rz, 0.05); } else { t = 0.05 + jit * 0.22; }
  let SIG = 4.0;
  let MOON_I = mix(3.1, 26.0, day) * keyI;
  let RAMP_K = 0.5;
  let lightCol = mix(mix(MOON_COOL, MOON_WARM, smoothstep(0.55, 0.985, cosT)),
                     vec3f(1.00, 0.60, 0.35), 0.8 * nsWarm(keyDir, sunDir));

  for (var i = 0; i < 300; i++) {
    if (t > tMax || T < 0.012) { break; }
    let p = ro + rd * t;
    let sd = shapeSD(bA, bB, bS, nT, nS, p);
    var spB = 0.0;
    if (planar) { spB = planeSpacing(t * rz); }
    let refine = planar && spB > 0.13 && sd > -1.5 * spB;
    var sp = spB;
    if (refine) { sp = spB * 0.5; }
    var dt: f32;
    if (planar) { dt = sp / rz; } else { dt = 0.08 + t * 0.016; }
    var dtW = dt;
    if (planar) {
      let lam = log2(max(t * rz, 1e-3) / 5.0) + 1.0;
      var f = 0.0;
      if (lam > 0.0) { f = smoothstep(0.5, 1.0, fract(lam)); }
      let odd = gmod(floor((ro.z - t * rz) / sp + 0.5), 2.0) > 0.5;
      if (odd) { dtW = dt * (1.0 - f); } else { dtW = dt * (1.0 + f); }
    }
    if (sd < -0.32) {
      let sk = min(-sd * 0.2, 2.0);
      if (!planar) { t += max(dt, sk); }
      else if (sk <= dt) { t = nextSampleT(ro.z, rz, t, sp, spB, refine); }
      else {
        let ts = t + sk;
        var spL = spB;
        if (ts * rz >= spB * (5.0 / 0.06)) { spL = 2.0 * spB; }
        var spR = spL;
        if (refine) { spR = 0.5 * spL; }
        t = nextPlaneSp(ro.z, rz, ts - 1e-3, spR);
      }
      continue;
    }
    var d = 0.0;
    if (sd > -0.3) {
      let er = (1.0 - detailN(nT, nS, p)) * 0.36 * smoothstep(170.0, 100.0, t);
      let ramp = 2.0 / max(1.0, RAMP_K * 0.096 * t * rz);
      d = clamp((sd + 0.14 - er * (1.0 - clamp(sd * 0.4, 0.0, 0.7))) * ramp, 0.0, 1.0);
      d *= 1.0 - smoothstep(tFar - 45.0, tFar - 4.0, t);
    }
    if (d > 0.004) {
      let lt = lightAt(bA, bB, bS, nT, nS, p, t, keyDir);
      let od = lt.x;
      let e = ph0 * exp(-od * SIG) + 0.34 * ph1 * exp(-od * SIG * 0.40) + 0.14 * ph2 * exp(-od * SIG * 0.17);
      let powder = 1.0 - exp(-max(sd, 0.0) * 2.6 - d * 0.5);
      let pf = mix(mix(0.42, 1.0, powder), 1.0, backlit);
      let hgt = clamp((p.y + 6.0) / 15.0, 0.0, 1.0);
      let occ = exp(-max(sd, 0.0) * 0.5) * mix(0.15, 1.0, exp(-lt.y * 0.5));
      let amb = mix(AMB_LO, AMB_HI, sqrt(hgt)) * (0.28 + 0.72 * occ);
      var L = lightCol * (MOON_I * e * pf) + amb;
      let fogA = 1.0 - exp(-t * 0.016 * mix(1.0, 0.3, smoothstep(4.0, 30.0, p.y)));
      L = mix(L, mix(AIR_C, fogC, smoothstep(100.0, 250.0, t)), fogA);
      let tr = exp(-d * SIG * dtW);
      S += T * L * (1.0 - tr);
      let w = T * (1.0 - tr);
      dSum += w * t;
      wSum += w;
      T *= tr;
    }
    if (planar) { t = nextSampleT(ro.z, rz, t, sp, spB, refine); }
    else { t = t + dt * (0.85 + 0.3 * fract(jit + f32(i) * 0.754878)); }
  }
  let ground = rd.y < 0.0 && t >= tMax && T > 0.003 && (Y_MIN - ro.y) / rd.y <= 200.0;
  var far = 0.0;
  if (!ground) { far = smoothstep(-0.002, -0.03, rd.y); }
  let farC = mix(fogC * vec3f(0.40, 0.44, 0.52), fogC * 0.8, smoothstep(-0.05, -0.002, rd.y));
  S += T * farC * far;
  dSum += T * far * 250.0;
  wSum += T * far;
  T *= 1.0 - far;
  var depth = 250.0;
  if (wSum > 0.02) { depth = dSum / wSum; }
  return vec4f(S, floor(clamp(depth, 0.0, 250.0) * 32.0) + clamp(T, 0.0, 1.0) * 0.999);
}

fn baked(bA: texture_3d<f32>, bB: texture_3d<f32>, bS: sampler, p: vec3f) -> vec2f {
  let b = bakeSample(bA, bB, bS, vec3f(p.x / TILE, p.z / TILE, (p.y - Y_MIN) / (Y_MAX - Y_MIN)));
  return vec2f(-log(max(1.0 - b.r, 2e-3)) * 4.0, -log(max(1.0 - b.g, 2e-3)) * 2.5);
}
fn lightAt(bA: texture_3d<f32>, bB: texture_3d<f32>, bS: sampler, nT: texture_3d<f32>, nS: sampler, p: vec3f, t: f32, moonDir: vec3f) -> vec2f {
  let f = smoothstep(55.0, 80.0, t);
  var farL = vec2f(0.0);
  if (f > 0.0) { farL = baked(bA, bB, bS, p + moonDir * 0.3); }
  if (f >= 1.0) { return farL; }
  let od = densLight(shapeSD(bA, bB, bS, nT, nS, p + moonDir * 0.15)) * 0.3
         + densLight(shapeSD(bA, bB, bS, nT, nS, p + moonDir * 0.45)) * 0.3;
  let b = baked(bA, bB, bS, p + moonDir * 0.6);
  return mix(vec2f(od + b.x, b.y), farL, f);
}
fn planeSpacing(dz: f32) -> f32 {
  return 0.06 * exp2(max(0.0, floor(log2(max(dz, 1e-3) / 5.0)) + 1.0));
}
fn nextPlaneSp(roz: f32, rz: f32, t: f32, sp: f32) -> f32 {
  let zp = roz - t * rz;
  var zn = (ceil(zp / sp) - 1.0) * sp;
  if (zn > zp - 1e-4) { zn -= sp; }
  return (roz - zn) / rz;
}
fn nextSampleT(roz: f32, rz: f32, t: f32, sp: f32, spB: f32, refine: bool) -> f32 {
  var tn = nextPlaneSp(roz, rz, t, sp);
  if (tn * rz >= spB * (5.0 / 0.06)) {
    var s2 = 2.0 * spB;
    if (refine) { s2 = spB; }
    tn = nextPlaneSp(roz, rz, t, s2);
  }
  return tn;
}
fn nextPlaneT(roz: f32, rz: f32, t: f32) -> f32 {
  let sp = planeSpacing(t * rz);
  let zp = roz - t * rz;
  var zn = (ceil(zp / sp) - 1.0) * sp;
  if (zn > zp - 1e-4) { zn -= sp; }
  return (roz - zn) / rz;
}
fn hg(c: f32, g: f32) -> f32 {
  let g2 = g * g;
  return (1.0 - g2) / (12.566 * pow(1.0 + g2 - 2.0 * g * c, 1.5));
}
${COMMON_WGSL}
${WORLD_WGSL}
${BAKED_WGSL}
`;
