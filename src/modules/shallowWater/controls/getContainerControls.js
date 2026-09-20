import { folder } from 'leva';

export default function getContainerControls(p) {
  return folder(
    {
      containerEnabled: { label: 'Container', value: p.containerEnabled },
      containerWall: {
        label: 'Wall Thickness',
        value: p.containerWall,
        min: 0.1,
        max: 6,
        step: 0.05,
      },
      containerRim: {
        label: 'Rim Height',
        value: p.containerRim,
        min: 0,
        max: 8,
        step: 0.05,
      },
      containerFloor: {
        label: 'Floor Depth',
        value: p.containerFloor,
        min: 0.1,
        max: 8,
        step: 0.05,
      },
      containerDrop: {
        label: 'Floor Clearance',
        value: p.containerDrop,
        min: 0,
        max: 6,
        step: 0.05,
      },
      containerColor: { label: 'Colour', value: p.containerColor },
      containerRoughness: {
        label: 'Roughness',
        value: p.containerRoughness,
        min: 0,
        max: 1,
        step: 0.01,
      },
      containerMetalness: {
        label: 'Metalness',
        value: p.containerMetalness,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
