import { cutWindow, entrance, faceOf, spouts, windowGrid } from './details';

const MAX_FLOORS = 110;
const MAX_MODULES = 420;

// Balcony slab and solid upstand per floor along one long face, with the
// glazing set back behind them: the Barbican section.
function balconyFace(book, body, face, c, rng, { floors, from }) {
  const f = faceOf(body, face);
  const yaw = Math.atan2(f.normal[0], f.normal[2]);
  const bd = c.balconyDepth;
  const skip = rng.chance(0.5) ? 4 + Math.floor(rng() * 8) : 0;
  const base = body.center;
  const at = (out, s = 0) => [
    base[0] + f.normal[0] * out + f.tangent[0] * s,
    base[2] + f.normal[2] * out + f.tangent[2] * s,
  ];
  const upstand = rng.range(0.9, 1.3);

  for (let i = 0; i < floors; i += 1) {
    const y0 = from + i * c.floorHeight;
    const sky = skip > 0 && i > 0 && i % skip === 0;
    if (bd > 0.2) {
      const [sx, sz] = at(f.depth + bd / 2);
      book.box(
        [sx, y0 + 0.15, sz],
        [f.width / 2, 0.15, bd / 2 + 0.05],
        'slab',
        {
          yaw,
        }
      );
      if (!sky) {
        const [px, pz] = at(f.depth + bd - 0.12);
        book.box(
          [px, y0 + 0.3 + upstand / 2, pz],
          [f.width / 2, upstand / 2, 0.12],
          'parapet',
          { yaw }
        );
      }
    }
    const inset = sky ? rng.range(3, 6) : rng.range(0.3, 0.8);
    cutWindow(book, f, {
      height: c.floorHeight - (sky ? 0.5 : 0.9),
      inset,
      role: sky ? 'recess' : 'window',
      s: 0,
      width: f.width - (sky ? inset * 2 + 1 : 2.4),
      y: y0 + 0.3 + (c.floorHeight - 0.3) / 2 + (sky ? 0 : 0.2),
    });
  }
}

function pilotis(book, body, c, rng) {
  const height = c.pilotis;
  const spacing = rng.range(6, 9.5);
  const count = Math.max(2, Math.floor((body.half[0] * 2 - 2) / spacing));
  const blade = rng.chance(0.5);
  const rowsZ = [-1, 1].map((sz) => sz * (body.half[2] - 1.6));
  for (let i = 0; i < count; i += 1) {
    const x = body.center[0] + ((i + 0.5) / count - 0.5) * count * spacing;
    rowsZ.forEach((z) =>
      book.box(
        [x, (height - 1) / 2, body.center[2] + z],
        blade ? [0.35, (height + 1) / 2, 1.4] : [0.6, (height + 1) / 2, 0.6],
        'column'
      )
    );
  }
  book.box(
    [
      body.center[0] + rng.signed() * body.half[0] * 0.3,
      (height - 1) / 2,
      body.center[2],
    ],
    [rng.range(3, 6), (height + 1) / 2, rng.range(2.5, 4)],
    'core'
  );
}

// Trellick: a separate shaft, joined to the block every few floors, its
// boiler house cantilevered over the top.
function serviceTower(book, body, c, rng, { floors, from }) {
  const side = rng.chance(0.5) ? 1 : -1;
  const w = rng.range(7, 11);
  const d = rng.range(7, 10);
  const gap = rng.range(5, 9);
  const top = from + floors * c.floorHeight * rng.range(1.05, 1.18);
  const x =
    body.center[0] + side * (body.half[0] + c.balconyDepth + gap + w / 2);
  const tower = book.box(
    [x, top / 2 - 1, body.center[2]],
    [w / 2, top / 2 + 1, d / 2],
    'core'
  );
  const every = 3;
  for (let i = every; i < floors; i += every) {
    const y = from + i * c.floorHeight;
    book.box(
      [
        x - side * (w / 2 + gap / 2 + c.balconyDepth / 2),
        y + c.floorHeight * 0.45,
        body.center[2],
      ],
      [
        (gap + c.balconyDepth) / 2 + 0.6,
        c.floorHeight * 0.45,
        rng.range(1.4, 2),
      ],
      'slab'
    );
  }
  const crown = rng.range(5, 9);
  book.box(
    [x + side * rng.range(1, 4), top + crown / 2 - 0.3, body.center[2]],
    [w / 2 + rng.range(2, 5), crown / 2 + 0.3, d / 2 + rng.range(1, 3)],
    'mass'
  );
  const f = faceOf(book.parts[tower], '+z');
  windowGrid(book, f, {
    columns: 1,
    depth: 0.6,
    height: 0.9,
    margin: 1,
    rows: Math.min(40, Math.floor(floors / every)),
    width: 0.9,
    yFrom: from + 2,
    yTo: top - 4,
  });
}

