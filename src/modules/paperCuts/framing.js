import { framePoints, frameSphere } from '@modules/plotKit';

export default function frameView({
  bounds,
  options,
  view = 'front',
  azimuthOffset = 0,
  stable = false,
}) {
  const azimuth = (view === 'angle' ? 25 : 0) + azimuthOffset;
  const elevation = view === 'angle' ? 12 : 0;
  const points = [bounds.min[0], bounds.max[0]].flatMap((x) =>
    [bounds.min[1], bounds.max[1]].flatMap((y) =>
      [bounds.min[2], bounds.max[2]].map((z) => [x, y, z])
    )
  );
  const center = bounds.min.map((v, axis) => (v + bounds.max[axis]) / 2);
  const radius =
    Math.hypot(...bounds.max.map((v, axis) => v - bounds.min[axis])) / 2;
  const fit = stable ? frameSphere : framePoints;
  const framed = fit({
    bounds: { center, radius },
    azimuth,
    elevation,
    points,
    width: options.width,
    height: options.height,
    fov: options.fov,
    margin: options.margin,
  });
  if (options.projection !== 'orthographic')
    return { ...framed, projection: 'perspective' };
  const halfHeight =
    Math.hypot(...framed.eye.map((v, i) => v - framed.target[i])) *
    Math.tan((options.fov * Math.PI) / 360);
  return {
    ...framed,
    projection: 'orthographic',
    halfHeight,
    halfWidth: (halfHeight * options.width) / options.height,
  };
}
