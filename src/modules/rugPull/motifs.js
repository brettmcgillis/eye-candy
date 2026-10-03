// The traditional motif vocabulary. A motif factory takes its yarns
// (`c`: line, a, b, c, ground) and returns `(x, y, k) => role | -1` over
// about [-1, 1]², y down; k is one knot in those units, so outlines stay one
// knot wide at any size.
import {
  box,
  circle,
  clamp,
  ellipse,
  lobes,
  octagon,
  polarFold,
  rhombus,
  segment,
  star,
  taper,
  vesica,
} from './sdf';

const SQ2 = Math.SQRT2;

export function ink(d, k, fill, line, w = 1) {
  if (d >= 0) return -1;
  return d > -w * k ? line : fill;
}

// Moves a motif to (cx, cy) at scale s, turned by quarter turns.
export function place(motif, cx, cy, s, quarter = 0, flipX = false) {
  return (x, y, k) => {
    let lx = (x - cx) / s;
    let ly = (y - cy) / s;
    if (quarter === 1) [lx, ly] = [ly, -lx];
    else if (quarter === 2) [lx, ly] = [-lx, -ly];
    else if (quarter === 3) [lx, ly] = [-ly, lx];
    if (flipX) lx = -lx;
    return motif(lx, ly, k / s);
  };
}

// As `place`, turned by any angle.
export function placeRot(motif, cx, cy, s, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return (x, y, k) => {
    const dx = (x - cx) / s;
    const dy = (y - cy) / s;
    return motif(cos * dx + sin * dy, -sin * dx + cos * dy, k / s);
  };
}

export function first(...motifs) {
  return (x, y, k) => {
    for (let i = 0; i < motifs.length; i += 1) {
      const role = motifs[i](x, y, k);
      if (role >= 0) return role;
    }
    return -1;
  };
}

// Coarse villages draw on a step grid: every edge is a staircase.
export function stepped(motif, steps) {
  if (!steps) return motif;
  return (x, y, k) => {
    const q = k * steps;
    return motif(
      (Math.floor(x / q) + 0.5) * q,
      (Math.floor(y / q) + 0.5) * q,
      k
    );
  };
}

export function rosette({ c, petals = 8, depth = 0.22, pointed = false }) {
  const sharp = pointed ? 2.2 : 0.5;
  return (x, y, k) => {
    const r = Math.hypot(x, y);
    if (r > 1.02) return -1;
    const a = Math.atan2(x, -y);
    const outer = r - lobes(a, petals, depth, sharp);
    if (outer >= 0) return -1;
    if (outer > -k) return c.line;
    const inner = r - 0.62 * lobes(a + Math.PI / petals, petals, depth, sharp);
    if (inner > 0) {
      const [, local] = polarFold(x, y, petals);
      if (k < 0.12 && r > 0.7 && local * r < k * 0.55) return c.line;
      return c.a;
    }
    if (inner > -k) return c.line;
    const core = r - 0.3;
    if (core > 0) return c.b;
    if (core > -k) return c.line;
    return r < Math.max(0.1, k) ? c.line : c.c;
  };
}

// The shah-abbasi palmette: a ribbed fan on a cup, pointing up.
export function palmette({ c, lobesN = 7 }) {
  return (x, y, k) => {
    const fy = y - 0.3;
    const r = Math.hypot(x, fy);
    const a = Math.atan2(x, -fy);
    const inFan = Math.abs(a) < 1.5;
    const fan = inFan ? r - 0.95 * lobes(a, lobesN * 2, 0.16, 0.6) : 9;
    const cup = ellipse(x, y - 0.48, 0.48, 0.36);
    const shape = Math.min(fan, cup);
    if (shape >= 0) return -1;
    if (shape > -k) return c.line;
    const crown = vesica(x, y + 0.15, 0.62, 0.52);
    if (crown < 0) return crown > -k ? c.line : c.c;
    if (cup < 0 && y > 0.3)
      return cup > -1.4 * k || Math.abs(y - 0.55) < k * 0.6 ? c.line : c.b;
    const mid = r - 0.66 * lobes(a, lobesN * 2, 0.14, 0.6);
    if (mid > 0) {
      const rib = Math.abs(Math.sin((a * lobesN * 2) / 2)) * r;
      return k < 0.14 && rib < k * 0.6 ? c.line : c.a;
    }
    if (mid > -k) return c.line;
    return r < 0.36 ? c.a : c.b;
  };
}

