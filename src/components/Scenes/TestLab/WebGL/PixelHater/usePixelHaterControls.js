import { useControls } from 'leva';

export default function usePixelHaterControls() {
  return useControls(
    '👾',
    {
      bgType: {
        label: 'Background',
        options: { Environment: 'environment', Color: 'color' },
        value: 'environment',
      },
      bgPreset: {
        label: 'Preset',
        options: [
          'apartment',
          'city',
          'dawn',
          'forest',
          'lobby',
          'night',
          'park',
          'studio',
          'sunset',
          'warehouse',
        ],
        value: 'studio',
        render: (get) => get('👾.bgType') === 'environment',
      },
      bgBlur: {
        label: 'Blur',
        value: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        render: (get) => get('👾.bgType') === 'environment',
      },
      bgColor: {
        label: 'Color',
        value: '#111111',
        render: (get) => get('👾.bgType') === 'color',
      },
      pixelEffect: {
        label: 'Effect',
        options: {
          Yours: 'Yours',
          Mine: 'Mine',
          Censor: 'Censor',
        },
        value: 'Censor',
      },
      effectShape: {
        label: 'Effect Shape',
        options: {
          Plane: 'Plane',
          TwoPanes: 'TwoPanes',
          Cube: 'Cube',
          Cubes: 'Cubes',
          Torus: 'Torus',
          Sphere: 'Sphere',
          Knot: 'Knot',
        },
        value: 'TwoPanes',
      },
      pixelSize: { label: 'Pixel Size', value: 8, min: 1, max: 32, step: 1 },
      planeHeight: {
        label: 'Plane Height',
        value: 1,
        min: 1,
        max: 10,
        step: 0.25,
      },
      planeWidth: {
        label: 'Plane Width',
        value: 5,
        min: 1,
        max: 10,
        step: 0.25,
      },
      refraction: {
        label: 'Refraction',
        value: 0,
        min: 0,
        max: 0.15,
        step: 0.005,
      },
    },
    { collapsed: true }
  );
}
