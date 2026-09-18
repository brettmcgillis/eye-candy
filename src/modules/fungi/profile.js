export const CAP_POINTS = 40;
export const UNDER_POINTS = 24;
export const STIPE_POINTS = 24;
export const VEIL_POINTS = 10;
export const VOLVA_POINTS = 8;
export const INDUSIUM_POINTS = 12;
export const GROW_KEYS = [0, 0.1, 0.22, 0.36, 0.5, 0.64, 0.8, 1];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// The margin angle at which a superellipse cap of radius R closes onto a
// stipe of radius rs.
const closedAngle = (R, rs, p) =>
  Math.PI - Math.asin(clamp((rs / R) ** (p / 2), 0, 0.999));

function stages(genome, grow) {
  const { plan } = genome;
  const emerge = plan === 'bracket' ? 1 : smooth(0, 0.14, grow);
  const swell = smooth(0.04, 0.42, grow);
  if (plan === 'agaric' || plan === 'cup') {
    return {
      elongate: smooth(0.3, 0.72, grow),
      emerge,
      open: smooth(0.5, 1, grow),
      swell,
    };
  }
  return { elongate: swell, emerge, open: 1, swell: smooth(0, 1, grow) };
}

function shapeAt(g, grow, rot) {
  const { elongate, emerge, open, swell } = stages(g, grow);
  const R = g.capR;
  const rsFull = g.plan === 'bracket' ? 0 : g.stipeR;
  const buttonR = Math.max(rsFull * 1.3, R * 0.45);
  const k = lerp(0.12, 1, swell);
  const opened = g.plan === 'agaric' || g.plan === 'cup';

  let capR = opened ? lerp(buttonR, R, open) * k : R * k;
  let capH = opened
    ? lerp(buttonR * 1.1, g.capHeight * R, open) * k
    : g.capHeight * R * k;
  const power = opened ? lerp(2, g.capPower, open) : g.capPower;
  const rs = rsFull * k;
  const openAngle = lerp(
    Math.PI / 2,
    closedAngle(R, rsFull, g.capPower),
    g.closure
  );
  let margin = opened
    ? lerp(closedAngle(capR, rs, power), openAngle, open)
    : lerp(Math.PI / 2, closedAngle(capR, rs, power), g.closure);
  let stipeH = lerp(g.stipeH * 0.18, g.stipeH, elongate) * k;
  let { bend } = g;
  let sink = (1 - emerge) * (stipeH + capH) * 1.05;
  let depression = g.depression * (opened ? open * open : 1);

  if (rot > 0) {
    if (g.rot === 'collapse') {
      bend += rot * 0.7;
      stipeH *= 1 - 0.3 * rot;
      capH *= 1 - 0.45 * rot;
      margin += rot * 0.5;
      sink += rot * 0.06 * g.stipeH;
    } else if (g.rot === 'deliquesce') {
      capR *= 1 - 0.55 * rot;
      margin = lerp(margin, Math.PI / 2 - 0.55, rot);
      depression *= 1 - rot;
    } else {
      const wilt = 1 - 0.35 * rot;
      capR *= wilt;
      capH *= wilt * (1 - 0.25 * rot);
      stipeH *= wilt;
      bend += rot * 0.35;
      sink += rot * 0.04 * g.stipeH;
    }
  }

  return {
    bend,
    swell,
    capH,
    capR,
    depression,
    elongate,
    margin,
    open,
    power,
    rs,
    sink,
    stipeH,
  };
}

function capTopAt(s, phi) {
  const sin = Math.abs(Math.sin(phi));
  const cos = Math.cos(phi);
  const e = 2 / s.power;
  const r = s.capR * sin ** e;
  const u = r / Math.max(s.capR, 1e-6);
  const y =
    s.capH * Math.sign(cos) * Math.abs(cos) ** e +
    s.umbo * Math.exp(-((u / 0.22) ** 2)) +
    s.depression *
      s.capR *
      (s.bowl
        ? 0.75 * (1 - Math.sqrt(Math.max(0, 1 - u * u)))
        : 0.6 * u ** 1.4);
  return [r, y];
}

