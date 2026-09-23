/* eslint-disable no-param-reassign */
import stemCurve from './stem';

const TUBE_SAMPLES = 24;

const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;

  return [v[0] / l, v[1] / l, v[2] / l];
};

// The directions a body's stem leaves its foot and reaches its top: it leans
// out towards where its head sits and straightens as it rises.
export function stemDirections(body, top = body.top) {
  const dx = top[0] - body.foot[0];
  const dz = top[2] - body.foot[2];
  const h = Math.max(1e-3, top[1] - body.foot[1]);
  const lean = body.footLean ?? 1.3;
  const settle = body.topLean ?? 0;
  const out = Math.hypot(dx, dz) / h;
  const cap = out * lean > 1.1 ? 1.1 / (out * lean) : 1;

  return {
    footDir: unit([(dx / h) * lean * cap, 1, (dz / h) * lean * cap]),
    topDir: unit([(dx / h) * settle, 1, (dz / h) * settle]),
  };
}

export function bodyCurve(body, top = body.top) {
  return stemCurve({
    ...body.curve,
    ...stemDirections(body, top),
    foot: body.foot,
    top,
  });
}

function sample(body) {
  const curve = bodyCurve(body);
  const pts = [];
  const from = body.freeFrom ?? 0.22;

  for (let k = 0; k <= TUBE_SAMPLES; k += 1) {
    const v = from + ((1 - from) * k) / TUBE_SAMPLES;
    const p = curve.point(v);

    pts.push([p[0], p[1], p[2], body.tube(v), v]);
  }
  body.head.forEach(([x, y, z, r]) => {
    pts.push([body.top[0] + x, body.top[1] + y, body.top[2] + z, r, 1]);
  });

  return pts;
}

// Every pair of spheres from different bodies closer than `gap`, found
// through one spatial hash over all of them.
function eachContact(samples, gap, visit) {
  let biggest = 0;

  samples.forEach((pts) =>
    pts.forEach((p) => {
      biggest = Math.max(biggest, p[3]);
    })
  );
  const cell = biggest * 2 + gap || 1;
  const grid = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;

  samples.forEach((pts, body) =>
    pts.forEach((p) => {
      const k = key(
        Math.floor(p[0] / cell),
        Math.floor(p[1] / cell),
        Math.floor(p[2] / cell)
      );

      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push([body, p]);
    })
  );

  samples.forEach((pts, i) =>
    pts.forEach((p) => {
      const cx = Math.floor(p[0] / cell);
      const cy = Math.floor(p[1] / cell);
      const cz = Math.floor(p[2] / cell);

      for (let x = cx - 1; x <= cx + 1; x += 1) {
        for (let y = cy - 1; y <= cy + 1; y += 1) {
          for (let z = cz - 1; z <= cz + 1; z += 1) {
            const list = grid.get(key(x, y, z));

            if (list) {
              for (let q = 0; q < list.length; q += 1) {
                const [j, other] = list[q];

                if (j > i) {
                  const need = p[3] + other[3] + gap;
                  const d = Math.hypot(
                    p[0] - other[0],
                    p[1] - other[1],
                    p[2] - other[2]
                  );

                  if (d < need) visit(i, j, p, other, need - d);
                }
              }
            }
          }
        }
      }
    })
  );
}

// Moves each body's top — never its foot — until no two bodies' stems or
// heads come within `gap`. A body is a stem from `foot` to `top` (its tube
// radius by arc length) plus a rigid cloud of `head` spheres around the top.
// Stems may touch below `freeFrom`, where a clump's stems fuse into one foot.
// Returns the indices still in contact after the last pass.
export default function solveLayout(bodies, o = {}) {
  const gap = o.gap ?? 0;
  const iterations = o.iterations ?? 90;
  const pull = o.pull ?? 0.015;
  let residual = new Set();

  for (let iter = 0; iter < iterations; iter += 1) {
    const samples = bodies.map(sample);
    const push = bodies.map(() => [0, 0, 0, 0]);

    const hit = new Set();

    eachContact(samples, gap, (i, j, p, q, depth) => {
      const wp = p[4] ** 1.5;
      const wq = q[4] ** 1.5;
      const share = depth / Math.max(0.2, wp + wq);
      let h = [p[0] - q[0], 0, p[2] - q[2]];

      if (Math.hypot(h[0], h[2]) < 0.2 * depth) {
        h = [
          bodies[i].top[0] - bodies[j].top[0],
          0,
          bodies[i].top[2] - bodies[j].top[2],
        ];
      }
      if (Math.hypot(h[0], h[2]) < 1e-6) h = [1, 0, 0];
      const n = unit(h);

      for (let a = 0; a < 3; a += 1) {
        push[i][a] += n[a] * share * wp;
        push[j][a] -= n[a] * share * wq;
      }
      push[i][3] += 1;
      push[j][3] += 1;
      hit.add(i);
      hit.add(j);
    });
    residual = hit;

    if (residual.size === 0) break;
    bodies.forEach((body, i) => {
      const [px, py, pz, count] = push[i];
      const home = body.home ?? body.top;

      if (count > 0) {
        const k = 0.9 / Math.sqrt(count);

        body.top[0] += px * k;
        body.top[1] += py * k;
        body.top[2] += pz * k;
      } else {
        for (let a = 0; a < 3; a += 1) {
          body.top[a] += (home[a] - body.top[a]) * pull;
        }
      }
      const [lo, hi] = body.rise ?? [body.top[1], body.top[1]];

      body.top[1] = Math.min(hi, Math.max(lo, body.top[1]));
      const dx = body.top[0] - body.foot[0];
      const dz = body.top[2] - body.foot[2];
      const reach = Math.hypot(dx, dz);
      const limit = (body.top[1] - body.foot[1]) * (body.maxLean ?? 0.8);

      if (reach > limit) {
        body.top[0] = body.foot[0] + (dx / reach) * limit;
        body.top[2] = body.foot[2] + (dz / reach) * limit;
        body.top[1] = Math.min(hi, body.top[1] + (reach - limit) * 0.5);
      }
    });
  }

  return [...residual];
}

// True if any two bodies touch, for a final check after solving.
export function touching(bodies, gap = 0) {
  const out = new Set();

  eachContact(bodies.map(sample), gap, (i, j) => {
    out.add(i);
    out.add(j);
  });

  return [...out];
}
