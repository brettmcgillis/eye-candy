// Camera framings for the 3D views, from the woven rug's size in metres.
export function rugSize(build, { fringeLength, rugWidth }) {
  const length = (rugWidth * build.rows) / build.cols;
  return { length, total: length + fringeLength * 2, width: rugWidth };
}

export function flatView(build, options, aspect) {
  const { total, width } = rugSize(build, options);
  const halfHeight = Math.max(total / 2, width / 2 / aspect) * 1.04;
  return {
    eye: [0, 10, 0],
    far: 30,
    halfHeight,
    halfWidth: halfHeight * aspect,
    near: 0.1,
    projection: 'orthographic',
    target: [0, 0, 0],
    up: [0, 0, -1],
  };
}

export function floorView(build, options, aspect) {
  const { total, width } = rugSize(build, options);
  const reach = Math.max(total, width * 1.3) * (aspect < 1 ? 1.25 : 1);
  return {
    eye: [width * 0.55, reach * 0.95, reach * 0.95],
    far: 60,
    fov: 35,
    near: 0.05,
    projection: 'perspective',
    target: [0, 0, 0],
    up: [0, 1, 0],
  };
}

export function wallView(build, options, aspect) {
  const { total, width } = rugSize(build, options);
  const span = Math.max(total, width / Math.max(aspect, 0.4)) * 1.18;
  const distance = span / (2 * Math.tan((32 * Math.PI) / 360));
  const midY = options.rodHeight - total / 2 + 0.08;
  return {
    eye: [width * 0.18, midY + 0.1, distance],
    far: 60,
    fov: 32,
    near: 0.05,
    projection: 'perspective',
    target: [0, midY, 0],
    up: [0, 1, 0],
  };
}

// Where the rod sits: high enough that the rug's foot clears the floor.
export const rodHeightFor = (build, options) =>
  Math.max(1.9, rugSize(build, options).total + 0.2);
