import { folder } from 'leva';

import { LAYOUTS, SYMMETRY } from '../utils/uniforms';

const DEFAULTS = {
  layout: 'rug',
  floorColor: '#2a2522',
  rugWidth: 4,
  rugLength: 6,
  symmetry: 1,
  borderWidth: 0.5,
  guardWidth: 0.08,
  guardFrequency: 6,
  guardColor: '#efe3c8',
  medallionSize: 0.4,
  medallionPetals: 8,
  knotDensity: 0,
  knotShade: 0.3,
  fringeLength: 0.4,
  fringeDensity: 24,
  fringeColor: '#efe8d8',
};

export default function getLayoutControls(folderPath, defaultValues = {}) {
  const v = { ...DEFAULTS, ...defaultValues };
  const layoutPath = `${folderPath}.Layout.layout`;
  const framed = (get) => get(layoutPath) !== 'fullscreen';
  const isRug = (get) => get(layoutPath) === 'rug';

  return {
    Layout: folder(
      {
        layout: { value: v.layout, label: 'Layout', options: LAYOUTS },
        floorColor: { value: v.floorColor, label: 'Floor', render: framed },
        rugWidth: {
          value: v.rugWidth,
          label: 'Width',
          min: 1,
          max: 12,
          step: 0.01,
          render: framed,
        },
        rugLength: {
          value: v.rugLength,
          label: 'Length',
          min: 1,
          max: 16,
          step: 0.01,
          render: isRug,
        },
        symmetry: {
          value: v.symmetry,
          label: 'Symmetry',
          options: SYMMETRY,
          render: framed,
        },
        knotDensity: {
          value: v.knotDensity,
          label: 'Knots / Unit',
          min: 0,
          max: 200,
          step: 1,
          render: framed,
        },
        knotShade: {
          value: v.knotShade,
          label: 'Knot Shade',
          min: 0,
          max: 1,
          step: 0.01,
          render: (get) =>
            framed(get) && get(`${folderPath}.Layout.knotDensity`) > 0,
        },
      },
      { collapsed: true }
    ),
    Border: folder(
      {
        borderWidth: {
          value: v.borderWidth,
          label: 'Border',
          min: 0,
          max: 3,
          step: 0.01,
        },
        guardWidth: {
          value: v.guardWidth,
          label: 'Guard Stripe',
          min: 0,
          max: 0.5,
          step: 0.005,
        },
        guardFrequency: {
          value: v.guardFrequency,
          label: 'Guard Barbers',
          min: 0,
          max: 40,
          step: 0.1,
        },
        guardColor: { value: v.guardColor, label: 'Guard Color' },
      },
      { collapsed: true, render: framed }
    ),
    Medallion: folder(
      {
        medallionSize: {
          value: v.medallionSize,
          label: 'Size',
          min: 0,
          max: 1,
          step: 0.01,
        },
        medallionPetals: {
          value: v.medallionPetals,
          label: 'Petals',
          min: 1,
          max: 24,
          step: 1,
        },
      },
      { collapsed: true, render: framed }
    ),
    Fringe: folder(
      {
        fringeLength: {
          value: v.fringeLength,
          label: 'Length',
          min: 0,
          max: 2,
          step: 0.01,
        },
        fringeDensity: {
          value: v.fringeDensity,
          label: 'Tassels / Unit',
          min: 2,
          max: 80,
          step: 1,
        },
        fringeColor: { value: v.fringeColor, label: 'Color' },
      },
      { collapsed: true, render: isRug }
    ),
  };
}
