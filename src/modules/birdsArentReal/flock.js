import { createRng } from '@modules/flora';

const DEG = Math.PI / 180;

// The box one posed FakeBird fills in its own frame (it stands on y = 0
// and faces +Z), measured over its whole look-around clip with the largest
// camera head the roll gives and the lens swept and staring.
export const BIRD_BOX = { max: [0.32, 0.75, 0.52], min: [-0.31, 0, -0.59] };

function scatterCluster(rng, count, spacing) {
  const minDistance = spacing;
  const radius = spacing * (0.35 + 0.6 * Math.sqrt(count));
  const placed = [];
  for (let i = 0; i < count; i += 1) {
    let best = null;
    let bestGap = -Infinity;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const angle = rng() * Math.PI * 2;
      const r = radius * Math.sqrt(rng());
      const candidate = [Math.cos(angle) * r, Math.sin(angle) * r];
      const gap = placed.length
        ? Math.min(
            ...placed.map(([x, z]) =>
              Math.hypot(candidate[0] - x, candidate[1] - z)
            )
          )
        : Infinity;
      if (gap >= minDistance) {
        best = candidate;
        break;
      }
      if (gap > bestGap) {
        bestGap = gap;
        best = candidate;
      }
    }
    placed.push(best);
  }
  return placed;
}

function placeLine(rng, count, spacing, scatter) {
  return Array.from({ length: count }, (_, i) => [
    (i - (count - 1) / 2) * spacing + rng.signed() * scatter * spacing * 0.5,
    rng.signed() * scatter * spacing * 0.5,
  ]);
}

function placeRing(rng, count, spacing, scatter) {
  const radius = Math.max((spacing * count) / (2 * Math.PI), spacing * 0.9);
  const offset = rng() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const angle =
      offset + ((i + rng.signed() * scatter * 0.3) / count) * Math.PI * 2;
    const r = radius * (1 + rng.signed() * scatter * 0.25);
    return [Math.sin(angle) * r, Math.cos(angle) * r];
  });
}

function headingFor(facing, [x, z], rng) {
  if (facing === 'random') return rng() * Math.PI * 2;
  if (Math.hypot(x, z) < 1e-6) return 0;
  if (facing === 'inward') return Math.atan2(-x, -z);
  if (facing === 'outward') return Math.atan2(x, z);
  return 0;
}

// Where each FakeBird of a generation stands, which way it faces (radians
// about +Y; 0 faces +Z, toward an azimuth-0 camera) and the phase that
// offsets its clip and lens sweep — all from the config, so a preset
// reproduces its flock.
export default function layoutFlock(config) {
  const count = Math.max(1, Math.round(config.birdCount));
  const rng = createRng(`flock:${config.flockSeed}`);
  const place = rng.fork('place');
  const placers = {
    cluster: () => scatterCluster(place, count, config.spacing),
    line: () => placeLine(place, count, config.spacing, config.scatter),
    ring: () => placeRing(place, count, config.spacing, config.scatter),
  };
  const spots = (placers[config.arrangement] ?? placers.cluster)();
  const cx = spots.reduce((sum, [x]) => sum + x, 0) / count;
  const cz = spots.reduce((sum, [, z]) => sum + z, 0) / count;
  const turn = rng.fork('heading');
  const phase = rng.fork('phase');
  return spots.map(([x, z], i) => {
    const spot = [x - cx, z - cz];
    return {
      key: `bird${i}`,
      phase: phase.range(0, 15),
      position: [spot[0], 0, spot[1]],
      rotationY:
        headingFor(config.facing, spot, turn) +
        turn.signed() * config.headingJitter * DEG,
    };
  });
}

// One bird's box corners in world space.
export function birdCorners(bird) {
  const c = Math.cos(bird.rotationY);
  const s = Math.sin(bird.rotationY);
  const corners = [];
  [BIRD_BOX.min[0], BIRD_BOX.max[0]].forEach((x) =>
    [BIRD_BOX.min[1], BIRD_BOX.max[1]].forEach((y) =>
      [BIRD_BOX.min[2], BIRD_BOX.max[2]].forEach((z) =>
        corners.push([
          bird.position[0] + x * c + z * s,
          bird.position[1] + y,
          bird.position[2] - x * s + z * c,
        ])
      )
    )
  );
  return corners;
}

// The flock's extent: its box corners (what the framing fits) and the
// sphere round them (what the key light's shadow camera covers).
export function flockBounds(birds) {
  const points = birds.flatMap(birdCorners);
  const lo = [0, 1, 2].map((k) => Math.min(...points.map((p) => p[k])));
  const hi = [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k])));
  const center = lo.map((v, k) => (v + hi[k]) / 2);
  const radius = Math.max(
    ...points.map((p) =>
      Math.hypot(p[0] - center[0], p[1] - center[1], p[2] - center[2])
    )
  );
  return { center, points, radius };
}
