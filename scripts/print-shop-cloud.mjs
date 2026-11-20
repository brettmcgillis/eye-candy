#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies, no-bitwise */
// Bakes stylized_cloud_2.glb into a watertight mesh for the ghost printable's
// storm cloud. The model is 461k triangles of unwelded, interpenetrating puffs
// on a flat base, which no boolean can take, so it is not used as a solid:
// its outer surface is rebuilt from a signed distance field instead.
//
//   1. every triangle goes into a voxel grid; each voxel near the surface gets
//      its exact distance to the nearest triangle;
//   2. the outside is flood-filled from the grid's edge, through everything
//      farther than a voxel from a triangle, so hidden interior surfaces and
//      cracks do not matter and the sign never depends on triangle winding;
//   3. a voxel too close to the surface to be flooded takes its sign from
//      which side of the nearest triangle it is on;
//   4. Manifold's level set meshes that field (trilinear between voxels, so
//      the surface sits where the triangles are, not on voxel steps), cut flat
//      at the base plane.
//
//   node scripts/print-shop-cloud.mjs
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';

import draco3d from 'draco3dgltf';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { REPO_ROOT } from './lib/loadModules.mjs';
import { printEnv } from './lib/printShop.mjs';

const SOURCE = 'public/models/stylized_cloud_2.glb';
const OUT = 'src/dev/tools/printShop/printables/ghost/cloud-mesh.json';
// Model units: the cloud is 217 wide, 143 deep and 103 tall, base flat at 0.
const VOXEL = 0.8;
const EDGE = 1.3;
const SIMPLIFY = 0.12;
const X0 = -112;
const Y0 = -1.6;
const Z0 = -76;
const NX = Math.ceil(224 / VOXEL);
const NY = Math.ceil(108.6 / VOXEL);
const NZ = Math.ceil(152 / VOXEL);
const FAR = 3 * VOXEL;
const BARRIER = 1.25 * VOXEL;

// The nodes rotate the model -90° about X: (x, y, z) → (x, z, -y).
const upright = (x, y, z) => [x, z, -y];

async function readTriangles() {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });
  const doc = await io.read(path.join(REPO_ROOT, SOURCE));
  const list = [];
  doc
    .getRoot()
    .listMeshes()
    .forEach((mesh) => {
      mesh.listPrimitives().forEach((prim) => {
        const position = prim.getAttribute('POSITION');
        const index = prim.getIndices()?.getArray();
        const count = index ? index.length : position.getCount();
        const at = (n) => {
          const [x, y, z] = position.getElement(
            index ? index[n] : n,
            [0, 0, 0]
          );
          return upright(x, y, z);
        };
        for (let t = 0; t < count; t += 3) {
          list.push(...at(t), ...at(t + 1), ...at(t + 2));
        }
      });
    });
  return Float32Array.from(list);
}

const cell = (value, origin) => Math.floor((value - origin) / VOXEL);
const at = (i, j, k) => (k * NY + j) * NX + i;
const inside = (i, j, k) =>
  i >= 0 && j >= 0 && k >= 0 && i < NX && j < NY && k < NZ;

// Ericson, Real-Time Collision Detection: closest point on a triangle.
const closest = new Float64Array(3);
function nearestOnTriangle(tri, o, px, py, pz) {
  const [ax, ay, az, bx, by, bz, cx, cy, cz] = [
    tri[o],
    tri[o + 1],
    tri[o + 2],
    tri[o + 3],
    tri[o + 4],
    tri[o + 5],
    tri[o + 6],
    tri[o + 7],
    tri[o + 8],
  ];
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const acx = cx - ax;
  const acy = cy - ay;
  const acz = cz - az;
  const apx = px - ax;
  const apy = py - ay;
  const apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz;
  const d2 = acx * apx + acy * apy + acz * apz;
  const set = (x, y, z) => {
    closest[0] = x;
    closest[1] = y;
    closest[2] = z;
  };
  if (d1 <= 0 && d2 <= 0) return set(ax, ay, az);
  const bpx = px - bx;
  const bpy = py - by;
  const bpz = pz - bz;
  const d3 = abx * bpx + aby * bpy + abz * bpz;
  const d4 = acx * bpx + acy * bpy + acz * bpz;
  if (d3 >= 0 && d4 <= d3) return set(bx, by, bz);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3);
    return set(ax + abx * v, ay + aby * v, az + abz * v);
  }
  const cpx = px - cx;
  const cpy = py - cy;
  const cpz = pz - cz;
  const d5 = abx * cpx + aby * cpy + abz * cpz;
  const d6 = acx * cpx + acy * cpy + acz * cpz;
  if (d6 >= 0 && d5 <= d6) return set(cx, cy, cz);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6);
    return set(ax + acx * w, ay + acy * w, az + acz * w);
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return set(bx + (cx - bx) * w, by + (cy - by) * w, bz + (cz - bz) * w);
  }
  const denom = 1 / (va + vb + vc);
  const v = vb * denom;
  const w = vc * denom;
  return set(
    ax + abx * v + acx * w,
    ay + aby * v + acy * w,
    az + abz * v + acz * w
  );
}

