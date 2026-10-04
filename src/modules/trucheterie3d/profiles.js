// Cross-sections in the tube's own frame, unit radius: `a` across the strand
// (horizontal), `b` up. Every profile fits inside the unit circle, which is
// what keeps the kernel's clearance guarantee true whatever the profile.
// A point repeated with a different normal is a hard edge.
function round(segments) {
  return Array.from({ length: segments }, (_, i) => {
    const t = (i / segments) * Math.PI * 2;
    const a = Math.cos(t);
    const b = Math.sin(t);
    return { a, b, na: a, nb: b };
  });
}

function half(segments) {
  const arc = Math.max(2, Math.round(segments / 2));
  const top = Array.from({ length: arc + 1 }, (_, i) => {
    const t = (i / arc) * Math.PI;
    const a = Math.cos(t);
    const b = Math.sin(t);
    return { a, b, na: a, nb: b };
  });
  return [
    ...top,
    { a: -1, b: 0, na: 0, nb: -1 },
    { a: 1, b: 0, na: 0, nb: -1 },
  ];
}

const POWER = 4;
const signedPow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

function ribbon(segments, height) {
  return Array.from({ length: segments }, (_, i) => {
    const t = (i / segments) * Math.PI * 2;
    const a = signedPow(Math.cos(t), 2 / POWER);
    const b = signedPow(Math.sin(t), 2 / POWER) * height;
    const ga = signedPow(a, POWER - 1);
    const gb = signedPow(b / height, POWER - 1) / height;
    const length = Math.hypot(ga, gb) || 1;
    return { a, b, na: ga / length, nb: gb / length };
  });
}

export default function profileRing({
  ribbonHeight,
  tubeProfile,
  tubeSegments,
}) {
  const segments = Math.max(4, Math.round(tubeSegments));
  if (tubeProfile === 'half') return half(segments);
  if (tubeProfile === 'ribbon') return ribbon(segments, ribbonHeight);
  return round(segments);
}
