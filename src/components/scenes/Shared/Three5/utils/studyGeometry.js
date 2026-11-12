import {
  BoxGeometry,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  Vector3,
} from 'three';

export function studyGeometry(shape) {
  let indexed;
  if (shape === 'box') indexed = new BoxGeometry(3.4, 3.4, 3.4, 4, 4, 4);
  else if (shape === 'sphere') indexed = new SphereGeometry(2, 28, 18);
  else if (shape === 'torus') indexed = new TorusGeometry(1.55, 0.65, 16, 40);
  else indexed = new TorusKnotGeometry(1.4, 0.5, 72, 10);
  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  return geometry;
}

export function meshFaces(geometry) {
  const p = geometry.attributes.position;
  const n = geometry.attributes.normal;
  const faces = [];
  for (let i = 0; i < p.count; i += 3) {
    const points = [0, 1, 2].map((j) =>
      new Vector3().fromBufferAttribute(p, i + j)
    );
    const normal = points[1]
      .clone()
      .sub(points[0])
      .cross(points[2].clone().sub(points[0]))
      .normalize();
    const center = points[0]
      .clone()
      .add(points[1])
      .add(points[2])
      .multiplyScalar(1 / 3);
    faces.push({
      points,
      normal,
      center,
      normals: [0, 1, 2].map((j) =>
        new Vector3().fromBufferAttribute(n, i + j)
      ),
    });
  }
  return faces;
}

export function meshEdges(faces) {
  const edges = new Map();
  const key = (p) =>
    p
      .toArray()
      .map((v) => Math.round(v * 10000))
      .join(',');
  faces.forEach((face) => {
    for (let i = 0; i < 3; i += 1) {
      const a = face.points[i];
      const b = face.points[(i + 1) % 3];
      const edgeKey = [key(a), key(b)].sort().join('|');
      if (!edges.has(edgeKey)) edges.set(edgeKey, { a, b, faces: [] });
      edges.get(edgeKey).faces.push(face);
    }
  });
  return [...edges.values()];
}
