import {
  NOISE_STEP,
  decayAt,
  dripAt,
  eyeHoleDistance,
} from '@elements/WebGPU/cloth/clothDecay';
import {
  chain,
  createProjector,
  createTone,
  isoSegments,
  nearSilhouette,
  outlineOf,
  outlineRuns,
  pathOf,
  penPx,
  plotLayer,
  regionFill,
  rowsWalk,
  shadePath,
  silhouetteRuns,
  spiralWalk,
  textureRuns,
} from '@modules/plotKit';

import stormRuns, { unionOf, unoccluded } from './storm';

const clamp01 = (value) => Math.min(1, Math.max(0, value));

// The material's alphaTest: cloth above this alpha is drawn, however faint.
const ALPHA_CUT = 0.01;

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit3 = (v) => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// The baked noise, sampled bilinearly as the texture is.
function noiseSampler({ size, table }) {
  return (u, v) => {
    const fx = clamp01(u) * (size - 1);
    const fy = clamp01(v) * (size - 1);
    const x0 = Math.min(Math.floor(fx), size - 2);
    const y0 = Math.min(Math.floor(fy), size - 2);
    const tx = fx - x0;
    const ty = fy - y0;
    const at = (x, y) => table[y * size + x];
    const a = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const b = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return a * (1 - ty) + b * ty;
  };
}

const freeEdgeDistance = (u, v, pinned) =>
  Math.min(
    pinned.left ? 1 : u,
    pinned.right ? 1 : 1 - u,
    pinned.top ? 1 : v,
    pinned.bottom ? 1 : 1 - v
  );

// The shader's per-pixel holes and tatters (smoothEdges skins), sampled
// from the same baked noise.
function createTear({ holeAmount, noise, pinned, tatterEdge }) {
  const sample = noiseSampler(noise);
  const W = 0.08;
  const holeThresh = 1 - holeAmount * 0.4;
  const tatterDepth = tatterEdge * 0.5 + 0.0001;
  return (u, v) => {
    const n = sample(u, v);
    const holeAlpha = 1 - smoothstep(holeThresh - W, holeThresh + W, n);
    const tDepth = clamp01(freeEdgeDistance(u, v, pinned) / tatterDepth);
    const tatterThresh = 0.7 - tDepth * 0.65;
    const raw = smoothstep(tatterThresh - W, tatterThresh + W, n);
    return holeAlpha * (raw + (1 - raw) * tDepth);
  };
}

// clothDecay's rot, blood and drips at lattice (u, v), at the drips' clock.
function createDecay({ noise, params, pinned, table }, time) {
  const sample = noise ? noiseSampler(noise) : null;
  const tatterDepth = params.tatterEdge * 0.5 + 0.0001;
  return {
    drip: (u, v) => dripAt(u, 1 - v, time, params, table),
    stain(u, v) {
      if (!sample) return { blood: 0, rot: 0 };
      const e = NOISE_STEP;
      const slope =
        Math.hypot(
          sample(u + e, v) - sample(u - e, v),
          sample(u, v + e) - sample(u, v - e)
        ) /
        (2 * e);
      return decayAt(
        sample(u, v),
        slope,
        sample(1 - u, v),
        clamp01(freeEdgeDistance(u, v, pinned) / tatterDepth),
        params
      );
    },
  };
}

