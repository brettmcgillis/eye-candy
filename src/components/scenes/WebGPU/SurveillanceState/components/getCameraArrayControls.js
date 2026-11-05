import seededFolder from '../utils/seededFolder';

export default function getCameraArrayControls(snapshot) {
  return seededFolder(
    {
      seed: { label: 'Seed', value: 1, min: 1, max: 9999, step: 1 },
      rigCount: { label: 'Cameras', value: 16, min: 1, max: 24, step: 1 },
      rigSpread: {
        label: 'Spread (deg)',
        value: 70,
        min: 5,
        max: 85,
        step: 1,
      },
      rigDistanceMin: {
        label: 'Distance Min',
        value: 1.9,
        min: 0.6,
        max: 6,
        step: 0.05,
      },
      rigDistanceMax: {
        label: 'Distance Max',
        value: 3.4,
        min: 0.6,
        max: 6,
        step: 0.05,
      },
      rigHeightMin: {
        label: 'Height Min',
        value: 0.5,
        min: 0.25,
        max: 2.5,
        step: 0.05,
      },
      rigHeightMax: {
        label: 'Height Max',
        value: 2.1,
        min: 0.25,
        max: 2.5,
        step: 0.05,
      },
      rigScale: {
        label: 'Camera Size',
        value: 0.7,
        min: 0.4,
        max: 1.2,
        step: 0.01,
      },
      rigSway: {
        label: 'Sway (deg)',
        value: 2.5,
        min: 0,
        max: 15,
        step: 0.1,
      },
    },
    snapshot
  );
}
