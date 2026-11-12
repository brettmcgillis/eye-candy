import * as THREE from 'three/webgpu';

// The box every trail (and its widest smoke) fits in, in the volume's space.
// `cell` is the guide's voxel edge, `margin` how far past a trail it reaches.
export function plumeBounds(plumes, { cell = 0.45, margin = 4 } = {}) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  plumes.forEach(({ path }) =>
    path.forEach((p) =>
      p.forEach((v, k) => {
        min[k] = Math.min(min[k], v - margin);
        max[k] = Math.max(max[k], v + margin);
      })
    )
  );
  const size = max.map((v, k) => v - min[k]);
  const grid = size.map((v) => Math.ceil(v / cell));
  return { cell, grid, min, size };
}

function arcLengths(path, span = 1) {
  const lengths = [0];
  for (let i = 1; i < path.length; i += 1) {
    const [ax, ay, az] = path[i - 1];
    const [bx, by, bz] = path[i];
    lengths.push(lengths[i - 1] + Math.hypot(bx - ax, by - ay, bz - az));
  }
  const total = lengths[lengths.length - 1];
  return lengths.map((v) => (v / total) * span);
}

// Every trail's points as (x, y, z, how far along), then its width and
// billow offset, one trail per row, for the exact distance the shader
// measures near a trail. Every path must have `pathSamples` points. A trail
// with `span` < 1 stops that far along: a short one that ends inside a
// longer one shares its width and heat where they meet.
export function plumePointsTexture(plumes, pathSamples) {
  const width = pathSamples + 1;
  const data = new Float32Array(width * plumes.length * 4);
  plumes.forEach(({ path, salt, scale, span }, row) => {
    const along = arcLengths(path, span);
    path.forEach(([x, y, z], i) => {
      data.set([x, y, z, along[i]], (row * width + i) * 4);
    });
    data.set([scale, ...salt], (row * width + pathSamples) * 4);
  });
  const tex = new THREE.DataTexture(data, width, plumes.length);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.FloatType;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

function segments(plume, index) {
  const { path, scale, span } = plume;
  const along = arcLengths(path, span);
  return path.slice(1).map((b, i) => {
    const a = path[i];
    const d = b.map((v, k) => v - a[k]);
    const len = Math.hypot(...d) || 1e-6;
    return {
      a,
      d,
      id: index * (path.length - 1) + i,
      len2: len * len,
      s0: along[i],
      s1: along[i + 1],
      scale,
    };
  });
}

// Per voxel of the box, for the nearest enabled trail: distance to it over
// the trail's width and how far along it (both filtered, for skipping empty
// air and for shadow taps), and its nearest segment's index (read unfiltered,
// so the shader can measure the exact distance to it and its neighbours),
// and the same for the nearest other trail (-1 when only one is on).
export default function bakePlumeGuide(plumes, enabled, bounds) {
  const { cell, grid, min } = bounds;
  const [nx, ny, nz] = grid;
  const segsPerPlume = plumes[0].path.length - 1;
  const trailDist = new Float64Array(plumes.length);
  const trailId = new Float64Array(plumes.length);
  const trailS = new Float64Array(plumes.length);
  const segs = plumes.flatMap((plume, i) =>
    enabled[i] ? segments(plume, i) : []
  );
  const S = new Float64Array(segs.length * 11);
  segs.forEach((seg, n) => {
    S.set(
      [
        ...seg.a,
        ...seg.d,
        1 / seg.len2,
        seg.s0,
        seg.s1 - seg.s0,
        1 / seg.scale,
        seg.id,
      ],
      n * 11
    );
  });
  const data = new Uint16Array(nx * ny * nz * 4);
  const half = THREE.DataUtils.toHalfFloat;
  let o = 0;
  for (let k = 0; k < nz; k += 1) {
    const z = min[2] + (k + 0.5) * cell;
    for (let j = 0; j < ny; j += 1) {
      const y = min[1] + (j + 0.5) * cell;
      for (let i = 0; i < nx; i += 1, o += 4) {
        const x = min[0] + (i + 0.5) * cell;
        trailDist.fill(1e3);
        for (let m = 0; m < S.length; m += 11) {
          const px = x - S[m];
          const py = y - S[m + 1];
          const pz = z - S[m + 2];
          const h = Math.min(
            1,
            Math.max(
              0,
              (px * S[m + 3] + py * S[m + 4] + pz * S[m + 5]) * S[m + 6]
            )
          );
          const ex = px - S[m + 3] * h;
          const ey = py - S[m + 4] * h;
          const ez = pz - S[m + 5] * h;
          const dist = Math.sqrt(ex * ex + ey * ey + ez * ez) * S[m + 9];
          const trail = Math.floor(S[m + 10] / segsPerPlume);
          if (dist < trailDist[trail]) {
            trailDist[trail] = dist;
            trailId[trail] = S[m + 10];
            trailS[trail] = S[m + 7] + S[m + 8] * h;
          }
        }
        let first = -1;
        let second = -1;
        trailDist.forEach((dist, trail) => {
          if (dist >= 1e3) return;
          if (first < 0 || dist < trailDist[first]) {
            second = first;
            first = trail;
          } else if (second < 0 || dist < trailDist[second]) {
            second = trail;
          }
        });
        const best = first < 0 ? 1e3 : trailDist[first];
        const s = first < 0 ? 1 : trailS[first];
        const nearest = first < 0 ? -1 : trailId[first];
        const secondId =
          second < 0 || trailDist[second] - best > 2 ? -1 : trailId[second];
        data[o] = half(best);
        data[o + 1] = half(s);
        data[o + 2] = half(nearest);
        data[o + 3] = half(secondId);
      }
    }
  }
  const texture = new THREE.Data3DTexture(data, nx, ny, nz);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.HalfFloatType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
