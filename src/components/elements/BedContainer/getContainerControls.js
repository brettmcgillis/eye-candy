import { folder } from 'leva';

export default function getContainerControls(p) {
  return folder(
    {
      containerEnabled: { label: 'Container', value: p.containerEnabled },
      containerMaterial: {
        label: 'Material',
        value: p.containerMaterial,
        options: ['Matte', 'Clear', 'Glass'],
      },
      containerWall: {
        label: 'Wall Thickness',
        value: p.containerWall,
        min: 0.02,
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
        min: 0.02,
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
      containerOpacity: {
        label: 'Opacity',
        value: p.containerOpacity,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      containerIor: {
        label: 'IOR',
        value: p.containerIor,
        min: 1,
        max: 2.4,
        step: 0.01,
      },
      containerThickness: {
        label: 'Glass Thickness',
        value: p.containerThickness,
        min: 0.01,
        max: 3,
        step: 0.01,
      },
      containerShadowAlpha: {
        label: 'Shadow Density',
        value: p.containerShadowAlpha,
        min: 0,
        max: 1,
        step: 0.01,
      },
      containerShadowOcclusion: {
        label: 'Shadow Falloff',
        value: p.containerShadowOcclusion,
        min: 0.5,
        max: 12,
        step: 0.1,
      },
      containerCaustics: { label: 'Caustics', value: p.containerCaustics },
      containerCausticStrength: {
        label: 'Caustic Strength',
        value: p.containerCausticStrength,
        min: 0,
        max: 40,
        step: 0.5,
      },
      containerCausticScale: {
        label: 'Caustic Scale',
        value: p.containerCausticScale,
        min: 0.5,
        max: 30,
        step: 0.5,
      },
      containerCausticSharpness: {
        label: 'Caustic Sharpness',
        value: p.containerCausticSharpness,
        min: 1,
        max: 12,
        step: 0.1,
      },
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
