/* eslint-disable no-param-reassign */
import { bodyCurve } from './layout';
import buildNetwork from './network';
import createNoise from './noise';

const TAU = Math.PI * 2;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));

  return t * t * (3 - 2 * t);
};

function vanDerCorput(k) {
  let n = k;
  let q = 0;
  let bk = 0.5;

  while (n > 0) {
    q += (n % 2) * bk;
    n = Math.floor(n / 2);
    bk /= 2;
  }

  return q;
}

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;

  return [v[0] / l, v[1] / l, v[2] / l];
};

// One flabellate lobe (or, with `funnel`, a whole trumpet) as a surface in
// (s, θ): s runs from the stalk out to the margin.
export function lobeSurface(fan, lobe, noise) {
  const { origin, radius, yaw } = lobe;
  const rise = lobe.rise ?? (fan.rise * Math.PI) / 2;
  const f = [Math.cos(yaw), 0, Math.sin(yaw)];
  const w0 = [-Math.sin(yaw), 0, Math.cos(yaw)];
  const up = [0, 1, 0];
  const a0 = f.map((v, i) => v * Math.cos(rise) + up[i] * Math.sin(rise));
  const tilt = lobe.tilt ?? 0;
  const a = a0.map((v, i) => v * Math.cos(tilt) + w0[i] * Math.sin(tilt));
  const w = w0.map((v, i) => v * Math.cos(tilt) - a0[i] * Math.sin(tilt));
  const face = unit(cross(a, w));
  const lobing = (theta) =>
    1 + fan.lobeAmp * noise.noise1(theta * fan.lobeCount * 0.6 + lobe.phase, 5);
  const wave = (s, theta) =>
    fan.ruffle *
    radius *
    s ** 3 *
    Math.sin(theta * fan.ruffleCount + lobe.phase);
  const { cupSign } = lobe;

  function at(s, theta, out = [0, 0, 0]) {
    const r = radius * s * lobing(theta);

    if (fan.funnel) {
      const e = rise * (1 - 0.35 * s);
      const y =
        radius * (s * Math.sin(e) * 0.8 + fan.cup * s * s) +
        wave(s, theta) * 0.6;
      const h = r * Math.cos(e);

      out[0] = origin[0] + Math.cos(theta) * h;
      out[1] = origin[1] + y;
      out[2] = origin[2] + Math.sin(theta) * h;

      return out;
    }
    const bend = cupSign * fan.cup * radius * s * s + wave(s, theta);

    for (let i = 0; i < 3; i += 1) {
      out[i] =
        origin[i] +
        (a[i] * Math.cos(theta) + w[i] * Math.sin(theta)) * r +
        face[i] * bend;
    }

    return out;
  }

  function normal(s, theta) {
    const e = 0.01;
    const p0 = at(Math.max(0.02, s - e), theta);
    const p1 = at(Math.min(1.05, s + e), theta);
    const q0 = at(s, theta - e);
    const q1 = at(s, theta + e);
    const n = unit(
      cross(
        [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]],
        [q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]]
      )
    );
    const want = fan.funnel ? [-Math.cos(theta), 0.6, -Math.sin(theta)] : face;
    const dot = n[0] * want[0] + n[1] * want[1] + n[2] * want[2];

    return dot < 0 ? [-n[0], -n[1], -n[2]] : n;
  }

  return {
    at,
    center: fan.funnel ? Math.PI : 0,
    normal,
    span: fan.funnel ? TAU : fan.span,
  };
}

export function stalkCurve(fan, top) {
  return bodyCurve({
    curve: {
      lane: fan.lane,
      sway: fan.sway,
      swayPhase: fan.swayPhase,
      swayShift: fan.swayShift,
      wobble: fan.wobble,
    },
    foot: [0, 0, 0],
    footLean: fan.footLean,
    top,
  });
}

export const stalkRadius = (fan, v) =>
  fan.stalkRadius * (1 + 0.5 * Math.exp(-((v / 0.15) ** 2)));

