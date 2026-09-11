import { PALETTE } from '@modules/terrainErosion';

// These hex values are the reference's linear colour triples written as bytes,
// not sRGB, and they are pushed to the uniforms unconverted.
export default function getPaletteControls(snapshot = {}) {
  return {
    cliffColor: { label: 'Cliff', value: snapshot.cliffColor ?? PALETTE.cliff },
    dirtColor: { label: 'Dirt', value: snapshot.dirtColor ?? PALETTE.dirt },
    grass1Color: {
      label: 'Grass Low',
      value: snapshot.grass1Color ?? PALETTE.grass1,
    },
    grass2Color: {
      label: 'Grass High',
      value: snapshot.grass2Color ?? PALETTE.grass2,
    },
    treeColor: { label: 'Trees', value: snapshot.treeColor ?? PALETTE.tree },
    sandColor: { label: 'Sand', value: snapshot.sandColor ?? PALETTE.sand },
    waterColor: { label: 'Water', value: snapshot.waterColor ?? PALETTE.water },
    waterShoreColor: {
      label: 'Water Shore',
      value: snapshot.waterShoreColor ?? PALETTE.waterShore,
    },
    sunColor: { label: 'Sun', value: snapshot.sunColor ?? PALETTE.sun },
    sunIntensity: {
      label: 'Sun Intensity',
      max: 6,
      min: 0,
      step: 0.05,
      value: snapshot.sunIntensity ?? 2,
    },
    ambientColor: {
      label: 'Ambient',
      value: snapshot.ambientColor ?? PALETTE.ambient,
    },
    ambientIntensity: {
      label: 'Ambient Intensity',
      max: 0.6,
      min: 0,
      step: 0.005,
      value: snapshot.ambientIntensity ?? 0.1,
    },
    sunX: {
      label: 'Sun X',
      max: 1,
      min: -1,
      step: 0.01,
      value: snapshot.sunX ?? -1,
    },
    sunY: {
      label: 'Sun Y',
      max: 1,
      min: -0.2,
      step: 0.01,
      value: snapshot.sunY ?? 0.4,
    },
    sunZ: {
      label: 'Sun Z',
      max: 1,
      min: -1,
      step: 0.01,
      value: snapshot.sunZ ?? 0.05,
    },
  };
}
