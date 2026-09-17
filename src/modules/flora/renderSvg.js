/* eslint-disable no-bitwise */
import { CARD_SHAPES } from './pack';
import DICE, { SOLID_SHAPES, WIRE_MODELS } from './polyhedra';

// A plottable vector render of a flower or a bouquet.
//
// The flower is line work already — every fiber, stem and leaf rib is a
// polyline in the specimen, and a wireframe ornament is more of the same — so
// this projects those centrelines rather than the silhouettes of the tubes
// drawn around them. That is what a pen wants: one stroke per fiber, not two
// outlines per fiber. Hidden line work is removed by testing against a depth
// map the real renderer produced, so what the plot leaves out is exactly what
// the render hides.
//
// Colour is flat per layer (stem, crown, accent, tip, ornament) because the
// output is pens, not shading: the scene's per-vertex blend has no plotter
// equivalent. With a palette, each layer takes its own stop.

const LAYERS = ['stem', 'crown', 'accent', 'tip', 'ornament'];
const PALETTE_AT = { accent: 0.75, crown: 0.35, ornament: 0.55, tip: 0.95 };

function hashAt(seed) {
  const state = (Math.imul(seed >>> 0, 747796405) + 2891336453) >>> 0;
  const shifted = (state >>> ((state >>> 28) + 4)) >>> 0;
  const word = Math.imul((shifted ^ state) >>> 0, 277803737) >>> 0;
  return (((word >>> 22) ^ word) >>> 0) / 2 ** 32;
}

function applyMatrix(m, [x, y, z]) {
  if (!m) return [x, y, z];
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

function matrixScale(m) {
  return m ? Math.hypot(m[0], m[1], m[2]) : 1;
}

// Right-handed look-at, matching three's camera.
function viewBasis(eye, target) {
  const forward = [0, 1, 2].map((a) => eye[a] - target[a]);
  const flen = Math.hypot(...forward) || 1;
  const z = forward.map((v) => v / flen);
  // right = normalize(up × z), with up = (0,1,0)
  const right = [z[2], 0, -z[0]];
  const rlen = Math.hypot(...right) || 1;
  const x = rlen < 1e-6 ? [1, 0, 0] : right.map((v) => v / rlen);
  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];
  return { x, y, z };
}