// Triangles listed per voxel they touch (CSR). A triangle spanning many
// voxels goes on a short list every voxel also checks.
function binTriangles(tri) {
  const count = tri.length / 9;
  const counts = new Uint32Array(NX * NY * NZ + 1);
  const big = [];
  const span = (t) => {
    const lo = [0, 1, 2].map((a) =>
      Math.min(tri[t * 9 + a], tri[t * 9 + 3 + a], tri[t * 9 + 6 + a])
    );
    const hi = [0, 1, 2].map((a) =>
      Math.max(tri[t * 9 + a], tri[t * 9 + 3 + a], tri[t * 9 + 6 + a])
    );
    return [
      cell(lo[0], X0),
      cell(lo[1], Y0),
      cell(lo[2], Z0),
      cell(hi[0], X0),
      cell(hi[1], Y0),
      cell(hi[2], Z0),
    ];
  };
  const each = (t, visit) => {
    const [i0, j0, k0, i1, j1, k1] = span(t);
    for (let k = Math.max(0, k0); k <= Math.min(NZ - 1, k1); k += 1) {
      for (let j = Math.max(0, j0); j <= Math.min(NY - 1, j1); j += 1) {
        for (let i = Math.max(0, i0); i <= Math.min(NX - 1, i1); i += 1) {
          visit(at(i, j, k));
        }
      }
    }
  };
  for (let t = 0; t < count; t += 1) {
    const [i0, j0, k0, i1, j1, k1] = span(t);
    if ((i1 - i0 + 1) * (j1 - j0 + 1) * (k1 - k0 + 1) > 64) big.push(t);
    else
      each(t, (c) => {
        counts[c + 1] += 1;
      });
  }
  for (let c = 0; c < NX * NY * NZ; c += 1) counts[c + 1] += counts[c];
  const items = new Uint32Array(counts[NX * NY * NZ]);
  const fill = counts.slice(0, NX * NY * NZ);
  const isBig = new Set(big);
  for (let t = 0; t < count; t += 1) {
    if (!isBig.has(t))
      each(t, (c) => {
        items[fill[c]] = t;
        fill[c] += 1;
      });
  }
  return { big, counts, items };
}

