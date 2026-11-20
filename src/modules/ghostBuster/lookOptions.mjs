import { BURN_DEFAULTS, BURN_RANGES } from '../clothBurn/index.mjs';
import {
  choice,
  color,
  flag,
  inFacet,
  num,
  spec,
} from '../optionSchema/index.mjs';

const BURN_OPTIONS = Object.fromEntries(
  Object.entries(BURN_DEFAULTS).map(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (letter) => letter.toUpperCase());
    const range = BURN_RANGES[key];
    let item;
    if (range)
      item = num('burn', null, label, null, ...range, { nullable: true });
    else if (typeof value === 'boolean')
      item = flag('burn', null, label, null, { nullable: true });
    else item = color('burn', null, label, null, { nullable: true });
    return [key, inFacet('burn', item)];
  })
);

export const LOOK_OPTIONS = {
  ...BURN_OPTIONS,
  bgColor: inFacet(
    'lighting',
    color('lighting', null, 'Bg Color', null, { nullable: true })
  ),
  ambientIntensity: inFacet(
    'lighting',
    num('lighting', null, 'Ambient Intensity', null, 0, 5, 0.1, {
      nullable: true,
    })
  ),
  spotIntensity: inFacet(
    'lighting',
    num('lighting', null, 'Spot Intensity', null, 0, 10, 0.1, {
      nullable: true,
    })
  ),
  spotHeight: inFacet(
    'lighting',
    num('lighting', null, 'Spot Height', null, 1, 15, 0.5, { nullable: true })
  ),
  sceneEnvIntensity: inFacet(
    'lighting',
    num('lighting', null, 'Scene Env Intensity', null, 0, 5, 0.05, {
      nullable: true,
    })
  ),
  envRotationY: inFacet(
    'lighting',
    num('lighting', null, 'Env Rotation Y', null, -Math.PI, Math.PI, 0.05, {
      nullable: true,
    })
  ),
  orbitLightEnabled: inFacet(
    'lighting',
    flag('lighting', null, 'Orbit Light Enabled', null, { nullable: true })
  ),
  orbitLightColor: inFacet(
    'lighting',
    color('lighting', null, 'Orbit Light Color', null, { nullable: true })
  ),
  orbitLightIntensity: inFacet(
    'lighting',
    num('lighting', null, 'Orbit Light Intensity', null, 0, 20, 0.1, {
      nullable: true,
    })
  ),
  orbitLightRadius: inFacet(
    'lighting',
    num('lighting', null, 'Orbit Light Radius', null, 0.5, 6, 0.1, {
      nullable: true,
    })
  ),
  orbitLightSpeed: inFacet(
    'lighting',
    num('lighting', null, 'Orbit Light Speed', null, 0.05, 3, 0.05, {
      nullable: true,
    })
  ),
  orbitLightMinY: inFacet(
    'lighting',
    num('lighting', null, 'Orbit Light Min Y', null, -2, 2, 0.1, {
      nullable: true,
    })
  ),
  orbitLightMaxY: inFacet(
    'lighting',
    num('lighting', null, 'Orbit Light Max Y', null, 0, 5, 0.1, {
      nullable: true,
    })
  ),
  gridSize: inFacet(
    'lighting',
    num('lighting', null, 'Grid Size', null, 0.1, 5, 0.1, { nullable: true })
  ),
  gridLineWidth: inFacet(
    'lighting',
    num('lighting', null, 'Grid Line Width', null, 0.005, 0.1, 0.005, {
      nullable: true,
    })
  ),
  floorColor: inFacet(
    'lighting',
    color('lighting', null, 'Floor Color', null, { nullable: true })
  ),
  gridLineColor: inFacet(
    'lighting',
    color('lighting', null, 'Grid Line Color', null, { nullable: true })
  ),
  color: inFacet(
    'material',
    color('material', null, 'Color', null, { nullable: true })
  ),
  innerColor: inFacet(
    'material',
    color('material', null, 'Inner Color', null, { nullable: true })
  ),
  roughness: inFacet(
    'material',
    num('material', null, 'Roughness', null, 0, 1, 0.01, { nullable: true })
  ),
  metalness: inFacet(
    'material',
    num('material', null, 'Metalness', null, 0, 1, 0.01, { nullable: true })
  ),
  innerRoughness: inFacet(
    'material',
    num('material', null, 'Inner Roughness', null, 0, 1, 0.01, {
      nullable: true,
    })
  ),
  innerMetalness: inFacet(
    'material',
    num('material', null, 'Inner Metalness', null, 0, 1, 0.01, {
      nullable: true,
    })
  ),
  envMapIntensity: inFacet(
    'material',
    num('material', null, 'Env Map Intensity', null, 0, 5, 0.05, {
      nullable: true,
    })
  ),
  sheen: inFacet(
    'material',
    num('material', null, 'Sheen', null, 0, 1, 0.01, { nullable: true })
  ),
  sheenRoughness: inFacet(
    'material',
    num('material', null, 'Sheen Roughness', null, 0, 1, 0.01, {
      nullable: true,
    })
  ),
  sheenColor: inFacet(
    'material',
    color('material', null, 'Sheen Color', null, { nullable: true })
  ),
  clearcoat: inFacet(
    'material',
    num('material', null, 'Clearcoat', null, 0, 1, 0.01, { nullable: true })
  ),
  clearcoatRoughness: inFacet(
    'material',
    num('material', null, 'Clearcoat Roughness', null, 0, 1, 0.01, {
      nullable: true,
    })
  ),
  opacity: inFacet(
    'material',
    num('material', null, 'Opacity', null, 0, 1, 0.01, { nullable: true })
  ),
  fabricAmount: inFacet(
    'fabric',
    num('fabric', null, 'Fabric Amount', null, 0, 1, 0.05, { nullable: true })
  ),
  fabricThreads: inFacet(
    'fabric',
    num('fabric', null, 'Fabric Threads', null, 10, 400, 5, { nullable: true })
  ),
  fabricDepth: inFacet(
    'fabric',
    num('fabric', null, 'Fabric Depth', null, 0, 1.5, 0.01, { nullable: true })
  ),
  fabricShade: inFacet(
    'fabric',
    num('fabric', null, 'Fabric Shade', null, 0, 1, 0.01, { nullable: true })
  ),
  fabricHem: inFacet(
    'fabric',
    num('fabric', null, 'Fabric Hem', null, 0, 0.1, 0.002, { nullable: true })
  ),
  fabricWear: inFacet(
    'fabric',
    num('fabric', null, 'Fabric Wear', null, 0, 1, 0.05, { nullable: true })
  ),
  outerTextureUrl: inFacet(
    'texture',
    spec('string', 'texture', null, 'Outer Texture Url', null, {
      nullable: true,
      help: 'Texture URL, or none to clear the texture',
    })
  ),
  innerTextureUrl: inFacet(
    'texture',
    spec('string', 'texture', null, 'Inner Texture Url', null, {
      nullable: true,
      help: 'Texture URL, or none to clear the texture',
    })
  ),
  textureBlend: inFacet(
    'texture',
    num('texture', null, 'Texture Blend', null, 0, 1, 0.01, { nullable: true })
  ),
  textureProjection: inFacet(
    'texture',
    choice(
      'texture',
      null,
      'Texture Projection',
      ['uv', 'world', 'screen'],
      null,
      { nullable: true }
    )
  ),
  textureTile: inFacet(
    'texture',
    flag('texture', null, 'Texture Tile', null, { nullable: true })
  ),
  textureSide: inFacet(
    'texture',
    choice('texture', null, 'Texture Side', ['both', 'inner', 'outer'], null, {
      nullable: true,
    })
  ),
  textureScaleX: inFacet(
    'texture',
    num('texture', null, 'Texture Scale X', null, 0.25, 8, 0.01, {
      nullable: true,
    })
  ),
  textureScaleY: inFacet(
    'texture',
    num('texture', null, 'Texture Scale Y', null, 0.25, 8, 0.01, {
      nullable: true,
    })
  ),
  textureRotation: inFacet(
    'texture',
    num('texture', null, 'Texture Rotation', null, -180, 180, 1, {
      nullable: true,
    })
  ),
  outlineEnabled: inFacet(
    'outline',
    flag('outline', null, 'Outline Enabled', null, { nullable: true })
  ),
  outlineMode: inFacet(
    'outline',
    choice(
      'outline',
      null,
      'Mode',
      [
        'outline',
        'glow',
        'pulse',
        'halftone',
        'rings',
        'fractal',
        'worley',
        'cell',
      ],
      null,
      { nullable: true }
    )
  ),
  outlineColor: inFacet(
    'outline',
    color('outline', null, 'Outline Color', null, { nullable: true })
  ),
  outlineHiddenColor: inFacet(
    'outline',
    color('outline', null, 'Outline Hidden Color', null, { nullable: true })
  ),
  outlineHiddenStrength: inFacet(
    'outline',
    num('outline', null, 'Outline Hidden Strength', null, 0, 1, 0.01, {
      nullable: true,
    })
  ),
  outlineStrength: inFacet(
    'outline',
    num('outline', null, 'Outline Strength', null, 0, 10, 0.1, {
      nullable: true,
    })
  ),
  outlineThickness: inFacet(
    'outline',
    num('outline', null, 'Outline Thickness', null, 0.1, 80, 0.1, {
      nullable: true,
    })
  ),
  outlineGlow: inFacet(
    'outline',
    num('outline', null, 'Outline Glow', null, 0, 2, 0.01, { nullable: true })
  ),
  outlineInside: inFacet(
    'outline',
    flag('outline', null, 'Outline Inside', null, { nullable: true })
  ),
  outlineDownSampleRatio: inFacet(
    'outline',
    num('outline', null, 'Outline Down Sample Ratio', null, 1, 4, 1, {
      nullable: true,
    })
  ),
  outlinePatternScale: inFacet(
    'outline',
    num('outline', null, 'Outline Pattern Scale', null, 0.25, 120, 0.1, {
      nullable: true,
    })
  ),
  outlinePatternOctaves: inFacet(
    'outline',
    num('outline', null, 'Outline Pattern Octaves', null, 1, 8, 1, {
      nullable: true,
    })
  ),
  outlinePatternLacunarity: inFacet(
    'outline',
    num('outline', null, 'Outline Pattern Lacunarity', null, 1, 4, 0.1, {
      nullable: true,
    })
  ),
  outlineRingStride: inFacet(
    'outline',
    num('outline', null, 'Outline Ring Stride', null, 2, 80, 1, {
      nullable: true,
    })
  ),
  outlineHalftoneScale: inFacet(
    'outline',
    num('outline', null, 'Outline Halftone Scale', null, 0.25, 4, 0.05, {
      nullable: true,
    })
  ),
  outerEmissiveColor: inFacet(
    'emissive',
    color('emissive', null, 'Outer Emissive Color', null, { nullable: true })
  ),
  outerEmissiveIntensity: inFacet(
    'emissive',
    num('emissive', null, 'Outer Emissive Intensity', null, 0, 5, 0.05, {
      nullable: true,
    })
  ),
  innerEmissiveColor: inFacet(
    'emissive',
    color('emissive', null, 'Inner Emissive Color', null, { nullable: true })
  ),
  innerEmissiveIntensity: inFacet(
    'emissive',
    num('emissive', null, 'Inner Emissive Intensity', null, 0, 5, 0.05, {
      nullable: true,
    })
  ),
  emissiveFalloff: inFacet(
    'emissive',
    num('emissive', null, 'Emissive Falloff', null, 0, 10, 0.1, {
      nullable: true,
    })
  ),
  emissiveCenterU: inFacet(
    'emissive',
    num('emissive', null, 'Emissive Center U', null, 0, 1, 0.01, {
      nullable: true,
    })
  ),
  emissiveCenterV: inFacet(
    'emissive',
    num('emissive', null, 'Emissive Center V', null, 0, 1, 0.01, {
      nullable: true,
    })
  ),
  stiffness: inFacet(
    'shape',
    num('shape', null, 'Stiffness', null, 0.01, 0.5, 0.01, { nullable: true })
  ),
  dampening: inFacet(
    'shape',
    num('shape', null, 'Dampening', null, 0.9, 1, 0.001, { nullable: true })
  ),
  gravity: inFacet(
    'shape',
    num('shape', null, 'Gravity', null, 0, 0.001, 0.00001, { nullable: true })
  ),
  maxVelocity: inFacet(
    'shape',
    num('shape', null, 'Max Velocity', null, 0.001, 0.05, 0.001, {
      nullable: true,
    })
  ),
  clothSegments: inFacet(
    'shape',
    num('shape', null, 'Cloth Segments', null, 12, 60, 2, { nullable: true })
  ),
  clothWidth: inFacet(
    'shape',
    num('shape', null, 'Cloth Width', null, 0.2, 3.0, 0.05, { nullable: true })
  ),
  clothHeight: inFacet(
    'shape',
    num('shape', null, 'Cloth Height', null, 0.2, 3.0, 0.05, { nullable: true })
  ),
  clothDetail: inFacet(
    'shape',
    num('shape', null, 'Cloth Smoothing', null, 1, 4, 1, { nullable: true })
  ),
  clothThickness: inFacet(
    'shape',
    num('shape', null, 'Cloth Thickness', null, 0, 0.08, 0.005, {
      nullable: true,
    })
  ),
  holeAmount: inFacet(
    'wear',
    num('wear', null, 'Hole Amount', null, 0, 1, 0.01, { nullable: true })
  ),
  edgeFade: inFacet(
    'wear',
    num('wear', null, 'Edge Fade', null, 0, 0.5, 0.01, { nullable: true })
  ),
  tatterEdge: inFacet(
    'wear',
    num('wear', null, 'Tatter Edge', null, 0, 1, 0.01, { nullable: true })
  ),
  alphaScale: inFacet(
    'wear',
    num('wear', null, 'Alpha Scale', null, 0.5, 20, 0.5, { nullable: true })
  ),
  alphaSeed: inFacet(
    'wear',
    num('wear', null, 'Alpha Seed', null, 0, 200, 1, { nullable: true })
  ),
  smoothEdges: inFacet(
    'wear',
    flag('wear', null, 'Smooth Edges', null, { nullable: true })
  ),
  smoothOutline: inFacet(
    'wear',
    flag('wear', null, 'Smooth Outline', null, { nullable: true })
  ),
  outlineFade: inFacet(
    'wear',
    num('wear', null, 'Outline Fade', null, 0, 1, 0.005, { nullable: true })
  ),
  handSize: inFacet(
    'shape',
    num('shape', null, 'Hand Size', null, 0.01, 0.15, 0.005, { nullable: true })
  ),
  handHeight: inFacet(
    'shape',
    num('shape', null, 'Hand Height', null, 0.02, 0.6, 0.005, {
      nullable: true,
    })
  ),
  handSpacing: inFacet(
    'shape',
    num('shape', null, 'Hand Spacing', null, 0.05, 0.4, 0.01, {
      nullable: true,
    })
  ),
  handSpring: inFacet(
    'shape',
    num('shape', null, 'Hand Spring', null, 1, 20, 0.5, { nullable: true })
  ),
  handTrail: inFacet(
    'shape',
    num('shape', null, 'Hand Trail', null, 0, 0.5, 0.01, { nullable: true })
  ),
  cursorRadius: inFacet(
    'shape',
    num('shape', null, 'Cursor Radius', null, 0.02, 0.3, 0.01, {
      nullable: true,
    })
  ),
  collisionMargin: inFacet(
    'shape',
    num('shape', null, 'Collision Margin', null, 0, 0.1, 0.005, {
      nullable: true,
    })
  ),
  earLiftY: inFacet(
    'shape',
    num('shape', null, 'Ear Lift Y', null, 0, 0.4, 0.005, { nullable: true })
  ),
  earPushBack: inFacet(
    'shape',
    num('shape', null, 'Ear Push Back', null, -0.2, 0.3, 0.005, {
      nullable: true,
    })
  ),
  earSpread: inFacet(
    'shape',
    num('shape', null, 'Ear Spread', null, 0, 0.3, 0.005, { nullable: true })
  ),
  earColliderRadius: inFacet(
    'shape',
    num('shape', null, 'Ear Collider Radius', null, 0, 0.1, 0.005, {
      nullable: true,
    })
  ),
  eyeColor: inFacet(
    'face',
    color('face', null, 'Eye Color', null, { nullable: true })
  ),
  eyeIntensity: inFacet(
    'face',
    num('face', null, 'Eye Intensity', null, 0, 10, 0.1, { nullable: true })
  ),
  cutoutRimColor: inFacet(
    'face',
    color('face', null, 'Cutout Rim Color', null, { nullable: true })
  ),
  cutoutRimWidth: inFacet(
    'face',
    num('face', null, 'Cutout Rim Width', null, 0, 0.01, 0.0001, {
      nullable: true,
    })
  ),
  cutoutRimOffset: inFacet(
    'face',
    num('face', null, 'Cutout Rim Offset', null, -0.03, 0.03, 0.001, {
      nullable: true,
    })
  ),
  groundLightColor: inFacet(
    'lighting',
    color('lighting', null, 'Ground Light Color', null, { nullable: true })
  ),
  groundLightIntensity: inFacet(
    'lighting',
    num('lighting', null, 'Ground Light Intensity', null, 0, 10, 0.1, {
      nullable: true,
    })
  ),
  groundLightAngle: inFacet(
    'lighting',
    num('lighting', null, 'Ground Light Angle', null, 0.1, 1.5, 0.05, {
      nullable: true,
    })
  ),
  groundLightDistance: inFacet(
    'lighting',
    num('lighting', null, 'Ground Light Distance', null, 0.5, 10, 0.5, {
      nullable: true,
    })
  ),
  holeRimWidth: inFacet(
    'decay',
    num('decay', null, 'Hole Rim Width', null, 0, 0.05, 0.001, {
      nullable: true,
    })
  ),
  holeRimColor: inFacet(
    'decay',
    color('decay', null, 'Hole Rim Color', null, { nullable: true })
  ),
  holeRimGlow: inFacet(
    'decay',
    num('decay', null, 'Hole Rim Glow', null, 0, 3, 0.05, { nullable: true })
  ),
  bloodAmount: inFacet(
    'decay',
    num('decay', null, 'Blood Amount', null, 0, 1, 0.01, { nullable: true })
  ),
  bloodColor: inFacet(
    'decay',
    color('decay', null, 'Blood Color', null, { nullable: true })
  ),
  dripAmount: inFacet(
    'decay',
    num('decay', null, 'Drip Amount', null, 0, 0.2, 0.005, { nullable: true })
  ),
  dripCount: inFacet(
    'decay',
    num('decay', null, 'Drip Count', null, 1, 64, 1, { nullable: true })
  ),
  dripTint: inFacet(
    'decay',
    num('decay', null, 'Drip Tint', null, 0, 1, 0.01, { nullable: true })
  ),
  dripColor: inFacet(
    'decay',
    color('decay', null, 'Drip Color', null, { nullable: true })
  ),
  dripGlow: inFacet(
    'decay',
    num('decay', null, 'Drip Glow', null, 0, 5, 0.05, { nullable: true })
  ),
  dripSpeed: inFacet(
    'decay',
    num('decay', null, 'Drip Speed', null, 0, 5, 0.05, { nullable: true })
  ),
  cutoutBrow: inFacet(
    'decay',
    num('decay', null, 'Cutout Brow', null, 0, 1, 0.01, { nullable: true })
  ),
  cutoutBrowSlant: inFacet(
    'decay',
    num('decay', null, 'Cutout Brow Slant', null, 0, 3, 0.05, {
      nullable: true,
    })
  ),
  cloudVisible: inFacet(
    'storm',
    flag('storm', null, 'Cloud Visible', null, { nullable: true })
  ),
  cloudSize: inFacet(
    'storm',
    num('storm', null, 'Cloud Size', null, 0.2, 2, 0.01, { nullable: true })
  ),
  cloudHeight: inFacet(
    'storm',
    num('storm', null, 'Cloud Height', null, 0.1, 1.5, 0.01, { nullable: true })
  ),
  cloudColor: inFacet(
    'storm',
    color('storm', null, 'Cloud Color', null, { nullable: true })
  ),
  cloudRoughness: inFacet(
    'storm',
    num('storm', null, 'Cloud Roughness', null, 0, 1, 0.01, { nullable: true })
  ),
  cloudFlash: inFacet(
    'storm',
    num('storm', null, 'Cloud Flash', null, 0, 5, 0.05, { nullable: true })
  ),
  rainVisible: inFacet(
    'storm',
    flag('storm', null, 'Rain Visible', null, { nullable: true })
  ),
  rainCount: inFacet(
    'storm',
    num('storm', null, 'Rain Count', null, 10, 2000, 10, { nullable: true })
  ),
  rainSpeed: inFacet(
    'storm',
    num('storm', null, 'Rain Speed', null, 0.2, 8, 0.1, { nullable: true })
  ),
  rainLength: inFacet(
    'storm',
    num('storm', null, 'Rain Length', null, 0.01, 0.3, 0.005, {
      nullable: true,
    })
  ),
  rainWidth: inFacet(
    'storm',
    num('storm', null, 'Rain Width', null, 0.0005, 0.01, 0.0005, {
      nullable: true,
    })
  ),
  rainSpread: inFacet(
    'storm',
    num('storm', null, 'Rain Spread', null, 0.1, 1, 0.01, { nullable: true })
  ),
  rainColor: inFacet(
    'storm',
    color('storm', null, 'Rain Color', null, { nullable: true })
  ),
  rainOpacity: inFacet(
    'storm',
    num('storm', null, 'Rain Opacity', null, 0, 1, 0.01, { nullable: true })
  ),
  rainSplash: inFacet(
    'storm',
    num('storm', null, 'Rain Splash', null, 0, 0.1, 0.001, { nullable: true })
  ),
  lightningVisible: inFacet(
    'storm',
    flag('storm', null, 'Lightning Visible', null, { nullable: true })
  ),
  lightningMinGap: inFacet(
    'storm',
    num('storm', null, 'Lightning Min Gap', null, 0.2, 20, 0.1, {
      nullable: true,
    })
  ),
  lightningMaxGap: inFacet(
    'storm',
    num('storm', null, 'Lightning Max Gap', null, 0.2, 30, 0.1, {
      nullable: true,
    })
  ),
  lightningDuration: inFacet(
    'storm',
    num('storm', null, 'Lightning Duration', null, 0.1, 2, 0.05, {
      nullable: true,
    })
  ),
  lightningColor: inFacet(
    'storm',
    color('storm', null, 'Lightning Color', null, { nullable: true })
  ),
  lightningGlowColor: inFacet(
    'storm',
    color('storm', null, 'Lightning Glow Color', null, { nullable: true })
  ),
  lightningWidth: inFacet(
    'storm',
    num('storm', null, 'Lightning Width', null, 0.001, 0.02, 0.0005, {
      nullable: true,
    })
  ),
  lightningJitter: inFacet(
    'storm',
    num('storm', null, 'Lightning Jitter', null, 0, 1.5, 0.01, {
      nullable: true,
    })
  ),
  lightningBranches: inFacet(
    'storm',
    num('storm', null, 'Lightning Branches', null, 0, 8, 1, { nullable: true })
  ),
  bobAmplitude: inFacet(
    'motion',
    num('motion', null, 'Bob Amplitude', null, 0, 0.1, 0.005, {
      nullable: true,
    })
  ),
  bobSpeed: inFacet(
    'motion',
    num('motion', null, 'Bob Speed', null, 0, 5, 0.1, { nullable: true })
  ),
  swayAmplitude: inFacet(
    'motion',
    num('motion', null, 'Sway Amplitude', null, 0, 0.1, 0.005, {
      nullable: true,
    })
  ),
  tiltIntensity: inFacet(
    'motion',
    num('motion', null, 'Tilt Intensity', null, 0, 1, 0.01, { nullable: true })
  ),
  baseWind: inFacet(
    'motion',
    num('motion', null, 'Base Wind', null, 0, 2, 0.01, { nullable: true })
  ),
  windBoostMul: inFacet(
    'motion',
    num('motion', null, 'Wind Boost Mul', null, 0, 5, 0.1, { nullable: true })
  ),
  windAmplitude: inFacet(
    'motion',
    num('motion', null, 'Wind Amplitude', null, 0, 0.005, 0.0001, {
      nullable: true,
    })
  ),
  squashIntensity: inFacet(
    'motion',
    num('motion', null, 'Squash Intensity', null, 0, 0.5, 0.01, {
      nullable: true,
    })
  ),
};

export const LOOK_KEYS = Object.keys(LOOK_OPTIONS);
