import { cellSolids, lookOf } from './looks';
import { halfExtents, layoutCells } from './tree';

const EPSILON = 1e-5;
const BLENDED = [
  'gap',
  'frameWidth',
  'coreScale',
  'domainX',
  'domainY',
  'domainZ',
];

// Two configs meeting mid-morph: sizes slide, choices switch halfway.
export function blendConfigs(a, b, t) {
  if (!b || b === a) return a;
  const picked = t < 0.5 ? a : b;
  return {
    ...picked,
    ...Object.fromEntries(
      BLENDED.map((key) => [key, a[key] + (b[key] - a[key]) * t])
    ),
  };
}

function solidHalf(config, shape, size, presence) {
  if (shape === 'sphere') {
    const r = Math.max(0, Math.min(...size) / 2 - config.gap) * presence;
    return [r, r, r];
  }
  return size.map((s) => Math.max(0, s / 2 - config.gap) * presence);
}

// Everything the rig and the plot draw, from the cells of a (morphing,
// growing) layout. Every box is a centre and half extents.
export default function buildInstances({
  config: fromConfig,
  from,
  grow = null,
  half = null,
  stops = null,
  t = 0,
  to = null,
  toConfig = null,
  toStops = stops,
}) {
  const config = blendConfigs(fromConfig, toConfig, t);
  const cells = layoutCells({
    from,
    grow,
    half: half ?? halfExtents(config),
    t,
    to,
  });
  const solids = [];
  const glass = [];
  const frames = [];

  cells.forEach(({ a, b, hi, lo }) => {
    const center = lo.map((v, i) => (v + hi[i]) / 2);
    const size = hi.map((v, i) => v - lo[i]);
    const lookA = lookOf(fromConfig, a, stops);
    const lookB = to ? lookOf(toConfig ?? fromConfig, b, toStops) : lookA;
    const parts = cellSolids(lookA, lookB, to ? t : 0);
    let filled = 0;

    parts.forEach(({ look, presence }) => {
      if (presence <= EPSILON) return;
      filled += presence;
      const extent = solidHalf(config, look.shape, size, presence);
      if (Math.min(...extent) <= EPSILON) return;
      if (look.family === 'glass') {
        glass.push({ center, half: extent, look });
        const core = extent.map((e) => e * config.coreScale);
        if (config.coreScale > 0 && Math.min(...core) > EPSILON) {
          solids.push({
            center,
            half: core,
            look: {
              color: [0, 0, 0],
              emissive: look.core,
              family: 'opaque',
              noise: 0,
              role: 'core',
              roughness: 1,
              shape: look.shape,
            },
          });
        }
      } else {
        solids.push({ center, half: extent, look });
      }
    });

    const width =
      config.frameMode === 'all'
        ? config.frameWidth
        : config.frameWidth * Math.min(filled, 1);
    if (config.frameMode !== 'none' && width > EPSILON) {
      frames.push({ center, half: size.map((s) => s / 2), width });
    }
  });

  return { cells: cells.length, frames, glass, solids };
}
