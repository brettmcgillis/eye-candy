/* eslint-disable no-param-reassign */
import { BEAD_KIND } from './emit';
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

// The cap as a surface of revolution in (s, θ): s runs apex → margin. Top,
// underside and normal are all read from the same profile, so fibrils, gills
// and fringe stay glued to one another however the genes bend it.
export function capSurface(cap, stipe) {
  const noise = createNoise(cap.phase / TAU);
  const R = cap.radius;
  const H = cap.height;
  const radiusAt = (s) => R * s ** cap.flare;
  const heightAt = (s) =>
    H * (1 - s ** cap.dome) +
    cap.umbo * H * Math.exp(-((s / 0.16) ** 2)) -
    cap.dip * H * (1 - s) ** 2 -
    cap.curl * R * 0.22 * smooth(0.72, 1, s) ** 2;
  const thicknessAt = (s) => cap.thickness * R * ((1 - s) ** 0.7 * 0.9 + 0.1);
  const joinRadius = stipe.radius * (1 + stipe.apexFlare);
  const sJoin = Math.min(0.5, (joinRadius / R) ** (1 / cap.flare));
  const originY = stipe.height - (heightAt(sJoin) - thicknessAt(sJoin));
  const lobe = (s, theta) =>
    1 +
    cap.lobeAmp *
      s ** 2 *
      noise.noise1(
        Math.cos(theta) * cap.lobes + 3,
        Math.sin(theta) * cap.lobes
      );
  const ruffle = (s, theta) =>
    cap.ruffle * R * s ** 3 * Math.sin(theta * cap.ruffleCount + cap.phase);

  function at(s, theta, under = false, out = [0, 0, 0]) {
    const r = radiusAt(s) * lobe(s, theta);
    const y =
      originY + heightAt(s) + ruffle(s, theta) - (under ? thicknessAt(s) : 0);

    out[0] = stipe.bendX + Math.cos(theta) * r;
    out[1] = y;
    out[2] = stipe.bendZ + Math.sin(theta) * r;

    return out;
  }

  function normal(s, theta) {
    const e = 0.01;
    const a = at(Math.max(0, s - e), theta);
    const b = at(Math.min(1, s + e), theta);
    const dr =
      Math.hypot(b[0] - stipe.bendX, b[2] - stipe.bendZ) -
      Math.hypot(a[0] - stipe.bendX, a[2] - stipe.bendZ);
    const dy = b[1] - a[1];
    const l = Math.hypot(dr, dy) || 1;
    const nr = -dy / l;
    const ny = dr / l;

    return [Math.cos(theta) * nr, ny, Math.sin(theta) * nr];
  }

  return { at, normal, originY, radiusAt, sJoin };
}

export function stipeCurve(stipe) {
  return bodyCurve({
    curve: {
      lane: stipe.lane,
      sway: stipe.sway,
      swayPhase: stipe.swayPhase,
      swayShift: stipe.swayShift,
      wobble: stipe.wobble,
    },
    foot: [0, 0, 0],
    footLean: stipe.footLean,
    top: [stipe.bendX, stipe.height, stipe.bendZ],
  });
}

export function stipeRadius(stipe, v) {
  const bulb = stipe.bulb * Math.exp(-((v / 0.13) ** 2));
  const taper = 1 + stipe.taper * (1 - v);
  const flare = 1 + stipe.apexFlare * smooth(0.82, 1, v) ** 2;

  return stipe.radius * (1 + bulb) * taper * flare;
}

function buildRing(e, g, rng, curve, detail) {
  const { stipe } = g;
  const v0 = stipe.ringAt;
  const r0 = stipeRadius(stipe, v0);
  const count = Math.round(stipe.fibers * 1.6 * detail);
  const drop = (stipe.height * stipe.ringLength) / curve.length;
  const flare = g.cap.radius * stipe.ringFlare;
  const fiberR = ((TAU * (r0 + flare * 0.5)) / count) * 0.55;
  const waves = 5 + Math.floor(rng() * 7);
  const p = [0, 0, 0];

  for (let m = 0; m < count; m += 1) {
    const theta = (TAU * m) / count;
    const pts = [];
    const own = rng.range(0.8, 1.1);

    for (let k = 0; k <= 10; k += 1) {
      const u = k / 10;
      const r =
        r0 +
        flare * u ** 0.6 * (1 + 0.25 * Math.sin(theta * waves + u * 3)) +
        fiberR;

      curve.surface(v0 - drop * u * own, theta, r, p);
      pts.push(p[0], p[1], p[2]);
    }
    e.fiber(pts, {
      born0: 0.62,
      born1: 0.9,
      color: 0.18,
      occlusion: (i, t) => 0.75 + 0.25 * t,
      rand: rng(),
      radius: fiberR,
      sag: (i, t) => t * 0.2,
    });
  }
}

