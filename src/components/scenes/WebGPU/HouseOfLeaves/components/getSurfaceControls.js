import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export function getSurfaceControls() {
  return folder(
    {
      surfaceTint: { label: 'Ash', value: '#6f6c68' },
      floorTint: { label: 'Floor', value: '#5a5754' },
      surfaceScale: {
        label: 'Tile / m',
        min: 0.05,
        max: 2,
        step: 0.01,
        value: 0.45,
      },
      surfaceDetile: {
        label: 'Detile',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.35,
      },
      normalStrength: {
        label: 'Normal',
        min: 0,
        max: 1.5,
        step: 0.01,
        value: 0.8,
      },
      roughnessScale: {
        label: 'Roughness',
        min: 0.2,
        max: 1.5,
        step: 0.01,
        value: 1,
      },
      livingTint: { label: 'Plaster', value: '#d8cfc1' },
      livingFloorTint: { label: 'Wood', value: '#a5825a' },
      livingScale: {
        label: 'Home Tile / m',
        min: 0.1,
        max: 3,
        step: 0.01,
        value: 0.9,
      },
    },
    COLLAPSED
  );
}

export function getStreamingControls() {
  return folder(
    {
      streamAhead: { label: 'Ahead m', min: 40, max: 500, step: 5, value: 200 },
      streamBehind: {
        label: 'Behind m',
        min: 10,
        max: 300,
        step: 5,
        value: 80,
      },
      wallRebuildSlack: {
        label: 'Wall Slack',
        min: 5,
        max: 120,
        step: 5,
        value: 40,
      },
    },
    COLLAPSED
  );
}