async function main() {
  const tri = await readTriangles();
  process.stdout.write(`${tri.length / 9} triangles\n`);
  const bins = binTriangles(tri);
  const total = NX * NY * NZ;

  // Voxels within two of an occupied voxel get an exact distance.
  const want = new Uint8Array(total);
  for (let k = 0; k < NZ; k += 1) {
    for (let j = 0; j < NY; j += 1) {
      for (let i = 0; i < NX; i += 1) {
        const c = at(i, j, k);
        if (bins.counts[c + 1] > bins.counts[c]) {
          for (let dk = -2; dk <= 2; dk += 1) {
            for (let dj = -2; dj <= 2; dj += 1) {
              for (let di = -2; di <= 2; di += 1) {
                if (inside(i + di, j + dj, k + dk))
                  want[at(i + di, j + dj, k + dk)] = 1;
              }
            }
          }
        }
      }
    }
  }
  const sdf = new Float32Array(total).fill(FAR);
  const near = new Float32Array(total * 3);
  const status = new Uint8Array(total);
  const bigNearest = (px, py, pz, best) => {
    let result = best;
    bins.big.forEach((t) => {
      nearestOnTriangle(tri, t * 9, px, py, pz);
      const d = Math.hypot(closest[0] - px, closest[1] - py, closest[2] - pz);
      if (d < result.d) {
        result = { d, x: closest[0], y: closest[1], z: closest[2] };
      }
    });
    return result;
  };
  let computed = 0;
  for (let k = 0; k < NZ; k += 1) {
    for (let j = 0; j < NY; j += 1) {
      for (let i = 0; i < NX; i += 1) {
        const c = at(i, j, k);
        if (want[c]) {
          const px = X0 + (i + 0.5) * VOXEL;
          const py = Y0 + (j + 0.5) * VOXEL;
          const pz = Z0 + (k + 0.5) * VOXEL;
          let best = { d: Infinity, x: 0, y: 0, z: 0 };
          const search = (radius, skip) => {
            for (let dk = -radius; dk <= radius; dk += 1) {
              for (let dj = -radius; dj <= radius; dj += 1) {
                for (let di = -radius; di <= radius; di += 1) {
                  if (
                    Math.max(Math.abs(di), Math.abs(dj), Math.abs(dk)) > skip &&
                    inside(i + di, j + dj, k + dk)
                  ) {
                    const n = at(i + di, j + dj, k + dk);
                    for (
                      let s = bins.counts[n];
                      s < bins.counts[n + 1];
                      s += 1
                    ) {
                      nearestOnTriangle(tri, bins.items[s] * 9, px, py, pz);
                      const d = Math.hypot(
                        closest[0] - px,
                        closest[1] - py,
                        closest[2] - pz
                      );
                      if (d < best.d) {
                        best = {
                          d,
                          x: closest[0],
                          y: closest[1],
                          z: closest[2],
                        };
                      }
                    }
                  }
                }
              }
            }
          };
          search(1, -1);
          if (best.d > 1.5 * VOXEL) search(2, 1);
          best = bigNearest(px, py, pz, best);
          if (best.d < FAR) {
            sdf[c] = best.d;
            near[c * 3] = best.x;
            near[c * 3 + 1] = best.y;
            near[c * 3 + 2] = best.z;
            if (best.d < BARRIER) status[c] = 1;
            computed += 1;
          }
        }
      }
    }
  }
  process.stdout.write(`${computed} voxels measured\n`);

  // The floor: two voxel layers below the base plane, across the whole grid,
  // seal the open underside so the flood cannot get under the puffs.
  const floorTop = Math.floor((0 - Y0) / VOXEL) - 1;
  for (let k = 0; k < NZ; k += 1) {
    for (let j = 0; j <= floorTop; j += 1) {
      for (let i = 0; i < NX; i += 1) status[at(i, j, k)] = 1;
    }
  }

  // Outside: everything the grid's edge reaches without crossing a barrier.
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const push = (i, j, k) => {
    const c = at(i, j, k);
    if (status[c] === 0) {
      status[c] = 2;
      queue[tail] = c;
      tail += 1;
    }
  };
  for (let k = 0; k < NZ; k += 1) {
    for (let j = 0; j < NY; j += 1) {
      for (let i = 0; i < NX; i += 1) {
        if (
          i === 0 ||
          j === 0 ||
          k === 0 ||
          i === NX - 1 ||
          j === NY - 1 ||
          k === NZ - 1
        ) {
          push(i, j, k);
        }
      }
    }
  }
  while (head < tail) {
    const c = queue[head];
    head += 1;
    const i = c % NX;
    const j = Math.floor(c / NX) % NY;
    const k = Math.floor(c / (NX * NY));
    [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ].forEach(([di, dj, dk]) => {
      if (inside(i + di, j + dj, k + dk)) push(i + di, j + dj, k + dk);
    });
  }

  // A crack in the glTF lets the flood into a pit or a thin tunnel. Opening
  // the outside (erode, then grow back within what it was) drops any channel
  // narrower than a few voxels; the real valleys between puffs are wider.
  const OPEN = 2;
  let core = Uint8Array.from(status, (value) => (value === 2 ? 1 : 0));
  const step = (source, wantOn) => {
    const out = new Uint8Array(total);
    for (let c = 0; c < total; c += 1) {
      const i = c % NX;
      const j = Math.floor(c / NX) % NY;
      const k = Math.floor(c / (NX * NY));
      let hit = wantOn ? source[c] === 1 : source[c] === 1;
      [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ].forEach(([di, dj, dk]) => {
        const on = inside(i + di, j + dj, k + dk)
          ? source[at(i + di, j + dj, k + dk)] === 1
          : true;
        if (wantOn ? on : !on) hit = wantOn;
      });
      out[c] = hit ? 1 : 0;
    }
    return out;
  };
  const original = core;
  for (let n = 0; n < OPEN; n += 1) core = step(core, false);
  for (let n = 0; n < OPEN; n += 1) {
    core = step(core, true).map((value, c) => (value && original[c] ? 1 : 0));
  }
  let closed = 0;
  for (let c = 0; c < total; c += 1) {
    if (original[c] && !core[c]) {
      status[c] = 0;
      closed += 1;
    }
  }
  process.stdout.write(`${closed} outside voxels closed\n`);

  // Sign. A flooded voxel is outside, an unreached one inside; one too close
  // to a triangle to be either looks a little way off each side of the nearest
  // point and takes the sign of the side it is on.
  const statusAt = (x, y, z) => {
    const i = cell(x, X0);
    const j = cell(y, Y0);
    const k = cell(z, Z0);
    return inside(i, j, k) ? status[at(i, j, k)] : 2;
  };
  let flipped = 0;
  for (let c = 0; c < total; c += 1) {
    if (want[c] && sdf[c] < FAR) {
      if (status[c] === 0) sdf[c] = -sdf[c];
      else if (status[c] === 1) {
        const i = c % NX;
        const j = Math.floor(c / NX) % NY;
        const k = Math.floor(c / (NX * NY));
        const p = [
          X0 + (i + 0.5) * VOXEL,
          Y0 + (j + 0.5) * VOXEL,
          Z0 + (k + 0.5) * VOXEL,
        ];
        const q = [near[c * 3], near[c * 3 + 1], near[c * 3 + 2]];
        const u = p.map((v, a) => v - q[a]);
        const length = Math.hypot(...u);
        let side = 2;
        if (length > 1e-3 * VOXEL) {
          const probe = (sign) =>
            statusAt(
              ...q.map((v, a) => v + (sign * u[a] * 1.7 * VOXEL) / length)
            );
          side = probe(1);
          if (side === 1) side = probe(-1) === 2 ? 0 : 2;
        }
        if (side === 0) {
          sdf[c] = -sdf[c];
          flipped += 1;
        }
      }
    } else if (status[c] === 0) sdf[c] = -FAR;
  }
  process.stdout.write(`${flipped} surface voxels inside\n`);

  // One [1 2 1] pass along each axis takes the lumps a 1.3-unit lattice would
  // otherwise pick out of the exact field, without moving the surface.
  const blur = (source, stride, length) => {
    const out = new Float32Array(total);
    for (let c = 0; c < total; c += 1) {
      const along = Math.floor(c / stride) % length;
      const lo = along > 0 ? source[c - stride] : source[c];
      const hi = along < length - 1 ? source[c + stride] : source[c];
      out[c] = (lo + 2 * source[c] + hi) / 4;
    }
    return out;
  };
  const smooth = blur(blur(blur(sdf, 1, NX), NX, NY), NX * NY, NZ);
  sdf.set(smooth);

  // Trilinear between voxel centres, cut flat at the base plane.
  const sample = (x, y, z) => {
    const u = (x - X0) / VOXEL - 0.5;
    const v = (y - Y0) / VOXEL - 0.5;
    const w = (z - Z0) / VOXEL - 0.5;
    const i = Math.floor(u);
    const j = Math.floor(v);
    const k = Math.floor(w);
    if (!inside(i, j, k) || !inside(i + 1, j + 1, k + 1)) return FAR;
    const fu = u - i;
    const fv = v - j;
    const fw = w - k;
    const g = (a, b, d) => sdf[at(i + a, j + b, k + d)];
    return (
      ((g(0, 0, 0) * (1 - fu) + g(1, 0, 0) * fu) * (1 - fv) +
        (g(0, 1, 0) * (1 - fu) + g(1, 1, 0) * fu) * fv) *
        (1 - fw) +
      ((g(0, 0, 1) * (1 - fu) + g(1, 0, 1) * fu) * (1 - fv) +
        (g(0, 1, 1) * (1 - fu) + g(1, 1, 1) * fu) * fv) *
        fw
    );
  };
  const wasm = (await printEnv()).manifold;
  // Manifold's level sets are positive inside. One call over the whole box
  // is as fine as 1.3 units before the library runs out of memory; tiling it
  // finer leaves seams where the tiles meet, and the trilinear field puts the
  // surface where the triangles are whatever the mesh spacing.
  let solid = wasm.Manifold.levelSet(
    ([x, y, z]) => Math.min(-sample(x, y, z), y),
    { max: [109, 104, 72], min: [-109, -0.4, -72] },
    EDGE
  );
  // Stray specks (a bit of mesh the flood could not reach) are not cloud.
  const pieces = solid.decompose();
  const biggest = Math.max(...pieces.map((piece) => piece.volume()));
  process.stdout.write(
    `${pieces.length} pieces, volumes ${pieces.map((piece) => piece.volume().toFixed(0)).join(' ')}\n`
  );
  solid = wasm.Manifold.union(
    pieces.filter((piece) => piece.volume() > biggest * 0.02)
  ).simplify(SIMPLIFY);
  const mesh = solid.getMesh();
  const positions = Float32Array.from(
    { length: (mesh.vertProperties.length / mesh.numProp) * 3 },
    (_, n) => mesh.vertProperties[Math.floor(n / 3) * mesh.numProp + (n % 3)]
  );
  const triangles = Uint32Array.from(mesh.triVerts);
  const b64 = (array) =>
    Buffer.from(array.buffer, array.byteOffset, array.byteLength).toString(
      'base64'
    );
  await writeFile(
    path.join(REPO_ROOT, OUT),
    `${JSON.stringify({
      positions: b64(positions),
      triangles: b64(triangles),
      volume: solid.volume(),
    })}\n`
  );
  process.stdout.write(
    `${positions.length / 3} vertices, ${triangles.length / 3} triangles, volume ${solid.volume().toFixed(0)}, genus ${solid.genus()} → ${OUT}\n`
  );
}

main();
