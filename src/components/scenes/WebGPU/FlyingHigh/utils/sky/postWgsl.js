import { COMMON_WGSL } from './worldWgsl';

// Nightscape's TAA_FRAG. WebGPU frame coordinates run top-down, so rays and
// the reprojection work in Nightscape's bottom-up uv and flip only to sample.
export const TAA_WGSL = /* wgsl */ `
fn nsTaa(fragCoord: vec2f, size: vec2f, camPos: vec3f, camR: vec3f, camU: vec3f, camF: vec3f,
         prevPos: vec3f, prevR: vec3f, prevU: vec3f, prevF: vec3f,
         tanHalf: f32, aspect: f32, prevTanHalf: f32, prevAspect: f32, reset: f32,
         tCur: texture_2d<f32>, tHist: texture_2d<f32>, sHist: sampler) -> vec4f {
  let ip = vec2i(fragCoord);
  let mx = vec2i(size) - 1;
  var m1 = vec4f(0.0);
  var m2 = vec4f(0.0);
  var cur = vec4f(0.0);
  var dMin = 1e9;
  for (var j = -1; j <= 1; j++) {
    for (var i = -1; i <= 1; i++) {
      let raw = textureLoad(tCur, clamp(ip + vec2i(i, j), vec2i(0), mx), 0);
      let dq = floor(raw.a);
      let c = vec4f(raw.rgb, (raw.a - dq) / 0.999);
      if (i == 0 && j == 0) { cur = c; }
      dMin = min(dMin, dq / 32.0);
      m1 += c;
      m2 += c * c;
    }
  }
  m1 /= 9.0;
  m2 /= 9.0;
  let sig = sqrt(max(m2 - m1 * m1, vec4f(0.0)));
  let lo = m1 - 1.7 * sig;
  let hi = m1 + 1.7 * sig;

  let tex = (vec2f(ip) + 0.5) / size;
  let uv = vec2f(tex.x, 1.0 - tex.y);
  let ndc = uv * 2.0 - 1.0;
  let rd = normalize(camF + camR * ndc.x * tanHalf * aspect + camU * ndc.y * tanHalf);
  var v = camPos + rd * dMin - prevPos;
  if (dMin > 240.0) { v = rd; }
  let z = dot(v, prevF);
  var outc = cur;
  if (reset < 0.5 && z > 1e-4) {
    let pu = 0.5 + 0.5 * vec2f(dot(v, prevR) / (z * prevTanHalf * prevAspect), dot(v, prevU) / (z * prevTanHalf));
    if (pu.x >= 0.0 && pu.y >= 0.0 && pu.x <= 1.0 && pu.y <= 1.0) {
      let h = clamp(textureSampleLevel(tHist, sHist, vec2f(pu.x, 1.0 - pu.y), 0.0), lo, hi);
      let motion = length((pu - uv) * size);
      let a = mix(0.06, 0.18, clamp(motion / 8.0, 0.0, 1.0));
      outc = mix(h, cur, a);
    }
  }
  return max(outc, vec4f(0.0));
}
`;

// Nightscape's RAYS_FRAG: a radial blur toward the light's screen position.
export const RAYS_WGSL = /* wgsl */ `
fn nsRays(fragUv: vec2f, fragCoord: vec2f, moonUV: vec2f, aspect: f32, moonRuv: f32, fade: f32, lumW: f32,
          tCloud: texture_2d<f32>, sCloud: sampler) -> vec4f {
  if (fade <= 0.0) { return vec4f(0.0); }
  let N = 64;
  let delta = (moonUV - fragUv) / f32(N);
  let j = ign(fragCoord);
  var s = fragUv + delta * j;
  var decay = 1.0;
  var sum = 0.0;
  for (var i = 0; i < N; i++) {
    let c = textureSampleLevel(tCloud, sCloud, vec2f(s.x, 1.0 - s.y), 0.0);
    let r = length((s - moonUV) * vec2f(aspect, 1.0)) / moonRuv;
    var src = c.a * (smoothstep(1.25, 0.75, r) + 0.32 * exp(-r * 0.75) + 0.025 * exp(-r * 0.28));
    let lum = dot(c.rgb, vec3f(0.3, 0.5, 0.2));
    src += max(lum - 0.42, 0.0) * lumW;
    sum += src * decay;
    decay *= 0.974;
    s += delta;
  }
  return vec4f(vec3f(sum / f32(N) * fade), 1.0);
}
${COMMON_WGSL}
`;