function buildStalk(e, fan, rng, noise, top, detail) {
  const count = Math.max(20, Math.round(70 * detail));
  const fiberR = ((Math.PI * fan.stalkRadius) / count) * 1.4;
  const curve = stalkCurve(fan, top);
  const p = [0, 0, 0];

  for (let j = 0; j < count; j += 1) {
    const phi0 = (TAU * j) / count;
    const pts = [];

    for (let k = 0; k <= 16; k += 1) {
      const v = k / 16;
      const r =
        stalkRadius(fan, v) * (1 + noise.noise2(phi0 * 2, v * 4) * 0.05);
      const phi = phi0 + noise.noise1(v * 2 + j, 2) * 0.04;

      curve.surface(v, phi, r, p);
      pts.push(p[0], p[1], p[2]);
    }
    e.fiber(pts, {
      born0: 0,
      born1: 0.3,
      color: (i, t) => 0.02 + 0.3 * t,
      rand: rng(),
      radius: fiberR,
      shade: 0.9 + rng() * 0.2,
    });
  }
}

function buildRidges(e, fan, surf, rng, noise, radius, detail, born) {
  const { span } = surf;
  const margin = Math.max(
    30,
    Math.round(
      ((span * radius) / (fan.ridgeGap * radius * 2)) * Math.sqrt(detail)
    )
  );
  const gapAngle = span / margin;
  const gap = gapAngle * radius;
  const thin = gap * 0.2;
  const sMin = 0.05;
  const thetas = [];
  const p = [0, 0, 0];

  for (let k = 0; k < margin; k += 1) {
    const theta =
      surf.center -
      span / 2 +
      span * vanDerCorput(k) +
      rng.signed() * gapAngle * 0.2;
    const s0 = Math.max(sMin, Math.min(0.9, (k + 1) / margin));
    const fork = k >= fan.ridgeCount && rng() < fan.split;
    let from = theta;

    if (fork) {
      from = thetas.reduce(
        (best, t) => (Math.abs(t - theta) < Math.abs(best - theta) ? t : best),
        thetas[0]
      );
    }
    thetas.push(theta);

    const n = Math.max(4, Math.ceil((1 - s0) * 30));
    const pts = [];
    const ups = [];
    const heights = [];

    for (let i = 0; i <= n; i += 1) {
      const s = s0 + ((1 - s0) * i) / n;
      const ease = fork ? smooth(s0, s0 + 0.14, s) : 1;
      const th =
        from +
        (theta - from) * ease +
        fan.ridgeWave * gapAngle * Math.sin(s * 22 + k * 1.3) * s;
      const h =
        fan.ridgeHeight *
        radius *
        smooth(s0, s0 + 0.08, s) *
        (1 - 0.55 * s) *
        (1 + noise.noise1(s * 5 + k, 7) * 0.2);
      const nrm = surf.normal(s, th);

      surf.at(s, th, p);
      heights.push(Math.max(h, thin));
      ups.push(nrm);
      pts.push(
        p[0] + nrm[0] * heights[i] * 0.5,
        p[1] + nrm[1] * heights[i] * 0.5,
        p[2] + nrm[2] * heights[i] * 0.5
      );
    }
    e.fiber(pts, {
      aspect: (i) => heights[i] / 2 / thin,
      born: (i, t) => born(s0 + (1 - s0) * t),
      color: (i, t) => 0.4 + 0.58 * (s0 + (1 - s0) * t),
      glow: 1,
      occlusion: (i, t) => 0.55 + 0.45 * (s0 + (1 - s0) * t),
      rand: rng(),
      radius: thin,
      sag: (i, t) => radius * (s0 + (1 - s0) * t) ** 2 * 0.4,
      shade: 0.88 + rng() * 0.24,
      up: (i) => ups[i],
    });
  }

  return { gap, margin };
}

function buildBacking(e, fan, surf, rng, radius, detail, born, lift = 0) {
  const { span } = surf;
  const count = Math.max(
    40,
    Math.round(
      ((span * radius) / (fan.ridgeGap * radius * 2)) * fan.backing * detail
    )
  );
  const gap = (span * radius) / count;
  const fiberR = gap * 0.65;
  const p = [0, 0, 0];

  for (let k = 0; k < count; k += 1) {
    const theta = surf.center - span / 2 + span * vanDerCorput(k);
    const s0 = Math.max(0.03, (k + 1) / count);
    const n = Math.max(3, Math.ceil((1 - s0) * 24));
    const pts = [];

    for (let i = 0; i <= n; i += 1) {
      const s = s0 + ((1 - s0) * i) / n;
      const nrm = surf.normal(s, theta);

      surf.at(s, theta, p);
      pts.push(
        p[0] - nrm[0] * (fiberR + lift),
        p[1] - nrm[1] * (fiberR + lift),
        p[2] - nrm[2] * (fiberR + lift)
      );
    }
    e.fiber(pts, {
      born: (i, t) => born(s0 + (1 - s0) * t),
      color: (i, t) => 0.36 + 0.6 * (s0 + (1 - s0) * t),
      occlusion: 0.9,
      rand: rng(),
      radius: fiberR,
      sag: (i, t) => radius * (s0 + (1 - s0) * t) ** 2 * 0.4,
      shade: 0.85 + rng() * 0.2,
    });
  }
}

