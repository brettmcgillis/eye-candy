import { folder } from 'leva';

export default function getLogoControls(p) {
  return folder(
    {
      Bret: folder(
        {
          bretPosition: { label: 'Position', value: p.bretPosition },
          bretRotation: { label: 'Rotation', value: p.bretRotation },
          bretPressDepth: {
            label: 'Depth',
            value: p.bretPressDepth,
            min: 0,
            max: 0.1,
            step: 0.001,
          },
          'Inner Color': folder(
            {
              bretInnerColor: { label: 'Color', value: p.bretInnerColor },
              bretInnerColorEmissive: {
                label: 'Emissive',
                value: p.bretInnerColorEmissive,
              },
              bretInnerColorEmissiveIntensity: {
                label: 'Intensity',
                value: p.bretInnerColorEmissiveIntensity,
                min: 0,
                max: 10,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
          'Outer Color': folder(
            {
              bretOuterColor: { label: 'Color', value: p.bretOuterColor },
              bretOuterColorEmissive: {
                label: 'Emissive',
                value: p.bretOuterColorEmissive,
              },
              bretOuterColorEmissiveIntensity: {
                label: 'Intensity',
                value: p.bretOuterColorEmissiveIntensity,
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
          reversalPosition: { label: 'Position', value: p.reversalPosition },
          reversalRotation: { label: 'Rotation', value: p.reversalRotation },
          reversalPressDepth: {
            label: 'Depth',
            value: p.reversalPressDepth,
            min: 0,
            max: 0.1,
            step: 0.001,
          },
          'Inner Color': folder(
            {
              reversalInnerColor: {
                label: 'Color',
                value: p.reversalInnerColor,
              },
              reversalInnerColorEmissive: {
                label: 'Emissive',
                value: p.reversalInnerColorEmissive,
              },
              reversalInnerColorEmissiveIntensity: {
                label: 'Intensity',
                value: p.reversalInnerColorEmissiveIntensity,
                min: 0,
                max: 10,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
          'Outer Color': folder(
            {
              reversalOuterColor: {
                label: 'Color',
                value: p.reversalOuterColor,
              },
              reversalOuterColorEmissive: {
                label: 'Emissive',
                value: p.reversalOuterColorEmissive,
              },
              reversalOuterColorEmissiveIntensity: {
                label: 'Intensity',
                value: p.reversalOuterColorEmissiveIntensity,
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
          enableNeonFlicker: { label: 'Flicker', value: p.enableNeonFlicker },
          neonFlickerIntensity: {
            label: 'Intensity',
            value: p.neonFlickerIntensity,
            min: 0.1,
            max: 10,
          },
          neonFlickerFrequency: {
            label: 'Frequency',
            value: p.neonFlickerFrequency,
            min: 0.1,
            max: 10,
          },
        },
        { collapsed: true }
      ),
      Flip: folder(
        {
          flip: { label: 'Enabled', value: p.flip },
          flipDuration: {
            label: 'Duration',
            value: p.flipDuration,
            min: 1,
            max: 2,
            step: 0.01,
          },
          flipDelay: {
            label: 'Delay',
            value: p.flipDelay,
            min: 0,
            max: 10,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Float: folder(
        {
          float: { label: 'Enabled', value: p.float },
          floatSpeed: {
            label: 'Speed',
            value: p.floatSpeed,
            min: 0,
            max: 10,
            step: 0.01,
          },
          floatIntensity: {
            label: 'Intensity',
            value: p.floatIntensity,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Spin: folder(
        {
          spin: { label: 'Enabled', value: p.spin },
          spinRotation: {
            label: 'Rotation',
            value: p.spinRotation,
            min: 0,
            max: 360,
            step: 1,
          },
          spinSpeed: {
            label: 'Speed',
            value: p.spinSpeed,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      // Differential growth on the inner meshes (port of
      // ~/dev/examples/260308_DifferentialGrowth). Simulation = the sim's own
      // tuning; Animation = the driver that records growth then scrubs the
      // snapshot timeline (breathe / surge / grow / manual); Shading = the
      // reference's curvature/displacement gradient look.
      Growth: folder(
        {
          growth: { label: 'Enabled', value: p.growth },
          Simulation: folder(
            {
              growthStep: {
                label: 'Growth Step',
                value: p.growthStep,
                min: 0.05,
                max: 2,
                step: 0.01,
              },
              growthTargetEdge: {
                label: 'Target Edge',
                value: p.growthTargetEdge,
                min: 0.02,
                max: 0.3,
                step: 0.005,
              },
              growthSplit: {
                label: 'Split Threshold',
                value: p.growthSplit,
                min: 1.1,
                max: 2.5,
                step: 0.01,
              },
              growthRepulsion: {
                label: 'Repulsion',
                value: p.growthRepulsion,
                min: 0,
                max: 1,
                step: 0.01,
              },
              growthSmoothing: {
                label: 'Smoothing',
                value: p.growthSmoothing,
                min: 0,
                max: 1,
                step: 0.01,
              },
              growthRetention: {
                label: 'Shape Retention',
                value: p.growthRetention,
                min: 0,
                max: 0.5,
                step: 0.01,
              },
              growthMaxVertices: {
                label: 'Max Vertices',
                value: p.growthMaxVertices,
                min: 10000,
                max: 120000,
                step: 1000,
              },
              growthSpeed: {
                label: 'Sim Speed',
                value: p.growthSpeed,
                min: 0.1,
                max: 3,
                step: 0.01,
              },
              growthSeed: {
                label: 'Seed',
                value: p.growthSeed,
                min: 0,
                max: 999999,
                step: 1,
              },
              growthSeedInfluence: {
                label: 'Seed Influence',
                value: p.growthSeedInfluence,
                min: 0,
                max: 1,
                step: 0.01,
              },
              growthGradientBlur: {
                label: 'Gradient Blur',
                value: p.growthGradientBlur,
                min: 0,
                max: 1,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
          Animation: folder(
            {
              growthMode: {
                label: 'Mode',
                value: p.growthMode,
                options: ['breathe', 'surge', 'grow', 'manual'],
              },
              growthReach: {
                label: 'Reach',
                value: p.growthReach,
                min: 1,
                max: 160,
                step: 1,
              },
              growthTempo: {
                label: 'Tempo',
                value: p.growthTempo,
                min: 0.5,
                max: 60,
                step: 0.5,
              },
              growthScrub: {
                label: 'Scrub',
                value: p.growthScrub,
                min: 0,
                max: 1,
                step: 0.01,
              },
              growthPhase: {
                label: 'Phase',
                value: p.growthPhase,
                min: 0,
                max: 1,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
          Shading: folder(
            {
              growthShadingMode: {
                label: 'Mode',
                value: p.growthShadingMode,
                options: ['neon', 'curvature', 'displacement'],
              },
              growthGradientStart: {
                label: 'Gradient Start',
                value: p.growthGradientStart,
              },
              growthGradientEnd: {
                label: 'Gradient End',
                value: p.growthGradientEnd,
              },
              growthContrast: {
                label: 'Contrast',
                value: p.growthContrast,
                min: 0.2,
                max: 3,
                step: 0.01,
              },
              growthBias: {
                label: 'Bias',
                value: p.growthBias,
                min: -1,
                max: 1,
                step: 0.01,
              },
              growthFresnel: {
                label: 'Fresnel',
                value: p.growthFresnel,
                min: 0,
                max: 2,
                step: 0.01,
              },
              growthSpecular: {
                label: 'Specular',
                value: p.growthSpecular,
                min: 0,
                max: 2,
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
