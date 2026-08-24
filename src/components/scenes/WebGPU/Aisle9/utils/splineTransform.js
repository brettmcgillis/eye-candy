import { toTuple, toVector3 } from './vectors';

function transformFrame(frame, matrix, keys = ['position', 'target', 'pivot']) {
  if (!matrix || !frame) return frame;
  const next = { ...frame };
  keys.forEach((key) => {
    if (!frame[key]) return;
    next[key] = toTuple(toVector3(frame[key]).applyMatrix4(matrix));
  });
  return next;
}

export default function transformSpline(spline, matrix) {
  if (!matrix || !spline?.points?.length) return spline;

  const transformedTarget = spline.target
    ? toTuple(toVector3(spline.target).applyMatrix4(matrix))
    : undefined;

  return {
    ...spline,
    target: transformedTarget ?? spline.target,
    desktop: spline.desktop
      ? transformFrame(spline.desktop, matrix)
      : { fov: spline.fov, target: transformedTarget ?? spline.target },
    mobile: spline.mobile
      ? transformFrame(spline.mobile, matrix)
      : { fov: spline.fov, target: transformedTarget ?? spline.target },
    points: spline.points.map((point) => {
      const next = {
        ...point,
        position: toTuple(toVector3(point.position).applyMatrix4(matrix)),
      };
      if (point.lookAt) {
        next.lookAt = toTuple(toVector3(point.lookAt).applyMatrix4(matrix));
      }
      return next;
    }),
  };
}