function block(book, c, rng, layout) {
  const tower = layout === 'tower';
  const width = tower
    ? c.footprint * rng.range(0.45, 0.65)
    : c.footprint * rng.range(1.4, 2.1);
  const depth = tower
    ? width * rng.range(0.8, 1)
    : Math.max(12, c.footprint * c.aspect * 0.4);
  const from = c.pilotis;
  const floors = Math.min(
    MAX_FLOORS,
    Math.max(3, Math.round((c.structureHeight - from) / c.floorHeight))
  );
  const bodyHeight = floors * c.floorHeight;
  const bd = c.balconyDepth;
  const body =
    book.parts[
      book.box(
        [0, from + bodyHeight / 2, 0],
        [width / 2 - bd, bodyHeight / 2 + 0.3, depth / 2 - bd],
        'mass'
      )
    ];
  if (c.humanDetail > 0 && from <= 3) {
    entrance(book, faceOf(body, '+x'), rng, { ground: 0, scale: 0.5 });
  }
  (tower ? ['+x', '-x', '+z', '-z'] : ['+z', '-z']).forEach((face) =>
    balconyFace(book, body, face, c, rng, { floors, from })
  );
  if (!tower) {
    ['+x', '-x'].forEach((face) => {
      const f = faceOf(body, face);
      if (rng.chance(c.openings)) {
        windowGrid(book, f, {
          columns: 1,
          depth: 0.8,
          height: 1.2,
          margin: 2,
          rows: Math.min(60, floors),
          width: rng.range(0.6, 1.4),
          yFrom: from + 1,
          yTo: from + bodyHeight,
        });
      }
      if (c.humanDetail > 0) spouts(book, f, rng, 2);
    });
  }

  if (from > 3) pilotis(book, body, c, rng);
  if (rng.chance(0.3 + c.complexity * 0.5))
    serviceTower(book, body, c, rng, { floors, from });

  const plant = rng.range(3, 6);
  book.box(
    [
      body.center[0] + rng.signed() * body.half[0] * 0.4,
      from + bodyHeight + plant / 2,
      0,
    ],
    [
      rng.range(5, 12),
      plant / 2 + 0.3,
      Math.min(body.half[2], rng.range(4, 7)),
    ],
    'mass'
  );
}

// Habitat 67: modules stacked on alternating axes, each resting at least
// half on the one below, the cluster narrowing as it climbs.
function stack(book, c, rng) {
  const unit = rng.range(5, 7);
  const tall = rng.range(3.6, 4.6);
  const levels = Math.max(2, Math.round(c.structureHeight / tall));
  const cols = Math.max(3, Math.round(c.footprint / unit));
  const rows = Math.max(3, Math.round((c.footprint * c.aspect) / unit));
  const filled = new Set();
  const key = (i, j, l) => `${i},${j},${l}`;

  // One try at a module on level `l`; false when its cells are taken or
  // nothing below holds it up.
  function placeModule(l, alongX) {
    const i = Math.floor(rng() * (cols - (alongX ? 1 : 0)));
    const j = Math.floor(rng() * (rows - (alongX ? 0 : 1)));
    const cells = [[i, j], alongX ? [i + 1, j] : [i, j + 1]];
    if (cells.some(([a, b]) => filled.has(key(a, b, l)))) return false;
    if (l > 0 && !cells.some(([a, b]) => filled.has(key(a, b, l - 1)))) {
      return false;
    }
    cells.forEach(([a, b]) => filled.add(key(a, b, l)));
    const cx = ((cells[0][0] + cells[1][0]) / 2 - (cols - 1) / 2) * unit;
    const cz = ((cells[0][1] + cells[1][1]) / 2 - (rows - 1) / 2) * unit;
    const long = unit - 0.15;
    const short = unit / 2 - 0.15;
    const id = book.box(
      [cx, l * tall + tall / 2, cz],
      alongX ? [long, tall / 2 - 0.08, short] : [short, tall / 2 - 0.08, long],
      'mass'
    );
    const sign = rng.chance(0.5) ? '+' : '-';
    const end = faceOf(book.parts[id], `${sign}${alongX ? 'x' : 'z'}`);
    if (rng.chance(0.4 + c.openings * 0.6)) {
      cutWindow(book, end, {
        height: tall * rng.range(0.4, 0.6),
        inset: rng.range(0.4, 1.2),
        s: 0,
        width: unit * rng.range(0.4, 0.8),
        y: l * tall + tall * 0.5,
      });
    }
    return true;
  }

  let modules = 0;
  for (let l = 0; l < levels && modules < MAX_MODULES; l += 1) {
    const alongX = l % 2 === 0;
    const shrink = (1 - l / levels) ** 0.8;
    const target = Math.max(
      1,
      Math.round(cols * rows * 0.22 * shrink * (0.6 + c.complexity))
    );
    let placed = 0;
    for (
      let attempt = 0;
      attempt < target * 8 && placed < target;
      attempt += 1
    ) {
      if (placeModule(l, alongX)) placed += 1;
    }
    modules += placed;
  }

  const cores = 1 + Math.floor(c.complexity * 3);
  for (let i = 0; i < cores; i += 1) {
    const h = levels * tall * rng.range(0.6, 0.95);
    book.box(
      [
        rng.signed() * c.footprint * 0.3,
        h / 2 - 1,
        rng.signed() * c.footprint * c.aspect * 0.3,
      ],
      [rng.range(2.5, 4), h / 2 + 1, rng.range(2.5, 4)],
      'core'
    );
  }
}

export default function habitable(book, c, rng) {
  if (c.layout === 'stack') stack(book, c, rng);
  else block(book, c, rng, c.layout);
  return { ground: 0 };
}