function buildVolva(e, g, rng, noise, curve, detail) {
  const { stipe } = g;
  const count = Math.round(stipe.fibers * 1.3 * detail);
  const top = stipe.height * 0.12 * stipe.volva;
  const r0 = stipeRadius(stipe, 0.05) * 1.25;
  const fiberR = ((TAU * r0) / count) * 0.7;
  const p = [0, 0, 0];

  for (let m = 0; m < count; m += 1) {
    const theta = (TAU * m) / count;
    const lip = top * (0.55 + 0.45 * Math.abs(noise.noise1(theta * 1.7, 4)));
    const pts = [];

    for (let k = 0; k <= 8; k += 1) {
      const u = k / 8;
      const bulge = Math.sin(u * Math.PI) * 0.35 + 1;
      const wr = 1 + noise.noise2(theta * 6, u * 3) * 0.12;
      const r = r0 * bulge * wr * (1 - u * 0.15);

      curve.surface((lip * u) / curve.length, theta, r, p);
      pts.push(p[0], p[1], p[2]);
    }
    e.fiber(pts, {
      born0: 0,
      born1: 0.2,
      color: 0.08,
      occlusion: 0.8,
      rand: rng(),
      radius: fiberR,
    });
  }
}

function buildStipe(e, g, rng, noise, surf, detail) {
  const { stipe } = g;
  const curve = stipeCurve(stipe);
  const count = Math.max(24, Math.round(stipe.fibers * detail));
  const samples = Math.max(16, Math.round(curve.length / (stipe.radius * 0.5)));
  const clampSamples = Math.min(64, samples);
  const fiberR = ((Math.PI * stipe.radius) / count) * 1.35;
  const a = [0, 0, 0];
  const capReach = g.plan === 'agaric' ? 0.12 : 0;

  const widthAt = (v) => ((Math.PI * stipeRadius(stipe, v)) / count) * 1.5;
  const layers = [
    { depth: 1, offset: 0 },
    { depth: 0.84, offset: 0.5 },
  ];

  layers.forEach((layer, li) => {
    for (let j = 0; j < count; j += 1) {
      const phi0 = (TAU * (j + layer.offset)) / count + rng.signed() * 0.02;
      const depth = layer.depth * (1 - Math.abs(rng.gauss()) * 0.03);
      const pts = [];
      const vs = [];

      for (let k = 0; k <= clampSamples; k += 1) {
        const v = k / clampSamples;
        const phi =
          phi0 +
          stipe.twist * v * TAU +
          noise.noise1(v * 3 + j * 0.37, j) * 0.05;
        const r =
          stipeRadius(stipe, v) *
          depth *
          (1 + noise.noise2(phi * 2, v * stipe.height * 1.5) * stipe.wrinkle);

        curve.surface(v, phi, r, a);
        pts.push(a[0], a[1], a[2]);
        vs.push(v);
      }

      if (capReach > 0 && li === 0) {
        const phiEnd = phi0 + stipe.twist * TAU;

        for (let k = 1; k <= 4; k += 1) {
          const s = surf.sJoin + (capReach * k) / 4;
          const p = surf.at(s, phiEnd, true);

          pts.push(p[0], p[1] - fiberR, p[2]);
          vs.push(1);
        }
      }

      e.fiber(pts, {
        born0: 0,
        born1: 0.5 + (li === 0 ? capReach : 0),
        color: (i, t) => 0.02 + 0.26 * t,
        occlusion: (i, t) =>
          (li === 0 ? 1 : 0.7) - 0.25 * smooth(0.7, 1, t) * g.cap.shade,
        rand: rng(),
        radius: (i) => widthAt(vs[i]) * layer.depth,
        shade: 0.9 + rng() * 0.2,
      });
    }
  });

  const hairs = Math.round(stipe.hairs * count * 4 * detail);

  for (let h = 0; h < hairs; h += 1) {
    const v = rng.range(0.03, 0.95);
    const phi = rng() * TAU;
    const r = stipeRadius(stipe, v);
    const { b, n, t } = curve.frame(v);
    const out = n.map((x, i) => x * Math.cos(phi) + b[i] * Math.sin(phi));
    const p = curve.point(v);
    const len = stipe.radius * rng.range(0.2, 0.9) * stipe.hairLength;
    const lift = rng.range(-0.2, 0.6);
    const pts = [];

    [
      [0, 0],
      [0.55, 0.5],
      [1, 1],
    ].forEach(([u, rise]) => {
      for (let i = 0; i < 3; i += 1) {
        pts.push(p[i] + out[i] * (r + len * u) + t[i] * len * lift * rise);
      }
    });
    e.fiber(pts, {
      born0: v * 0.5 + 0.05,
      born1: v * 0.5 + 0.12,
      color: 0.04 + 0.26 * v,
      rand: rng(),
      radius: (i) => fiberR * (i === 2 ? 0.08 : 0.35),
    });
  }

  if (stipe.ring > 0) buildRing(e, g, rng, curve, detail);
  if (stipe.volva > 0) buildVolva(e, g, rng, noise, curve, detail);
}

