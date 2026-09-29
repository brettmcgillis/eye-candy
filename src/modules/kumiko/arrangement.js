import {
  add,
  dist,
  dot,
  lineIntersect,
  normalize,
  perp,
  scale,
  segmentHit,
  signedArea,
  sub,
} from './geometry';

const QUANT = 1e3;

// Splits every segment where another crosses or touches it and welds the
// pieces into a graph of nodes and undirected edges.
function weld(segments, split) {
  const nodes = [];
  const index = new Map();
  const nodeAt = (p) => {
    const key = `${Math.round(p[0] * QUANT)},${Math.round(p[1] * QUANT)}`;
    if (!index.has(key)) {
      index.set(key, nodes.length);
      nodes.push({ out: [], p });
    }
    return index.get(key);
  };

  const cuts = segments.map(() => [0, 1]);
  for (let i = 0; split && i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const hit = segmentHit(
        segments[i].a,
        segments[i].b,
        segments[j].a,
        segments[j].b
      );
      if (hit) {
        cuts[i].push(hit.t);
        cuts[j].push(hit.u);
      }
    }
  }

  const edges = new Map();
  segments.forEach((s, i) => {
    const ts = [...new Set(cuts[i].map((t) => Math.round(t * 1e9) / 1e9))].sort(
      (x, y) => x - y
    );
    for (let k = 0; k < ts.length - 1; k += 1) {
      const u = nodeAt(add(s.a, scale(sub(s.b, s.a), ts[k])));
      const v = nodeAt(add(s.a, scale(sub(s.b, s.a), ts[k + 1])));
      if (u !== v) {
        const key = u < v ? `${u}:${v}` : `${v}:${u}`;
        const prev = edges.get(key);
        if (!prev || s.width > prev.width) {
          edges.set(key, { ...s, u: Math.min(u, v), v: Math.max(u, v) });
        }
      }
    }
  });
  return { edges: [...edges.values()], nodes };
}

// Half-edges sorted counter-clockwise around each node; the corner between
// two neighbours is where their offset strip sides meet.
function halfEdges({ edges, nodes }) {
  const half = [];
  edges.forEach((e, id) => {
    const a = half.length;
    half.push({ edge: id, from: e.u, to: e.v, twin: a + 1 });
    half.push({ edge: id, from: e.v, to: e.u, twin: a });
  });
  half.forEach((h, id) => {
    const d = normalize(sub(nodes[h.to].p, nodes[h.from].p));
    Object.assign(h, { angle: Math.atan2(d[1], d[0]), dir: d });
    nodes[h.from].out.push(id);
  });
  nodes.forEach((n) => n.out.sort((a, b) => half[a].angle - half[b].angle));
  half.forEach((h, id) => {
    const { out } = nodes[h.from];
    const at = out.indexOf(id);
    Object.assign(h, {
      ccw: out[(at + 1) % out.length],
      cw: out[(at + out.length - 1) % out.length],
    });
  });
  return half;
}

// Left of `h` at its origin, across the wedge to the next edge CCW. A
// dangling end gets a square cap: two points.
function wedgeCorner(id, half, nodes, edges) {
  const h = half[id];
  const node = nodes[h.from].p;
  const wh = edges[h.edge].width / 2;
  if (h.ccw === id) {
    return [
      add(node, scale(perp(h.dir), -wh)),
      add(node, scale(perp(h.dir), wh)),
    ];
  }
  const g = half[h.ccw];
  const wg = edges[g.edge].width / 2;
  const hp = add(node, scale(perp(h.dir), wh));
  const gp = add(node, scale(perp(g.dir), -wg));
  return [lineIntersect(hp, h.dir, gp, g.dir) ?? hp];
}

// `split: false` trusts that segments only meet at shared endpoints, which
// skips the pairwise crossing search.
export default function arrange(segments, { split = true } = {}) {
  const graph = weld(segments, split);
  const { edges, nodes } = graph;
  const half = halfEdges(graph);
  const corner = half.map((_, id) => wedgeCorner(id, half, nodes, edges));

  const faces = [];
  const seen = new Set();
  half.forEach((_, start) => {
    if (seen.has(start)) return;
    const loop = [];
    let h = start;
    while (!seen.has(h)) {
      seen.add(h);
      loop.push(h);
      h = half[half[h].twin].cw;
    }
    const outline = loop.map((id) => nodes[half[id].from].p);
    if (signedArea(outline) <= 1e-9) return;
    const opening = loop.flatMap((id) => corner[id]);
    const intact =
      signedArea(opening) > 0 &&
      loop.every((id, k) => {
        const a = corner[id][corner[id].length - 1];
        const b = corner[loop[(k + 1) % loop.length]][0];
        return dist(a, b) < 1e-9 || dot(sub(b, a), half[id].dir) > 0;
      });
    faces.push({ opening: intact ? opening : null, outline });
  });

  const dangling = (hid) => half[hid].ccw === hid;
  const leftAt = (hid) => corner[hid][dangling(hid) ? 1 : 0];
  const rightAt = (hid) =>
    dangling(hid) ? corner[hid][0] : corner[half[hid].cw][0];
  const nodeAt = (hid) => (dangling(hid) ? [] : [nodes[half[hid].from].p]);

  const pieces = edges.map((e, id) => {
    const h = id * 2;
    const t = h + 1;
    const polygon = [
      ...nodeAt(h),
      rightAt(h),
      leftAt(t),
      ...nodeAt(t),
      rightAt(t),
      leftAt(h),
    ];
    return { ...e, a: nodes[e.u].p, b: nodes[e.v].p, polygon };
  });

  return { edges, faces, nodes, pieces };
}