// The draped cloth exactly as the GPU draws it: one render vertex per sim
// quad (the mean of its corners, alpha included), dead quads dropped, and
// each grid cell split into the two triangles the index buffer uses, so a
// line drawn in UV lands on the drawn surface. Eye holes are cut per pixel
// as the shader cuts them, in its UVs (whose v runs opposite the lattice).
function createSurface(
  {
    alpha,
    cutouts,
    positions,
    segmentsX,
    segmentsY,
    shapeDist,
    decay = null,
    tear = null,
  },
  time = 0
) {
  const simAt = (x, y) => x * (segmentsY + 1) + y;
  const count = segmentsX * segmentsY;
  const at = (gx, gy) => gy * segmentsX + gx;
  const rPos = new Float64Array(count * 3);
  const rAlpha = new Float64Array(count);
  const live = new Uint8Array(count);
  for (let gx = 0; gx < segmentsX; gx += 1) {
    for (let gy = 0; gy < segmentsY; gy += 1) {
      const corners = [
        simAt(gx, gy),
        simAt(gx + 1, gy),
        simAt(gx, gy + 1),
        simAt(gx + 1, gy + 1),
      ];
      const m = at(gx, gy);
      live[m] = corners.every((c) => shapeDist[c] >= 0) ? 1 : 0;
      corners.forEach((c) => {
        rAlpha[m] += alpha[c] / 4;
        for (let k = 0; k < 3; k += 1)
          rPos[m * 3 + k] += positions[c * 3 + k] / 4;
      });
    }
  }

  // The cell holding (u, v), the triangle it falls in, and its weights.
  function locate(u, v) {
    const fx = Math.min(Math.max(u * segmentsX - 0.5, 0), segmentsX - 1.000001);
    const fy = Math.min(Math.max(v * segmentsY - 0.5, 0), segmentsY - 1.000001);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const c00 = at(x0, y0);
    const c10 = at(x0 + 1, y0);
    const c01 = at(x0, y0 + 1);
    const c11 = at(x0 + 1, y0 + 1);
    const inside =
      u * segmentsX >= 0.5 &&
      u * segmentsX <= segmentsX - 0.5 &&
      v * segmentsY >= 0.5 &&
      v * segmentsY <= segmentsY - 0.5;
    return ty >= tx
      ? {
          alive: inside && live[c11] && live[c01] && live[c00],
          weights: [
            [c00, 1 - ty],
            [c01, ty - tx],
            [c11, tx],
          ],
        }
      : {
          alive: inside && live[c11] && live[c00] && live[c10],
          weights: [
            [c00, 1 - tx],
            [c10, tx - ty],
            [c11, ty],
          ],
        };
  }

  const mix = (array, stride, offset, weights) =>
    weights.reduce((sum, [m, w]) => sum + array[m * stride + offset] * w, 0);

  const tearAlpha = tear ? createTear(tear) : () => 1;
  const decayed = decay ? createDecay(decay, time) : null;
  const dripAlpha = decay?.table ? (u, v) => decayed.drip(u, v).alpha : () => 1;

  // The drawn alpha; above ALPHA_CUT is cloth.
  function field(u, v) {
    const { alive, weights } = locate(u, v);
    if (!alive) return 0;
    let f = mix(rAlpha, 1, 0, weights) * tearAlpha(u, v) * dripAlpha(u, v);
    cutouts.forEach((cutout) => {
      const width = cutout.fade ?? cutout.radius * 0.4;
      const hole = decay
        ? eyeHoleDistance(u, 1 - v, cutout, decay.params)
        : Math.hypot(u - cutout.u, 1 - v - cutout.v) - cutout.radius;
      f *= clamp01((hole + width) / width);
    });
    return f;
  }

  function point(u, v) {
    const { weights } = locate(u, v);
    return [0, 1, 2].map((axis) => mix(rPos, 3, axis, weights));
  }

  // Vertex normals as the shader builds them (across and along the grid),
  // for the fold contours: where the cloth turns edge-on to the camera.
  const rNormal = new Float64Array(count * 3);
  const posAt = (gx, gy) => {
    const m = at(
      Math.min(Math.max(gx, 0), segmentsX - 1),
      Math.min(Math.max(gy, 0), segmentsY - 1)
    );
    return [rPos[m * 3], rPos[m * 3 + 1], rPos[m * 3 + 2]];
  };
  for (let gx = 0; gx < segmentsX; gx += 1) {
    for (let gy = 0; gy < segmentsY; gy += 1) {
      const n = unit3(
        cross3(
          sub3(posAt(gx, gy + 1), posAt(gx, gy - 1)),
          sub3(posAt(gx + 1, gy), posAt(gx - 1, gy))
        )
      );
      rNormal.set(n, at(gx, gy) * 3);
    }
  }
  function facing(u, v, eye) {
    const { weights } = locate(u, v);
    const p = [0, 1, 2].map((axis) => mix(rPos, 3, axis, weights));
    const n = [0, 1, 2].map((axis) => mix(rNormal, 3, axis, weights));
    const view = unit3(sub3(p, eye));
    return n[0] * view[0] + n[1] * view[1] + n[2] * view[2];
  }

  return {
    decayed,
    facing,
    field,
    point,
    resolution: Math.max(segmentsX, segmentsY),
  };
}

