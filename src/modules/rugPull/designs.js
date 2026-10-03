// Field designs. Each paints the field inside the borders and names the
// borders it reads best with; the house motifs come in through `ctx.mine`.
import {
  animal,
  bird,
  boteh,
  botehTile,
  comb,
  cypress,
  diamondDot,
  first,
  heratiTile,
  hookedCross,
  hookedLozenge,
  lobedMedallion,
  minaKhaniTile,
  minorGul,
  palmette,
  place,
  rosette,
  shahAbbasiTile,
  smallStar,
  star8,
  stepped,
  steppedMedallion,
  treeOfLife,
  turkmenGul,
  vase,
} from './motifs';
import { R } from './palettes';
import { MINE_ASPECT, mineMedallion, mineMotif, mineYarns } from './personal';
import { box, ellipse, rhombus } from './sdf';

/* eslint-disable no-bitwise */
// Mirror-symmetric per-cell dice: |i|, |j| hash the same on both halves.
function cellHash(seed, i, j) {
  let h = Math.imul(Math.abs(i) * 73856093 + seed, 0x9e3779b1);
  h ^= Math.imul(Math.abs(j) * 19349663 + 1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}
/* eslint-enable no-bitwise */

function paintField(ctx, painter) {
  const { canvas, field } = ctx;
  canvas.paint(field.x0, field.y0, field.x1, field.y1, (px, py) =>
    painter(px - field.cx, py - field.cy)
  );
}

// Draws `motif` (unit half-width) at knot centre (cx, cy), s knots across.
const at = (motif, cx, cy, s) => (x, y) =>
  motif((x - cx) / s, (y - cy) / s, 1 / s);

// A house motif framed as the field's centrepiece, or as a small cartouche.
function mineCentre(ctx, s, { frame = 'lobed', tall = 1 } = {}) {
  const name = ctx.mine.pick();
  const ground = ctx.ink.accent(ctx.grounds.ground, [R.red, R.dark]);
  const frameYarns = ctx.ink.set(ctx.grounds.ground);
  const inner = mineYarns(ctx.ink, name === 'argyle' ? R.ivory : ground);
  inner.ground = name === 'argyle' ? R.ivory : ground;
  return at(
    mineMedallion({ c: frameYarns, frame, inner, name, tall }),
    0,
    0,
    s
  );
}

function mineTile(ctx, ground) {
  const name = ctx.mine.pick();
  const motif = mineMotif(name, mineYarns(ctx.ink, ground));
  const s = Math.min(0.82, 0.82 / MINE_ASPECT[name]);
  return place(motif, 0, 0, s);
}

// An all-over repeat of square tiles centred on the field, optionally
// half-dropped; `variant(i, j)` picks a tile motif per cell.
function repeat(ctx, size, variant, { halfDrop = false } = {}) {
  const half = size / 2;
  const k = 1 / half;
  return (x, y) => {
    const i = Math.round(x / size);
    const drop = halfDrop && Math.abs(i) % 2 === 1 ? half : 0;
    const j = Math.round((y - drop) / size);
    const lx = (x - i * size) / half;
    const ly = (y - drop - j * size) / half;
    return variant(i, j)(lx, ly, k);
  };
}

function mineSwap(ctx, tiles, ground, salt = 0) {
  if (!ctx.mine.active || ctx.mine.field <= 0) return tiles;
  const house = mineTile(ctx, ground);
  return (i, j) =>
    cellHash(ctx.seed + salt, i, j) < ctx.mine.field ? house : tiles(i, j);
}

// Corner quarter-medallions: lobed for city weaves, stepped for villages.
function spandrels(ctx, { stepped: isStepped = false, scale = 0.34 } = {}) {
  const { field, grounds, ink } = ctx;
  const s = Math.min(field.hw, field.hh) * scale * 2;
  const ground =
    grounds.medallion === grounds.ground ? grounds.border : grounds.medallion;
  const c = ink.set(ground);
  if (isStepped) {
    const star = smallStar({ c: { ...c, a: c.a } });
    return (x, y) => {
      const ax = field.hw - Math.abs(x);
      const ay = field.hh - Math.abs(y);
      const d = (ax + ay - s) / s;
      if (d >= 0) return -1;
      if (d > -1 / s) return c.line;
      const cell = s / 4;
      const lx = ((ax % cell) / cell) * 2 - 1;
      const ly = ((ay % cell) / cell) * 2 - 1;
      const m = d < -0.12 ? star(lx / 0.7, ly / 0.7, 2 / cell / 0.7) : -1;
      return m >= 0 ? m : ground;
    };
  }
  const inner = { ...ink.set(ground), ground };
  const quarter = lobedMedallion({ c, inner, tall: 1, tips: 0 });
  return (x, y) =>
    quarter((Math.abs(x) - field.hw) / s, (Math.abs(y) - field.hh) / s, 1 / s);
}

function pendants(ctx, reach, s, ground) {
  const c = ctx.ink.set(ground);
  const palm = palmette({ c });
  const tip = first(place(palm, 0, -reach, s, 0), place(palm, 0, reach, s, 2));
  return (x, y) => tip(x, y, 1);
}

function signature(ctx) {
  const { field } = ctx;
  const w = Math.max(12, field.hw * 0.3);
  const name = ctx.mine.pick();
  const ground = R.ivory === ctx.grounds.ground ? R.camel : R.ivory;
  const c = ctx.ink.set(ground);
  const motif = mineMotif(name, mineYarns(ctx.ink, ground));
  const fit = Math.min(0.8, 0.56 / MINE_ASPECT[name]);
  const cy = -field.hh + w * 0.85;
  return (x, y) => {
    const lx = x / w;
    const ly = (y - cy) / w;
    const k = 1 / w;
    const d = Math.min(ellipse(lx, ly, 1, 0.6), rhombus(lx, ly, 1.25, 0.3));
    if (d >= 0) return -1;
    if (d > -k) return c.line;
    const m = motif(lx / fit, ly / fit, k / fit);
    return m >= 0 ? m : ground;
  };
}

// --- designs -----------------------------------------------------------------

function city(ctx) {
  const { field, grounds, ink, rng } = ctx;
  const g = grounds.ground;
  const c = ink.set(g);
  const size = field.hw * (0.36 + rng() * 0.16) * ctx.infillScale;
  let makeTile = minaKhaniTile;
  if (rng.chance(0.5)) makeTile = shahAbbasiTile;
  else if (rng.chance(0.6)) makeTile = heratiTile;
  const tileMotif = makeTile({ c });
  paintField(
    ctx,
    repeat(
      ctx,
      size,
      mineSwap(ctx, () => tileMotif, g)
    )
  );
  if (ctx.spandrels) paintField(ctx, spandrels(ctx));
  const s = field.hw * ctx.medallionScale;
  const tall = Math.min(1.5, 1.05 + rng() * 0.45, (field.hh * 0.62) / s);
  const mg = grounds.medallion;
  if (ctx.mine.medallion) {
    paintField(ctx, mineCentre(ctx, s, { frame: 'lobed', tall }));
  } else {
    const medallion = lobedMedallion({
      c: ink.set(mg),
      inner: { ...ink.set(mg), ground: mg },
      lobesN: 12 + 2 * Math.floor(rng() * 5),
      tall,
    });
    paintField(ctx, at(medallion, 0, 0, s));
  }
  if (ctx.pendants)
    paintField(ctx, pendants(ctx, s * tall * 1.32, s * 0.24, mg));
}

function village(ctx) {
  const { field, grounds, ink, rng } = ctx;
  const g = grounds.ground;
  const c = ink.set(g);
  const size = field.hw * (0.5 + rng() * 0.25) * ctx.infillScale;
  const tile = stepped(heratiTile({ c }), 1);
  paintField(
    ctx,
    repeat(
      ctx,
      size,
      mineSwap(ctx, () => tile, g)
    )
  );
  if (ctx.spandrels)
    paintField(ctx, spandrels(ctx, { scale: 0.4, stepped: true }));
  const s = field.hw * ctx.medallionScale * 0.95;
  const tall = Math.min(1.45, (field.hh * 0.6) / s);
  if (ctx.mine.medallion) {
    paintField(ctx, mineCentre(ctx, s, { frame: 'lozenge', tall }));
    return;
  }
  const mg = grounds.medallion;
  const inner = { ...ink.set(g), ground: g === mg ? grounds.border : g };
  paintField(
    ctx,
    at(
      steppedMedallion({
        arms: ctx.pendants,
        c: ink.set(mg),
        inner: { ...inner, b: mg },
        tall,
      }),
      0,
      0,
      s
    )
  );
}

const FILLERS = [
  [smallStar, 3],
  [diamondDot, 2],
  [bird, 1.4],
  [animal, 1.2],
  [comb, 0.8],
  [hookedCross, 1.4],
  [(o) => rosette({ ...o, depth: 0.4, petals: 4 }), 1.2],
  [boteh, 0.6],
];

function scatter(ctx, cell, { avoid = () => false } = {}) {
  const { field, ink, rng } = ctx;
  const g = ctx.grounds.ground;
  const mirrored = !rng.chance(ctx.asymmetry);
  const total = FILLERS.reduce((sum, [, w]) => sum + w, 0);
  const pickFiller = () => {
    let roll = rng() * total;
    for (let i = 0; i < FILLERS.length; i += 1) {
      roll -= FILLERS[i][1];
      if (roll <= 0) return FILLERS[i][0];
    }
    return FILLERS[0][0];
  };
  const nx = Math.ceil((field.hw * 2) / cell) + 1;
  const ny = Math.ceil((field.hh * 2) / cell) + 1;
  const items = new Map();
  const house = ctx.mine.active && ctx.mine.field > 0;
  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const key = mirrored
        ? `${Math.abs(i - Math.floor(nx / 2))},${Math.abs(j - Math.floor(ny / 2))}`
        : `${i},${j}`;
      if (!items.has(key)) {
        const empty = rng.chance(0.18);
        const isMine = house && rng() < ctx.mine.field;
        const yarns = { ...ink.set(g), a: ink.accent(g) };
        const motif = isMine ? mineTile(ctx, g) : pickFiller()({ c: yarns });
        items.set(key, {
          dx: (rng() - 0.5) * cell * 0.2,
          dy: (rng() - 0.5) * cell * 0.2,
          flip: rng.chance(0.5),
          motif: empty ? null : motif,
          s: cell * (0.3 + rng() * 0.12),
        });
      }
    }
  }
  const ox = -((nx - 1) * cell) / 2;
  const oy = -((ny - 1) * cell) / 2;
  return (x, y) => {
    const i = Math.round((x - ox) / cell);
    const j = Math.round((y - oy) / cell);
    const key = mirrored
      ? `${Math.abs(i - Math.floor(nx / 2))},${Math.abs(j - Math.floor(ny / 2))}`
      : `${i},${j}`;
    const item = items.get(key);
    if (!item?.motif) return -1;
    const cx =
      ox + i * cell + (mirrored && i < Math.floor(nx / 2) ? -item.dx : item.dx);
    const cy = oy + j * cell + item.dy;
    if (avoid(cx, cy)) return -1;
    let lx = (x - cx) / item.s;
    if (item.flip !== (mirrored && i < Math.floor(nx / 2))) lx = -lx;
    return item.motif(lx, (y - cy) / item.s, 1 / item.s);
  };
}