// Nightscape's HERO_STARS: [degrees right of straight ahead, degrees up,
// brightness, colour, twinkle], baked into the shader the same way.
const HERO_STARS = [
  [1, 2.5, 6.0, [1.0, 0.56, 0.36], 0.3],
  [16, 5.5, 7.0, [0.82, 0.89, 1.0], 1],
  [27, 9.0, 5.5, [1.0, 0.93, 0.8], 1],
  [-28, 6.0, 5.0, [0.94, 0.96, 1.0], 1],
];
const HERO_WGSL = HERO_STARS.map(([az, el, b, c, twk]) => {
  const A = (az * Math.PI) / 180;
  const E = (el * Math.PI) / 180;
  const d = [
    Math.sin(A) * Math.cos(E),
    Math.sin(E),
    -Math.cos(A) * Math.cos(E),
  ];
  const ext = 0.35 + 0.65 * Math.min(Math.max(el / 14, 0), 1);
  const warm = 1 - Math.min(Math.max(el / 12, 0), 1);
  const col = [c[0], c[1] * (1 - 0.15 * warm), c[2] * (1 - 0.35 * warm)].map(
    (v) => (v * b * ext).toFixed(3)
  );
  const f = (v) => v.toFixed(5);
  return `  col += heroStar(rd, vec3f(${f(d[0])}, ${f(d[1])}, ${f(d[2])}), vec3f(${col.join(', ')}), ${((0.18 + 0.25 * warm) * twk).toFixed(3)}, ${(az * 0.37).toFixed(2)}, pixAng, time, twk);`;
}).join('\n');

