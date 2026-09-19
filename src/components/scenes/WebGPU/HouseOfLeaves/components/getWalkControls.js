import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export const START_ZONES = [
  'Living Room',
  'Hallway',
  'Great Room',
  'Staircase',
  'Floor',
  'Way Back',
];

export function getWalkControls() {
  return folder(
    {
      startZone: {
        label: 'Start In',
        options: START_ZONES,
        value: 'Living Room',
      },
      directed: { label: 'Directed', value: true },
      // With Directed off the keys and drag-look drive the walker: a debug
      // walk, not a mode of the piece.
      walkEnabled: { label: 'Walker Owns Camera', value: true },
      walkSpeed: {
        label: 'Walk m/s',
        min: 0.4,
        max: 4,
        step: 0.05,
        value: 1.4,
      },
      runSpeed: { label: 'Run m/s', min: 1, max: 8, step: 0.1, value: 4.2 },
      stairSpeed: {
        label: 'Stairs m/s',
        min: 0.5,
        max: 6,
        step: 0.1,
        value: 3,
      },
      sprintMultiplier: {
        label: 'Sprint × (debug)',
        min: 1,
        max: 6,
        step: 0.1,
        value: 2.4,
      },
      eyeHeight: {
        label: 'Eye Height',
        min: 1,
        max: 2.2,
        step: 0.01,
        value: 1.65,
      },
      walkerRadius: {
        label: 'Shoulder',
        min: 0.1,
        max: 1.2,
        step: 0.05,
        value: 0.35,
      },
      bobAmount: {
        label: 'Head Bob',
        min: 0,
        max: 0.2,
        step: 0.005,
        value: 0.04,
      },
      bobSway: { label: 'Sway', min: 0, max: 0.2, step: 0.005, value: 0.025 },
      bobRoll: { label: 'Roll', min: 0, max: 0.06, step: 0.001, value: 0.007 },
      bobRate: {
        label: 'Steps / m',
        min: 0.2,
        max: 4,
        step: 0.05,
        value: 1.15,
      },
      bobSettle: { label: 'Settle', min: 1, max: 20, step: 0.5, value: 6 },
      handheld: { label: 'Handheld', min: 0, max: 3, step: 0.05, value: 1 },
      lookLag: { label: 'Look Lag', min: 0.5, max: 12, step: 0.1, value: 3.5 },
      lookSensitivity: {
        label: 'Look Sens (debug)',
        min: 0.0005,
        max: 0.008,
        step: 0.0001,
        value: 0.0022,
      },
    },
    COLLAPSED
  );
}

export function getDirectorControls() {
  return folder(
    {
      restSeconds: { label: 'Rest s', min: 0.5, max: 12, step: 0.1, value: 3 },
      sweepSeconds: {
        label: 'Look Round s',
        min: 4,
        max: 40,
        step: 0.5,
        value: 14,
      },
      runAfter: {
        label: 'Run After',
        min: 0.05,
        max: 0.95,
        step: 0.01,
        value: 0.4,
      },
      thresholdSlow: {
        label: 'Slow Before m',
        min: 2,
        max: 80,
        step: 1,
        value: 24,
      },
      thresholdSeconds: {
        label: 'Threshold s',
        min: 1,
        max: 20,
        step: 0.5,
        value: 6,
      },
      edgeSeconds: {
        label: 'Over Edge s',
        min: 1,
        max: 20,
        step: 0.5,
        value: 6,
      },
      glanceEvery: {
        label: 'Glance Every s',
        min: 4,
        max: 60,
        step: 1,
        value: 16,
      },
      evaluateSeconds: {
        label: 'Weigh Exits s',
        min: 3,
        max: 40,
        step: 0.5,
        value: 12,
      },
      lightDistance: {
        label: 'Light Seen m',
        min: 20,
        max: 300,
        step: 5,
        value: 110,
      },
      floorChoice: {
        label: 'Exit (-1 auto)',
        min: -1,
        max: 9,
        step: 1,
        value: -1,
      },
    },
    COLLAPSED
  );
}