export function leaf({ c, length = 1, width = 0.26, rib = true }) {
  const half = width;
  const rd = (length * length) / half;
  const r = (rd + half) / 2;
  const d = (rd - half) / 2;
  return (x, y, k) => {
    const s = vesica(x, y, r, d);
    if (s >= 0) return -1;
    if (s > -k) return c.line;
    return rib && Math.abs(x) < k * 0.5 && Math.abs(y) < length * 0.75
      ? c.line
      : c.a;
  };
}

export function boteh({ c }) {
  return (x, y, k) => {
    const t = clamp(-y / 0.95, 0, 1);
    const xw = x - 0.5 * t * t;
    const body = taper(xw, y - 0.34, 0.54, 0.03, 1.2);
    if (body >= 0) return -1;
    if (body > -k) return c.line;
    const inner = taper(xw, y - 0.36, 0.38, 0.015, 0.96);
    if (inner >= 0) return c.a;
    if (inner > -k) return c.line;
    for (let i = 0; i < 3; i += 1) {
      const cy = 0.42 - i * 0.28;
      const dot = circle(xw * 1.05, y - cy, 0.11 - i * 0.022);
      if (dot < 0) return dot > -k ? c.line : c.c;
    }
    return c.b;
  };
}

export function cloudband({ c }) {
  return (x, y, k) => {
    const ax = Math.abs(x);
    if (ax > 0.98) return -1;
    const f = 0.32 * Math.sin(Math.PI * x);
    const w = 0.16 * (1 - ax ** 2) + 0.02;
    const d = Math.abs(y - f) - w;
    const curl =
      Math.abs(circle(ax - 0.84, y - Math.sign(x) * 0.1, 0.12)) - 0.03;
    const s = Math.min(d, curl);
    if (s >= 0) return -1;
    return s > -k ? c.line : c.a;
  };
}

export function star8({ c }) {
  return (x, y, k) => {
    const u = (x + y) / SQ2;
    const v = (y - x) / SQ2;
    const s = Math.min(box(x, y, 0.68, 0.68), box(u, v, 0.68, 0.68));
    if (s >= 0) return -1;
    if (s > -k) return c.line;
    const inner = octagon(x, y, 0.42);
    if (inner >= 0) return c.a;
    if (inner > -k) return c.line;
    const cross = Math.min(box(x, y, 0.3, 0.07), box(x, y, 0.07, 0.3));
    return cross < 0 ? c.line : c.b;
  };
}

export function smallStar({ c, points = 8 }) {
  return (x, y, k) => {
    const s = star(x, y, 1, points, 3);
    if (s >= 0) return -1;
    return s > -k || Math.hypot(x, y) < 0.18 ? c.line : c.a;
  };
}

export function diamondDot({ c }) {
  return (x, y, k) => {
    const s = rhombus(x, y, 0.95, 0.95);
    if (s >= 0) return -1;
    if (s > -k) return c.line;
    return rhombus(x, y, 0.32, 0.32) < 0 ? c.line : c.a;
  };
}

export function hookedCross({ c }) {
  return (x, y, k) => {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const arms = Math.min(box(x, y, 0.75, 0.16), box(x, y, 0.16, 0.75));
    const hooks = Math.min(
      box(ax - 0.68, ay - 0.3, 0.08, 0.22),
      box(ay - 0.68, ax - 0.3, 0.08, 0.22)
    );
    const s = Math.min(arms, hooks);
    if (s >= 0) return -1;
    return s > -k ? c.line : c.a;
  };
}

export function comb({ c }) {
  return (x, y, k) => {
    const back = box(x, y + 0.45, 0.8, 0.14);
    const tooth = (((x + 0.8) % 0.32) + 0.32) % 0.32;
    const teeth =
      Math.abs(x) < 0.8 && y > -0.35 && y < 0.7
        ? Math.abs(tooth - 0.16) - 0.07
        : 9;
    const s = Math.min(back, teeth);
    if (s >= 0) return -1;
    return s > -k ? c.line : c.a;
  };
}

