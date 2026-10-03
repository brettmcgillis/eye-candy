/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  BAND_SIDES,
  BOUNDS,
  PLINTHS,
  SLICE_MODES,
  boundRadius,
  directionOf,
  kleinianParams,
  objectRotation,
  sliceFrame,
  stageLayout,
} from '@modules/apollian';
import { hexToRgb } from '@utils/paletteStops';

import { createPaletteLut, writePaletteLut } from './palette';

const DEG = Math.PI / 180;
const color = (hex = '#000000') => uniform(new THREE.Color(hex));
const vec3 = () => uniform(new THREE.Vector3());
const vec4 = () => uniform(new THREE.Vector4());
const int = (v = 0) => uniform(v, 'int');

export function createUniforms() {
  return {
    a4Angles: vec3(),
    a4Folds: int(7),
    a4Scale: uniform(1.2),
    a4Sheets: uniform(1),
    a4Twist: uniform(1),
    a4W: uniform(0.03125),
    absorption: uniform(0.333),
    ambient: uniform(0.6),
    aoSamples: int(8),
    aoStrength: uniform(1),
    background: color(),
    bandCount: uniform(8),
    bandSide: int(0),
    bandStep: uniform(0.012),
    boundKind: int(0),
    classicGap: uniform(0.03),
    clearcoat: uniform(0.3),
    colorWeights: vec4(),
    cubeHalf: uniform(0.75),
    cutGlow: uniform(0.6),
    cutNormal: vec3(),
    cutOffset: uniform(0),
    cutOn: uniform(0),
    discDrift: uniform(0),
    discFolds: int(8),
    discHalf: uniform(0.25),
    discScale: uniform(1.34),
    fieldOffset: vec3(),
    fieldScale: uniform(1),
    floorColor: color(),
    floorOn: uniform(1),
    exposure: uniform(1.2),
    floorShadow: uniform(0.75),
    floorY: uniform(-2),
    fog: uniform(0.04),
    hitEpsilon: uniform(0.0004),
    ior: uniform(1.2),
    iridescence: uniform(1),
    kleinFolds: int(7),
    kleinMaxs: vec4(),
    kleinMins: vec4(),
    lightColor: color(),
    lightDir: vec3(),
    marchSteps: int(160),
    objectSize: uniform(1),
    paletteRepeat: uniform(1),
    paletteReverse: uniform(0),
    paletteShift: uniform(0),
    paletteTexture: createPaletteLut(),
    plinthColor: color(),
    plinthHeight: uniform(0.7),
    plinthKind: int(0),
    plinthRoughness: uniform(0.6),
    plinthTop: uniform(-1),
    plinthWidth: uniform(0.8),
    resolution: uniform(new THREE.Vector2(1, 1)),
    roughness: uniform(0.45),
    shadowHardness: uniform(8),
    shadowSteps: int(40),
    skyHorizon: color(),
    skyZenith: color(),
    sliceAspect: uniform(1),
    sliceCentre: vec3(),
    sliceGlow: uniform(0.5),
    sliceHalf: uniform(1),
    sliceLine: uniform(1),
    sliceMode: int(0),
    sliceNormal: vec3(),
    slicePaper: color(),
    sliceShadow: uniform(1),
    sliceU: vec3(),
    sliceV: vec3(),
    stackCount: int(12),
    stackShift: vec3(),
    stackSpacing: uniform(0.06),
    stageCentre: vec3(),
    stageRadius: uniform(2),
    thickness: uniform(0.004),
    toObject: uniform(new THREE.Matrix3()),
    toWorld: uniform(new THREE.Matrix3()),
    worldRadius: uniform(1),
  };
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// The backdrop, plinth and floor drift toward the palette's darkest stops by
// `stagePalette`.
function stageColour(target, authored, stops, rank, amount) {
  target.set(authored);
  if (!stops || amount <= 0) return;
  const sorted = [...stops].sort((a, b) => luminance(a) - luminance(b));
  const stop = new THREE.Color(sorted[Math.min(rank, sorted.length - 1)]);
  target.lerp(stop.multiplyScalar(0.35), amount);
}

const setMat3 = (target, m) =>
  target.set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]);

