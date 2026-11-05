import { createRng } from '@modules/flora';

import cableColors from './colors';
import routeStrands from './routes';
import walkStrands from './walk';

// The reference's canvas runs ±100 turtle units.
export const CANVAS = 100;
const HOLE_DEPTH = 0.2;

export function layoutOptions(config) {
  return {
    bound: CANVAS,
    drift: config.drift,
    grade: config.grade,
    hole: config.holeRadius / 1000,
    holeDepth: HOLE_DEPTH,
    layout: config.layout,
    maxSteps: config.maxSteps,
    noiseScale: config.noiseScale,
    octaves: config.octaves,
    pull: config.pull,
    radius: config.cableRadius / 1000,
    spacing: config.spacing / 1000,
    spread: config.spread,
    step: config.step,
    strands: config.strands,
    turn: config.turn,
    unit: config.fieldSize / (CANVAS * 2),
  };
}

function plugOf(points) {
  const n = points.length / 3;
  const end = [...points.subarray((n - 1) * 3, n * 3)];
  const before = [...points.subarray((n - 2) * 3, (n - 1) * 3)];
  const d = end.map((v, k) => v - before[k]);
  const length = Math.hypot(...d) || 1;
  return { direction: d.map((v) => v / length), position: end };
}

// What the field is framed on: the turtle's canvas for the flat layout (a
// strand leaves the frame where it leaves the drawing), the cables
// themselves for the tangle.
function boundsOf(cables, config) {
  const half = config.fieldSize / 2;
  let top = 0;
  const min = [Infinity, 0, Infinity];
  const max = [-Infinity, 0, -Infinity];
  cables.forEach(({ points }) => {
    for (let i = 0; i < points.length; i += 3) {
      if (points[i + 1] >= 0) {
        top = Math.max(top, points[i + 1]);
        min[0] = Math.min(min[0], points[i]);
        min[2] = Math.min(min[2], points[i + 2]);
        max[0] = Math.max(max[0], points[i]);
        max[2] = Math.max(max[2], points[i + 2]);
      }
    }
  });
  if (config.layout === 'flat')
    return { max: [half, top, half], min: [-half, 0, -half] };
  return { max: [max[0], top, max[2]], min };
}

// A generation: every strand walked, routed out of the hole and laid.
// Pure in (config, stops).
export default function buildCables(config, { stops = null } = {}) {
  const options = layoutOptions(config);
  const rng = createRng(`cables:${config.fieldSeed}`);
  const strands = walkStrands(options, rng);
  const routes = routeStrands(strands, options, rng);
  const colors = cableColors(
    config,
    routes.length,
    stops,
    createRng(`cables:${config.fieldSeed}:colour`)
  );
  const cables = routes.map(({ points }, index) => ({
    color: colors[index],
    points: Float32Array.from(points),
  }));
  return {
    bounds: boundsOf(cables, config),
    cables,
    hole: options.hole,
    holeDepth: HOLE_DEPTH,
    plugs: config.plugs ? cables.map(({ points }) => plugOf(points)) : [],
    radius: options.radius,
  };
}
