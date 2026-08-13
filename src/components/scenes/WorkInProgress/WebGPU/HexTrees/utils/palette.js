import { Color } from 'three';

// "How color gets applied" modes, same intent as FractalAutomata's
// COLOR_MODES/paletteNode.js — a named array (not a hardcoded switch) is
// what makes this pluggable later (e.g. 'perTree', 'radialDirection')
// without touching call sites. Ships with just 'depth' for now.
//
// Deviates from FractalAutomata's implementation on purpose: that scene's
// per-cell data already lives in a GPU storage buffer from its compute
// pipeline, so a TSL colorNode reading it live is the natural fit. This
// scene's branches/circles are CPU-generated (utils/treeGenerator.js) into a
// plain InstancedMesh, so the closer in-repo precedent is
// DigitalRain/components/VoxelCloudBlocks.jsx: bake per-instance color on
// the CPU into `mesh.instanceColor`/`setColorAt`, recomputed in a live
// effect (no TSL colorNode needed — MeshStandardNodeMaterial already mixes
// instanceColor into its default colorNode).
export const COLOR_MODES = ['depth'];

const T_BY_MODE = {
  depth: (item) => item.generationT,
};

export function colorModeT(mode, item) {
  const getT = T_BY_MODE[mode] ?? T_BY_MODE.depth;
  return getT(item);
}

// Two-segment gradient (start->mid->end), same math as FractalAutomata's
// paletteNode.js: mix(start,mid,t/midpoint) below midpoint,
// mix(mid,end,(t-midpoint)/(1-midpoint)) above it.
export function sampleGradient({ t, start, mid, end, midpoint, out }) {
  const clampedMidpoint = Math.min(0.999, Math.max(0.001, midpoint));
  const clampedT = Math.min(1, Math.max(0, t));
  if (clampedT <= clampedMidpoint) {
    out.copy(start).lerp(mid, clampedT / clampedMidpoint);
  } else {
    out
      .copy(mid)
      .lerp(end, (clampedT - clampedMidpoint) / (1 - clampedMidpoint));
  }
  return out;
}

export function createGradientColors({ paletteStart, paletteMid, paletteEnd }) {
  return {
    start: new Color(paletteStart),
    mid: new Color(paletteMid),
    end: new Color(paletteEnd),
  };
}
