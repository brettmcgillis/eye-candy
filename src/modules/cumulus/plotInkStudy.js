import {
  erodeMask,
  inkEdgeRuns,
  inkLayers,
  inkMap,
  inkMask,
  pathOf,
  penPx,
  plotLayer,
  shadePath,
  silhouetteRuns,
} from '@modules/plotKit';

import { cellInterior, pixelGridRuns, squareInkMap } from './plotPixelGrid';
import { skullField, skullInk } from './skullInk';

function fieldOf(image, mask, pen, pixelRatio) {
  const step = Math.max(1, Math.round(pen * pixelRatio * 0.5));
  const width = Math.ceil(mask.width / step);
  const height = Math.ceil(mask.height / step);
  const covered = new Uint8Array(width * height);
  let values = new Float32Array(covered.length);
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const sx = Math.min(mask.width - 1, Math.floor((x + 0.5) * step));
      const sy = Math.min(mask.height - 1, Math.floor((y + 0.5) * step));
      const at = sy * mask.width + sx;
      covered[i] = mask.covered[at];
      values[i] =
        (0.2126 * image.data[at * 4] +
          0.7152 * image.data[at * 4 + 1] +
          0.0722 * image.data[at * 4 + 2]) /
        255;
    }
  for (let pass = 0; pass < 3; pass += 1) {
    const next = new Float32Array(values.length);
    for (let y = 0; y < height; y += 1)
      for (let x = 0; x < width; x += 1) {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy += 1)
          for (let dx = -1; dx <= 1; dx += 1) {
            const sx = x + dx;
            const sy = y + dy;
            if (
              sx >= 0 &&
              sy >= 0 &&
              sx < width &&
              sy < height &&
              covered[sy * width + sx]
            ) {
              sum += values[sy * width + sx];
              count += 1;
            }
          }
        next[y * width + x] = count ? sum / count : values[y * width + x];
      }
    values = next;
  }
  return { covered, height, width, values, ratio: pixelRatio / step };
}

function quantile(field, fraction) {
  const histogram = new Uint32Array(256);
  let count = 0;
  field.values.forEach((value, i) => {
    if (field.covered[i]) {
      histogram[Math.min(255, Math.round(value * 255))] += 1;
      count += 1;
    }
  });
  let total = 0;
  return (
    histogram.findIndex((value) => {
      total += value;
      return total >= count * fraction;
    }) / 255
  );
}

function cleanMask(field, choose, minArea) {
  const covered = field.covered.map((on, i) =>
    on && choose(field.values[i]) ? 1 : 0
  );
  const seen = new Uint8Array(covered.length);
  const { width, height } = field;
  for (let start = 0; start < covered.length; start += 1) {
    if (covered[start] && !seen[start]) {
      const cells = [start];
      seen[start] = 1;
      for (let k = 0; k < cells.length; k += 1) {
        const i = cells[k];
        const x = i % width;
        const y = Math.floor(i / width);
        const neighbors = [];
        if (x > 0) neighbors.push(i - 1);
        if (x < width - 1) neighbors.push(i + 1);
        if (y > 0) neighbors.push(i - width);
        if (y < height - 1) neighbors.push(i + width);
        neighbors.forEach((at) => {
          if (covered[at] && !seen[at]) {
            seen[at] = 1;
            cells.push(at);
          }
        });
      }
      if (cells.length < minArea)
        cells.forEach((i) => {
          covered[i] = 0;
        });
    }
  }
  return { covered, height, width };
}

function hatch(mask, { angle = 45, gap, height, pen, ratio, width }) {
  const data = new Uint8ClampedArray(mask.width * mask.height * 4).fill(175);
  return shadePath({
    angle,
    equalize: false,
    height,
    width,
    pen,
    pixelRatio: ratio,
    image: { data, width: mask.width, height: mask.height },
    mask,
    shading: 'crosshatch',
    spacing: gap,
  });
}

const minus = (mask, ...cuts) => ({
  ...mask,
  covered: mask.covered.map((on, i) =>
    on && !cuts.some((cut) => cut?.covered[i]) ? 1 : 0
  ),
});