function tribal(ctx) {
  const { field, grounds, ink, rng } = ctx;
  const g = grounds.ground;
  const count = 1 + Math.floor(rng() * 3);
  const s = Math.min(
    field.hw * ctx.medallionScale * 0.9,
    (field.hh * 1.6) / (count * 1.35 * 2 + 0.4)
  );
  const tall = 1.3;
  const spacing = s * tall * 2.1;
  const pole = (count - 1) * spacing * 0.5;
  const cell = field.hw * (0.24 + rng() * 0.1) * ctx.infillScale;
  const inPole = (cx, cy) =>
    Math.abs(cx) < s * 1.15 && Math.abs(cy) < pole + s * tall * 1.15;
  paintField(ctx, scatter(ctx, cell, { avoid: inPole }));
  if (ctx.spandrels)
    paintField(ctx, spandrels(ctx, { scale: 0.3, stepped: true }));
  if (ctx.mine.medallion) {
    paintField(ctx, mineCentre(ctx, s * 1.1, { frame: 'lozenge', tall }));
    return;
  }
  const lozenges = Array.from({ length: count }, (_, i) => {
    const ground = i % 2 ? grounds.medallion : grounds.border;
    const c = { ...ink.set(ground), ground: g };
    return at(
      hookedLozenge({ c, hooks: 2 + Math.floor(rng() * 3), rings: 2, tall }),
      0,
      -pole + i * spacing,
      s
    );
  });
  const line = ink.lineOn(g);
  paintField(ctx, (x, y) => {
    for (let i = 0; i < lozenges.length; i += 1) {
      const role = lozenges[i](x, y);
      if (role >= 0) return role;
    }
    if (ctx.pendants && Math.abs(x) < 1 && Math.abs(y) < pole + s * tall * 1.45)
      return line;
    return -1;
  });
}