function buildFibrils(e, g, rng, noise, surf, detail) {
  const { cap } = g;
  const count = Math.max(60, Math.round(cap.fibrils * detail));
  const spacing = (TAU * cap.radius) / count;
  const fiberR = spacing * 0.62 * Math.max(1, cap.fibrilWidth);
  const netFrom = cap.surface === 'lattice' ? cap.latticeFrom : 1;
  const p = [0, 0, 0];

  for (let k = 0; k < count; k += 1) {
    const theta0 = TAU * vanDerCorput(k) + rng.signed() * (TAU / count) * 0.3;
    const s0 = Math.max(0.015, ((k + 1) / count) ** (1 / cap.flare) * 0.97);

    if (s0 >= netFrom - 0.02) continue; // eslint-disable-line no-continue
    const s1 = netFrom;
    const n = Math.max(3, Math.ceil((s1 - s0) * 34));
    const pts = [];

    for (let i = 0; i <= n; i += 1) {
      const s = s0 + ((s1 - s0) * i) / n;
      const theta =
        theta0 +
        cap.twist * s +
        noise.noise1(s * 4 + k * 0.13, k % 97) * cap.wander * 0.08;
      const pleat =
        cap.pleatAmp *
        cap.radius *
        smooth(0.05, 0.5, s) *
        Math.abs(Math.sin((theta * cap.pleats) / 2)) ** 1.5;
      const wrinkle =
        noise.noise2(theta * 9, s * 14) * cap.wrinkle * cap.radius * 0.03;
      const nrm = surf.normal(s, theta);

      surf.at(s, theta, false, p);
      const lift = pleat + wrinkle + fiberR * 0.5;

      pts.push(
        p[0] + nrm[0] * lift,
        p[1] + nrm[1] * lift,
        p[2] + nrm[2] * lift
      );
    }
    e.fiber(pts, {
      born: (i, t) => 0.5 + 0.42 * (s0 + (s1 - s0) * t),
      color: (i, t) =>
        cap.surface === 'gleba'
          ? 0.72 + 0.05 * (s0 + (s1 - s0) * t)
          : 0.72 + 0.28 * (s0 + (s1 - s0) * t) ** 1.3,
      glow: 0.25,
      rand: rng(),
      radius: (i, t) => fiberR * (0.8 + 0.2 * (s0 + (s1 - s0) * t)),
      sag: (i, t) => cap.radius * (s0 + (s1 - s0) * t) ** 1.5 * 0.5,
      shade: 0.88 + rng() * 0.24,
    });
  }

  if (cap.surface === 'gleba') {
    buildNetwork(e, rng, {
      born: (s) => 0.55 + 0.35 * s,
      color: () => 0.97,
      density: cap.netDensity * Math.sqrt(detail),
      domain: { from: 0.1, span: TAU, to: 0.99 },
      gradient: 0.3,
      loops: 1,
      place: (s, theta, out) => surf.at(s, theta, false, out),
      radius: cap.radius,
      sag: (s) => cap.radius * s ** 1.5 * 0.5,
      stretch: 1.25,
      thickness: cap.radius * 0.014,
      wall: {
        height: () => cap.radius * 0.09,
        normal: (s, theta) => surf.normal(s, theta),
      },
    });
  }

  if (cap.surface === 'lattice') {
    buildNetwork(e, rng, {
      born: (s) => 0.55 + 0.4 * s,
      color: (s) => 0.72 + 0.28 * s,
      density: cap.netDensity * detail,
      domain: { from: netFrom - 0.03, span: TAU, to: 1 },
      gradient: cap.netGradient,
      loops: cap.netLoops,
      place: (s, theta, out) => {
        surf.at(s, theta, false, out);

        return out;
      },
      radius: cap.radius,
      sag: (s) => cap.radius * s ** 1.5 * 0.5,
      stretch: cap.netStretch,
      tendrils: cap.tendrils,
      thickness: fiberR * 3.2,
      beads: cap.netBeads,
    });
  }
}

