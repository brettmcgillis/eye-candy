import { folder } from 'leva';

import { PLUMES } from './plumes';

export const SCENE_LABEL = 'Flying High';
export const CLOUDS = ['c1', 'c2', 'c3'];

const num = (snap, key, label, min, max, step) => ({
  [key]: { label, max, min, step, value: snap[key] },
});
const plain = (snap, key, label) => ({ [key]: { label, value: snap[key] } });
const collapsed = (schema) => folder(schema, { collapsed: true });

const xyz = (snap, prefix, range) => ({
  ...num(snap, `${prefix}PosX`, 'X', -range, range, 0.1),
  ...num(snap, `${prefix}PosY`, 'Y', -range, range, 0.1),
  ...num(snap, `${prefix}PosZ`, 'Z', -range * 1.5, range / 4, 0.1),
});

function cloudFolders(snap) {
  return Object.fromEntries(
    CLOUDS.map((c, i) => [
      `Cloud ${i + 1}`,
      collapsed({
        ...plain(snap, `${c}Visible`, 'Visible'),
        ...num(snap, `${c}Seed`, 'Shape', 0, 99, 1),
        ...num(snap, `${c}Width`, 'Width', 1, 30, 0.1),
        ...xyz(snap, c, 30),
      }),
    ])
  );
}

function plumeFolder(snap) {
  return collapsed({
    ...plain(snap, 'plumeVisible', 'Visible'),
    ...Object.fromEntries(
      PLUMES.flatMap(({ key, label }) =>
        Object.entries(plain(snap, key, label))
      )
    ),
    Flow: collapsed({
      ...num(snap, 'plumeCount', 'Puffs', 50, 3000, 10),
      ...num(snap, 'plumeLife', 'Life (s)', 1, 20, 0.1),
      ...num(snap, 'plumeSpeed', 'Speed', 0, 3, 0.01),
      ...num(snap, 'plumeEase', 'Ease', 0.3, 2, 0.01),
      ...num(snap, 'plumeSpreadStart', 'Spread Start', 0, 2, 0.01),
      ...num(snap, 'plumeSpreadEnd', 'Spread End', 0, 6, 0.01),
      ...num(snap, 'plumeSwirl', 'Swirl', 0, 12, 0.1),
      ...num(snap, 'plumeBillow', 'Billow', 0, 2, 0.01),
      ...num(snap, 'plumeBillowScale', 'Billow Scale', 0.05, 2, 0.01),
      ...num(snap, 'plumeSizeStart', 'Size Start', 0.05, 3, 0.01),
      ...num(snap, 'plumeSizeEnd', 'Size End', 0.2, 10, 0.05),
      ...num(snap, 'plumeFadeStart', 'Fade Start', 0, 1, 0.01),
    }),
    Fire: collapsed({
      ...num(snap, 'plumeFireShare', 'Burn Share', 0, 1, 0.01),
      ...num(snap, 'plumeSoot', 'Soot Mix', 0, 1, 0.01),
      ...plain(snap, 'plumeFireHot', 'Hot'),
      ...plain(snap, 'plumeFireMid', 'Mid'),
      ...plain(snap, 'plumeFireCool', 'Cool'),
      ...num(snap, 'plumeFireIntensity', 'Intensity', 0, 4, 0.01),
      ...plain(snap, 'plumeGlowColor', 'Glow Color'),
      ...num(snap, 'plumeGlow', 'Smoke Glow', 0, 2, 0.01),
      ...num(snap, 'plumeLightIntensity', 'Light Intensity', 0, 80, 0.1),
      ...num(snap, 'plumeLightDistance', 'Light Distance', 1, 40, 0.1),
    }),
    Paint: collapsed({
      ...plain(snap, 'plumeSmokeLit', 'Smoke Lit'),
      ...plain(snap, 'plumeSmokeShadow', 'Smoke Shadow'),
      ...plain(snap, 'plumeSmokeFaded', 'Smoke Faded'),
      ...num(snap, 'plumeThinning', 'Thinning', 0, 1, 0.01),
      ...num(snap, 'plumeRim', 'Edge Pigment', 0, 1, 0.01),
      ...num(snap, 'plumeEdgeJag', 'Lumpiness', 0, 0.6, 0.01),
      ...num(snap, 'plumeMottle', 'Mottle', 0, 1, 0.01),
      ...num(snap, 'plumeGrain', 'Granulation', 0, 0.4, 0.005),
    }),
  });
}

