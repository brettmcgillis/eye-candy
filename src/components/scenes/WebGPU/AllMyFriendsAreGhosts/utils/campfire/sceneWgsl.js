// Buffer A of "Campfire at night" by Maurogik (shadertoy.com/view/Wtc3W2):
// SDFs, materials, volumetric march, fire shadow and surface lighting.
const SCENE_WGSL = /* wgsl */ `
const kMatDefault: f32 = 0.0;
const kMatFire: f32 = 1.0;
const kMatWoodLog: f32 = 2.0;
const kMatRock: f32 = 3.0;
const kMatGround: f32 = 4.0;
const kMatCoals: f32 = 5.0;

struct FireLogResult { logD: f32, fireD: f32, logMaterial: vec4f, fireMaterial: vec4f, };
struct LogsResult { d: f32, material: vec4f, minFireD: f32, };
struct MatResult { d: f32, material: vec4f, };
struct MarchResult { t: f32, material: vec4f, insTrans: vec4f, hit: bool, };

fn fFireLog(centerToPosLS: vec3f, posWS: vec3f, flameCenterIn: vec3f, burnDirWS: vec3f,
            logRadius: f32, logLength: f32, logRand: f32, fireLife: f32, doVolumetric: bool) -> FireLogResult {
  var r: FireLogResult;
  r.fireMaterial = vec4f(0.0);
  let logProgress = (centerToPosLS.y / logLength) * 0.5 + 0.5;
  r.logD = fCylinder(centerToPosLS, logRadius, logLength);

  let uv = vec2f(0.5 + atan(centerToPosLS.x / centerToPosLS.z) / kPI, logLength + centerToPosLS.y);
  let yz = uv + abs(logRand) * vec2f(1.0);
  r.logMaterial = vec4f(kMatWoodLog, yz.x, yz.y, 0.0);
  if (abs(centerToPosLS.y / logLength) > 0.99) {
    r.logMaterial.y = length(centerToPosLS.xz) / logRadius;
    r.logMaterial.z = -1.0;
  }
  r.logMaterial.w = logProgress - fireLife;

  if (!doVolumetric) {
    r.fireD = kMaxDist;
    return r;
  }

  var flameCenterWS = flameCenterIn + burnDirWS * (max(0.0, fireLife) * 2.0 - 1.0) * logLength;
  flameCenterWS -= vec3f(0.0, 1.0, 0.0) * max(0.0, -fireLife);
  var flameToPosWS = posWS - flameCenterWS;

  let flameRot = logRand * kPI + flameToPosWS.y * kPI * 2.0 - (10.0 + 3.0 * hash11(logRand)) * s_time;
  let flameRotSin = sin(flameRot);
  flameToPosWS.x += flameToPosWS.y * 0.1 * flameRotSin;
  flameToPosWS.z += flameToPosWS.y * 0.1 * cos(flameRot);

  let sqrtFireLife = sqrt(max(0.0, fireLife));
  let flameHeight = max(0.001, 0.2 + fireLife * 1.2);
  let flameRadius = max(0.0001, 0.1 + sqrtFireLife) * 0.2;
  var fireD = sdEllipsoidY(flameToPosWS - vec3f(0.0, 1.0, 0.0) * flameHeight * 0.5, vec2f(flameRadius, flameHeight));
  fireD = smax(fireD, -centerToPosLS.x - logRadius, 0.2);

  let isAboveLog = (centerToPosLS.x / logRadius) * 0.5 + 0.5;
  var localFlame = (1.0 - saturate(abs(fireLife - logProgress) * 3.0)) * max(0.0, 0.3 + fireLife * 0.7);
  localFlame *= (max(0.0, isAboveLog) + 1.0);
  let localFlameD = r.logD - min(0.15, localFlame * (0.1 + flameRotSin * 0.02));
  r.fireD = smin(fireD, localFlameD, 0.15);
  r.fireMaterial.y = isAboveLog;
  return r;
}

fn displacementFire(positionWs: vec3f, minDist: f32, displacementScale: f32, amount: f32) -> f32 {
  let softenRadius = displacementScale * 0.5;
  let repSize = vec3f(2.0, 4.0, 2.0) * displacementScale;
  var dPos = positionWs;
  _ = pMod3(&dPos, repSize);
  let radius = 1.0 * displacementScale * abs(amount);
  var sphereDist = sdEllipsoidY(dPos, vec2f(radius, radius * 5.0));
  dPos = positionWs + repSize * 0.5;
  _ = pMod3(&dPos, repSize);
  sphereDist = min(sphereDist, sdEllipsoidY(dPos, vec2f(radius, radius * 4.0)));
  return smax(minDist, sign(amount) * sphereDist, softenRadius);
}

fn fCampfireLogs(posWS: vec3f, doVolumetric: bool) -> LogsResult {
  var minLogD = kMaxDist;
  var minFireD = kMaxDist;
  var minLogMaterial = vec4f(0.0);
  var minFireMaterial = vec4f(0.0);

  let campfireCenterToPosWS = posWS - kCampfireCenterWS;
  let distToCampfireXZ = length(campfireCenterToPosWS.xz) - 0.65;
  if (distToCampfireXZ > 0.25) {
    minLogD = distToCampfireXZ;
    minFireD = minLogD;
  } else {
    for (var i = s_zeroU; i < kNumLogs; i++) {
      let log = getLog(i);
      let logCenterWS = log.centerWS;
      var centerToPosLS = posWS - logCenterWS;
      let xz = pR(centerToPosLS.xz, log.rotationY);
      centerToPosLS = vec3f(xz.x, centerToPosLS.y, xz.y);
      let xy = pR(centerToPosLS.xy, log.rotationZ);
      centerToPosLS = vec3f(xy, centerToPosLS.z);
      let rand = kGoldenRatio * f32(i);
      let fireLife = s_globalFireLife - log.lifeOffset;
      let r = fFireLog(centerToPosLS, posWS, logCenterWS, log.burnDirWS,
                       log.logRadius, log.logLength, rand, fireLife, doVolumetric);
      if (r.logD < minLogD) {
        minLogD = r.logD;
        minLogMaterial = r.logMaterial;
      }
      if (r.fireD < minFireD) {
        minFireD = r.fireD;
        minFireMaterial = r.fireMaterial;
      }
    }
  }

  var logDispScale = 0.025;
  var logDispSoften = 0.15;

  let stickScale = 0.25;
  var stickPos = posWS + vec3f(1.0, 0.0, 1.0) * 1.5;
  var stickXZ = stickPos.xz;
  let stickId = pMod2(&stickXZ, vec2f(1.0) * 7.0 * stickScale);
  let stickRand = hash12(stickId * 39.6897);
  stickXZ = pR(stickXZ, stickRand * kPI);
  stickPos = vec3f(stickXZ.x, stickPos.y, stickXZ.y);
  let stickRadius = (0.04 + stickRand * 0.015) * stickScale;
  let stickLength = (0.75 + stickRand * 0.4) * stickScale;
  stickPos.y -= stickRadius + min(0.0, dot(posWS, posWS) * 0.01 - 0.02);
  stickPos.x += stickRand * 2.0 * stickScale;
  stickPos.z += stickRand * 2.0 * stickScale;

  let stickD = fCylinder(stickPos.xzy, stickRadius, stickLength);
  if (stickD < minLogD) {
    minLogD = stickD;
    let uv = vec2f(0.5 + atan(stickPos.x / stickPos.y) / kPI, stickPos.z) + stickRand * vec2f(1.0);
    minLogMaterial = vec4f(kMatWoodLog, uv.x, uv.y, -1.0);
    logDispScale = 0.015;
    logDispSoften = 0.05;
  }

  var dispPos = posWS;
  _ = pMod3(&dispPos, vec3f(1.0) * logDispScale * 11.0);
  let dispD = fSphere(dispPos, logDispScale);
  minLogD = smin(minLogD, smax(minLogD - logDispScale, dispD, logDispSoften), logDispSoften);

  if (doVolumetric) {
    minFireMaterial.x = kMatFire;

    if (minFireD < 0.25) {
      var displacedFireD = minFireD;
      let dispAmount = min(1.0, 0.2 + max(0.001, posWS.y) * 0.45);
      let windDisp = vec3f(0.03, 1.0, -0.02) * 3.0 * s_time;
      var dispPosWS = posWS - windDisp;
      let isUnderLog = minFireMaterial.y;
      displacedFireD = displacementFire(dispPosWS, displacedFireD, 0.2, -dispAmount);
      dispPosWS = posWS + vec3f(1.0) * 16.6798 - windDisp * 0.5;
      displacedFireD = displacementFire(
        dispPosWS, displacedFireD, 0.07,
        -(0.0001 + saturate(isUnderLog * 1.0)) * linearstep(-0.1, 0.0, minFireD));
      minFireMaterial.y = saturate(linearstep(0.05, 0.0, minLogD * minLogD) *
                                   linearstep(-0.00, -0.05, displacedFireD));
      minFireD = displacedFireD;
    }

    if (s_globalFireLife > 0.0) {
      var posSparks = posWS - kCampfireCenterWS - vec3f(0.0, 1.0, 0.0) * (0.3 * s_globalFireLife + 0.1);
      var sparkXZ = posSparks.xz;
      let sparkId = pModPolar(&sparkXZ, 5.0);
      posSparks = vec3f(sparkXZ.x, posSparks.y, sparkXZ.y);
      let sparkXY = pR(posSparks.xy, kPI * 0.15);
      posSparks = vec3f(sparkXY, posSparks.z);

      let sparkRand = hash11(sparkId * 937.959);
      let sparksAnimDuration = 5.0;
      var sparkAnim = fract(s_time / sparksAnimDuration + sparkRand);
      let sparksSpeed = sparksAnimDuration * 4.0 * max(0.7, 2.0 * s_globalFireLife);
      let sparkTravel = sparkAnim * sparksSpeed;

      var posSparksStart = vec3f(1.0, 0.0, 0.0) * sparkTravel;
      var posSparksEnd = vec3f(1.0, 0.0, 0.0) * sparkTravel;

      var rotationT = (sparkRand + sparkAnim) * sparksSpeed * 2.5;
      posSparksStart += vec3f(sin(rotationT), 0.0, cos(rotationT)) * (0.15 + sparkAnim * 0.5);
      posSparksStart.y += cos(rotationT * 0.5) * (sparkAnim * 0.3 + 0.2);

      let sparkAnimDelta = min(0.033, s_timeDelta * kTimeScale) / sparksAnimDuration;
      sparkAnim -= sparkAnimDelta;
      rotationT = (sparkRand + sparkAnim) * sparksSpeed * 2.5;

      posSparksEnd.x -= sparkAnimDelta * sparksSpeed;
      posSparksEnd += vec3f(sin(rotationT), 0.0, cos(rotationT)) * (0.15 + sparkAnim * 0.5);
      posSparksEnd.y += cos(rotationT * 0.5) * (sparkAnim * 0.3 + 0.2);

      let sparksD = fCapsuleAB(posSparks, posSparksStart, posSparksEnd, 0.01);
      if (sparksD < minFireD) {
        minFireD = sparksD;
        let sparkStrength = 0.5 + sparkRand * 2.0;
        minFireMaterial.y = max(0.0, sparkStrength - 15.0 * sparkAnim) * linearstep(0.0, -0.01, sparksD);
        minFireMaterial.y *= saturate(2.0 * s_globalFireLife);
      }
    }
  }

  var res: LogsResult;
  res.minFireD = minFireD;
  if (minLogD > 0.01 && minFireD < minLogD) {
    res.d = minFireD;
    res.material = minFireMaterial;
  } else {
    res.d = minLogD;
    res.material = minLogMaterial;
  }
  return res;
}

fn fCampfireRocks(posWS: vec3f) -> MatResult {
  var res: MatResult;
  res.material = vec4f(kMatRock, 0.0, 0.0, 0.0);

  let campfireCenterToPosWS = posWS - kCampfireCenterWS;
  let distToCampfireXZ = length(campfireCenterToPosWS.xz) - 1.0;
  let distToCampfire = max(distToCampfireXZ, campfireCenterToPosWS.y - 0.25);
  if (distToCampfire > 0.25) {
    res.d = distToCampfire;
    return res;
  }
  let campfireToPos = posWS - kCampfireCenterWS;

  var rockToPos = campfireToPos;
  var rockXZ = rockToPos.xz;
  var id = pModPolar(&rockXZ, 5.0);
  rockToPos = vec3f(rockXZ.x, rockToPos.y, rockXZ.y);
  var modRand = hash11(id * 97.5887);
  var modRandSNorm = modRand * 2.0 - 1.0;
  var rockDims = vec3f(0.22 + modRandSNorm * 0.05, 0.13 - modRandSNorm * 0.04, 0.27);
  rockToPos.x -= 0.88;
  rockToPos.y -= rockDims.y * 0.5;
  var rockUv = 4.0 * computeParaboloidUv(normalize(rockToPos)) + modRand * vec2f(1.0);
  res.material.y = rockUv.x;
  res.material.z = rockUv.y;
  var minDist = sdEllipsoid(rockToPos, rockDims);

  rockToPos = campfireToPos;
  rockXZ = pR(rockToPos.xz, 0.2 * kPI);
  id = pModPolar(&rockXZ, 5.0);
  rockToPos = vec3f(rockXZ.x, rockToPos.y, rockXZ.y);
  modRand = hash11((2.0 + id) * 97.5887);
  modRandSNorm = modRand * 2.0 - 1.0;
  rockDims = vec3f(0.2 + modRandSNorm * 0.05, 0.14 - modRandSNorm * 0.03, 0.26 + modRandSNorm * 0.03);
  rockToPos.x -= 0.75;
  rockToPos.y -= rockDims.y * 0.5;
  let rockD = sdEllipsoid(rockToPos, rockDims);
  if (rockD < minDist) {
    rockUv = 4.0 * computeParaboloidUv(normalize(rockToPos)) + modRand * vec2f(1.0);
    res.material.y = rockUv.x;
    res.material.z = rockUv.y;
    minDist = rockD;
  }

  var dispPos = posWS;
  var dispScale = 0.1;
  _ = pMod3(&dispPos, vec3f(1.0) * dispScale * 3.0);
  var dispD = fSphere(dispPos, dispScale);
  dispPos = posWS;
  dispScale = 0.125;
  _ = pMod3(&dispPos, vec3f(1.0) * dispScale * 3.5);
  dispD = min(dispD, fBoxCheap(dispPos, vec3f(1.0) * dispScale));

  res.d = smin(minDist + dispScale * 0.5, smax(minDist - dispScale * 0.25, -dispD, 0.15), 0.05);
  return res;
}

fn fCoals(posWS: vec3f) -> MatResult {
  var res: MatResult;
  res.material = vec4f(kMatCoals, 0.0, 0.0, 0.0);

  let campfireToPosWS = posWS - kCampfireCenterWS;
  let distToCampfireXZ = length(campfireToPosWS.xz) - 0.65;
  let distToCampfire = max(distToCampfireXZ, campfireToPosWS.y - 0.1);
  if (distToCampfire > 0.25) {
    res.d = distToCampfire;
    return res;
  }

  var pCoal = campfireToPosWS;
  pCoal.y += dot(campfireToPosWS, campfireToPosWS) * 0.2 - 0.035;
  var coalXZ = pCoal.xz;
  var id = pMod2(&coalXZ, vec2f(1.0) * 0.15) * 967.045;
  var coalRand = hash12(id);
  coalXZ = pR(coalXZ, coalRand * 2.0 * kPI);
  pCoal = vec3f(coalXZ.x, pCoal.y, coalXZ.y);
  var coalD = fCapsuleY(pCoal.xzy, 0.03, 0.05);
  var zw = computeParaboloidUv(normalize(pCoal)) + coalRand * vec2f(1.0);
  res.material = vec4f(kMatCoals, coalRand, zw.x, zw.y);

  pCoal = campfireToPosWS;
  pCoal.y += dot(campfireToPosWS, campfireToPosWS) * 0.25 - 0.035;
  pCoal.x += 0.16895;
  pCoal.z += 0.16895;
  coalXZ = pCoal.xz;
  id = pMod2(&coalXZ, vec2f(1.0) * 0.12) * 739.2397;
  coalRand = hash12(id);
  coalXZ = pR(coalXZ, coalRand * 1.0 * kPI);
  pCoal = vec3f(coalXZ.x, pCoal.y, coalXZ.y);
  let coalAltD = fCapsuleY(pCoal.xzy, 0.025, 0.04);
  if (coalAltD < coalD) {
    coalD = coalAltD;
    zw = computeParaboloidUv(normalize(pCoal)) + coalRand * vec2f(1.0);
    res.material = vec4f(kMatCoals, coalRand, zw.x, zw.y);
  }

  res.d = coalD;
  return res;
}

fn fSDF(posWS: vec3f, doVolumetric: bool, ch2: texture_2d<f32>, s2: sampler) -> MatResult {
  var res: MatResult;
  res.d = kMaxDist;
  res.material = vec4f(0.0);

  let groundUv = posWS.xz + vec2f(1.0) * 3.0;
  var groundNormalisedDisp = 0.0;
  if (posWS.y < 0.3) {
    groundNormalisedDisp = textureSampleLevel(ch2, s2, groundUv * 0.05, 0.0).r;
  }

  let logs = fCampfireLogs(posWS, doVolumetric);
  if (logs.d < res.d) {
    res.d = logs.d;
    res.material = logs.material;
  }

  let rocks = fCampfireRocks(posWS);
  let campfireRocksD = rocks.d - groundNormalisedDisp * 0.02;
  if (campfireRocksD < res.d) {
    res.d = campfireRocksD;
    res.material = rocks.material;
  }

  let coals = fCoals(posWS);
  let coalsD = coals.d - groundNormalisedDisp * 0.035;
  if (coalsD < res.d) {
    res.d = coalsD;
    res.material = coals.material;
    res.material.y = logs.minFireD + (coals.material.y - 0.5) * 0.5;
  }

  let groundD = posWS.y - groundNormalisedDisp * 0.05;
  if (groundD < res.d) {
    let ambientVis = 0.99 * linearstep(0.0, 0.1, campfireRocksD);
    res.material = vec4f(kMatGround, groundUv.x, groundUv.y,
                         floor(groundNormalisedDisp * 256.0) + ambientVis);
    res.d = groundD;
  }
  return res;
}

fn fMaterialSDF(dist: f32, material: vec4f, ch1: texture_2d<f32>, s1: sampler,
                ch2: texture_2d<f32>, s2: sampler) -> f32 {
  if (abs(material.x - kMatWoodLog) < 0.1) {
    let uv = material.yz;
    var bark = textureSampleLevel(ch1, s1, uv * 0.05, 0.0).r;
    bark += 0.5 * textureSampleLevel(ch1, s1, uv * 0.1, 0.0).r;
    let isBark = step(-0.5, uv.y);
    return dist - bark * (0.025 * isBark + 0.005);
  } else if (abs(material.x - kMatRock) < 0.1) {
    let rock = textureSampleLevel(ch1, s1, material.yz * 0.04, 0.0).r;
    return dist - rock * 0.02;
  } else if (abs(material.x - kMatCoals) < 0.1) {
    let disp = textureSampleLevel(ch1, s1, material.zw * 0.04, 0.0).r;
    return dist - disp * 0.05;
  } else if (abs(material.x - kMatGround) < 0.1) {
    let groundMat = floor(material.w) / 256.0;
    let uv = material.yz;
    var disp = 0.25 * textureSampleLevel(ch2, s2, uv * 0.25, 0.0).r;
    disp += 0.15 * textureSampleLevel(ch2, s2, uv * 0.45, 0.0).r;
    var d = dist - disp * 0.1 * (1.0 - groundMat);
    let rock = textureSampleLevel(ch1, s1, uv * vec2f(0.25, 0.1), 0.0).r;
    d -= rock * 0.025 * groundMat;
    return d;
  }
  return dist;
}

fn getNormalWS(p: vec3f, dt: f32, ch1: texture_2d<f32>, s1: sampler,
               ch2: texture_2d<f32>, s2: sampler) -> vec3f {
  var normalWS = vec3f(0.0);
  for (var i = s_zeroI; i < 4; i++) {
    let e = 0.5773 * (2.0 * vec3f(f32(((i + 3) >> 1u) & 1), f32((i >> 1u) & 1), f32(i & 1)) - 1.0);
    let s = fSDF(p + e * dt, false, ch2, s2);
    normalWS += e * fMaterialSDF(s.d, s.material, ch1, s1, ch2, s2);
  }
  return normalize(normalWS);
}

fn computeVolumetricLighting(material: vec4f, mediumD: f32, stepD: f32, insTrans: vec4f) -> vec4f {
  let emissiveColour = blackBodyToRGB(2500.0 + material.y * 2500.0, 3000.0);
  let density = max(0.001, -mediumD * 40.0);
  let stepTransmittance = exp(-stepD * density * 1.0);
  return vec4f(insTrans.rgb + insTrans.a * (1.0 - stepTransmittance) * emissiveColour,
               insTrans.a * stepTransmittance);
}

fn march(ro: vec3f, rd: vec3f, maxT: f32, ch2: texture_2d<f32>, s2: sampler) -> MarchResult {
  var res: MarchResult;
  res.insTrans = vec4f(0.0, 0.0, 0.0, 1.0);
  res.material = vec4f(0.0);
  res.hit = false;
  var t = 0.001;
  for (var i = s_zeroI; i < 128; i++) {
    let coneWidth = s_pixelCone * t;
    let s = fSDF(ro + rd * t, true, ch2, s2);
    var d = s.d;
    res.material = s.material;
    if (s.material.x == kMatFire && d < coneWidth) {
      let mediumD = d;
      d = max(0.01, abs(d)) * (s_pixelRand * 0.5 + 0.75) + coneWidth;
      res.insTrans = computeVolumetricLighting(s.material, mediumD, d, res.insTrans);
    }
    t += d;
    if (i >= 127) {
      t = maxT;
    }
    if (t >= maxT) {
      t = maxT;
      break;
    }
    if (d < coneWidth) {
      res.hit = true;
      break;
    }
  }
  res.t = t;
  return res;
}

fn marchShadow(ro: vec3f, rd: vec3f, tIn: f32, mt: f32, tanSourceRadius: f32,
               ch2: texture_2d<f32>, s2: sampler) -> f32 {
  var t = tIn;
  var minVisibility = 1.0;
  for (var i = s_zeroI; i < 8 && t < mt; i++) {
    let coneWidth = max(0.0001, tanSourceRadius * t);
    let d = fSDF(ro + rd * t, false, ch2, s2).d + coneWidth * 0.5;
    minVisibility = min(minVisibility, d / max(0.0001, coneWidth * 1.0));
    t += d;
    if (i >= 7) {
      t = mt;
    }
    if (minVisibility < 0.01) {
      minVisibility = 0.0;
    }
  }
  return smoothstep(0.0, 1.0, minVisibility);
}

fn getFireShadow(posWS: vec3f, ch2: texture_2d<f32>, s2: sampler) -> f32 {
  let fireLife = max(0.0, s_globalFireLife);
  var fireLightPosWS = vec3f(0.0, 0.05 + fireLife * 0.35, 0.0);
  let lightAnim = s_time * 15.0;
  let lightAnimAmpl = 0.02;
  fireLightPosWS.x += lightAnimAmpl * sin(lightAnim);
  fireLightPosWS.z += lightAnimAmpl * cos(lightAnim);
  let fireLightRadius = 0.7 - fireLife * 0.25;
  let posToFireWS = fireLightPosWS - posWS;
  let posToFireLength = length(posToFireWS);
  let posToFireDirWS = posToFireWS / max(0.0001, posToFireLength);
  if (posToFireLength - fireLightRadius < 0.0) {
    return 1.0;
  }
  let lightTanAngularRadius = fireLightRadius / max(0.0001, posToFireLength);
  return marchShadow(posWS, posToFireDirWS, 0.001, max(0.0, posToFireLength - fireLightRadius),
                     lightTanAngularRadius, ch2, s2);
}

fn computeSurfaceLighting(posWS: vec3f, rayDirWS: vec3f, normalWS: vec3f, albedo: vec3f,
                          f0Reflectance: vec3f, roughness: f32, emissive: vec4f, ambient: f32,
                          ch2: texture_2d<f32>, s2: sampler) -> vec3f {
  if (emissive.a > 0.999) {
    return emissive.rgb;
  }
  let shadow = getFireShadow(posWS + normalWS * 0.02, ch2, s2);
  let reflectedRayDirWS = reflect(rayDirWS, normalWS);
  let rDotN = max(0.0001, dot(reflectedRayDirWS, normalWS));
  let fresnelReflectance = roughFresnel(f0Reflectance, rDotN, roughness);
  let diffuse = albedo * computeLightingCone(posWS, normalWS, normalWS, 1.0, ambient, shadow);
  let specular = computeLightingCone(posWS, reflectedRayDirWS, normalWS, roughness, ambient, shadow);
  let surfaceLighting = mix(diffuse, specular, fresnelReflectance);
  return surfaceLighting * (1.0 - emissive.a) + emissive.rgb;
}

fn computeSceneColour(endPointWS: vec3f, rayDirectionWS: vec3f, marchedDist: f32, materialIn: vec4f,
                      ch1: texture_2d<f32>, s1: sampler, ch2: texture_2d<f32>, s2: sampler) -> vec3f {
  var material = materialIn;
  let normalDt = 0.001 + s_pixelCone * marchedDist;
  var normalWS = getNormalWS(endPointWS, normalDt, ch1, s1, ch2, s2);
  normalWS = fixNormalBackFacingness(rayDirectionWS, normalWS);

  var albedo = vec3f(1.0, 0.0, 1.0);
  var f0Reflectance = vec3f(0.04);
  var roughness = 0.6;
  var emissive = vec4f(0.0);
  var ambient = 1.0;
  let woodAlbedo = vec3f(0.15, 0.07, 0.02);

  if (abs(material.x - kMatDefault) < 0.1) {
    roughness = material.y;
    let metallicness = material.z;
    albedo = vec3f(0.5);
    f0Reflectance = mix(vec3f(0.04), vec3f(1.0), metallicness);
    albedo *= 1.0 - metallicness;
  } else if (abs(material.x - kMatWoodLog) < 0.1) {
    let matUv = material.yz;
    let woodTex = textureSampleLevel(ch1, s1, matUv * 0.05, 0.0).rgb;
    albedo = woodAlbedo * woodTex;
    let barkNoise = textureSampleLevel(ch1, s1, matUv * vec2f(0.05, 0.25), 0.0).r;
    let cracks = linearstep(0.5, 0.75, barkNoise);
    let ash = linearstep(0.45, 0.55, 1.0 - barkNoise);
    let isOuterLayer = select(1.0, material.y, material.z < -0.999);
    material.w += (woodTex.r - cracks * 2.0) * 0.2;
    let burnFactor = saturate(material.w * 5.0);
    let burntFactor = saturate(material.w * 5.0 - 0.2);
    let emissiveStrength = linearstep(1.0, 0.5, woodTex.r) *
      max(0.0, s_globalFireLife * 0.75 + 0.25) * linearstep(0.3, 0.8, isOuterLayer);
    emissive = mix(vec4f(0.0), vec4f(vec3f(1.5, 0.07, 0.005) * emissiveStrength, 1.0), burnFactor);
    emissive = mix(emissive, vec4f(0.0), burntFactor);
    let burntAlbedo = mix(vec3f(0.0), vec3f(0.5), ash);
    albedo = mix(albedo, burntAlbedo, burnFactor);
    roughness = mix(0.8, 0.975, burnFactor);
  } else if (abs(material.x - kMatRock) < 0.1) {
    ambient = linearstep(-0.6, -0.0, normalWS.y);
    let rockTex = textureSampleLevel(ch2, s2, material.yz * 0.1, 0.0).rgb;
    albedo = rockTex * 0.25;
    let soot = smoothstepg(0.5, -0.1, dot(normalWS, normalize(vec3f(0.0, 0.5, 0.0) - endPointWS)));
    albedo *= (0.05 + 0.95 * soot);
    roughness = 0.6 + soot * 0.35;
  } else if (abs(material.x - kMatGround) < 0.1) {
    let groundMat = floor(material.w) / 256.0;
    ambient = fract(material.w);
    let albedoTex = textureSampleLevel(ch1, s1, material.yz * 0.5, 0.0).rgb;
    let grass = linearstep(0.4, 0.7, albedoTex.r);
    albedo = mix(vec3f(0.07, 0.035, 0.005), vec3f(0.01, 0.05, 0.0005), grass);
    let rockBlend = linearstep(0.45, 0.5, groundMat);
    albedo = mix(albedo, albedoTex.rrr * 0.2, rockBlend);
    roughness = mix(0.85, 0.775, grass);
    roughness = mix(roughness, 0.6, rockBlend);
  } else if (abs(material.x - kMatCoals) < 0.1) {
    var noise = textureSampleLevel(ch1, s1, endPointWS.xz, 0.0).r;
    noise *= noise;
    albedo = vec3f(0.0);
    roughness = 0.95;
    let randBurnStrength = material.y;
    var isBurning = linearstep(0.075, -0.05, randBurnStrength);
    isBurning *= noise * linearstep(0.3, 0.8, normalWS.y);
    isBurning *= max(0.0, 1.0 - s_globalFireLife * dot(endPointWS, endPointWS) * 8.0);
    let emissiveStrength = 1.5 * max(0.0, s_globalFireLife * 0.75 + 0.25);
    emissive = vec4f(vec3f(1.5, 0.05, 0.005) * emissiveStrength, 1.0) * isBurning;
  }

  return computeSurfaceLighting(endPointWS, rayDirectionWS, normalWS, albedo, f0Reflectance,
                                roughness, emissive, ambient, ch2, s2);
}
`;

export default SCENE_WGSL;