function buildGills(e, g, rng, noise, surf, detail) {
  const { cap, gills } = g;

  if (gills.count <= 0 || cap.surface !== 'fibril') return;
  const count = Math.max(24, Math.round(gills.count * Math.sqrt(detail)));
  const gap = (TAU * cap.radius) / count;
  const thin = gap * gills.thickness;
  const up = [0, -1, 0];
  const p = [0, 0, 0];

  for (let i = 0; i < count; i += 1) {
    let start = surf.sJoin + 0.03;

    if (i % 4 !== 0) start = i % 2 === 0 ? 0.42 : 0.7;
    const theta0 = (TAU * i) / count + rng.signed() * (TAU / count) * 0.15;
    const n = Math.max(6, Math.ceil((1 - start) * 26));
    const pts = [];
    const depthAt = [];

    for (let k = 0; k <= n; k += 1) {
      const s = start + ((1 - start) * k) / n;
      const theta =
        theta0 +
        gills.wave * (TAU / count) * Math.sin(s * gills.waveFreq + i * 1.7);
      const depth =
        gills.depth *
        cap.radius *
        smooth(start, start + 0.1, s) *
        (1 - s) ** 0.4 *
        (1 + noise.noise1(s * 6 + i, 11) * 0.15);

      surf.at(Math.min(0.995, s), theta, true, p);
      depthAt.push(Math.max(depth, thin));
      pts.push(p[0], p[1] - Math.max(depth, thin) * 0.5, p[2]);
    }
    e.fiber(pts, {
      aspect: (k) => depthAt[k] / 2 / thin,
      born: (k, t) => 0.55 + 0.38 * (start + (1 - start) * t),
      color: (k, t) => gills.color + 0.05 * t,
      glow: 1,
      occlusion: (k, t) => 0.3 + 0.7 * (start + (1 - start) * t) ** 1.4,
      rand: rng(),
      radius: thin,
      sag: (k, t) => cap.radius * (start + (1 - start) * t) ** 1.5 * 0.5,
      shade: 0.9 + rng() * 0.2,
      up,
    });

    if (i % 3 === 0) {
      const k = 1 + Math.floor(rng() * n);

      e.bead(
        pts[k * 3],
        pts[k * 3 + 1] - depthAt[k] * 0.5,
        pts[k * 3 + 2],
        thin * 1.2,
        {
          color: gills.color,
          kind: BEAD_KIND.spore,
          rand: rng(),
        }
      );
    }
  }
}

function buildWarts(e, g, rng, surf) {
  const { cap } = g;
  const count = Math.round(cap.warts * 260 * (cap.radius / 2) ** 2);
  const p = [0, 0, 0];

  for (let w = 0; w < count; w += 1) {
    const s = Math.sqrt(rng.range(0.004, 0.95));
    const theta = rng() * TAU;
    const nrm = surf.normal(s, theta);
    const size =
      cap.radius * cap.wartSize * rng.range(0.5, 1.3) * (1.1 - s * 0.5);
    const beads = 1 + Math.floor(rng() * 4);

    surf.at(s, theta, false, p);
    for (let b = 0; b < beads; b += 1) {
      const j = b === 0 ? 0 : size * 0.9;
      const r = size * (b === 0 ? 1 : rng.range(0.4, 0.7));

      e.bead(
        p[0] + nrm[0] * r * 0.4 + rng.signed() * j,
        p[1] + nrm[1] * r * 0.4 + rng.signed() * j * 0.3,
        p[2] + nrm[2] * r * 0.4 + rng.signed() * j,
        r,
        {
          born: 0.62 + 0.3 * s,
          color: cap.wartColor,
          rand: rng(),
          sag: cap.radius * s ** 1.5 * 0.5,
        }
      );
    }
  }
}