export function applyConfig(u, config, { aspect = 1, stops = null } = {}) {
  const layout = stageLayout(config);
  const a = config;

  u.fieldScale.value = a.fieldScale;
  u.fieldOffset.value.set(a.fieldX, a.fieldY, a.fieldZ);
  u.thickness.value = a.family === 'classic' ? 0 : a.thickness;
  u.a4Folds.value = a.a4Folds;
  u.a4Scale.value = a.a4Scale;
  u.a4W.value = a.a4W;
  u.a4Twist.value = a.a4Twist;
  u.a4Sheets.value = a.a4Shape === 'sheets' ? 1 : 0;
  u.a4Angles.value.set(a.a4RotXW * DEG, a.a4RotYW * DEG, a.a4RotZW * DEG);
  u.discFolds.value = a.discFolds;
  u.discScale.value = a.discScale;
  u.discDrift.value = a.discDrift;
  const { maxs, mins } = kleinianParams(a.kleinKey);
  u.kleinFolds.value = a.kleinFolds;
  u.kleinMins.value.set(...mins);
  u.kleinMaxs.value.set(...maxs);
  u.classicGap.value = a.classicGap;

  u.boundKind.value = BOUNDS.indexOf(a.bound);
  u.discHalf.value = a.discHalf;
  u.cubeHalf.value = a.cubeHalf;
  u.cutOn.value = a.sectionCut ? 1 : 0;
  u.cutNormal.value.set(...directionOf(a.sliceAzimuth, a.sliceElevation));
  u.cutOffset.value = a.sliceOffset;

  const rotation = objectRotation(a.objectTilt, a.objectSpin);
  setMat3(u.toWorld.value, rotation);
  setMat3(u.toObject.value, rotation).transpose();
  u.objectSize.value = a.objectSize;
  u.worldRadius.value = boundRadius(a) * a.objectSize;

  u.paletteRepeat.value = a.paletteRepeat;
  u.paletteShift.value = a.paletteShift;
  u.paletteReverse.value = a.paletteReverse ? 1 : 0;
  u.colorWeights.value.set(
    a.colorTrap,
    a.colorDepth,
    a.colorRadius,
    a.colorHeight
  );
  const lutKey = stops ? stops.join(',') : '';
  if (u.paletteKey !== lutKey) {
    u.paletteKey = lutKey;
    writePaletteLut(u.paletteTexture, stops);
  }

  u.roughness.value = a.roughness;
  u.clearcoat.value = a.clearcoat;
  u.ior.value = a.ior;
  u.absorption.value = a.absorption;
  u.iridescence.value = a.iridescence;
  u.aoStrength.value = a.aoStrength;
  u.cutGlow.value = a.cutGlow;

  stageColour(u.background.value, a.background, stops, 0, a.stagePalette);
  stageColour(u.plinthColor.value, a.plinthColor, stops, 1, a.stagePalette);
  stageColour(u.floorColor.value, a.floorColor, stops, 0, a.stagePalette);
  u.skyZenith.value.set(a.skyZenith);
  u.skyHorizon.value.set(a.skyHorizon);
  u.plinthKind.value = PLINTHS.indexOf(layout.plinth);
  u.plinthRoughness.value = a.plinthRoughness;
  u.plinthTop.value = layout.plinthTop;
  u.plinthHeight.value = layout.plinthHeight;
  u.plinthWidth.value = layout.plinthWidth;
  u.floorOn.value = a.floorEnabled ? 1 : 0;
  u.floorY.value = layout.floorY;
  u.floorShadow.value = a.floorShadow;
  u.exposure.value = a.exposure;
  u.fog.value = a.fog;
  u.lightDir.value.set(...directionOf(a.lightAzimuth, a.lightElevation));
  u.lightColor.value.set(a.lightColor).multiplyScalar(a.lightIntensity);
  u.ambient.value = a.ambient;
  u.shadowHardness.value = 1 / a.shadowSoftness;

  const { max, min } = layout.bounds;
  u.stageCentre.value.set(0, (max[1] + min[1]) / 2, 0);
  u.stageRadius.value = Math.hypot(
    Math.max(max[0], layout.radius),
    (max[1] - min[1]) / 2,
    Math.max(max[2], layout.radius)
  );

  u.marchSteps.value = a.marchSteps;
  u.shadowSteps.value = a.shadowSteps;
  u.aoSamples.value = a.aoSamples;
  u.hitEpsilon.value = a.hitEpsilon;

  const frame = sliceFrame(a, aspect);
  u.sliceAspect.value = aspect;
  u.sliceNormal.value.set(...frame.n);
  u.sliceU.value.set(...frame.u);
  u.sliceV.value.set(...frame.v);
  u.sliceCentre.value.set(...frame.centre);
  u.sliceHalf.value = frame.half;
  u.sliceMode.value = SLICE_MODES.indexOf(a.sliceMode);
  u.bandStep.value = a.bandStep;
  u.bandCount.value = a.bandCount;
  u.bandSide.value = BAND_SIDES.indexOf(a.bandSide);
  u.stackCount.value = a.sliceMode === 'stack' ? a.stackCount : 1;
  u.stackSpacing.value = a.stackSpacing;
  const shift = a.stackShift * 2;
  u.stackShift.value.set(
    Math.cos(a.stackAngle * DEG) * shift,
    Math.sin(a.stackAngle * DEG) * shift,
    0
  );
  u.sliceGlow.value = a.sliceGlow;
  u.sliceShadow.value = a.sliceShadow;
  u.sliceLine.value = a.sliceLine;
  u.slicePaper.value.set(a.slicePaper);
  return layout;
}
