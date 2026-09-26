import { mulberry32 } from '@utils/noise2d';

const WAVES = 3;

// Wires start as one coherent ripple so neighbours begin parallel instead of
// interpenetrating; the ripple's amplitude is whatever makes the rest length
// fit the span, and the writhe breaks the coherence within a second or two.
export function seedWires(config, layout) {
  const { collideRadius, pointsPerWire, wireCount, zBack, zFront } = layout;
  const random = mulberry32(config.wireSeed);
  const width = layout.fieldHalfWidth * 2;
  const band = Math.max(zFront - zBack - collideRadius * 2, collideRadius);
  const cols = Math.max(1, Math.round(Math.sqrt((wireCount * width) / band)));
  const rows = Math.ceil(wireCount / cols);
  const span = layout.fieldHalfHeight * 2;
  const slack = Math.max(config.wireSlack, 1.0001);
  const amplitude =
    (span / (2 * Math.PI * WAVES)) * Math.sqrt(2 * (slack * slack - 1));

  const anchors = new Float32Array(wireCount * 4);
  const positions = new Float32Array(layout.pointCount * 4);

  for (let w = 0; w < wireCount; w += 1) {
    const col = w % cols;
    const row = Math.floor(w / cols);
    const x =
      -layout.fieldHalfWidth + ((col + 0.1 + random() * 0.8) / cols) * width;
    const z =
      zBack + collideRadius + ((row + 0.1 + random() * 0.8) / rows) * band;
    const skew = (random() - 0.5) * config.wireTangle;
    const zSkew = (random() - 0.5) * band * Math.min(config.wireTangle, 1);
    const clampZ = (v) =>
      Math.min(Math.max(v, zBack + collideRadius), zFront - collideRadius);
    const top = [x + skew, clampZ(z + zSkew)];
    const bottom = [x - skew, clampZ(z - zSkew)];
    anchors.set([top[0], top[1], bottom[0], bottom[1]], w * 4);

    const phase = random() * 0.08;
    for (let t = 0; t < pointsPerWire; t += 1) {
      const s = t / (pointsPerWire - 1);
      const ripple = Math.sin((s * WAVES + phase) * Math.PI * 2) * amplitude;
      const envelope = Math.sin(s * Math.PI);
      const i = (w * pointsPerWire + t) * 4;
      positions[i] = bottom[0] + (top[0] - bottom[0]) * s + ripple * envelope;
      positions[i + 1] = -layout.fieldHalfHeight + span * s;
      positions[i + 2] = bottom[1] + (top[1] - bottom[1]) * s;
      positions[i + 3] = 0;
    }
  }

  return { anchors, positions };
}

export function seedSpheres(config, layout) {
  const count = config.sphereCount;
  const random = mulberry32(config.wireSeed * 31 + 17);
  const lane = layout.fieldHalfHeight * 0.7;
  const mid = (layout.zFront + layout.zBack) * 0.5;
  const bodies = new Float32Array(count * 4);
  const motion = new Float32Array(count * 4);
  const lanes = new Float32Array(count * 4);

  for (let s = 0; s < count; s += 1) {
    const radius =
      config.sphereRadiusMin +
      random() * (config.sphereRadiusMax - config.sphereRadiusMin);
    const direction = s % 2 === 0 ? 1 : -1;
    const y = (random() * 2 - 1) * lane;
    const x = (random() * 2 - 1) * layout.fieldHalfWidth;
    bodies.set([x, y, mid, 0], s * 4);
    motion.set([0, 0, 0, 0], s * 4);
    lanes.set([y, mid, radius, direction * (0.7 + random() * 0.6)], s * 4);
  }

  return { bodies, lanes, motion };
}
