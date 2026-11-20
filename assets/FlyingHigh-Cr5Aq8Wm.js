import{V as b,E as Yt,Q as Vt,C as w,M as pe,aa as re,aw as zt,U as Lt,bH as Kt,a3 as ce,aH as Te,ax as At,ce as Mt,H as me,c4 as Be,bk as Xt,aQ as Zt,aB as Qt,h as Se,N as tt,Y as rt,r as h,b as we,u as Rt,T as _t,a as ue,j as O,bX as Jt,a0 as e0,i as t0,d as r0,ah as Ue,a9 as a0}from"./index-DQZ6GwWS.js";import{B as o0}from"./Boeing737--OtxqpzJ.js";import{u as s0,g as n0,C as l0}from"./useSceneCameraControls-BC4-iICD.js";import"./cameraSplinePresets-BMr9cGIk.js";import"./useOperatorInput-D8KjZ0hX.js";import{u as i0,g as c0,L as f0}from"./useSceneLightingControls-BZWbKvgU.js";import{u as c,s as Z,K as L,aZ as j,F as m0,$ as d0,aH as p0,a0 as Me,aF as Y,k as Et,b as te,a as u0,B as v0,ag as he,v as h0}from"./three.tsl-BQ1Hwkua.js";import{s as Dt,c as y0,a as g0,p as x0,b as S0,d as b0,e as k0,u as T0}from"./plumeGuide-DzTnAi_C.js";import{s as w0}from"./splinePath-CpKRxhAX.js";import{g as z0}from"./GaussianBlurNode-BQTiyP2P.js";import{u as L0}from"./usePresetsFolder-CkWPrg4S.js";import{u as A0}from"./useMediaRecorder-MraCH8C3.js";import"./Gltf-CibS0mrh.js";import"./BufferGeometryUtils-B-ciZAdw.js";import"./constants-BKXcfDoE.js";import"./useCameraSpline-yZNjhq0h.js";import"./OrthographicCamera-dKrXIIvC.js";import"./extends-CF3RwP-h.js";import"./Fbo-C5hQEOLB.js";import"./PerspectiveCamera-DuIEtrFP.js";import"./OrbitControls-DnrWlMbh.js";import"./Line-BxK8i1r9.js";import"./Line2-Cwr1UHis.js";import"./math-BSb_Qlxs.js";import"./isMobileDevice-De1yZKQi.js";const M0="Night",Oe={cameraMode:"orbit",cameraProjection:"perspective",cameraFrustumHeight:10,cameraMobileFrustumHeight:10,cameraAutoFit:!0,fixedBehavior:"single",fixedShotDefaultDesktopPosition:{x:0,y:0,z:5},fixedShotDefaultDesktopTarget:{x:0,y:0,z:0},fixedShotDefaultDesktopFov:42,fixedShotDefaultMobilePosition:{x:0,y:0,z:5},fixedShotDefaultMobileTarget:{x:0,y:0,z:0},fixedShotDefaultMobileFov:58,orbitAutoRotate:!0,orbitAutoRotateSpeed:4,orbitEnablePan:!0,orbitMinPolarAngle:0,orbitMaxPolarAngle:180,orbitAzimuthUnlimited:!0,orbitMinAzimuthAngle:-180,orbitMaxAzimuthAngle:180,orbitMinDistance:0,orbitMaxDistanceUnlimited:!0,orbitMaxDistance:100,orbitDesktopPosition:{x:13,y:4.5,z:19},orbitDesktopTarget:{x:0,y:3.2,z:-1.5},orbitDesktopPivot:{x:0,y:3.2,z:-1.5},orbitDesktopFov:42,orbitMobilePosition:{x:19,y:6.5,z:28},orbitMobileTarget:{x:0,y:3.2,z:-1.5},orbitMobilePivot:{x:0,y:3.2,z:-1.5},orbitMobileFov:58,splinePreset:"Loop de Loop",splineDesktopTarget:{x:0,y:0,z:0},splineDesktopFov:42,splineMobileTarget:{x:0,y:0,z:0},splineMobileFov:42,splineOrientationMode:"target",splineForwardDistance:1,splinePosition:{x:0,y:0,z:0},splineScale:{x:1,y:1,z:1},splineDuration:30,splineTension:.5,splineClosed:!0,splineShowPath:!1,operatorMoveSpeed:6,operatorLiftSpeed:6,operatorBoostMultiplier:2,operatorPointerLookSensitivity:.003,operatorStickLookSpeed:2.5,operatorZoomSpeed:24,operatorMinFov:20,operatorMaxFov:80,lightEnabled:!0,lightAmbientEnabled:!0,lightAmbientColor:"#8fa8d0",lightAmbientIntensity:.15,lightSkyEnabled:!0,lightSkySkyColor:"#33507a",lightSkyGroundColor:"#0a0f18",lightSkyIntensity:.4,lightKeyEnabled:!1,lightKeyColor:"#fff5e0",lightKeyIntensity:1,lightKeyPosition:{x:5,y:8,z:10},lightKeyTarget:{x:0,y:0,z:0},lightKeyDebug:!1,planeScale:.6,planePosX:0,planePosY:0,planePosZ:0,planeRotXDeg:2.9,planeRotYDeg:-36,planeRotZDeg:-1.7,bloomEnabled:!0,bloomThreshold:1.1,bloomStrength:.3,bloomRadius:.45,plumeVisible:!0,plumeLeftEngine:!0,plumeRightEngine:!0,plumeLeftWing:!1,plumeRightWing:!1,plumeFireShare:.2,plumeFireHot:"#fff1a8",plumeFireMid:"#ffb02e",plumeFireCool:"#d8431c",plumeFireIntensity:14,plumeGlowColor:"#ff8a3a",plumeGlow:.15,plumeLightIntensity:6,plumeLightDistance:14,skyDay:0,skyLightAz:95,skyLightEl:12,skyMoonLight:1.2,skySunLight:3,skyTwinkle:1.4,skyStarLow:.035,skySpeed:1.25,skyAltitude:0,skySeed:42,skyCoverage:0,skyDeckLift:0,skyHeaps:.62,skyStorms:.45,skyStormHeight:30,skyAutoResolution:!0,skyResolution:.5,gradeExposure:1.15,gradeTemp:-.35,gradeTint:.35,gradeRays:1,gradeSat:1.1,gradeContrast:1.05,gradeShadowAmt:.5,gradeShadow:"#0f8f86",gradeHighAmt:.25,gradeHigh:"#c4ece2",gradeLift:.7,gradeVignette:.38,gradeGrain:.007,plumeSpeed:2.5,plumeRadiusStart:.6,plumeRadiusEnd:3,plumeBillow:.9,plumeBillowScale:.13,plumeDensity:1.5,plumeTopFade:.7,plumeSmokeColor:"#77716c",plumeSoot:6,plumeShadow:1,plumeSteps:220,plumeStepSize:.08,plumeErosion:.2,plumeDetailScale:3,plumeResolution:.5,skyTownLights:1.95,cycleEnabled:!1,cycleHold:15,cycleTransition:5,skySunAz:95,skySunEl:35,flareEnabled:!0,flareIntensity:1,flareSize:1,flareChroma:.03,flareMoon:.15,emberVisible:!0,emberCount:1024,emberLife:1.1,emberSpeed:7,emberBuoyancy:1,emberWind:{x:0,y:.6,z:-16},emberTurbulence:3,emberSize:.05,emberStreak:.08,emberGlow:8},be={Night:{...Oe},"Endless Flight":{...Oe,orbitAutoRotate:!1,cycleEnabled:!0,skyLightAz:95,skyLightEl:12,skySunAz:120,skySunEl:18},Day:{...Oe,lightAmbientIntensity:.4,lightAmbientColor:"#ffffff",lightSkySkyColor:"#87ceeb",lightSkyGroundColor:"#c8d4dc",lightSkyIntensity:.8,skyDay:1,gradeExposure:1,gradeTemp:.05,gradeTint:0,gradeRays:.5,gradeSat:1.05,gradeContrast:1.05,gradeShadowAmt:.2,gradeShadow:"#3d5a86",gradeHighAmt:.1,gradeHigh:"#fff0dc",gradeLift:0,gradeVignette:.25,gradeGrain:.004}};function R0({presetSnapshot:e}){return{...e}}const X=Math.PI/180,_0=new b(0,1,0),E0=new b(0,0,1),at=(e,r)=>new b(Math.sin(e*X)*Math.cos(r*X),Math.sin(r*X),-Math.cos(e*X)*Math.cos(r*X));function Ct(e,r,a){const t=E0.clone().applyEuler(new Yt(e*X,r*X,a*X));return new Vt().setFromAxisAngle(_0,Math.PI-Math.atan2(t.x,t.z))}const ot=e=>e*e*(3-2*e);function D0(e,r,a,t){const s=2*(r+a),n=(e%s+s)%s;let l=1;return n<r?l=0:n<r+a?l=ot((n-r)/a):n>=2*r+a&&(l=1-ot((n-2*r-a)/a)),t?1-l:l}const je=e=>({contrast:e.gradeContrast,exposure:e.gradeExposure,grain:e.gradeGrain,high:e.gradeHigh,highAmt:e.gradeHighAmt,lift:e.gradeLift,rays:e.gradeRays,sat:e.gradeSat,shadow:e.gradeShadow,shadowAmt:e.gradeShadowAmt,temp:e.gradeTemp,tint:e.gradeTint,vignette:e.gradeVignette}),st=e=>({ambientColor:new w(e.lightAmbientColor),ambientIntensity:e.lightAmbientIntensity,ground:new w(e.lightSkyGroundColor),sky:new w(e.lightSkySkyColor),skyIntensity:e.lightSkyIntensity}),V={day:{fill:st(be.Day),grade:je(be.Day)},night:{fill:st(be.Night),grade:je(be.Night)}},{lerp:Ce}=pe,Ht=["shadow","high"],Ke=e=>Object.fromEntries(Ht.map(r=>[r,new w(e[r])])),C0=Ke(V.night.grade),H0=Ke(V.day.grade),ne={...V.night.grade,...Ke(V.night.grade)},Re={high:new w("#ffc58a"),highAmt:.3,sat:1.15,shadow:new w("#4b3f86"),shadowAmt:.35,temp:.3,tint:.1};function F0(e,r=0){return Object.keys(V.night.grade).forEach(a=>{Ht.includes(a)?(ne[a].copy(C0[a]).lerp(H0[a],e),Re[a]&&ne[a].lerp(Re[a],r)):(ne[a]=Ce(V.night.grade[a],V.day.grade[a],e),a in Re&&(ne[a]=Ce(ne[a],Re[a],r)))}),ne}const nt=-8,qe=e=>Math.min(1,Math.max(0,e)),ze=(e,r,a)=>{const t=qe((a-e)/(r-e));return t*t*(3-2*t)},I0=e=>1-ze(.02,.25,e),N0=e=>ze(-.13,-.03,e)*(1-ze(.03,.17,e));function Ft(e,r){const a=Ce(nt,r.skySunEl,qe((e-.4)/.6)),t=Ce(nt,r.skyLightEl,qe((.6-e)/.6)),s=at(r.skySunAz,a),n=at(r.skyLightAz,t),l=a>=t;return{glow:N0(s.y),key:l?s:n,keyI:ze(-3,10,Math.max(a,t))*ze(0,4,Math.abs(a-t)),moon:n,sun:s,warm:l?I0(s.y):0}}const K=`
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
`,ve=`
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
`,B0=`
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
`,G=256,fe=96,O0=`
fn nsBake(id: u32, levelBase: f32, lightDir: vec3f, seed: f32, shape: vec4f, stormH: f32,
          nT: texture_3d<f32>, nS: sampler) -> vec4f {
  setField(seed, shape, stormH);
  let n = ${G}u;
  let p = vec3f(
    (f32(id % n) + 0.5) / ${G}.0 * TILE,
    Y_MIN + (levelBase + f32(id / (n * n)) + 0.5) / ${fe}.0 * (Y_MAX - Y_MIN),
    (f32((id / n) % n) + 0.5) / ${G}.0 * TILE
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
${K}
${ve}
`,P0=`
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
${K}
${ve}
${B0}
`,It=(e,r,a,t)=>Array.from({length:Math.ceil(e.length/r)},(s,n)=>e.slice(n*r,n*r+r)).reduce((s,n)=>s.then(()=>(n.forEach(t),a())),Promise.resolve()),A=1024,He=`
const TER_LO: f32 = -100.0;
const TER_RANGE: f32 = 52.0;
const TER_TEXEL: f32 = ${320/A};
const WATER_Y: f32 = -85.0;
`,W0=`
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
`,G0=`
fn nsTerH(fragCoord: vec2f, seed: f32) -> vec4f {
  nsSeed = seed;
  let p = fragCoord / ${A}.0;
  let e = 1.0 / ${A}.0;
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
${K}
${ve}
${He}
${W0}
`,U0=`
fn nsTerL(fragCoord: vec2f, mode: f32, lightDir: vec3f, hT: texture_2d<f32>, hS: sampler) -> vec4f {
  let xz = fragCoord / ${A}.0 * TILE;
  let H = textureSampleLevel(hT, hS, fragCoord / ${A}.0, 0.0);
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
${K}
${ve}
${He}
`,j0=`
fn nsTerT(fragCoord: vec2f, seed: f32, hT: texture_2d<f32>, hS: sampler) -> vec4f {
  nsSeed = seed;
  let xz = fragCoord / ${A}.0 * TILE;
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
${K}
${ve}
${He}
`,q0=`
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
${K}
${ve}
${He}
`,$0=j(G0),Y0=j(U0),V0=j(j0),lt=-100,it=52,K0=-85,le=320;function ye(e){const r=new Lt(A,A,{depthBuffer:!1,generateMipmaps:!0,magFilter:ce,minFilter:Kt,type:e});return r.texture.wrapS=Te,r.texture.wrapT=Te,r}function Pe(e){const r=new At;return r.colorNode=e,r.blending=Mt,r.depthTest=!1,r.depthWrite=!1,r.transparent=!0,r.toneMapped=!1,r}const We=e=>e-Math.floor(e),ie=Math.fround;function X0(e,r){const a=We(ie(e*ie(.1031))),t=We(ie(r*ie(.1031))),s=ie(a*(t+33.33)+t*(a+33.33)+a*(a+33.33));return We(ie((a+s+t+s)*(a+s)))}function Z0(e){const a=A/16,t=new Float32Array(a*a).fill(-1e9),s=new Int32Array(a*a);for(let o=0;o<A;o+=1)for(let p=0;p<A;p+=1){const u=Math.floor(o/16)*a+Math.floor(p/16),y=e[o*A+p];y>t[u]&&(t[u]=y,s[u]=o*A+p)}const n=[];for(let o=0;o<a;o+=1)for(let p=0;p<a;p+=1){const u=t[o*a+p];let y=u>=K0+14;for(let v=-2;v<=2&&y;v+=1)for(let R=-2;R<=2&&y;R+=1)(R||v)&&(y=t[(o+v+a)%a*a+(p+R+a)%a]<=u);y&&n.push({i:s[o*a+p],y:u})}n.sort((o,p)=>p.y-o.y);const l=le/A,m=o=>((o+le/2)%le+le)%le-le/2,d=[];return n.forEach(o=>{if(d.length>=2)return;const p=(o.i%A+.5)*l,u=(Math.floor(o.i/A)+.5)*l;d.some(y=>Math.hypot(m(p-y.x),m(u-y.z))<45)||d.push({x:p,y:o.y,z:u})}),d.map((o,p)=>new re(o.x,o.z,o.y-.1,X0(p*7.3+1.1,3.7)))}const Q0=e=>{const r=e>>10&31,a=e&1023,t=r===0?a*5960464477539063e-23:(1+a/1024)*2**(r-15);return e&32768?-t:t};function J0({seed:e}){const r=ye(me),a=[0,1].map(()=>ye(Be)),t=ye(Be),s=ye(Be),n=ye(me),l={lightDirs:[0,1].map(()=>c(new b(0,1,0))),mast0:c(new re),mast1:c(new re),mastN:c(0),mix:c(0),top:c(lt+it)},m=Pe($0({fragCoord:Z,seed:e})),d=(S,z)=>Pe(Y0({fragCoord:Z,mode:c(S),lightDir:z,hT:L(r.texture),hS:L(r.texture)})),o=l.lightDirs.map(S=>d(0,S)),p=d(1,l.lightDirs[0]),u=d(2,l.lightDirs[0]),y=Pe(V0({fragCoord:Z,seed:e,hT:L(r.texture),hS:L(r.texture)})),v=(S,z,C)=>Array.from({length:C},(D,P)=>({material:z,n:C,rt:S,s:P})),R=[...v(r,m,4),...v(t,p,2),...v(s,u,4),...v(n,y,8)],N=new zt(m);let E=[],_=0;const T={dirty:!0,fade:1,shown:0,slot:-1},q=.4;async function ae(S,z){const C=await S.readRenderTargetPixelsAsync(r,0,0,A,A);if(z!==_)return;const D=new Float32Array(A*A);let P=-1e9;for(let x=0;x<D.length;x+=1){const oe=lt+Q0(C[x*4])*it;D[x]=oe,oe>P&&(P=oe)}l.top.value=P+.3;const B=Z0(D);B[0]&&l.mast0.value.copy(B[0]),B[1]&&l.mast1.value.copy(B[1]),l.mastN.value=B.length}return{textures:{terA:a.map(S=>S.texture),terB:t.texture,terC:s.texture,terH:r.texture,terL:n.texture},uniforms:l,rebuild(){_+=1,E=[...R],T.dirty=!0},follow(S,z){if(T.slot<0&&T.fade>=1&&!E.length){const C=S.angleTo(l.lightDirs[T.shown].value)>.01;if(T.dirty||C){const D=1-T.shown;T.slot=D,T.dirty=!1,l.lightDirs[D].value.copy(S),E=v(a[D],o[D],8),E[E.length-1].done=()=>{T.shown=D,T.slot=-1,T.fade=0}}}T.fade=Math.min(1,T.fade+z/q),l.mix.value=T.shown===1?T.fade:1-T.fade},async prebake(S,z,C){this.rebuild();const D=()=>It([...E],6,C,()=>this.step(S));await D(),this.follow(z,0),await D(),T.fade=1,l.mix.value=T.shown===1?1:0},step(S){const z=E.shift();if(!z)return;const C=A/z.n;z.rt.scissor.set(0,z.s*C,A,C),z.rt.scissorTest=!0,N.material=z.material,S.setRenderTarget(z.rt),N.render(S),z.rt===r&&z.s===z.n-1&&ae(S,_),z.done?.()},dispose(){[r,...a,t,s,n].forEach(S=>S.dispose()),[m,y,p,u,...o].forEach(S=>S.dispose())}}}const er=`
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
`,tr=`
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
${K}
`,rr=[[1,2.5,6,[1,.56,.36],.3],[16,5.5,7,[.82,.89,1],1],[27,9,5.5,[1,.93,.8],1],[-28,6,5,[.94,.96,1],1]],ar=rr.map(([e,r,a,t,s])=>{const n=e*Math.PI/180,l=r*Math.PI/180,m=[Math.sin(n)*Math.cos(l),Math.sin(l),-Math.cos(n)*Math.cos(l)],d=.35+.65*Math.min(Math.max(r/14,0),1),o=1-Math.min(Math.max(r/12,0),1),p=[t[0],t[1]*(1-.15*o),t[2]*(1-.35*o)].map(y=>(y*a*d).toFixed(3)),u=y=>y.toFixed(5);return`  col += heroStar(rd, vec3f(${u(m[0])}, ${u(m[1])}, ${u(m[2])}), vec3f(${p.join(", ")}), ${((.18+.25*o)*s).toFixed(3)}, ${(e*.37).toFixed(2)}, pixAng, time, twk);`}).join(`
`),or=`
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
${ar}
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
${K}
`,sr=`
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
${K}
`,nr=j(O0),lr=j(P0),ir=j(er),cr=j(tr),fr=j(or),mr=j(q0),ge=2,ct=.26,ft=.8,mt=.044,dr=e=>4.5*Math.sin(e*.019634954)+1.6*Math.sin(e*.039269908+1.3);function _e(e){const r=new At;return r.colorNode=e,r.blending=Mt,r.depthTest=!1,r.depthWrite=!1,r.transparent=!0,r.toneMapped=!1,r}function xe(e,r){return new Lt(1,1,{depthBuffer:!1,magFilter:r,minFilter:r,type:e})}function pr({moonMap:e}){const r=Dt(),a=[0,1].map(()=>{const f=new Xt(G,G,fe);return f.format=Zt,f.type=me,f.minFilter=ce,f.magFilter=ce,f.wrapS=Te,f.wrapT=Te,f.wrapR=Qt,f}),t={aspect:c(1),camF:c(new b(0,0,-1)),camPos:c(new b),camR:c(new b(1,0,0)),camU:c(new b(0,1,0)),day:c(0),fade:c(0),frame:c(0),levelBase:c(0),lumW:c(.5),bakeDirs:[0,1].map(()=>c(new b(0,1,0))),bakeMix:c(0),keyDir:c(new b(0,.2,-1).normalize()),keyI:c(1),moonDir:c(new b(0,.2,-1).normalize()),sunDir:c(new b(0,.6,-1).normalize()),moonR:c(mt),moonRuv:c(.05),moonUV:c(new Se),pixAng:c(.001),prevAspect:c(1),prevF:c(new b(0,0,-1)),prevPos:c(new b),prevR:c(new b(1,0,0)),prevTanHalf:c(.5),prevU:c(new b(0,1,0)),rays:c(1),reset:c(1),seed:c(0),shape:c(new re(0,0,.38,.55)),size:c(new Se(1,1)),starLow:c(.035),stormH:c(30),tanHalf:c(.5),time:c(0),twinkle:c(1.4),lamps:c(1.95),pixAngC:c(.001)},s=a.map((f,g)=>m0(()=>{d0(f,p0(Me.mod(G),Me.div(G).mod(G),Me.div(G*G).add(t.levelBase.toUint())),nr({id:Me,levelBase:t.levelBase,lightDir:t.bakeDirs[g],seed:t.seed,shape:t.shape,stormH:t.stormH,nT:Y(r),nS:Y(r)})).toWriteOnly()})().compute(G*G*ge).setName(`nightscapeBake${g}`)),n=Et(te.x,te.y.oneMinus()),l=xe(rt,tt),m=xe(rt,tt),d=J0({seed:t.seed}),o=d.textures,p=_e(mr({fragUv:n,fragCoord:Z,camPos:t.camPos,camR:t.camR,camU:t.camU,camF:t.camF,keyDir:t.keyDir,moonDir:t.moonDir,sunDir:t.sunDir,keyI:t.keyI,terMix:d.uniforms.mix,tanHalf:t.tanHalf,aspect:t.aspect,time:t.time,day:t.day,seed:t.seed,shape:t.shape,lamps:t.lamps,terTop:d.uniforms.top,pixAngC:t.pixAngC,mast0:d.uniforms.mast0,mast1:d.uniforms.mast1,mastN:d.uniforms.mastN,tCloud:L(l.texture),nT:Y(r),nS:Y(r),terH:L(o.terH),terA0:L(o.terA[0]),terA1:L(o.terA[1]),terB:L(o.terB),terC:L(o.terC),terL:L(o.terL),terS:L(o.terH)})),u=[xe(me,ce),xe(me,ce)],y=xe(me,ce),v=_e(lr({fragUv:n,fragCoord:Z,camPos:t.camPos,camR:t.camR,camU:t.camU,camF:t.camF,keyDir:t.keyDir,moonDir:t.moonDir,sunDir:t.sunDir,keyI:t.keyI,bakeMix:t.bakeMix,tanHalf:t.tanHalf,aspect:t.aspect,frame:t.frame,day:t.day,seed:t.seed,nT:Y(r),nS:Y(r),bA:Y(a[0]),bB:Y(a[1]),bS:Y(a[0])})),R=L(u[0].texture),N=L(u[0].texture),E=_e(ir({fragCoord:Z,size:t.size,camPos:t.camPos,camR:t.camR,camU:t.camU,camF:t.camF,prevPos:t.prevPos,prevR:t.prevR,prevU:t.prevU,prevF:t.prevF,tanHalf:t.tanHalf,aspect:t.aspect,prevTanHalf:t.prevTanHalf,prevAspect:t.prevAspect,reset:t.reset,tCur:L(m.texture),tHist:R,sHist:N})),_=L(u[1].texture),T=L(u[1].texture),q=_e(cr({fragUv:n,fragCoord:Z,moonUV:t.moonUV,aspect:t.aspect,moonRuv:t.moonRuv,fade:t.fade,lumW:t.lumW,tCloud:_,sCloud:T})),ae=L(u[1].texture,te),S=fr({fragUv:n,cloud:ae,rays:L(y.texture,te).r,camR:t.camR,camU:t.camU,camF:t.camF,moonDir:t.moonDir,sunDir:t.sunDir,tanHalf:t.tanHalf,aspect:t.aspect,time:t.time,pixAng:t.pixAng,moonR:t.moonR,twk:t.twinkle,starLow:t.starLow,raysAmt:t.rays,day:t.day,moonT:L(e),moonS:L(e)}),z=new zt(v),C=new Se,D=new Se,P=[new b,new b,new b];let B=0;const x={dirty:!0,fade:1,level:fe,shown:0,slot:-1},oe=.5,F={dt:1/60,last:new b,step:new b,target:new b,vel:new b};function Bt(f){const g=t.keyDir.value,k=Math.min(f,.1);k>0&&(F.dt+=(k-F.dt)*.1,F.step.subVectors(g,F.last),F.step.length()<.05?F.vel.lerp(F.step.divideScalar(k),.1):F.vel.set(0,0,0),F.last.copy(g));const M=fe/ge*F.dt+oe;F.target.copy(F.vel).multiplyScalar(M).add(g).normalize()}let $=.5;const W={acc:0,n:0,lastDrop:-1/0,lastChange:-1/0};let Le=0,Q=0;function Ot(f,g){const k=Math.max(64,Math.round(f*$)),M=Math.max(64,Math.round(g*$));l.width===k&&l.height===M||(l.setSize(k,M),m.setSize(k,M),u.forEach(J=>J.setSize(k,M)),y.setSize(Math.max(32,Math.round(k*.5)),Math.max(32,Math.round(M*.5))),t.size.value.set(k,M),t.reset.value=1)}function Pt(f,g){if(Bt(g),x.slot>=0)t.levelBase.value=x.level,f.compute(s[x.slot]),x.level+=ge,x.level>=fe&&(x.shown=x.slot,x.slot=-1,x.fade=0);else if(x.fade>=1){const M=F.target.angleTo(t.bakeDirs[x.shown].value)>.008;(x.dirty||M)&&(x.slot=1-x.shown,x.level=0,x.dirty=!1,t.bakeDirs[x.slot].value.copy(F.target))}x.fade=Math.min(1,x.fade+g/oe);const k=x.shown;t.bakeMix.value=k===1?x.fade:1-x.fade,d.follow(t.keyDir.value,g)}function Ae(f,g,k){z.material=g,f.setRenderTarget(k),z.render(f)}function Wt(f){if(f>.25||(W.acc+=f,W.n+=1,W.n<90))return;const g=W.acc/W.n*1e3;W.acc=0,W.n=0,g>24&&$>ct?($=Math.max(ct,$-(g>40?.12:.06)),W.lastDrop=Q,W.lastChange=Q):g<17.2&&$<ft&&Q-W.lastDrop>30&&Q-W.lastChange>8&&($=Math.min(ft,$+.05),W.lastChange=Q)}return{skyNode:S,uniforms:t,rebake({ground:f=!0}={}){x.dirty=!0,f&&d.rebuild()},async prebake(f,g){const k=async()=>{await f.backend.device?.queue.onSubmittedWorkDone(),await new Promise(U=>{setTimeout(U,0)})};this.setLights(g);const M=1-x.shown;t.bakeDirs[M].value.copy(g.key);const J=Array.from({length:fe/ge},(U,Fe)=>Fe*ge);await It(J,6,k,U=>{t.levelBase.value=U,f.compute(s[M])}),Object.assign(x,{dirty:!1,fade:1,shown:M,slot:-1}),t.bakeMix.value=M===1?1:0,await d.prebake(f,g.key,k),f.setRenderTarget(null),await k()},setField({coverage:f,deckLift:g,heaps:k,seed:M,stormHeight:J,storms:U}){t.seed.value=M,t.shape.value.set(f,g,1-k,1-U),t.stormH.value=J},setLights({key:f,keyI:g,moon:k,sun:M}){t.keyDir.value.copy(f),t.keyI.value=g,t.moonDir.value.copy(k),t.sunDir.value.copy(M)},render(f,g,k,{altitude:M,autoScale:J,delta:U,resolution:Fe,speed:Gt}){Pt(f,U),Q+=U,Le+=Math.min(U,.1)*Gt,J?Wt(U):$=Fe,f.getSize(C),f.getDrawingBufferSize(D),Ot(C.x,C.y),g.matrixWorld.extractBasis(P[0],P[1],P[2]),t.camR.value.copy(P[0]).applyQuaternion(k).normalize(),t.camU.value.copy(P[1]).applyQuaternion(k).normalize(),t.camF.value.copy(P[2]).negate().applyQuaternion(k).normalize();const Xe=-Le;t.camPos.value.set(dr(Xe),3.6+M+.3*Math.sin(Le*.057)+.09*Math.sin(Le*.152+1),Xe);const se=Math.tan(pe.degToRad(g.fov/2));t.tanHalf.value=se,t.aspect.value=g.aspect,t.time.value=Q,t.frame.value+=1,t.pixAng.value=2*se/D.y,t.pixAngC.value=2*se/l.height;const Ut=t.camF.value,jt=t.camR.value,qt=t.camU.value,Ie=t.keyDir.value,Ne=Ie.dot(Ut);let Ze=0;if(Ne>.05){const Je=Ie.dot(jt)/Ne/(se*g.aspect),et=Ie.dot(qt)/Ne/se;t.moonUV.value.set(.5+.5*Je,.5+.5*et),Ze=pe.clamp((1.6-Math.max(Math.abs(Je),Math.abs(et)))/.6,0,1)}t.fade.value=Ze*t.keyI.value,t.moonRuv.value=mt/(2*se);const $t=f.getRenderTarget();d.step(f),Ae(f,v,l),Ae(f,p,m);const Qe=1-B;R.value=u[B].texture,N.value=u[B].texture,Ae(f,E,u[Qe]),B=Qe,_.value=u[B].texture,T.value=u[B].texture,ae.value=u[B].texture,Ae(f,q,y),f.setRenderTarget($t),t.prevPos.value.copy(t.camPos.value),t.prevR.value.copy(t.camR.value),t.prevU.value.copy(t.camU.value),t.prevF.value.copy(t.camF.value),t.prevTanHalf.value=t.tanHalf.value,t.prevAspect.value=t.aspect.value,t.reset.value=0},dispose(){[v,p,E,q].forEach(f=>f.dispose()),[l,m,y,...u].forEach(f=>f.dispose()),d.dispose(),a.forEach(f=>f.dispose())}}}const ur=Jt("nightscape/moon-lroc-512.jpg"),vr=new w("#9fb6dc"),hr=new w("#fff1dc"),yr=new w("#ffa868"),Nt=e=>({coverage:e.skyCoverage,deckLift:e.skyDeckLift,heaps:e.skyHeaps,seed:e.skySeed,stormHeight:e.skyStormHeight,storms:e.skyStorms}),$e=new WeakMap;function gr(e,r,a){let t=$e.get(e);if(!t||t.moonMap!==r){r.wrapS=Te;const s=pr({moonMap:r});s.setField(Nt(a));const n=a.cycleEnabled?+(a.skyDay>=.5):a.skyDay;t={moonMap:r,ready:!1,sky:s},t.promise=s.prebake(e,Ft(n,a)).then(()=>{t.ready=!0},l=>{t.error=l}),$e.set(e,t)}if(t.error)throw t.error;if(!t.ready)throw t.promise;return t.sky}function xr({config:e,cycle:r}){const a=we(v=>v.gl),t=we(v=>v.scene),s=Rt(_t,ur),n=gr(a,s,e);h.useEffect(()=>()=>{n.dispose(),$e.delete(a)},[a,n]),h.useLayoutEffect(()=>(t.backgroundNode=n.skyNode,()=>{t.backgroundNode=null}),[t,n]);const l=h.useMemo(()=>Ct(e.planeRotXDeg,e.planeRotYDeg,e.planeRotZDeg),[e.planeRotXDeg,e.planeRotYDeg,e.planeRotZDeg]),m=n.uniforms;m.twinkle.value=e.skyTwinkle,m.starLow.value=e.skyStarLow,m.lamps.value=e.skyTownLights;const d=h.useRef(e.skySeed),o=[e.skySeed,e.skyCoverage,e.skyDeckLift,e.skyHeaps,e.skyStorms,e.skyStormHeight].join(),p=h.useRef(o);h.useEffect(()=>{p.current!==o&&(p.current=o,n.setField(Nt(e)),n.rebake({ground:d.current!==e.skySeed}),d.current=e.skySeed)},[o,n]);const u=h.useRef({});Object.assign(u.current,{altitude:e.skyAltitude,autoScale:e.skyAutoResolution,resolution:e.skyResolution,speed:e.skySpeed});const y=h.useRef(null);return ue((v,R)=>{const N=r.current,{active:E,day:_,grade:T,keyI:q,warm:ae}=N;m.day.value=_,n.setLights(N),m.rays.value=E?T.rays:e.gradeRays;const S=y.current;S&&(S.color.copy(vr).lerp(hr,_).lerp(yr,.8*ae),S.intensity=pe.lerp(e.skyMoonLight,e.skySunLight,_)*q,S.position.copy(N.keyWorld).multiplyScalar(60)),v.camera.updateMatrixWorld(),n.render(a,v.camera,l,{...u.current,delta:R})},0),O.jsx("directionalLight",{ref:y})}const Sr=h.memo(xr),Ye=24,Ve=[[4.93,-.95,3.25],[4.95,-.1,3],[4.92,.75,1.9],[4.85,1.35,-.6],[4.75,2,-3.8],[4.6,3,-7.4],[4.3,4.8,-11],[3.9,7.4,-14.8],[3.5,10.6,-18.5],[3.1,14,-22]],[,dt,pt]=Ve[4],ut=(e,{drift:r=0,rise:a=1,stretch:t=1}={})=>Ve.map(([s,n,l],m)=>{if(m<4)return[e*s,n,l];const d=(m-4)/(Ve.length-5);return[e*(s+r*d*d),dt+(n-dt)*a,pt+(l-pt)*t]}),vt=e=>[[e*2.3,.8,-1.5],[e*2.45,1.5,-3.5],[e*2.7,2.6,-6.5],[e*3,4.4,-10],[e*3.2,7,-14]],de=[{key:"plumeLeftEngine",label:"Left Engine",points:ut(-1),salt:[0,0,0]},{key:"plumeRightEngine",label:"Right Engine",points:ut(1,{drift:1.2,rise:.82,stretch:1.12}),salt:[.37,.71,.19]},{key:"plumeLeftWing",label:"Left Wing Root",points:vt(-1),salt:[.53,.29,.83],scale:.6},{key:"plumeRightWing",label:"Right Wing Root",points:vt(1),salt:[.11,.91,.47],scale:.6}].map(e=>({scale:1,...e,path:w0(e.points.map(([r,a,t])=>({x:r,y:a,z:t})),{samples:Ye})})),ht=[[-4.9,.4,2.2],[4.9,.4,2.2]],yt=6,gt=(e,r)=>Array.from({length:yt},(a,t)=>{const s=t/yt*Math.PI*2,n=Math.cos(s),l=Math.sin(s);return{at:[e*4.95+n*.55,-1+l*.55,-.7],key:r,out:[n*.3,l*.3,-1]}}),xt=[...gt(-1,"plumeLeftEngine"),...gt(1,"plumeRightEngine")],br=(e,r)=>1+.35*(Math.sin(e*9.1+r*1.7)*.5+Math.sin(e*15.7+r*2.9)*.3+Math.sin(e*23.3+r*.6)*.2);function kr({config:e}){const r=h.useRef([]);return ue(a=>{const t=a.clock.elapsedTime;ht.forEach((s,n)=>{const l=r.current[n];l&&(l.intensity=e.plumeLightIntensity*br(t,n))})}),e.plumeLightIntensity<=0?null:ht.map((a,t)=>e[de[t].key]?O.jsx("pointLight",{ref:s=>{r.current[t]=s},color:e.plumeGlowColor,decay:2,distance:e.plumeLightDistance,intensity:e.plumeLightIntensity,position:a},t):null)}const Tr=h.memo(kr),wr=(294/215).toFixed(4),zr=[[.45,.035,1,1,[1,.8,.5,.25]],[.8,.08,0,.5,[.4,.9,.8,.18]],[1.15,.025,1,1,[.6,1,.5,.3]],[1.45,.06,2,1,[.7,.5,1,.22]],[1.8,.13,1,3,[1,.6,.35,.08]],[2.3,.05,0,.5,[.5,.7,1,.2]]],ee=e=>Number(e).toFixed(4),Lr=zr.map(([e,r,a,t,[s,n,l,m]])=>`  col += flareGhost(uv, aspect, sunUV + axis * ${ee(e)}, ${ee(r)} * look.y, ${ee(a)}, ${ee(t)}, vec3f(${ee(s*m)}, ${ee(n*m)}, ${ee(l*m)}), look.z, maskT, maskS);`).join(`
`),Ar=`
fn reversalFlare(uv: vec2f, aspect: f32, sunUV: vec2f, look: vec4f, tint: vec3f, bright: f32,
                 maskT: texture_2d<f32>, maskS: sampler, sceneT: texture_2d<f32>, sceneS: sampler) -> vec3f {
  if (look.w <= 0.0 || look.x <= 0.0) { return vec3f(0.0); }
  if (any(sunUV < vec2f(-0.02)) || any(sunUV > vec2f(1.02))) { return vec3f(0.0); }
  var lum = 0.0;
  for (var k = 0; k < 5; k++) {
    var o = vec2f(0.0);
    if (k > 0) { o = vec2f(cos(f32(k) * 1.5708), sin(f32(k) * 1.5708)) * 0.006 * vec2f(1.0 / aspect, 1.0); }
    let c = textureSampleLevel(sceneT, sceneS, clamp(sunUV + o, vec2f(0.0), vec2f(1.0)), 0.0).rgb;
    lum += dot(c, vec3f(0.2126, 0.7152, 0.0722));
  }
  let vis = smoothstep(0.15, 0.6, lum / 5.0 / bright)
          * (1.0 - smoothstep(0.42, 0.62, max(abs(sunUV.x - 0.5), abs(sunUV.y - 0.5))));
  if (vis <= 0.0) { return vec3f(0.0); }
  let axis = vec2f(0.5) - sunUV;
  var col = vec3f(0.0);
${Lr}
  return col * tint * look.x * look.w * vis;
}

fn flareGhost(uv: vec2f, aspect: f32, pos: vec2f, size: f32, kind: f32, blur: f32, tint: vec3f,
              chroma: f32, maskT: texture_2d<f32>, maskS: sampler) -> vec3f {
  let d = (uv - pos) * vec2f(aspect, 1.0) / size;
  if (dot(d, d) > 6.0) { return vec3f(0.0); }
  return tint * vec3f(
    flareMask(d * (1.0 + chroma), kind, blur, maskT, maskS),
    flareMask(d, kind, blur, maskT, maskS),
    flareMask(d * (1.0 - chroma), kind, blur, maskT, maskS)
  );
}

// Alpha is the Reversal's inner knot, the flare's only cookie: as is, as a
// glow (blurred a few mips), or as just its edges.
fn flareMask(d: vec2f, kind: f32, blur: f32, maskT: texture_2d<f32>, maskS: sampler) -> f32 {
  let st = vec2f(d.x / ${wr}, -d.y) * 0.5 + 0.5;
  if (any(st < vec2f(0.0)) || any(st > vec2f(1.0))) { return 0.0; }
  let knot = textureSampleLevel(maskT, maskS, st, blur).a;
  if (kind < 0.5) { return knot; }
  if (kind < 1.5) { return textureSampleLevel(maskT, maskS, st, blur + 1.5).a; }
  let soft = textureSampleLevel(maskT, maskS, st, blur + 1.5).a;
  return clamp(abs(knot - soft) * 3.0, 0.0, 1.0);
}
`,Mr=j(sr),Rr=j(Ar),_r=t0("reversal-inner.png"),Er=new w(1,.92,.8),Dr=new w(.7,.82,1),Cr=new w(1,.68,.42),Ee=new b,St=new b,bt=(e,r)=>(r.set(e),r.set(Math.max(r.r,.002),Math.max(r.g,.002),Math.max(r.b,.002)));function Hr(e,r){const a=r.temp,t=r.tint,s=[(1+.28*a)*(1-.08*t),1+.16*t,(1-.28*a)*(1-.08*t)],n=.2126*s[0]+.7152*s[1]+.0722*s[2];e.balance.value.set(s[0]/n,s[1]/n,s[2]/n),bt(r.shadow,e.shadowTint.value),bt(r.high,e.highTint.value),e.a.value.set(r.exposure,r.shadowAmt,r.highAmt,r.lift),e.b.value.set(r.sat,r.contrast,r.vignette,r.grain)}function Fr({bloom:e,cycle:r,flare:a,grade:t,volume:s}){const{camera:n,gl:l,scene:m}=we(),d=Rt(_t,_r),o=h.useMemo(()=>({a:c(new re),b:c(new re),balance:c(new b(1,1,1)),bloomOn:c(0),bloomStrength:c(0),bloomThreshold:c(1),flare:c(new re),flareBright:c(1),flareTint:c(new w),flareUV:c(new Se(-1,-1)),highTint:c(new w),shadowTint:c(new w),time:c(0)}),[]),p=h.useRef(null),u=h.useRef(null);return h.useEffect(()=>{const y=u0(m,n);let v=y;if(s){const{frame:T,smoke:q}=s.node(y);q.setResolutionScale(s.resolution),u.current=q,v=T}const R=z0(v0(v.sub(o.bloomThreshold),0),e.radius,6,{resolutionScale:.5}),N=Rr({uv:te,aspect:he.x.div(he.y),sunUV:o.flareUV,look:o.flare,tint:o.flareTint,bright:o.flareBright,maskT:L(d),maskS:L(d),sceneT:y.getTextureNode(),sceneS:y.getTextureNode()}),E=v.add(R.mul(o.bloomStrength).mul(o.bloomOn).clamp(0,1.5)).add(h0(N,0)),_=new e0(l);return _.outputColorTransform=!1,_.outputNode=Mr({colIn:E.rgb,fragUv:Et(te.x,te.y.oneMinus()),fragCoord:Z,res:he,aspect:he.x.div(he.y),time:o.time,balance:o.balance,shadowTint:o.shadowTint,highTint:o.highTint,a:o.a,b:o.b}),p.current=_,()=>{p.current=null,u.current=null,_.dispose()}},[e.radius,n,l,d,m,o,s]),o.bloomOn.value=e.enabled?1:0,o.bloomStrength.value=e.strength,o.bloomThreshold.value=e.threshold,ue(y=>{o.time.value=y.clock.elapsedTime;const v=r.current;Hr(o,v.active?v.grade:t),n.getWorldDirection(St),Ee.copy(v.keyWorld).multiplyScalar(1e3).add(n.position),Ee.project(n),o.flareUV.value.set((Ee.x+1)/2,(1-Ee.y)/2);const R=St.dot(v.keyWorld)>0?1:0;o.flare.value.set(a.enabled?a.intensity:0,a.size,a.chroma,pe.lerp(a.moon,1,v.day)*v.keyI*R),o.flareTint.value.copy(Dr).lerp(Er,v.day).lerp(Cr,v.warm),o.flareBright.value=pe.lerp(1.5,30,v.day),s&&u.current&&u.current.setResolutionScale(s.resolution),p.current?.render()},1),null}const Ir=h.memo(Fr),Nr=e=>[e.x,e.y,e.z];function Br({config:e}){const r=we(s=>s.gl),a=xt.map(({key:s})=>!!e[s]).join(),t=h.useMemo(()=>{const s=xt.filter((n,l)=>a.split(",")[l]==="true").map(({at:n,out:l})=>({at:n,out:l}));return s.length?y0({count:e.emberCount,vents:s}):null},[e.emberCount,a]);if(h.useEffect(()=>()=>t?.dispose(),[t]),t){const s=t.uniforms;s.buoyancy.value=e.emberBuoyancy,s.glow.value=e.emberGlow,s.life.value=e.emberLife,s.size.value=e.emberSize,s.speed.value=e.emberSpeed,s.streak.value=e.emberStreak,s.turbulence.value=e.emberTurbulence,s.wind.value.set(...Nr(e.emberWind))}return ue((s,n)=>{t?.advance(r,n)},-1),t?O.jsx("primitive",{object:t.mesh}):null}const Or=h.memo(Br);function kt(e,r){Object.assign(e,Ft(e.day,r)),e.keyWorld.copy(e.key).applyQuaternion(Ct(r.planeRotXDeg,r.planeRotYDeg,r.planeRotZDeg).invert())}function Pr(e){const r=h.useRef({active:!1,clock:0,day:0,glow:0,grade:{},keyWorld:new b(0,1,0),warm:0}),a=h.useRef({}),t=h.useCallback((s,n)=>{a.current[s]=n},[]);return ue((s,n)=>{const l=r.current,{ambient:m,sky:d}=a.current;if(!e.cycleEnabled){l.active&&(m?.color.set(e.lightAmbientColor),m&&(m.intensity=e.lightAmbientIntensity),d?.color.set(e.lightSkySkyColor),d?.groundColor.set(e.lightSkyGroundColor),d&&(d.intensity=e.lightSkyIntensity)),l.active=!1,l.clock=0,l.day=e.skyDay,kt(l,e);return}l.active=!0,l.clock+=Math.min(n,.1),l.day=D0(l.clock,e.cycleHold,e.cycleTransition,e.skyDay>=.5),kt(l,e),l.grade=F0(l.day,l.glow);const o=V.night.fill,p=V.day.fill;m&&(m.color.copy(o.ambientColor).lerp(p.ambientColor,l.day),m.intensity=o.ambientIntensity+(p.ambientIntensity-o.ambientIntensity)*l.day),d&&(d.color.copy(o.sky).lerp(p.sky,l.day),d.groundColor.copy(o.ground).lerp(p.ground,l.day),d.intensity=o.skyIntensity+(p.skyIntensity-o.skyIntensity)*l.day)},-3),{cycle:r,onLightChange:t}}function Wr(){const e=we(r=>r.gl);h.useEffect(()=>{const r=e.toneMapping;return e.toneMapping=r0,()=>{e.toneMapping=r}},[e])}const Gr=new w(.74,.84,1).multiplyScalar(3.1),Ur=new w(1,.97,.92).multiplyScalar(26),Tt=[new w(.006,.0085,.017),new w(.1,.14,.22)],jr=new w(1,.62,.36).multiplyScalar(14),qr=new w(1,1,1),$r=new w(1.2,.82,.68),Yr=new w,wt=[new w(.04,.06,.118),new w(.38,.5,.72)];function Vr(e,r,a){const t=h.useMemo(g0,[]),s=h.useMemo(()=>x0(de),[]),n=h.useMemo(()=>S0(de,Ye),[]),l=de.map(({key:o})=>!!e[o]).join(),m=h.useMemo(()=>b0(de,l.split(",").map(o=>o==="true"),s),[s,l]);h.useEffect(()=>()=>m.dispose(),[m]),h.useEffect(()=>()=>n.dispose(),[n]);const d=h.useMemo(()=>({node:k0({bounds:s,guide:m,noise:Dt(),pathSamples:Ye,points:n,u:t})}),[s,m,n,t]);return d.resolution=e.plumeResolution,t.albedo.value.set(e.plumeSmokeColor),t.glowCol.value.set(e.plumeGlowColor),t.hot.value.set(e.plumeFireHot),t.mid.value.set(e.plumeFireMid),t.cool.value.set(e.plumeFireCool),t.flow.value.set(e.plumeSpeed,e.plumeBillow,e.plumeBillowScale,e.plumeDensity),t.shape.value.set(e.plumeRadiusStart,e.plumeRadiusEnd,e.plumeTopFade,e.plumeSoot),t.fire.value.set(e.plumeFireShare,e.plumeFireIntensity,e.plumeGlow,e.plumeShadow),t.detail.value.set(e.plumeErosion,e.plumeDetailScale,e.plumeStepSize,e.plumeSteps),ue((o,p)=>{const{camera:u,gl:y}=o;T0(t,u,y),t.time.value+=Math.min(p,1/15);const{day:v,glow:R,keyI:N,keyWorld:E,warm:_}=a.current;t.lightDir.value.copy(E),t.lightCol.value.copy(Gr).lerp(Ur,v).lerp(jr,.8*_),t.lightCol.value.multiplyScalar(N),t.ambLo.value.copy(Tt[0]).lerp(Tt[1],v),t.ambHi.value.copy(wt[0]).lerp(wt[1],v).multiply(Yr.copy(qr).lerp($r,.7*R)),r.current&&(r.current.updateMatrixWorld(),t.toLocal.value.copy(r.current.matrixWorld).invert())},0),d}const De=[0,3.2,-1.5],Kr={defaultMode:"orbit",far:300,fov:42,near:.1,orbit:{desktop:{pivot:De,position:[13,4.5,19],target:De},mobile:{pivot:De,position:[19,6.5,28],target:De}}},ke="Flying High",i=(e,r,a,t,s,n)=>({[r]:{label:a,max:s,min:t,step:n,value:e[r]}}),H=(e,r,a)=>({[r]:{label:a,value:e[r]}}),I=e=>Ue(e,{collapsed:!0});function Xr(e){return I({...H(e,"plumeVisible","Visible"),...Object.fromEntries(de.flatMap(({key:r,label:a})=>Object.entries(H(e,r,a)))),Flow:I({...i(e,"plumeSpeed","Speed",0,10,.05),...i(e,"plumeRadiusStart","Width at Engine",.1,2,.01),...i(e,"plumeRadiusEnd","Width at End",.3,4,.01),...i(e,"plumeBillow","Billow",0,1.5,.01),...i(e,"plumeBillowScale","Billow Scale",.02,.5,.005),...i(e,"plumeDensity","Density",0,3,.01),...i(e,"plumeTopFade","Fade From",.2,1,.01)}),Fire:I({...i(e,"plumeFireShare","Burn Share",.02,1,.01),...i(e,"plumeFireIntensity","Intensity",0,30,.1),...H(e,"plumeFireHot","Hot"),...H(e,"plumeFireMid","Mid"),...H(e,"plumeFireCool","Cool"),...H(e,"plumeGlowColor","Glow Color"),...i(e,"plumeGlow","Smoke Glow",0,2,.01),...i(e,"plumeLightIntensity","Light Intensity",0,80,.1),...i(e,"plumeLightDistance","Light Distance",1,40,.1)}),Smoke:I({...H(e,"plumeSmokeColor","Colour"),...i(e,"plumeSoot","Soot",0,12,.05),...i(e,"plumeShadow","Self Shadow",0,2,.01),...i(e,"plumeErosion","Erosion",0,1,.01),...i(e,"plumeDetailScale","Detail Scale",1,8,.05),...i(e,"plumeResolution","Resolution",.25,1,.05),...i(e,"plumeSteps","Dense Steps",24,300,1),...i(e,"plumeStepSize","Step Size",.03,.5,.005)})})}function Zr(e){return{Sky:I({...i(e,"skyDay","Daylight",0,1,.01),...i(e,"skySunAz","Sun Azimuth (°)",-180,180,.5),...i(e,"skySunEl","Sun Elevation (°)",1,80,.5),...i(e,"skyLightAz","Moon Azimuth (°)",-180,180,.5),...i(e,"skyLightEl","Moon Elevation (°)",1,80,.5),...i(e,"skyMoonLight","Moonlight on Plane",0,5,.01),...i(e,"skySunLight","Sunlight on Plane",0,10,.01),...i(e,"skyTwinkle","Twinkle",0,2,.01),...i(e,"skyStarLow","Stars Reach Down To",0,.35,.005),...i(e,"skyTownLights","Town Lights",0,3,.05),Flight:I({...i(e,"skySpeed","Speed",0,10,.01),...i(e,"skyAltitude","Altitude",-3,20,.05)}),Field:I({...i(e,"skySeed","Seed",0,999,1),...i(e,"skyCoverage","Coverage",-.3,.3,.005),...i(e,"skyDeckLift","Deck Lift",-4,4,.05),...i(e,"skyHeaps","Heaps",0,1,.01),...i(e,"skyStorms","Storm Towers",0,1,.01),...i(e,"skyStormHeight","Storm Height",0,50,.5)}),Quality:I({...H(e,"skyAutoResolution","Auto Resolution"),...i(e,"skyResolution","Cloud Resolution",.15,1,.01)})}),"Day Cycle":I({...H(e,"cycleEnabled","Animate"),...i(e,"cycleHold","Hold (s)",5,300,1),...i(e,"cycleTransition","Transition (s)",1,60,.5)}),Grade:I({...i(e,"gradeExposure","Exposure",.4,2,.01),...i(e,"gradeTemp","Temperature",-1,1,.01),...i(e,"gradeTint","Tint",-1,1,.01),...i(e,"gradeRays","Light Shafts",0,2,.01),...i(e,"gradeSat","Saturation",0,2,.01),...i(e,"gradeContrast","Contrast",.7,1.5,.01),...i(e,"gradeShadowAmt","Shadow Tint",0,1,.01),...H(e,"gradeShadow","Shadow Colour"),...i(e,"gradeHighAmt","Highlight Tint",0,1,.01),...H(e,"gradeHigh","Highlight Colour"),...i(e,"gradeLift","Night Glow",0,1.5,.01),...i(e,"gradeVignette","Vignette",0,.8,.01),...i(e,"gradeGrain","Grain",0,.03,.001)}),Plane:I({...i(e,"planeScale","Scale",.1,2,.05),...i(e,"planePosX","X",-20,20,.1),...i(e,"planePosY","Y",-20,20,.1),...i(e,"planePosZ","Z",-20,20,.1),...i(e,"planeRotXDeg","Rot X (°)",-180,180,.5),...i(e,"planeRotYDeg","Rot Y (°)",-180,180,.5),...i(e,"planeRotZDeg","Rot Z (°)",-180,180,.5)}),Plumes:Xr(e),Sparks:I({...H(e,"emberVisible","Visible"),emberCount:{label:"Count",options:[256,512,1024,2048,4096],value:e.emberCount},...i(e,"emberLife","Life",.2,6,.05),...i(e,"emberSpeed","Burst Speed",0,20,.1),...i(e,"emberBuoyancy","Buoyancy",0,10,.05),...H(e,"emberWind","Airflow"),...i(e,"emberTurbulence","Turbulence",0,10,.05),...i(e,"emberSize","Size",.005,.2,.001),...i(e,"emberStreak","Streak",0,.3,.001),...i(e,"emberGlow","Glow",0,30,.1)}),"Lens Flare":I({...H(e,"flareEnabled","Enabled"),...i(e,"flareIntensity","Intensity",0,4,.01),...i(e,"flareSize","Size",.2,4,.01),...i(e,"flareChroma","Colour Fringe",0,.15,.005),...i(e,"flareMoon","Moon Flare",0,1,.01)}),Bloom:I({...H(e,"bloomEnabled","Enabled"),...i(e,"bloomThreshold","Threshold",0,3,.01),...i(e,"bloomStrength","Strength",0,3,.01),...i(e,"bloomRadius","Radius",0,1,.01)})}}const Qr={ambient:{type:"ambient",color:"#ffffff",intensity:.5},sky:{type:"hemisphere",skyColor:"#87ceeb",groundColor:"#443322",intensity:.25},key:{type:"directional",color:"#fff5e0",intensity:1,position:[5,8,10]}},Jr=`${ke}.Camera`,ea=`${ke}.Lighting`;function ta(){const{attachSetControls:e,controlsSnapshotRef:r,presetsFolder:a,selectedPreset:t}=L0({defaultPreset:M0,getPresetControls:R0,presets:be}),s=h.useRef(null),{buildCamera:n,cameraControls:l}=s0({apiRef:s,camera:Kr,cameraFolderPath:Jr,controlsSnapshotRef:r}),{buildLighting:m,lightingControls:d}=i0({controlsSnapshotRef:r,lighting:Qr,lightingFolderPath:ea}),[o,p]=a0(ke,()=>({Presets:a,Camera:Ue(l,{collapsed:!0}),Lighting:Ue(d,{collapsed:!0}),...Zr(r.current)}));e(p),r.current={...o},A0({fileName:t?`${ke} - ${t}`:ke});const u=h.useMemo(()=>n0(o),[o]),y=h.useMemo(()=>n(o),[n,u]),v=h.useMemo(()=>c0(o),[o]),R=h.useMemo(()=>m(o),[m,v]);return h.useMemo(()=>({...o,camera:y,cameraApiRef:s,lighting:R}),[y,o,R])}const Ge=Math.PI/180;function ra(){const e=ta();Wr();const r=h.useRef(null),{cycle:a,onLightChange:t}=Pr(e),s=Vr(e,r,a);return O.jsxs(O.Fragment,{children:[O.jsx(l0,{camera:e.camera}),O.jsx(f0,{lighting:e.lighting,onLightChange:t}),O.jsx(Sr,{config:e,cycle:a}),O.jsxs("group",{ref:r,position:[e.planePosX,e.planePosY,e.planePosZ],rotation:[e.planeRotXDeg*Ge,e.planeRotYDeg*Ge,e.planeRotZDeg*Ge],scale:e.planeScale,children:[O.jsx(o0,{}),e.plumeVisible?O.jsx(Tr,{config:e}):null,e.plumeVisible&&e.emberVisible?O.jsx(Or,{config:e}):null]}),O.jsx(Ir,{bloom:{enabled:e.bloomEnabled,radius:e.bloomRadius,strength:e.bloomStrength,threshold:e.bloomThreshold},volume:e.plumeVisible?s:null,cycle:a,flare:{chroma:e.flareChroma,enabled:e.flareEnabled,intensity:e.flareIntensity,moon:e.flareMoon,size:e.flareSize},grade:je(e)})]})}const Ma=h.memo(ra);export{Ma as default};
