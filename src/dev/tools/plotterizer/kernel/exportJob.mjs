import { passColors, writeDxf } from './dxf.mjs';
import { jobPasses } from './job.mjs';

const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');

// The job as DXF: every pass in one file, each pass's colour its own so
// Studio's Line Color tab lists one row per pen, plus a file per pass.
export function jobDxfs(job) {
  const passes = jobPasses(job);
  const colors = passColors(passes.map((pass) => pass.pen.color));
  const page = { heightMm: job.paper.heightMm, widthMm: job.paper.widthMm };
  const named = passes.map((pass, i) => ({
    aci: colors[i],
    name: `${i + 1}-${pass.pen.name}`,
    runs: pass.runs,
  }));
  const base = slug(job.name) || 'plot';
  return [
    { file: `${base}.dxf`, text: writeDxf({ ...page, passes: named }) },
    ...named.map((pass) => ({
      file: `${base}-pass-${slug(pass.name)}.dxf`,
      text: writeDxf({ ...page, passes: [pass] }),
    })),
  ];
}

const round = (value) => Math.round(value * 100) / 100;

export function jobSvg(job) {
  const { color, heightMm, widthMm } = job.paper;
  const layers = jobPasses(job).map(({ pen, runs }, i) => {
    const d = runs
      .map(
        ({ closed, points }) =>
          `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}${closed ? 'Z' : ''}`
      )
      .join('');
    return (
      `<g inkscape:groupmode="layer" inkscape:label="${i + 1} ${pen.name} ${pen.color}" ` +
      `fill="none" stroke="${pen.color}" stroke-width="${pen.nibMm}" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="${d}"/></g>`
    );
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 ${widthMm} ${heightMm}">` +
    `<rect width="${widthMm}" height="${heightMm}" fill="${color}"/>${layers.join('')}</svg>\n`
  );
}
