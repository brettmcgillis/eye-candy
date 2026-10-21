import {
  DECAY_DEFAULTS,
  NOISE_STEP,
  decayAt,
  dripAt,
  dripTable,
  eyeHoleDistance,
} from '@elements/WebGPU/cloth/clothDecay';
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

const decayOf = (p) => ({ ...DECAY_DEFAULTS, ...p });
const tables = new Map();
const dripTableOf = (seed) => {
  if (!tables.has(seed)) tables.set(seed, dripTable(seed));
  return tables.get(seed);
};

const tatterDepthOf = (p, edgePinned, u, v) => {
  const free = (pinned, d) => (pinned ? 1 : d);
  const minDist = Math.min(
    free(edgePinned.left, u),
    free(edgePinned.right, 1 - u),
    free(edgePinned.top, 1 - v),
    free(edgePinned.bottom, v)
  );
  return clamp01(minDist / (p.tatterEdge * 0.5 + 0.0001));
};

// clothDecay's rot and blood, from the noise the baked texture holds.
function stainAt(p, edgePinned, u, v) {
  const d = decayOf(p);
  if (!(d.holeRimWidth > 0 || d.bloodAmount > 0)) return { blood: 0, rot: 0 };
  const n = (x, y) =>
    fbm2D(x * p.alphaScale, (1 - y) * p.alphaScale, p.alphaSeed);
  const e = NOISE_STEP;
  const slope =
    Math.hypot(n(u + e, v) - n(u - e, v), n(u, v + e) - n(u, v - e)) / (2 * e);
  return decayAt(
    n(u, v),
    slope,
    n(1 - u, v),
    tatterDepthOf(p, edgePinned, u, v),
    d
  );
}

const dripOf = (p, u, v) => {
  const d = decayOf(p);
  return d.dripAmount > 0
    ? dripAt(u, v, 0, d, dripTableOf(p.alphaSeed))
    : { alpha: 1, goo: 0 };
};

// The ClothMesh opacityNode's per-pixel half: smoothEdges noise holes and
// tatter, hem drips, then the eye cutouts. `u`, `v` are the mesh uv (v
// flipped).
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
  a *= dripOf(p, u, v).alpha;
  CUTOUTS.forEach((cutout) => {
    const fade = cutout.fade ?? cutout.radius * 0.4;
    a *= clamp01((eyeHoleDistance(u, v, cutout, decayOf(p)) + fade) / fade);
  });
  return a;
}