export function bird({ c }) {
  return (x, y, k) => {
    const body = ellipse(x + 0.05, y - 0.1, 0.52, 0.3);
    const head = circle(x - 0.5, y + 0.28, 0.18);
    const beak = box(x - 0.74, y + 0.26, 0.1, 0.04);
    const tail = rhombus(x + 0.62, y + 0.12, 0.34, 0.14);
    const legs = Math.min(
      box(x + 0.1, y - 0.55, 0.04, 0.18),
      box(x - 0.15, y - 0.55, 0.04, 0.18)
    );
    const s = Math.min(body, head, beak, tail, legs);
    if (s >= 0) return -1;
    if (s > -k) return c.line;
    if (circle(x - 0.52, y + 0.3, 0.05) < 0) return c.line;
    return body < -0.12 && y > 0.05 ? c.b : c.a;
  };
}

export function animal({ c }) {
  return (x, y, k) => {
    const body = box(x, y, 0.5, 0.18);
    const legs = Math.min(
      box(x - 0.38, y - 0.36, 0.06, 0.2),
      box(x + 0.38, y - 0.36, 0.06, 0.2)
    );
    const neck = box(x - 0.52, y + 0.22, 0.07, 0.2);
    const head = box(x - 0.66, y + 0.4, 0.16, 0.09);
    const horn = Math.abs(circle(x - 0.42, y + 0.62, 0.18)) - 0.04;
    const hornCut = y + 0.62 > 0 || x - 0.42 > 0.1 ? 9 : horn;
    const tail = box(x + 0.58, y + 0.16, 0.05, 0.14);
    const s = Math.min(body, legs, neck, head, hornCut, tail);
    if (s >= 0) return -1;
    return s > -k ? c.line : c.a;
  };
}

export function cypress({ c }) {
  return (x, y, k) => {
    const crown = taper(x, y - 0.5, 0.36, 0.02, 1.42);
    const trunk = box(x, y - 0.82, 0.07, 0.16);
    const s = Math.min(crown, trunk);
    if (s >= 0) return -1;
    if (s > -k) return c.line;
    if (crown < 0) {
      const chevron = Math.abs(((y + Math.abs(x) * 1.2 + 2) % 0.28) - 0.14);
      return chevron < k * 0.6 ? c.line : c.a;
    }
    return c.b;
  };
}

export function vase({ c }) {
  return (x, y, k) => {
    const body = ellipse(x, y - 0.1, 0.62, 0.55);
    const neck = box(x, y + 0.55, 0.22, 0.2);
    const lip = box(x, y + 0.78, 0.4, 0.07);
    const foot = box(x, y - 0.75, 0.3, 0.12);
    const s = Math.min(body, neck, lip, foot);
    if (s >= 0) return -1;
    if (s > -k) return c.line;
    return Math.abs(y - 0.05) < 0.08 ? c.b : c.a;
  };
}

