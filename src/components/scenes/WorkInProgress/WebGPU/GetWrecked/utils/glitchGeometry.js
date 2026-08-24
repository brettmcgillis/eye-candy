// CPU-side translation of Mark Klink's raw-.obj text corruption techniques
// (srcxor.org "3D Glitch Notes") into index permutations baked as
// BufferAttributes. Nothing here mutates the index buffer, so topology stays
// valid — the same visual outcome as Klink's "faces referencing the wrong
// vertex" without ever producing a degenerate triangle.
//
// Geometry-agnostic: takes any indexed BufferGeometry with position/uv
// attributes, so the same pipeline can be pointed at a different model later.
import * as THREE from 'three/webgpu';

/* eslint-disable no-bitwise */
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* eslint-enable no-bitwise */

function identityOrder(count) {
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i += 1) order[i] = i;
  return order;
}

// "Cut and paste" — chunks the vertex index list into blocks and shuffles
// block order (seeded), the geometric analog of cutting a run of `v` lines
// and pasting it elsewhere in the file.
function cutPastePermutation(count, { blockSize, shift, seed }) {
  const blockCount = Math.max(1, Math.ceil(count / blockSize));
  const random = mulberry32(seed);
  const blockOrder = identityOrder(blockCount);

  for (let i = blockCount - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = blockOrder[i];
    blockOrder[i] = blockOrder[j];
    blockOrder[j] = tmp;
  }

  const permuted = new Uint32Array(count);
  let cursor = 0;
  for (let b = 0; b < blockCount; b += 1) {
    const sourceBlock = blockOrder[(b + shift) % blockCount];
    const start = sourceBlock * blockSize;
    const end = Math.min(start + blockSize, count);
    for (let i = start; i < end && cursor < count; i += 1) {
      permuted[cursor] = i;
      cursor += 1;
    }
  }
  return permuted;
}

// Distance-sort "hopscotch" — sort vertices by distance from `origin`, then
// circularly shift the sorted list by `stride` before mapping back to
// original index order. Vertices close together in space read each other's
// data from far apart in the sorted rank, producing the alternating
// peaks/valleys Klink's cursor-distance sort technique creates.
function hopscotchPermutation(positionArray, count, { origin, stride }) {
  const [ox, oy, oz] = origin;
  const sorted = Array.from(identityOrder(count)).sort((a, b) => {
    const ax = positionArray[a * 3] - ox;
    const ay = positionArray[a * 3 + 1] - oy;
    const az = positionArray[a * 3 + 2] - oz;
    const bx = positionArray[b * 3] - ox;
    const by = positionArray[b * 3 + 1] - oy;
    const bz = positionArray[b * 3 + 2] - oz;
    return ax * ax + ay * ay + az * az - (bx * bx + by * by + bz * bz);
  });

  const permuted = new Uint32Array(count);
  for (let rank = 0; rank < count; rank += 1) {
    const shiftedRank = (rank + stride) % count;
    permuted[sorted[rank]] = sorted[shiftedRank];
  }
  return permuted;
}

// Named handles into a geometry's bounding box, so Leva can offer a "Center /
// Front / Rear / Top" dropdown instead of asking for raw local-space XYZ.
export function resolveNamedOrigin(geometry, name) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const center = [
    (min.x + max.x) / 2,
    (min.y + max.y) / 2,
    (min.z + max.z) / 2,
  ];

  switch (name) {
    case 'front':
      return [max.x, center[1], center[2]];
    case 'rear':
      return [min.x, center[1], center[2]];
    case 'top':
      return [center[0], max.y, center[2]];
    case 'center':
    default:
      return center;
  }
}

// Named local axis -> the numeric index buildAxisSweep's uniform expects
// (see glitchMaterial.js) — keeps Leva's x/y/z dropdown out of the shader.
const AXIS_INDEX = { x: 0, y: 1, z: 2 };
export function resolveAxisIndex(name) {
  return AXIS_INDEX[name] ?? 1;
}