const FILL_LAYERS = [
  { index: 20, key: 'cloth', label: 'cloth fill' },
  { index: 21, key: 'shadow', label: 'cloth shadow' },
  { index: 22, key: 'inside', label: 'inside fill' },
  { index: 23, key: 'goo', label: 'goo fill' },
  { index: 24, key: 'rot', label: 'rot fill' },
  { index: 25, key: 'blood', label: 'blood fill' },
];

const shadeOf = (hex, k) => {
  const value = /^#([0-9a-f]{6})$/iu.exec(hex ?? '')?.[1];
  if (!value) return '#000000';
  return `#${[0, 2, 4]
    .map((i) =>
      Math.round(parseInt(value.slice(i, i + 2), 16) * k)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
};

// Each fill layer's suggested pen: the skin's own colours.
const fillColors = (skin) => ({
  blood: skin?.bloodColor ?? '#000000',
  cloth: skin?.color ?? '#000000',
  goo: skin?.dripColor ?? '#000000',
  inside:
    (skin?.innerEmissiveIntensity > 0
      ? skin.innerEmissiveColor
      : skin?.innerColor) ?? '#000000',
  rot: skin?.holeRimColor ?? '#000000',
  shadow: shadeOf(skin?.color, 0.55),
});

const pxPerMm = ({ plotWidthMm, width }) =>
  plotWidthMm ? width / plotWidthMm : 96 / 25.4;

// How many output px one unit of UV spans on the visible cloth (the
// median, so foreshortened edges don't set it), and which way the cloth's
// normals face where it is seen from outside: the nearest visible point is.
function surveyCloth(surface, project, visible) {
  const scales = [];
  let nearest = null;
  const e = 1e-3;
  for (let i = 1; i < 48; i += 1) {
    for (let j = 1; j < 48; j += 1) {
      const u = i / 48;
      const v = j / 48;
      if (surface.field(u, v) > ALPHA_CUT) {
        const p = project(...surface.point(u, v));
        if (p.depth > 0 && (!visible || visible(p.x, p.y, p.depth))) {
          const q = project(...surface.point(u + e, v));
          const r = project(...surface.point(u, v + e));
          scales.push(
            (Math.hypot(q.x - p.x, q.y - p.y) +
              Math.hypot(r.x - p.x, r.y - p.y)) /
              (2 * e)
          );
          if (!nearest || p.depth < nearest.depth) {
            nearest = { depth: p.depth, u, v };
          }
        }
      }
    }
  }
  scales.sort((a, b) => a - b);
  return {
    nearest,
    scale: scales.length ? scales[Math.floor(scales.length / 2)] : 0,
  };
}

const insidePolygon = (polygon, x, y) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

// The cloth filled with one long line that follows it — a spiral round the
// crown (`spiral`) or rows across it (`rows`) — wiggling by tone. The line
// is split by what lies under it, each piece onto its region's layer: the
// cloth, its inside seen through an eye hole (or each hole filled with a
// spiral of its own), and the skin's goo, rot and blood. Where the drape
// packs turns closer than `minGap` px only every second (fourth…) turn is
// drawn, swinging wider. With two shades a second line between the first's
// turns draws only the shadows. The eye rims are left to their own layer.
function clothFill({
  camera,
  decayed,
  fill,
  height,
  lattice,
  project,
  rims,
  surface,
  tone,
  visible,
  width,
}) {
  const { nearest, scale } = surveyCloth(surface, project, visible);
  if (!nearest || !scale) return {};
  const outerSign = Math.sign(surface.facing(nearest.u, nearest.v, camera.eye));
  const pitch = fill.spacing / scale;
  const params = lattice.decay?.params ?? null;
  const holeDistance = (u, v, cutout) =>
    params
      ? eyeHoleDistance(u, 1 - v, cutout, params)
      : Math.hypot(u - cutout.u, 1 - v - cutout.v) - cutout.radius;
  const fadeOf = (cutout) => cutout.fade ?? cutout.radius * 0.4;
  const inRim = (u, v) =>
    rims &&
    lattice.cutouts.some((cutout) => {
      const d = holeDistance(u, v, cutout) - (rims.offset - fadeOf(cutout));
      return d >= 0 && d <= rims.width;
    });

  // Each eye hole's visible edge: its UV radius by angle round the centre,
  // and that edge on screen.
  const holes = lattice.cutouts.map((cutout) => {
    const center = [cutout.u, 1 - cutout.v];
    const open = (u, v) => holeDistance(u, v, cutout) < -fadeOf(cutout);
    const radii = Array.from({ length: 72 }, (_, k) => {
      const a = (k / 72) * 2 * Math.PI;
      const at = (r) => [
        center[0] + r * Math.cos(a),
        center[1] + r * Math.sin(a),
      ];
      let lo = 0;
      let hi = cutout.radius * 3;
      for (let n = 0; n < 24; n += 1) {
        const mid = (lo + hi) / 2;
        if (open(...at(mid))) lo = mid;
        else hi = mid;
      }
      return lo;
    });
    const edge = radii.map((r, k) => {
      const a = (k / 72) * 2 * Math.PI;
      const p = project(
        ...surface.point(
          center[0] + r * Math.cos(a),
          center[1] + r * Math.sin(a)
        )
      );
      return [p.x, p.y];
    });
    const radiusAt = (a) => {
      const f = (((a / (2 * Math.PI)) % 1) + 1) % 1;
      const k = f * 72;
      const k0 = Math.floor(k) % 72;
      const t = k - Math.floor(k);
      return radii[k0] * (1 - t) + radii[(k0 + 1) % 72] * t;
    };
    return { center, edge, open, radiusAt };
  });
  const throughHole = (x, y) =>
    holes.some((hole) => insidePolygon(hole.edge, x, y));

  const stains =
    decayed && params && (params.holeRimWidth > 0 || params.bloodAmount > 0);
  const goo =
    decayed?.drip && params?.dripAmount > 0
      ? (u, v) => decayed.drip(u, v).goo > 0.5
      : () => false;

  const regionAt = (u, v, p) => {
    if (surface.field(u, v) <= ALPHA_CUT) return null;
    if (visible && !visible(p.x, p.y, p.depth)) return null;
    if (inRim(u, v)) return null;
    if (goo(u, v)) return 'goo';
    if (stains) {
      const { blood, rot } = decayed.stain(u, v);
      if (blood > 0.5) return 'blood';
      if (rot > 0.5) return 'rot';
    }
    const outside = Math.sign(surface.facing(u, v, camera.eye)) === outerSign;
    if (outside || !throughHole(p.x, p.y)) return 'cloth';
    return fill.inside === 'cloth' ? 'inside' : null;
  };

  const onScreen = (p) =>
    p.depth > 0 && p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;

  // Turns the drape packs tighter than minGap: only every 2^level-th is
  // drawn there, and swings 2^level times as wide.
  const thinning = ([u, v], { normal, turn }, p) => {
    const q = project(
      ...surface.point(u - normal[0] * pitch, v - normal[1] * pitch)
    );
    const gap = Math.hypot(q.x - p.x, q.y - p.y);
    if (gap >= fill.minGap) return 1;
    const level = Math.min(
      5,
      Math.ceil(Math.log2(fill.minGap / Math.max(gap, 1e-3)))
    );
    const spread = 2 ** level;
    return turn % spread ? 0 : spread;
  };

  const sample = (uv, point) => {
    const [u, v] = uv;
    if (u < 0 || v < 0 || u > 1 || v > 1) return null;
    const p = project(...surface.point(u, v));
    if (!onScreen(p)) return null;
    const region = regionAt(u, v, p);
    if (!region) return null;
    const spread = point.swung ? 1 : thinning(uv, point, p);
    if (!spread) return null;
    return { region, spread, tone: tone(p.x, p.y), x: p.x, y: p.y };
  };

  const step = pitch / 8;
  const walkOf = (phase) =>
    fill.mode === 'rows'
      ? rowsWalk({ phase, pitch, step })
      : spiralWalk({ phase, pitch, radius: 0.5, step });
  const split = fill.shades > 1 ? fill.shadow : 1;
  // Darker waves are tighter, but never so tight that a wave's two sides
  // come closer than minGap.
  const wavelength = (t) => Math.max(fill.spacing * (1.6 - t), 2 * fill.minGap);
  const layers = regionFill({
    amplitude: (t) => fill.wiggle * Math.min(1, t / split),
    pitch,
    sample,
    walk: walkOf(0),
    wavelength,
  });
  if (fill.shades > 1) {
    const shadow = regionFill({
      amplitude: (t) => fill.wiggle * Math.max(0, (t - split) / (1 - split)),
      pitch,
      sample: (uv, point) => {
        const hit = sample(uv, point);
        return hit?.region === 'cloth' && hit.tone > split
          ? { ...hit, region: 'shadow' }
          : null;
      },
      walk: walkOf(0.5),
      wavelength,
    });
    layers.shadow = shadow.shadow ?? [];
  }

  // A hole filled by a spiral of its own shape: one stroke per eye.
  if (fill.inside === 'hole') {
    layers.inside = holes.flatMap((hole) => {
      const mean =
        hole.edge.length && hole.radiusAt
          ? Array.from({ length: 12 }, (_, k) =>
              hole.radiusAt((k / 12) * 2 * Math.PI)
            ).reduce((sum, r) => sum + r, 0) / 12
          : 0;
      if (!mean) return [];
      const share = pitch / mean;
      const walk = [];
      for (let a = 0; (a / (2 * Math.PI)) * share < 1; ) {
        const f = (a / (2 * Math.PI)) * share;
        const r = f * hole.radiusAt(a);
        const dir = [Math.cos(a), Math.sin(a)];
        walk.push({
          normal: dir,
          turn: 0,
          uv: [hole.center[0] + r * dir[0], hole.center[1] + r * dir[1]],
        });
        a += step / Math.max(r, step);
      }
      return (
        regionFill({
          amplitude: (t) => fill.wiggle * t,
          pitch,
          sample: (uv) => {
            if (!hole.open(...uv)) return null;
            const p = project(...surface.point(...uv));
            return onScreen(p)
              ? { region: 'inside', tone: tone(p.x, p.y), x: p.x, y: p.y }
              : null;
          },
          walk,
          wavelength,
        }).inside ?? []
      );
    });
  }
  return layers;
}

function uvLines(style, count, step) {
  const lines = [];
  const ring = (r) => {
    const n = Math.max(12, Math.ceil((2 * Math.PI * r) / step));
    lines.push(
      Array.from({ length: n + 1 }, (_, i) => {
        const a = (i / n) * 2 * Math.PI;
        return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
      })
    );
  };
  const spoke = (a) => {
    const n = Math.ceil(0.5 / step);
    lines.push(
      Array.from({ length: n + 1 }, (_, i) => {
        const r = (i / n) * 0.5;
        return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
      })
    );
  };
  const straight = (fixed, along) => {
    const n = Math.ceil(1 / step);
    lines.push(
      Array.from({ length: n + 1 }, (_, i) =>
        along === 'u' ? [i / n, fixed] : [fixed, i / n]
      )
    );
  };

  if (style === 'rings' || style === 'mesh') {
    for (let k = 1; k <= count; k += 1) ring((k / count) * 0.5);
  }
  if (style === 'spokes' || style === 'mesh') {
    for (let k = 0; k < count; k += 1) spoke((k / count) * 2 * Math.PI);
  }
  if (style === 'grid') {
    for (let k = 1; k < count; k += 1) {
      straight(k / count, 'u');
      straight(k / count, 'v');
    }
  }
  return lines;
}

// Line work for a settled ghost: UV contours drawn across the cloth, its
// edges and (`folds`) where it turns edge-on to the camera, projected through the capture camera and cut wherever the cloth is
// missing or (given `visible`) hidden behind nearer cloth; and, given the
// depth pass's `coverage`, the silhouette and the `shade` (crosshatch,
// halftone or stipple from the render) each on a layer of their own.
export default function renderGhostSvg({
  camera,
  decay = true,
  edges = true,
  fill = null,
  folds = true,
  height,
  lattice,
  lines = 40,
  outline = null,
  paper = '#ffffff',
  coverage = null,
  image = null,
  pixelRatio = 1,
  rims = null,
  shade = null,
  silhouette = false,
  storm = null,
  stroke = 0.6,
  style = 'rings',
  texture = null,
  time = 0,
  visible = null,
  weave = null,
  width,
}) {
  const cloud = storm?.cloud ?? null;
  const cloudCoverage = cloud?.coverage ?? null;
  const ghostSeen = coverage ? unoccluded(coverage, cloudCoverage) : null;
  const painted = coverage ? unionOf(coverage, cloudCoverage) : null;
  const surface = createSurface(lattice, time);
  const browed =
    lattice.decay &&
    (lattice.decay.params.cutoutBrow > 0 ||
      lattice.decay.params.cutoutBrowSlant > 0);
  const project = createProjector(camera, width, height);
  const step = 1 / (surface.resolution * 3);
  const paths = [];

  // On the silhouette: the outline layer draws it, so edges and folds there
  // would only double the stroke.
  const onOutline =
    silhouette && ghostSeen
      ? nearSilhouette(ghostSeen, pixelRatio)
      : () => false;

  const trace = (uvs, into, { onEdge = false } = {}) => {
    let run = [];
    const flush = () => {
      if (run.length > 1) into.push(run);
      run = [];
    };
    uvs.forEach(([u, v]) => {
      const onCloth = onEdge || surface.field(u, v) > ALPHA_CUT;
      const [x, y, z] = surface.point(u, v);
      const p = project(x, y, z);
      const shown =
        onCloth &&
        p.depth > 0 &&
        p.x >= -1 &&
        p.y >= -1 &&
        p.x <= width + 1 &&
        p.y <= height + 1 &&
        !(onEdge && onOutline(p.x, p.y)) &&
        (!visible || visible(p.x, p.y, p.depth));
      if (shown) run.push(p);
      else flush();
    });
    flush();
  };

  const fine = surface.resolution * 3;
  uvLines(style, lines, step).forEach((uvs) => trace(uvs, paths));
  if (edges) {
    chain(
      isoSegments(
        surface.field,
        lattice.decay?.table ? fine * 4 : fine * 2,
        ALPHA_CUT
      )
    ).forEach((uvs) => trace(uvs, paths, { onEdge: true }));
  }
  const foldRuns = [];
  if (folds) {
    chain(
      isoSegments(
        (u, v) => surface.facing(u, v, camera.eye),
        fine,
        0,
        (u, v) => surface.field(u, v) > ALPHA_CUT
      )
    ).forEach((uvs) => trace(uvs, foldRuns, { onEdge: true }));
  }
  // The skin's eyeliner: the shader's rim band (from the cutout's visible
  // edge, out by the offset, `width` wide in UV), filled with concentric
  // strokes about a pen apart.
  const rimRuns = [];
  if (rims && browed) {
    // A browed eye is no circle: the rim's strokes are contours of its
    // distance to the hole.
    lattice.cutouts.forEach((cutout) => {
      const hole = (u, v) =>
        eyeHoleDistance(u, 1 - v, cutout, lattice.decay.params);
      const inner = rims.offset - (cutout.fade ?? cutout.radius * 0.4);
      const count = Math.max(1, Math.round(rims.width / 0.002));
      for (let k = 0; k < count; k += 1) {
        chain(
          isoSegments(
            hole,
            Math.ceil(2 / step),
            inner + (rims.width * (k + 0.5)) / count
          )
        ).forEach((uvs) => trace(uvs, rimRuns, { onEdge: true }));
      }
    });
  } else if (rims) {
    lattice.cutouts.forEach(({ fade, radius, u: cu, v: cv }) => {
      const inner = radius - (fade ?? radius * 0.4) + rims.offset;
      const across = (r) => {
        const a = surface.point(cu + r, 1 - cv);
        const b = surface.point(cu + r + rims.width, 1 - cv);
        const pa = project(...a);
        const pb = project(...b);
        return Math.hypot(pb.x - pa.x, pb.y - pa.y);
      };
      const count = Math.max(
        1,
        Math.round(across(inner) / Math.max(stroke * 1.1, 0.4))
      );
      for (let k = 0; k < count; k += 1) {
        const r = inner + (rims.width * (k + 0.5)) / count;
        const n = Math.max(48, Math.ceil((2 * Math.PI * r) / (step / 2)));
        trace(
          Array.from({ length: n + 1 }, (_, i) => {
            const a = (i / n) * 2 * Math.PI;
            return [cu + r * Math.cos(a), 1 - (cv + r * Math.sin(a))];
          }),
          rimRuns,
          { onEdge: true }
        );
      }
    });
  }

  // The weave as threads: contours of fabricWeave's thread height (its
  // plain-weave parity, sin profile and per-thread slub, ported as is), in
  // the shader's UVs, so each thread on top is drawn as the lozenge the
  // render shades — at a thread count a pen can draw.
  const weaveRuns = [];
  if (weave) {
    const n = weave.threads;
    const slub = 0.35;
    const threadHash = (k) => {
      const v = Math.sin(k * 12.9898) * 43758.5453;
      return v - Math.floor(v);
    };
    const threadHeight = (u, v) => {
      const tx = u * n;
      const ty = (1 - v) * n;
      const cx = Math.floor(tx);
      const cy = Math.floor(ty);
      const parity = Math.cos((tx + ty) * Math.PI) * 0.5 + 0.5;
      const warpGain = threadHash(cx) * slub + (1 - slub * 0.5);
      const weftGain = threadHash(cy + 7.3) * slub + (1 - slub * 0.5);
      return Math.max(
        Math.sin((tx - cx) * Math.PI) * parity * warpGain,
        Math.sin((ty - cy) * Math.PI) * (1 - parity) * weftGain
      );
    };
    chain(
      isoSegments(
        threadHeight,
        Math.ceil(n * 8),
        0.5,
        (u, v) => surface.field(u, v) > ALPHA_CUT
      )
    ).forEach((uvs) => trace(uvs, weaveRuns));
  }

  const strokeLength = (run) =>
    run.reduce(
      (sum, p, i) =>
        i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
      0
    );
  const foldPaths = foldRuns.filter((run) => strokeLength(run) >= 6);

  // clothDecay's stains and goo, each outlined where it reaches half.
  const decayRuns = { blood: [], goo: [], rot: [] };
  const { decayed } = surface;
  if (decay && decayed) {
    const onCloth = (u, v) => surface.field(u, v) > ALPHA_CUT;
    const contour = (fn, into) =>
      chain(isoSegments(fn, fine * 2, 0.5, onCloth)).forEach((uvs) =>
        trace(uvs, into)
      );
    const { params } = lattice.decay;
    if (params.holeRimWidth > 0) {
      contour((u, v) => decayed.stain(u, v).rot, decayRuns.rot);
    }
    if (params.bloodAmount > 0) {
      contour((u, v) => decayed.stain(u, v).blood, decayRuns.blood);
    }
    if (params.dripAmount > 0 && (params.dripTint > 0 || params.dripGlow > 0)) {
      contour((u, v) => decayed.drip(u, v).goo, decayRuns.goo);
    }
  }
  const decayPaths = Object.fromEntries(
    Object.entries(decayRuns).map(([key, runs]) => [
      key,
      runs.filter((run) => strokeLength(run) >= 4),
    ])
  );

  const outlineLoops =
    silhouette && ghostSeen ? silhouetteRuns(ghostSeen, pixelRatio) : [];

  const textureLines =
    texture && painted && image
      ? textureRuns({
          coverage: painted,
          image,
          levels: texture.levels,
          pixelRatio,
        })
      : [];

  const halo =
    outline && coverage ? outlineRuns({ coverage, outline, pixelRatio }) : [];

  const filled = fill
    ? clothFill({
        camera,
        decayed: decay ? decayed : null,
        fill,
        height,
        lattice,
        project,
        rims,
        surface,
        tone:
          image && painted
            ? createTone({ gamma: 1, image, mask: painted, pixelRatio })
            : () => 0,
        visible,
        width,
      })
    : {};
  const fillLayers = FILL_LAYERS.filter(({ key }) => filled[key]?.length)
    .map(({ index, key, label }) =>
      plotLayer(
        index,
        label,
        stroke,
        pathOf(filled[key]),
        fill.colors[key] ?? '#000000'
      )
    )
    .join('');

  const shading = shade
    ? shadePath({
        ...shade,
        image,
        height,
        mask: painted,
        pen: shade.pen ?? stroke,
        pixelRatio,
        width,
      })
    : '';

  const weather = storm
    ? stormRuns({
        cloud: cloud
          ? {
              coverage: unoccluded(cloudCoverage, coverage),
              normals: cloud.normals,
              pixelRatio,
            }
          : null,
        height,
        project,
        snapshot: storm.snapshot,
        visible,
        width,
      })
    : { boltRuns: [], cloudRuns: [], rainRuns: [], splashRuns: [] };

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color:${paper}">` +
    `${plotLayer(0, 'contours', stroke, pathOf(paths))}` +
    `${outlineLoops.length ? plotLayer(1, 'silhouette', stroke, pathOf(outlineLoops)) : ''}` +
    `${shading ? plotLayer(2, 'shading', stroke, shading) : ''}` +
    `${foldPaths.length ? plotLayer(3, 'folds', stroke, pathOf(foldPaths)) : ''}` +
    `${halo.length ? plotLayer(4, 'outline', stroke, pathOf(halo)) : ''}` +
    `${rimRuns.length ? plotLayer(5, 'rims', stroke, pathOf(rimRuns), rims.color) : ''}` +
    `${weaveRuns.length ? plotLayer(6, 'weave', stroke, pathOf(weaveRuns)) : ''}` +
    `${textureLines.length ? plotLayer(7, 'texture', stroke, pathOf(textureLines)) : ''}` +
    `${weather.cloudRuns.length ? plotLayer(8, 'cloud', stroke, pathOf(weather.cloudRuns)) : ''}` +
    `${weather.rainRuns.length ? plotLayer(9, 'rain', stroke, pathOf(weather.rainRuns)) : ''}` +
    `${weather.splashRuns.length ? plotLayer(10, 'splashes', stroke, pathOf(weather.splashRuns)) : ''}` +
    `${weather.boltRuns.length ? plotLayer(11, 'lightning', stroke, pathOf(weather.boltRuns)) : ''}` +
    `${decayPaths.rot.length ? plotLayer(12, 'rot', stroke, pathOf(decayPaths.rot)) : ''}` +
    `${decayPaths.blood.length ? plotLayer(13, 'blood', stroke, pathOf(decayPaths.blood)) : ''}` +
    `${decayPaths.goo.length ? plotLayer(14, 'goo', stroke, pathOf(decayPaths.goo)) : ''}` +
    `${fillLayers}</svg>`
  );
}

