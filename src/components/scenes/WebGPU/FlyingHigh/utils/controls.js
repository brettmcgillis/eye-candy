import { folder } from 'leva';

import { PLUMES } from './plumes';

export const SCENE_LABEL = 'Flying High';

const num = (snap, key, label, min, max, step) => ({
  [key]: { label, max, min, step, value: snap[key] },
});
const plain = (snap, key, label) => ({ [key]: { label, value: snap[key] } });
const collapsed = (schema) => folder(schema, { collapsed: true });

function plumeFolder(snap) {
  return collapsed({
    ...plain(snap, 'plumeVisible', 'Visible'),
    ...Object.fromEntries(
      PLUMES.flatMap(({ key, label }) =>
        Object.entries(plain(snap, key, label))
      )
    ),
    Flow: collapsed({
      ...num(snap, 'plumeSpeed', 'Speed', 0, 10, 0.05),
      ...num(snap, 'plumeRadiusStart', 'Width at Engine', 0.1, 2, 0.01),
      ...num(snap, 'plumeRadiusEnd', 'Width at End', 0.3, 4, 0.01),
      ...num(snap, 'plumeBillow', 'Billow', 0, 1.5, 0.01),
      ...num(snap, 'plumeBillowScale', 'Billow Scale', 0.02, 0.5, 0.005),
      ...num(snap, 'plumeDensity', 'Density', 0, 3, 0.01),
      ...num(snap, 'plumeTopFade', 'Fade From', 0.2, 1, 0.01),
    }),
    Fire: collapsed({
      ...num(snap, 'plumeFireShare', 'Burn Share', 0.02, 1, 0.01),
      ...num(snap, 'plumeFireIntensity', 'Intensity', 0, 30, 0.1),
      ...plain(snap, 'plumeFireHot', 'Hot'),
      ...plain(snap, 'plumeFireMid', 'Mid'),
      ...plain(snap, 'plumeFireCool', 'Cool'),
      ...plain(snap, 'plumeGlowColor', 'Glow Color'),
      ...num(snap, 'plumeGlow', 'Smoke Glow', 0, 2, 0.01),
      ...num(snap, 'plumeLightIntensity', 'Light Intensity', 0, 80, 0.1),
      ...num(snap, 'plumeLightDistance', 'Light Distance', 1, 40, 0.1),
    }),
    Smoke: collapsed({
      ...plain(snap, 'plumeSmokeColor', 'Colour'),
      ...num(snap, 'plumeSoot', 'Soot', 0, 12, 0.05),
      ...num(snap, 'plumeShadow', 'Self Shadow', 0, 2, 0.01),
      ...num(snap, 'plumeErosion', 'Erosion', 0, 1, 0.01),
      ...num(snap, 'plumeDetailScale', 'Detail Scale', 1, 8, 0.05),
      ...num(snap, 'plumeResolution', 'Resolution', 0.25, 1, 0.05),
      ...num(snap, 'plumeSteps', 'Dense Steps', 24, 300, 1),
      ...num(snap, 'plumeStepSize', 'Step Size', 0.03, 0.5, 0.005),
    }),
  });
}

