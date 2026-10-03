// The piece's extent in map units (x, y across the frame, z up; a frame
// height is 2), for framing and the shadow camera.
export default function boundsOf(config, aspect) {
  const lift = config.style === 'lines' ? config.lineHeight : 0;
  return {
    max: [aspect, 1, 2 * (config.relief + lift)],
    min: [-aspect, -1, 0],
  };
}

// Walls for the terraced style (one band step each), boxes for the lines
// style, or time slices; null when the piece needs no segment geometry (the
// smooth surface is all GPU).
export function segmentMode(config) {
  if (config.style === 'smooth') return null;
  if (config.style === 'terraced') {
    return config.wallMode === 'solid' ? 'walls' : null;
  }
  return config.lineExtrude === 'time' ? 'trail' : 'lines';
}
