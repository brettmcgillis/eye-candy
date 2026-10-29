/* eslint-disable no-bitwise */
import {
  chain,
  chainKeyed,
  createProjector,
  dotPath,
  isoSegments,
  meshEdges,
  nearSilhouette,
  pathOf,
  penPx,
  plotLayer,
  sectionCuts,
  shadePath,
  silhouetteRuns,
  simplifyLoop,
  smooth,
  traceRuns,
  weldMesh,
} from '@modules/plotKit';

const DEG = Math.PI / 180;
const AXES = { grid: [1, 0], none: [], sections: [0], slices: [1] };
const FLAME_INKS = ['#c4161c', '#f08c00', '#ffc400'];
const SMOKE_INK = '#6b6f76';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (v) => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
// Column-major 4 × 4 (three's `elements`) applied to a point or direction.
const apply = (m, [x, y, z], w = 1) => [
  m[0] * x + m[4] * y + m[8] * z + m[12] * w,
  m[1] * x + m[5] * y + m[9] * z + m[13] * w,
  m[2] * x + m[6] * y + m[10] * z + m[14] * w,
];

// The camera ray through an output pixel, in world space.
function createRays(camera, width, height) {
  const forward = unit(sub(camera.target, camera.eye));
  const right = unit(cross(forward, camera.up));
  const up = cross(right, forward);
  const tanY = Math.tan((camera.fov * DEG) / 2);
  const tanX = tanY * (width / height);
  return (x, y) => {
    const sx = ((x / width) * 2 - 1) * tanX;
    const sy = (1 - (y / height) * 2) * tanY;
    return unit([
      forward[0] + right[0] * sx + up[0] * sy,
      forward[1] + right[1] * sx + up[1] * sy,
      forward[2] + right[2] * sx + up[2] * sy,
    ]);
  };
}

// Trilinear temperature (dye channel g) at box-local p.
function temperatureAt({ data, grid, size }, p) {
  const [gx, gy, gz] = grid;
  const fx = (p[0] / size[0] + 0.5) * gx - 0.5;
  const fy = (p[1] / size[1] + 0.5) * gy - 0.5;
  const fz = (p[2] / size[2] + 0.5) * gz - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const z0 = Math.floor(fz);
  let sum = 0;
  for (let c = 0; c < 8; c += 1) {
    const x = x0 + (c & 1);
    const y = y0 + ((c >> 1) & 1);
    const z = z0 + ((c >> 2) & 1);
    if (x >= 0 && y >= 0 && z >= 0 && x < gx && y < gy && z < gz) {
      const w =
        (c & 1 ? fx - x0 : 1 - (fx - x0)) *
        ((c >> 1) & 1 ? fy - y0 : 1 - (fy - y0)) *
        ((c >> 2) & 1 ? fz - z0 : 1 - (fz - z0));
      sum += w * data[(x + gx * (y + gy * z)) * 4 + 1];
    }
  }
  return sum;
}

