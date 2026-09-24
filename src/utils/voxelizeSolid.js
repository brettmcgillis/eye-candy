/* eslint-disable no-param-reassign */
// Solid voxelisation of a mesh that need not be watertight: whatever a flood
// from the grid border cannot reach, once gaps under 2*closing are sealed.

function edt1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q += 1) {
    let s;
    for (;;) {
      const p = v[k];
      s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
      if (s > z[k] || k === 0) break;
      k -= 1;
    }
    if (s <= z[k]) {
      v[0] = q;
      z[0] = -Infinity;
      z[1] = Infinity;
      k = 0;
    } else {
      k += 1;
      v[k] = q;
      z[k] = s;
      z[k + 1] = Infinity;
    }
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    const p = v[k];
    d[q] = (q - p) * (q - p) + f[p];
  }
}

// Squared Euclidean distance (in voxels) to the nearest set voxel.
export function distanceToSet(set, [nx, ny, nz]) {
  const big = 1e20;
  const dist = new Float32Array(set.length);
  for (let i = 0; i < set.length; i += 1) dist[i] = set[i] ? 0 : big;
  const n = Math.max(nx, ny, nz);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const axes = [
    [nx, 1, [ny, nx], [nz, nx * ny]],
    [ny, nx, [nx, 1], [nz, nx * ny]],
    [nz, nx * ny, [nx, 1], [ny, nx]],
  ];

  axes.forEach(([len, stride, [a, sa], [b, sb]]) => {
    for (let j = 0; j < b; j += 1) {
      for (let i = 0; i < a; i += 1) {
        const base = i * sa + j * sb;
        for (let q = 0; q < len; q += 1) f[q] = dist[base + q * stride];
        edt1d(f, len, d, v, z);
        for (let q = 0; q < len; q += 1) dist[base + q * stride] = d[q];
      }
    }
  });
  return dist;
}

function rasterise(position, index, origin, voxelSize, dims) {
  const [nx, ny, nz] = dims;
  const surface = new Uint8Array(nx * ny * nz);
  const mark = (x, y, z) => {
    const i = Math.floor((x - origin[0]) / voxelSize);
    const j = Math.floor((y - origin[1]) / voxelSize);
    const k = Math.floor((z - origin[2]) / voxelSize);
    if (i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz) {
      surface[i + j * nx + k * nx * ny] = 1;
    }
  };
  const p = (v, c) => position[v * 3 + c];

  for (let t = 0; t < index.length; t += 3) {
    const [a, b, c] = [index[t], index[t + 1], index[t + 2]];
    const span = Math.max(
      Math.hypot(p(b, 0) - p(a, 0), p(b, 1) - p(a, 1), p(b, 2) - p(a, 2)),
      Math.hypot(p(c, 0) - p(a, 0), p(c, 1) - p(a, 1), p(c, 2) - p(a, 2)),
      Math.hypot(p(c, 0) - p(b, 0), p(c, 1) - p(b, 1), p(c, 2) - p(b, 2))
    );
    const steps = Math.max(1, Math.ceil((span / voxelSize) * 2));
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps - i; j += 1) {
        const u = i / steps;
        const w = j / steps;
        const s = 1 - u - w;
        mark(
          p(a, 0) * s + p(b, 0) * u + p(c, 0) * w,
          p(a, 1) * s + p(b, 1) * u + p(c, 1) * w,
          p(a, 2) * s + p(b, 2) * u + p(c, 2) * w
        );
      }
    }
  }
  return surface;
}

function flood(blocked, [nx, ny, nz]) {
  const outside = new Uint8Array(blocked.length);
  const stack = [];
  const push = (i) => {
    if (!blocked[i] && !outside[i]) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        if (!x || !y || !z || x === nx - 1 || y === ny - 1 || z === nz - 1) {
          push(x + y * nx + z * nx * ny);
        }
      }
    }
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % nx;
    const y = Math.floor(i / nx) % ny;
    const z = Math.floor(i / (nx * ny));
    if (x > 0) push(i - 1);
    if (x < nx - 1) push(i + 1);
    if (y > 0) push(i - nx);
    if (y < ny - 1) push(i + nx);
    if (z > 0) push(i - nx * ny);
    if (z < nz - 1) push(i + nx * ny);
  }
  return outside;
}

function closedOutside(surface, toSurface, dims, radius) {
  const blocked = toSurface.map((d) => (d <= radius * radius ? 1 : 0));
  const toOutside = distanceToSet(flood(blocked, dims), dims);
  return toOutside.map((d, i) => (d <= radius * radius && !surface[i] ? 1 : 0));
}

function largestComponent(mask, [nx, ny, nz]) {
  const label = new Int32Array(mask.length);
  let best = 0;
  let bestSize = 0;
  let next = 0;
  for (let seed = 0; seed < mask.length; seed += 1) {
    if (mask[seed] && !label[seed]) {
      next += 1;
      let size = 0;
      const stack = [seed];
      label[seed] = next;
      while (stack.length) {
        const i = stack.pop();
        size += 1;
        const x = i % nx;
        const y = Math.floor(i / nx) % ny;
        const z = Math.floor(i / (nx * ny));
        const around = [
          x > 0 && i - 1,
          x < nx - 1 && i + 1,
          y > 0 && i - nx,
          y < ny - 1 && i + nx,
          z > 0 && i - nx * ny,
          z < nz - 1 && i + nx * ny,
        ];
        const id = next;
        around.forEach((n) => {
          if (n !== false && mask[n] && !label[n]) {
            label[n] = id;
            stack.push(n);
          }
        });
      }
      if (size > bestSize) {
        bestSize = size;
        best = next;
      }
    }
  }
  return label.map((l) => (l === best && best ? 1 : 0));
}

// `closing` seals only small gaps, so sockets and apertures stay open.
// `cavity` is the largest space a heavier `cavityClosing` seal would enclose,
// such as a cranium behind its foramen.
export default function voxelizeSolid({
  cavityClosing = 0,
  closing = 2,
  index,
  padding = 2,
  position,
  voxelSize,
}) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < position.length; i += 3) {
    for (let k = 0; k < 3; k += 1) {
      min[k] = Math.min(min[k], position[i + k]);
      max[k] = Math.max(max[k], position[i + k]);
    }
  }
  const pad = padding + Math.max(closing, cavityClosing);
  const origin = min.map((m) => m - pad * voxelSize);
  const dims = [0, 1, 2].map(
    (k) => Math.ceil((max[k] - min[k]) / voxelSize) + pad * 2
  );

  const surface = rasterise(position, index, origin, voxelSize, dims);
  const toSurface = distanceToSet(surface, dims);
  const outside = closedOutside(surface, toSurface, dims, closing);
  const solid = outside.map((o) => 1 - o);

  let cavity = null;
  if (cavityClosing > closing) {
    const sealed = closedOutside(surface, toSurface, dims, cavityClosing);
    cavity = largestComponent(
      outside.map((o, i) => (o && !sealed[i] ? 1 : 0)),
      dims
    );
  }

  return { cavity, dims, origin, solid, voxelSize };
}
