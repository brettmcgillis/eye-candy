import { catalogEntry, catalogSignature, placeLeaf } from './catalog';
import createPanelContext from './context';
import planCell from './planCell';
import { createToner } from './tone';

const round = (v) => Math.round(v * 10) / 10;

// The fast path: every leaf decided and placed against a baked catalogue
// entry, with no arrangement per panel. This is what a live image or webcam
// frame rebuilds. Tones are unshifted; the renderer applies shift and repeat.
export default function buildLeaves(config, { image = null } = {}) {
  const ctx = createPanelContext(config, { image });
  const poolIndex = new Map(ctx.pool.map(({ id }, i) => [id, i]));
  const toner = createToner(config, {
    height: ctx.height,
    poolIndex,
    width: ctx.width,
    zoneCount: ctx.zoneCount,
  });

  const signature = catalogSignature(config);
  const leaves = [];
  const entries = new Map();
  ctx.cells().forEach((top) => {
    planCell(top, ctx, { infill: false }).leaves.forEach((leaf) => {
      const { angle, entry } = placeLeaf(leaf, signature);
      if (!entries.has(entry)) {
        entries.set(entry, catalogEntry(entry, config, ctx.widths));
      }
      leaves.push({
        angle,
        entry,
        id: `${round(leaf.center[0])},${round(leaf.center[1])},${leaf.level}`,
        level: leaf.level,
        luma: leaf.stats?.luma ?? 0.5,
        pattern: leaf.pattern,
        rgb: leaf.stats?.rgb ?? null,
        tone: toner(leaf.center, leaf),
        x: leaf.center[0],
        y: leaf.center[1],
      });
    });
  });

  return {
    entries,
    frames: ctx.frames,
    height: ctx.height,
    inner: ctx.inner,
    leaves,
    width: ctx.width,
  };
}
