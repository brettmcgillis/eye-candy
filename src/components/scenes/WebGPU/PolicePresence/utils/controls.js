import { folder } from 'leva';

import { fireFolder } from '@elements/SimFire/simFireControls';

import { CINDERBLOCKS } from './cruiser';
import { FIRE_SPLINES } from './fire';

export const SCENE_LABEL = 'Police Presence';

const num = (snap, key, label, min, max, step) => ({
  [key]: { label, max, min, step, value: snap[key] },
});
const plain = (snap, key, label) => ({ [key]: { label, value: snap[key] } });
const collapsed = (schema) => folder(schema, { collapsed: true });

const PLUME_COUNTS = [512, 1024, 2048, 4096];

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
    }),
    Fire: fireFolder(snap, {
      Splines: collapsed(
        Object.fromEntries(
          FIRE_SPLINES.flatMap(({ key, label }) =>
            Object.entries(plain(snap, key, label))
          )
        )
      ),
      'Opacity & Cost': collapsed({
        ...num(snap, 'fireFlameOpacity', 'Flame Opacity', 0, 20, 0.1),
        ...plain(snap, 'fireSootColor', 'Soot Color'),
        ...num(snap, 'fireStepLength', 'Step Length', 0, 0.5, 0.005),
        ...num(snap, 'fireSkipBelow', 'Skip Below', -1, 0.05, 0.001),
        ...num(snap, 'fireCutoff', 'Ray Cutoff', 0, 0.2, 0.001),
      }),
    }),
    Plume: collapsed({
      ...plain(snap, 'plumeVisible', 'Visible'),
      plumeCount: {
        label: 'Puffs',
        options: PLUME_COUNTS,
        value: snap.plumeCount,
      },
      ...plain(snap, 'plumeEmitCentre', 'Emit Centre'),
      ...plain(snap, 'plumeEmitSize', 'Emit Size'),
      ...num(snap, 'plumeLife', 'Life', 2, 30, 0.1),
      ...num(snap, 'plumeRise', 'Rise', 0, 8, 0.01),
      ...num(snap, 'plumeSlowdown', 'Rise At End', 0, 1, 0.01),
      ...num(snap, 'plumeSpread', 'Spread', 0, 3, 0.01),
      ...plain(snap, 'plumeWind', 'Wind'),
      ...num(snap, 'plumeShear', 'Wind Height', 0.1, 20, 0.1),
      ...num(snap, 'plumeTurbulence', 'Turbulence', 0, 4, 0.01),
      ...num(snap, 'plumeTurbScale', 'Turb Scale', 0.02, 2, 0.01),
      ...num(snap, 'plumeSize', 'Size', 0.1, 6, 0.01),
      ...num(snap, 'plumeGrowth', 'Growth', 0, 10, 0.01),
      ...num(snap, 'plumeOpacity', 'Opacity', 0, 1, 0.001),
      ...num(snap, 'plumeThinning', 'Thinning', 0, 10, 0.01),
      ...plain(snap, 'plumeSootColor', 'Soot'),
      ...plain(snap, 'plumeAshColor', 'Ash'),
      ...num(snap, 'plumeAmbient', 'Ambient', 0, 2, 0.01),
      ...num(snap, 'plumeSun', 'Sun', 0, 2, 0.01),
      ...num(snap, 'plumeGlow', 'Fire Glow', 0, 8, 0.01),
      ...plain(snap, 'plumeGlowColor', 'Glow Color'),
      ...num(snap, 'plumeGlowHeight', 'Glow Height', 0.1, 8, 0.05),
      ...num(snap, 'plumeSeed', 'Seed', 0, 999, 1),
    }),
    Sirens: collapsed({
      ...plain(snap, 'sirenOn', 'On'),
      ...num(snap, 'sirenSpeed', 'Turns / s', 0, 4, 0.01),
      ...num(snap, 'sirenIntensity', 'Intensity', 0, 200, 0.5),
      ...num(snap, 'sirenDistance', 'Distance', 0.5, 20, 0.1),
      ...num(snap, 'sirenAngle', 'Beam Angle', 5, 80, 1),
      ...num(snap, 'sirenGlow', 'Bulb Glow', 0, 20, 0.1),
      ...plain(snap, 'sirenRed', 'Red'),
      ...plain(snap, 'sirenBlue', 'Blue'),
    }),
    Headlights: collapsed({
      ...plain(snap, 'headlightOn', 'On'),
      ...num(snap, 'headlightRate', 'Blinks / s', 0, 6, 0.01),
      ...num(snap, 'headlightIntensity', 'Intensity', 0, 40, 0.1),
      ...num(snap, 'headlightDistance', 'Distance', 0.5, 15, 0.1),
      ...num(snap, 'headlightGlow', 'Bulb Glow', 0, 20, 0.1),
      ...plain(snap, 'headlightColor', 'Color'),
    }),
    'Brake Lights': collapsed({
      ...plain(snap, 'brakeOn', 'On'),
      ...num(snap, 'brakeIntensity', 'Intensity', 0, 20, 0.1),
      ...num(snap, 'brakeDistance', 'Distance', 0.5, 10, 0.1),
      ...num(snap, 'brakeGlow', 'Bulb Glow', 0, 20, 0.1),
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
