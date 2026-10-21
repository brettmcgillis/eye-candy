import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT = 'output';
const ROOTS = [
  { dir: OUTPUT, slugOf: (first) => first.replace(/-workbench$/u, '') },
  { dir: path.join('public', 'images'), slugOf: (first) => first },
];
const SKIP = ['plotterizer', '.thumbs'];
const META_CACHE = path.join(OUTPUT, '.thumbs', 'plots.json');
const AT_ONCE = 8;

const toolOf = (slug) =>
  slug.replace(/-([a-z0-9])/gu, (_, letter) => letter.toUpperCase());
const posix = (file) => file.split(path.sep).join('/');
const readJson = (file) => readFile(file, 'utf8').then(JSON.parse, () => null);

async function walkSvgs(dir, found) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walkSvgs(full, found);
      else if (entry.name.endsWith('.svg')) found.push(full);
    })
  );
  return found;
}

const mmOf = (value) => {
  const match = /^\s*([\d.]+)\s*(mm|cm|in)\s*$/u.exec(value ?? '');
  if (!match) return null;
  return Number(match[1]) * { cm: 10, in: 25.4, mm: 1 }[match[2]];
};

// What an SVG's own bytes say: its physical size and how many pen layers
// (or, for loose strokes, stroke colours) it holds.
async function readPlotMeta(file) {
  const text = await readFile(file, 'latin1');
  const root = /<svg\b([^>]*)>/u.exec(text)?.[1] ?? '';
  const attr = (name) =>
    new RegExp(`\\s${name}="([^"]*)"`, 'u').exec(root)?.[1] ?? null;
  const groups = (text.match(/inkscape:groupmode="layer"/gu) ?? []).length;
  const strokes = groups
    ? 0
    : new Set(text.match(/stroke="#[0-9a-fA-F]{3,6}"/gu) ?? []).size;
  return {
    heightMm: mmOf(attr('height')),
    layers: groups || strokes,
    widthMm: mmOf(attr('width')),
  };
}

// What a generation is, from its props.json: who (skin, species, palette)
// and how it is drawn (fill, shading, inks, line style).
function describe(props) {
  const render = props?.render ?? {};
  const preset = props?.preset ?? {};
  const pick = (key) => preset[key] ?? render[key];
  const vague = (value) => !value || ['Random', 'None', 'none'].includes(value);
  const species = pick('species')
    ? `${pick('birdCount') > 1 ? `${pick('birdCount')} ` : ''}${pick('species')}`
    : null;
  const identity =
    [pick('skin'), species, pick('palette'), pick('blobPalette')].find(
      (value) => !vague(value)
    ) ?? null;
  const style = [];
  const fill = render.svgFill;
  if (fill && fill !== 'none')
    style.push(fill === true ? 'fill' : `${fill} fill`);
  if (render.svgShading && render.svgShading !== 'none') {
    style.push(render.svgShading);
  }
  if (render.svgColors > 0) style.push(`${render.svgColors} inks`);
  if (render.svgWiggle > 0) style.push('wiggle');
  if (render.svgStyle && !['none', 'plot'].includes(render.svgStyle)) {
    style.push(render.svgStyle);
  }
  return {
    identity,
    plotWidthMm: render.plotWidthMm ?? render.svgWidthMm ?? null,
    style,
  };
}

// Every bench SVG, run (output/) or kept (public/images/), with what the
// picker shows: its bench and job, what it is and how it is drawn, its
// size and layers, and the props.json a re-render at another size needs.
// SVG facts are cached by modification time, so only new plots are read.
export default async function listSources(root) {
  const cacheFile = path.join(root, META_CACHE);
  const cache = (await readJson(cacheFile)) ?? {};
  const jobs = new Map();
  const jobOf = (dir) => {
    if (!jobs.has(dir)) {
      jobs.set(
        dir,
        readJson(path.join(dir, 'manifest.json')).then(
          (m) => m?.createdAt ?? null
        )
      );
    }
    return jobs.get(dir);
  };

  const files = (
    await Promise.all(
      ROOTS.map(async ({ dir, slugOf }) => {
        const base = path.join(root, dir);
        return (await walkSvgs(base, [])).map((file) => ({
          base,
          file,
          kept: dir !== OUTPUT,
          slugOf,
        }));
      })
    )
  ).flat();

  const entries = [];
  for (let i = 0; i < files.length; i += AT_ONCE) {
    // eslint-disable-next-line no-await-in-loop
    const batch = await Promise.all(
      files.slice(i, i + AT_ONCE).map(async ({ base, file, kept, slugOf }) => {
        const [first, ...rest] = posix(path.relative(base, file)).split('/');
        if (SKIP.includes(first)) return null;
        const relative = posix(path.relative(root, file));
        const info = await stat(file);
        const stamp = `${info.mtimeMs}:${info.size}`;
        if (cache[relative]?.stamp !== stamp) {
          cache[relative] = { stamp, ...(await readPlotMeta(file)) };
        }
        const propsFile = path.join(path.dirname(file), 'props.json');
        const props = await readJson(propsFile);
        const inJob = !kept && rest[0] === 'jobs' && rest.length > 2;
        let collectionId = rest.length > 1 ? rest[0] : 'loose';
        if (inJob) [, collectionId] = rest;
        const createdAt = inJob
          ? await jobOf(path.join(base, first, 'jobs', rest[1]))
          : null;
        const { heightMm, layers, widthMm } = cache[relative];
        const about = describe(props);
        const slug = slugOf(first);
        return {
          bytes: info.size,
          collection: {
            createdAt: createdAt ?? info.mtime.toISOString(),
            id: `${kept ? 'kept' : 'run'}:${slug}:${collectionId}`,
          },
          generation: rest.length > 2 ? rest.at(-2) : null,
          heightMm,
          identity: about.identity,
          kept,
          layers,
          modified: info.mtime.toISOString(),
          name: rest.at(-1),
          path: relative,
          props: props ? posix(path.relative(root, propsFile)) : null,
          slug,
          style: about.style,
          tool: toolOf(slug),
          widthMm: widthMm ?? about.plotWidthMm,
        };
      })
    );
    entries.push(...batch.filter(Boolean));
  }

  const live = new Set(entries.map((entry) => entry.path));
  Object.keys(cache).forEach((key) => {
    if (!live.has(key)) delete cache[key];
  });
  await mkdir(path.dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(cache));
  return entries.sort((a, b) => b.modified.localeCompare(a.modified));
}
