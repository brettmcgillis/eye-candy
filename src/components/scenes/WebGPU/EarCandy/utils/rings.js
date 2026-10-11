export const MAX_RINGS = 6;
export const MAX_STEPS = 32;

export function ringConfig(c, k) {
  const n = k + 1;
  return {
    degree: c[`ring${n}Degree`],
    pulses: Math.min(c[`ring${n}Pulses`], c[`ring${n}Steps`]),
    rotate: c[`ring${n}Rotate`],
    steps: c[`ring${n}Steps`],
    voice: c[`ring${n}Voice`],
  };
}

export function euclidHits({ pulses, rotate, steps }) {
  const hits = new Array(steps).fill(false);
  for (let i = 0; i < steps; i += 1) {
    if ((i * pulses) % steps < pulses) hits[(i + rotate) % steps] = true;
  }
  return hits;
}

export function hitsInWindow(hits, from, to) {
  const steps = hits.length;
  const events = [];
  for (let i = 0; i < steps; i += 1) {
    if (hits[i]) {
      const base = i / steps;
      const phase = base + Math.floor(from - base) + 1;
      if (phase <= to) events.push({ phase, step: i });
    }
  }
  return events;
}

export function ringRadii(count, stage) {
  const outer = stage.height * 0.45;
  const inner = stage.height * 0.12;
  return Array.from({ length: count }, (_, k) =>
    count > 1 ? outer - (k * (outer - inner)) / (count - 1) : outer
  );
}