function rimFactor(p, u, v) {
  if (p.cutoutRimWidth <= 0.0001) return 0;
  let factor = 0;
  CUTOUTS.forEach((cutout) => {
    const fade = cutout.fade ?? cutout.radius * 0.4;
    const edge =
      eyeHoleDistance(u, v, cutout, decayOf(p)) + fade - p.cutoutRimOffset;
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

// GhostBuster's default view (camera at (0, 1, 3.5) on the origin, fov 50):
// a 'screen' projected texture is laid on as the scene shows it from there.
// TSL's screenUV runs from the top-left, y down (measured headlessly).
const CAMERA = { fov: 50, position: [0, 1, 3.5], target: [0, 0, 0] };

export function screenProjector(aspect) {
  const [px, py, pz] = CAMERA.position;
  let f = CAMERA.target.map((value, k) => value - CAMERA.position[k]);
  const fl = Math.hypot(...f);
  f = f.map((value) => value / fl);
  let r = [-f[2], 0, f[0]];
  const rl = Math.hypot(...r);
  r = r.map((value) => value / rl);
  const u = [
    r[1] * f[2] - r[2] * f[1],
    r[2] * f[0] - r[0] * f[2],
    r[0] * f[1] - r[1] * f[0],
  ];
  const t = Math.tan((CAMERA.fov * Math.PI) / 360);
  return ([x, y, z]) => {
    const d = [x - px, y - py, z - pz];
    const depth = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
    const sx = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / (depth * t * aspect);
    const sy = (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / (depth * t);
    return [sx * 0.5 + 0.5, 0.5 - sy * 0.5];
  };
}

// ClothMesh's buildTexturedColor: the texture is sampled raw (no sRGB decode
// on a node sample) and composited over the base colour in linear.
function texturedColor(p, sample, baseHex, uv, world, screen) {
  const base = hexToRgb(baseHex).map(toLinear);
  if (!sample) return base;
  let [su, sv] = [uv[0] - 0.5, uv[1] - 0.5];
  if (p.textureProjection === 'world') {
    [su, sv] = [world[0], world[2]];
  } else if (p.textureProjection === 'screen') {
    const [x, y] = screen(world);
    [su, sv] = [x - 0.5, y - 0.5];
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

// ClothMesh's emissiveNode: each side's colour × intensity, faded from
// emissiveCenter by `(1 − d·falloff)²` when there is a falloff.
function emissive(p, side, uv) {
  const hex = side === 'outer' ? p.outerEmissiveColor : p.innerEmissiveColor;
  const intensity =
    side === 'outer' ? p.outerEmissiveIntensity : p.innerEmissiveIntensity;
  if (!hex || !intensity) return [0, 0, 0];
  const glow =
    p.emissiveFalloff > 0
      ? clamp01(
          1 -
            Math.hypot(uv[0] - p.emissiveCenterU, uv[1] - p.emissiveCenterV) *
              p.emissiveFalloff
        ) ** 2
      : 1;
  return hexToRgb(hex).map((c) => toLinear(c) * intensity * glow);
}

// What a viewer of the scene sees on each side, minus the lighting: albedo
// (textured, eyelined) plus the glow it emits, sRGB-encoded.
export function createGhostColour(p, images, aspect, edgePinned) {
  const outerSample = sampler(images.outer, p.textureTile);
  const innerSample = sampler(images.inner, p.textureTile);
  const screen = screenProjector(aspect);
  const rimColor = hexToRgb(p.cutoutRimColor).map(toLinear);
  const d = decayOf(p);
  const [rotColor, bloodColor, gooColor] = [
    d.holeRimColor,
    d.bloodColor,
    d.dripColor,
  ].map((hex) => hexToRgb(hex).map(toLinear));
  const lerp = (a, b, t) => a.map((c, k) => c + (b[k] - c) * t);
  return (uv, world) => {
    const rim = rimFactor(p, uv[0], uv[1]);
    const albedo = texturedColor(p, outerSample, p.color, uv, world, screen);
    const outer = albedo.map((c, k) => c + (rimColor[k] - c) * rim);
    const inner = innerSample
      ? texturedColor(p, innerSample, p.color, uv, world, screen)
      : hexToRgb(p.innerColor || p.color).map(toLinear);
    // ClothMesh lays rot, then blood, then goo over both sides.
    const { blood, rot } = edgePinned
      ? stainAt(p, edgePinned, uv[0], uv[1])
      : { blood: 0, rot: 0 };
    const { goo } = dripOf(p, uv[0], uv[1]);
    const decay = (c) =>
      lerp(
        lerp(lerp(c, rotColor, rot * 0.85), bloodColor, blood),
        gooColor,
        goo * d.dripTint
      );
    const glow = rotColor.map(
      (c, k) => c * d.holeRimGlow * rot + gooColor[k] * d.dripGlow * goo
    );
    const outerGlow = emissive(p, 'outer', uv);
    const innerGlow = emissive(p, 'inner', uv);
    return {
      back: decay(outer).map((c, k) =>
        toSrgb(clamp01(c + outerGlow[k] + glow[k]))
      ),
      front: decay(inner).map((c, k) =>
        toSrgb(clamp01(c + innerGlow[k] + glow[k]))
      ),
    };
  };
}

// Refines the settled cloth `detail`× per quad with bicubic interpolation and
// cuts it where the scene would show it at `threshold` opacity or more.
export default function buildGhostSurface(
  settled,
  p,
  { aspect, detail, images, threshold }
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
  const colourOf = createGhostColour(p, images, aspect, edgePinned);

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

      const colour = colourOf(
        [u, v],
        [positions[n * 3], positions[n * 3 + 1], positions[n * 3 + 2]]
      );
      back.set(colour.back, n * 3);
      front.set(colour.front, n * 3);
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

// debugWireframe draws the render mesh's triangle edges (both triangles of
// every live quad, so one diagonal per cell); an edge shows where the cloth
// is opaque at both ends. Nodes are the render vertices, in scene units.
export function buildGhostLattice(settled, p, { aspect, images, threshold }) {
  const { topology } = settled;
  const { edgePinned, meshIdx, quadDead, segmentsX, segmentsY } = topology;
  const grid = renderGrid(settled);
  const colourOf = createGhostColour(p, images, aspect);
  const shown = new Uint8Array(segmentsX * segmentsY);
  const colors = new Float64Array(segmentsX * segmentsY * 3);
  for (let gy = 0; gy < segmentsY; gy += 1) {
    for (let gx = 0; gx < segmentsX; gx += 1) {
      const m = meshIdx(gx, gy);
      const u = (gx + 0.5) / segmentsX;
      const v = 1 - (gy + 0.5) / segmentsY;
      const opacity = grid.opacity[m] * pixelOpacity(p, edgePinned, u, v);
      shown[m] = !quadDead[m] && opacity >= threshold ? 1 : 0;
      colors.set(
        colourOf([u, v], Array.from(grid.positions.slice(m * 3, m * 3 + 3)))
          .back,
        m * 3
      );
    }
  }
  const edges = new Set();
  const add = (a, b) => {
    if (shown[a] && shown[b]) edges.add(Math.min(a, b) * 1e6 + Math.max(a, b));
  };
  for (let x = 1; x < segmentsX; x += 1) {
    for (let y = 1; y < segmentsY; y += 1) {
      const q00 = meshIdx(x, y);
      const q10 = meshIdx(x - 1, y);
      const q11 = meshIdx(x - 1, y - 1);
      const q01 = meshIdx(x, y - 1);
      if (topology.triangleAlive(q00, q10, q11)) {
        add(q00, q10);
        add(q10, q11);
        add(q11, q00);
      }
      if (topology.triangleAlive(q00, q11, q01)) {
        add(q00, q11);
        add(q11, q01);
        add(q01, q00);
      }
    }
  }
  return {
    colors,
    edges: Uint32Array.from(
      [...edges].flatMap((key) => [Math.floor(key / 1e6), key % 1e6])
    ),
    nodes: grid.positions,
  };
}
