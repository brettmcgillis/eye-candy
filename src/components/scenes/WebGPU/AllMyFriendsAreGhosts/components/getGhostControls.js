import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export const GHOST_KEYS = [
  'ghostPosition',
  'ghostRotationY',
  'ghostTiltBack',
  'ghostScale',
  'ghostColor',
  'ghostEyeColor',
  'ghostEyeIntensity',
  'ghostGlowColor',
  'ghostOuterGlow',
  'ghostInnerGlow',
  'ghostGroundLightIntensity',
  'ghostBobAmplitude',
  'ghostBobSpeed',
  'ghostTilt',
  'ghostBaseWind',
  'ghostWindBoost',
  'ghostWindStrength',
  'ghostWindAngle',
  'ghostWindGust',
  'ghostClothSegments',
];

export default function getGhostControls(p) {
  return folder(
    {
      ghostPosition: { label: 'Position', value: p.ghostPosition, step: 0.01 },
      ghostRotationY: {
        label: 'Facing (°)',
        value: p.ghostRotationY,
        min: -180,
        max: 180,
        step: 1,
      },
      ghostTiltBack: {
        label: 'Tilt Back (°)',
        value: p.ghostTiltBack,
        min: -45,
        max: 75,
        step: 1,
      },
      ghostScale: {
        label: 'Scale',
        value: p.ghostScale,
        min: 0.2,
        max: 10,
        step: 0.01,
      },
      Look: folder(
        {
          ghostColor: { label: 'Cloth', value: p.ghostColor },
          ghostEyeColor: { label: 'Eyes', value: p.ghostEyeColor },
          ghostEyeIntensity: {
            label: 'Eye Glow',
            value: p.ghostEyeIntensity,
            min: 0,
            max: 10,
            step: 0.01,
          },
          ghostGlowColor: { label: 'Glow', value: p.ghostGlowColor },
          ghostOuterGlow: {
            label: 'Outer Glow',
            value: p.ghostOuterGlow,
            min: 0,
            max: 3,
            step: 0.01,
          },
          ghostInnerGlow: {
            label: 'Inner Glow',
            value: p.ghostInnerGlow,
            min: 0,
            max: 3,
            step: 0.01,
          },
          ghostGroundLightIntensity: {
            label: 'Ground Light',
            value: p.ghostGroundLightIntensity,
            min: 0,
            max: 20,
            step: 0.1,
          },
          ghostClothSegments: {
            label: 'Cloth Segments',
            value: p.ghostClothSegments,
            min: 12,
            max: 48,
            step: 1,
          },
        },
        COLLAPSED
      ),
      Motion: folder(
        {
          ghostBobAmplitude: {
            label: 'Bob',
            value: p.ghostBobAmplitude,
            min: 0,
            max: 0.2,
            step: 0.001,
          },
          ghostBobSpeed: {
            label: 'Bob Speed',
            value: p.ghostBobSpeed,
            min: 0,
            max: 3,
            step: 0.01,
          },
          ghostTilt: {
            label: 'Lean Into Wind',
            value: p.ghostTilt,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        COLLAPSED
      ),
      Wind: folder(
        {
          ghostWindStrength: {
            label: 'Strength',
            value: p.ghostWindStrength,
            min: 0,
            max: 1.5,
            step: 0.01,
          },
          ghostWindAngle: {
            label: 'Heading (°)',
            value: p.ghostWindAngle,
            min: -180,
            max: 180,
            step: 1,
          },
          ghostWindGust: {
            label: 'Gusts',
            value: p.ghostWindGust,
            min: 0,
            max: 1,
            step: 0.01,
          },
          ghostBaseWind: {
            label: 'Base Flutter',
            value: p.ghostBaseWind,
            min: 0,
            max: 2,
            step: 0.01,
          },
          ghostWindBoost: {
            label: 'Wind Boost',
            value: p.ghostWindBoost,
            min: 0,
            max: 8,
            step: 0.05,
          },
        },
        COLLAPSED
      ),
    },
    COLLAPSED
  );
}
