import { folder } from 'leva';

import VEHICLES from '../utils/vehicles';

// One flat, globally-unique key per vehicle per property
// (docs/scene-conventions.md §9) — the sub-folders are visual grouping only.
// Every vehicle reads the same Glitch folder; `Glitch` here is the per-vehicle
// opt-in, so a clean van can sit next to a car coming apart.
export default function getVehicleControls(preset) {
  return folder(
    Object.fromEntries(
      VEHICLES.map((vehicle) => [
        vehicle.label,
        folder(
          {
            [`vehicle${vehicle.id}Enabled`]: {
              label: 'Enabled',
              value: preset[`vehicle${vehicle.id}Enabled`],
            },
            [`vehicle${vehicle.id}Glitch`]: {
              label: 'Glitch',
              value: preset[`vehicle${vehicle.id}Glitch`],
            },
            [`vehicle${vehicle.id}Position`]: {
              label: 'Position',
              step: 0.1,
              value: preset[`vehicle${vehicle.id}Position`],
            },
            [`vehicle${vehicle.id}Rotation`]: {
              label: 'Rotation Y',
              min: -180,
              max: 180,
              step: 1,
              value: preset[`vehicle${vehicle.id}Rotation`],
            },
          },
          { collapsed: true }
        ),
      ])
    ),
    { collapsed: true }
  );
}
