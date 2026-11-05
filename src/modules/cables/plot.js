import { createProjector } from '@modules/plotKit';

const SAMPLE_PX = 1.2;
const FMT = (v) => v.toFixed(1);

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return v.map((c) => c / length);
};

// The world polylines a cable is plotted as: its two silhouette edges (the
// centre pushed ±radius across the view), or its centre line.
function linesOf(points, radius, eye, style) {
  const n = points.length / 3;
  const at = (i) => [points[i * 3], points[i * 3 + 1], points[i * 3 + 2]];
  if (style === 'centerline')
    return [
      { lift: radius, points: Array.from({ length: n }, (_, i) => at(i)) },
    ];
  const left = [];
  const right = [];
  for (let i = 0; i < n; i += 1) {
    const p = at(i);
    const a = at(Math.max(i - 1, 0));
    const b = at(Math.min(i + 1, n - 1));
    const tangent = b.map((v, k) => v - a[k]);
    const side = normalize(
      cross(
        tangent,
        p.map((v, k) => eye[k] - v)
      )
    );
    left.push(p.map((v, k) => v + side[k] * radius));
    right.push(p.map((v, k) => v - side[k] * radius));
  }
  return [
    { lift: 0, points: left },
    { lift: 0, points: right },
  ];
}

// A pen per cable colour; `visible(x, y, depth)` drops what a nearer cable
// hides. A centre line sits `radius` behind the tube's near face, so it is
// tested that much nearer.
export default function renderCablesSvg({
  camera,
  generation,
  height,
  stroke,
  style = 'outline',
  visible = null,
  width,
}) {
  const project = createProjector(camera, width, height);
  const { radius } = generation;
  const pens = new Map();
  const inFrame = (p) => p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height;

  generation.cables.forEach(({ color, points }) => {
    const key = color.toLowerCase();
    if (!pens.has(key)) pens.set(key, []);
    const runs = pens.get(key);
    linesOf(points, radius, camera.eye, style).forEach(
      ({ lift, points: line }) => {
        let run = [];
        const flush = () => {
          if (run.length > 1) runs.push(run);
          run = [];
        };
        const shows = (q) =>
          q.depth > 0 &&
          inFrame(q) &&
          (!visible ||
            visible(q.x, q.y, q.depth - lift - (q.depth * 0.003 + 1e-4)));
        for (let i = 0; i < line.length; i += 1) {
          const a = line[Math.max(i - 1, 0)];
          const b = line[i];
          const pa = project(...a);
          const pb = project(...b);
          const steps =
            i === 0
              ? 1
              : Math.max(
                  1,
                  Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / SAMPLE_PX)
                );
          for (let s = i === 0 ? 0 : 1; s <= steps; s += 1) {
            const t = s / steps;
            const q =
              i === 0 ? pb : project(...a.map((v, k) => v + (b[k] - v) * t));
            if (b[1] < 0 && a[1] < 0) flush();
            else if (shows(q)) run.push(q);
            else flush();
          }
        }
        flush();
      }
    );
  });

  const layers = [...pens.entries()]
    .filter(([, runs]) => runs.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([hex, runs], index) => {
      const d = runs
        .map(
          (run) =>
            `M${FMT(run[0].x)} ${FMT(run[0].y)}${run
              .slice(1)
              .map((p) => `L${FMT(p.x)} ${FMT(p.y)}`)
              .join('')}`
        )
        .join('');
      return (
        `<g inkscape:groupmode="layer" inkscape:label="pen-${index} cables ${hex}" id="pen-${index}" ` +
        `fill="none" stroke="${hex}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="${d}"/></g>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${layers}</svg>`
  );
}