// The scene's own folders, after Presets, Camera and Lighting, seeded from
// the active preset's snapshot.
export default function sceneFolders(snap) {
  return {
    Scene: collapsed({
      ...plain(snap, 'background', 'Paper'),
      ...num(snap, 'paperGrain', 'Paper Tooth', 0, 0.3, 0.005),
      ...num(snap, 'paperWarmth', 'Paper Warmth', 0, 2, 0.01),
    }),
    Sky: collapsed({
      ...plain(snap, 'skyColor', 'Color'),
      ...num(snap, 'skyPosX', 'X', -20, 20, 0.5),
      ...num(snap, 'skyPosY', 'Y', -20, 20, 0.5),
      ...num(snap, 'skyPosZ', 'Z', -30, 0, 0.5),
      ...num(snap, 'skyWidth', 'Width', 10, 80, 1),
      ...num(snap, 'skyHeight', 'Height', 6, 50, 1),
      Shader: collapsed({
        ...num(snap, 'skyStrength', 'Strength', 0, 1.5, 0.01),
        ...num(snap, 'skyEdgeSoftness', 'Edge Softness', 0.02, 0.4, 0.01),
        ...num(snap, 'skyEdgeDarkening', 'Edge Darkening', 0, 2, 0.01),
        ...num(snap, 'skyWarpStrength', 'Warp', 0, 0.3, 0.01),
        ...num(snap, 'skyBrushStrength', 'Brush', 0, 3, 0.1),
        ...num(snap, 'skyBleedAmount', 'Bleed', 0, 0.5, 0.01),
        ...num(snap, 'skyPoolingStrength', 'Pooling', 0, 2, 0.1),
        ...num(snap, 'skyGrainAmount', 'Grain', 0, 0.1, 0.005),
      }),
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
    Moon: collapsed({
      ...plain(snap, 'moonVisible', 'Visible'),
      ...num(snap, 'moonPosX', 'X', -20, 20, 0.1),
      ...num(snap, 'moonPosY', 'Y', -20, 20, 0.1),
      ...num(snap, 'moonPosZ', 'Z', -20, 0, 0.1),
      ...num(snap, 'moonScale', 'Scale', 0.1, 10, 0.1),
      ...plain(snap, 'moonColor', 'Color'),
      ...plain(snap, 'moonEmissive', 'Emissive'),
      ...num(snap, 'moonEmissiveIntensity', 'Emissive Intensity', 0, 4, 0.05),
      ...num(snap, 'moonMetalness', 'Metalness', 0, 1, 0.01),
      ...num(snap, 'moonRoughness', 'Roughness', 0, 1, 0.01),
    }),
    Clouds: collapsed({
      ...plain(snap, 'cloudColor', 'Color'),
      ...plain(snap, 'cloudShadow', 'Shadow'),
      ...num(snap, 'cloudRim', 'Edge Pigment', 0, 1, 0.01),
      ...num(snap, 'cloudEdgeJag', 'Lumpiness', 0, 0.6, 0.01),
      ...num(snap, 'cloudMottle', 'Mottle', 0, 1, 0.01),
      ...cloudFolders(snap),
    }),
    Bloom: collapsed({
      ...plain(snap, 'bloomEnabled', 'Enabled'),
      ...num(snap, 'bloomThreshold', 'Threshold', 0, 3, 0.01),
      ...num(snap, 'bloomStrength', 'Strength', 0, 3, 0.01),
      ...num(snap, 'bloomRadius', 'Radius', 0, 1, 0.01),
    }),
  };
}
