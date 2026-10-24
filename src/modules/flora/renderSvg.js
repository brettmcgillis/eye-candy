import { chain, isoSegments, simplifyLoop } from '@modules/plotKit';

/* eslint-disable no-bitwise */
import { CARD_SHAPES } from './pack';
import createPlotColors from './plotColors';
import DICE, { SOLID_SHAPES, WIRE_MODELS } from './polyhedra';
import {
  applyMatrix,
  createProjector,
  formatPath,
  matrixScale,
} from './svgProjection';

const LAYERS = ['stem', 'crown', 'accent', 'tip', 'ornament'];

function hashAt(seed) {
  const state = (Math.imul(seed >>> 0, 747796405) + 2891336453) >>> 0;
  const shifted = (state >>> ((state >>> 28) + 4)) >>> 0;
  const word = Math.imul((shifted ^ state) >>> 0, 277803737) >>> 0;
  return (((word >>> 22) ^ word) >>> 0) / 2 ** 32;
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

function fallbackColors(config) {
  return Object.fromEntries(
    LAYERS.map((layer) => [layer, config[`${layer}Color`]])
  );
}

function rotateXYZ([x, y, z], [rx, ry, rz]) {
  const c = [Math.cos(rx), Math.cos(ry), Math.cos(rz)];
  const s = [-Math.sin(rx), -Math.sin(ry), -Math.sin(rz)];
  // Three r185's rotate uses negative angles in Z, Y, X order.
  const x1 = x * c[2] - y * s[2];
  const y1 = x * s[2] + y * c[2];
  const x2 = x1 * c[1] + z * s[1];
  const z2 = -x1 * s[1] + z * c[1];
  return [x2, y1 * c[0] - z2 * s[0], y1 * s[0] + z2 * c[0]];
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

let heartOutline = null;

function heartCardOutline() {
  if (!heartOutline) {
    heartOutline = chain(
      isoSegments(
        (u, v) => {
          const x = (u * 2.04 - 1.02) * 1.3;
          const y = (v * 2.04 - 1.02) * 1.3 + 0.15;
          const r = x * x + y * y - 1;
          return Math.max(
            r * r * r - x * x * y * y * y,
            Math.abs(u * 2.04 - 1.02) - 1,
            Math.abs(v * 2.04 - 1.02) - 1
          );
        },
        160,
        0
      )
    )[0].map(([u, v]) => [u * 2.04 - 1.02, v * 2.04 - 1.02]);
  }
  return heartOutline;
}

function cardOutline(shape, position, dir, info, config, matrix, project) {
  const center = project(applyMatrix(matrix, position));
  const size = Math.max(
    position[3] * config.ornamentScale,
    (config.ornamentMinPixels * 0.5) / (center.scale * matrixScale(matrix))
  );
  const up = normalize([dir[0], dir[1], dir[2]]);
  const rand = info[2];
  const roll = [rand - 0.5, ((rand * 7.3) % 1) - 0.5, ((rand * 3.7) % 1) - 0.5];
  const side = normalize(
    cross3(up, normalize([roll[0] + 0.001, roll[1], roll[2]]))
  );
  const facing = cross3(side, up);
  const vertices =
    shape === 'heart' ? heartCardOutline() : WIRE_MODELS[shape].vertices;

  return vertices.map(([vx, vy]) => {
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

function solidOutline(shape, index, position, config, matrix, project) {
  const center = applyMatrix(matrix, position);
  const size = Math.max(
    position[3] * config.ornamentScale,
    (config.ornamentMinPixels * 0.5) /
      (project(center).scale * matrixScale(matrix))
  );
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

// Nearest and farthest crown depth across every flower, from a sample of
// segment starts, so thinning fades the back of a bouquet as a whole.
function depthRange(flowers, project) {
  let near = Infinity;
  let far = -Infinity;
  flowers.forEach(({ matrix, specimen: { segments } }) => {
    for (let k = 0; k < segments.count; k += 16) {
      const o = k * 4;
      const p = project(
        applyMatrix(matrix, [
          segments.start[o],
          segments.start[o + 1],
          segments.start[o + 2],
        ])
      );
      if (p) {
        near = Math.min(near, p.depth);
        far = Math.max(far, p.depth);
      }
    }
  });
  return { near, span: Math.max(far - near, 1e-6) };
}

const circlePoints = (x, y, r) =>
  Array.from({ length: 25 }, (_, i) => ({
    x: x + r * Math.cos((i / 24) * Math.PI * 2),
    y: y + r * Math.sin((i / 24) * Math.PI * 2),
  }));

// `plot`, when given, sees every drawn run in output px ({ color, layer,
// points }) and returns extra markup: `under` the line work and `over` it.
export default function renderFloraSvg({
  albedo = null,
  background = '#050505',
  inks = 0,
  camera,
  flowers,
  growth = 1,
  height,
  minStroke = 0.3,
  plot = null,
  pen = null,
  simplify = 0.35,
  stroke = 1,
  thin = 0,
  visible = null,
  width,
}) {
  const project = createProjector({ camera, height, width });
  const lineWidth = pen == null ? null : Math.max(minStroke, pen * stroke);
  const range = thin > 0 ? depthRange(flowers, project) : null;
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
    !visible || visible(p.x, p.y, p.depth - radius - 0.75 / p.scale);

  const addOutline = (points, color, radius = 0) => {
    let line = [];
    const finish = () => {
      if (line.length > 1)
        shapes.push({
          color,
          d: formatPath(
            simplifyLoop(
              line.map((p) => [p.x, p.y]),
              0.15
            ).map(([x, y]) => ({ x, y }))
          ),
          layer: 'ornament',
          points: line,
          width: lineWidth ?? minStroke,
        });
      line = [];
    };
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
      for (let k = i === 1 ? 0 : 1; k <= steps; k += 1) {
        const t = k / steps;
        const depth = 1 / ((1 - t) / a.depth + t / b.depth);
        const p = {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          depth,
          scale: a.scale,
        };
        if (onScreen(p) && shows(p, radius)) line.push(p);
        else finish();
      }
    }
    finish();
  };

  flowers.forEach(({ config, matrix, specimen }) => {
    const colors = fallbackColors(config);
    const { cards, segments, solids } = specimen;
    const scale = matrixScale(matrix);
    let run = null;
    let fiberRoll = 0;
    let prevEnd = null;

    const flush = () => {
      if (run && run.points.length > 1) {
        paths[run.layer].push({
          color: colors[run.layer],
          d: formatPath(
            simplifyLoop(
              run.points.map((p) => [p.x, p.y]),
              0.15
            ).map(([x, y]) => ({ x, y }))
          ),
          layer: run.layer,
          points: run.points,
          width: run.width,
        });
      }
      run = null;
    };

    for (let k = 0; k < segments.count; k += 1) {
      const o = k * 4;
      // A fiber is a chain of segments, each starting where the last ended;
      // thinning rolls once per fiber so it fades out rather than dashing.
      if (
        !prevEnd ||
        prevEnd[0] !== segments.start[o] ||
        prevEnd[1] !== segments.start[o + 1] ||
        prevEnd[2] !== segments.start[o + 2]
      ) {
        flush();
        fiberRoll = hashAt(k + 7919);
      }
      prevEnd = segments.end.subarray(o, o + 3);
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

      if (!a || !b) {
        flush();
        // eslint-disable-next-line no-continue
        continue;
      }
      const radius = Math.max(
        strandRadius(segments.end[o + 3], config) * scale,
        (config.minPixels * 0.5) / b.scale
      );

      const layer = layerOf(tone, config);
      if (
        range &&
        layer !== 'stem' &&
        fiberRoll < thin * clamp01((b.depth - range.near) / range.span)
      ) {
        flush();
        // eslint-disable-next-line no-continue
        continue;
      }
      const px =
        lineWidth ?? Math.max(minStroke, radius * 2 * b.scale * stroke);
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const p = project(from.map((v, axis) => v + (to[axis] - v) * t));
        const r = Math.max(
          strandRadius(
            segments.start[o + 3] +
              (segments.end[o + 3] - segments.start[o + 3]) * t,
            config
          ) * scale,
          (config.minPixels * 0.5) / p.scale
        );
        if (!onScreen(p) || !shows(p, r)) {
          flush();
        } else {
          const chained =
            run &&
            run.layer === layer &&
            Math.hypot(run.last.x - p.x, run.last.y - p.y) < 1.5;
          if (!chained) {
            flush();
            run = { last: p, layer, points: [p], width: px };
          } else if (
            (step === steps &&
              Math.hypot(p.x - run.last.x, p.y - run.last.y) > 1e-5) ||
            Math.hypot(p.x - run.last.x, p.y - run.last.y) >= simplify
          ) {
            run.points.push(p);
            run.last = p;
          }
        }
      }
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
          matrix,
          project
        );
        if (outline.center) {
          const p = project(outline.center);
          if (onScreen(p)) {
            const r = Math.max(
              outline.radius * p.scale,
              config.ornamentMinPixels * 0.5
            );
            const ring = circlePoints(p.x, p.y, r).map((point) => ({
              ...p,
              ...point,
            }));
            addOutline(ring, colors.ornament, 1 / p.scale);
          }
          // eslint-disable-next-line no-continue
          continue;
        }
        const projected = outline.points.map(project).filter(Boolean);
        if (projected.length < 3 || !projected.every(onScreen)) {
          // eslint-disable-next-line no-continue
          continue;
        }
        DICE[shape].edges.forEach(([a, b]) => {
          addOutline([projected[a], projected[b]], colors.ornament);
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
        matrix,
        project
      );
      const projected = outline.map(project).filter(Boolean);
      if (projected.length < 3 || !projected.every(onScreen)) {
        // eslint-disable-next-line no-continue
        continue;
      }
      addOutline([...projected, projected[0]], colors.ornament);
    }
  });

  const coloring = createPlotColors({ albedo, inks, width });
  if (coloring) {
    LAYERS.forEach((layer) => {
      paths[layer] = coloring.recolor(paths[layer]);
    });
    const coloredShapes = coloring.recolor(shapes);
    shapes.length = 0;
    coloredShapes.forEach((entry) => shapes.push(entry));
  }

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

  const extra = plot
    ? plot({
        coloring,
        height,
        runs: [...LAYERS.flatMap((layer) => paths[layer]), ...shapes],
        width,
      })
    : {};

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="${background}"/>${extra.under ?? ''}${groups}${extra.over ?? ''}</svg>`
  );
}
