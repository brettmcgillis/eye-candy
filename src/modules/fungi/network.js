const TAU = Math.PI * 2;

function spacingFn(gradient, base) {
  return (s) => base * Math.exp(gradient * (s - 0.5));
}

function baseSpacing({ from, span, to }, count, gradient, stretch) {
  let integral = 0;
  const steps = 64;

  for (let i = 0; i < steps; i += 1) {
    const s = from + ((to - from) * (i + 0.5)) / steps;

    integral +=
      span * s * Math.exp(-2 * gradient * (s - 0.5)) * ((to - from) / steps);
  }

  return Math.sqrt(integral / (0.8 * stretch * Math.max(count, 8)));
}

function createGrid(cell) {
  const cells = new Map();
  const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;

  return {
    add(index, x, y) {
      const k = key(x, y);

      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(index);
    },
    near(x, y, radius, visit) {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const w = Math.ceil(radius / cell);

      for (let i = cx - w; i <= cx + w; i += 1) {
        for (let j = cy - w; j <= cy + w; j += 1) {
          const list = cells.get(`${i},${j}`);

          if (list) list.forEach(visit);
        }
      }
    },
  };
}

// A reticulate vein network over an (s, θ) domain, drawn onto a surface by
// `place`. Points fall as anisotropic Poisson darts (cells stretch along s),
// edges are the relative-neighbourhood graph, and a shortest-path tree from
// the inner edge carries the flow that thickens veins towards their source,
// the way the physarum/lattice references read.
export default function buildNetwork(e, rng, o) {
  const { domain } = o;
  const center = domain.center ?? 0;
  const stretch = Math.max(1, o.stretch ?? 1);
  const gradient = o.gradient ?? 0;
  const base = baseSpacing(domain, o.density, gradient, stretch);
  const spacing = spacingFn(gradient, base);
  const hMax = Math.max(spacing(domain.from), spacing(domain.to));
  const grid = createGrid(base);
  const xs = [];
  const ys = [];
  const ss = [];
  const ts = [];
  const full = domain.span >= TAU - 1e-3;

  const veins = o.veins ?? true;

  const metric = (ax, ay, bx, by) => {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const ml = Math.hypot(mx, my) || 1;
    const dx = bx - ax;
    const dy = by - ay;
    const dr = (dx * mx + dy * my) / ml;
    const dt = (dx * my - dy * mx) / ml;

    return Math.hypot(dr / stretch, dt);
  };

  function tryAdd(s, theta, force = false) {
    const x = s * Math.cos(theta);
    const y = s * Math.sin(theta);
    const h = spacing(s);
    let ok = true;

    if (!force) {
      grid.near(x, y, hMax * stretch, (q) => {
        if (ok && metric(x, y, xs[q], ys[q]) < Math.min(h, spacing(ss[q]))) {
          ok = false;
        }
      });
    }
    if (!ok) return false;
    grid.add(xs.length, x, y);
    xs.push(x);
    ys.push(y);
    ss.push(s);
    ts.push(theta);

    return true;
  }

  const rootCount = Math.max(
    3,
    Math.round((domain.span * domain.from) / (spacing(domain.from) * 0.7))
  );
  const roots = [];

  for (let i = 0; i < rootCount; i += 1) {
    const theta =
      center -
      domain.span / 2 +
      (domain.span * (i + (full ? 0 : 0.5))) / rootCount;

    if (tryAdd(domain.from, theta, true)) roots.push(xs.length - 1);
  }

  let misses = 0;
  const attempts = Math.round(o.density * 14);

  for (let a = 0; a < attempts && misses < 4000; a += 1) {
    const s = Math.sqrt(rng.range(domain.from ** 2, domain.to ** 2));
    const theta = center + (rng() - 0.5) * domain.span;

    if (tryAdd(s, theta)) misses = 0;
    else misses += 1;
  }

  const n = xs.length;
  const neighbours = Array.from({ length: n }, () => []);

  for (let a = 0; a < n; a += 1) {
    const found = [];

    grid.near(xs[a], ys[a], spacing(ss[a]) * stretch * 2.6, (b) => {
      if (b !== a) {
        found.push([b, metric(xs[a], ys[a], xs[b], ys[b])]);
      }
    });
    found.sort((p, q) => p[1] - q[1]);
    neighbours[a] = found.slice(0, 10);
  }

  const edges = new Map();

  for (let a = 0; a < n; a += 1) {
    neighbours[a].forEach(([b, dab]) => {
      if (b < a && edges.has(`${b}:${a}`)) return;
      const blocked = neighbours[a].some(
        ([c, dac]) =>
          c !== b && dac < dab && metric(xs[b], ys[b], xs[c], ys[c]) < dab
      );

      if (!blocked)
        edges.set(a < b ? `${a}:${b}` : `${b}:${a}`, [
          Math.min(a, b),
          Math.max(a, b),
          dab,
        ]);
    });
  }

  const adjacency = Array.from({ length: n }, () => []);

  edges.forEach(([a, b, d]) => {
    adjacency[a].push([b, d]);
    adjacency[b].push([a, d]);
  });

  const dist = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const done = new Uint8Array(n);

  roots.forEach((r) => {
    dist[r] = 0;
  });
  for (let iter = 0; iter < n; iter += 1) {
    let best = -1;

    for (let i = 0; i < n; i += 1) {
      if (!done[i] && (best < 0 || dist[i] < dist[best])) best = i;
    }
    if (best < 0 || dist[best] === Infinity) break;
    done[best] = 1;
    adjacency[best].forEach(([m, d]) => {
      const turn = veins ? 1 + 0.6 * Math.abs(ts[m] - ts[best]) : 1;
      const via = dist[best] + d * turn;

      if (via < dist[m]) {
        dist[m] = via;
        parent[m] = best;
      }
    });
  }

  const order = [...Array(n).keys()]
    .filter((i) => dist[i] < Infinity)
    .sort((a, b) => dist[b] - dist[a]);
  const flow = new Float64Array(n).fill(1);
  const mainChild = new Int32Array(n).fill(-1);

  order.forEach((i) => {
    if (parent[i] >= 0) {
      flow[parent[i]] += flow[i];
      if (mainChild[parent[i]] < 0 || flow[i] > flow[mainChild[parent[i]]]) {
        mainChild[parent[i]] = i;
      }
    }
  });

  const maxFlow = Math.max(...roots.map((r) => flow[r]), 1);
  const widthAt = (i) => {
    const local = Math.sqrt(spacing(ss[i]) / base);

    if (!veins) return o.thickness * local;

    return o.thickness * local * (0.55 + 1.6 * (flow[i] / maxFlow) ** 0.45);
  };

  const maxDist = Math.max(...order.map((i) => dist[i]), 1e-6);
  const p = [0, 0, 0];

  const wall = o.wall ?? null;

  function pushPoint(s, theta, pts, sv, ups) {
    o.place(s, theta, p);
    if (wall) {
      const nrm = wall.normal(s, theta);
      const lift = wall.height(s) * 0.5;

      pts.push(
        p[0] + nrm[0] * lift,
        p[1] + nrm[1] * lift,
        p[2] + nrm[2] * lift
      );
      ups.push(nrm);
    } else {
      pts.push(p[0], p[1], p[2]);
    }
    sv.push(s);
  }

  function pathPoints(chain) {
    const pts = [];
    const sv = [];
    const ups = [];

    chain.forEach((node, c) => {
      if (c === 0) {
        pushPoint(ss[node], ts[node], pts, sv, ups);

        return;
      }
      const prev = chain[c - 1];
      const bow = rng.signed() * (wall ? 0.06 : 0.18);

      for (let k = 1; k <= 3; k += 1) {
        const u = k / 3;
        const s = ss[prev] + (ss[node] - ss[prev]) * u;
        let dt = ts[node] - ts[prev];

        if (dt > Math.PI) dt -= TAU;
        if (dt < -Math.PI) dt += TAU;
        const bend =
          (Math.sin(u * Math.PI) * bow * spacing(s)) / Math.max(s, 0.05);

        pushPoint(s, ts[prev] + dt * u + bend, pts, sv, ups);
      }
    });

    return { pts, sv, ups };
  }

  const bornOf = (i) =>
    o.born(0) + (o.born(1) - o.born(0)) * (dist[i] / maxDist);

  function emitChain(chain, width) {
    if (chain.length < 2) return;
    const { pts, sv, ups } = pathPoints(chain);
    const perNode = 3;
    const nodeAt = (k) =>
      chain[Math.min(chain.length - 1, Math.round(k / perNode))];

    e.fiber(pts, {
      aspect: wall
        ? (k) => Math.max(1, wall.height(sv[k]) / 2 / width(nodeAt(k)))
        : 1,
      born: (k) => bornOf(nodeAt(k)),
      up: wall ? (k) => ups[k] : undefined,
      color: (k) => o.color(sv[k]),
      glow: 0.4,
      rand: rng(),
      radius: (k) => width(nodeAt(k)),
      sag: (k) => (o.sag ? o.sag(sv[k]) : 0),
      shade: 0.85 + rng() * 0.3,
    });
  }

  const visited = new Uint8Array(n);

  order
    .slice()
    .reverse()
    .forEach((start) => {
      if (visited[start] || dist[start] === Infinity) return;
      const chain = parent[start] >= 0 ? [parent[start]] : [];
      let node = start;

      while (node >= 0 && !visited[node]) {
        visited[node] = 1;
        chain.push(node);
        node = mainChild[node];
      }
      emitChain(chain, widthAt);
    });

  const loops = o.loops ?? 0.5;

  edges.forEach(([a, b]) => {
    if (parent[a] === b || parent[b] === a) return;
    if (dist[a] === Infinity || dist[b] === Infinity) return;
    if (rng() > loops) return;
    const [first, second] = dist[a] < dist[b] ? [a, b] : [b, a];

    emitChain(
      [first, second],
      (i) => Math.min(widthAt(first), widthAt(second)) * 0.7 + 0 * i
    );
  });

  const beadChance = o.beads ?? 0;

  if (beadChance > 0) {
    for (let i = 0; i < n; i += 1) {
      if (dist[i] < Infinity && rng() < beadChance * (0.3 + 0.7 * ss[i] ** 2)) {
        o.place(ss[i], ts[i], p);
        e.bead(p[0], p[1], p[2], widthAt(i) * rng.range(1.3, 2.6), {
          born: bornOf(i) + 0.02,
          color: o.color(ss[i]),
          rand: rng(),
          sag: o.sag ? o.sag(ss[i]) : 0,
        });
      }
    }
  }

  function growTendril(s0, theta0, width, born, forks) {
    const len = spacing(domain.to) * stretch * rng.range(0.8, 2.2);
    const curl = rng.signed() * 2.2;
    const pts = [];
    const sv = [];
    const steps = 7;

    for (let k = 0; k <= steps; k += 1) {
      const u = k / steps;
      const s = s0 + len * u;
      const theta = theta0 + (curl * u * u * len) / Math.max(s, 0.1);

      o.place(s, theta, p);
      pts.push(p[0], p[1], p[2]);
      sv.push(s);
    }
    e.fiber(pts, {
      born0: born,
      born1: Math.min(1, born + 0.08),
      color: (k) => Math.min(1, o.color(sv[k]) + 0.1 * (k / steps)),
      rand: rng(),
      radius: (k, t) => width * (1 - 0.75 * t),
      sag: (k) => (o.sag ? o.sag(sv[k]) : 0),
    });
    if (forks > 0 && rng() < 0.6) {
      const k = 3 + Math.floor(rng() * 3);

      growTendril(
        sv[k],
        theta0 + (curl * (k / steps) ** 2 * len) / Math.max(sv[k], 0.1),
        width * 0.6,
        born + 0.04,
        forks - 1
      );
    }
  }

  const tendrilChance = o.tendrils ?? 0;

  if (tendrilChance > 0) {
    const outer = [...Array(n).keys()].filter(
      (i) => dist[i] < Infinity && ss[i] > domain.to - spacing(domain.to) * 1.2
    );

    outer.forEach((i) => {
      if (rng() > tendrilChance) return;
      growTendril(ss[i], ts[i], widthAt(i) * 0.8, bornOf(i), 2);
    });
  }

  return { nodes: n };
}
