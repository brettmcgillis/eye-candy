import sampleField from '../sampleField';

// Marched rather than intersected against a plane. A flat catch-plane is only
// correct where the ground it stands for is flat, and on a reach that falls a
// metre and a half across the frame a grazing camera puts the cursor several
// metres from the gravel it is pointing at.
const MARCH_STEPS = 96;
const REFINE_STEPS = 10;

function clip(position, direction, half, span) {
  if (Math.abs(direction) < 1e-6) {
    return position < -half || position > half ? null : span;
  }
  const a = (-half - position) / direction;
  const b = (half - position) / direction;
  return [Math.max(span[0], Math.min(a, b)), Math.min(span[1], Math.max(a, b))];
}

// The surface the cursor lands on is the higher of the bed and the level the
// domain rests at, so a stroke out over open water picks the point under the
// sea rather than the point on the sea floor several metres beyond it.
export default function pickBed(field, resolution, worldSize, ray, out) {
  const half = worldSize * 0.5;
  const { direction, origin } = ray;

  let span = [0, Number.MAX_VALUE];
  span = clip(origin.x, direction.x, half, span);
  if (!span) return null;
  span = clip(origin.z, direction.z, half, span);
  if (!span || span[1] <= span[0]) return null;

  const surfaceAt = (x, z) =>
    Math.max(
      sampleField(field, resolution, worldSize, x, z, 0),
      sampleField(field, resolution, worldSize, x, z, 3)
    );
  const gapAt = (t) =>
    origin.y +
    direction.y * t -
    surfaceAt(origin.x + direction.x * t, origin.z + direction.z * t);

  const [near, far] = span;
  const step = (far - near) / MARCH_STEPS;
  let previous = near;
  if (gapAt(near) <= 0) {
    out.set(origin.x + direction.x * near, 0, origin.z + direction.z * near);
    return out;
  }

  for (let i = 1; i <= MARCH_STEPS; i += 1) {
    const t = near + step * i;
    if (gapAt(t) <= 0) {
      let lo = previous;
      let hi = t;
      for (let k = 0; k < REFINE_STEPS; k += 1) {
        const mid = (lo + hi) * 0.5;
        if (gapAt(mid) <= 0) hi = mid;
        else lo = mid;
      }
      out.set(
        origin.x + direction.x * hi,
        origin.y + direction.y * hi,
        origin.z + direction.z * hi
      );
      return out;
    }
    previous = t;
  }

  return null;
}
