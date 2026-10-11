import { folder } from 'leva';

import {
  BLACK_HOLE_VARIANT_OPTIONS,
  LEGACY_CONTROL_KEYS,
  SINGULARITY_CONTROL_KEYS,
  WEBGPU_CONTROL_KEYS,
  buildLegacyControls,
  buildSingularityControls,
  buildWebGPUControls,
} from '@modules/blackHole';

const COLLAPSED = { collapsed: true };

export const BLACK_HOLE_KEYS = [
  'blackHoleVariant',
  'blackHolePosition',
  'metricWorldScale',
  'blackHoleLightEnabled',
  'blackHoleLightIntensity',
  'blackHoleLightVividness',
  'blackHoleLightColor',
  ...LEGACY_CONTROL_KEYS,
  ...WEBGPU_CONTROL_KEYS,
  ...SINGULARITY_CONTROL_KEYS,
];

export default function getBlackHoleControls(p, folderPath) {
  return folder(
    {
      blackHoleVariant: {
        label: 'Variation',
        value: p.blackHoleVariant,
        options: BLACK_HOLE_VARIANT_OPTIONS,
      },
      blackHolePosition: {
        label: 'Position',
        value: p.blackHolePosition,
        step: 0.5,
      },
      metricWorldScale: {
        label: 'Size',
        value: p.metricWorldScale,
        min: 1,
        max: 120,
        step: 0.5,
      },
      Light: folder(
        {
          blackHoleLightEnabled: {
            label: 'Lights Ghost',
            value: p.blackHoleLightEnabled,
          },
          blackHoleLightIntensity: {
            label: 'Intensity',
            value: p.blackHoleLightIntensity,
            min: 0,
            max: 20,
            step: 0.01,
          },
          blackHoleLightVividness: {
            label: 'Vividness',
            value: p.blackHoleLightVividness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          blackHoleLightColor: {
            label: 'Color (non-chromatic disks)',
            value: p.blackHoleLightColor,
          },
        },
        COLLAPSED
      ),
      Legacy: folder(buildLegacyControls(p, `${folderPath}.Legacy`), COLLAPSED),
      WebGPU: folder(buildWebGPUControls(p), COLLAPSED),
      Singularity: folder(buildSingularityControls(p), COLLAPSED),
    },
    COLLAPSED
  );
}
