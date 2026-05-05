import { folder, useControls } from 'leva';

export default function useSceneControls() {
  return useControls(
    'LoGlow',
    {
      Background: folder(
        {
          backgroundColor: { label: 'Color', value: '#202030' },
          Fog: folder(
            {
              fogColor: { label: 'Color', value: '#202030' },
              fogNear: { label: 'Near', value: 10 },
              fogFar: { label: 'Far', value: 25 },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
      Lighting: folder(
        {
          Ambient: folder(
            {
              ambientColor: { label: 'Color', value: '#ffffff' },
              ambientIntensity: {
                label: 'Intensity',
                value: 0.35,
                min: 0,
                max: 3,
              },
            },
            { collapsed: true }
          ),
          Key: folder(
            {
              keyColor: { label: 'Key Color', value: '#ffffff' },
              keyIntensity: {
                label: 'Key Intensity',
                value: 1.1,
                min: 0,
                max: 5,
              },
              keyPosition: {
                label: 'Position',
                value: { x: 2.5, y: 2, z: 4 },
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
      Bloom: folder(
        {
          bloomThreshold: {
            label: 'Threshold',
            value: 0.1,
            min: 0,
            max: 10,
          },
          bloomStrength: {
            label: 'Strength',
            value: 0.2,
            min: 0,
            max: 10,
          },
          bloomRadius: {
            label: 'Radius',
            value: 0.2,
            min: 0,
            max: 10,
          },
        },
        { collapsed: true }
      ),
      Sparkles: folder(
        {
          sparkleCount: { label: 'Count', value: 100, min: 10, max: 500 },
          sparkleSpeed: { label: 'Speed', value: 0.71, min: 0, max: 10 },
          sparkleOpactity: { label: 'Opacity', value: 0.7, min: 0, max: 1 },
          sparkleColor: { label: 'Color', value: '#FFFFFF' },
          sparkleSize: { label: 'Size', value: 0.7, min: 0.1, max: 10 },
          sparkleScale: { label: 'Scale', value: 3.6, min: 0, max: 10 },
          sparkleNoise: { label: 'Noise', value: 1, min: 0, max: 10 },
        },
        { collapsed: true }
      ),
      Logo: folder(
        {
          Bret: folder(
            {
              bretPosition: {
                label: 'Position',
                value: { x: 0, y: 0, z: 0 },
              },
              bretRotation: {
                label: 'Rotation',
                value: { x: 0, y: 0, z: 0 },
              },
              bretPressDepth: {
                label: 'Depth',
                value: 0.012,
                min: 0,
                max: 0.1,
                step: 0.001,
              },
              'Inner Color': folder(
                {
                  bretInnerColor: { label: 'Color', value: '#FF0000' },
                  bretInnerColorEmissive: {
                    label: 'Emissive',
                    value: true,
                  },
                  bretInnerColorEmissiveIntensity: {
                    label: 'Intensity',
                    value: 5,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                },
                { collapsed: true }
              ),
              'Outer Color': folder(
                {
                  bretOuterColor: { label: 'Color', value: '#000000' },
                  bretOuterColorEmissive: {
                    label: 'Emissive',
                    value: false,
                  },
                  bretOuterColorEmissiveIntensity: {
                    label: 'Intensity',
                    value: 0,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),
          Reversal: folder(
            {
              reversalPosition: {
                label: 'Position',
                value: { x: 0.9, y: -0.4, z: 0 },
              },
              reversalRotation: {
                label: 'Rotation',
                value: { x: 0, y: 0, z: 0 },
              },
              reversalPressDepth: {
                label: 'Depth',
                value: 0.015,
                min: 0,
                max: 0.1,
                step: 0.001,
              },
              'Inner Color': folder(
                {
                  reversalInnerColor: { label: 'Color', value: '#FF0000' },
                  reversalInnerColorEmissive: {
                    label: 'Emissive',
                    value: true,
                  },
                  reversalInnerColorEmissiveIntensity: {
                    label: 'Intensity',
                    value: 5,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                },
                { collapsed: true }
              ),
              'Outer Color': folder(
                {
                  reversalOuterColor: { label: 'Color', value: '#000000' },
                  reversalOuterColorEmissive: {
                    label: 'Emissive',
                    value: false,
                  },
                  reversalOuterColorEmissiveIntensity: {
                    label: 'Intensity',
                    value: 0,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),
          Neon: folder(
            {
              enableNeonFlicker: { label: 'Flicker', value: true },
              neonFlickerIntensity: {
                label: 'Intensity',
                value: 2,
                min: 0.1,
                max: 10,
              },
              neonFlickerFrequency: {
                label: 'Frequency',
                value: 10,
                min: 0.1,
                max: 10,
              },
            },
            { collapsed: true }
          ),
          Flip: folder(
            {
              flip: { label: 'Enabled', value: true },
              flipDuration: {
                label: 'Duration',
                value: 2,
                min: 1,
                max: 2,
                step: 0.01,
              },
              flipDelay: {
                label: 'Delay',
                value: 4,
                min: 0,
                max: 10,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
          Float: folder(
            {
              float: { label: 'Enabled', value: true },
              floatSpeed: {
                label: 'Speed',
                value: 1,
                min: 0,
                max: 10,
                step: 0.01,
              },
              floatIntensity: {
                label: 'Intensity',
                value: 0.05,
                min: 0,
                max: 1,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
          Spin: folder(
            {
              spin: { label: 'Enabled', value: true },
              spinRotation: {
                label: 'Rotation',
                value: 33,
                min: 0,
                max: 360,
                step: 1,
              },
              spinSpeed: {
                label: 'Speed',
                value: 0.4,
                min: 0,
                max: 1,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
