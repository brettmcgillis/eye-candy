import { configureBrush } from './paintStyle';

export function strokePoints(path) {
  if (path.length !== 1) return path;
  const [x, y, pressure] = path[0];
  return [path[0], [x + 1, y, pressure]];
}

export default function paintStrokes(brush, strokes) {
  strokes.forEach(({ points, style }) => {
    configureBrush(brush, style);
    brush.noFill();
    brush.noWash();
    brush.noHatch();
    brush.spline(strokePoints(points), style.curvature);
  });
}
