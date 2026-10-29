// The triangular lattice a triangle-shaped field lives on. Lattice point
// (a, b) sits at a·e1 + b·e2 with e1 = (1, 0) and e2 = (1/2, H) in the
// field's micro-cell units, y down. A cell is { column: a, row: b, size: n,
// up }: down cells (apex down) have corners (a, b), (a + n, b), (a, b + n);
// up cells complete the rhombus, (a + n, b), (a + n, b + n), (a, b + n).
// Corners run clockwise on screen, so a fan about corner i opens from the
// direction of corner i + 1 towards corner i + 2.
export const H = Math.sqrt(3) / 2;
export const TRIANGLE = 'triangle';

export const isTriangleCell = (cell) => cell?.shape === TRIANGLE;

export const latticePoint = (a, b) => [a + b / 2, b * H];

export const toLattice = (x, y) => [x - y / (2 * H), y / H];

export function cellCorners({ column: a, row: b, size: n, up }) {
  return up
    ? [
        [a + n, b],
        [a + n, b + n],
        [a, b + n],
      ]
    : [
        [a, b],
        [a + n, b],
        [a, b + n],
      ];
}

export const cornerPoints = (cell) =>
  cellCorners(cell).map(([a, b]) => latticePoint(a, b));

// The centre of the cell's bounding box, which is where its instance quad sits.
export function cellCenter({ column: a, row: b, size: n, up }) {
  return [a + b / 2 + (up ? n : n / 2), (b + n / 2) * H];
}

export function cellBox(cell) {
  const [x, y] = cellCenter(cell);
  const halfH = (cell.size * H) / 2;
  return {
    x0: x - cell.size / 2,
    x1: x + cell.size / 2,
    y0: y - halfH,
    y1: y + halfH,
  };
}

export function centroid(cell) {
  const [x, y] = cellCenter(cell);
  return [x, y + ((cell.up ? 1 : -1) * cell.size * H) / 6];
}

// The angle (y down) a corner's fan starts at: towards the next corner clockwise.
export const fanStart = (corner, up) =>
  (corner * 2 * Math.PI) / 3 + (up ? Math.PI / 3 : 0);

export const FAN_SPAN = Math.PI / 3;

export const microKey = (a, b, up) => `${a},${b},${up ? 1 : 0}`;

export function microTriangles({ column: a, row: b, size: n, up }) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (up) {
        if (i + j >= n - 1) out.push([a + i, b + j, true]);
        if (i + j >= n) out.push([a + i, b + j, false]);
      } else {
        if (i + j <= n - 1) out.push([a + i, b + j, false]);
        if (i + j <= n - 2) out.push([a + i, b + j, true]);
      }
    }
  }
  return out;
}

export function microAt(x, y) {
  const [u, v] = toLattice(x, y);
  const a = Math.floor(u);
  const b = Math.floor(v);
  return [a, b, u - a + (v - b) >= 1];
}

export function containsPoint({ column: a, row: b, size: n, up }, x, y) {
  const [u, v] = toLattice(x, y);
  const du = u - a;
  const dv = v - b;
  return up
    ? du <= n && dv <= n && du + dv >= n
    : du >= 0 && dv >= 0 && du + dv <= n;
}

// The lattice cell of size n and orientation whose centroid lies nearest (x, y).
export function cellNear(x, y, n, up) {
  const [u, v] = toLattice(x, y);
  const offset = up ? (2 * n) / 3 : n / 3;
  return {
    column: Math.round(u - offset),
    row: Math.round(v - offset),
    size: n,
    up,
  };
}

export function brushCell(x, y, size, orientation = 'auto') {
  if (orientation !== 'auto') return cellNear(x, y, size, orientation === 'up');
  const [column, row, up] = microAt(x / size, y / size);
  return { column: column * size, row: row * size, size, up };
}

// The cell whose three lattice corners these are (in any order), with the
// index each given corner takes in it.
export function cellFromCorners(points, size) {
  const has = (a, b) => points.some(([pa, pb]) => pa === a && pb === b);
  const down = points.find(([a, b]) => has(a + size, b) && has(a, b + size));
  const cell = down
    ? { column: down[0], row: down[1], size, up: false }
    : (() => {
        const [a, b] = points.find(
          ([pa, pb]) => has(pa - size, pb) && has(pa, pb - size)
        );
        return { column: a - size, row: b - size, size, up: true };
      })();
  const corners = cellCorners(cell);
  const order = points.map(([a, b]) =>
    corners.findIndex(([ca, cb]) => ca === a && cb === b)
  );
  return { cell, order };
}

// Family types for triangle cells, after the square ones (0-3). A fan's edge
// packs its corner, the cell's orientation and its reach: corner + 3·up +
// 6·long. Rings carry 3·up. Both the shader and the CPU read them through
// the helpers below, so the band counts cannot drift apart.
export const FAN = 4;
export const RINGS = 5;
const LONG_REACH = 0.75;

export const fanEdge = (corner, up, long = false, reference = false) =>
  corner + (up ? 3 : 0) + (long ? 6 : 0) + (reference ? 12 : 0);

