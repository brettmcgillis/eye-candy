import { hashSeed } from '@modules/flora';

export const ZONE_MODES = [
  'none',
  'voronoi',
  'bands',
  'columns',
  'rings',
  'radial',
  'diagonal',
  'checker',
  'noise',
];

export const SYMMETRIES = [
  'none',
  'mirrorX',
  'mirrorY',
  'quad',
  'kaleido4',
  'rotate2',
  'rotate3',
  'rotate4',
  'rotate6',
  'kaleido6',
];

// Rotates a point into the first of `n` equal sectors about the centre.
function turnInto([x, y], n) {
  const sector = (2 * Math.PI) / n;
  const angle = Math.atan2(y, x) + 2 * Math.PI;
  const turns = Math.floor(angle / sector + 1e-9) % n;
  const cos = Math.cos(-turns * sector);
  const sin = Math.sin(-turns * sector);
  return [x * cos - y * sin, x * sin + y * cos];
}

export function fold([x, y], symmetry) {
  switch (symmetry) {
    case 'mirrorX':
      return [Math.abs(x), y];
    case 'mirrorY':
      return [x, Math.abs(y)];
    case 'quad':
      return [Math.abs(x), Math.abs(y)];
    case 'rotate2':
      return y < 0 || (y === 0 && x < 0) ? [-x, -y] : [x, y];
    case 'rotate3':
      return turnInto([x, y], 3);
    case 'rotate4':
      return turnInto([x, y], 4);
    case 'rotate6':
      return turnInto([x, y], 6);
    case 'kaleido4': {
      const ax = Math.abs(x);
      const ay = Math.abs(y);
      return ay > ax ? [ay, ax] : [ax, ay];
    }
    case 'kaleido6': {
      const [tx, ty] = turnInto([x, y], 6);
      const mirror = Math.PI / 6;
      if (Math.atan2(ty, tx) <= mirror) return [tx, ty];
      const cos = Math.cos(2 * mirror);
      const sin = Math.sin(2 * mirror);
      return [tx * cos + ty * sin, tx * sin - ty * cos];
    }
    default:
      return [x, y];
  }
}

const unit = (seed, n) => (hashSeed(`${seed}:${n}`) % 100000) / 100000;

function valueNoise(seed, x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const s = (t) => t * t * (3 - 2 * t);
  const v = (i, j) => unit(seed, `${ix + i},${iy + j}`);
  const top = v(0, 0) + (v(1, 0) - v(0, 0)) * s(fx);
  const bottom = v(0, 1) + (v(1, 1) - v(0, 1)) * s(fx);
  return top + (bottom - top) * s(fy);
}

// A zone index in [0, count) for a point in panel-centred, half-extent
// normalised coordinates (the panel spans -1..1 on its longer side).
export function createZoner({ count, mode, seed }) {
  const n = Math.max(1, Math.round(count));
  const clampZone = (z) => Math.min(n - 1, Math.max(0, Math.floor(z)));
  const sites = Array.from({ length: n }, (_, i) => [
    unit(seed, `sx${i}`) * 2 - 1,
    unit(seed, `sy${i}`) * 2 - 1,
  ]);

  switch (mode) {
    case 'voronoi':
      return ([x, y]) => {
        let best = 0;
        let bestD = Infinity;
        sites.forEach(([sx, sy], i) => {
          const d = (x - sx) ** 2 + (y - sy) ** 2;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        return best;
      };
    case 'bands':
      return ([, y]) => clampZone(((y + 1) / 2) * n);
    case 'columns':
      return ([x]) => clampZone(((x + 1) / 2) * n);
    case 'rings':
      return ([x, y]) => clampZone((Math.hypot(x, y) / Math.SQRT2) * n);
    case 'radial':
      return ([x, y]) =>
        clampZone(((Math.atan2(y, x) + Math.PI) / (2 * Math.PI)) * n);
    case 'diagonal':
      return ([x, y]) => clampZone(((x + y + 2) / 4) * n);
    case 'checker':
      return ([x, y]) => {
        const side = Math.max(1, Math.ceil(Math.sqrt(n)));
        const cx = Math.floor(((x + 1) / 2) * side);
        const cy = Math.floor(((y + 1) / 2) * side);
        return (cx + cy) % n;
      };
    case 'noise':
      return ([x, y]) =>
        clampZone(
          valueNoise(seed, x * 1.6 + 7, y * 1.6 + 3) * n * 1.4 - n * 0.2
        );
    default:
      return () => 0;
  }
}