// A branching tree: the rng sets its boughs once. Leaves follow each bough,
// blossoms tip it, a palmette crowns the trunk.
export function treeOfLife({ c, rng, levels = 5 }) {
  const trunk = { ay: 0.86, by: -0.8, r0: 0.085, r1: 0.03 };
  const blossom = rosette({ c: { ...c, a: c.b, b: c.c, c: c.a }, petals: 6 });
  const bud = rosette({
    c: { ...c, a: c.c, b: c.b, c: c.a },
    petals: 5,
    pointed: true,
  });
  const leafy = leaf({ c: { ...c, a: c.a }, length: 1, width: 0.34 });
  const boughs = Array.from({ length: levels }, (_, i) => {
    const t = (i + 0.55) / levels;
    const ay = trunk.ay + (trunk.by - trunk.ay) * t;
    const bx = (0.82 - t * 0.38) * (0.85 + rng() * 0.25);
    const by = ay - (0.14 + rng() * 0.16);
    const mx = bx * 0.5;
    const my = (ay + by) / 2 - 0.05 - rng() * 0.05;
    return { ay, bx, by, mx, my, r: 0.034 - t * 0.012 };
  });
  const ornaments = boughs.flatMap((b, i) => {
    const angle = Math.atan2(b.by - b.ay, b.bx);
    const tip = i % 2 ? blossom : bud;
    return [
      place(tip, b.bx, b.by, 0.13),
      placeRot(leafy, b.mx, b.my - 0.07, 0.09, angle - 0.9),
      placeRot(leafy, b.mx * 1.25, b.my + 0.06, 0.08, angle + 2.4),
      placeRot(leafy, b.bx * 0.82, b.by - 0.08, 0.075, angle - 0.7),
    ];
  });
  const crown = place(palmette({ c }), 0, -0.84, 0.2);
  return (x, y, k) => {
    const ax = Math.abs(x);
    if (ax > 1.05 || Math.abs(y) > 1.05) return -1;
    const top = crown(x, y, k);
    if (top >= 0) return top;
    for (let i = 0; i < ornaments.length; i += 1) {
      const role = ornaments[i](ax, y, k);
      if (role >= 0) return role;
    }
    let d =
      segment(x, y, 0, trunk.ay, 0, trunk.by) -
      (trunk.r0 + (trunk.r1 - trunk.r0) * clamp((trunk.ay - y) / 1.66, 0, 1));
    for (let i = 0; i < boughs.length; i += 1) {
      const b = boughs[i];
      d = Math.min(
        d,
        segment(ax, y, 0, b.ay, b.mx, b.my, b.r),
        segment(ax, y, b.mx, b.my, b.bx, b.by, b.r * 0.8)
      );
    }
    if (d < 0) return d > -k ? c.line : c.c;
    return -1;
  };
}

// --- tile motifs: one cell of an all-over repeat, [-1, 1]² ------------------

export function heratiTile({ c }) {
  const center = place(
    rosette({ c: { ...c, a: c.b, b: c.c, c: c.a }, petals: 8 }),
    0,
    0,
    0.24
  );
  const corner = rosette({
    c: { ...c, a: c.c, b: c.a, c: c.b },
    petals: 6,
    pointed: true,
  });
  const quadrant = first(
    place(corner, 0.62, 0, 0.13),
    place(corner, 0, 0.62, 0.13),
    place(corner, 1, 1, 0.2)
  );
  const fish = leaf({ c: { ...c, a: c.a }, length: 1, width: 0.24 });
  return (x, y, k) => {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const mid = center(x, y, k);
    if (mid >= 0) return mid;
    const q = quadrant(ax, ay, k);
    if (q >= 0) return q;
    const lx = (ax - 0.58 + ay - 0.58) * Math.SQRT1_2;
    const ly = (ay - ax) * Math.SQRT1_2;
    const leafRole = fish(lx / 0.34, ly / 0.34, k / 0.34);
    if (leafRole >= 0) return leafRole;
    if (Math.abs(rhombus(x, y, 0.62, 0.62)) < k * 0.55) return c.line;
    return -1;
  };
}

export function minaKhaniTile({ c }) {
  const big = rosette({ c, petals: 8 });
  const small = rosette({
    c: { ...c, a: c.c, b: c.a, c: c.b },
    petals: 4,
    depth: 0.4,
  });
  const center = place(big, 0, 0, 0.3);
  const quadrant = first(place(big, 1, 1, 0.3), place(small, 0.5, 0.5, 0.14));
  return (x, y, k) => {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const m = center(x, y, k);
    if (m >= 0) return m;
    const q = quadrant(ax, ay, k);
    if (q >= 0) return q;
    const vine = Math.min(
      Math.abs(rhombus(x, y, 1, 1)),
      Math.abs(rhombus(ax - 1, ay, 1, 1))
    );
    return vine < k * 0.6 ? c.line : -1;
  };
}

export function botehTile({ c, flip = false }) {
  const body = place(boteh({ c }), 0, 0, 0.78, 0, flip);
  const dot = place(diamondDot({ c: { ...c, a: c.c } }), 0.86, 0.86, 0.1);
  return (x, y, k) => {
    const m = body(x, y, k);
    if (m >= 0) return m;
    return dot(Math.abs(x), Math.abs(y), k);
  };
}

