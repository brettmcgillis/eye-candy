import { folder } from 'leva';

import { PALETTE_NAMES, PALETTE_NONE } from '@utils/gradientPalette';

import { ROLE_MODE_OPTIONS } from './roleModes';

// The controls every radiant scene shares, as plain schema entries rather than
// folders, so a scene can add what only its renderer has beside them. Same
// keys in every scene means one preset reads the same in 2D and 3D.

export function particleControls(p) {
  return {
    particleCount: {
      label: 'Count',
      max: 48,
      min: 0,
      step: 1,
      value: p.particleCount,
    },
    particleRadius: {
      label: 'Radius',
      max: 0.1,
      min: 0.002,
      step: 0.001,
      value: p.particleRadius,
    },
    seed: { label: 'Seed', max: 999, min: 1, step: 1, value: p.seed },
  };
}

export function motionControls(p, { ringExtras = {} } = {}) {
  return {
    layout: {
      label: 'Layout',
      options: { Orbits: 'orbits', Wander: 'wander' },
      value: p.layout,
    },
    Orbits: folder(
      {
        ringCount: {
          label: 'Rings',
          max: 8,
          min: 1,
          step: 1,
          value: p.ringCount,
        },
        ringDots: {
          label: 'Per Ring',
          max: 12,
          min: 1,
          step: 1,
          value: p.ringDots,
        },
        ringRadius: {
          label: 'Ring Radius',
          max: 1,
          min: 0.02,
          step: 0.005,
          value: p.ringRadius,
        },
        ringOffset: {
          label: 'Ring Offset',
          max: 0.5,
          min: 0,
          step: 0.005,
          value: p.ringOffset,
        },
        ringGap: {
          label: 'Centre Gap',
          max: 8,
          min: 0,
          step: 0.1,
          value: p.ringGap,
        },
        ringTwist: {
          label: 'Twist (deg)',
          max: 180,
          min: 0,
          step: 1,
          value: p.ringTwist,
        },
        ...ringExtras,
        ringSpeed: {
          label: 'Orbit Speed',
          max: 3,
          min: -3,
          step: 0.05,
          value: p.ringSpeed,
        },
      },
      { collapsed: false }
    ),
    speed: { label: 'Speed', max: 0.6, min: 0, step: 0.005, value: p.speed },
    flowScale: {
      label: 'Curl Scale',
      max: 8,
      min: 0.2,
      step: 0.1,
      value: p.flowScale,
    },
    edgeMargin: {
      label: 'Edge Margin',
      max: 0.5,
      min: 0,
      step: 0.01,
      value: p.edgeMargin,
    },
    separation: {
      label: 'Keep Apart',
      max: 2,
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
  };
}

// The mix of the three roles, then the schedule that moves a body between the
// two it cycles through. Each modality's own parameters sit in a subfolder
// named for it, so adding a fourth mode stops adding an orphan slider whose
// label has to carry the mode name in brackets.
export function roleControls(p) {
  return {
    refractShare: {
      label: 'Refracting Share',
      max: 1,
      min: 0,
      step: 0.02,
      value: p.refractShare,
    },
    roleMode: {
      label: 'Emit / Occlude',
      options: ROLE_MODE_OPTIONS,
      value: p.roleMode,
    },
    'Age & Respawn': folder(
      {
        dieSpeed: {
          label: 'Die Speed',
          max: 0.5,
          min: 0.01,
          step: 0.005,
          value: p.dieSpeed,
        },
      },
      { collapsed: true }
    ),
    'Slow Oscillation': folder(
      {
        oscillatePeriod: {
          label: 'Period',
          max: 30,
          min: 1,
          step: 0.5,
          value: p.oscillatePeriod,
        },
      },
      { collapsed: true }
    ),
  };
}

export function glassControls(p) {
  return {
    refractIor: {
      label: 'Refraction',
      max: 2.2,
      min: 1.02,
      step: 0.01,
      value: p.refractIor,
    },
    refractDepth: {
      label: 'Depth',
      max: 8,
      min: 0.2,
      step: 0.1,
      value: p.refractDepth,
    },
    refractReflect: {
      label: 'Reflection',
      max: 1,
      min: 0,
      step: 0.02,
      value: p.refractReflect,
    },
    refractDispersion: {
      label: 'Dispersion',
      max: 0.3,
      min: 0,
      step: 0.005,
      value: p.refractDispersion,
    },
  };
}

export function lightControls(p) {
  return {
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
    shadowRays: {
      label: 'Shadow Rays',
      options: { 256: 256, 512: 512, 1024: 1024, 2048: 2048 },
      value: p.shadowRays,
    },
    shadowSoftness: {
      label: 'Shadow Softness',
      max: 0.12,
      min: 0,
      step: 0.002,
      value: p.shadowSoftness,
    },
  };
}

export function lookControls(p) {
  return {
    fieldColor: { label: 'Field', value: p.fieldColor },
    bodyTint: { label: 'Occluding', value: p.bodyTint },
    paletteName: {
      label: 'Emitting Palette',
      options: [PALETTE_NONE, ...PALETTE_NAMES],
      value: p.paletteName,
    },
    paletteExact: { label: 'Exact Colors', value: p.paletteExact },
    colorA: { label: 'Emitting A', value: p.colorA },
    colorB: { label: 'Emitting B', value: p.colorB },
    colorC: { label: 'Emitting C', value: p.colorC },
    colorD: { label: 'Emitting D', value: p.colorD },
    matchBrightness: {
      label: 'Match Brightness',
      max: 1,
      min: 0,
      step: 0.05,
      value: p.matchBrightness,
    },
  };
}
