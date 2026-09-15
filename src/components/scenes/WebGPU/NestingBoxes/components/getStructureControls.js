import { button, folder } from 'leva';

import { MAX_LEVELS, MAX_SEED } from '../utils/boxTree';

export const STRUCTURE_DEFAULTS = {
  seed: 0,
  levels: 14,
  rootRadiusX: 4,
  rootRadiusY: 2,
  rootRadiusZ: 4,
  shrink: 0.75,
  shrinkJitter: 0.2,
  placementFrequency: 21,
  placementPhaseX: 0,
  placementPhaseY: 3,
  placementPhaseZ: 2,
  sizeFrequency: 31,
  sizePhaseX: 1,
  sizePhaseY: 2,
  sizePhaseZ: 4,
};

const TAU = Math.PI * 2;

const phase = (value, label) => ({
  value,
  label,
  min: 0,
  max: TAU,
  step: 0.01,
});

const frequency = (value) => ({
  value,
  label: 'Frequency',
  min: 0,
  max: 100,
  step: 0.01,
});

export default function getStructureControls({
  defaultValues = {},
  onRandomize,
}) {
  const v = { ...STRUCTURE_DEFAULTS, ...defaultValues };

  return {
    Structure: folder(
      {
        randomize: button(onRandomize),
        seed: {
          value: v.seed,
          label: 'Seed',
          min: 0,
          max: MAX_SEED,
          step: 1,
        },
        levels: {
          value: v.levels,
          label: 'Depth',
          min: 1,
          max: MAX_LEVELS,
          step: 1,
        },
        rootRadiusX: {
          value: v.rootRadiusX,
          label: 'Root Width',
          min: 0.1,
          max: 10,
          step: 0.01,
        },
        rootRadiusY: {
          value: v.rootRadiusY,
          label: 'Root Height',
          min: 0.1,
          max: 10,
          step: 0.01,
        },
        rootRadiusZ: {
          value: v.rootRadiusZ,
          label: 'Root Depth',
          min: 0.1,
          max: 10,
          step: 0.01,
        },
        shrink: {
          value: v.shrink,
          label: 'Child Scale',
          min: 0.3,
          max: 1.2,
          step: 0.001,
        },
        shrinkJitter: {
          value: v.shrinkJitter,
          label: 'Child Scale Jitter',
          min: 0,
          max: 0.5,
          step: 0.001,
        },
        Placement: folder(
          {
            placementFrequency: frequency(v.placementFrequency),
            placementPhaseX: phase(v.placementPhaseX, 'Phase X'),
            placementPhaseY: phase(v.placementPhaseY, 'Phase Y'),
            placementPhaseZ: phase(v.placementPhaseZ, 'Phase Z'),
          },
          { collapsed: true }
        ),
        Size: folder(
          {
            sizeFrequency: frequency(v.sizeFrequency),
            sizePhaseX: phase(v.sizePhaseX, 'Phase X'),
            sizePhaseY: phase(v.sizePhaseY, 'Phase Y'),
            sizePhaseZ: phase(v.sizePhaseZ, 'Phase Z'),
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
  };
}