function buildMarginHairs(e, fan, surf, rng, radius, detail, born) {
  const count = Math.round(fan.hairs * 500 * detail * (surf.span / 3));
  const p = [0, 0, 0];
  const q = [0, 0, 0];

  for (let h = 0; h < count; h += 1) {
    const theta = surf.center + (rng() - 0.5) * surf.span;
    const s = rng.range(0.9, 1);
    const len = radius * rng.range(0.02, 0.07);

    surf.at(s, theta, p);
    surf.at(s + 0.05, theta, q);
    const d = unit([q[0] - p[0], q[1] - p[1], q[2] - p[2]]);

    e.fiber(
      [
        p[0],
        p[1],
        p[2],
        p[0] + d[0] * len + rng.signed() * len * 0.3,
        p[1] + d[1] * len + rng.signed() * len * 0.3,
        p[2] + d[2] * len + rng.signed() * len * 0.3,
      ],
      {
        born0: born(1),
        born1: Math.min(1, born(1) + 0.04),
        color: 0.95,
        rand: rng(),
        radius: (i) => radius * (i ? 0.001 : 0.003),
      }
    );
  }
}

function buildMarginCrust(e, surf, rng, radius, amount, born) {
  const count = Math.round(amount * 500 * (surf.span / 3));
  const p = [0, 0, 0];

  for (let b = 0; b < count; b += 1) {
    const theta = surf.center + (rng() - 0.5) * surf.span;
    const s = 1 - Math.abs(rng.gauss()) * 0.04;

    surf.at(s, theta, p);
    e.bead(
      p[0] + rng.signed() * radius * 0.01,
      p[1] + rng.signed() * radius * 0.01,
      p[2] + rng.signed() * radius * 0.01,
      radius * rng.range(0.008, 0.028),
      {
        born: born(s) + 0.02,
        color: rng.range(0.85, 1),
        rand: rng(),
        sag: radius * s * s * 0.4,
      }
    );
  }
}

const LOBE_FUSE = 0.45;

// How far apart, in rise angle, two lobes must fan so their faces — ridges,
// ruffle and cup included — clear each other beyond the fused base.
function lobeSpacing(fan) {
  const need =
    2 * fan.ruffle +
    (2.4 * fan.ridgeHeight * 0.75) / LOBE_FUSE +
    0.35 * fan.cup +
    0.03;

  return Math.asin(Math.min(0.95, need));
}

// Where the stalk tops out and how its lobes sit on it. Lobes share one yaw
// and fan apart in rise like a hand of cards, each within the half-plane in
// front of their common hinge, so they only ever meet at the stalk.
export function fanLayout(g, rng) {
  const { fan } = g;
  const top = [rng.signed() * 0.2, fan.stalk, rng.signed() * 0.2];
  const yaw = Math.PI / 2 + rng.signed() * 0.5;
  const cupSign = rng.chance(0.7) ? 1 : -1;
  const baseRise = (fan.rise * Math.PI) / 2;

  if (fan.funnel) {
    return {
      lobes: [
        {
          cupSign,
          phase: rng() * TAU,
          radius: fan.radius,
          rise: baseRise,
          yaw,
        },
      ],
      top,
    };
  }

  const step = lobeSpacing(fan);
  const lobes = Math.max(1, Math.min(fan.lobes, 1 + Math.floor(1.9 / step)));
  const span = Math.min(fan.span, Math.PI - 0.3);
  const freedom = Math.max(0, Math.PI / 2 - span / 2 - 0.05);
  const list = [];

  for (let l = 0; l < lobes; l += 1) {
    const rise = baseRise + (l - (lobes - 1) / 2) * step;

    list.push({
      cupSign,
      phase: rng() * TAU,
      radius: fan.radius * (l === 0 ? 1 : rng.range(0.72, 0.95)),
      rise: Math.min(Math.PI * 0.62, Math.max(0.05, rise)),
      span,
      tilt: rng.signed() * freedom,
      yaw,
    });
  }

  return { lobes: list, top };
}

