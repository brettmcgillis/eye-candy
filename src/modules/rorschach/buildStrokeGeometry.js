import * as THREE from 'three/webgpu';

// Interleaves step-by-step across strands (step 0 of every strand, then
// step 1, ...) so one setDrawRange sweep grows the whole bundle in lockstep.
// `stepIndex` drives TestStrokes.jsx's tail fade; `segHidden` force-zeroes
// opacity for a respawned strand's one connecting segment (see
// utils/evolution.js's respawnHiddenStep).
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
  const segHidden = new THREE.BufferAttribute(
    new Float32Array(totalSegments * 2),
    1
  );
  position.setUsage(THREE.DynamicDrawUsage);
  stepIndex.setUsage(THREE.DynamicDrawUsage);
  segHidden.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', position);
  geometry.setAttribute('stepIndex', stepIndex);
  geometry.setAttribute('segHidden', segHidden);
  geometry.setDrawRange(0, 0);
  return geometry;
}

// Writes segments for step indices [fromStep, toStep). `hiddenSteps`
// (per-strand-pair, index = s/2) marks a segment force-invisible — only the
// full-range rewrite path needs it, since incrementally-appended segments
// are always freshly grown, never a respawn boundary.
export function writeStrokeSegmentRange(
  geometry,
  strands,
  fromStep,
  toStep,
  hiddenSteps
) {
  const { position, stepIndex, segHidden } = geometry.attributes;
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
      const hidden =
        hiddenSteps && hiddenSteps[Math.floor(s / 2)] === step ? 1 : 0;
      segHidden.setX(segment * 2, hidden);
      segHidden.setX(segment * 2 + 1, hidden);
      segment += 1;
    }
  }

  position.needsUpdate = true;
  stepIndex.needsUpdate = true;
  segHidden.needsUpdate = true;
}

export function writeStrokePositions(geometry, strands, steps) {
  writeStrokeSegmentRange(geometry, strands, 0, steps - 1);
}
