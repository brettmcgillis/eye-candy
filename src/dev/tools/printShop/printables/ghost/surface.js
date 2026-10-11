import { fbm2D } from '@elements/WebGPU/cloth/clothTopology';
import { CUTOUTS } from '@elements/WebGPU/ghost/ghostRig';

import { clipMesh, createMesh } from '../../kernel';
import { rotateXZ } from './settle';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const catmullRom = (p0, p1, p2, p3, t) =>
  0.5 *
  (2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

// The render mesh exactly as the GPU draws it: one vertex per sim quad at the
// mean of its four corners, then the group's squash and tilt.
function renderGrid(settled) {
  const { alpha, pos, topology, transform } = settled;
  const { meshVCount, quadDead, segmentsX, segmentsY, vtxIdArr } = topology;
  const positions = new Float64Array(meshVCount * 3);
  const opacity = new Float64Array(meshVCount);
  for (let m = 0; m < meshVCount; m += 1) {
    let x = 0;
    let y = 0;
    let z = 0;
    let a = 0;
    for (let k = 0; k < 4; k += 1) {
      const v = vtxIdArr[m * 4 + k];
      x += pos[v * 3] / 4;
      y += pos[v * 3 + 1] / 4;
      z += pos[v * 3 + 2] / 4;
      a += alpha.render[v] / 4;
    }
    positions.set(
      rotateXZ(
        transform.rotationX,
        transform.rotationZ,
        x,
        y * transform.squash,
        z
      ),
      m * 3
    );
    opacity[m] = quadDead[m] ? 0 : a;
  }

  // Outside the circle the grid has no cloth; extend it outward so the
  // bicubic refinement has neighbours to read at the rim.
  const known = Uint8Array.from(quadDead, (dead) => (dead ? 0 : 1));
  let pending = known.length - known.reduce((sum, k) => sum + k, 0);
  while (pending > 0) {
    const next = known.slice();
    for (let gy = 0; gy < segmentsY; gy += 1) {
      for (let gx = 0; gx < segmentsX; gx += 1) {
        const m = gy * segmentsX + gx;
        if (!known[m]) {
          let n = 0;
          const sum = [0, 0, 0];
          [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].forEach(([dx, dy]) => {
            const nx = gx + dx;
            const ny = gy + dy;
            if (nx >= 0 && ny >= 0 && nx < segmentsX && ny < segmentsY) {
              const o = ny * segmentsX + nx;
              if (known[o]) {
                n += 1;
                for (let c = 0; c < 3; c += 1) sum[c] += positions[o * 3 + c];
              }
            }
          });
          if (n > 0) {
            positions.set(
              sum.map((value) => value / n),
              m * 3
            );
            next[m] = 1;
            pending -= 1;
          }
        }
      }
    }
    known.set(next);
  }

  // Interior 1, rim (alive with a dead neighbour) just above 0, dead −1: the
  // zero crossing sits on the outermost drawn vertices, where the GPU mesh ends.
  const domain = new Float64Array(meshVCount);
  for (let gy = 0; gy < segmentsY; gy += 1) {
    for (let gx = 0; gx < segmentsX; gx += 1) {
      const m = gy * segmentsX + gx;
      if (quadDead[m]) {
        domain[m] = -1;
      } else {
        let rim =
          gx === 0 || gy === 0 || gx === segmentsX - 1 || gy === segmentsY - 1;
        for (let dy = -1; dy <= 1 && !rim; dy += 1) {
          for (let dx = -1; dx <= 1 && !rim; dx += 1) {
            if (quadDead[(gy + dy) * segmentsX + gx + dx]) rim = true;
          }
        }
        domain[m] = rim ? 0.02 : 1;
      }
    }
  }
  return { domain, opacity, positions };
}

// The ClothMesh opacityNode's per-pixel half: smoothEdges noise holes and
// tatter, then the eye cutouts. `u`, `v` are the mesh uv (v flipped).
function pixelOpacity(p, edgePinned, u, v) {
  let a = 1;
  if (p.smoothEdges) {
    const n = fbm2D(u * p.alphaScale, (1 - v) * p.alphaScale, p.alphaSeed);
    const W = 0.08;
    const holeThresh = 1 - p.holeAmount * 0.4;
    const hole = 1 - smoothstep(holeThresh - W, holeThresh + W, n);
    const depth = p.tatterEdge * 0.5;
    const free = (pinned, d) => (pinned ? 1 : d);
    const minDist = Math.min(
      free(edgePinned.left, u),
      free(edgePinned.right, 1 - u),
      free(edgePinned.top, 1 - v),
      free(edgePinned.bottom, v)
    );
    const tDepth = clamp01(minDist / (depth + 0.0001));
    const tatterThresh = 0.7 - tDepth * 0.65;
    const raw = smoothstep(tatterThresh - W, tatterThresh + W, n);
    a *= hole * (raw + (1 - raw) * tDepth);
  }
  CUTOUTS.forEach((cutout) => {
    const fade = cutout.fade ?? cutout.radius * 0.4;
    const dist = Math.hypot(u - cutout.u, v - cutout.v);
    a *= clamp01((dist - (cutout.radius - fade)) / fade);
  });
  return a;
}

function rimFactor(p, u, v) {
  if (p.cutoutRimWidth <= 0.0001) return 0;
  let factor = 0;
  CUTOUTS.forEach((cutout) => {
    const fade = cutout.fade ?? cutout.radius * 0.4;
    const edge =
      Math.hypot(u - cutout.u, v - cutout.v) -
      (cutout.radius - fade + p.cutoutRimOffset);
    if (edge > 0 && edge < p.cutoutRimWidth) factor = 1;
  });
  return factor;
}

const hexToRgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * clamp01(c) ** (1 / 2.4) - 0.055;

function sampler(image, tile) {
  if (!image) return null;
  const { data, height, width } = image;
  const wrap = (value, size) =>
    tile
      ? ((Math.floor(value) % size) + size) % size
      : Math.min(size - 1, Math.max(0, Math.floor(value)));
  const texel = (x, y) => {
    const o = (wrap(y, height) * width + wrap(x, width)) * 4;
    return [
      data[o] / 255,
      data[o + 1] / 255,
      data[o + 2] / 255,
      data[o + 3] / 255,
    ];
  };
  // flipY: uv (0,0) is the image's bottom-left.
  return (u, v) => {
    const x = u * width - 0.5;
    const y = (1 - v) * height - 0.5;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const a = texel(x0, y0);
    const b = texel(x0 + 1, y0);
    const c = texel(x0, y0 + 1);
    const d = texel(x0 + 1, y0 + 1);
    return a.map(
      (value, k) =>
        value * (1 - fx) * (1 - fy) +
        b[k] * fx * (1 - fy) +
        c[k] * (1 - fx) * fy +
        d[k] * fx * fy
    );
  };
}

// ClothMesh's buildTexturedColor: the texture is sampled raw (no sRGB decode
// on a node sample), composited over the base colour in linear, then the
// display encodes sRGB — which is what a viewer of the scene sees.
function texturedColor(p, sample, baseHex, u, v, worldX, worldZ) {
  const base = hexToRgb(baseHex).map(toLinear);
  if (!sample) return base;
  let su = u - 0.5;
  let sv = v - 0.5;
  if (p.textureProjection === 'world') {
    su = worldX;
    sv = worldZ;
  }
  su /= p.textureScaleX;
  sv /= p.textureScaleY;
  const r = (p.textureRotation * Math.PI) / 180;
  const tu = su * Math.cos(r) - sv * Math.sin(r) + 0.5;
  const tv = su * Math.sin(r) + sv * Math.cos(r) + 0.5;
  const texel = sample(tu, tv);
  return base.map((value, k) => {
    const composited = value + (texel[k] - value) * texel[3];
    return value + (composited - value) * clamp01(p.textureBlend);
  });
}

// Refines the settled cloth `detail`× per quad with bicubic interpolation and
// cuts it where the scene would show it at `threshold` opacity or more.
export default function buildGhostSurface(
  settled,
  p,
  { detail, threshold, images }
) {
  const { topology } = settled;
  const { edgePinned, segmentsX, segmentsY } = topology;
  const grid = renderGrid(settled);
  const nx = (segmentsX - 1) * detail + 1;
  const ny = (segmentsY - 1) * detail + 1;
  const count = nx * ny;
  const positions = new Float64Array(count * 3);
  const rest = new Float64Array(count * 3);
  const uv = new Float64Array(count * 2);
  const field = new Float64Array(count);
  const front = new Float64Array(count * 3);
  const back = new Float64Array(count * 3);
  const outerSample = sampler(images.outer, p.textureTile);
  const innerSample = sampler(images.inner, p.textureTile);
  const innerBase = p.innerColor || p.color;

  const at = (array, size, gx, gy, c) => {
    const x = Math.min(segmentsX - 1, Math.max(0, gx));
    const y = Math.min(segmentsY - 1, Math.max(0, gy));
    return array[(y * segmentsX + x) * size + c];
  };
  const bicubic = (array, size, c, fx, fy) => {
    const gx = Math.min(segmentsX - 2, Math.floor(fx));
    const gy = Math.min(segmentsY - 2, Math.floor(fy));
    const tx = fx - gx;
    const ty = fy - gy;
    const rows = [-1, 0, 1, 2].map((dy) =>
      catmullRom(
        at(array, size, gx - 1, gy + dy, c),
        at(array, size, gx, gy + dy, c),
        at(array, size, gx + 1, gy + dy, c),
        at(array, size, gx + 2, gy + dy, c),
        tx
      )
    );
    return catmullRom(rows[0], rows[1], rows[2], rows[3], ty);
  };
  const bilinear = (array, fx, fy) => {
    const gx = Math.min(segmentsX - 2, Math.floor(fx));
    const gy = Math.min(segmentsY - 2, Math.floor(fy));
    const tx = fx - gx;
    const ty = fy - gy;
    return (
      at(array, 1, gx, gy, 0) * (1 - tx) * (1 - ty) +
      at(array, 1, gx + 1, gy, 0) * tx * (1 - ty) +
      at(array, 1, gx, gy + 1, 0) * (1 - tx) * ty +
      at(array, 1, gx + 1, gy + 1, 0) * tx * ty
    );
  };

  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const n = j * nx + i;
      const fx = i / detail;
      const fy = j / detail;
      for (let c = 0; c < 3; c += 1) {
        positions[n * 3 + c] = bicubic(grid.positions, 3, c, fx, fy);
      }
      // The flat sheet this point came from, for telling folds from bends.
      rest[n * 3] = ((fx + 0.5) / segmentsX - 0.5) * topology.width;
      rest[n * 3 + 2] = ((fy + 0.5) / segmentsY - 0.5) * topology.height;
      const u = (fx + 0.5) / segmentsX;
      const v = 1 - (fy + 0.5) / segmentsY;
      uv[n * 2] = u;
      uv[n * 2 + 1] = v;
      const opacity =
        bilinear(grid.opacity, fx, fy) * pixelOpacity(p, edgePinned, u, v);
      field[n] = Math.min(opacity - threshold, bilinear(grid.domain, fx, fy));

      const wx = positions[n * 3];
      const wz = positions[n * 3 + 2];
      const outer = texturedColor(p, outerSample, p.color, u, v, wx, wz);
      const rim = rimFactor(p, u, v);
      const rimColor = hexToRgb(p.cutoutRimColor).map(toLinear);
      const inner = innerSample
        ? texturedColor(p, innerSample, p.color, u, v, wx, wz)
        : hexToRgb(innerBase).map(toLinear);
      for (let c = 0; c < 3; c += 1) {
        back[n * 3 + c] = toSrgb(outer[c] + (rimColor[c] - outer[c]) * rim);
        front[n * 3 + c] = toSrgb(inner[c]);
      }
    }
  }

  // Same diagonal and winding as the GPU's triangles A/B, so the winding's
  // front face is the ghost's inside, as frontFacing marks it in ClothMesh.
  const indices = [];
  for (let i = 1; i < nx; i += 1) {
    for (let j = 1; j < ny; j += 1) {
      const q00 = j * nx + i;
      const q10 = j * nx + i - 1;
      const q11 = (j - 1) * nx + i - 1;
      const q01 = (j - 1) * nx + i;
      indices.push(q00, q10, q11, q00, q11, q01);
    }
  }

  const mesh = createMesh(positions, Uint32Array.from(indices), {
    back: { array: back, size: 3 },
    front: { array: front, size: 3 },
    rest: { array: rest, size: 3 },
    uv: { array: uv, size: 2 },
  });
  return clipMesh(mesh, field);
}
