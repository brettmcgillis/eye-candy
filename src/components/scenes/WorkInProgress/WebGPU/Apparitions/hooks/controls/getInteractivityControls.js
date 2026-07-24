import { button, folder } from 'leva';

export default function getInteractivityControls(
  snapshot,
  { toggleInteractionMode }
) {
  return folder(
    {
      interactivityEnabled: {
        label: 'Enabled',
        value: snapshot.interactivityEnabled,
      },
      interactionMode: {
        label: 'Global Polarity',
        options: { Attract: 'attract', Repel: 'repel' },
        value: snapshot.interactionMode,
      },
      enableGestureToggle: {
        label: 'Gesture Toggle',
        value: snapshot.enableGestureToggle,
      },
      fieldMode: {
        label: 'Field Mode',
        options: { Positive: 'positive', Negative: 'negative', Auto: 'auto' },
        value: snapshot.fieldMode,
      },
      fieldAutoRate: {
        label: 'Auto Phase Rate',
        value: snapshot.fieldAutoRate,
        min: 0.01,
        max: 0.3,
        step: 0.01,
      },
      outlineStrength: {
        label: 'Outline Attract',
        value: snapshot.outlineStrength,
        min: 0,
        max: 8,
        step: 0.1,
      },
      coreRepelStrength: {
        label: 'Core Repel',
        value: snapshot.coreRepelStrength,
        min: 0,
        max: 6,
        step: 0.1,
      },
      coreRepelRadius: {
        label: 'Core Radius',
        value: snapshot.coreRepelRadius,
        min: 2,
        max: 24,
        step: 0.5,
      },
      attractorRadius: {
        label: 'Radius',
        value: snapshot.attractorRadius,
        min: 2,
        max: 20,
        step: 0.25,
      },
      landmarksPerPerson: {
        label: 'Landmarks/Person',
        value: snapshot.landmarksPerPerson,
        min: 2,
        max: 13,
        step: 1,
      },
      Motion: folder(
        {
          motionToNoise: {
            label: 'Motion → Noise',
            value: snapshot.motionToNoise,
            min: 0,
            max: 2,
            step: 0.05,
          },
          motionToSpeed: {
            label: 'Motion → Speed',
            value: snapshot.motionToSpeed,
            min: 0,
            max: 2,
            step: 0.05,
          },
          motionToCohesion: {
            label: 'Motion → Cohesion',
            value: snapshot.motionToCohesion,
            min: 0,
            max: 2,
            step: 0.05,
          },
          motionSensitivity: {
            label: 'Sensitivity',
            value: snapshot.motionSensitivity,
            min: 0.1,
            max: 4,
            step: 0.1,
          },
          agitateRate: {
            label: 'Agitate Rate',
            value: snapshot.agitateRate,
            min: 0.5,
            max: 12,
            step: 0.5,
          },
          calmRate: {
            label: 'Calm Rate',
            value: snapshot.calmRate,
            min: 0.1,
            max: 4,
            step: 0.1,
          },
          armsToGravity: {
            label: 'Arms → Gravity',
            value: snapshot.armsToGravity,
            min: 0,
            max: 2,
            step: 0.05,
          },
          impulseGain: {
            label: 'Impulse Gain',
            value: snapshot.impulseGain,
            min: 0,
            max: 3,
            step: 0.05,
          },
          impulseThreshold: {
            label: 'Impulse Threshold',
            value: snapshot.impulseThreshold,
            min: 0.1,
            max: 3,
            step: 0.05,
          },
          impulseLead: {
            label: 'Impulse Lead',
            value: snapshot.impulseLead,
            min: 0,
            max: 16,
            step: 0.5,
          },
          impulseMax: {
            label: 'Impulse Max',
            value: snapshot.impulseMax,
            min: 1,
            max: 10,
            step: 0.5,
          },
        },
        { collapsed: true }
      ),
      Colour: folder(
        {
          perPersonHue: {
            label: 'Per-Person Hue',
            value: snapshot.perPersonHue,
          },
          hueBase: {
            label: 'Hue Base',
            value: snapshot.hueBase,
            min: 0,
            max: 1,
            step: 0.01,
          },
          hueSpread: {
            label: 'Hue Spread',
            value: snapshot.hueSpread,
            min: 0,
            max: 0.5,
            step: 0.01,
          },
          hueBlend: {
            label: 'Hue Blend',
            value: snapshot.hueBlend,
            min: 0,
            max: 4,
            step: 0.05,
          },
        },
        { collapsed: true }
      ),
      Calibration: folder(
        {
          xScale: {
            label: 'X Scale',
            value: snapshot.xScale,
            min: 2,
            max: 40,
            step: 0.5,
          },
          yScale: {
            label: 'Y Scale',
            value: snapshot.yScale,
            min: -40,
            max: -2,
            step: 0.5,
          },
          zScale: {
            label: 'Z Scale',
            value: snapshot.zScale,
            min: 2,
            max: 40,
            step: 0.5,
          },
          yOffset: {
            label: 'Y Offset',
            value: snapshot.yOffset,
            min: 8,
            max: 52,
            step: 0.5,
          },
          zOffset: {
            label: 'Z Offset',
            value: snapshot.zOffset,
            min: 8,
            max: 52,
            step: 0.5,
          },
        },
        { collapsed: true }
      ),
      toggleMode: button(toggleInteractionMode),
    },
    { collapsed: true }
  );
}
