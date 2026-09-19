import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export function getJourneyControls() {
  return folder(
    {
      hallLength: { label: 'Hall m', min: 48, max: 2000, step: 24, value: 168 },
      returnLength: {
        label: 'Return m',
        min: 48,
        max: 2000,
        step: 24,
        value: 144,
      },
      descentLength: {
        label: 'Descent m',
        min: 60,
        max: 4000,
        step: 10,
        value: 260,
      },
      roomSize: {
        label: 'Room Span',
        min: 80,
        max: 1600,
        step: 10,
        value: 620,
      },
      roomHeight: {
        label: 'Room Height',
        min: 20,
        max: 300,
        step: 5,
        value: 155,
      },
      floorExits: { label: 'Exits', min: 2, max: 10, step: 1, value: 6 },
      floorExitVariance: {
        label: 'Exit Variance',
        min: 0,
        max: 1.4,
        step: 0.05,
        value: 0.9,
      },
      floorSkirt: {
        label: 'Floor Skirt m',
        min: 5,
        max: 60,
        step: 1.25,
        value: 15,
      },
      spokeLength: { label: 'Spoke m', min: 1, max: 12, step: 0.5, value: 3 },
      mountMargin: {
        label: 'Mount Reach m',
        min: 20,
        max: 300,
        step: 5,
        value: 90,
      },
    },
    COLLAPSED
  );
}

export function getLivingRoomControls() {
  return folder(
    {
      livingDepth: { label: 'Depth', min: 3, max: 12, step: 0.1, value: 6.4 },
      livingWidth: { label: 'Width', min: 3, max: 10, step: 0.1, value: 4.6 },
      livingHeight: {
        label: 'Height',
        min: 2.2,
        max: 4,
        step: 0.05,
        value: 2.6,
      },
      wallThickness: {
        label: 'Wall',
        min: 0.08,
        max: 0.5,
        step: 0.01,
        value: 0.14,
      },
      livingDoorZ: {
        label: 'Door Offset',
        min: -3,
        max: 3,
        step: 0.05,
        value: 0.9,
      },
      lampColor: { label: 'Lamp', value: '#ffb877' },
      lampIntensity: {
        label: 'Lamp Power',
        min: 0,
        max: 60,
        step: 0.5,
        value: 9,
      },
      tvColor: { label: 'TV', value: '#9fb8ff' },
      tvIntensity: {
        label: 'TV Power',
        min: 0,
        max: 20,
        step: 0.1,
        value: 2.5,
      },
      tvScale: { label: 'TV Scale', min: 0.3, max: 3, step: 0.05, value: 1 },
      beaconIntensity: {
        label: 'Doorway Light',
        min: 0,
        max: 200,
        step: 1,
        value: 40,
      },
      beaconGlow: {
        label: 'Doorway Glow',
        min: 0,
        max: 8,
        step: 0.1,
        value: 1.6,
      },
    },
    COLLAPSED
  );
}