// Nightscape's COMPOSITE_FRAG up to the grade: sky, stars, hero stars and
// the moon disk behind the clouds, plus the light shafts, left linear for
// the grade pass. By day the stars fade out and the sun, in its own place,
// takes over from the moon.
export const SKY_WGSL = /* wgsl */ `
fn nsSky(fragUv: vec2f, cloud: vec4f, rays: f32, camR: vec3f, camU: vec3f, camF: vec3f, moonDir: vec3f,
         sunDir: vec3f, tanHalf: f32, aspect: f32, time: f32, pixAng: f32, moonR: f32, twk: f32, starLow: f32,
         raysAmt: f32, day: f32, moonT: texture_2d<f32>, moonS: sampler) -> vec4f {
  nsDay = day;
  let c = cloud;
  let ndc = fragUv * 2.0 - 1.0;
  let rd = normalize(camF + camR * ndc.x * tanHalf * aspect + camU * ndc.y * tanHalf);
  let am = 2.0 * asin(clamp(length(rd - moonDir) * 0.5, 0.0, 1.0));
  let sa = 2.0 * asin(clamp(length(rd - sunDir) * 0.5, 0.0, 1.0));
  let starVis = smoothstep(max(starLow - 0.035, 0.0), starLow, rd.y) * mix(0.7, 1.0, smoothstep(0.0, 0.2, rd.y))
              * smoothstep(0.06, 0.45, am) * (1.0 - day);
  let maskM = 1.0 - smoothstep(moonR * 0.92, moonR * 0.99, am);
  let maskS = 1.0 - smoothstep(moonR * 0.92, moonR * 0.99, sa);
  let diskMask = max(maskM * (1.0 - day), maskS * day);
  var st = vec3f(0.0);
  if (starVis * c.a > 0.0) { st = stars(rd, pixAng, time, twk) * starVis; }
  if (rd.y > 0.0 && rd.y < 0.3 && c.a > 0.0 && day < 1.0) {
    st += heroStars(rd, pixAng, time, twk) * smoothstep(0.0, 0.015, rd.y) * smoothstep(0.03, 0.2, am) * (1.0 - day);
  }
  var disk = vec3f(0.0);
  if (dot(rd, moonDir) > 0.9) { disk += moonDisk(rd, moonDir, pixAng, moonR, moonT, moonS) * (1.0 - day); }
  if (dot(rd, sunDir) > 0.9) { disk += sunDisk(rd, sunDir, pixAng, moonR) * day; }
  let sky = skyBase(rd, moonDir, sunDir) * (1.0 - 0.82 * diskMask) + st + disk;
  var col = c.rgb + sky * c.a;
  col += rays * mix(vec3f(0.74, 0.80, 0.95), vec3f(1.00, 0.94, 0.82), day) * 0.6 * raysAmt * (1.0 - 0.8 * diskMask * c.a);
  return vec4f(col, 1.0);
}

fn twinkle(seed: f32, amp: f32, time: f32) -> f32 {
  let n = 0.5 * sin(time * (11.0 + 7.0 * fract(seed * 1.37)) + seed * 40.0)
        + 0.3 * sin(time * (17.0 + 9.0 * fract(seed * 2.11)) + seed * 13.0)
        + 0.2 * sin(time * (5.0 + 3.0 * fract(seed * 3.70)) + seed * 7.0);
  return 1.0 - amp * (0.5 + 0.5 * n);
}
fn stars(rd: vec3f, pixAng: f32, time: f32, twk: f32) -> vec3f {
  var col = vec3f(0.0);
  for (var l = 0; l < 2; l++) {
    var sc = 330.0;
    var thr = 0.9915;
    var thrLow = 0.0085;
    var magK = 0.45;
    if (l == 0) { sc = 150.0; thr = 0.9935; thrLow = 0.0065; magK = 1.0; }
    thr -= (1.0 - smoothstep(0.0, 0.3, rd.y)) * thrLow;
    let w = max(0.045, pixAng * sc * 0.85);
    let p = rd * sc;
    let c0 = floor(p);
    let fp = fract(p);
    let s = step(vec3f(0.5), fp) * 2.0 - 1.0;
    let skipAx = step(vec3f(2.5 * w), min(fp, 1.0 - fp));
    for (var k = 0; k < 8; k++) {
      let o = vec3f(gmod(f32(k), 2.0), gmod(floor(f32(k) * 0.5), 2.0), floor(f32(k) * 0.25));
      if (dot(o, skipAx) > 0.0) { continue; }
      let id = c0 + o * s;
      let h = hash33(id + f32(l) * 71.3);
      if (h.x < thr) { continue; }
      let h2 = hash33(id * 1.7 + 11.0);
      let pt = normalize(id + 0.5 + (h2 - 0.5) * 0.55) * sc;
      if (any(floor(pt) != id)) { continue; }
      let v = pt - rd * dot(pt, rd);
      let d = length(v);
      let mag = magK * (0.18 + 2.6 * pow(h2.y, 7.0));
      let tw = twinkle(h.y + h2.x * 3.1, min(mix(0.6, 0.32, smoothstep(0.05, 0.45, rd.y)) * twk, 1.0), time);
      let tint = mix(vec3f(0.70, 0.80, 1.00), vec3f(1.00, 0.88, 0.72), h.z);
      col += tint * mag * tw * exp(-d * d / (w * w)) * (0.045 * 0.045) / (w * w);
    }
  }
  return col;
}
fn heroStar(rd: vec3f, dir: vec3f, col: vec3f, tw: f32, ph: f32, pixAng: f32, time: f32, twk: f32) -> vec3f {
  let v = rd - dir;
  let th2 = dot(v, v);
  let wr = max(pixAng * 0.9, 3.0e-4);
  if (th2 > 900.0 * wr * wr) { return vec3f(0.0); }
  let core = exp(-th2 / (wr * wr)) * (9.0e-8 / (wr * wr));
  let glow = 0.025 * exp(-sqrt(th2) / (wr * 3.0)) * (3.0e-4 / wr);
  return col * (core + glow) * twinkle(ph * 0.137 + 0.5, min(tw * 1.6 * twk, 1.0), time);
}
fn heroStars(rd: vec3f, pixAng: f32, time: f32, twk: f32) -> vec3f {
  var col = vec3f(0.0);
${HERO_WGSL}
  return col;
}
fn moonDisk(rd: vec3f, m: vec3f, pixAng: f32, moonR: f32, moonT: texture_2d<f32>, moonS: sampler) -> vec3f {
  let mr = normalize(cross(m, vec3f(0.0, 1.0, 0.0)));
  let mu = cross(mr, m);
  let uv = vec2f(dot(rd, mr), dot(rd, mu)) / moonR;
  let r = length(uv);
  let aa = pixAng / moonR;
  let edge = 1.0 - smoothstep(1.0 - aa * 1.2, 1.0 + aa * 0.6, r);
  if (edge <= 0.0) { return vec3f(0.0); }
  let n = vec3f(uv, sqrt(max(1.0 - r * r, 0.0)));
  let lon = atan2(n.x, n.z);
  let lat = asin(clamp(n.y, -1.0, 1.0));
  let m0 = textureSampleLevel(moonT, moonS, vec2f(0.5 + lon / 6.2831853, 0.5 + lat / 3.1415927), 0.0).r;
  let alb = pow(m0, 1.2) * 1.75;
  let limb = 0.88 + 0.12 * pow(n.z, 0.6);
  let tint = mix(vec3f(1.00, 0.82, 0.60), vec3f(1.0, 0.93, 0.80), n.z);
  return tint * alb * limb * edge * 1.3;
}
fn sunDisk(rd: vec3f, m: vec3f, pixAng: f32, moonR: f32) -> vec3f {
  let mr = normalize(cross(m, vec3f(0.0, 1.0, 0.0)));
  let mu = cross(mr, m);
  let r = length(vec2f(dot(rd, mr), dot(rd, mu))) / moonR;
  let aa = pixAng / moonR;
  let edge = 1.0 - smoothstep(1.0 - aa * 1.2, 1.0 + aa * 0.6, r);
  let limb = 0.75 + 0.25 * sqrt(max(1.0 - r * r, 0.0));
  return vec3f(1.00, 0.96, 0.88) * 40.0 * limb * edge;
}
${COMMON_WGSL}
`;

