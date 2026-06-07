// Bakes a Three.js scene's meshes into a 2D texture atlas SDF.
//
// WHY 2D ATLAS INSTEAD OF Data3DTexture:
//   Three.js TSL's texture() node strips the Z component of 3D UVs in the
//   WGSL codegen (bug in r182), producing a WGSL compile error.  Packing
//   the N z-slices as tiles in a 2D texture sidesteps this entirely —
//   standard 2D sampling is fully supported.
//
// Atlas layout: TILES_X columns × TILES_Y rows of N×N tiles.
//   e.g. N=48: 8 cols × 6 rows = 48 tiles of 48×48 → 384×288 DataTexture.
//
// Trilinear interpolation is reconstructed in the shader by sampling the two
// neighbouring z-slices and mix()ing between them.
//
// SDF stored in the R channel, 8-bit encoded over [−SDF_BOUNDS, +SDF_BOUNDS].
//   encode: ((d / SDF_BOUNDS) * 0.5 + 0.5) * 255
//   decode: (raw − 0.5) * 2 * SDF_BOUNDS   (raw = tex.r ∈ [0,1])

import * as THREE from 'three/webgpu';
import {
  MeshBVH,
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

// Extend Three.js prototypes once.
if (!THREE.BufferGeometry.prototype.computeBoundsTree) {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

// ─── Constants (shared with createSDFMaterial.js) ───────────────────────────

export const SDF_BOUNDS = 1.4;   // SDF space half-extent
export const SKULL_SCALE = 1.1;  // normalised skull half-size
export const TILES_X     = 8;    // atlas columns (z slices per row)
export const TILES_Y     = 6;    // atlas rows    (TILES_X × TILES_Y ≥ N)

// ─── Internal helpers ────────────────────────────────────────────────────────

function mergeScene(scene) {
  const positions = [];
  const indices   = [];
  let   offset    = 0;
  const tmp       = new THREE.Vector3();

  scene.updateWorldMatrix(true, true);
  scene.traverse((node) => {
    if (!node.isMesh || !node.geometry) return;
    const geo = node.geometry;
    const mat = node.matrixWorld;
    const pos = geo.attributes.position;
    const idx = geo.index;

    for (let i = 0; i < pos.count; i++) {
      tmp.fromBufferAttribute(pos, i).applyMatrix4(mat);
      positions.push(tmp.x, tmp.y, tmp.z);
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + offset);
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(i + offset);
    }
    offset += pos.count;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return geo;
}

function encode(d) {
  return Math.max(0, Math.min(255,
    Math.round(((d / SDF_BOUNDS) * 0.5 + 0.5) * 255)
  ));
}

// Three ray directions → majority-vote sign (handles non-watertight meshes).
const SIGN_DIRS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 1),
];

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Bake skull scene → 2D atlas DataTexture (rgba8unorm, R = SDF).
 *
 * @param {THREE.Group} skullScene
 * @param {number}      resolution  Grid resolution N (default 48). TILES_X×TILES_Y must ≥ N.
 * @param {Function}    onProgress  Optional (done, total) callback.
 * @returns {THREE.DataTexture}
 */
export function bakeSkullSDF(skullScene, resolution = 48, onProgress) {
  const N = resolution;
  if (TILES_X * TILES_Y < N) {
    throw new Error(`TILES_X*TILES_Y (${TILES_X*TILES_Y}) < N (${N}): increase tile counts.`);
  }

  // ── 1. Merge + normalise ─────────────────────────────────────────────────
  const geo = mergeScene(skullScene);
  geo.computeBoundingBox();
  const bbox   = geo.boundingBox;
  const centre = new THREE.Vector3();
  const size   = new THREE.Vector3();
  bbox.getCenter(centre);
  bbox.getSize(size);
  const scale = SKULL_SCALE / (Math.max(size.x, size.y, size.z) * 0.5);

  // ── 2. Build BVH ─────────────────────────────────────────────────────────
  geo.computeBoundsTree();
  const tempMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());

  // ── 3. Atlas pixel buffer ─────────────────────────────────────────────────
  const ATLAS_W = N * TILES_X;
  const ATLAS_H = N * TILES_Y;
  const pixels  = new Uint8Array(ATLAS_W * ATLAS_H * 4);

  const closestResult = { point: new THREE.Vector3(), distance: 0 };
  const raycaster     = new THREE.Raycaster();
  raycaster.firstHitOnly = false;
  const geoPoint = new THREE.Vector3();

  for (let iz = 0; iz < N; iz++) {
    const tileCol = iz % TILES_X;
    const tileRow = Math.floor(iz / TILES_X);

    for (let iy = 0; iy < N; iy++) {
      for (let ix = 0; ix < N; ix++) {
        // SDF-space voxel centre
        const sx = (ix / (N - 1)) * 2 * SDF_BOUNDS - SDF_BOUNDS;
        const sy = (iy / (N - 1)) * 2 * SDF_BOUNDS - SDF_BOUNDS;
        const sz = (iz / (N - 1)) * 2 * SDF_BOUNDS - SDF_BOUNDS;

        // Geometry-space point
        geoPoint.set(
          sx / scale + centre.x,
          sy / scale + centre.y,
          sz / scale + centre.z
        );

        // Unsigned distance → SDF space
        closestResult.distance = Infinity;
        geo.boundsTree.closestPointToPoint(geoPoint, closestResult, 0, Infinity);
        const unsignedSDF = closestResult.distance * scale;

        // Sign via majority vote
        let insideVotes = 0;
        for (let di = 0; di < SIGN_DIRS.length; di++) {
          raycaster.set(geoPoint, SIGN_DIRS[di]);
          const hits = [];
          tempMesh.raycast(raycaster, hits);
          if (hits.length % 2 === 1) insideVotes += 1;
        }
        const signed = insideVotes >= 2 ? -unsignedSDF : unsignedSDF;

        // Write to atlas tile
        const px = tileCol * N + ix;
        const py = tileRow * N + iy;
        const pi = (py * ATLAS_W + px) * 4;
        pixels[pi]     = encode(signed);
        pixels[pi + 1] = 0;
        pixels[pi + 2] = 0;
        pixels[pi + 3] = 255;
      }
    }

    if (onProgress) onProgress(iz + 1, N);
  }

  // ── 4. Clean up ──────────────────────────────────────────────────────────
  geo.disposeBoundsTree();
  geo.dispose();

  // ── 5. DataTexture (2D) ──────────────────────────────────────────────────
  const tex = new THREE.DataTexture(pixels, ATLAS_W, ATLAS_H);
  tex.format     = THREE.RGBAFormat;
  tex.type       = THREE.UnsignedByteType;
  tex.minFilter  = THREE.LinearFilter;
  tex.magFilter  = THREE.LinearFilter;
  tex.wrapS      = THREE.ClampToEdgeWrapping;
  tex.wrapT      = THREE.ClampToEdgeWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

/** 1×1 white DataTexture placeholder (all-outside = SDF_BOUNDS) */
export function makeDummySDFAtlas() {
  const pixels = new Uint8Array([255, 0, 0, 255]);
  const tex = new THREE.DataTexture(pixels, 1, 1);
  tex.format      = THREE.RGBAFormat;
  tex.type        = THREE.UnsignedByteType;
  tex.minFilter   = THREE.NearestFilter;
  tex.magFilter   = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
