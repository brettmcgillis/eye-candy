import * as THREE from 'three/webgpu';

// Interleaves a bundle's strand samples step-by-step (segment order: step 0
// of every strand, then step 1 of every strand, ...) so a single
// setDrawRange sweep grows every strand of the bundle in lockstep — the
// whole blot self-draws at once rather than one strand fully appearing
// before the next starts. `steps` is per-test (Leva-tunable trajectory
// length), so it's a parameter rather than an imported constant.
export function buildStrokeGeometry(strandCount, steps) {
  const totalSegments = strandCount * (steps - 1);
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(
    new Float32Array(totalSegments * 2 * 3),
    3
  );
  position.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', position);
  geometry.setDrawRange(0, 0);
  return geometry;
}

export function writeStrokePositions(geometry, strands, steps) {
  const { position } = geometry.attributes;
  const strandCount = strands.length;
  let segment = 0;

  for (let step = 0; step < steps - 1; step += 1) {
    for (let s = 0; s < strandCount; s += 1) {
      const points = strands[s];
      const a = step * 3;
      const b = a + 3;
      position.setXYZ(segment * 2, points[a], points[a + 1], points[a + 2]);
      position.setXYZ(segment * 2 + 1, points[b], points[b + 1], points[b + 2]);
      segment += 1;
    }
  }

  position.needsUpdate = true;
}
