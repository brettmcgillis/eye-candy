import * as THREE from 'three/webgpu';

// Interleaves a bundle's strand samples step-by-step (segment order: step 0
// of every strand, then step 1 of every strand, ...) so a single
// setDrawRange sweep grows every strand of the bundle in lockstep — the
// whole blot self-draws at once rather than one strand fully appearing
// before the next starts. `steps` is per-test (Leva-tunable trajectory
// length), so it's a parameter rather than an imported constant.
//
// `stepIndex` is a per-vertex attribute (buffer-relative step position) that
// TestStrokes.jsx's material reads to fade opacity toward the tail — without
// it, evolution's window-rebase (utils/evolution.js) would drop a whole
// chunk of points at once with no visual warning, popping instead of fading.
export function buildStrokeGeometry(strandCount, steps) {
  const totalSegments = strandCount * (steps - 1);
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(
    new Float32Array(totalSegments * 2 * 3),
    3
  );
  const stepIndex = new THREE.BufferAttribute(
    new Float32Array(totalSegments * 2),
    1
  );
  position.setUsage(THREE.DynamicDrawUsage);
  stepIndex.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', position);
  geometry.setAttribute('stepIndex', stepIndex);
  geometry.setDrawRange(0, 0);
  return geometry;
}

// Writes segments for step indices [fromStep, toStep) — i.e. the segments
// connecting point[fromStep]->point[fromStep+1] through
// point[toStep-1]->point[toStep]. Used both by writeStrokePositions (full
// range) and the incremental grower (just the newly-computed range each
// frame, so streamed-in growth doesn't repeatedly rewrite segments that were
// already correct). `stepIndex` is buffer-relative, not "steps since the
// beginning of time" — after evolution rebases the window, the caller
// re-writes the full valid range from step 0, which naturally gives every
// point a fresh buffer-relative index matching its new position.
export function writeStrokeSegmentRange(geometry, strands, fromStep, toStep) {
  const { position, stepIndex } = geometry.attributes;
  const strandCount = strands.length;
  let segment = fromStep * strandCount;

  for (let step = fromStep; step < toStep; step += 1) {
    for (let s = 0; s < strandCount; s += 1) {
      const points = strands[s];
      const a = step * 3;
      const b = a + 3;
      position.setXYZ(segment * 2, points[a], points[a + 1], points[a + 2]);
      position.setXYZ(segment * 2 + 1, points[b], points[b + 1], points[b + 2]);
      stepIndex.setX(segment * 2, step);
      stepIndex.setX(segment * 2 + 1, step + 1);
      segment += 1;
    }
  }

  position.needsUpdate = true;
  stepIndex.needsUpdate = true;
}

export function writeStrokePositions(geometry, strands, steps) {
  writeStrokeSegmentRange(geometry, strands, 0, steps - 1);
}