export function fanHead(g, layout) {
  const { fan } = g;
  const noise = createNoise(fan.lane);
  const out = [];

  layout.lobes.forEach((lobe) => {
    const surf = lobeSurface(
      { ...fan, span: lobe.span ?? fan.span },
      { ...lobe, origin: [0, 0, 0] },
      noise
    );
    const around = fan.funnel ? 20 : 11;

    for (let j = 1; j <= 6; j += 1) {
      const s = 0.2 + (0.8 * j) / 6;
      const r = Math.max(
        (lobe.radius * s * surf.span) / around / 1.6,
        fan.ridgeHeight * lobe.radius * 1.2
      );

      for (let i = 0; i < around; i += 1) {
        const theta =
          surf.center - surf.span / 2 + (surf.span * i) / (around - 1);
        const p = surf.at(s, theta);

        out.push([p[0], p[1], p[2], r]);
      }
    }
  });

  return out;
}

// A flabellate member: a stalk carrying one or more fan lobes (or a funnel)
// whose face is gill ridges that fork as they widen, a pore honeycomb, or a
// free reticulate vein net.
export default function buildFan(e, g, rng, noise, detail = 1) {
  const { fan } = g;
  const layout = g.layout ?? fanLayout(g, rng);
  const { top } = layout;
  const born = (s) => 0.3 + 0.62 * s;
  const lobeDetail = detail / Math.sqrt(layout.lobes.length);
  const surfNoise = createNoise(fan.lane);

  buildStalk(e, fan, rng, noise, top, detail);

  let height = top[1];

  layout.lobes.forEach((lobeSpec) => {
    const { radius } = lobeSpec;
    const lobe = { ...lobeSpec, origin: top };
    const surf = lobeSurface(
      { ...fan, span: lobe.span ?? fan.span },
      lobe,
      surfNoise
    );

    height = Math.max(height, surf.at(1, surf.center)[1]);

    if (fan.surface === 'ridges') {
      buildRidges(e, fan, surf, rng, noise, radius, lobeDetail, born);
      buildBacking(e, fan, surf, rng, radius, lobeDetail, born);
    } else if (fan.surface === 'pores') {
      const thick = radius * 0.012;

      buildNetwork(e, rng, {
        born,
        color: (s) => 0.4 + 0.58 * s,
        density: fan.netDensity * lobeDetail,
        domain: {
          center: surf.center,
          from: 0.06,
          span: surf.span * 0.98,
          to: 1,
        },
        gradient: fan.netGradient,
        loops: 1,
        place: (s, theta, out) => surf.at(s, theta, out),
        sag: (s) => radius * s * s * 0.4,
        stretch: fan.netStretch,
        thickness: thick,
        wall: {
          height: (s) => fan.ridgeHeight * radius * 2.2 * (1 - 0.4 * s),
          normal: (s, theta) => surf.normal(s, theta),
        },
      });
      buildBacking(
        e,
        { ...fan, backing: Math.max(fan.backing, 2) },
        surf,
        rng,
        radius,
        lobeDetail,
        born
      );
    } else {
      buildNetwork(e, rng, {
        beads: fan.netBeads,
        born,
        color: (s) => 0.4 + 0.58 * s,
        density: fan.netDensity * lobeDetail,
        domain: { center: surf.center, from: 0.05, span: surf.span, to: 1 },
        gradient: fan.netGradient,
        loops: fan.netLoops,
        place: (s, theta, out) => surf.at(s, theta, out),
        sag: (s) => radius * s * s * 0.4,
        stretch: fan.netStretch,
        tendrils: 0.15,
        thickness: radius * 0.006,
      });
      buildMarginCrust(e, surf, rng, radius, 0.6 + fan.netBeads, born);
    }
    if (fan.hairs > 0)
      buildMarginHairs(e, fan, surf, rng, radius, lobeDetail, born);
  });

  return { height };
}
