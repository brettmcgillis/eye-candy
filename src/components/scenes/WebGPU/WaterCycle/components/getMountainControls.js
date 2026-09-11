import { PALETTE } from '@modules/terrainErosion';

import { MOUNTAIN_SHAPES } from '../utils/mountainField';
import {
  isMountainTarget,
  isMountainVisible,
  isPeakShape,
  isRangeShape,
} from './controlPaths';

export const MOUNTAIN_MODES = ['Hidden', 'Full'];

// Monochrome keeps the mountain in the same register as the implied ocean; the
// reference palette is the Shadertoy's own colours, for checking the port.
export const MOUNTAIN_PALETTES = {
  Monochrome: {
    ambientColor: '#2a2a2a',
    cliffColor: '#1a1a1a',
    dirtColor: '#333333',
    grass1Color: '#242424',
    grass2Color: '#3d3d3d',
    sandColor: '#4d4d4d',
    sunColor: '#ffffff',
    treeColor: '#141414',
    waterColor: '#000000',
    waterShoreColor: '#0a0a0a',
  },
  Reference: {
    ambientColor: PALETTE.ambient,
    cliffColor: PALETTE.cliff,
    dirtColor: PALETTE.dirt,
    grass1Color: PALETTE.grass1,
    grass2Color: PALETTE.grass2,
    sandColor: PALETTE.sand,
    sunColor: PALETTE.sun,
    treeColor: PALETTE.tree,
    waterColor: PALETTE.water,
    waterShoreColor: PALETTE.waterShore,
  },
};

export default function getMountainControls(snapshot = {}) {
  return {
    mountainDisplayMode: {
      label: 'Mountain Surface',
      options: MOUNTAIN_MODES,
      render: isMountainTarget,
      value: snapshot.mountainDisplayMode ?? 'Hidden',
    },
    mountainShape: {
      label: 'Shape',
      options: MOUNTAIN_SHAPES,
      render: isMountainTarget,
      value: snapshot.mountainShape ?? MOUNTAIN_SHAPES[0],
    },
    mountainPalette: {
      label: 'Palette',
      options: Object.keys(MOUNTAIN_PALETTES),
      render: isMountainVisible,
      value: snapshot.mountainPalette ?? 'Monochrome',
    },
    mountainMeshResolution: {
      label: 'Mesh Resolution',
      max: 1024,
      min: 64,
      render: isMountainVisible,
      step: 32,
      value: snapshot.mountainMeshResolution ?? 512,
    },
    mountainFieldResolution: {
      label: 'Field Resolution',
      options: [512, 1024, 2048],
      render: isMountainTarget,
      value: snapshot.mountainFieldResolution ?? 1024,
    },
    mountainExtent: {
      label: 'Extent',
      max: 400,
      min: 40,
      render: isMountainTarget,
      step: 1,
      value: snapshot.mountainExtent ?? 140,
    },
    mountainRelief: {
      label: 'Relief',
      max: 400,
      min: 20,
      render: isMountainTarget,
      step: 1,
      value: snapshot.mountainRelief ?? 140,
    },
    mountainBaseHeight: {
      label: 'Sea Level',
      max: 0.6,
      min: 0.3,
      render: isMountainTarget,
      step: 0.005,
      value: snapshot.mountainBaseHeight ?? 0.4,
    },
    mountainFrequency: {
      label: 'Range Frequency',
      max: 8,
      min: 0.5,
      render: isRangeShape,
      step: 0.1,
      value: snapshot.mountainFrequency ?? 2.2,
    },
    mountainAmplitude: {
      label: 'Range Amplitude',
      max: 0.3,
      min: 0.02,
      render: isRangeShape,
      step: 0.005,
      value: snapshot.mountainAmplitude ?? 0.125,
    },
    peakRadius: {
      label: 'Peak Radius',
      max: 0.5,
      min: 0.1,
      render: isPeakShape,
      step: 0.005,
      value: snapshot.peakRadius ?? 0.35,
    },
    peakAmplitude: {
      label: 'Peak Amplitude',
      max: 0.3,
      min: 0.02,
      render: isPeakShape,
      step: 0.005,
      value: snapshot.peakAmplitude ?? 0.1,
    },
    mountainTreeline: {
      label: 'Treeline',
      max: 0.6,
      min: 0.3,
      render: isMountainVisible,
      step: 0.005,
      value: snapshot.mountainTreeline ?? 0.465,
    },
    erosionScale: {
      label: 'Erosion Scale',
      max: 0.6,
      min: 0.02,
      render: isMountainTarget,
      step: 0.005,
      value: snapshot.erosionScale ?? 0.15,
    },
    erosionStrength: {
      label: 'Erosion Strength',
      max: 0.6,
      min: 0,
      render: isMountainTarget,
      step: 0.005,
      value: snapshot.erosionStrength ?? 0.22,
    },
    erosionGullyWeight: {
      label: 'Gully Weight',
      max: 1,
      min: 0,
      render: isMountainTarget,
      step: 0.01,
      value: snapshot.erosionGullyWeight ?? 0.5,
    },
    erosionDetail: {
      label: 'Erosion Detail',
      max: 4,
      min: 0.2,
      render: isMountainTarget,
      step: 0.05,
      value: snapshot.erosionDetail ?? 1.5,
    },
    erosionOctaves: {
      label: 'Erosion Octaves',
      max: 8,
      min: 1,
      render: isMountainTarget,
      step: 1,
      value: snapshot.erosionOctaves ?? 5,
    },
  };
}
