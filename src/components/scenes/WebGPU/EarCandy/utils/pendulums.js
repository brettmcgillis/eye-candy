export const MAX_PENDULUMS = 32;

export function swingFrequency(index, p) {
  return (p.pendulumBaseSwings + index) / p.pendulumCycle;
}

export function swingAngle(index, time, p) {
  const amplitude = (p.pendulumAmplitude * Math.PI) / 180;
  return amplitude * Math.cos(2 * Math.PI * swingFrequency(index, p) * time);
}

export function stringLength(index, maxLength, p) {
  const ratio = p.pendulumBaseSwings / (p.pendulumBaseSwings + index);
  return maxLength * ratio * ratio;
}

// Zero crossings of cos(2πft) fall at (2k+1)/(4f); even k swings leftward.
export function crossingsInWindow(frequency, from, to) {
  const events = [];
  for (
    let k = Math.floor((4 * frequency * from - 1) / 2) + 1;
    (2 * k + 1) / (4 * frequency) <= to;
    k += 1
  ) {
    events.push({ leftward: k % 2 === 0, time: (2 * k + 1) / (4 * frequency) });
  }
  return events;
}
