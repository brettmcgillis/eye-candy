import { BoxGeometry, CatmullRomCurve3, EdgesGeometry, Vector3 } from 'three';

export function boxPaths(width = 4, height = 4, depth = 4) {
  const box = new BoxGeometry(width, height, depth);
  const edges = new EdgesGeometry(box);
  const points = edges.attributes.position;
  const paths = [];
  for (let i = 0; i < points.count; i += 2)
    paths.push([
      [points.getX(i), points.getY(i), points.getZ(i)],
      [points.getX(i + 1), points.getY(i + 1), points.getZ(i + 1)],
    ]);
  box.dispose();
  edges.dispose();
  return paths;
}

export function curvePaths(form) {
  if (form === 'wire cube') return boxPaths();
  return Array.from({ length: form === 'helix' ? 3 : 6 }, (_, index) => {
    const points = Array.from({ length: 65 }, (_item, i) => {
      const t = (i / 64) * Math.PI * 2;
      const phase = (index / 6) * Math.PI * 2;
      if (form === 'helix')
        return new Vector3(
          Math.cos(t * 2 + phase) * 1.8,
          (i / 64 - 0.5) * 5,
          Math.sin(t * 2 + phase) * 1.8
        );
      return new Vector3(
        Math.cos(t) * (2.1 + Math.cos(phase) * 0.6),
        Math.sin(t) * 2.4,
        Math.sin(t * 2 + phase) * 1.4
      );
    });
    return new CatmullRomCurve3(points)
      .getPoints(100)
      .map((point) => point.toArray());
  });
}
