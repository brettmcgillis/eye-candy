export default function renderSkeletonSvg(
  specimen,
  { width = 900, height = 1200, growth = 1 } = {}
) {
  const { segments } = specimen;
  const top = specimen.height * 1.08;
  const scale = height / top;
  const cx = width / 2;
  const toX = (x) => (cx + x * scale).toFixed(1);
  const toY = (y) => (height - y * scale).toFixed(1);
  const layers = [[], [], [], []];

  for (let k = 0; k < segments.count; k += 1) {
    const i = k * 4;
    const b0 = segments.time[i];
    const b1 = segments.time[i + 1];

    if (b0 <= growth) {
      const g = Math.min(1, (growth - b0) / Math.max(b1 - b0, 1e-6));
      const x0 = segments.start[i];
      const y0 = segments.start[i + 1];
      const x1 = x0 + (segments.end[i] - x0) * g;
      const y1 = y0 + (segments.end[i + 1] - y0) * g;
      const thickness = segments.end[i + 3];
      const layer = Math.min(3, Math.max(0, Math.floor(thickness * 4)));

      layers[layer].push(`M${toX(x0)} ${toY(y0)}L${toX(x1)} ${toY(y1)}`);
    }
  }

  const widths = [0.35, 0.8, 1.6, 3];
  const paths = layers
    .map((d, l) =>
      d.length
        ? `<path d="${d.join('')}" stroke="#e8f2ea" stroke-opacity="${l ? 0.9 : 0.35}" stroke-width="${widths[l]}" fill="none"/>`
        : ''
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#070707"/>${paths}</svg>`;
}