// Each flame copy's hottest temperature along every camera ray through its
// box, contoured at evenly spaced levels: nested isotherm shells as the
// camera sees them, hottest innermost.
function isothermRuns({ camera, flames, height, levels, visible, width }) {
  if (!levels || !flames?.length) return [];
  const project = createProjector(camera, width, height);
  const rayOf = createRays(camera, width, height);
  const bands = Array.from({ length: levels }, () => []);
  flames.forEach(({ field, inverse, matrix }) => {
    const half = field.size.map((s) => s / 2);
    const corners = [];
    for (let c = 0; c < 8; c += 1) {
      const local = [0, 1, 2].map((k) => ((c >> k) & 1 ? half[k] : -half[k]));
      corners.push(project(...apply(matrix, local)));
    }
    const x0 = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.x))));
    const x1 = Math.min(width, Math.ceil(Math.max(...corners.map((p) => p.x))));
    const y0 = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.y))));
    const y1 = Math.min(
      height,
      Math.ceil(Math.max(...corners.map((p) => p.y)))
    );
    if (x1 <= x0 || y1 <= y0) return;
    const n = Math.min(
      220,
      Math.max(24, Math.round(Math.max(x1 - x0, y1 - y0) / 1.5))
    );
    const eye = apply(inverse, camera.eye);
    const values = new Float32Array((n + 1) * (n + 1));
    const depths = new Float32Array((n + 1) * (n + 1));
    let hottest = 0;
    for (let j = 0; j <= n; j += 1) {
      for (let i = 0; i <= n; i += 1) {
        const px = x0 + ((x1 - x0) * i) / n;
        const py = y0 + ((y1 - y0) * j) / n;
        const dir = apply(inverse, rayOf(px, py), 0);
        let near = 0;
        let far = Infinity;
        for (let k = 0; k < 3; k += 1) {
          const a = (-half[k] - eye[k]) / dir[k];
          const b = (half[k] - eye[k]) / dir[k];
          near = Math.max(near, Math.min(a, b));
          far = Math.min(far, Math.max(a, b));
        }
        let best = 0;
        let at = 0;
        if (far > near) {
          const steps = 48;
          for (let s = 0; s < steps; s += 1) {
            const t = near + ((far - near) * (s + 0.5)) / steps;
            const v = temperatureAt(field, [
              eye[0] + dir[0] * t,
              eye[1] + dir[1] * t,
              eye[2] + dir[2] * t,
            ]);
            if (v > best) {
              best = v;
              at = t;
            }
          }
        }
        values[j * (n + 1) + i] = best;
        depths[j * (n + 1) + i] = at;
        hottest = Math.max(hottest, best);
      }
    }
    if (hottest <= 1e-3) return;
    const lookup = (u, v) =>
      values[Math.round(v * n) * (n + 1) + Math.round(u * n)];
    const depthAt = (u, v) => {
      const t = depths[Math.round(v * n) * (n + 1) + Math.round(u * n)];
      const local = apply(inverse, camera.eye);
      const dir = apply(
        inverse,
        rayOf(x0 + (x1 - x0) * u, y0 + (y1 - y0) * v),
        0
      );
      const world = apply(matrix, [
        local[0] + dir[0] * t,
        local[1] + dir[1] * t,
        local[2] + dir[2] * t,
      ]);
      return project(...world).depth;
    };
    for (let l = 0; l < levels; l += 1) {
      const level = hottest * (0.06 + (0.88 * (l + 0.5)) / levels);
      const loops = chain(isoSegments(lookup, n, level));
      loops.forEach((loop) => {
        const run = [];
        const flush = () => {
          if (run.length > 2) bands[l].push(run.splice(0));
          else run.length = 0;
        };
        smooth(simplifyLoop(loop, 0.25 / n)).forEach(([u, v]) => {
          const x = x0 + (x1 - x0) * u;
          const y = y0 + (y1 - y0) * v;
          if (visible && !visible(x, y, depthAt(u, v))) flush();
          else run.push({ x, y });
        });
        flush();
      });
    }
  });
  return bands;
}

