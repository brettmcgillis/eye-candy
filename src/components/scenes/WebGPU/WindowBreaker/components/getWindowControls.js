import { folder } from 'leva';

export default function getWindowControls(preset) {
  return folder(
    {
      windowsEnabled: { label: 'Enabled', value: preset.windowsEnabled },
      winTargetWidth: {
        label: 'Target Width',
        min: 0.4,
        max: 6,
        step: 0.05,
        value: preset.winTargetWidth,
      },
      winTargetHeight: {
        label: 'Target Height',
        min: 0.4,
        max: 6,
        step: 0.05,
        value: preset.winTargetHeight,
      },
      winFill: {
        label: 'Unit Fill',
        min: 0.3,
        max: 1,
        step: 0.01,
        value: preset.winFill,
      },
      winInset: {
        label: 'Inset',
        min: -0.5,
        max: 0.5,
        step: 0.01,
        value: preset.winInset,
      },
      Appearance: folder(
        {
          glassColor: { label: 'Glass', value: preset.glassColor },
          glassOpacity: {
            label: 'Glass Opacity',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.glassOpacity,
          },
          frameColor: { label: 'Frame', value: preset.frameColor },
          frameThickness: {
            label: 'Frame Bar',
            min: 0.02,
            max: 0.5,
            step: 0.01,
            value: preset.frameThickness,
          },
          frameDepth: {
            label: 'Frame Depth',
            min: 0.02,
            max: 0.5,
            step: 0.01,
            value: preset.frameDepth,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
