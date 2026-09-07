import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

const TAU = Math.PI * 2;

export const STAIR_SEGMENT_DEFAULTS = {
  innerRadius: 24,
  outerRadius: 30,
  innerRadiusEnd: null,
  outerRadiusEnd: null,
  riser: 0.18,
  stepCount: 32,
  arcPerStep: TAU / 512,
  thickness: 1.2,
  nosing: 1.04,
};

// One flight: `stepCount` treads climbing a helical arc. Built as real merged
// boxes so the piece can be inspected, measured and lit on its own rather than
// existing only as a vertex-shader displacement. `thickness` is the slab depth
// below each tread, in metres, so it can match the landing slab exactly.
//
// The radii may differ end to end. A shaft that opens as it descends cannot be
// built from constant-radius flights: each one would meet the landing below it
// at a different radius from the landing's own, leaving a ledge at every joint
// the whole way down.
export default function createStairSegment(options = {}) {
  const o = { ...STAIR_SEGMENT_DEFAULTS, ...options };
  const innerEnd = o.innerRadiusEnd ?? o.innerRadius;
  const outerEnd = o.outerRadiusEnd ?? o.outerRadius;
  const parts = [];
  const height = o.thickness;

  // Each tread occupies the arc slice [i, i+1] and sits one riser below the
  // level it is entered from, so a flight spans exactly stepCount slices and
  // meets the landing above and below it without a half-tread seam.
  for (let i = 0; i < o.stepCount; i += 1) {
    const angle = (i + 0.5) * o.arcPerStep;
    const t = (i + 0.5) / o.stepCount;
    const inner = o.innerRadius + (innerEnd - o.innerRadius) * t;
    const outer = o.outerRadius + (outerEnd - o.outerRadius) * t;
    const width = outer - inner;
    const midRadius = (inner + outer) * 0.5;
    const tread = Math.abs(o.arcPerStep) * midRadius * o.nosing;
    const box = new THREE.BoxGeometry(width, height, tread);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      -angle
    );
    const position = new THREE.Vector3(
      Math.cos(angle) * midRadius,
      -(i + 1) * o.riser - height * 0.5,
      Math.sin(angle) * midRadius
    );
    matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
    box.applyMatrix4(matrix);
    parts.push(box);
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  merged.computeVertexNormals();
  return merged;
}

export function stairSegmentSpan(options = {}) {
  const o = { ...STAIR_SEGMENT_DEFAULTS, ...options };
  return {
    rise: o.stepCount * o.riser,
    arc: o.stepCount * o.arcPerStep,
  };
}
