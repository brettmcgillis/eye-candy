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

export function clipLine(line, circle) {
  const dx = line.to[0] - line.from[0];
  const dy = line.to[1] - line.from[1];
  const x = line.from[0] - circle.x;
  const y = line.from[1] - circle.y;
  const a = dx * dx + dy * dy;
  const b = 2 * (x * dx + y * dy);
  const c = x * x + y * y - circle.rMax ** 2;
  const det = b * b - 4 * a * c;
  const cuts = [0, 1];
  if (det >= 0)
    [(-b - Math.sqrt(det)) / (2 * a), (-b + Math.sqrt(det)) / (2 * a)].forEach(
      (t) => {
        if (t > 0 && t < 1) cuts.push(t);
      }
    );
  cuts.sort((s, t) => s - t);
  const at = (t) => [line.from[0] + dx * t, line.from[1] + dy * t];
  return cuts.slice(1).flatMap((end, i) => {
    const start = cuts[i];
    const [px, py] = at((start + end) / 2);
    return end - start > EPS &&
      Math.hypot(px - circle.x, py - circle.y) >= circle.rMax - EPS
      ? [{ ...line, from: at(start), to: at(end) }]
      : [];
  });
}
