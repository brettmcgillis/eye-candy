import {
  buildClothTopology,
  computeClothAlpha,
  fbm2D,
} from '@elements/WebGPU/cloth/clothTopology';
import { CUTOUTS } from '@elements/WebGPU/ghost/ghostRig';

// Vertices outside the cloth circle never move from the flat rest disk; a
// line sampled near the hem would interpolate toward them. Each takes the
// mean of its settled neighbours instead, ring by ring outward.
function fillOutside(settled, { idAt, segmentsX, segmentsY, shapeDistArr }) {
  const positions = settled.slice();
  const known = Uint8Array.from(shapeDistArr, (d) => (d >= 0 ? 1 : 0));
  let pending = known.length - known.reduce((sum, k) => sum + k, 0);
  while (pending > 0) {
    const next = known.slice();
    for (let x = 0; x <= segmentsX; x += 1) {
      for (let y = 0; y <= segmentsY; y += 1) {
        const id = idAt(x, y);
        if (!known[id]) {
          const sum = [0, 0, 0];
          let n = 0;
          [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx > segmentsX || ny > segmentsY) return;
            const other = idAt(nx, ny);
            if (!known[other]) return;
            n += 1;
            for (let c = 0; c < 3; c += 1) sum[c] += positions[other * 3 + c];
          });
          if (n > 0) {
            for (let c = 0; c < 3; c += 1) positions[id * 3 + c] = sum[c] / n;
            next[id] = 1;
            pending -= 1;
          }
        }
      }
    }
    known.set(next);
  }
  return positions;
}

// The sphere round the visible cloth, for framing a settled drape.
export function latticeBounds({ alpha, positions, shapeDist }) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < shapeDist.length; i += 1) {
    if (shapeDist[i] >= 0 && alpha[i] >= 0.5) {
      for (let c = 0; c < 3; c += 1) {
        min[c] = Math.min(min[c], positions[i * 3 + c]);
        max[c] = Math.max(max[c], positions[i * 3 + c]);
      }
    }
  }
  if (min[0] === Infinity) return null;
  const center = min.map((v, c) => (v + max[c]) / 2);
  let radius = 0;
  for (let i = 0; i < shapeDist.length; i += 1) {
    if (shapeDist[i] >= 0 && alpha[i] >= 0.5) {
      radius = Math.max(
        radius,
        Math.hypot(
          positions[i * 3] - center[0],
          positions[i * 3 + 1] - center[1],
          positions[i * 3 + 2] - center[2]
        )
      );
    }
  }
  return { center, radius };
}

// createClothSimulation's noise texture, baked the same way: in smoothEdges
// mode the shader cuts holes and tatters per pixel from it.
const NOISE_SIZE = 256;
function noiseTable(scale, seed) {
  const table = new Float32Array(NOISE_SIZE * NOISE_SIZE);
  for (let ty = 0; ty < NOISE_SIZE; ty += 1) {
    const v = ty / (NOISE_SIZE - 1);
    for (let tx = 0; tx < NOISE_SIZE; tx += 1) {
      table[ty * NOISE_SIZE + tx] = fbm2D(
        (tx / (NOISE_SIZE - 1)) * scale,
        v * scale,
        seed
      );
    }
  }
  return { size: NOISE_SIZE, table };
}

// The plot's view of a settled ghost: the sim's positions (read back from the
// GPU, in the cloth mesh's space) carried into world space by the mesh's
// matrix, with the alpha and shape the shader cuts the cloth by.
export default function ghostLattice({ local, matrixWorld, skin }) {
  const segments = skin.clothSegments;
  const topology = buildClothTopology({
    centered: true,
    height: skin.clothHeight ?? 1,
    orientation: 'horizontal',
    segmentsX: segments,
    segmentsY: segments,
    shape: 'circle',
    width: skin.clothWidth ?? 1,
  });
  const { render } = computeClothAlpha(topology, {
    edgeFade: skin.edgeFade,
    holeAmount: skin.holeAmount,
    scale: skin.alphaScale,
    seed: skin.alphaSeed,
    smoothEdges: skin.smoothEdges,
    tatterEdge: skin.tatterEdge,
  });

  const { vCount } = topology;
  const stride = local.length >= vCount * 4 ? 4 : 3;
  const m = matrixWorld;
  const positions = new Float32Array(vCount * 3);
  for (let i = 0; i < vCount; i += 1) {
    const x = local[i * stride];
    const y = local[i * stride + 1];
    const z = local[i * stride + 2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    positions[i * 3] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    positions[i * 3 + 1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    positions[i * 3 + 2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  }

  return {
    alpha: render,
    cutouts: CUTOUTS,
    positions: fillOutside(positions, topology),
    segmentsX: segments,
    segmentsY: segments,
    shapeDist: topology.shapeDistArr,
    tear:
      skin.smoothEdges && (skin.holeAmount > 0 || skin.tatterEdge > 0)
        ? {
            holeAmount: skin.holeAmount,
            noise: noiseTable(skin.alphaScale, skin.alphaSeed),
            pinned: topology.edgePinned,
            tatterEdge: skin.tatterEdge,
          }
        : null,
  };
}
