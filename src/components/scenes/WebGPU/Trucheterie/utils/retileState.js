import { MOTIF, TRI_MOTIF } from './grid';

const WEAVE_CHANCE = 0.15;
const LANES_CHANCE = 0.25;

export function pickRandomMotif(
  straightTileChance,
  weaveEnabled,
  lanesEnabled
) {
  if (lanesEnabled && Math.random() < LANES_CHANCE) {
    return Math.random() < 0.5 ? MOTIF.LANES_A : MOTIF.LANES_B;
  }
  if (weaveEnabled && Math.random() < WEAVE_CHANCE) {
    return Math.random() < 0.5 ? MOTIF.CROSS_H_UNDER : MOTIF.CROSS_V_UNDER;
  }
  if (Math.random() < straightTileChance) {
    return Math.random() < 0.5 ? MOTIF.STRAIGHT_H : MOTIF.STRAIGHT_V;
  }
  return Math.random() < 0.5 ? MOTIF.ARC_A : MOTIF.ARC_B;
}

// 0-2 = arc at vertex 0/1/2, 3-5 = the matching straight chord, 6-11 = weave
// crossings, 12-14 = LANES_V0/V1/V2 (see grid.js's TRI_MOTIF for the
// encoding).
export function pickRandomTriMotif(
  straightTileChance,
  weaveEnabled,
  lanesEnabled
) {
  if (lanesEnabled && Math.random() < LANES_CHANCE) {
    return TRI_MOTIF.LANES_V0 + Math.floor(Math.random() * 3);
  }
  if (weaveEnabled && Math.random() < WEAVE_CHANCE) {
    const pairIndex = Math.floor(Math.random() * 3);
    const underIsSecond = Math.random() < 0.5 ? 1 : 0;
    return 6 + pairIndex * 2 + underIsSecond;
  }
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
