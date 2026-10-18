import { LOGS, LOG_LIFE_OFFSET } from './fireLighting';

const num = (v) => v.toFixed(8);
const vec = (v) => `vec3f(${num(v.x)}, ${num(v.y)}, ${num(v.z)})`;
const LOG_CASES = LOGS.map(
  (log, i) =>
    `case ${i}u: { return CampfireLog(${vec(log.center)}, ${vec(log.burnDir)}, ${num(log.rotY)}, ${num(log.rotZ)}, ${num(log.radius)}, ${num(log.length)}, ${num(LOG_LIFE_OFFSET[i])}); }`
).join('\n    ');

// "Campfire at night" by Maurogik (shadertoy.com/view/Wtc3W2), Common tab.
// GLSL out-params became returned structs; its "ugly globals" stay private vars.
const COMMON_WGSL = /* wgsl */ `
const kPI: f32 = 3.14159265359;
const kTwoPI: f32 = 6.28318530718;
const kGoldenRatio: f32 = 1.618;
const kMaxDist: f32 = 200.0;
const kTimeScale: f32 = 1.0;
const kNumLogs: u32 = 7u;
const kCampfireCenterWS = vec3f(0.05, 0.0, 0.02);
const kFireStartSphere = vec4f(0.15, 0.25, 0.15, 0.2);
const kFireEndSphere = vec4f(0.1, 0.8, 0.1, 0.05);
const kFireLightColour = vec3f(1.0, 0.18, 0.035) * 0.5 / (0.2 * 0.2 * 0.5);
const kSkyColour = vec3f(0.2, 0.5, 1.0) * 0.005;

// initLogs' table as a switch: an indexed array (private or const) spills.
fn getLog(i: u32) -> CampfireLog {
  switch i {
    ${LOG_CASES}
    default: { return CampfireLog(vec3f(0.0), vec3f(0.0, 1.0, 0.0), 0.0, 0.0, 0.0, 0.0, 0.0); }
  }
}

struct CampfireLog {
  centerWS: vec3f,
  burnDirWS: vec3f,
  rotationY: f32,
  rotationZ: f32,
  logRadius: f32,
  logLength: f32,
  lifeOffset: f32,
};

var<private> s_globalFireLife: f32 = 1.0;
var<private> s_time: f32 = 0.0;
var<private> s_timeDelta: f32 = 0.016;
var<private> s_pixelRand: f32 = 0.0;
var<private> s_pixelCone: f32 = 0.0;
// The original's NON_CONST_ZERO: a runtime zero so loops are not unrolled.
var<private> s_zeroI: i32 = 0;
var<private> s_zeroU: u32 = 0u;

fn fmod1(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }
fn fmod2(x: vec2f, y: vec2f) -> vec2f { return x - y * floor(x / y); }
fn fmod3(x: vec3f, y: vec3f) -> vec3f { return x - y * floor(x / y); }

fn smoothstepg(e0: f32, e1: f32, x: f32) -> f32 {
  let t = saturate((x - e0) / (e1 - e0));
  return t * t * (3.0 - 2.0 * t);
}

fn linearstep(start: f32, end: f32, x: f32) -> f32 {
  return saturate((x - start) / (end - start));
}

fn vmax(v: vec3f) -> f32 { return max(max(v.x, v.y), v.z); }
fn fSphere(p: vec3f, r: f32) -> f32 { return length(p) - r; }
fn fBoxCheap(p: vec3f, b: vec3f) -> f32 { return vmax(abs(p) - b); }

fn fCylinder(p: vec3f, r: f32, height: f32) -> f32 {
  var d = length(p.xz) - r;
  d = max(d, abs(p.y) - height);
  return d;
}

fn fCapsuleY(p: vec3f, r: f32, c: f32) -> f32 {
  return mix(length(p.xz) - r, length(vec3f(p.x, abs(p.y) - c, p.z)) - r, step(c, abs(p.y)));
}

fn fLineSegment(p: vec3f, a: vec3f, b: vec3f) -> f32 {
  let ab = b - a;
  let t = saturate(dot(p - a, ab) / dot(ab, ab));
  return length((ab * t + a) - p);
}

fn fCapsuleAB(p: vec3f, a: vec3f, b: vec3f, r: f32) -> f32 {
  return fLineSegment(p, a, b) - r;
}

fn pR(p: vec2f, a: f32) -> vec2f {
  return cos(a) * p + sin(a) * vec2f(p.y, -p.x);
}

fn pModPolar(p: ptr<function, vec2f>, repetitions: f32) -> f32 {
  let angle = 2.0 * kPI / repetitions;
  var a = atan2((*p).y, (*p).x) + angle / 2.0;
  let r = length(*p);
  var c = floor(a / angle);
  a = fmod1(a, angle) - angle / 2.0;
  *p = vec2f(cos(a), sin(a)) * r;
  if (abs(c) >= (repetitions / 2.0)) {
    c = abs(c);
  }
  return c;
}

fn pMod2(p: ptr<function, vec2f>, size: vec2f) -> vec2f {
  let c = floor((*p + size * 0.5) / size);
  *p = fmod2(*p + size * 0.5, size) - size * 0.5;
  return c;
}

fn pMod3(p: ptr<function, vec3f>, size: vec3f) -> vec3f {
  let c = floor((*p + size * 0.5) / size);
  *p = fmod3(*p + size * 0.5, size) - size * 0.5;
  return c;
}

fn plaIntersect(ro: vec3f, rd: vec3f, p: vec4f) -> f32 {
  return -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);
}

fn sdEllipsoid(p: vec3f, r: vec3f) -> f32 {
  let k0 = length(p / r);
  let k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}

fn sdEllipsoidY(p: vec3f, r: vec2f) -> f32 {
  return (length(p / r.xyx) - 1.0) * r.x;
}

fn smin(a: f32, b: f32, k: f32) -> f32 {
  let h = max(k - abs(a - b), 0.0);
  return min(a, b) - h * h * 0.25 / k;
}

fn smax(a: f32, b: f32, k: f32) -> f32 {
  let h = max(k - abs(a - b), 0.0);
  return max(a, b) + h * h * 0.25 / k;
}

fn hash11(pIn: f32) -> f32 {
  var p = fract(pIn * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

fn hash12(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash22(p: vec2f) -> vec2f {
  var p3 = fract(vec3f(p.xyx) * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

fn blackBodyToRGB(temp: f32, brightness: f32) -> vec3f {
  var res = vec3f(0.0);
  for (var i = s_zeroI; i < 3; i++) {
    let f = 1.0 + 0.5 * f32(i);
    res[i] += brightness * (f * f * f) / (exp((19e3 * f / temp)) - 1.0);
  }
  return res;
}

fn roughFresnel(f0: vec3f, cosA: f32, roughness: f32) -> vec3f {
  return f0 + (vec3f(1.0) - f0) * (pow(1.0 - cosA, 5.0)) * (1.0 - roughness);
}

fn fixNormalBackFacingness(rayDirWS: vec3f, normalWSIn: vec3f) -> vec3f {
  return normalWSIn - max(0.0, dot(normalWSIn, rayDirWS)) * rayDirWS;
}

fn computeParaboloidUv(dirIn: vec3f) -> vec2f {
  var dir = dirIn;
  let xz = dir.xz / (abs(dir.y) + 1.0);
  return xz * 0.5 + vec2f(0.5);
}

fn luminance(rgb: vec3f) -> f32 {
  return (rgb.r * 0.3) + (rgb.g * 0.59) + (rgb.b * 0.11);
}

fn tonemapOp(vIn: f32) -> f32 {
  var v = pow(vIn, 2.0);
  v = v / (1.0 + v);
  return pow(v, 1.0 / 2.0) * 1.02;
}

fn tonemap(colour: vec3f) -> vec3f {
  let lum = max(0.0001, luminance(colour));
  let normalisedColour = colour / lum;
  let tonemapColour = vec3f(tonemapOp(colour.r), tonemapOp(colour.g), tonemapOp(colour.b));
  let tonemappedLuminance = tonemapOp(lum);
  return mix(tonemappedLuminance * normalisedColour, tonemapColour, min(1.0, 0.5 * lum));
}

fn diskLight(coneDirWS: vec3f, dirToLightWS: vec3f, cosAngularRadius: f32, roughness: f32) -> f32 {
  let vDotL = dot(coneDirWS, dirToLightWS);
  let brdfDiskSolidAngle = 2.0 * kPI * (1.0 - cos(acos(cosAngularRadius) + roughness * 0.5 * kPI));
  let diskSolidAngle = 2.0 * kPI * (1.0 - cosAngularRadius);
  let brightness = max(0.00001, diskSolidAngle) / max(0.00001, brdfDiskSolidAngle);
  var diskVisibility = max(0.0, linearstep(
    acos(cosAngularRadius) + 0.01 + roughness * kPI * 0.5,
    acos(cosAngularRadius) - 0.01 - roughness * kPI * 0.5,
    acos(vDotL))) * 2.0;
  let brdfPower = 7.0 - 6.0 * roughness;
  diskVisibility = pow(diskVisibility, brdfPower);
  let normalisationFactor = 1.0 / (brdfPower + 1.0);
  diskVisibility /= max(0.00001, normalisationFactor);
  return min(1.0, diskVisibility * brightness);
}

fn computeSphereLighting(posWS: vec3f, coneDirWS: vec3f, roughness: f32, lightSphere: vec4f, colour: vec3f) -> vec3f {
  let posToSphereWS = lightSphere.xyz - posWS;
  let distToSphereCenter = length(posToSphereWS);
  let sqDistToSphere = distToSphereCenter * distToSphereCenter;
  let sqSphereRadius = lightSphere.a * lightSphere.a;
  let distToDisk = (1.0 / max(0.001, distToSphereCenter)) * max(0.001, sqDistToSphere - sqSphereRadius);
  let diskRadius = (lightSphere.a / distToSphereCenter) * sqrt(max(0.001, sqDistToSphere - sqSphereRadius));
  let cosSphereAngularRadius = clamp(distToDisk / sqrt(distToDisk * distToDisk + diskRadius * diskRadius), -1.0, 1.0);
  let posToSphereDirWS = posToSphereWS / distToSphereCenter;
  var sphereLighting = diskLight(coneDirWS, posToSphereDirWS, cosSphereAngularRadius, roughness);
  if (distToSphereCenter < lightSphere.a) {
    sphereLighting = mix(1.0, sphereLighting, distToSphereCenter / lightSphere.a);
  }
  return colour * sphereLighting;
}

fn computeTubeLighting(posWS: vec3f, coneDirWS: vec3f, roughness: f32, startSphere: vec4f, endSphere: vec4f, colour: vec3f) -> vec3f {
  let startToEnd = endSphere.xyz - startSphere.xyz;
  let startToEndDir = normalize(startToEnd);
  let planeTangent = normalize(cross(startToEndDir, -coneDirWS));
  let planeNormal = normalize(cross(planeTangent, startToEndDir));
  let plane = vec4f(-planeNormal, dot(startSphere.xyz, planeNormal));
  let closestPointDistAlongRay = plaIntersect(posWS, coneDirWS, plane);
  let closesPointToTube = posWS + coneDirWS * closestPointDistAlongRay;
  let startToClosest = closesPointToTube - startSphere.xyz;
  let closestDirProgress = saturate(dot(startToClosest, startToEnd) / dot(startToEnd, startToEnd));
  let startToPos = posWS - startSphere.xyz;
  let closestPointProgress = saturate(dot(startToPos, startToEnd) / dot(startToEnd, startToEnd));
  let progress = mix(closestDirProgress, closestPointProgress, roughness * roughness);
  return computeSphereLighting(posWS, coneDirWS, roughness, mix(startSphere, endSphere, progress), colour);
}

fn computeLightingCone(posWS: vec3f, rayDirWS: vec3f, normalWS: vec3f, roughness: f32, ambientVis: f32, shadow: f32) -> vec3f {
  let coneDirWS = normalize(mix(rayDirWS, normalWS, roughness * roughness * 0.75));
  let coalsDiskCenter = kCampfireCenterWS - vec3f(0.0, 0.1, 0.0);
  let coneY = select(coneDirWS.y, 0.0001, coneDirWS.y == 0.0);
  let coneIntersectedWithGround = posWS + coneDirWS * -(posWS.y - coalsDiskCenter.y) / coneY;
  let coalsDiskRadiusWS = 0.73;
  let campfireToGroundPosWS = coneIntersectedWithGround - coalsDiskCenter;
  let campfireToConeGroundDirWS = normalize(campfireToGroundPosWS);
  let farDiskPointOnGroundWS = coalsDiskCenter + campfireToConeGroundDirWS * coalsDiskRadiusWS;
  let posToCoalsDiskCenterDirWS = normalize(coalsDiskCenter - posWS);
  let coalsDiskAngularRadius = dot(normalize(farDiskPointOnGroundWS - posWS), posToCoalsDiskCenterDirWS);

  let sky = kSkyColour / (1.0 + 0.03 * dot(posWS, posWS));
  var ambient = sky;
  let groundAlbedo = vec3f(0.2, 0.15, 0.05);
  let groundColour = groundAlbedo * saturate(s_globalFireLife + 0.05) * 0.05 *
    (kFireLightColour / (roughness + 1.0 + dot(campfireToGroundPosWS, campfireToGroundPosWS)));
  ambient = mix(ambient, groundColour, smoothstepg(0.001 + roughness * 1.5, -0.001 - roughness * 1.5, coneDirWS.y));

  ambient += shadow * 0.1 * vec3f(1.0, 0.075, 0.01) * saturate(10.0 * (s_globalFireLife * 0.75 + 0.25)) *
    diskLight(coneDirWS, posToCoalsDiskCenterDirWS, coalsDiskAngularRadius, roughness);

  ambient *= ambientVis;

  for (var i = s_zeroU; i < kNumLogs; i++) {
    let log = getLog(i);
    let logLength = log.logLength;
    let logCenterWS = log.centerWS;
    let burnDirWS = log.burnDirWS;
    let rand = kGoldenRatio * f32(i);
    let fireLife = s_globalFireLife - log.lifeOffset;
    var flameCenterWS = logCenterWS + burnDirWS * (saturate(fireLife) * 2.0 - 1.0) * logLength;
    let sqrtFireLife = sqrt(max(0.0001, fireLife));
    let flameHeight = max(0.15, 0.2 + fireLife * 1.2) * 0.65;
    let flameRadius = (0.1 + sqrtFireLife) * 0.2 * 0.75;
    flameCenterWS.y = max(flameCenterWS.y, flameRadius + 0.05);
    let fireBottomLight = vec4f(flameCenterWS, max(0.075, flameRadius));
    let fireTopLight = vec4f(flameCenterWS + vec3f(0.0, flameHeight, 0.0), 0.01);
    let fireLight = computeTubeLighting(posWS, coneDirWS, roughness, fireBottomLight, fireTopLight, kFireLightColour);
    let lightIntensity = sqrt(saturate(fireLife + 0.1));
    ambient += shadow * fireLight * lightIntensity *
      (1.0 + sin(rand * 2.0 - 10.0 * s_time) * 0.35 + sin(rand * 4.0 - 15.0 * s_time) * 0.25);
  }
  return ambient;
}

// initLogs' fire-life curve runs in fireLighting.js, so the burn can be held or run once.
fn initLogs(fireLife: f32) {
  s_globalFireLife = fireLife;
}
`;

export default COMMON_WGSL;