// The scene's own folders, after Presets, Camera and Lighting, seeded from
// the active preset's snapshot.
export default function sceneFolders(snap) {
  return {
    Sky: collapsed({
      ...num(snap, 'skyDay', 'Daylight', 0, 1, 0.01),
      ...num(snap, 'skySunAz', 'Sun Azimuth (°)', -180, 180, 0.5),
      ...num(snap, 'skySunEl', 'Sun Elevation (°)', 1, 80, 0.5),
      ...num(snap, 'skyLightAz', 'Moon Azimuth (°)', -180, 180, 0.5),
      ...num(snap, 'skyLightEl', 'Moon Elevation (°)', 1, 80, 0.5),
      ...num(snap, 'skyMoonLight', 'Moonlight on Plane', 0, 5, 0.01),
      ...num(snap, 'skySunLight', 'Sunlight on Plane', 0, 10, 0.01),
      ...num(snap, 'skyTwinkle', 'Twinkle', 0, 2, 0.01),
      ...num(snap, 'skyStarLow', 'Stars Reach Down To', 0, 0.35, 0.005),
      ...num(snap, 'skyTownLights', 'Town Lights', 0, 3, 0.05),
      Flight: collapsed({
        ...num(snap, 'skySpeed', 'Speed', 0, 10, 0.01),
        ...num(snap, 'skyAltitude', 'Altitude', -3, 20, 0.05),
      }),
      Field: collapsed({
        ...num(snap, 'skySeed', 'Seed', 0, 999, 1),
        ...num(snap, 'skyCoverage', 'Coverage', -0.3, 0.3, 0.005),
        ...num(snap, 'skyDeckLift', 'Deck Lift', -4, 4, 0.05),
        ...num(snap, 'skyHeaps', 'Heaps', 0, 1, 0.01),
        ...num(snap, 'skyStorms', 'Storm Towers', 0, 1, 0.01),
        ...num(snap, 'skyStormHeight', 'Storm Height', 0, 50, 0.5),
      }),
      Quality: collapsed({
        ...plain(snap, 'skyAutoResolution', 'Auto Resolution'),
        ...num(snap, 'skyResolution', 'Cloud Resolution', 0.15, 1, 0.01),
      }),
    }),
    'Day Cycle': collapsed({
      ...plain(snap, 'cycleEnabled', 'Animate'),
      ...num(snap, 'cycleHold', 'Hold (s)', 5, 300, 1),
      ...num(snap, 'cycleTransition', 'Transition (s)', 1, 60, 0.5),
    }),
    Grade: collapsed({
      ...num(snap, 'gradeExposure', 'Exposure', 0.4, 2, 0.01),
      ...num(snap, 'gradeTemp', 'Temperature', -1, 1, 0.01),
      ...num(snap, 'gradeTint', 'Tint', -1, 1, 0.01),
      ...num(snap, 'gradeRays', 'Light Shafts', 0, 2, 0.01),
      ...num(snap, 'gradeSat', 'Saturation', 0, 2, 0.01),
      ...num(snap, 'gradeContrast', 'Contrast', 0.7, 1.5, 0.01),
      ...num(snap, 'gradeShadowAmt', 'Shadow Tint', 0, 1, 0.01),
      ...plain(snap, 'gradeShadow', 'Shadow Colour'),
      ...num(snap, 'gradeHighAmt', 'Highlight Tint', 0, 1, 0.01),
      ...plain(snap, 'gradeHigh', 'Highlight Colour'),
      ...num(snap, 'gradeLift', 'Night Glow', 0, 1.5, 0.01),
      ...num(snap, 'gradeVignette', 'Vignette', 0, 0.8, 0.01),
      ...num(snap, 'gradeGrain', 'Grain', 0, 0.03, 0.001),
    }),
    Plane: collapsed({
      ...num(snap, 'planeScale', 'Scale', 0.1, 2, 0.05),
      ...num(snap, 'planePosX', 'X', -20, 20, 0.1),
      ...num(snap, 'planePosY', 'Y', -20, 20, 0.1),
      ...num(snap, 'planePosZ', 'Z', -20, 20, 0.1),
      ...num(snap, 'planeRotXDeg', 'Rot X (°)', -180, 180, 0.5),
      ...num(snap, 'planeRotYDeg', 'Rot Y (°)', -180, 180, 0.5),
      ...num(snap, 'planeRotZDeg', 'Rot Z (°)', -180, 180, 0.5),
    }),
    Plumes: plumeFolder(snap),
    Sparks: collapsed({
      ...plain(snap, 'emberVisible', 'Visible'),
      emberCount: {
        label: 'Count',
        options: [256, 512, 1024, 2048, 4096],
        value: snap.emberCount,
      },
      ...num(snap, 'emberLife', 'Life', 0.2, 6, 0.05),
      ...num(snap, 'emberSpeed', 'Burst Speed', 0, 20, 0.1),
      ...num(snap, 'emberBuoyancy', 'Buoyancy', 0, 10, 0.05),
      ...plain(snap, 'emberWind', 'Airflow'),
      ...num(snap, 'emberTurbulence', 'Turbulence', 0, 10, 0.05),
      ...num(snap, 'emberSize', 'Size', 0.005, 0.2, 0.001),
      ...num(snap, 'emberStreak', 'Streak', 0, 0.3, 0.001),
      ...num(snap, 'emberGlow', 'Glow', 0, 30, 0.1),
    }),
    'Lens Flare': collapsed({
      ...plain(snap, 'flareEnabled', 'Enabled'),
      ...num(snap, 'flareIntensity', 'Intensity', 0, 4, 0.01),
      ...num(snap, 'flareSize', 'Size', 0.2, 4, 0.01),
      ...num(snap, 'flareChroma', 'Colour Fringe', 0, 0.15, 0.005),
      ...num(snap, 'flareMoon', 'Moon Flare', 0, 1, 0.01),
    }),
    Bloom: collapsed({
      ...plain(snap, 'bloomEnabled', 'Enabled'),
      ...num(snap, 'bloomThreshold', 'Threshold', 0, 3, 0.01),
      ...num(snap, 'bloomStrength', 'Strength', 0, 3, 0.01),
      ...num(snap, 'bloomRadius', 'Radius', 0, 1, 0.01),
    }),
  };
}