function capCurves(g, s) {
  const top = new Float32Array(CAP_POINTS * 2);
  for (let i = 0; i < CAP_POINTS; i += 1) {
    const phi = (s.margin * i) / (CAP_POINTS - 1);
    const [r, y] = capTopAt(s, phi);
    top[i * 2] = r;
    top[i * 2 + 1] = y;
  }

  const thicknessAt = (phi) =>
    g.capThick *
    s.capR *
    lerp(1, 0.12, clamp(phi / Math.max(s.margin, Math.PI / 2), 0, 1) ** 1.8);
  const offsetAt = (phi) => {
    const d = 1e-3;
    const [r0, y0] = capTopAt(s, Math.max(0, phi - d));
    const [r1, y1] = capTopAt(s, phi + d);
    const tr = r1 - r0;
    const ty = y1 - y0;
    const len = Math.hypot(tr, ty) || 1;
    const [r, y] = capTopAt(s, phi);
    const t = thicknessAt(phi);
    return {
      n: [-ty / len, tr / len],
      p: [r + (ty / len) * t, y - (tr / len) * t],
    };
  };

  let junction = s.margin;
  for (let i = 0; i <= 200; i += 1) {
    const phi = (s.margin * i) / 200;
    if (offsetAt(phi).p[0] >= s.rs) {
      junction = phi;
      break;
    }
  }

  const under = new Float32Array(UNDER_POINTS * 2);
  const edge = new Float32Array(UNDER_POINTS * 2);
  const depth = g.gillDepth * s.capR;
  for (let i = 0; i < UNDER_POINTS; i += 1) {
    const f = i / (UNDER_POINTS - 1);
    const phi = lerp(s.margin, junction, f);
    const { n, p } = offsetAt(phi);
    const along = 1 - f;
    let dx;
    let dy;
    if (g.hymenium === 'teeth') {
      const h = depth * Math.min(1, along * 5) * Math.min(1, f * 6);
      dx = 0;
      dy = -h;
    } else {
      const h =
        depth * Math.min(1, (along ** 0.35 * (1 - along) ** 0.55) / 0.52);
      dx = -n[0] * h;
      dy = -n[1] * h;
    }
    const [pr, py] = p;
    under[i * 2] = pr;
    under[i * 2 + 1] = py;
    edge[i * 2] = Math.max(0, pr + dx);
    edge[i * 2 + 1] = py + dy;
  }

  const drop =
    g.plan === 'puffball' || g.plan === 'sporangium'
      ? top[(CAP_POINTS - 1) * 2 + 1]
      : under[(UNDER_POINTS - 1) * 2 + 1];
  for (let i = 0; i < CAP_POINTS; i += 1) top[i * 2 + 1] -= drop;
  for (let i = 0; i < UNDER_POINTS; i += 1) {
    under[i * 2 + 1] -= drop;
    edge[i * 2 + 1] -= drop;
  }

  return { edge, top, under };
}

function stipeCurve(g, s) {
  const stipe = new Float32Array(STIPE_POINTS * 3);
  const coilTurns = g.coil * 3;
  for (let i = 0; i < STIPE_POINTS; i += 1) {
    const v = i / (STIPE_POINTS - 1);
    const bulb = g.bulb * 0.9 * Math.exp(-((v / 0.14) ** 2));
    const r = Math.max(s.rs * 0.2, s.rs * (1 + g.stipeTaper * (1 - v) + bulb));
    const x =
      s.bend * s.stipeH * 0.35 * v * v +
      g.coil * s.stipeH * 0.08 * Math.sin(v * coilTurns * Math.PI * 2);
    stipe[i * 3] = r;
    stipe[i * 3 + 1] = v * s.stipeH - s.sink;
    stipe[i * 3 + 2] = x;
  }
  return stipe;
}

function veilCurve(g, s, stipe, capOrigin, top) {
  const veil = new Float32Array(VEIL_POINTS * 2);
  if (g.ring <= 0) return veil;
  const index = Math.round(g.ringAt * (STIPE_POINTS - 1));
  const attach = [stipe[index * 3], stipe[index * 3 + 1]];
  const last = (CAP_POINTS - 1) * 2;
  const margin = [top[last], top[last + 1] + capOrigin[1]];
  const tear = smooth(0.55, 0.85, s.open);
  const skirt = g.ring * s.capR * 0.3;
  for (let i = 0; i < VEIL_POINTS; i += 1) {
    const f = i / (VEIL_POINTS - 1);
    const membrane = [
      lerp(attach[0], margin[0], f),
      lerp(attach[1], margin[1], f) - Math.sin(f * Math.PI) * s.capR * 0.04,
    ];
    const hanging = [
      attach[0] + skirt * 0.45 * f ** 1.5,
      attach[1] - skirt * f,
    ];
    veil[i * 2] = lerp(membrane[0], hanging[0], tear);
    veil[i * 2 + 1] = lerp(membrane[1], hanging[1], tear);
  }
  return veil;
}

