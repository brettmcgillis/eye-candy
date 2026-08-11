import { MOTIF } from './grid';

export function pickRandomMotif(straightTileChance) {
  if (Math.random() < straightTileChance) {
    return Math.random() < 0.5 ? MOTIF.STRAIGHT_H : MOTIF.STRAIGHT_V;
  }
  return Math.random() < 0.5 ? MOTIF.ARC_A : MOTIF.ARC_B;
}

// 0-2 = arc at vertex 0/1/2, 3-5 = the matching straight chord.
export function pickRandomTriMotif(straightTileChance) {
  const vertex = Math.floor(Math.random() * 3);
  return Math.random() < straightTileChance ? vertex + 3 : vertex;
}

// Per-tile delay until its next retile, drawn around the mean implied by
// `retileRate` (average tiles/sec across the whole grid) with `animStagger`
// (0-1) controlling how much individual tiles drift from that mean — 0 is a
// metronome, 1 lets a tile fire anywhere from ~0 to ~2x the mean.
export function sampleTriggerDelay(count, retileRate, animStagger) {
  const mean = count / Math.max(retileRate, 0.001);
  const jitter = 1 + (Math.random() * 2 - 1) * animStagger;
  return Math.max(mean * jitter, 0.05);
}

// phase runs 0→1 over one retile. Motif swaps at phase 0.5 in all three
// modes — the edge-on instant for ySpin, the zero-scale instant for zSpin
// and scale — so the swap is never visible.
export function computeTileTransform(animMode, phase) {
  if (animMode === 'ySpin') {
    return { rotY: phase * Math.PI, rotZ: 0, scale: 1 };
  }
  const pinch = Math.abs(Math.cos(phase * Math.PI));
  if (animMode === 'zSpin') {
    return { rotY: 0, rotZ: phase * Math.PI, scale: pinch };
  }
  return { rotY: 0, rotZ: 0, scale: pinch };
}
