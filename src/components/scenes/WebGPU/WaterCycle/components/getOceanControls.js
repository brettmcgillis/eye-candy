import {
  OCEAN_MODES,
  isCustomPalette,
  isFullyShaded,
  isSurfaceVisible,
} from './controlPaths';

export const OCEAN_PALETTES = {
  Monochrome: {
    seaColor: '#000000',
    horizonColor: '#050505',
    skyColor: '#000000',
    sunColor: '#ffffff',
  },
  'Row It Alone': {
    seaColor: '#01040c',
    horizonColor: '#6b9ed1',
    skyColor: '#143663',
    sunColor: '#ffe6b8',
  },
};

export default function getOceanControls(snapshot = {}) {
  return {
    oceanDisplayMode: {
      label: 'Water Surface',
      options: OCEAN_MODES,
      value: snapshot.oceanDisplayMode ?? 'Hidden',
    },
    oceanPatchSize: {
      render: isSurfaceVisible,
      label: 'Patch Size',
      max: 400,
      min: 50,
      step: 1,
      value: snapshot.oceanPatchSize ?? 200,
    },
    oceanPatchResolution: {
      render: isSurfaceVisible,
      label: 'Patch Resolution',
      max: 384,
      min: 64,
      step: 1,
      value: snapshot.oceanPatchResolution ?? 192,
    },
    oceanLodScale: {
      render: isSurfaceVisible,
      label: 'LOD Scale',
      max: 12,
      min: 0,
      step: 0.1,
      value: snapshot.oceanLodScale ?? 3.7,
    },
    oceanPaletteMode: {
      render: isFullyShaded,
      label: 'Palette',
      options: Object.keys(OCEAN_PALETTES).concat('Custom'),
      value: snapshot.oceanPaletteMode ?? 'Row It Alone',
    },
    oceanSeaColor: {
      label: 'Sea',
      render: isCustomPalette,
      value: snapshot.oceanSeaColor ?? '#01040c',
    },
    oceanHorizonColor: {
      label: 'Horizon',
      render: isCustomPalette,
      value: snapshot.oceanHorizonColor ?? '#6b9ed1',
    },
    oceanSkyColor: {
      label: 'Sky',
      render: isCustomPalette,
      value: snapshot.oceanSkyColor ?? '#143663',
    },
    oceanSunColor: {
      label: 'Sun',
      render: isCustomPalette,
      value: snapshot.oceanSunColor ?? '#ffe6b8',
    },
    enhanceSurfaceDetails: {
      render: isFullyShaded,
      label: 'Enhance Surface Detail',
      value: snapshot.enhanceSurfaceDetails ?? false,
    },
    oceanFoamStrength: {
      render: isSurfaceVisible,
      label: 'Foam Strength',
      max: 5,
      min: 0,
      step: 0.05,
      value: snapshot.oceanFoamStrength ?? 1.1,
    },
    oceanFoamThreshold: {
      render: isSurfaceVisible,
      label: 'Foam Threshold',
      max: 6,
      min: 0,
      step: 0.05,
      value: snapshot.oceanFoamThreshold ?? 2.8,
    },
  };
}
