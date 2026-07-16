import * as THREE from 'three/webgpu';

// Binary greedy meshing over a dense k^3 occupancy grid, grouped by state (1/2/3)
// so a merged quad is always a single flat color — no cross-state blending to
// reason about. CPU-side, run ONCE per regenerate on a full readback of the
// resolved (post-growth) stateRevealBuf — see VoxelField.jsx for why this only
// ever runs on the settled structure, never during the growth-reveal animation
// or in continuous CA mode.
//
// Known, deliberate simplifications vs. the InstancedMesh/growth-reveal path:
// - Always renders flush at `cellSpacing` (merged quads assume touching faces);
//   `cellScale` gaps between individual cubes aren't representable once faces
//   are merged.
// - Colors by state only — palette's height/age/distance-from-core color modes
//   aren't ported to this CPU path.
//
// Standard "binary greedy meshing" (Mikola Lysenko / 0fps.net), adapted to
// mask-by-state instead of mask-by-boolean so faces only merge within the same
// state.

function stateAt(states, k, x, y, z) {
  if (x < 0 || y < 0 || z < 0 || x >= k || y >= k || z >= k) return 0;
  return states[x + k * (y + k * z)];
}

// One face direction: axis 0/1/2 = x/y/z, dir +1/-1 = which side of the cell.
function meshDirection({ states, k, axis, dir, emit }) {
  const u = (axis + 1) % 3;
  const v = (axis + 2) % 3;
  const mask = new Int32Array(k * k);
  const pos = [0, 0, 0];
  const neighborPos = [0, 0, 0];

  for (let a = 0; a < k; a += 1) {
    let n = 0;
    for (let j = 0; j < k; j += 1) {
      for (let i = 0; i < k; i += 1, n += 1) {
        pos[axis] = a;
        pos[u] = i;
        pos[v] = j;
        const state = stateAt(states, k, pos[0], pos[1], pos[2]);
        if (state === 0) {
          mask[n] = 0;
        } else {
          [neighborPos[0], neighborPos[1], neighborPos[2]] = pos;
          neighborPos[axis] += dir;
          const neighborState = stateAt(
            states,
            k,
            neighborPos[0],
            neighborPos[1],
            neighborPos[2]
          );
          mask[n] = neighborState === 0 ? state : 0;
        }
      }
    }

    n = 0;
    for (let j = 0; j < k; j += 1) {
      for (let i = 0; i < k; ) {
        const state = mask[n];
        if (state === 0) {
          i += 1;
          n += 1;
        } else {
          let width = 1;
          while (i + width < k && mask[n + width] === state) {
            width += 1;
          }

          let height = 1;
          let blocked = false;
          while (!blocked && j + height < k) {
            for (let w = 0; w < width; w += 1) {
              if (mask[n + w + height * k] !== state) {
                blocked = true;
                break;
              }
            }
            if (!blocked) height += 1;
          }

          pos[axis] = a + (dir > 0 ? 1 : 0);
          pos[u] = i;
          pos[v] = j;
          const du = [0, 0, 0];
          du[u] = width;
          const dv = [0, 0, 0];
          dv[v] = height;
          emit({
            origin: [pos[0], pos[1], pos[2]],
            du,
            dv,
            axis,
            dir,
            state,
          });

          for (let hh = 0; hh < height; hh += 1) {
            for (let ww = 0; ww < width; ww += 1) {
              mask[n + ww + hh * k] = 0;
            }
          }

          i += width;
          n += width;
        }
      }
    }
  }
}

export default function buildGreedyMeshGeometry({
  states,
  k,
  cellSpacing,
  paletteColors,
}) {
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];

  const half = (k - 1) * 0.5;
  const toWorld = (gx, gy, gz) => [
    (gx - half - 0.5) * cellSpacing,
    (gy - half - 0.5) * cellSpacing,
    (gz - half - 0.5) * cellSpacing,
  ];

  function emit({ origin, du, dv, axis, dir, state }) {
    const normal = [0, 0, 0];
    normal[axis] = dir;

    const p00 = toWorld(origin[0], origin[1], origin[2]);
    const p10 = toWorld(
      origin[0] + du[0],
      origin[1] + du[1],
      origin[2] + du[2]
    );
    const p11 = toWorld(
      origin[0] + du[0] + dv[0],
      origin[1] + du[1] + dv[1],
      origin[2] + du[2] + dv[2]
    );
    const p01 = toWorld(
      origin[0] + dv[0],
      origin[1] + dv[1],
      origin[2] + dv[2]
    );

    const color = paletteColors[state] ?? paletteColors[1];
    const baseIndex = positions.length / 3;
    // Winding kept consistent per `dir`; the material renders DoubleSide (see
    // VoxelField.jsx) as a safety margin in case this isn't quite right for
    // every axis/direction combo — revisit once confirmed live, since
    // FrontSide-only halves the fragment cost.
    const quad = dir > 0 ? [p00, p10, p11, p01] : [p00, p01, p11, p10];

    quad.forEach((p) => {
      positions.push(p[0], p[1], p[2]);
      normals.push(normal[0], normal[1], normal[2]);
      colors.push(color.r, color.g, color.b);
    });

    indices.push(
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex,
      baseIndex + 2,
      baseIndex + 3
    );
  }

  for (let axis = 0; axis < 3; axis += 1) {
    meshDirection({ states, k, axis, dir: 1, emit });
    meshDirection({ states, k, axis, dir: -1, emit });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);

  return geometry;
}