function gul(ctx) {
  const { field, grounds, ink, rng } = ctx;
  const g = grounds.ground;
  const across = 2 + Math.floor(rng() * 3);
  const cw = (field.hw * 2) / across;
  const ch = cw * (0.72 + rng() * 0.25);
  const down = Math.max(1, Math.round((field.hh * 2) / ch));
  const rowH = (field.hh * 2) / down;
  const gulA = turkmenGul({
    c: {
      ...ink.set(g),
      a: R.ivory === g ? R.blue : R.ivory,
      b: R.blue === g ? R.dark : R.blue,
      c: R.gold,
    },
  });
  const gulB = turkmenGul({
    c: {
      ...ink.set(g),
      a: R.red === g ? R.camel : R.red,
      b: R.ivory === g ? R.dark : R.ivory,
      c: R.blue,
    },
  });
  const minor = minorGul({ c: ink.set(g) });
  const lattice = rng.chance(0.5);
  const line = ink.lineOn(g);
  const house = ctx.mine.active && ctx.mine.field > 0 ? mineTile(ctx, g) : null;
  paintField(ctx, (x, y) => {
    const fx = (x + field.hw) / cw;
    const fy = (y + field.hh) / rowH;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const lx = (fx - i - 0.5) * 2;
    const ly = (fy - j - 0.5) * 2;
    const ci = i - (across - 1) / 2;
    const cj = j - (down - 1) / 2;
    const swap = house && cellHash(ctx.seed, ci * 2, cj * 2) < ctx.mine.field;
    let gulMotif = j % 2 ? gulB : gulA;
    if (swap) gulMotif = house;
    const major = gulMotif(lx / 0.88, ly / 0.8, 2 / cw / 0.88);
    if (major >= 0) return major;
    const mx = (fx - Math.round(fx)) * 2;
    const my = (fy - Math.round(fy)) * 2;
    const m = minor(mx / 0.34, my / 0.3, 2 / cw / 0.34);
    if (m >= 0) return m;
    if (lattice && (Math.abs(lx) < 2 / cw || Math.abs(ly) < 2 / rowH))
      return line;
    return -1;
  });
  if (ctx.mine.medallion)
    paintField(ctx, mineCentre(ctx, cw * 0.55, { frame: 'lozenge' }));
}

