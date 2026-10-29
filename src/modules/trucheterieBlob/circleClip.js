const TAU = Math.PI * 2;
const EPS = 1e-9;
export const arcPoint = (arc, angle) => [
  arc.x + Math.cos(angle) * arc.radius,
  arc.y + Math.sin(angle) * arc.radius,
];

function trim(arc, angles, keep) {
  const cuts = [
    0,
    arc.span,
    ...angles
      .map((angle) => (((angle - arc.start) % TAU) + TAU) % TAU)
      .filter((t) => t > EPS && t < arc.span - EPS),
  ].sort((a, b) => a - b);
  return cuts.slice(1).flatMap((end, i) => {
    const start = cuts[i];
    if (
      (end - start) * arc.radius < 1e-7 ||
      !keep(...arcPoint(arc, arc.start + (start + end) / 2))
    )
      return [];
    return [{ ...arc, start: arc.start + start, span: end - start }];
  });
}

function circleCuts(arc, circle) {
  const dx = circle.x - arc.x;
  const dy = circle.y - arc.y;
  const d = Math.hypot(dx, dy);
  if (
    d <= EPS ||
    d > arc.radius + circle.rMax + EPS ||
    d < Math.abs(arc.radius - circle.rMax) - EPS
  )
    return [];
  const a = Math.atan2(dy, dx);
  const spread = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        (d * d + arc.radius ** 2 - circle.rMax ** 2) / (2 * d * arc.radius)
      )
    )
  );
  return [a - spread, a + spread];
}

function lineCuts(arc, pivot, normal) {
  const offset =
    (arc.x - pivot[0]) * normal[0] + (arc.y - pivot[1]) * normal[1];
  const level = -offset / arc.radius;
  const a = Math.atan2(normal[1], normal[0]);
  return Math.abs(level) <= 1
    ? [a - Math.acos(level), a + Math.acos(level)]
    : [];
}

// A disc cut by straight lines: `contains` says which pieces are in it.
export function clipShape(arc, shape, inside = false) {
  const cuts = [
    ...circleCuts(arc, shape),
    ...shape.lines.flatMap(([pivot, normal]) => lineCuts(arc, pivot, normal)),
  ];
  return trim(arc, cuts, (x, y) => shape.contains(x, y) === inside);
}

export function clipCircle(arc, circle, inside = false) {
  return trim(arc, circleCuts(arc, circle), (x, y) =>
    inside
      ? Math.hypot(x - circle.x, y - circle.y) <= circle.rMax + EPS
      : Math.hypot(x - circle.x, y - circle.y) >= circle.rMax - EPS
  );
}

// A segment cut by a circle or, given `contains`, by a shape like clipShape's;
// the pieces outside it are kept.
export function clipLine(line, cover) {
  const dx = line.to[0] - line.from[0];
  const dy = line.to[1] - line.from[1];
  const a = dx * dx + dy * dy;
  const cuts = [0, 1];
  const keep = (t) => t > 0 && t < 1 && cuts.push(t);
  const x = line.from[0] - cover.x;
  const y = line.from[1] - cover.y;
  const b = 2 * (x * dx + y * dy);
  const det = b * b - 4 * a * (x * x + y * y - cover.rMax ** 2);
  if (det >= 0) {
    keep((-b - Math.sqrt(det)) / (2 * a));
    keep((-b + Math.sqrt(det)) / (2 * a));
  }
  (cover.contains ? cover.lines : []).forEach(([pivot, normal]) => {
    const rate = dx * normal[0] + dy * normal[1];
    if (Math.abs(rate) > EPS)
      keep(
        -(
          (line.from[0] - pivot[0]) * normal[0] +
          (line.from[1] - pivot[1]) * normal[1]
        ) / rate
      );
  });
  cuts.sort((s, t) => s - t);
  const at = (t) => [line.from[0] + dx * t, line.from[1] + dy * t];
  const outside = cover.contains
    ? (px, py) => !cover.contains(px, py)
    : (px, py) => Math.hypot(px - cover.x, py - cover.y) >= cover.rMax - EPS;
  return cuts.slice(1).flatMap((end, i) => {
    const start = cuts[i];
    return end - start > EPS && outside(...at((start + end) / 2))
      ? [{ ...line, from: at(start), to: at(end) }]
      : [];
  });
}
