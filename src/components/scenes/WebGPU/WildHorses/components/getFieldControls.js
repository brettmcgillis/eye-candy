import { folder } from 'leva';

export default function getFieldControls(defaultValues = {}) {
  return folder(
    {
      terrainExtent: { max: 120, min: 20, step: 1, value: 55 },
      terrainNoiseScale: { max: 8, min: 0.5, step: 0.1, value: 2.5 },
      terrainMaxHeight: { max: 6, min: 0, step: 0.05, value: 1 },
      terrainColor: { value: '#62985a' },
      terrainLightWrap: { max: 1, min: 0, step: 0.01, value: 0.6 },
      terrainSeed: { max: 255, min: 0, step: 1, value: 42 },
      fieldSpeed: { max: 2.5, min: -2.5, step: 0.01, value: 0.6 },
      ...defaultValues,
    },
    { collapsed: true }
  );
}