function buildScales(e, g, rng, surf, detail) {
  const { cap } = g;
  const count = Math.round(cap.scales * 900 * detail * (cap.radius / 2) ** 2);
  const a = [0, 0, 0];
  const b = [0, 0, 0];

  for (let k = 0; k < count; k += 1) {
    const s = Math.sqrt(rng.range(0.02, 0.9));
    const theta = rng() * TAU;
    const len = rng.range(0.04, 0.09);
    const nrm = surf.normal(s + len, theta);
    const lift = cap.radius * rng.range(0.015, 0.05);
    const tuft = 3 + Math.floor(rng() * 5);

    surf.at(s, theta, false, a);
    surf.at(Math.min(1, s + len), theta, false, b);
    for (let f = 0; f < tuft; f += 1) {
      const d = rng.signed() * 0.02;

      e.fiber(
        [
          a[0],
          a[1],
          a[2],
          b[0] + nrm[0] * lift + d,
          b[1] + nrm[1] * lift,
          b[2] + nrm[2] * lift + d,
        ],
        {
          born0: 0.7 + 0.25 * s,
          born1: 0.75 + 0.25 * s,
          color: cap.scaleColor,
          rand: rng(),
          radius: (i) => cap.radius * (i ? 0.004 : 0.012),
          shade: 0.7,
        }
      );
    }
  }
}

const HANG = 0.42;

export const fringeHang = (g) =>
  Math.min(g.cap.radius * g.cap.fringeLength, g.stipe.height * HANG);

function buildFringe(e, g, rng, noise, surf, detail) {
  const { cap } = g;
  const count = Math.round(cap.fringe * 90 * detail);
  const p = [0, 0, 0];
  const thin = cap.radius * 0.0045;

  for (let f = 0; f < count; f += 1) {
    const s = rng.range(0.45, 1);
    const theta = rng() * TAU;
    const len = fringeHang(g) * rng.range(0.25, 1);
    const out = [Math.cos(theta), 0, Math.sin(theta)];
    const pts = [];
    const sway = rng.signed();

    surf.at(s, theta, true, p);
    for (let k = 0; k <= 8; k += 1) {
      const u = k / 8;

      pts.push(
        p[0] + out[0] * len * 0.15 * u + sway * len * 0.08 * u * u,
        p[1] - len * u,
        p[2] + out[2] * len * 0.15 * u + noise.noise1(u * 2 + f, 3) * len * 0.05
      );
    }
    e.fiber(pts, {
      born0: 0.85,
      born1: 1,
      color: (i, t) => 0.8 + 0.2 * t,
      rand: rng(),
      radius: thin,
      sag: (i, t) => cap.radius * s ** 1.5 * 0.5 + len * 0.3 * t,
    });
    if (rng() < cap.fringeBeads) {
      e.bead(pts[24], pts[25], pts[26], thin * rng.range(2.5, 4.5), {
        born: 0.98,
        color: 1,
        rand: rng(),
        sag: cap.radius * s ** 1.5 * 0.5 + len * 0.3,
      });
    }
  }
}

const veilLength = (stipe) => stipe.height * Math.min(HANG, stipe.veilLength);

// The stinkhorn's indusium, pushed alien: a crinoline flaring from under the
// cap, its hem cut into hanging points that kick back up at the tips, dewed
// with beads, with an optional shorter skirt nested inside it.
function veilSkirt(stipe, cap, surf, tier) {
  const top = surf.at(tier.from, 0, true);
  const rTop = Math.hypot(top[0] - stipe.bendX, top[2] - stipe.bendZ) * 0.94;
  const rHem = cap.radius * stipe.veilFlare * tier.flare;
  const length = veilLength(stipe) * tier.length;
  const points = Math.max(3, Math.round(stipe.veilPoints));

  return {
    length,
    place(u, theta, out) {
      const cusp = Math.abs(Math.cos((theta * points) / 2 + tier.phase)) ** 3;
      const hem = 1 - stipe.veilScallop * (1 - cusp);
      const w = u * hem;
      const r = rTop + (rHem - rTop) * Math.sin((w * Math.PI) / 2) ** 0.75;
      const flick = Math.max(0, (w - 0.6) / 0.4) ** 2;
      const kick = stipe.veilKick * length * 0.18 * cusp * flick;

      out[0] = stipe.bendX + Math.cos(theta) * (r + kick * 1.2);
      out[1] = top[1] - length * w + kick * 0.8;
      out[2] = stipe.bendZ + Math.sin(theta) * (r + kick * 1.2);

      return out;
    },
    rHem,
  };
}

