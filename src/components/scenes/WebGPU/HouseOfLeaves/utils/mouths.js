import {
  angleAt,
  axisAt,
  hash01,
  openingScaleFor,
  riseTo,
  wallRadiusAt,
} from '@modules/houseOfLeaves';

// Which landings have hallways leaving them, and where. Every mouth is the
// same rectangular profile and never the same size twice. Each becomes a
// patch of the wall grid — its own rows and columns, padded by two cells —
// that the wall leaves out and the patch redraws with the hole cut through.
export default function collectMouths(landings, config, grid) {
  const p = config.shaft;
  const out = [];
  landings.forEach((landing) => {
    // The top landing is the rim: a hallway there would stand in the room.
    if (landing.virtual || landing.index === 0) return;
    const roll = hash01(landing.index * 4.13 + 0.9);
    let count = 0;
    if (roll >= config.mouthChanceNone) {
      count = roll < config.mouthChanceNone + config.mouthChanceOne ? 1 : 2;
    }
    if (count === 0) return;
    const depth = riseTo(landing.u, p);
    const axis = axisAt(landing.u, p);
    const radius = wallRadiusAt(landing.u, p);
    const fractions = count === 1 ? [0.5] : [0.25, 0.75];
    fractions.forEach((fraction, i) => {
      const u = landing.u + landing.plateau * fraction;
      const angle = angleAt(u, p);
      const scale = openingScaleFor(landing.index * 3 + i, config.mouthSpread);
      const width = Math.min(radius * 0.6, config.mouthWidth * scale);
      const height = config.mouthHeight * scale;
      const halfAngle = (width * 0.5) / radius;
      const c0 = Math.floor(grid.colOf(angle - halfAngle)) - 2;
      const c1 =
        Math.ceil(
          grid.colOf(angle - halfAngle) + (2 * halfAngle) / grid.angleOf(1)
        ) + 2;
      const rowTop = Math.floor(grid.rowOfDepth(depth - height - 1.5));
      const rowBottom = Math.ceil(grid.rowOfDepth(depth + 1.5));
      out.push({
        key: `${landing.index}:${i}`,
        index: landing.index,
        u,
        angle,
        x: axis.x + Math.cos(angle) * radius,
        z: axis.z + Math.sin(angle) * radius,
        y: -depth,
        sill: -depth + 0.02,
        width,
        height,
        depth: config.mouthDepth,
        reach: 2,
        open: false,
        rows: [Math.max(0, rowTop), rowBottom],
        cols: [c0, c1],
        flare: hash01(landing.index * 9.7 + i * 2.3) < config.flareChance,
      });
    });
  });
  return out;
}

export function collectLandingFlares(landings, config) {
  const p = config.shaft;
  return landings
    .filter(
      (landing) =>
        !landing.virtual &&
        landing.index > 0 &&
        hash01(landing.index * 6.1 + 1.7) < config.flareLandingChance
    )
    .map((landing) => {
      const u =
        landing.u + landing.plateau * (0.3 + 0.4 * hash01(landing.index * 2.9));
      const axis = axisAt(u, p);
      const angle = angleAt(u, p);
      const radius =
        wallRadiusAt(u, p) -
        p.wallGap -
        p.stairWidth * (0.25 + 0.5 * hash01(landing.index * 5.3));
      return {
        key: `flare${landing.index}`,
        index: landing.index,
        position: [
          axis.x + Math.cos(angle) * radius,
          -riseTo(landing.u, p),
          axis.z + Math.sin(angle) * radius,
        ],
      };
    });
}
