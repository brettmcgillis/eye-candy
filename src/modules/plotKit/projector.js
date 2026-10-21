const DEG = Math.PI / 180;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

// World point → output pixels plus view depth (distance along the view
// axis, what a linear depth pass stores).
export default function createProjector(camera, width, height) {
  const forward = normalize([
    camera.target[0] - camera.eye[0],
    camera.target[1] - camera.eye[1],
    camera.target[2] - camera.eye[2],
  ]);
  const right = normalize(cross(forward, camera.up));
  const up = cross(right, forward);
  const tanY = Math.tan((camera.fov * DEG) / 2);
  const tanX = tanY * (width / height);
  return (x, y, z) => {
    const v = [x - camera.eye[0], y - camera.eye[1], z - camera.eye[2]];
    const depth = dot(v, forward);
    return {
      depth,
      x: ((dot(v, right) / (depth * tanX) + 1) / 2) * width,
      y: ((1 - dot(v, up) / (depth * tanY)) / 2) * height,
    };
  };
}
