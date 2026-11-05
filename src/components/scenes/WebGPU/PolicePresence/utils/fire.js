import POLICE_PRESENCE_FIRE from '@presets/fire/policePresenceFire';

// The authored Fire splines the sim burns along, in groups behind a toggle.
export const FIRE_SPLINES = [
  { key: 'fireWindshield', label: 'Windshield', names: ['Windshield Fire'] },
  {
    key: 'fireDriverWindow',
    label: 'Driver Windows',
    names: ['Driver Front Window Fire', 'Driver Rear Window Fire'],
  },
  {
    key: 'firePassengerWindow',
    label: 'Passenger Windows',
    names: ['Passenger Front Window Fire', 'Passenger Rear Window Fire'],
  },
  { key: 'fireRearWindow', label: 'Rear Window', names: ['Rear Window Fire'] },
  { key: 'fireHood', label: 'Hood', names: ['Hood Fire'] },
  { key: 'fireRoof', label: 'Roof', names: ['Roof Fire'] },
];

const findSpline = (name) =>
  POLICE_PRESENCE_FIRE.splines.find((spline) => spline.name === name);

export function litSplines(config) {
  return FIRE_SPLINES.filter(({ key }) => config[key])
    .flatMap(({ names }) => names.map(findSpline))
    .filter(Boolean);
}