function allover(ctx, make, { halfDrop = false, sizeScale = 1 } = {}) {
  const { field, grounds, ink, rng } = ctx;
  const g = grounds.ground;
  const c = ink.set(g);
  const across = 3 + Math.floor(rng() * 4);
  const size = ((field.hw * 2) / across) * ctx.infillScale * sizeScale;
  const tiles = make(c);
  paintField(ctx, repeat(ctx, size, mineSwap(ctx, tiles, g), { halfDrop }));
  if (ctx.mine.medallion)
    paintField(
      ctx,
      mineCentre(ctx, field.hw * ctx.medallionScale, { tall: 1.2 })
    );
}

function herati(ctx) {
  const tile = heratiTile;
  allover(ctx, (c) => {
    const motif = tile({ c });
    return () => motif;
  });
}

function botehField(ctx) {
  allover(
    ctx,
    (c) => {
      const left = botehTile({ c });
      const right = botehTile({ c: { ...c, a: c.b, b: c.a }, flip: true });
      return (i) => (Math.abs(i) % 2 ? right : left);
    },
    { halfDrop: true, sizeScale: 0.8 }
  );
}

function minaKhani(ctx) {
  allover(ctx, (c) => {
    const motif = minaKhaniTile({ c });
    return () => motif;
  });
}

