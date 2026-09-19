import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export function getCorridorControls() {
  return folder(
    {
      segmentLength: {
        label: 'Segment',
        min: 4,
        max: 40,
        step: 0.5,
        value: 24,
      },
      startWidth: {
        label: 'Start W',
        min: 0.7,
        max: 4,
        step: 0.05,
        value: 1.0,
      },
      startHeight: { label: 'Start H', min: 2, max: 5, step: 0.05, value: 2.3 },
      corridorWidth: {
        label: 'Width',
        min: 1.5,
        max: 12,
        step: 0.1,
        value: 4.2,
      },
      corridorHeight: {
        label: 'Height',
        min: 2.2,
        max: 20,
        step: 0.1,
        value: 7,
      },
      hallGrowthRun: {
        label: 'Grow Over m',
        min: 0,
        max: 600,
        step: 5,
        value: 90,
      },
      revealDepth: {
        label: 'Reveal',
        min: 0.1,
        max: 2,
        step: 0.05,
        value: 0.6,
      },
    },
    COLLAPSED
  );
}

export function getDressingControls() {
  return folder(
    {
      branchChance: {
        label: 'Branch Chance',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5,
      },
      branchWidthScale: {
        label: 'Branch Scale',
        min: 0.2,
        max: 1,
        step: 0.01,
        value: 0.62,
      },
      branchLength: {
        label: 'Branch Len',
        min: 4,
        max: 80,
        step: 1,
        value: 28,
      },
      deadEndLength: {
        label: 'Dead End Len',
        min: 2,
        max: 40,
        step: 0.5,
        value: 8,
      },
      branchRoomWidth: {
        label: 'Room W',
        min: 3,
        max: 40,
        step: 0.5,
        value: 12,
      },
      branchRoomDepth: {
        label: 'Room D',
        min: 3,
        max: 40,
        step: 0.5,
        value: 10,
      },
      branchRoomHeight: {
        label: 'Room H',
        min: 2.5,
        max: 30,
        step: 0.5,
        value: 8,
      },
      driftAmount: {
        label: 'Section Drift',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.3,
      },
      driftWavelength: {
        label: 'Drift λ',
        min: 20,
        max: 800,
        step: 5,
        value: 220,
      },
      stepAmount: {
        label: 'Section Steps',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.25,
      },
      stepRunLength: { label: 'Step Run', min: 1, max: 20, step: 1, value: 4 },
    },
    COLLAPSED
  );
}