// City floral repeat: palmettes at the nodes, rosettes between, all strung
// on a scrolling vine with leaves.
export function shahAbbasiTile({ c }) {
  const palm = place(palmette({ c }), 0, -0.05, 0.56);
  const rose = place(
    rosette({ c: { ...c, a: c.b, b: c.c, c: c.a }, petals: 8 }),
    1,
    1,
    0.38
  );
  const sprig = leaf({ c: { ...c, a: c.c }, width: 0.3 });
  const sprigs = first(
    placeRot(sprig, 0.7, 0.32, 0.2, -0.6),
    placeRot(sprig, 0.48, -0.74, 0.17, 1.2),
    placeRot(sprig, 0.22, 0.86, 0.14, 0.4)
  );
  return (x, y, k) => {
    const ax = Math.abs(x);
    const p = palm(x, y, k);
    if (p >= 0) return p;
    const r = rose(ax, Math.abs(y), k);
    if (r >= 0) return r;
    const lf = sprigs(ax, y, k);
    if (lf >= 0) return lf;
    const vine = Math.abs(y - 0.55 * Math.sin(Math.PI * (ax - 0.5)));
    return vine < k * 0.85 && ax > 0.3 ? c.line : -1;
  };
}

// --- medallions: unit half-width, `tall` half-height -------------------------

function quadPalmettes(c, tall, at, s) {
  const palm = palmette({ c });
  return first(
    place(palm, 0, -at * tall, s, 0),
    place(palm, 0, at * tall, s, 2),
    place(palm, -at, 0, s, 3),
    place(palm, at, 0, s, 1)
  );
}

export function lobedMedallion({
  c,
  inner,
  tall = 1.3,
  lobesN = 16,
  tips = 0.3,
}) {
  const center = place(rosette({ c: inner, petals: 12 }), 0, 0, 0.36);
  const palms = quadPalmettes(inner, tall, 0.62, 0.2);
  const rose = place(
    rosette({ c: { ...inner, a: inner.c, c: inner.a }, petals: 6 }),
    0.42,
    0.42 * tall,
    0.12
  );
  return (x, y, k) => {
    const sy = y / tall;
    const r = Math.hypot(x, sy);
    if (r > 1.6) return -1;
    const a = Math.atan2(x, -sy);
    const point = tips * Math.abs(Math.cos(a)) ** 14;
    const edge = 0.9 * lobes(a, lobesN, 0.1, 0.5) + point;
    const d = r - edge;
    if (d >= 0) return -1;
    if (d > -k) return c.line;
    if (d > -0.11) {
      const dot = Math.abs(((a * lobesN) / Math.PI) % 1) - 0.5;
      return Math.abs(dot) < 0.12 && d < -0.035 && d > -0.08 ? c.c : c.a;
    }
    if (d > -0.11 - k) return c.line;
    const mid = center(x, y, k);
    if (mid >= 0) return mid;
    const pm = palms(x, y, k);
    if (pm >= 0) return pm;
    const diag = rose(Math.abs(x), Math.abs(y), k);
    return diag >= 0 ? diag : inner.ground;
  };
}

export function steppedMedallion({ c, inner, tall = 1.3, arms = true }) {
  const core = place(star8({ c: inner }), 0, 0, 0.36);
  return (x, y, k) => {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const body = rhombus(x, y, 1, tall);
    const armH = arms ? box(x, y, 1.2, 0.09) : 9;
    const armV = arms ? box(x, y, 0.09, tall * 1.18) : 9;
    const anchorV = arms ? rhombus(ax, ay - tall * 1.22, 0.24, 0.16) : 9;
    const anchorH = arms ? rhombus(ax - 1.24, ay, 0.12, 0.2) : 9;
    const shape = Math.min(body, armH, armV, anchorV, anchorH);
    if (shape >= 0) return -1;
    if (shape > -k) return c.line;
    if (body >= 0) return c.a;
    const band = rhombus(x, y, 0.8, tall * 0.8);
    if (band >= 0) {
      const tooth =
        Math.abs(((ay * 5) % 1) - 0.5) < 0.18 && Math.abs(body) < 0.08;
      return tooth ? c.b : c.a;
    }
    if (band > -k) return c.line;
    const field = rhombus(x, y, 0.5, tall * 0.5);
    if (field >= 0) return inner.ground;
    if (field > -k) return c.line;
    const center = core(x, y, k);
    return center >= 0 ? center : inner.b;
  };
}

