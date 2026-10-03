import { placePoint } from './parts';

// The details a viewer measures a building by: a door they could walk
// through, a step, a spout. They are tiny next to the masses on purpose.

export const FACES = ['+x', '-x', '+z', '-z'];

const AXES = {
  '+x': { n: 0, sign: 1, u: 2 },
  '-x': { n: 0, sign: -1, u: 2 },
  '+z': { n: 2, sign: 1, u: 0 },
  '-z': { n: 2, sign: -1, u: 0 },
};

// A vertical face of an unleaned box part: its width along the face, its
// height, and its normal and tangent in world space.
export function faceOf(part, face) {
  const { n, sign, u } = AXES[face];
  const normalLocal = [0, 0, 0];
  normalLocal[n] = sign;
  const tangentLocal = [0, 0, 0];
  tangentLocal[u] = 1;
  const origin = placePoint(part, [0, 0, 0]);
  const toWorld = (v) => placePoint(part, v).map((c, a) => c - origin[a]);
  return {
    bottom: part.center[1] - part.half[1],
    depth: part.half[n],
    face,
    normal: toWorld(normalLocal),
    part,
    tangent: toWorld(tangentLocal),
    top: part.center[1] + part.half[1],
    width: part.half[u] * 2,
  };
}

// A box in the face's frame: `s` along the face from its centre, `y` the
// world height of its centre, `inset` how deep its back sits behind the
// face. `back` names the local axis and sign of the face that becomes the
// opening's back wall, where the glass is.
function faceBox(f, { height, inset, outset = 0.6, s, width, y }) {
  const { n, sign, u } = AXES[f.face];
  const span = inset + outset;
  const local = [0, y - f.part.center[1], 0];
  local[n] = sign * (f.depth - inset + span / 2);
  local[u] = s;
  const half = [0, height / 2, 0];
  half[n] = span / 2;
  half[u] = width / 2;
  return {
    back: [n, -sign],
    center: placePoint(f.part, local),
    half,
    yaw: f.part.yaw,
  };
}

function facePane(f, { height, inset, s, width, y }) {
  const { n, sign, u } = AXES[f.face];
  const local = [0, y - f.part.center[1], 0];
  local[n] = sign * (f.depth - inset + 0.04);
  local[u] = s;
  const half = [0, height / 2, 0];
  half[n] = 0.02;
  half[u] = width / 2;
  return { center: placePoint(f.part, local), half, yaw: f.part.yaw };
}

export function cutWindow(book, f, window) {
  book.cut(f.part.id, {
    ...faceBox(f, window),
    pane: facePane(f, window),
    role: window.role ?? 'window',
  });
}

// A grid of openings over a band of the face, kept off its edges.
export function windowGrid(
  book,
  f,
  { columns, depth, height, margin = 2, rows, width, yFrom, yTo }
) {
  const span = f.width - margin * 2;
  if (columns < 1 || rows < 1 || span < width) return;
  const pitchS = columns > 1 ? (span - width) / (columns - 1) : 0;
  const pitchY = rows > 1 ? (yTo - yFrom - height) / (rows - 1) : 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      cutWindow(book, f, {
        height,
        inset: depth,
        s: columns > 1 ? -span / 2 + width / 2 + c * pitchS : 0,
        width,
        y: yFrom + height / 2 + r * pitchY,
      });
    }
  }
}

// A face point offset outward from the wall, in world space.
function outFrom(f, s, y, out) {
  const base = placePoint(f.part, [0, 0, 0]);
  return [
    base[0] + f.normal[0] * (f.depth + out) + f.tangent[0] * s,
    y,
    base[2] + f.normal[2] * (f.depth + out) + f.tangent[2] * s,
  ];
}

const yawOf = (f) => Math.atan2(f.normal[0], f.normal[2]);

// A door too big for anyone, and beside it one that is not, up a short
// flight of steps.
export function entrance(book, f, rng, { ground = 0, scale = 1 } = {}) {
  const giantHeight = Math.min(f.top - ground - 4, rng.range(9, 16) * scale);
  const giantWidth = Math.min(f.width * 0.3, giantHeight * rng.range(0.4, 0.6));
  const s = rng.range(-0.15, 0.15) * f.width;
  if (giantHeight > 4 && giantWidth > 2) {
    cutWindow(book, f, {
      height: giantHeight + 1,
      inset: rng.range(2.5, 5),
      role: 'door',
      s,
      width: giantWidth,
      y: ground + (giantHeight - 1) / 2,
    });
  }

  const rise = 0.17;
  const steps = 4 + Math.floor(rng() * 4);
  const doorY = ground + steps * rise;
  const side = rng.chance(0.5) ? 1 : -1;
  const doorS = s + side * (giantWidth / 2 + rng.range(4, 9));
  if (Math.abs(doorS) > f.width / 2 - 2) return;

  cutWindow(book, f, {
    height: 2.3,
    inset: 0.7,
    role: 'door',
    s: doorS,
    width: 1.1,
    y: doorY + 1.15,
  });
  const yaw = yawOf(f);
  const tread = 0.3;
  const footing = 0.4;
  for (let i = 0; i < steps; i += 1) {
    const top = ground + (i + 1) * rise;
    const reach = (steps - i) * tread + 0.1;
    book.box(
      outFrom(f, doorS, (top + ground - footing) / 2, reach / 2 - 0.1),
      [0.9 - i * 0.004, (top - ground + footing) / 2, reach / 2],
      'step',
      { yaw }
    );
  }
  book.box(outFrom(f, doorS, doorY + 2.55, 0.6), [1.0, 0.09, 0.6], 'slab', {
    yaw,
  });
}

// Drain spouts just under a roof edge: short square throats that throw
// water clear of the wall, each leaving a streak below it.
export function spouts(book, f, rng, count) {
  const yaw = yawOf(f);
  for (let i = 0; i < count; i += 1) {
    const s = ((i + 0.5) / count - 0.5) * f.width * 0.9;
    book.box(outFrom(f, s, f.top - 0.7, 0.5), [0.18, 0.18, 0.6], 'spout', {
      yaw,
    });
  }
}

// Picks which windows have a light on: the kernel decides, so the scene and
// the CLI light the same ones.
export function lightWindows(book, rng, count) {
  const candidates = book.cutters.filter(
    (cutter) => cutter.role === 'window' && cutter.pane
  );
  for (let i = 0; i < count && candidates.length > 0; i += 1) {
    const [cutter] = candidates.splice(
      Math.floor(rng() * candidates.length),
      1
    );
    book.light({ ...cutter.pane, part: cutter.part, warmth: rng() });
  }
}
