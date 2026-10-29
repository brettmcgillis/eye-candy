import { framePoints } from '@modules/plotKit';

export default function frameView({ bounds, options, view = 'front' }) {
  const saved = options.cameraFrame ?? bounds.cameraFrame;
  if (saved)
    return {
      ...saved,
      halfWidth: (saved.halfHeight * options.width) / options.height,
    };
  const points = [];
  for (let x = 0; x < 2; x += 1)
    for (let y = 0; y < 2; y += 1)
      for (let z = 0; z < 2; z += 1)
        points.push([
          x ? bounds.max[0] : bounds.min[0],
          y ? bounds.max[1] : bounds.min[1],
          z ? bounds.max[2] : bounds.min[2],
        ]);
  const azimuth = { front: 0, hero: -24, side: 55 }[view];
  const elevation = view === 'front' ? 0 : 28;
  const frame = framePoints({
    points,
    azimuth,
    elevation,
    fov: options.fov,
    width: options.width,
    height: options.height,
    margin: options.margin,
  });
  if (options.projection !== 'orthographic')
    return { ...frame, projection: 'perspective' };
  let halfHeight =
    Math.hypot(...frame.eye.map((v, i) => v - frame.target[i])) *
    Math.tan((options.fov * Math.PI) / 360);
  if (options.crop === 'bleed' && bounds.bleed && view === 'front') {
    const { halfX, halfY, cos, sin } = bounds.bleed;
    const aspect = options.width / options.height;
    halfHeight = Math.min(
      halfX / (cos * aspect + sin),
      halfY / (sin * aspect + cos)
    );
  }
  return {
    ...frame,
    projection: 'orthographic',
    halfHeight,
    halfWidth: (halfHeight * options.width) / options.height,
  };
}
