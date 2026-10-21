import { fetchFromBench } from './api';

const POLL_MS = 2000;
const DONE = ['completed', 'failed', 'cancelled'];

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

async function request(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? `Request failed (${response.status}).`);
  }
  return payload;
}

const fileName = (url) =>
  decodeURIComponent(new URL(url, window.location.origin).pathname)
    .split('/')
    .pop();

// The generation again at `widthMm`, through its own bench: the canvas
// scales with the plot so every pixel-measured spacing keeps its size on
// paper, and the bench's pen width becomes the nib's.
export function rerenderOptions(render, widthMm, nibMm) {
  const scale = widthMm / render.plotWidthMm;
  const rest = { ...render };
  delete rest.out;
  return {
    ...rest,
    count: 1,
    height: Math.max(16, Math.round(render.height * scale)),
    plotWidthMm: Math.round(widthMm * 10) / 10,
    png: false,
    svg: true,
    webp: false,
    width: Math.max(16, Math.round(render.width * scale)),
    ...('svgPenMm' in render ? { svgPenMm: nibMm } : {}),
  };
}

export async function readRender(propsUrl) {
  const response = await fetchFromBench(propsUrl);
  if (!response.ok) throw new Error('The generation has no props.json.');
  const { render } = await response.json();
  if (!render?.plotWidthMm || !render.width || !render.height) {
    throw new Error('This bench does not size its plots by plotWidthMm.');
  }
  return render;
}

export async function rerender({ nibMm, onProgress, source, widthMm }) {
  const render = await readRender(source.props);
  const api = `/dev-api/${source.tool}/jobs`;
  const { job } = await request(api, {
    body: JSON.stringify({
      kind: 'still',
      options: rerenderOptions(render, widthMm, nibMm),
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  let current = job;
  while (!DONE.includes(current.status)) {
    onProgress?.(current);
    // eslint-disable-next-line no-await-in-loop
    await wait(POLL_MS);
    // eslint-disable-next-line no-await-in-loop
    const { jobs } = await request(api);
    current = jobs.find((entry) => entry.id === job.id) ?? current;
  }
  if (current.status !== 'completed') {
    throw new Error(current.error ?? `The re-render ${current.status}.`);
  }
  const svgs = current.assets.filter((asset) => asset.path.endsWith('.svg'));
  const svg =
    svgs.find((asset) => asset.name === fileName(source.url)) ?? svgs[0];
  if (!svg) throw new Error('The re-render wrote no SVG.');
  const folder = svg.path.split('/').slice(0, -1).join('/');
  const props = current.assets.find(
    (asset) => asset.path === [folder, 'props.json'].filter(Boolean).join('/')
  );
  return {
    name: source.name,
    props: props?.url ?? null,
    tool: source.tool,
    url: svg.url,
  };
}