export default function renderInkStudy({
  albedo,
  anatomyMask,
  anatomyImage,
  skullMask,
  femurMask,
  cloud,
  cloudPuffs,
  censor,
  censorGrid,
  coverage,
  options,
  palette,
}) {
  const { width, height, pixelRatio } = options;
  const pen = penPx(options) ?? 0.6;
  const perMm = pen / (options.svgPenMm || 0.4);
  const ink = options.svgMonochrome
    ? '#000000'
    : (options.svgAnatomyInk ?? '#222222');
  const layers = [];
  const add = (label, d, color = ink) => {
    if (d) layers.push(plotLayer(200 + layers.length, label, pen, d, color));
  };
  const invert = (mask) => ({
    ...mask,
    covered: mask.covered.map((on) => (on ? 0 : 1)),
  });
  const skullGap = skullMask
    ? invert(erodeMask(invert(skullMask), Math.ceil(pen * pixelRatio * 1.75)))
    : null;
  const separateFemur = femurMask ? minus(femurMask, skullGap) : null;
  const boneGuard = anatomyMask
    ? invert(erodeMask(invert(anatomyMask), Math.ceil(pen * pixelRatio * 0.5)))
    : null;
  const halo = minus(coverage, boneGuard, cloud);
  const raw = inkMap({ image: albedo, mask: halo, palette });
  const map =
    censor && censorGrid
      ? squareInkMap(raw, censor, censorGrid, palette.length)
      : raw;
  const edges = inkEdgeRuns({
    coverage: minus(halo, censor),
    map,
    minLength: pen * 2,
    pixelRatio,
    radius: 1,
  });
  Object.entries(edges).forEach(([i, runs]) =>
    add('lane boundaries', pathOf(runs), palette[i].color)
  );
  add(
    'halo outline',
    pathOf(silhouetteRuns(halo, pixelRatio, pen * pixelRatio * 0.25)),
    ink
  );
  if (censor && censorGrid) {
    pixelGridRuns(map, censor, censorGrid, palette, pixelRatio, pen).forEach(
      (runs) => add('square grid', pathOf(runs), ink)
    );
  }
  palette.forEach((entry, i) => {
    const region = inkMask(map, i, halo);
    const glass = censor
      ? {
          ...region,
          covered: region.covered.map((on, at) =>
            on && censor.covered[at] ? 1 : 0
          ),
        }
      : null;
    const clear = erodeMask(minus(region, censor), Math.ceil(pen * pixelRatio));
    add(
      'halo tone',
      hatch(clear, {
        gap: Math.max(perMm * 1.2, pen * 3),
        width,
        height,
        pen,
        ratio: pixelRatio,
      }),
      entry.color
    );
    if (glass)
      add(
        'pixel blocks',
        hatch(
          censorGrid
            ? cellInterior(
                erodeMask(glass, Math.ceil(pen * pixelRatio)),
                censorGrid,
                pen * pixelRatio * 1.5
              )
            : erodeMask(glass, Math.ceil(pen * pixelRatio)),
          {
            angle: 0,
            gap: Math.max(perMm * 1.2, pen * 3),
            width,
            height,
            pen,
            ratio: pixelRatio,
          }
        ),
        entry.color
      );
  });
  if (cloud && cloudPuffs.length) {
    const step = Math.max(1, Math.round(pen * pixelRatio * 0.75));
    const field = {
      width: Math.ceil(cloud.width / step),
      height: Math.ceil(cloud.height / step),
      ratio: pixelRatio / step,
    };
    const visible = {
      covered: new Uint8Array(field.width * field.height),
      width: field.width,
      height: field.height,
    };
    cloudPuffs.forEach((puff) => {
      const left = Math.max(
        0,
        Math.floor((puff.x - puff.radius) * field.ratio)
      );
      const right = Math.min(
        field.width - 1,
        Math.ceil((puff.x + puff.radius) * field.ratio)
      );
      const top = Math.max(0, Math.floor((puff.y - puff.radius) * field.ratio));
      const bottom = Math.min(
        field.height - 1,
        Math.ceil((puff.y + puff.radius) * field.ratio)
      );
      for (let y = top; y <= bottom; y += 1)
        for (let x = left; x <= right; x += 1) {
          const px = x / field.ratio;
          const py = y / field.ratio;
          const sx = Math.min(coverage.width - 1, Math.floor(px * pixelRatio));
          const sy = Math.min(coverage.height - 1, Math.floor(py * pixelRatio));
          const at = sy * coverage.width + sx;
          if (
            Math.hypot(px - puff.x, py - puff.y) <= puff.radius &&
            !anatomyMask?.covered[at] &&
            puff.depth <= coverage.data[at] + 0.015
          )
            visible.covered[y * field.width + x] = 1;
        }
    });
    add(
      'cloud lobes',
      pathOf(silhouetteRuns(visible, field.ratio, pen * field.ratio * 0.7))
    );
    const interior = erodeMask(visible, Math.ceil(pen * field.ratio * 1.5));
    const chosen = [];
    [...cloudPuffs]
      .sort((a, b) => b.radius - a.radius)
      .forEach((puff) => {
        if (
          chosen.length < 6 &&
          chosen.every(
            (other) =>
              Math.hypot(puff.x - other.x, puff.y - other.y) >
              (puff.radius + other.radius) * 0.45
          )
        )
          chosen.push(puff);
      });
    const arcs = [];
    chosen.forEach((puff) => {
      let run = [];
      const flush = () => {
        const length = run.reduce(
          (sum, p, i) =>
            i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
          0
        );
        if (length > perMm * 3) arcs.push(run);
        run = [];
      };
      for (let k = 0; k <= 48; k += 1) {
        const angle = Math.PI + (k * Math.PI) / 48;
        const x = puff.x + Math.cos(angle) * puff.radius * 0.8;
        const y = puff.y + Math.sin(angle) * puff.radius * 0.8;
        const sx = Math.floor(x * field.ratio);
        const sy = Math.floor(y * field.ratio);
        if (
          sx >= 0 &&
          sy >= 0 &&
          sx < field.width &&
          sy < field.height &&
          interior.covered[sy * field.width + sx]
        )
          run.push({ x, y });
        else flush();
      }
      flush();
    });
    add('cloud puff arcs', pathOf(arcs));
  }
  if (anatomyMask) {
    const field = fieldOf(anatomyImage, anatomyMask, pen, pixelRatio);
    const restrict = (mask, subject) => ({
      ...mask,
      covered: mask.covered.map((on, i) => {
        const x = Math.min(
          subject.width - 1,
          Math.floor((((i % field.width) + 0.5) / field.ratio) * pixelRatio)
        );
        const y = Math.min(
          subject.height - 1,
          Math.floor(
            ((Math.floor(i / field.width) + 0.5) / field.ratio) * pixelRatio
          )
        );
        return on && subject.covered[y * subject.width + x] ? 1 : 0;
      }),
    });
    const printable =
      separateFemur && skullMask
        ? {
            ...anatomyMask,
            covered: anatomyMask.covered.map((on, i) =>
              on && (separateFemur.covered[i] || skullMask.covered[i]) ? 1 : 0
            ),
          }
        : anatomyMask;
    const area = (perMm * field.ratio) ** 2 * 0.8;
    const darkLevel = Math.min(0.34, quantile(field, 0.2));
    const midLevel = Math.min(0.62, quantile(field, 0.46));
    const deep = cleanMask(field, (value) => value < darkLevel, area);
    const middle = cleanMask(field, (value) => value < midLevel, area * 1.5);
    const inset = erodeMask(field, Math.ceil(pen * field.ratio * 0.5));
    const closed = erodeMask(invert(erodeMask(invert(deep), 1)), 1);
    const dark = {
      ...closed,
      covered: closed.covered.map((on, i) => (on && inset.covered[i] ? 1 : 0)),
    };
    const light = minus(middle, closed);
    const printableDark = restrict(dark, printable);
    const hatchedDark = separateFemur
      ? restrict(printableDark, separateFemur)
      : printableDark;
    const hatchedLight = separateFemur ? restrict(light, separateFemur) : light;
    add(
      'bone shadow shapes',
      hatch(erodeMask(hatchedDark, Math.ceil(pen * field.ratio)), {
        gap: Math.max(perMm, pen * 2.5),
        width,
        height,
        pen,
        ratio: field.ratio,
      })
    );
    add(
      'shadow contours',
      pathOf(silhouetteRuns(hatchedDark, field.ratio, pen * field.ratio * 0.5))
    );
    add(
      'bone midtone',
      hatch(erodeMask(hatchedLight, Math.ceil(pen * field.ratio * 0.5)), {
        gap: Math.max(perMm * 1.6, pen * 4),
        width,
        height,
        pen,
        ratio: field.ratio,
      })
    );
    if (skullMask)
      add(
        'skull source features',
        skullInk(skullField(anatomyImage, skullMask, pen, pixelRatio))
      );
    if (skullMask && separateFemur) {
      add(
        'skull outline',
        pathOf(silhouetteRuns(skullMask, pixelRatio, pen * pixelRatio * 0.5))
      );
      add(
        'femur outline',
        pathOf(
          silhouetteRuns(separateFemur, pixelRatio, pen * pixelRatio * 0.5)
        )
      );
    } else
      add(
        'bone silhouette',
        pathOf(silhouetteRuns(field, field.ratio, pen * field.ratio * 0.5))
      );
  }
  const open = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color:${options.svgPaper ?? '#ffffff'}">`;
  return inkLayers(
    `${open}${layers.join('')}</svg>`,
    options.svgColors || palette.length + 1
  );
}