function harlequin(ctx) {
  const { field, grounds, ink, rng } = ctx;
  const g = grounds.ground;
  const across = 3 + Math.floor(rng() * 3);
  const w = (field.hw * 2) / across;
  const h = w * (1.2 + rng() * 0.4);
  const a = ink.accent(g);
  const b = ink.accent(g, [a]);
  const line = ink.lineOn(g);
  const house = ctx.mine.active && ctx.mine.field > 0 ? mineTile(ctx, a) : null;
  paintField(ctx, (x, y) => {
    const u = x / (w / 2);
    const v = y / (h / 2);
    const i = Math.round((u + v) / 2);
    const j = Math.round((v - u) / 2);
    const cu = i - j;
    const cv = i + j;
    const lu = u - cu;
    const lv = v - cv;
    const k = 2 / w;
    const over = Math.min(
      Math.abs(((((u + 1) % 2) + 2) % 2) - 1),
      Math.abs(((((v + 1) % 2) + 2) % 2) - 1)
    );
    if (over < k * 0.5) return line;
    if (
      house &&
      Math.abs(i + j) % 2 === 0 &&
      cellHash(ctx.seed, cu, cv) < ctx.mine.field
    ) {
      const m = house(lu / 0.62, (lv * h) / w / 0.62, k / 0.62);
      if (m >= 0) return m;
    }
    return Math.abs(i + j) % 2 ? a : b;
  });
  if (ctx.mine.medallion)
    paintField(
      ctx,
      mineCentre(ctx, field.hw * ctx.medallionScale, { frame: 'lozenge' })
    );
}

