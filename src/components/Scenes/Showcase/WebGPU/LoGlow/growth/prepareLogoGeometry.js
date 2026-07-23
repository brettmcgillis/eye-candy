import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// The reference sim tunes every constant against geometry normalised to
// bounding-sphere radius 1.15 and grows *up* from a low-poly base
// (meshFactory.buildShapeGeometry). The inner logo meshes are ~50-62k verts —
// already at the vertex cap with no headroom to grow — so we weld, decimate to
// a low base, and normalise into that same space. The returned restore maps the
// normalised mesh back onto the original inner-mesh footprint so the existing
// scene groups (scale [10, 0.524, 10], float/spin/flip) stack on top unchanged.

const NORMALISED_RADIUS = 1.15;
const simplifier = new SimplifyModifier();

function stripToPositions(source) {
  const geometry = new BufferGeometry();
  const position = source.getAttribute('position');
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(Float32Array.from(position.array), 3)
  );
  if (source.index) {
    geometry.setIndex(Array.from(source.index.array));
  }
  return geometry;
}

export default function prepareLogoGeometry(source, targetVertexCount = 3000) {
  const stripped = stripToPositions(source);
  let welded = mergeVertices(stripped, 1e-5);
  stripped.dispose();

  const currentCount = welded.getAttribute('position').count;
  if (currentCount > targetVertexCount) {
    const removeCount = currentCount - targetVertexCount;
    const simplified = simplifier.modify(welded, removeCount);
    welded.dispose();
    welded = mergeVertices(simplified, 1e-5);
    simplified.dispose();
  }

  welded.computeBoundingBox();
  const center = new Vector3();
  welded.boundingBox.getCenter(center);
  welded.translate(-center.x, -center.y, -center.z);

  welded.computeBoundingSphere();
  const radius = welded.boundingSphere?.radius ?? 1;
  const normalizeScale = radius > 1e-6 ? NORMALISED_RADIUS / radius : 1;
  welded.scale(normalizeScale, normalizeScale, normalizeScale);
  welded.computeVertexNormals();
  welded.computeBoundingSphere();

  return {
    geometry: welded,
    // Inverse of the normalisation: place the grown mesh back where the
    // original inner mesh sat, in the same local space.
    restore: {
      position: center,
      scale: 1 / normalizeScale,
    },
  };
}
