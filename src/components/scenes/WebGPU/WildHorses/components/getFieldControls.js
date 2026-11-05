import { folder } from 'leva';

export default function getFieldControls(p) {
  return folder(
    {
      terrainExtent: { max: 120, min: 20, step: 1, value: p.terrainExtent },
      terrainNoiseScale: {
        max: 8,
        min: 0.5,
        step: 0.1,
        value: p.terrainNoiseScale,
      },
      terrainMaxHeight: {
        max: 6,
        min: 0,
        step: 0.05,
        value: p.terrainMaxHeight,
      },
      terrainColor: { value: p.terrainColor },
      terrainLightWrap: {
        max: 1,
        min: 0,
        step: 0.01,
        value: p.terrainLightWrap,
      },
      terrainSeed: { max: 255, min: 0, step: 1, value: p.terrainSeed },
      fieldSpeed: { max: 2.5, min: -2.5, step: 0.01, value: p.fieldSpeed },
    },
    { collapsed: true }
  );
}