// Smoke as stipple: each live particle a dot with a chance set by its
// opacity, so dense folds come out dense.
function smokeDots({ camera, density, dots, height, pen, visible, width }) {
  if (!density || !dots?.length) return '';
  const project = createProjector(camera, width, height);
  let rng = 0x9e3779b9;
  const random = () => {
    rng = (Math.imul(rng ^ (rng >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0;
    return rng / 4294967296;
  };
  let d = '';
  const radius = Math.max(pen * 0.5, 0.35);
  dots.forEach(([x, y, z, alpha]) => {
    if (random() > alpha * density * 6) return;
    const p = project(x, y, z);
    if (p.depth <= 0 || p.x < 0 || p.y < 0 || p.x > width || p.y > height) {
      return;
    }
    if (visible && !visible(p.x, p.y, p.depth)) return;
    d += dotPath(p.x, p.y, radius, pen);
  });
  return d;
}

// Puffs and clay balls as outlined circles, nearest last so the overlap
// reads front to back; hidden behind the candle where `visible` says.
function smokeCircles({ balls, camera, height, visible, width }) {
  if (!balls?.length) return '';
  const project = createProjector(camera, width, height);
  const tanY = Math.tan((camera.fov * DEG) / 2);
  return balls
    .map(([x, y, z, r]) => {
      const p = project(x, y, z);
      return { ...p, r: (r / (p.depth * tanY)) * (height / 2) };
    })
    .filter(
      (c) =>
        c.depth > 0 &&
        c.r > 0.4 &&
        c.x > -c.r &&
        c.y > -c.r &&
        c.x < width + c.r &&
        c.y < height + c.r &&
        (!visible || visible(c.x, c.y, c.depth))
    )
    .sort((a, b) => b.depth - a.depth)
    .map(
      ({ r, x, y }) =>
        `M${(x + r).toFixed(2)} ${y.toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(x - r).toFixed(2)} ${y.toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(x + r).toFixed(2)} ${y.toFixed(2)}`
    )
    .join('');
}

// Smoke with no particles to read (the billboard and ribbon) as stipple
// from its brightness map (output × pixelRatio, 0–1): a dot per cell, kept
// with a chance set by how bright the smoke is there.
function glowStipple({ density, glow, pen, pixelRatio }) {
  if (!glow || !density) return '';
  const { data, height, width } = glow;
  const cell = Math.max(1, Math.round(2.2 * pixelRatio));
  const radius = Math.max(pen * 0.5, 0.35);
  let rng = 0x2545f491;
  const random = () => {
    rng = (Math.imul(rng ^ (rng >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0;
    return rng / 4294967296;
  };
  let d = '';
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      const v = data[y * width + x];
      if (v > 0.01 && random() < Math.min(1, v * density * 1.6)) {
        const px = (x + random() * cell) / pixelRatio;
        const py = (y + random() * cell) / pixelRatio;
        d += dotPath(px, py, radius, pen);
      }
    }
  }
  return d;
}

// Contours of a brightness map (output × pixelRatio, 0–1): how a legacy
// flame with no field of its own still plots as nested shells.
function glowRuns({ glow, levels, pixelRatio }) {
  if (!glow || !levels) return [];
  const { data, height, width } = glow;
  const n = Math.max(width, height);
  let peak = 0;
  data.forEach((v) => {
    peak = Math.max(peak, v);
  });
  if (peak <= 0.02) return [];
  const lookup = (u, v) => {
    const x = Math.min(width - 1, Math.round(u * n));
    const y = Math.min(height - 1, Math.round(v * n));
    return u * n >= width || v * n >= height ? 0 : data[y * width + x];
  };
  const step = Math.max(1, Math.round(n / 360));
  return Array.from({ length: levels }, (_, l) => {
    const level = peak * (0.08 + (0.84 * (l + 0.5)) / levels);
    return chain(isoSegments(lookup, Math.round(n / step), level))
      .filter((loop) => loop.length > 3)
      .map((loop) =>
        smooth(simplifyLoop(loop, 0.5 / n)).map(([u, v]) => ({
          x: (u * n) / pixelRatio,
          y: (v * n) / pixelRatio,
        }))
      );
  });
}

// The candle as pen layers: slices across the wax in its own frame, its
// contours and creases (hidden lines removed through `visible`), the
// silhouette and shading read from the render, each flame's isotherms in
// fire inks and the smoke as stipple.
export default function renderCandleSvg({
  camera,
  contours = true,
  coverage = null,
  creaseAngle = 50,
  flameGlow = null,
  flames = [],
  height,
  image = null,
  isotherms = 9,
  lines = 40,
  paper = '#ffffff',
  pixelRatio = 1,
  shade = null,
  silhouette = true,
  smoke = null,
  stroke = 0.6,
  style = 'slices',
  visible = null,
  wax,
  width,
}) {
  const project = createProjector(camera, width, height);
  const onOutline =
    silhouette && coverage ? nearSilhouette(coverage, pixelRatio) : null;
  const hiddenBy = (edgeLike) => (p) =>
    (visible && !visible(p.x, p.y, p.depth)) ||
    (edgeLike && onOutline && onOutline(p.x, p.y));
  const trace = (polylines, edgeLike, minLength = 0) =>
    traceRuns(polylines, {
      height,
      hidden: hiddenBy(edgeLike),
      minLength,
      project,
      width,
    });

  let sliceRuns = [];
  let contourRuns = [];
  let creaseRuns = [];
  if (wax) {
    const mesh = weldMesh({
      index: wax.index,
      position: wax.position,
      rest: wax.position,
    });
    const found = meshEdges(mesh, { creaseAngle, eye: camera.eye });
    const faced = [{ facing: found.facing, mesh }];
    AXES[style]?.forEach((axis) => {
      sliceRuns.push(
        ...trace(
          chainKeyed(
            sectionCuts(faced, { axis, count: lines, inverse: wax.inverse })
          ),
          false,
          2
        )
      );
    });
    if (contours) {
      contourRuns = trace(chainKeyed(found.contours), true, 4);
      creaseRuns = trace(chainKeyed(found.creases), true, 4);
    }
  }
  sliceRuns = sliceRuns.filter((run) => run.length > 1);

  const outline =
    silhouette && coverage ? silhouetteRuns(coverage, pixelRatio) : [];
  const shading = shade
    ? shadePath({
        ...shade,
        height,
        image,
        mask: coverage,
        pen: shade.pen ?? stroke,
        pixelRatio,
        width,
      })
    : '';

  const bands = flames.length
    ? isothermRuns({
        camera,
        flames,
        height,
        levels: isotherms,
        visible,
        width,
      })
    : glowRuns({ glow: flameGlow, levels: isotherms, pixelRatio });
  const flameLayers = bands
    .map((runs, l) => {
      if (!runs.length) return '';
      const ink = FLAME_INKS[Math.min(2, Math.floor((l / bands.length) * 3))];
      return plotLayer(20 + l, `isotherm ${l + 1}`, stroke, pathOf(runs), ink);
    })
    .join('');

  const stipple = smoke
    ? smokeDots({
        camera,
        density: smoke.density,
        dots: smoke.dots,
        height,
        pen: smoke.pen ?? stroke,
        visible,
        width,
      })
    : '';
  const smokeShade = smoke?.shade ?? '';
  const sheet = smoke?.glow
    ? glowStipple({
        density: smoke.density,
        glow: smoke.glow,
        pen: smoke.pen ?? stroke,
        pixelRatio,
      })
    : '';
  const circles = smoke?.balls
    ? smokeCircles({ balls: smoke.balls, camera, height, visible, width })
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color:${paper}">` +
    `${sliceRuns.length ? plotLayer(0, 'slices', stroke, pathOf(sliceRuns)) : ''}` +
    `${outline.length ? plotLayer(1, 'silhouette', stroke, pathOf(outline)) : ''}` +
    `${shading ? plotLayer(2, 'shading', stroke, shading) : ''}` +
    `${contourRuns.length ? plotLayer(3, 'contours', stroke, pathOf(contourRuns)) : ''}` +
    `${creaseRuns.length ? plotLayer(5, 'creases', stroke, pathOf(creaseRuns)) : ''}` +
    `${stipple ? plotLayer(8, 'smoke', stroke, stipple, SMOKE_INK) : ''}` +
    `${smokeShade ? plotLayer(9, 'smoke shading', stroke, smokeShade, SMOKE_INK) : ''}` +
    `${circles ? plotLayer(8, 'smoke', stroke, circles, SMOKE_INK) : ''}` +
    `${sheet ? plotLayer(8, 'smoke', stroke, sheet, SMOKE_INK) : ''}` +
    `${flameLayers}</svg>`
  );
}

export function plotArgs(options) {
  return {
    contours: options.svgContours,
    creaseAngle: options.svgCreaseAngle,
    height: options.height,
    isotherms: options.svgIsotherms,
    lines: options.svgLines,
    paper: options.svgPaper,
    pixelRatio: options.pixelRatio,
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
    width: options.width,
  };
}

export const needsDepth = (options) =>
  Boolean(
    options.svgOcclusion ||
    options.svgSilhouette ||
    (options.svgShading && options.svgShading !== 'none')
  );

export const needsAlbedo = (options) => options.svgColors > 0;

export const needsImage = (options) =>
  Boolean(options.svgShading && options.svgShading !== 'none');
