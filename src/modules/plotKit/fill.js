import { simplify } from './lines';

// One long line through a 2D domain (a surface's UVs, a frame), as base
// points with the unit normal the wiggle swings along and the turn they are
// on. `phase` offsets the line by a share of its pitch, so a second shade
// runs between the first's.
export function spiralWalk({
  center = [0.5, 0.5],
  phase = 0,
  pitch,
  radius,
  step,
}) {
  const points = [];
  const radiusAt = (theta) => (pitch * theta) / (2 * Math.PI);
  for (
    let theta = 2 * Math.PI * phase;
    radiusAt(theta) <= radius;
    theta += step / Math.max(radiusAt(theta), step)
  ) {
    const r = radiusAt(theta);
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    points.push({
      normal: [c, s],
      turn: Math.floor(theta / (2 * Math.PI)),
      uv: [center[0] + r * c, center[1] + r * s],
    });
  }
  return points;
}

// Rows across [0,1]², boustrophedon, joined at their ends into one line.
export function rowsWalk({ phase = 0, pitch, step }) {
  const points = [];
  let row = 0;
  for (let v = pitch * phase; v <= 1; v += pitch) {
    const n = Math.ceil(1 / step);
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      points.push({ normal: [0, 1], turn: row, uv: [row % 2 ? 1 - t : t, v] });
    }
    row += 1;
  }
  return points;
}

// The walk drawn as a fill: each base point swings along its normal by
// `amplitude(tone)` of half a pitch, once every `wavelength(tone)` output
// px travelled on screen (so foreshortening can't squeeze the wave), and
// `sample(uv, point)` says what lies under it — null (lift the pen) or
// { region, x, y, tone, spread? }, where `spread` widens the swing for a
// walk that skips turns there. The line splits wherever the region
// changes, so one walk becomes one long stroke per region: a layer each.
export function regionFill({
  amplitude = (tone) => tone,
  pitch,
  sample,
  simplifyPx = 0.15,
  walk,
  wavelength,
}) {
  const byRegion = {};
  let run = [];
  let region = null;
  let phase = 0;
  let last = null;
  const flush = () => {
    if (region && run.length > 1) {
      byRegion[region] ??= [];
      byRegion[region].push(
        simplify(run, simplifyPx).map(([x, y]) => ({ x, y }))
      );
    }
    run = [];
  };
  walk.forEach((point) => {
    const { normal, uv } = point;
    const base = sample(uv, point);
    let hit = null;
    if (base) {
      if (last) {
        const along = Math.hypot(base.x - last[0], base.y - last[1]);
        phase += (2 * Math.PI * along) / Math.max(wavelength(base.tone), 1e-6);
      }
      const swing =
        (pitch / 2) *
        (base.spread ?? 1) *
        amplitude(base.tone) *
        Math.sin(phase);
      hit = swing
        ? sample([uv[0] + normal[0] * swing, uv[1] + normal[1] * swing], {
            ...point,
            swung: true,
          })
        : base;
    }
    last = base ? [base.x, base.y] : null;
    const next = hit?.region ?? null;
    if (next !== region) {
      flush();
      region = next;
    }
    if (hit) run.push([hit.x, hit.y]);
  });
  flush();
  return byRegion;
}