function prayer(ctx) {
  const { field, grounds, ink, rng } = ctx;
  const g = grounds.ground;
  const spandrelGround =
    grounds.medallion === g ? grounds.border : grounds.medallion;
  const aw = field.hw * (0.8 + rng() * 0.12);
  const c0 = aw * (0.45 + rng() * 0.3);
  const radius = aw + c0;
  const rise = Math.sqrt(radius * radius - c0 * c0);
  const spring = -field.hh + rise + field.hh * 0.06;
  const isStepped = ctx.coarse;
  const archD = (x, y) =>
    y < spring
      ? Math.hypot(Math.abs(x) + c0, y - spring) - radius
      : Math.abs(x) - aw;
  const arch = isStepped ? stepped((x, y) => archD(x, y), 2) : archD;
  const spandrelC = ink.set(spandrelGround);
  const fill = rosette({ c: spandrelC, petals: 6 });
  const cell = field.hw * 0.22;
  const line = ink.lineOn(g);
  paintField(ctx, (x, y) => {
    const d = arch(x, y, 1);
    if (d > 2) {
      const lx = ((((x / cell) % 1) + 1.5) % 1) * 2 - 1;
      const ly = ((((y / cell) % 1) + 1.5) % 1) * 2 - 1;
      const m = fill(lx / 0.7, ly / 0.7, 2 / cell / 0.7);
      return m >= 0 ? m : spandrelGround;
    }
    if (d > 0) return line;
    if (d > -2) return spandrelC.a;
    if (d > -3) return line;
    return g;
  });
  const lampC = ink.set(g);
  const lamp = at(vase({ c: lampC }), 0, spring - rise * 0.35, aw * 0.16);
  const chainY = spring - rise + 3;
  paintField(ctx, (x, y) => {
    const m = lamp(x, y);
    if (m >= 0) return m;
    if (Math.abs(x) < 0.6 && y > chainY && y < spring - rise * 0.35 - aw * 0.12)
      return line;
    return -1;
  });
  const bodyH = field.hh - spring;
  if (ctx.mine.medallion) {
    paintField(ctx, mineCentre(ctx, aw * 0.55, { frame: 'oval', tall: 1.2 }));
  } else if (rng.chance(0.6)) {
    const tol = treeOfLife({
      c: { ...ink.set(g), c: R.camel === g ? R.dark : R.camel },
      levels: 4 + Math.floor(rng() * 3),
      rng,
    });
    paintField(
      ctx,
      at(tol, 0, spring + bodyH * 0.45, Math.min(aw * 0.85, bodyH * 0.48))
    );
  } else {
    const cyp = cypress({ c: ink.set(g) });
    paintField(
      ctx,
      at(cyp, 0, spring + bodyH * 0.45, Math.min(aw * 0.5, bodyH * 0.45))
    );
  }
  if (rng.chance(0.6)) {
    const colC = ink.set(g);
    paintField(ctx, (x, y) => {
      if (y < spring || y > field.hh - 2) return -1;
      const d = box(
        Math.abs(x) - aw * 0.86,
        y - (spring + field.hh) / 2,
        1.2,
        (field.hh - spring) / 2
      );
      if (d >= 0) return -1;
      return d > -1 ? colC.line : colC.a;
    });
  }
}

const GARDEN = [
  cypress,
  boteh,
  star8,
  vase,
  (o) => rosette({ ...o, petals: 8 }),
];

function garden(ctx) {
  const { field, grounds, ink, rng } = ctx;
  const across = 2 + Math.floor(rng() * 3);
  const cw = (field.hw * 2) / across;
  const down = Math.max(
    2,
    Math.round((field.hh * 2) / (cw * (1.1 + rng() * 0.4)))
  );
  const ch = (field.hh * 2) / down;
  const grounds2 = [
    grounds.ground,
    grounds.medallion === grounds.ground ? grounds.border : grounds.medallion,
  ];
  const yarns = grounds2.map((gr) => ink.set(gr));
  const kinds = GARDEN.map((make) => yarns.map((c) => make({ c })));
  const house = ctx.mine.active && ctx.mine.field > 0;
  const mineTiles = house ? grounds2.map((gr) => mineTile(ctx, gr)) : null;
  paintField(ctx, (x, y) => {
    const fx = (x + field.hw) / cw;
    const fy = (y + field.hh) / ch;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const ci = i - (across - 1) / 2;
    const cj = j - (down - 1) / 2;
    const tone =
      (Math.abs(Math.round(ci * 2)) + Math.abs(Math.round(cj * 2))) % 2;
    const lx = (fx - i - 0.5) * 2;
    const ly = (fy - j - 0.5) * 2;
    const kx = 2 / cw;
    const ky = 2 / ch;
    if (Math.abs(lx) > 1 - kx * 1.2 || Math.abs(ly) > 1 - ky * 1.2)
      return ink.lineOn(grounds2[tone]);
    const h = cellHash(ctx.seed, Math.round(ci * 2), Math.round(cj * 2));
    const motif =
      mineTiles && h < ctx.mine.field
        ? mineTiles[tone]
        : kinds[Math.floor(h * 997) % kinds.length][tone];
    const m = motif(lx / 0.78, (ly * ch) / cw / 0.78, kx / 0.78);
    return m >= 0 ? m : grounds2[tone];
  });
  if (ctx.mine.medallion)
    paintField(ctx, mineCentre(ctx, cw * 0.6, { frame: 'oval' }));
}