// Cut & Paste and Hopscotch are independent corruption layers, each sourced
// from the original geometry and each gated by its own per-vertex mask —
// rather than one composed permutation with a single on/off switch, so each
// technique gets its own "how many vertices" density dial (applied on the
// GPU, see glitchMaterial.js) instead of always touching every vertex.
export function buildGlitchAttributes(geometry, options) {
  const { seed, cutPaste, hopscotch, uvGlitch } = options;
  const { position, uv } = geometry.attributes;
  const { count } = position;

  const cutPasteOrder = cutPaste.enabled
    ? cutPastePermutation(count, {
        blockSize: cutPaste.blockSize,
        shift: cutPaste.shift,
        seed,
      })
    : identityOrder(count);

  const hopscotchOrder = hopscotch.enabled
    ? hopscotchPermutation(position.array, count, {
        origin: hopscotch.origin,
        stride: hopscotch.stride,
      })
    : identityOrder(count);

  const uvOrder = uvGlitch.enabled
    ? cutPastePermutation(count, {
        blockSize: uvGlitch.blockSize,
        shift: uvGlitch.shift,
        seed: seed + 1,
      })
    : identityOrder(count);

  const cutPasteTargetPosition = new Float32Array(count * 3);
  const hopscotchTargetPosition = new Float32Array(count * 3);
  const targetUv = new Float32Array(count * 2);
  // Packed as one vec4 (x=find&replace random, y=cut&paste mask,
  // z=hopscotch mask, w=reserved) rather than four separate attributes —
  // WebGPU caps a render pipeline at 8 vertex buffers total, and the car's
  // GLTF (position/normal/tangent/uv) already uses 4 of those, leaving very
  // little room for one-attribute-per-value. `w` is spare for a future
  // single-scalar mask (e.g. a partial-wireframe reveal) without needing a
  // 9th buffer; a second future mask would need the storage-buffer pattern
  // instead (see Surrender/ClothLeaves for the precedent).
  const glitchMasks = new Float32Array(count * 4);

  // Independently seeded per-vertex hashes — sharing one hash across
  // techniques would always mask the same "first N%" of vertices whenever
  // multiple techniques are active together.
  const nextFindReplaceRandom = mulberry32(seed + 2);
  const nextCutPasteRandom = mulberry32(seed + 3);
  const nextHopscotchRandom = mulberry32(seed + 4);

  for (let i = 0; i < count; i += 1) {
    const cutPasteSource = cutPasteOrder[i];
    cutPasteTargetPosition[i * 3] = position.array[cutPasteSource * 3];
    cutPasteTargetPosition[i * 3 + 1] = position.array[cutPasteSource * 3 + 1];
    cutPasteTargetPosition[i * 3 + 2] = position.array[cutPasteSource * 3 + 2];

    const hopscotchSource = hopscotchOrder[i];
    hopscotchTargetPosition[i * 3] = position.array[hopscotchSource * 3];
    hopscotchTargetPosition[i * 3 + 1] =
      position.array[hopscotchSource * 3 + 1];
    hopscotchTargetPosition[i * 3 + 2] =
      position.array[hopscotchSource * 3 + 2];

    const uvSourceIndex = uvOrder[i];
    targetUv[i * 2] = uv.array[uvSourceIndex * 2];
    targetUv[i * 2 + 1] = uv.array[uvSourceIndex * 2 + 1];

    glitchMasks[i * 4] = nextFindReplaceRandom();
    glitchMasks[i * 4 + 1] = nextCutPasteRandom();
    glitchMasks[i * 4 + 2] = nextHopscotchRandom();
  }

  return {
    cutPasteTargetPosition,
    glitchMasks,
    hopscotchTargetPosition,
    targetUv,
  };
}

export function applyGlitchAttributes(geometry, attributes) {
  geometry.setAttribute(
    'glitchCutPasteTargetPosition',
    new THREE.Float32BufferAttribute(attributes.cutPasteTargetPosition, 3)
  );
  geometry.setAttribute(
    'glitchHopscotchTargetPosition',
    new THREE.Float32BufferAttribute(attributes.hopscotchTargetPosition, 3)
  );
  geometry.setAttribute(
    'glitchTargetUv',
    new THREE.Float32BufferAttribute(attributes.targetUv, 2)
  );
  geometry.setAttribute(
    'glitchMasks',
    new THREE.Float32BufferAttribute(attributes.glitchMasks, 4)
  );
}
