import * as THREE from 'three/webgpu';

const nose = new THREE.Vector3();

// The places the nose lingers at the floor over one loop of the clip; a
// nose sweeping past leaves too few samples to count as a mound.
export default function grazeSites(
  probe,
  { boneName, floorY, merge, minSamples, reach, step }
) {
  const bone = probe.bone(boneName);
  const clusters = [];

  for (let time = 0; time < probe.clip.duration; time += step) {
    probe.pose(time);
    bone.getWorldPosition(nose);
    if (nose.y - floorY <= reach) {
      const near = clusters.find(
        (c) => Math.hypot(c.x - nose.x, c.z - nose.z) < merge
      );
      if (near) {
        near.points.push([nose.x, nose.z]);
        near.x += (nose.x - near.x) / near.points.length;
        near.z += (nose.z - near.z) / near.points.length;
      } else {
        clusters.push({ points: [[nose.x, nose.z]], x: nose.x, z: nose.z });
      }
    }
  }

  return clusters
    .filter((c) => c.points.length >= minSamples)
    .map(({ points, x, z }) => ({
      radius:
        merge * 0.45 +
        Math.max(...points.map(([px, pz]) => Math.hypot(px - x, pz - z))),
      weight: points.length,
      x,
      z,
    }));
}