function tree(ctx) {
  const { field, grounds, ink, rng } = ctx;
  const g = grounds.ground;
  const cell = field.hw * 0.3 * ctx.infillScale;
  const fillC = ink.set(g);
  const sprinkle = smallStar({ c: { ...fillC, a: ink.accent(g) } });
  paintField(ctx, (x, y) => {
    const i = Math.round(x / cell);
    const j = Math.round(y / cell);
    if ((Math.abs(i) + Math.abs(j)) % 2) return -1;
    const m = sprinkle(
      (x - i * cell) / (cell * 0.16),
      (y - j * cell) / (cell * 0.16),
      1 / (cell * 0.16)
    );
    return m;
  });
  const s = Math.min(field.hw * 0.92, field.hh * 0.78);
  if (ctx.mine.medallion) {
    paintField(
      ctx,
      mineCentre(ctx, field.hw * ctx.medallionScale, {
        frame: 'oval',
        tall: 1.3,
      })
    );
  } else {
    const c = { ...ink.set(g), c: R.camel === g ? R.dark : R.camel };
    paintField(
      ctx,
      at(
        treeOfLife({ c, levels: 5 + Math.floor(rng() * 3), rng }),
        0,
        -field.hh * 0.08,
        s
      )
    );
  }
  const potC = ink.set(g);
  paintField(ctx, at(vase({ c: potC }), 0, field.hh - s * 0.24, s * 0.2));
  const birdC = ink.set(g);
  const birdMotif = bird({ c: birdC });
  const perches = [-0.5, -0.1, 0.3].map((t) => [field.hw * 0.62, field.hh * t]);
  paintField(ctx, (x, y) => {
    for (let i = 0; i < perches.length; i += 1) {
      const [px, py] = perches[i];
      const lx = (Math.abs(x) - px) / (field.hw * 0.12);
      const role = birdMotif(
        x < 0 ? lx : -lx,
        (y - py) / (field.hw * 0.12),
        1 / (field.hw * 0.12)
      );
      if (role >= 0) return role;
    }
    return -1;
  });
}

// knots: weave density range across the width; coarse designs read best low.
export const DESIGNS = {
  city: {
    border: ['herati', 'rosettePalmette', 'cartouche'],
    knots: [170, 280],
    paint: city,
  },
  village: {
    border: ['hookedDiamonds', 'rosettePalmette', 'kufic'],
    coarse: true,
    knots: [96, 150],
    paint: village,
  },
  tribal: {
    border: ['starRow', 'hookedDiamonds', 'runningDog'],
    coarse: true,
    knots: [80, 130],
    paint: tribal,
  },
  gul: {
    border: ['kufic', 'starRow', 'hookedDiamonds'],
    coarse: true,
    knots: [100, 160],
    paint: gul,
  },
  herati: {
    border: ['herati', 'rosettePalmette'],
    knots: [150, 240],
    paint: herati,
  },
  boteh: {
    border: ['botehRow', 'runningDog', 'rosettePalmette'],
    knots: [130, 220],
    paint: botehField,
  },
  minaKhani: {
    border: ['herati', 'cartouche', 'rosettePalmette'],
    knots: [140, 230],
    paint: minaKhani,
  },
  prayer: {
    border: ['kufic', 'cartouche', 'runningDog'],
    knots: [120, 220],
    paint: prayer,
  },
  garden: {
    border: ['starRow', 'rosettePalmette', 'kufic'],
    knots: [110, 190],
    paint: garden,
  },
  tree: {
    border: ['herati', 'cartouche', 'botehRow'],
    knots: [150, 240],
    paint: tree,
  },
  harlequin: {
    border: ['argyleLattice', 'kufic', 'starRow'],
    knots: [100, 180],
    paint: harlequin,
  },
};

export const DESIGN_IDS = Object.keys(DESIGNS);

export function paintSignature(ctx) {
  paintField(ctx, signature(ctx));
}