function createProjector({ camera, height, width }) {
  const { eye, fov, target } = camera;
  const { x, y, z } = viewBasis(eye, target);
  const focal = height / 2 / Math.tan((fov * Math.PI) / 180 / 2);

  return function project(point) {
    const d = [0, 1, 2].map((a) => point[a] - eye[a]);
    const depth = -(d[0] * z[0] + d[1] * z[1] + d[2] * z[2]);
    if (depth <= 1e-4) return null;
    const px = d[0] * x[0] + d[1] * x[1] + d[2] * x[2];
    const py = d[0] * y[0] + d[1] * y[1] + d[2] * y[2];
    const scale = focal / depth;
    return {
      depth,
      scale,
      x: width / 2 + px * scale,
      y: height / 2 - py * scale,
    };
  };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Mirrors tubeMaterial's width mapping: fibers taper by thickness, leaves
// (negative thickness) widen into a blade.
function strandRadius(thickness, config) {
  if (thickness < 0) {
    return Math.max(-thickness, 0) ** 0.8 * config.leafWidth + config.tipWidth;
  }
  return (
    config.tipWidth +
    (config.stemWidth - config.tipWidth) *
      Math.max(thickness, 0) ** config.thicknessCurve
  );
}

function layerOf(tone, config) {
  const stemCode = Math.floor(tone[2]);
  if (tone[1] > 1.5) return 'ornament';
  if (stemCode > 0.5) return 'stem';
  if (tone[0] < config.greenReach * 0.5) return 'stem';
  if (clamp01(tone[1]) ** config.tipPower * config.tipAmount > 0.5) {
    return 'tip';
  }
  return tone[3] >= 1 ? 'accent' : 'crown';
}

function colorsFor(config, stops) {
  const sample = (t) => {
    if (!stops?.length) return null;
    const scaled = clamp01(t) * (stops.length - 1);
    const index = Math.round(scaled);
    return stops[index];
  };
  return Object.fromEntries(
    LAYERS.map((layer) => {
      const fallback = {
        accent: config.accentColor,
        crown: config.crownColor,
        ornament: config.ornamentColor,
        stem: config.stemColor,
        tip: config.tipColor,
      }[layer];
      const stop = layer === 'stem' ? null : sample(PALETTE_AT[layer]);
      return [layer, stop ?? fallback];
    })
  );
}

// 2D convex hull (monotone chain) — a solid ornament plots as its silhouette.
function hull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (input) => {
    const out = [];
    input.forEach((point) => {
      while (
        out.length >= 2 &&
        cross(out[out.length - 2], out[out.length - 1], point) <= 0
      ) {
        out.pop();
      }
      out.push(point);
    });
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

function rotateXYZ([x, y, z], [rx, ry, rz]) {
  const c = [Math.cos(rx), Math.cos(ry), Math.cos(rz)];
  const s = [Math.sin(rx), Math.sin(ry), Math.sin(rz)];
  const y1 = y * c[0] - z * s[0];
  const z1 = y * s[0] + z * c[0];
  const x2 = x * c[1] + z1 * s[1];
  const z2 = -x * s[1] + z1 * c[1];
  return [x2 * c[2] - y1 * s[2], x2 * s[2] + y1 * c[2], z2];
}

function normalize(v) {
  const len = Math.hypot(...v) || 1;
  return v.map((c) => c / len);
}

const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

function cardOutline(shape, position, dir, info, config, matrix) {
  const size = position[3] * config.ornamentScale;
  const up = normalize([dir[0], dir[1], dir[2]]);
  const rand = info[2];
  const roll = [rand - 0.5, ((rand * 7.3) % 1) - 0.5, ((rand * 3.7) % 1) - 0.5];
  const side = normalize(
    cross3(up, normalize([roll[0] + 0.001, roll[1], roll[2]]))
  );
  const facing = cross3(side, up);
  const model = WIRE_MODELS[shape];

  return model.vertices.map(([vx, vy]) => {
    const cup = vx * vx * config.cardCup;
    const point = [0, 1, 2].map(
      (a) =>
        position[a] +
        up[a] * (vy + 1) * size +
        side[a] * vx * size +
        facing[a] * cup * size
    );
    return applyMatrix(matrix, point);
  });
}

function solidOutline(shape, index, position, config, matrix) {
  const size = position[3] * config.ornamentScale;
  const center = applyMatrix(matrix, [position[0], position[1], position[2]]);
  if (shape === 'sphere') return { center, radius: size * matrixScale(matrix) };

  const tumble = [3, 101, 997].map(
    (salt) => hashAt(index + salt) * Math.PI * 2
  );
  return {
    points: DICE[shape].vertices.map((vertex) =>
      applyMatrix(
        matrix,
        rotateXYZ(vertex, tumble).map((v, a) => position[a] + v * size)
      )
    ),
  };
}

function formatPath(points) {
  return points
    .map(
      ({ x, y }, index) =>
        `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    )
    .join('');
}

export default function renderFloraSvg({
  background = '#050505',
  camera,
  flowers,
  growth = 1,
  height,
  minStroke = 0.3,
  simplify = 0.35,
  stroke = 1,
  visible = null,
  width,
}) {
  const project = createProjector({ camera, height, width });
  const paths = Object.fromEntries(LAYERS.map((layer) => [layer, []]));
  const shapes = [];
  const margin = Math.max(width, height) * 0.1;

  const onScreen = (p) =>
    p &&
    p.x > -margin &&
    p.y > -margin &&
    p.x < width + margin &&
    p.y < height + margin;

  // A point on a centreline sits one tube radius behind the surface the depth
  // pass recorded, so the test has to allow for it.
  const shows = (p, radius) =>
    !visible || visible(p.x, p.y, p.depth - radius * 1.4 - p.depth * 0.004);

  flowers.forEach(({ config, matrix, specimen }) => {
    const colors = colorsFor(config, specimen.paletteStops);
    const { cards, segments, solids } = specimen;
    const scale = matrixScale(matrix);
    let run = null;

    const flush = () => {
      if (run && run.points.length > 1) {
        paths[run.layer].push({
          color: colors[run.layer],
          d: formatPath(run.points),
          width: run.width,
        });
      }
      run = null;
    };

    for (let k = 0; k < segments.count; k += 1) {
      const o = k * 4;
      const birth = segments.time[o];
      if (birth > growth) {
        flush();
        // eslint-disable-next-line no-continue
        continue;
      }
      const span = Math.max(segments.time[o + 1] - birth, 1e-6);
      const g = Math.min(1, (growth - birth) / span);
      const from = applyMatrix(matrix, [
        segments.start[o],
        segments.start[o + 1],
        segments.start[o + 2],
      ]);
      const toRaw = [0, 1, 2].map(
        (a) =>
          segments.start[o + a] +
          (segments.end[o + a] - segments.start[o + a]) * g
      );
      const to = applyMatrix(matrix, toRaw);
      const a = project(from);
      const b = project(to);
      const tone = segments.tone.subarray(o, o + 4);
      const radius = strandRadius(segments.end[o + 3], config) * scale * stroke;

      if (!onScreen(a) || !onScreen(b) || !shows(b, radius)) {
        flush();
        // eslint-disable-next-line no-continue
        continue;
      }
      const layer = layerOf(tone, config);
      const px = Math.max(minStroke, radius * 2 * b.scale);
      const chained =
        run &&
        run.layer === layer &&
        Math.abs(run.width - px) < 0.35 &&
        Math.hypot(run.last.x - a.x, run.last.y - a.y) < 0.75;

      if (!chained) {
        flush();
        run = {
          last: a,
          layer,
          points: [a],
          width: px,
        };
      }
      if (Math.hypot(b.x - run.last.x, b.y - run.last.y) < simplify) {
        // eslint-disable-next-line no-continue
        continue;
      }
      run.points.push(b);
      run.last = b;
      run.width = px;
    }
    flush();

    SOLID_SHAPES.forEach((shape) => {
      const group = solids[shape];
      for (let i = 0; i < group.count; i += 1) {
        const o = i * 4;
        if (group.info[o] > growth) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const outline = solidOutline(
          shape,
          i,
          group.position.subarray(o, o + 4),
          config,
          matrix
        );
        if (outline.center) {
          const p = project(outline.center);
          if (onScreen(p) && shows(p, outline.radius)) {
            shapes.push({
              color: colors.ornament,
              d: `M${(p.x - outline.radius * p.scale).toFixed(1)} ${p.y.toFixed(1)}a${(outline.radius * p.scale).toFixed(1)} ${(outline.radius * p.scale).toFixed(1)} 0 1 0 ${(outline.radius * 2 * p.scale).toFixed(1)} 0a${(outline.radius * p.scale).toFixed(1)} ${(outline.radius * p.scale).toFixed(1)} 0 1 0 ${(-outline.radius * 2 * p.scale).toFixed(1)} 0`,
              width: minStroke,
            });
          }
          // eslint-disable-next-line no-continue
          continue;
        }
        const projected = outline.points.map(project).filter(Boolean);
        if (projected.length < 3 || !projected.every(onScreen)) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const depth =
          projected.reduce((sum, p) => sum + p.depth, 0) / projected.length;
        const size = group.position[o + 3] * config.ornamentScale * scale;
        if (!shows({ ...projected[0], depth }, size)) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const ring = hull(projected.map((p) => [p.x, p.y]));
        shapes.push({
          color: colors.ornament,
          d: `${formatPath(ring.map(([x, y]) => ({ x, y })))}Z`,
          width: minStroke,
        });
      }
    });

    for (let i = 0; i < cards.count; i += 1) {
      const o = i * 4;
      if (cards.dir[o + 3] > growth) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const shape = CARD_SHAPES[Math.round(cards.info[o])] ?? CARD_SHAPES[0];
      const outline = cardOutline(
        shape,
        cards.position.subarray(o, o + 4),
        cards.dir.subarray(o, o + 4),
        cards.info.subarray(o, o + 4),
        config,
        matrix
      );
      const projected = outline.map(project).filter(Boolean);
      if (projected.length < 3 || !projected.every(onScreen)) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const depth =
        projected.reduce((sum, p) => sum + p.depth, 0) / projected.length;
      const size = cards.position[o + 3] * config.ornamentScale * scale;
      if (!shows({ ...projected[0], depth }, size)) {
        // eslint-disable-next-line no-continue
        continue;
      }
      shapes.push({
        color: colors.ornament,
        d: `${formatPath(projected)}Z`,
        width: minStroke,
      });
    }
  });

  const groups = LAYERS.map((layer) => {
    const entries =
      layer === 'ornament' ? [...paths[layer], ...shapes] : paths[layer];
    if (entries.length === 0) return '';
    const body = entries
      .map(
        (entry) =>
          `<path d="${entry.d}" stroke="${entry.color}" stroke-width="${entry.width.toFixed(2)}"/>`
      )
      .join('');
    return `<g id="${layer}" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
  }).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="${background}"/>${groups}</svg>`
  );
}
