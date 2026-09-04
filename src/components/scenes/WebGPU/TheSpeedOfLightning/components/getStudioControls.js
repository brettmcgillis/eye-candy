import { folder } from 'leva';

export default function getStudioControls(p) {
  return folder(
    {
      backgroundColor: { label: 'Background', value: p.backgroundColor },
      floorColor: { label: 'Floor Edge', value: p.floorColor },
      floorCenterColor: { label: 'Floor Pool', value: p.floorCenterColor },
      wallLowColor: { label: 'Wall Low', value: p.wallLowColor },
      wallHighColor: { label: 'Wall High', value: p.wallHighColor },
      wallGradientStart: {
        label: 'Gradient Start',
        value: p.wallGradientStart,
        min: 0,
        max: 1,
        step: 0.01,
      },
      wallGradientEnd: {
        label: 'Gradient End',
        value: p.wallGradientEnd,
        min: 0,
        max: 1,
        step: 0.01,
      },
      floorGapRatio: {
        label: 'Floor Gap (x sand)',
        value: p.floorGapRatio,
        min: 0,
        max: 6,
        step: 0.1,
      },
      roomRadius: {
        label: 'Room Radius',
        value: p.roomRadius,
        min: 4,
        max: 30,
        step: 0.5,
      },
      roomHeight: {
        label: 'Room Height',
        value: p.roomHeight,
        min: 4,
        max: 40,
        step: 0.5,
      },
      fogNear: {
        label: 'Fog Near',
        value: p.fogNear,
        min: 0,
        max: 40,
        step: 0.5,
      },
      fogFar: { label: 'Fog Far', value: p.fogFar, min: 1, max: 80, step: 0.5 },
    },
    { collapsed: true }
  );
}