// Nightscape's grade, from the end of COMPOSITE_FRAG: exposure and white
// balance, ACES, split toning, night glow, saturation, contrast, vignette,
// display gamma, then film grain and a dither. Run over the whole frame.
export const GRADE_WGSL = /* wgsl */ `
fn nsGrade(colIn: vec3f, fragUv: vec2f, fragCoord: vec2f, res: vec2f, aspect: f32, time: f32,
           balance: vec3f, shadowTint: vec3f, highTint: vec3f, a: vec4f, b: vec4f) -> vec4f {
  let exposure = a.x;
  let shadowAmt = a.y;
  let highAmt = a.z;
  let lift = a.w;
  let sat = b.x;
  let contrast = b.y;
  let vignette = b.z;
  let grain = b.w;
  let LW = vec3f(0.2126, 0.7152, 0.0722);
  var col = colIn * exposure * balance;
  col = aces(col);
  let lum = dot(col, LW);
  let sT = shadowTint / max(dot(shadowTint, LW), 1e-3);
  let hT = highTint / max(dot(highTint, LW), 1e-3);
  col *= mix(vec3f(1.0), sT, (1.0 - smoothstep(0.0, 0.5, lum)) * shadowAmt);
  col *= mix(vec3f(1.0), hT, smoothstep(0.3, 1.0, lum) * highAmt);
  col += shadowTint * lift * 0.012 * (1.0 - lum);
  let l2 = dot(col, LW);
  col = max(mix(vec3f(l2), col, sat), vec3f(0.0));
  col = pow(col, vec3f(contrast));
  let vq = (fragUv - 0.5) * vec2f(aspect, 1.0);
  col *= mix(1.0 - vignette, 1.0, smoothstep(1.15, 0.30, length(vq)));
  col = pow(max(col, vec3f(0.0)), vec3f(1.0 / 2.2));
  let fr = fract(floor(time * 24.0) * 0.6180339) * 97.0;
  let gp = fragCoord / (1.5 * max(res.y / 1080.0, 0.6));
  let gm = grainN(gp, fr) + 0.45 * (hash12(fragCoord + fr * 13.0) - 0.5);
  let g = vec3f(gm) + 0.30 * vec3f(grainN(gp + 17.3, fr + 1.0), 0.0, grainN(gp + 41.7, fr + 2.0));
  let gl = dot(col, LW);
  let gw = (0.4 + 0.6 * smoothstep(0.0, 0.2, gl)) * (1.0 - 0.6 * smoothstep(0.45, 1.0, gl));
  col += g * grain * 7.0 * gw;
  col += (hash12(fragCoord + fract(time * 7.31) * 513.0) - 0.5) / 255.0;
  return vec4f(col, 1.0);
}
fn aces(x: vec3f) -> vec3f {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), vec3f(0.0), vec3f(1.0));
}
fn grainN(p: vec2f, s: f32) -> f32 {
  let i = floor(p);
  var f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  let o = vec2f(s * 37.0, s * 91.0);
  return mix(mix(hash12(i + o), hash12(i + o + vec2f(1.0, 0.0)), f.x),
             mix(hash12(i + o + vec2f(0.0, 1.0)), hash12(i + o + vec2f(1.0, 1.0)), f.x), f.y) - 0.5;
}
${COMMON_WGSL}
`;
