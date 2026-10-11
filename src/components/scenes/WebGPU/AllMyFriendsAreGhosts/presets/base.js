import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  LEGACY_DEFAULTS,
  SINGULARITY_DEFAULTS,
  WEBGPU_DEFAULTS,
} from '@modules/blackHole';
import {
  DEFAULT_WAVE_QUALITY,
  buildFirstWaveControls,
  buildSecondWaveControls,
} from '@modules/ifftOcean';

import { LOCATION_BLACK_HOLE } from '../utils/locations';

const xyz = (x, y, z) => ({ x, y, z });

const waveDefaults = (controls) =>
  Object.fromEntries(
    Object.entries(controls).map(([key, control]) => [key, control.value])
  );

const CAMERA = {
  cameraMode: 'spline',
  splinePreset: 'Black Hole Drift',
  splineDesktopTarget: xyz(-16, 0, -8),
  splineMobileTarget: xyz(-16, 0, -8),
  splineDesktopFov: 58,
  splineMobileFov: 70,
  splineDuration: 80,
  splineOrientationMode: 'target',
};

const LIGHTING = {
  lightHemiSkyColor: '#9fb4d8',
  lightHemiGroundColor: '#1a1d26',
  lightHemiIntensity: 0.4,
  lightKeyColor: '#fff1dc',
  lightKeyIntensity: 2,
  lightKeyAzimuth: 200,
  lightKeyElevation: 25,
  lightKeyShadowExtent: 6,
  lightRimColor: '#9cc4ff',
  lightRimIntensity: 0.8,
  lightRimAzimuth: 20,
  lightRimElevation: 35,
};

const PLACE = {
  location: LOCATION_BLACK_HOLE,
  backdropColor: '#000000',
  fogEnabled: false,
  fogNear: 20,
  fogFar: 400,
};

const GHOST = {
  ghostPosition: xyz(0, 0, 0),
  ghostRotationY: -48,
  ghostTiltBack: 0,
  ghostScale: 1,
  ghostColor: '#f5f2ea',
  ghostEyeColor: '#000000',
  ghostEyeIntensity: 0.2,
  ghostGlowColor: '#88ccff',
  ghostOuterGlow: 0,
  ghostInnerGlow: 0,
  ghostGroundLightIntensity: 0,
  ghostBobAmplitude: 0.03,
  ghostBobSpeed: 0.5,
  ghostTilt: 0.3,
  ghostBaseWind: 0.3,
  ghostWindBoost: 2,
  ghostWindStrength: 0,
  ghostWindAngle: 180,
  ghostWindGust: 0,
  ghostClothSegments: 28,
};

const SPACE = {
  starsVisible: true,
  starsVariant: 'milkyWay',
  starsBrightness: 0.8,
  starsRotation: xyz(0, 0, 0),
  starsTint: '#ffffff',
  earthVisible: false,
  earthAzimuth: -90,
  earthElevation: 15,
  earthSize: 4,
  earthAtmosphere: '#4f8cff',
  earthSpin: 0.01,
};

const BLACK_HOLE = {
  blackHoleVariant: BLACK_HOLE_VARIANT_LEGACY_PORT,
  blackHolePosition: xyz(-34, 6, 2),
  metricWorldScale: 14,
  blackHoleLightEnabled: true,
  blackHoleLightIntensity: 3,
  blackHoleLightVividness: 0.85,
  blackHoleLightColor: '#ffb36b',
  ...LEGACY_DEFAULTS,
  ...WEBGPU_DEFAULTS,
  ...SINGULARITY_DEFAULTS,
};

const OCEAN = {
  oceanQuality: DEFAULT_WAVE_QUALITY,
  oceanPatchSize: 1200,
  oceanPatchResolution: 384,
  oceanLodScale: 3.7,
  oceanFoamStrength: 0.8,
  oceanFoamThreshold: 2.7,
  oceanExposure: 1,
  oceanSkyVisible: true,
  oceanSkyTurbidity: 10,
  oceanSkyRayleigh: 3,
  oceanSkyMie: 0.005,
  oceanCustomColors: false,
  oceanSeaColor: '#0d223d',
  oceanHorizonColor: '#adceea',
  oceanReflectColor: '#507ea8',
  oceanWaveColor: '#698976',
  oceanFadeColor: '#00597c',
  oceanSpecularColor: '#cec4ba',
  oceanFoamColor: '#ffffff',
  oceanSpecularStrength: 1,
  oceanMoonVisible: false,
  oceanMoonSize: 3,
  oceanMoonColor: '#dfe6ff',
  oceanMoonGlow: 1.2,
  oceanGhostRide: 1,
  oceanGhostRock: 0.5,
  oceanGhostFollow: 3,
  ...waveDefaults(buildFirstWaveControls({ prefix: 'oceanFirst_' })),
  ...waveDefaults(buildSecondWaveControls({ prefix: 'oceanSecond_' })),
};

const WING = {
  wingStorm: false,
  wingAirspeed: 70,
  wingTurbulence: 0.3,
  wingTurbulenceSpeed: 1,
  wingLightsVisible: true,
  wingNavColor: '#ff2a2a',
  wingNavIntensity: 4,
  wingSkyVisible: true,
  wingSkyTurbidity: 4,
  wingSkyRayleigh: 1.8,
  wingSkyMie: 0.006,
  wingCloudsVisible: true,
  wingCloudHeight: -120,
  wingCloudCoverage: 0.45,
  wingCloudSoftness: 0.12,
  wingCloudLitColor: '#ffd8b8',
  wingCloudShadeColor: '#8a8fb0',
  wingCloudHorizonColor: '#f2b98e',
  wingRainCount: 3500,
  wingRainLength: 0.6,
  wingRainOpacity: 0.35,
  wingRainColor: '#a9b8d6',
  wingFlashColor: '#cfd8ff',
  wingFlashIntensity: 12,
  wingFlashMinGap: 4,
  wingFlashMaxGap: 12,
};

const MOONS = {
  tinyMoonRadius: 3,
  tinyMoonDisplacement: 0.04,
  tinyMoonBump: 1.5,
  tinyMoonRoughness: 0.95,
  tinyMoonTint: '#ffffff',
  lunarSeed: 7,
  lunarCraterCount: 420,
  lunarMaxCrater: 45,
  lunarRoughness: 1.1,
  lunarCurvature: 1100,
  lunarGrain: 0.5,
  lunarDarkColor: '#55534f',
  lunarLightColor: '#8d8a84',
};

const BASE = {
  ...CAMERA,
  ...LIGHTING,
  ...PLACE,
  ...GHOST,
  ...SPACE,
  ...BLACK_HOLE,
  ...OCEAN,
  ...WING,
  ...MOONS,
};

export default BASE;
