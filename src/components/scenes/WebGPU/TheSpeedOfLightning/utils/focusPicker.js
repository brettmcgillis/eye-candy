import * as THREE from 'three/webgpu';

const scratchRay = new THREE.Raycaster();
const scratchPoint = new THREE.Vector3();

// The grain field's geometry is a single unit box displaced entirely on the GPU,
// so raycasting it hits nothing useful. Pick against the CPU-side trunk polyline
// instead, falling back to the sand plane when the click misses the bolt.
export default function createFocusPicker({ groundY, trunkRef }) {
  return (ndc, camera) => {
    scratchRay.setFromCamera(ndc, camera);

    const trunkPath = trunkRef.current;
    let best = Infinity;
    let hit = null;

    if (trunkPath) {
      for (let index = 0; index < trunkPath.length / 4; index += 1) {
        scratchPoint.set(
          trunkPath[index * 4],
          trunkPath[index * 4 + 1],
          trunkPath[index * 4 + 2]
        );

        const distance = scratchRay.ray.distanceToPoint(scratchPoint);

        if (distance < best) {
          best = distance;
          hit = scratchPoint.clone();
        }
      }
    }

    if (hit && best < 0.5) return hit;

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
    const point = new THREE.Vector3();

    return scratchRay.ray.intersectPlane(plane, point) ? point : hit;
  };
}