// The stinkhorn's net skirt: from just under the cap it flares down round the
// stipe, unfurling only once the fruiting body is nearly grown.
function indusiumCurve(g, s, capOrigin) {
  const net = new Float32Array(INDUSIUM_POINTS * 2);
  if (g.indusium <= 0) return net;
  const unfurl = smooth(0.55, 1, s.swell * s.open);
  const length = g.indusium * s.stipeH * 0.85 * unfurl;
  for (let i = 0; i < INDUSIUM_POINTS; i += 1) {
    const f = i / (INDUSIUM_POINTS - 1);
    net[i * 2] = lerp(s.rs * 1.25, s.capR * lerp(0.9, 1.35, unfurl), f ** 0.8);
    net[i * 2 + 1] = capOrigin[1] - s.capR * 0.05 - f * length;
  }
  return net;
}

function volvaCurve(g, s, stipe) {
  const volva = new Float32Array(VOLVA_POINTS * 2);
  if (g.volva <= 0) return volva;
  const base = stipe[0] * 1.08;
  const height = g.volva * g.stipeH * 0.14 * lerp(0.4, 1, s.elongate);
  for (let i = 0; i < VOLVA_POINTS; i += 1) {
    const f = i / (VOLVA_POINTS - 1);
    volva[i * 2] =
      base * (1 + 0.35 * Math.sin(f * Math.PI * 0.6)) + f * base * 0.1;
    volva[i * 2 + 1] = f * height - s.sink;
  }
  return volva;
}

// A member's side profile at one moment: lathe curves (r, y) for the cap in
// its own frame (origin where the underside meets the stipe apex), the stipe
// spine (r, y, x) in the member frame, and the veil/volva around it.
const lowestOf = ({ edge, top, under }) => {
  let low = 0;
  [edge, top, under].forEach((curve) => {
    for (let i = 1; i < curve.length; i += 2) low = Math.min(low, curve[i]);
  });
  return low;
};

const tierPlacements = (count) =>
  Array.from({ length: count - 1 }, (_, i) => ({
    scale: 1 + 0.18 * (i + 1),
    v: 1 - 0.26 * (i + 1),
  }));

export function profileAt(genome, grow, rot = 0) {
  const shape = shapeAt(genome, grow, rot);
  const s = {
    ...shape,
    bowl: genome.plan === 'cup',
    umbo: genome.umbo * genome.capR * lerp(0.5, 1, shape.open),
  };
  const cap = capCurves(genome, s);
  const hang = -lowestOf(cap);
  if (genome.plan !== 'bracket' && s.stipeH < hang * 1.03) {
    s.stipeH = hang * 1.03;
  }
  const stipe = stipeCurve(genome, s);
  const apex = (STIPE_POINTS - 1) * 3;
  const prev = (STIPE_POINTS - 2) * 3;
  const capOrigin = [stipe[apex + 2], stipe[apex + 1]];
  const capTilt = Math.atan2(
    stipe[apex + 2] - stipe[prev + 2],
    stipe[apex + 1] - stipe[prev + 1] || 1e-6
  );
  const tiers = tierPlacements(genome.tiers);

  return {
    capH: s.capH,
    capOrigin,
    capR: s.capR,
    capTilt,
    edge: cap.edge,
    sink: s.sink,
    stipe,
    tiers,
    top: cap.top,
    under: cap.under,
    indusium: indusiumCurve(genome, s, capOrigin),
    veil: veilCurve(genome, s, stipe, capOrigin, cap.top),
    volva: volvaCurve(genome, s, stipe),
  };
}

// Pagoda tiers are an alien trait; drop the lowest ones until every tier's
// cap clears the ground at maturity.
export function fitTiers(genome) {
  for (let count = genome.tiers; count > 1; count -= 1) {
    const mature = profileAt({ ...genome, tiers: 1 }, 1, 0);
    const stipeH = mature.capOrigin[1];
    const low = lowestOf(mature);
    const clears = tierPlacements(count).every(
      ({ scale, v }) => v * stipeH + low * scale > 0.12 * stipeH
    );
    if (clears) return { ...genome, tiers: count };
  }
  return { ...genome, tiers: 1 };
}

export function keyframesFor(genome) {
  return {
    grow: GROW_KEYS.map((g) => profileAt(genome, g, 0)),
    rot: profileAt(genome, 1, 1),
  };
}
