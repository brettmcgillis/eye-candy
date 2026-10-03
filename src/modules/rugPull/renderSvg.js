// The knot chart as SVG: one path per yarn, each row's runs merged into
// rectangles, so a plotter or a vector editor sees the cartoon a weaver reads.
export default function renderRugSvg(build, { scale = 4 } = {}) {
  const { cols, colors, roles, rows } = build;
  const paths = colors.map(() => []);
  for (let y = 0; y < rows; y += 1) {
    let x = 0;
    while (x < cols) {
      const role = roles[y * cols + x];
      let end = x + 1;
      while (end < cols && roles[y * cols + end] === role) end += 1;
      paths[role].push(
        `M${x * scale} ${y * scale}h${(end - x) * scale}v${scale}h${-(end - x) * scale}z`
      );
      x = end;
    }
  }
  const body = paths
    .map((d, role) =>
      d.length ? `  <path fill="${colors[role]}" d="${d.join('')}"/>` : ''
    )
    .filter(Boolean)
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * scale}" height="${rows * scale}" viewBox="0 0 ${cols * scale} ${rows * scale}" shape-rendering="crispEdges">\n${body}\n</svg>\n`;
}