export function hookedLozenge({ c, tall = 1.35, hooks = 3, rings = 2 }) {
  const s = 0.62;
  const h = 0.16;
  const w = 0.045;
  const at = Array.from(
    { length: hooks },
    (_, i) => -s * 0.7 + (i * s * 1.4) / Math.max(1, hooks - 1)
  );
  return (x, y, k) => {
    const sy = y / tall;
    const u = (x + sy) / SQ2;
    const v = (sy - x) / SQ2;
    const au = Math.abs(u);
    const av = Math.abs(v);
    const kk = k / Math.min(1, tall);
    const body = box(u, v, s, s);
    let hook = 9;
    if (hooks > 0) {
      at.forEach((t) => {
        hook = Math.min(
          hook,
          box(au - s - h / 2, v - t, h / 2, w),
          box(au - s - h, v - t - 2 * w, w, 2 * w),
          box(av - s - h / 2, u - t, h / 2, w),
          box(av - s - h, u - t - 2 * w, w, 2 * w)
        );
      });
    }
    const shape = Math.min(body, hook);
    if (shape >= 0) return -1;
    if (shape > -kk) return c.line;
    if (body >= 0) return c.a;
    const fills = [c.a, c.b, c.c, c.ground];
    for (let i = 1; i <= rings; i += 1) {
      const ri = s * (1 - i / (rings + 1.2));
      const d = box(u, v, ri, ri);
      if (d >= 0) return fills[(i - 1) % fills.length];
      if (d > -kk) return c.line;
    }
    return box(u, v, s * 0.12, s * 0.12) < 0
      ? c.line
      : fills[rings % fills.length];
  };
}

export function turkmenGul({ c }) {
  return (x, y, k) => {
    const ox = x / 1.35;
    const outer = octagon(ox, y, 0.72);
    const teeth =
      Math.abs(y) > 0.55 && Math.abs(y) < 0.86 && Math.abs(x) < 0.6
        ? rhombus(((x + 0.6) % 0.3) - 0.15, Math.abs(y) - 0.74, 0.1, 0.12)
        : 9;
    const shape = Math.min(outer, teeth);
    if (shape >= 0) return -1;
    if (shape > -k) return c.line;
    if (outer >= 0) return c.b;
    if (Math.abs(x) < k * 0.6 || Math.abs(y) < k * 0.6) return c.line;
    const inner = octagon(ox, y, 0.34);
    if (inner < 0) {
      if (inner > -k) return c.line;
      return rhombus(x, y, 0.16, 0.16) < 0 ? c.c : c.ground;
    }
    const qx = Math.abs(x) - 0.52;
    const qy = Math.abs(y) - 0.34;
    const trefoil = Math.min(
      rhombus(qx, qy, 0.16, 0.12),
      box(qx + 0.12, qy, 0.05, 0.05)
    );
    if (trefoil < 0) return trefoil > -k ? c.line : c.c;
    return x * y > 0 ? c.a : c.b;
  };
}

export function minorGul({ c }) {
  return (x, y, k) => {
    const s = Math.min(
      rhombus(x, y, 1, 0.7),
      box(x, y, 0.16, 0.95),
      box(x, y, 0.95, 0.16)
    );
    if (s >= 0) return -1;
    if (s > -k) return c.line;
    return rhombus(x, y, 0.36, 0.25) < 0 ? c.b : c.a;
  };
}

export const MOTIFS = {
  animal,
  bird,
  boteh,
  cloudband,
  comb,
  cypress,
  diamondDot,
  hookedCross,
  leaf,
  minorGul,
  palmette,
  rosette,
  smallStar,
  star8,
  vase,
};