function veilTiers(stipe) {
  const tiers = [{ flare: 1, from: 0.96, length: 1, phase: 0 }];

  if (stipe.veilTiers > 1) {
    tiers.push({ flare: 0.62, from: 0.72, length: 0.55, phase: Math.PI / 2 });
  }

  return tiers;
}

function buildVeil(e, g, rng, surf, detail) {
  const { cap, stipe } = g;
  const from = 0.14;

  veilTiers(stipe).forEach((tier, index) => {
    const skirt = veilSkirt(stipe, cap, surf, tier);

    buildNetwork(e, rng, {
      beads: stipe.veilBeads,
      born: (s) => 0.78 + 0.2 * s,
      color: (s) => (index === 0 ? 0.46 + 0.5 * s ** 2 : 0.9 + 0.1 * s),
      density: stipe.veilDensity * detail * tier.length * tier.flare,
      domain: { from, span: TAU, to: 1 },
      gradient: 1.1,
      loops: 1,
      place: (s, theta, out) =>
        skirt.place((s - from) / (1 - from), theta, out),
      radius: cap.radius,
      sag: (s) => skirt.length * 0.2 * s,
      stretch: 1.6,
      thickness: cap.radius * (index === 0 ? 0.011 : 0.008),
    });
  });
}

// The member's head — cap, gills, fringe and veil — as spheres around the
// stem top, for the clump layout to keep heads and stems apart.
export function agaricHead(g) {
  const { cap, stipe } = g;
  const surf = capSurface(cap, stipe);
  const top = [stipe.bendX, stipe.height, stipe.bendZ];
  const out = [];
  const rings = 5;
  const around = 16;
  const gill = cap.surface === 'fibril' ? g.gills.depth * cap.radius : 0;
  const p = [0, 0, 0];
  const q = [0, 0, 0];

  for (let j = 0; j <= rings; j += 1) {
    const s = j / rings;
    const n = j === 0 ? 1 : around;
    const r = Math.max(
      cap.radius * (1 + cap.lobeAmp) * (Math.PI / around) * s,
      cap.radius * 0.08
    );

    for (let i = 0; i < n; i += 1) {
      const theta = (TAU * i) / n;

      surf.at(s, theta, false, p);
      surf.at(s, theta, true, q);
      out.push([p[0] - top[0], p[1] - top[1], p[2] - top[2], r]);
      if (j > 0) {
        out.push([
          q[0] - top[0],
          q[1] - top[1] - gill * (1 - s) ** 0.4 * 0.6,
          q[2] - top[2],
          r,
        ]);
      }
    }
  }

  const hang = cap.fringe > 0 ? fringeHang(g) : 0;

  if (hang > 0) {
    for (let i = 0; i < around; i += 1) {
      const theta = (TAU * i) / around;

      surf.at(0.8, theta, true, p);
      for (let k = 1; k <= 3; k += 1) {
        out.push([
          p[0] - top[0],
          p[1] - top[1] - (hang * k) / 3,
          p[2] - top[2],
          cap.radius * 0.12,
        ]);
      }
    }
  }

  if (stipe.veil > 0) {
    veilTiers(stipe)
      .slice(0, 1)
      .forEach((tier) => {
        const skirt = veilSkirt(stipe, cap, surf, tier);

        for (let k = 1; k <= 4; k += 1) {
          for (let i = 0; i < around; i += 1) {
            skirt.place(k / 4, (TAU * i) / around, p);
            out.push([
              p[0] - top[0],
              p[1] - top[1],
              p[2] - top[2],
              (skirt.rHem * Math.PI) / around,
            ]);
          }
        }
      });
  }

  return out;
}

// One agaric member in its own local frame (+Y up, stem foot at the origin).
export default function buildAgaric(e, g, rng, noise, detail = 1) {
  const surf = capSurface(g.cap, g.stipe);

  buildStipe(e, g, rng, noise, surf, detail);
  buildFibrils(e, g, rng, noise, surf, detail);
  buildGills(e, g, rng, noise, surf, detail);
  if (g.cap.warts > 0) buildWarts(e, g, rng, surf);
  if (g.cap.scales > 0) buildScales(e, g, rng, surf, detail);
  if (g.cap.fringe > 0) buildFringe(e, g, rng, noise, surf, detail);
  if (g.stipe.veil > 0) buildVeil(e, g, rng, surf, detail);

  const top = surf.at(0, 0);

  return { height: top[1], reach: g.cap.radius * (1 + g.cap.lobeAmp) };
}
