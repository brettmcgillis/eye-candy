import { folder } from 'leva';

import { ROLE_MODE_OPTIONS } from '../utils/roleModes';

// One level of folders, five of them, each a thing you would sit down to tune
// in one go. Sizes are fractions of field height so nothing needs retuning
// when the window changes.
const shape = (p) =>
  folder(
    {
      particleCount: {
        label: 'Count',
        max: 32,
        min: 2,
        step: 1,
        value: p.particleCount,
      },
      particleRadius: {
        label: 'Radius',
        max: 0.08,
        min: 0.002,
        step: 0.001,
        value: p.particleRadius,
      },
      arcSpan: {
        label: 'Arc Span (deg)',
        max: 300,
        min: 0,
        step: 1,
        value: p.arcSpan,
      },
      arcSpread: {
        label: 'Arc Spread',
        max: 1.2,
        min: 0.1,
        step: 0.02,
        value: p.arcSpread,
      },
      seed: { label: 'Seed', max: 999, min: 1, step: 1, value: p.seed },
    },
    { collapsed: true }
  );

const motion = (p) =>
  folder(
    {
      speed: { label: 'Speed', max: 0.6, min: 0, step: 0.005, value: p.speed },
      flowScale: {
        label: 'Curl Scale',
        max: 8,
        min: 0.2,
        step: 0.1,
        value: p.flowScale,
      },
      separation: {
        label: 'Keep Apart',
        max: 1,
        min: 0,
        step: 0.05,
        value: p.separation,
      },
      pointerStrength: {
        label: 'Cursor Pull',
        max: 4,
        min: -4,
        step: 0.05,
        value: p.pointerStrength,
      },
      pointerRadius: {
        label: 'Cursor Reach',
        max: 1.5,
        min: 0.05,
        step: 0.05,
        value: p.pointerRadius,
      },
    },
    { collapsed: true }
  );

const roles = (p) =>
  folder(
    {
      roleMode: {
        label: 'Mode',
        options: ROLE_MODE_OPTIONS,
        value: p.roleMode,
      },
      dieSpeed: {
        label: 'Die Speed (Age)',
        max: 0.5,
        min: 0.01,
        step: 0.005,
        value: p.dieSpeed,
      },
      oscillatePeriod: {
        label: 'Period (Oscillate)',
        max: 30,
        min: 1,
        step: 0.5,
        value: p.oscillatePeriod,
      },
    },
    { collapsed: true }
  );

const light = (p) =>
  folder(
    {
      lightStrength: {
        label: 'Light Output',
        max: 6,
        min: 0,
        step: 0.05,
        value: p.lightStrength,
      },
      exposure: {
        label: 'Exposure',
        max: 6,
        min: 0.1,
        step: 0.05,
        value: p.exposure,
      },
      ambient: {
        label: 'Ambient Floor',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.ambient,
      },
      arcLights: {
        label: 'Arc Light Samples',
        max: 24,
        min: 1,
        step: 1,
        value: p.arcLights,
      },
      shadowRays: {
        label: 'Shadow Rays',
        options: { 256: 256, 512: 512, 1024: 1024, 2048: 2048 },
        value: p.shadowRays,
      },
      shadowSoftness: {
        label: 'Shadow Softness',
        max: 0.12,
        min: 0.002,
        step: 0.002,
        value: p.shadowSoftness,
      },
    },
    { collapsed: true }
  );

const colour = (p) =>
  folder(
    {
      fieldColor: { label: 'Field', value: p.fieldColor },
      matchBrightness: {
        label: 'Match Brightness',
        max: 1,
        min: 0,
        step: 0.05,
        value: p.matchBrightness,
      },
      bodyTint: { label: 'Occluding', value: p.bodyTint },
      colorA: { label: 'Emitting A', value: p.colorA },
      colorB: { label: 'Emitting B', value: p.colorB },
      colorC: { label: 'Emitting C', value: p.colorC },
      colorD: { label: 'Emitting D', value: p.colorD },
    },
    { collapsed: true }
  );

export default function getSceneControls(p) {
  return {
    Particles: shape(p),
    Motion: motion(p),
    Roles: roles(p),
    Light: light(p),
    Colour: colour(p),
  };
}
