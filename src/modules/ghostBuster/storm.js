import {
  CLOUD_MODEL,
  boltShapes,
  cloudScale,
  rainShapes,
} from '@elements/WebGPU/rainCloud/rainCloudRig';
import { chain, silhouetteRuns, simplify, smooth } from '@modules/plotKit';

// Each of `subject`'s pixels the other pass covers nearer is dropped, so a
// silhouette follows what the camera sees of it.
export function unoccluded(subject, other) {
  if (!other) return subject;
  const covered = subject.covered.map((c, i) =>
    c && !(other.covered[i] && other.data[i] < subject.data[i]) ? 1 : 0
  );
  return { ...subject, covered };
}

// The framing sphere grown to take in the cloud above the ghost.
export function withStorm(bounds, extent) {
  if (!bounds || !extent?.params.cloudVisible) return bounds;
  const scale = cloudScale(extent.params);
  const half = (CLOUD_MODEL.height * scale) / 2;
  const cloud = {
    center: [extent.base.x, extent.base.y + half, extent.base.z],
    radius: Math.hypot(CLOUD_MODEL.halfWidth * scale, half),
  };
  const gap = Math.hypot(...cloud.center.map((c, i) => c - bounds.center[i]));
  if (gap + cloud.radius <= bounds.radius) return bounds;
  if (gap + bounds.radius <= cloud.radius) return cloud;
  const radius = (gap + bounds.radius + cloud.radius) / 2;
  const t = (radius - bounds.radius) / gap;
  return {
    center: bounds.center.map((c, i) => c + (cloud.center[i] - c) * t),
    radius,
  };
}

export function unionOf(a, b) {
  if (!b) return a;
  return {
    ...a,
    covered: a.covered.map((c, i) => (c || b.covered[i] ? 1 : 0)),
    data: a.data.map((d, i) => Math.min(d, b.data[i])),
  };
}

const strokeLength = (run) =>
  run.reduce(
    (sum, p, i) =>
      i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
    0
  );

// The cloud is an unwelded triangle soup whose cracks leave pinholes in a
// pass; each small enclosed hole takes its covered neighbours' depth and
// normal so it neither outlines nor splits a puff.
export function closePinholes({ coverage, normals }, maxArea = 64) {
  const { height, width } = coverage;
  const covered = coverage.covered.slice();
  const data = coverage.data.slice();
  const filled = normals.slice();
  const seen = new Uint8Array(width * height);
  for (let start = 0; start < covered.length; start += 1) {
    if (!covered[start] && !seen[start]) {
      const hole = [start];
      seen[start] = 1;
      let open = false;
      for (let k = 0; k < hole.length; k += 1) {
        const i = hole[k];
        const x = i % width;
        const y = (i - x) / width;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          open = true;
        }
        const neighbours = [i - 1, i + 1, i - width, i + width];
        for (let n = 0; n < 4; n += 1) {
          const j = neighbours[n];
          if (j >= 0 && j < covered.length && !covered[j] && !seen[j]) {
            seen[j] = 1;
            hole.push(j);
          }
        }
      }
      if (!open && hole.length <= maxArea) {
        hole.forEach((i) => {
          const sum = [0, 0, 0];
          let depth = Infinity;
          [i - 1, i + 1, i - width, i + width].forEach((j) => {
            if (coverage.covered[j]) {
              depth = Math.min(depth, coverage.data[j]);
              for (let c = 0; c < 3; c += 1) sum[c] += normals[j * 3 + c];
            }
          });
          const length = Math.hypot(...sum) || 1;
          covered[i] = 1;
          if (depth < Infinity) data[i] = depth;
          for (let c = 0; c < 3; c += 1) filled[i * 3 + c] = sum[c] / length;
        });
      }
    }
  }
  return { coverage: { ...coverage, covered, data }, normals: filled };
}