export const ringsEdge = (up) => (up ? 3 : 0);

export const decodeEdge = (edge) => ({
  corner: edge % 3,
  long: Math.floor(edge / 6) % 2 === 1,
  reference: edge >= 12,
  up: Math.floor(edge / 3) % 2 === 1,
});

// A fan's arcs sit at (k + 1/2) / pathDiv, k = 0..bands - 1, so no arc ever
// crosses a side at a lattice point, where a smaller neighbour's corner may
// be. A fan covers its two half-sides; the one on top of a three-way cell
// reaches three quarters of the way instead.
export function fanBands(size, pathDiv, long, reference = false) {
  const bands =
    Math.floor(
      size * pathDiv * (long ? LONG_REACH : 0.5) + (reference ? 0 : 0.5)
    ) + (reference ? 1 : 0);
  return reference
    ? Math.max(1, Math.min(bands, Math.floor(size * pathDiv * H + 0.5)))
    : bands;
}

export const fanRadius = (k, pathDiv) => (k + 0.5) / pathDiv;

export const inradius = (size) => size / (4 * H);

// Rings keep the lattice pitch while the incircle has room for one, and
// otherwise draw a single ring on it.
export function ringPitch(size, pathDiv) {
  const r = inradius(size);
  const bands = Math.max(1, Math.floor(r * pathDiv));
  return { bands, pitch: Math.min(1 / pathDiv, r / bands) };
}

// Irregular families a bigger cell draws for a smaller one's side against
// its closed side. A pocket (type 6) is semicircles into the cell about a
// point on its side `side` (corner side to side + 1), `offset2` half-units
// from that corner, for a stretch m long; a bend (type 7) is a fan about a
// corner reaching m, carrying a stretch on one side round to the other.
export const POCKET = 6;
export const BEND = 7;
const POCKET_SLOTS = 512;

export const pocketEdge = (side, up, offset2, m) =>
  side + (up ? 3 : 0) + 6 * (offset2 + POCKET_SLOTS * m);

export const bendEdge = (corner, up, m) => corner + (up ? 3 : 0) + 6 * m;

export function decodeIrregular(edge) {
  const rest = Math.floor(edge / 6);
  return {
    corner: edge % 3,
    m: Math.floor(rest / POCKET_SLOTS),
    offset2: rest % POCKET_SLOTS,
    reach: rest,
    up: Math.floor(edge / 3) % 2 === 1,
  };
}

// A pocket meets its stretch's crossings, which sit half a pitch off the
// lattice, at radii (k + odd) / pathDiv about the stretch's middle.
export function pocketRadii(m, pathDiv) {
  const span = m * pathDiv;
  const odd = span % 2 === 0 ? 0.5 : 0;
  const from = odd > 0 ? 0 : 1;
  const to = Math.floor((span - 1) / 2);
  return Array.from(
    { length: Math.max(0, to - from + 1) },
    (_, i) => (from + i + odd) / pathDiv
  );
}

export const TRI_STUB = 9;
export const TRI_TURN = 10;

export function returnRadii(type, size, pathDiv) {
  const n = Math.round(size * pathDiv);
  if (type === TRI_TURN)
    return Array.from({ length: n }, (_, k) => (k + 0.5) / pathDiv);
  const odd = n % 2;
  return Array.from(
    { length: Math.floor(n / 2) },
    (_, k) => (k + (odd ? 1 : 0.5)) / pathDiv
  );
}

export function returnPoint(cell, type, edge, radius, along) {
  const side = edge % 3;
  const points = cornerPoints(cell);
  const start = fanStart(side, cell.up);
  const turn = type === TRI_TURN;
  const span = turn ? Math.PI / 3 : Math.PI;
  const angle = start + along * span;
  const relative = (along - 0.5) * span;
  const cosine = Math.cos(relative);
  const sine = Math.sin(relative);
  const pivot = turn
    ? points[side]
    : [
        (points[side][0] + points[(side + 1) % 3][0]) / 2,
        (points[side][1] + points[(side + 1) % 3][1]) / 2,
      ];
  const outer = turn ? cell.size : cell.size / 2;
  let lo = 0;
  let hi = turn
    ? (cell.size * H) / cosine
    : Math.min(outer, outer / (Math.abs(sine) + cosine / Math.sqrt(3)));
  for (let k = 0; k < 36; k += 1) {
    const distance = (lo + hi) / 2;
    const x = distance * cosine;
    const y = distance * sine;
    const open = turn ? (x * x) / 3 - y * y : cell.size * x;
    const closed = turn
      ? cell.size * (cell.size * H - x)
      : (outer - x / Math.sqrt(3)) ** 2 - y * y;
    const weight =
      (open * open) / Math.max(1e-20, open * open + closed * closed);
    const value = distance + (outer - distance) * weight;
    if (value < radius) lo = distance;
    else hi = distance;
  }
  const distance = radius === 0 ? 0 : (lo + hi) / 2;
  return [
    pivot[0] + Math.cos(angle) * distance,
    pivot[1] + Math.sin(angle) * distance,
  ];
}