// The render options a plot reads, as renderGhostSvg's arguments (the skin
// supplies its Outline settings); a caller adds the camera, lattice, image
// and depth it captured.
export function plotArgs(options, skin = null) {
  return {
    decay: options.svgDecay,
    edges: options.svgEdges,
    fill:
      options.svgFill && options.svgFill !== 'none'
        ? {
            colors: fillColors(skin),
            inside: options.svgFillInside,
            mode: options.svgFill,
            shades: options.svgFillShades,
            shadow: options.svgFillShadow,
            minGap: 2 * (options.svgPenMm || 0.3) * pxPerMm(options),
            spacing: options.svgFillSpacing * pxPerMm(options),
            wiggle: options.svgFillWiggle,
          }
        : null,
    folds: options.svgFolds,
    height: options.height,
    lines: options.svgLines,
    outline: outlineOf(options, skin),
    paper: options.svgPaper,
    pixelRatio: options.pixelRatio,
    rims:
      options.svgRims && skin?.cutoutRimWidth > 0
        ? {
            color: skin.cutoutRimColor ?? '#000000',
            offset: skin.cutoutRimOffset ?? 0,
            width: skin.cutoutRimWidth,
          }
        : null,
    shade:
      options.svgShading && options.svgShading !== 'none'
        ? {
            angle: options.svgShadeAngle,
            gamma: options.svgShadeGamma,
            pen: penPx(options),
            shading: options.svgShading,
            spacing: options.svgShadeSpacing,
          }
        : null,
    silhouette: options.svgSilhouette,
    stroke: options.svgStroke,
    style: options.svgStyle,
    texture: options.svgTexture ? { levels: options.svgTextureLevels } : null,
    weave:
      options.svgWeave && skin?.fabricAmount > 0
        ? { threads: options.svgWeaveThreads || skin.fabricThreads }
        : null,
    width: options.width,
  };
}

// Whether a plot needs the cloth-only depth pass.
const filling = (options) =>
  Boolean(options.svgFill && options.svgFill !== 'none');

export const needsDepth = (options) =>
  Boolean(
    filling(options) ||
    options.svgOcclusion ||
    options.svgStorm ||
    options.svgSilhouette ||
    options.svgTexture ||
    (options.svgOutline && options.svgOutline !== 'none') ||
    (options.svgShading && options.svgShading !== 'none')
  );

// Whether a plot reads the render itself (shading, texture contours).
export const needsImage = (options) =>
  Boolean(
    filling(options) ||
    options.svgTexture ||
    (options.svgShading && options.svgShading !== 'none')
  );