// Valleys where puffs meet (the view-space normal folds back across a few
// pixels) and depth jumps split the cloud into puffs; the puffs then grow
// into those bands, so each boundary is drawn once, down its middle.
function puffRuns({ coverage, normals, pixelRatio }, valley = 0.3) {
  const { covered, data, height, width } = coverage;
  const k = Math.max(1, Math.round(3 * pixelRatio));
  const crease = new Uint8Array(width * height);
  const inside = (i) => i >= 0 && i < covered.length && covered[i];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const l = x >= k ? i - k : -1;
      const r = x < width - k ? i + k : -1;
      const u = i - k * width;
      const d = i + k * width;
      if (covered[i]) {
        const jump = data[i] * 0.02;
        crease[i] =
          !inside(l) ||
          !inside(r) ||
          !inside(u) ||
          !inside(d) ||
          normals[l * 3] - normals[r * 3] > valley ||
          normals[d * 3 + 1] - normals[u * 3 + 1] > valley ||
          Math.abs(data[r] - data[l]) > jump ||
          Math.abs(data[d] - data[u]) > jump
            ? 1
            : 0;
      }
    }
  }

  const label = new Int32Array(width * height).fill(-1);
  const minArea = (8 * pixelRatio) ** 2;
  let regions = 0;
  for (let start = 0; start < label.length; start += 1) {
    if (covered[start] && !crease[start] && label[start] < 0) {
      const region = [start];
      label[start] = regions;
      for (let q = 0; q < region.length; q += 1) {
        const i = region[q];
        const x = i % width;
        const neighbours = [
          x > 0 ? i - 1 : -1,
          x < width - 1 ? i + 1 : -1,
          i - width,
          i + width,
        ];
        for (let n = 0; n < 4; n += 1) {
          const j = neighbours[n];
          if (
            j >= 0 &&
            j < label.length &&
            covered[j] &&
            !crease[j] &&
            label[j] < 0
          ) {
            label[j] = regions;
            region.push(j);
          }
        }
      }
      if (region.length < minArea) {
        region.forEach((i) => {
          label[i] = -1;
          crease[i] = 1;
        });
      } else regions += 1;
    }
  }

  let front = [];
  for (let i = 0; i < label.length; i += 1) if (label[i] >= 0) front.push(i);
  while (front.length) {
    const next = [];
    front.forEach((i) => {
      const x = i % width;
      [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]
        .filter((j) => j >= 0 && j < label.length && covered[j] && label[j] < 0)
        .forEach((j) => {
          label[j] = label[i];
          next.push(j);
        });
    });
    front = next;
  }

  const segments = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (covered[i]) {
        if (x < width - 1 && covered[i + 1] && label[i + 1] !== label[i]) {
          segments.push([
            [x + 1, y],
            [x + 1, y + 1],
          ]);
        }
        if (
          y < height - 1 &&
          covered[i + width] &&
          label[i + width] !== label[i]
        ) {
          segments.push([
            [x, y + 1],
            [x + 1, y + 1],
          ]);
        }
      }
    }
  }
  return chain(segments)
    .map((line) =>
      smooth(simplify(line, 0.7)).map(([x, y]) => ({
        x: x / pixelRatio,
        y: y / pixelRatio,
      }))
    )
    .filter((run) => strokeLength(run) >= 16);
}

// The storm skin's line work: the cloud (its silhouette and its puffs'
// contours), the rain's streaks and splashes and a bright bolt, projected
// and cut by `visible` like the cloth's lines.
export default function stormRuns({
  cloud = null,
  project,
  snapshot,
  visible,
  width,
  height,
}) {
  const shown = (p) =>
    p.depth > 0 &&
    p.x >= -1 &&
    p.y >= -1 &&
    p.x <= width + 1 &&
    p.y <= height + 1 &&
    (!visible || visible(p.x, p.y, p.depth));

  const trace = (worldPoints, into, skip = () => false) => {
    let run = [];
    const flush = () => {
      if (run.length > 1) into.push(run);
      run = [];
    };
    worldPoints.forEach(([x, y, z]) => {
      const p = project(x, y, z);
      if (shown(p) && !skip(p)) run.push(p);
      else flush();
    });
    flush();
  };

  const along = (a, b, samples) =>
    Array.from({ length: samples + 1 }, (_, i) => {
      const t = i / samples;
      return [0, 1, 2].map((c) => a[c] + (b[c] - a[c]) * t);
    });

  const cloudRuns = cloud
    ? [...silhouetteRuns(cloud.coverage, cloud.pixelRatio), ...puffRuns(cloud)]
    : [];

  const rainRuns = [];
  const splashRuns = [];
  if (snapshot.params.rainVisible && snapshot.shadow) {
    const { splashes, streaks } = rainShapes(snapshot);
    streaks.forEach(([a, b]) => trace(along(a, b, 6), rainRuns));
    splashes.forEach(({ center, normal, radius }) => {
      const [nx, ny, nz] = normal;
      const flat = Math.hypot(ny, nx) || 1;
      const tangent = [ny / flat, -nx / flat, 0];
      const bitangent = [
        ny * tangent[2] - nz * tangent[1],
        nz * tangent[0] - nx * tangent[2],
        nx * tangent[1] - ny * tangent[0],
      ];
      const n = 16;
      trace(
        Array.from({ length: n + 1 }, (_, i) => {
          const a = (i / n) * Math.PI * 2;
          const c = Math.cos(a) * radius;
          const s = Math.sin(a) * radius;
          return [0, 1, 2].map(
            (k) => center[k] + tangent[k] * c + bitangent[k] * s
          );
        }),
        splashRuns
      );
    });
  }

  const boltRuns = [];
  boltShapes(snapshot).forEach(({ points }) => {
    const dense = points.flatMap((p, i) =>
      i ? along(points[i - 1], p, 2).slice(1) : [p]
    );
    trace(dense, boltRuns);
  });

  return { boltRuns, cloudRuns, rainRuns, splashRuns };
}
