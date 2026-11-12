import { folder } from 'leva';

import { CINDERBLOCKS, OPENINGS } from './cruiser';

export const SCENE_LABEL = 'Police Presence';

const num = (snap, key, label, min, max, step) => ({
  [key]: { label, max, min, step, value: snap[key] },
});
const plain = (snap, key, label) => ({ [key]: { label, value: snap[key] } });
const collapsed = (schema) => folder(schema, { collapsed: true });

const EMBER_COUNTS = [512, 1024, 1536, 2048, 4096];

function cinderblockFolders(snap) {
  return Object.fromEntries(
    CINDERBLOCKS.map(({ id, label }) => [
      label,
      collapsed({
        ...plain(snap, `${id}Position`, 'Position'),
        ...plain(snap, `${id}Rotation`, 'Rotation'),
        ...plain(snap, `${id}Scale`, 'Scale'),
      }),
    ])
  );
}

// The scene's own folders, after Presets, Camera and Lighting, seeded from
// the active preset's snapshot.
export default function sceneFolders(snap) {
  return {
    Scene: collapsed({
      ...num(snap, 'renderScale', 'Render Scale', 0.5, 1, 0.05),
      ...plain(snap, 'backgroundColor', 'Background'),
      ...plain(snap, 'showTires', 'Tires'),
      ...plain(snap, 'floorVisible', 'Floor'),
      ...plain(snap, 'floorColor', 'Floor Color'),
      ...num(snap, 'floorRoughness', 'Floor Roughness', 0, 1, 0.01),
      ...num(snap, 'floorSize', 'Floor Size', 4, 200, 1),
      ...plain(snap, 'fogEnabled', 'Fog'),
      ...num(snap, 'fogNear', 'Fog Near', 0, 100, 0.5),
      ...num(snap, 'fogFar', 'Fog Far', 1, 200, 0.5),
      ...num(snap, 'scorchAmount', 'Scorch', 0, 1.5, 0.01),
      ...plain(snap, 'scorchColor', 'Scorch Color'),
      ...plain(snap, 'scorchSize', 'Scorch Size'),
      ...plain(snap, 'scorchTrail', 'Scorch Trail'),
    }),
    Fire: collapsed({
      ...plain(snap, 'plumeVisible', 'Visible'),
      Vents: collapsed(
        Object.fromEntries(
          OPENINGS.flatMap(({ key, label }) =>
            Object.entries(plain(snap, key, label))
          )
        )
      ),
      ...num(snap, 'plumeFireShare', 'Flame Share', 0.02, 0.6, 0.005),
      ...num(snap, 'plumeFireIntensity', 'Intensity', 0, 40, 0.1),
      ...plain(snap, 'plumeFireHot', 'Hot'),
      ...plain(snap, 'plumeFireMid', 'Mid'),
      ...plain(snap, 'plumeFireCool', 'Cool'),
      ...plain(snap, 'plumeGlowColor', 'Smoke Glow Color'),
      ...num(snap, 'plumeGlow', 'Smoke Glow', 0, 3, 0.01),
      Tongues: collapsed({
        ...num(snap, 'plumeLick', 'Amount', 0, 1, 0.01),
        ...num(snap, 'plumeLickSpeed', 'Rise Speed', 0, 8, 0.05),
        ...num(snap, 'plumeLickScale', 'Scale', 0.1, 3, 0.01),
        ...num(snap, 'plumeLickStretch', 'Squash', 0.05, 1, 0.01),
      }),
      Light: collapsed({
        ...plain(snap, 'fireLightColor', 'Color'),
        ...num(snap, 'fireLightIntensity', 'Intensity', 0, 80, 0.1),
        ...num(snap, 'fireLightDistance', 'Distance', 1, 30, 0.1),
        ...plain(snap, 'fireLightShadows', 'Shadows'),
      }),
    }),
    Column: collapsed({
      ...num(snap, 'plumeHeight', 'Height', 4, 30, 0.1),
      ...num(snap, 'plumeLean', 'Lean (x)', -15, 15, 0.1),
      ...num(snap, 'plumeDrift', 'Drift (z)', -10, 10, 0.1),
      ...num(snap, 'plumeTwist', 'Twist (turns)', -2, 2, 0.01),
      ...num(snap, 'plumeGather', 'Gather', 0, 1.5, 0.01),
      ...num(snap, 'plumeRadiusStart', 'Width at Vent', 0.05, 1.5, 0.01),
      ...num(snap, 'plumeRadiusEnd', 'Width at Top', 0.3, 5, 0.01),
      ...num(snap, 'plumeSpeed', 'Speed', 0, 10, 0.05),
      ...num(snap, 'plumeBillow', 'Billow', 0, 1.5, 0.01),
      ...num(snap, 'plumeBillowScale', 'Billow Scale', 0.02, 1, 0.005),
      ...num(snap, 'plumeDensity', 'Density', 0, 4, 0.01),
      ...num(snap, 'plumeTopFade', 'Fade From', 0.2, 1, 0.01),
    }),
    Smoke: collapsed({
      ...plain(snap, 'plumeSmokeColor', 'Colour'),
      ...num(snap, 'plumeSoot', 'Soot', 0, 16, 0.05),
      ...num(snap, 'plumeShadow', 'Self Shadow', 0, 2, 0.01),
      ...num(snap, 'plumeSun', 'Sun', 0, 40, 0.1),
      ...plain(snap, 'plumeAmbientColor', 'Ambient Colour'),
      ...num(snap, 'plumeAmbient', 'Ambient', 0, 3, 0.01),
      ...num(snap, 'plumeCoreAmbient', 'Core Ambient', 0, 1, 0.01),
      ...num(snap, 'plumeErosion', 'Erosion', 0, 1, 0.01),
      ...num(snap, 'plumeDetailScale', 'Detail Scale', 1, 8, 0.05),
      ...num(snap, 'plumeResolution', 'Resolution', 0.25, 1, 0.05),
      ...num(snap, 'plumeSteps', 'Dense Steps', 24, 300, 1),
      ...num(snap, 'plumeStepSize', 'Step Size', 0.02, 0.5, 0.005),
    }),
    Haze: collapsed({
      ...num(snap, 'hazeDensity', 'Air Density', 0, 0.3, 0.001),
      ...num(snap, 'hazeHeight', 'Thins Over', 0.2, 20, 0.1),
      ...num(snap, 'hazeSmoke', 'Beams on Smoke', 0, 4, 0.01),
      ...num(snap, 'hazeStep', 'Air Step', 0.05, 2, 0.01),
    }),
    Embers: collapsed({
      ...plain(snap, 'emberVisible', 'Visible'),
      emberCount: {
        label: 'Count',
        options: EMBER_COUNTS,
        value: snap.emberCount,
      },
      ...num(snap, 'emberLife', 'Life', 0.3, 8, 0.05),
      ...num(snap, 'emberSpeed', 'Burst Speed', 0, 8, 0.05),
      ...num(snap, 'emberBuoyancy', 'Buoyancy', 0, 10, 0.05),
      ...plain(snap, 'emberWind', 'Wind'),
      ...num(snap, 'emberTurbulence', 'Turbulence', 0, 8, 0.05),
      ...num(snap, 'emberSize', 'Size', 0.005, 0.1, 0.001),
      ...num(snap, 'emberStreak', 'Streak', 0, 0.3, 0.001),
      ...num(snap, 'emberGlow', 'Glow', 0, 30, 0.1),
    }),
    Char: collapsed({
      ...plain(snap, 'charEnabled', 'Enabled'),
      ...num(snap, 'charAmount', 'Amount', 0, 2, 0.01),
      ...plain(snap, 'charColor', 'Soot'),
      ...num(snap, 'charReach', 'Reach', 0.1, 2, 0.01),
      ...num(snap, 'charDrip', 'Drips', 0, 1.2, 0.01),
      ...num(snap, 'charEmberGlow', 'Blister Glow', 0, 10, 0.05),
      ...num(snap, 'charInteriorGlow', 'Cabin Glow', 0, 10, 0.05),
    }),
    Sirens: collapsed({
      ...plain(snap, 'sirenOn', 'On'),
      ...num(snap, 'sirenSpeed', 'Turns / s', 0, 4, 0.01),
      ...num(snap, 'sirenIntensity', 'Intensity', 0, 200, 0.5),
      ...num(snap, 'sirenDistance', 'Distance', 0.5, 20, 0.1),
      ...num(snap, 'sirenAngle', 'Beam Angle', 5, 80, 1),
      ...num(snap, 'sirenGlow', 'Bulb Glow', 0, 20, 0.1),
      ...num(snap, 'sirenFlare', 'Flare', 0, 20, 0.05),
      ...num(snap, 'sirenFlareSize', 'Flare Size', 0, 3, 0.01),
      ...num(snap, 'sirenHaze', 'In Smoke', 0, 4, 0.01),
      ...plain(snap, 'sirenRed', 'Red'),
      ...plain(snap, 'sirenBlue', 'Blue'),
    }),
    Headlights: collapsed({
      ...plain(snap, 'headlightOn', 'On'),
      ...num(snap, 'headlightRate', 'Blinks / s', 0, 6, 0.01),
      ...num(snap, 'headlightIntensity', 'Intensity', 0, 40, 0.1),
      ...num(snap, 'headlightDistance', 'Distance', 0.5, 15, 0.1),
      ...num(snap, 'headlightGlow', 'Bulb Glow', 0, 20, 0.1),
      ...num(snap, 'headlightBeam', 'Beam Intensity', 0, 80, 0.1),
      ...num(snap, 'headlightAngle', 'Beam Angle', 5, 60, 0.5),
      ...num(snap, 'headlightRange', 'Beam Range', 1, 30, 0.1),
      ...num(snap, 'headlightFlare', 'Flare', 0, 20, 0.05),
      ...num(snap, 'headlightFlareSize', 'Flare Size', 0, 3, 0.01),
      ...num(snap, 'headlightHaze', 'In Smoke', 0, 4, 0.01),
      ...plain(snap, 'headlightColor', 'Color'),
    }),
    'Brake Lights': collapsed({
      ...plain(snap, 'brakeOn', 'On'),
      ...num(snap, 'brakeIntensity', 'Intensity', 0, 20, 0.1),
      ...num(snap, 'brakeDistance', 'Distance', 0.5, 10, 0.1),
      ...num(snap, 'brakeGlow', 'Bulb Glow', 0, 20, 0.1),
      ...num(snap, 'brakeFlare', 'Flare', 0, 20, 0.05),
      ...num(snap, 'brakeFlareSize', 'Flare Size', 0, 3, 0.01),
      ...plain(snap, 'brakeColor', 'Color'),
    }),
    Cinderblocks: collapsed({
      ...plain(snap, 'showCinderblocks', 'Visible'),
      ...cinderblockFolders(snap),
    }),
    Bloom: collapsed({
      ...plain(snap, 'bloomEnabled', 'Enabled'),
      ...num(snap, 'bloomThreshold', 'Threshold', 0, 3, 0.01),
      ...num(snap, 'bloomStrength', 'Strength', 0, 3, 0.01),
      ...num(snap, 'bloomRadius', 'Radius', 0, 1, 0.01),
    }),
  };
}
