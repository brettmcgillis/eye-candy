/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

import { sizePlot } from '../../src/dev/tools/plotterizer/kernel/index.mjs';
import inkLayers from '../../src/modules/plotKit/inkLayers.mjs';
import { parseArgs, providedKeys, readPackageVersion } from './cliArgs.mjs';
import createFrameSink, { videoOutputs } from './frameSink.mjs';
import { loadThree, setClock } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import overlayLayer from './overlayLayer.mjs';
import createProgress, { runStage } from './progress.mjs';
import { writeVideoSidecar } from './videoMetadata.mjs';

// The plumbing every schema generator's CLIs share; see
// docs/render-workbench.md. A tool's scripts/<slug>-{generate,video}.mjs is a
// runStills / runVideo call, and its scripts/lib/<tool>Render.mjs holds only
// its capturer and kernel-specific steps.

export { REPO_ROOT, videoOutputs };

export const DEG = Math.PI / 180;

export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dotOf = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function normalize(v) {
  const length = Math.hypot(...v) || 1;
  return v.map((value) => value / length);
}

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernelModules(entries) {
  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules(Object.values(entries));
  return {
    THREE,
    TSL,
    ...Object.fromEntries(
      Object.entries(entries).map(([name, entry]) => [name, loaded[entry]])
    ),
  };
}

// A json option may name a file, and a file may be a props.json sidecar;
// either way the caller gets the payload.
export async function readJsonOption(value) {
  if (value == null || typeof value !== 'string') return value;
  if (/^\s*[[{]/u.test(value)) return JSON.parse(value);
  return JSON.parse(await readFile(value, 'utf8'));
}

// A typed flag is a pin; the set is read before defaults are merged.
export function createParseCli({
  RENDER_OPTIONS,
  canonicalArgv = (argv) => argv,
  defaultsFor,
  normalizeOptions,
}) {
  return async function parseCli(kind, argv) {
    const args = parseArgs(canonicalArgv(argv), defaultsFor(kind));
    if (args.help) return { help: true };
    const raw = { ...args };
    await Promise.all(
      Object.entries(RENDER_OPTIONS)
        .filter(([, spec]) => spec.type === 'json' && !spec.sceneOnly)
        .map(async ([key]) => {
          raw[key] = await readJsonOption(args[key]);
        })
    );
    return { options: normalizeOptions(kind, raw), typed: providedKeys(args) };
  };
}

export const keepList = (options) =>
  String(options.keep ?? '')
    .split(',')
    .map((facet) => facet.trim())
    .filter(Boolean);

// The scene keys the caller typed, which the roll must hold.
export function pinnedFrom({ options, typed }, sceneKeys) {
  const scene = new Set(sceneKeys);
  return Object.fromEntries(
    [...typed].filter((key) => scene.has(key)).map((key) => [key, options[key]])
  );
}

// Render options as a sidecar records them: no roll inputs.
export const renderRecord = (options) => ({
  ...options,
  base: undefined,
  bouquet: undefined,
  capture: undefined,
  out: undefined,
  palettes: undefined,
});

export function sidecarFor({ config, name, options }) {
  return { name, preset: config, render: renderRecord(options) };
}

const rgba = (data) =>
  Buffer.isBuffer(data) ? data : Buffer.from(data.buffer ?? data);

// A frame is raw RGBA (`{ data, width, height }`) or anything sharp reads: an
// encoded image, an SVG. `overlay` (overlayLayer's arguments) composites the
// chrome onto the pixels so a frame is encoded exactly once.
export async function encodeFrame(frame, format, overlay = null) {
  const raw = frame.data !== undefined;
  let image = raw
    ? sharp(rgba(frame.data), {
        raw: { channels: 4, height: frame.height, width: frame.width },
      })
    : sharp(frame);
  if (overlay) {
    const { height, width } = raw ? frame : await image.metadata();
    image = image.composite([
      { input: await overlayLayer({ ...overlay, height, width }) },
    ]);
  }
  if (format === 'raw') return image.ensureAlpha().raw().toBuffer();
  if (format === 'webp') return image.webp({ lossless: true }).toBuffer();
  return image.png().toBuffer();
}

// The overlay chrome a generator stamps on its frames. A spec names the scene
// icon it wears as `overlay: sceneIconFile('<slug>')` and the drivers do the
// rest: `--overlay` composites it onto every still and video frame.
export const overlayFor = (icon, options) =>
  icon && options.overlay
    ? {
        icon,
        ig: options.ig === 'none' ? null : options.ig,
        version: options.version,
        viewport: options.viewport,
      }
    : null;

export async function withRenderer(options, create, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    create
  );
  try {
    return await work(capturer);
  } finally {
    capturer.dispose();
  }
}

// A capturer's plot SVG, with hidden lines dropped through a depth pass when
// svgOcclusion asks.
export async function capturerSvg(capturer, framing, options) {
  const visible = options.svgOcclusion
    ? capturer.depthProbe(await capturer.captureDepth(framing))
    : null;
  return capturer.svg(framing, options, visible);
}

// A turntable spins each item `turns` times; any other clip drifts by
// `orbit` degrees across the whole video.
export const azimuthOffset = (options, { frame, frames, total, written }) =>
  options.mode === 'turntable'
    ? (360 * options.turns * frame) / frames
    : (options.orbit * written) / total;

export const plotOf = (options) => ({
  inks: options.svgColors ?? 0,
  plotWidthMm: options.plotWidthMm,
  svg: Boolean(options.svg),
});

// Every plot leaves the bench through here: regrouped into `inks` layers
// when asked, then sized for the page.
export async function writePlot(filePath, svg, plot) {
  if (!plot.svg) return;
  const inked = plot.inks > 0 ? inkLayers(svg, plot.inks) : svg;
  await writeFile(filePath, sizePlot(inked, plot.plotWidthMm));
}

// Dawn keeps the event loop alive after the renderer is disposed, so a run
// exits explicitly; `--help` returns false and lets stdout drain instead.
function runMain(main) {
  main()
    .then((ran) => {
      if (ran !== false) process.exit(0);
    })
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error}\n`);
      process.exit(1);
    });
}

async function begin(kind, { overlay, parseCli, prepare, script, usageFor }) {
  const parsed = await parseCli(kind, process.argv.slice(2));
  if (parsed.help) {
    const command = kind === 'still' ? 'generate' : 'video';
    process.stdout.write(
      `Usage: npm run ${script}:${command} -- [options]\n${usageFor(kind)}`
    );
    return null;
  }
  const prepared = prepare ? await prepare(parsed.options) : parsed.options;
  const ready = overlay
    ? { ...prepared, version: await readPackageVersion() }
    : prepared;
  return { ...parsed, options: ready, plot: plotOf(ready) };
}

const formatsOf = (options) => ['webp'].filter((format) => options[format]);

// What a transparent clip's MP4 is laid over: the kernel's background
// colour, under whichever name its schema gives it.
const BACKGROUND_KEYS = [
  'backgroundColor',
  'background',
  'bgColor',
  'sceneBackgroundColor',
  'sceneBgColor',
  'studioBackground',
];
const backgroundOf = (options) =>
  BACKGROUND_KEYS.map((key) => options[key]).find(
    (value) => typeof value === 'string' && value.startsWith('#')
  ) ?? '#000000';

const sizeOf = (options) =>
  `${options.width}x${options.height} at ${options.pixelRatio}x`;

// A Live-tab capture folder (live.png, optional live.svg, capture.json) as
// the dev server staged it (src/dev/server/renderJobs/liveCapture.js).
export async function readCapture(folder) {
  const dir = path.resolve(REPO_ROOT, folder);
  const manifest = JSON.parse(
    await readFile(path.join(dir, 'capture.json'), 'utf8')
  );
  return { ...manifest, dir };
}

// A Live-tab capture arrives rendered: the page drew the PNG and the plot
// from the running stage, and this only finishes it the way any still is
// finished — formats, overlay and sidecar — then drops the upload.
export async function finishCapture({ capture, options, save }) {
  const out = await save(
    capture.name,
    sidecarFor({ config: capture.config, name: capture.name, options })
  );
  await out.view('live', async () => {
    await out.image('live', () => readFile(path.join(capture.dir, 'live.png')));
    if (options.svg && capture.svg) {
      await out.svg(
        'live',
        await readFile(path.join(capture.dir, 'live.svg'), 'utf8')
      );
    }
  });
  await rm(capture.dir, { force: true, recursive: true });
}

// Set by the workbench job runner (src/dev/server/renderJobs/jobService.js):
// `{ batch, next }` from the run it is resuming, `{}` for a fresh one.
const jobState = process.env.RENDER_JOB_STATE
  ? JSON.parse(process.env.RENDER_JOB_STATE)
  : null;

// The stills CLI. `item(ctx)` makes one generation: roll it, `save` it (its
// folder and props.json), then write its images and SVGs. The driver owns
// argv, the banner, the kernel, the progress bar and the renderer.
//
//   ctx: { capturer, formats, index, kernel, options, typed, views,
//          step(label, fn),
//          save(name, sidecar) → { dir, file, image, svg, view, eachView } },
//          ...setup(ctx) }
export function runStills(spec) {
  runMain(async () => {
    const parsed = await begin('still', spec);
    if (!parsed) return false;
    const { options, plot, typed } = parsed;
    const views = spec.resolveViews ? spec.resolveViews(options.views) : null;
    const formats = formatsOf(options);
    const labels = [...formats, plot.svg ? 'svg' : null].filter(Boolean);
    const outRoot = path.resolve(REPO_ROOT, String(options.out));
    const nouns =
      typeof spec.nouns === 'function' ? spec.nouns(options) : spec.nouns;

    await mkdir(outRoot, { recursive: true });
    process.stdout.write(
      `${spec.title} stills: ${options.count} ${nouns}, ` +
        `${views ? `${views.length} views each, ` : ''}${sizeOf(options)}, ` +
        `formats ${labels.join('+')}\noutput: ${outRoot}\n`
    );

    // `--capture` finishes a Live-tab frame instead of rendering: no kernel,
    // no renderer, one generation.
    const capture =
      options.capture && options.count === 1
        ? await readCapture(options.capture)
        : null;
    const kernel = capture
      ? null
      : await runStage(
          `loading the ${spec.kernelLabel} kernel`,
          spec.loadKernel
        );
    const base = { formats, kernel, options, parsed, typed, views };
    const context = capture
      ? { ...base, capture }
      : { ...base, ...(await spec.setup?.(base)) };
    const item = capture
      ? (ctx) => (ctx.index === 0 ? finishCapture(ctx) : null)
      : spec.item;
    if (jobState?.batch != null && context.batch != null) {
      context.batch = jobState.batch;
    }
    const units = views?.length || 1;
    const progress = createProgress(
      spec.progressLabel ?? 'rendering views',
      options.count * units
    );
    const first = Math.min(jobState?.next ?? 0, options.count);
    const reportState = (next) => {
      if (jobState) {
        progress.log(
          `job-state: ${JSON.stringify({ batch: context.batch, next })}`
        );
      }
    };
    reportState(first);
    if (first > 0) {
      progress.log(`resuming at ${first + 1}/${options.count}`);
      progress.update(first * units);
    }
    const overlay = overlayFor(spec.overlay, options);
    const encode = spec.encode
      ? (frame, format) => spec.encode(frame, format, options)
      : (frame, format) => encodeFrame(frame, format, overlay);

    const work = async (capturer) => {
      for (let index = first; index < options.count; index += 1) {
        let saved = null;
        let done = 0;
        const save = async (name, sidecar) => {
          const dir = path.join(outRoot, name);
          await mkdir(dir, { recursive: true });
          await writeFile(
            path.join(dir, 'props.json'),
            `${JSON.stringify(sidecar, null, 2)}\n`
          );
          const file = (fileName, data) =>
            fileName.endsWith('.svg')
              ? writePlot(path.join(dir, fileName), data, plot)
              : writeFile(path.join(dir, fileName), data);
          saved = {
            dir,
            file,
            async image(fileBase, produce) {
              if (formats.length === 0) return;
              const frame = await produce();
              await Promise.all(
                formats.map(async (format) =>
                  file(`${fileBase}.${format}`, await encode(frame, format))
                )
              );
            },
            name,
            svg: (fileBase, text) => file(`${fileBase}.svg`, text),
            async view(view, fn) {
              await progress.stage(`rendering ${name}, ${view}`, fn);
              done += 1;
              progress.update(index * units + Math.min(done, units));
            },
          };
          saved.eachView = async (fn) => {
            for (let v = 0; v < views.length; v += 1) {
              await saved.view(views[v], () => fn(views[v]));
            }
          };
          return saved;
        };
        await item({
          ...context,
          capturer,
          index,
          save,
          step: (label, fn) => progress.stage(label, fn),
        });
        progress.update((index + 1) * units);
        if (saved) progress.log(`saved ${saved.name}: ${saved.dir}`);
        reportState(index + 1);
      }
    };

    const gpu =
      !capture && (spec.gpu ? spec.gpu(context) : Boolean(spec.withCapturer));
    if (gpu) await spec.withCapturer(kernel, options, work);
    else await work(null);
    progress.done(spec.doneLabel ?? 'rendered views');
    return true;
  });
}

// The video CLI. `plan(ctx)` returns `{ shots, presets(), sidecar?(), gpu?,
// finish?(write), cleanup?(), overlay?: false }` (false: the frames are
// already finished, so `--overlay` leaves them alone); a shot is `{ frames, enter?(capturer),
// frame(capturer, clock), exit?() }`, where `frame` returns the RGBA to write
// (an image or its buffer, or null to hold it back) and `clock` is
// `{ frame, frames, seconds, total, written }`.
export function runVideo(spec) {
  runMain(async () => {
    const parsed = await begin('video', spec);
    if (!parsed) return false;
    const { options, typed } = parsed;
    const out = path.resolve(REPO_ROOT, String(options.out));
    const nouns =
      typeof spec.nouns === 'function' ? spec.nouns(options) : spec.nouns;

    const outputs = videoOutputs(options, out);

    await mkdir(path.dirname(out), { recursive: true });
    process.stdout.write(
      `${spec.title} video: ${options.mode ? `mode ${options.mode}, ` : ''}` +
        `${options.count} ${nouns}, ${sizeOf(options)}, ${options.fps}fps` +
        `${options.transparent ? ', transparent' : ''}\n` +
        `output: ${outputs.map(({ file }) => file).join(', ')}\n`
    );

    const kernel = await runStage(
      `loading the ${spec.kernelLabel} kernel`,
      spec.loadKernel
    );
    const base = { kernel, options, parsed, typed };
    const context = { ...base, ...(await spec.setup?.(base)) };
    const plan = await spec.plan(context);
    const total = plan.shots.reduce((sum, shot) => sum + shot.frames, 0);
    const progress = createProgress('rendering frames', total);
    const size = spec.size?.(options) ?? {
      height: options.height * options.pixelRatio,
      width: options.width * options.pixelRatio,
    };
    const sink = createFrameSink({
      ...size,
      background: spec.background?.(options) ?? backgroundOf(options),
      fps: options.fps,
      outputs,
      transparent: Boolean(options.transparent),
    });
    // A plan that replays finished frames (`overlay: false`) already carries
    // whatever chrome they were rendered with.
    const overlay =
      plan.overlay === false ? null : overlayFor(spec.overlay, options);
    let stampedFrom = null;
    let stampedTo = null;
    // A held still comes back as the same buffer every frame: stamp it once.
    const stamped = async (frame) => {
      const data = frame.data ?? frame;
      if (!overlay) return data;
      if (data !== stampedFrom) {
        stampedTo = await encodeFrame({ data, ...size }, 'raw', overlay);
        stampedFrom = data;
      }
      return stampedTo;
    };

    let written = 0;
    const work = async (capturer) => {
      for (let s = 0; s < plan.shots.length; s += 1) {
        const shot = plan.shots[s];
        await shot.enter?.(capturer, { progress });
        for (let frame = 0; frame < shot.frames; frame += 1) {
          setClock(written / options.fps);
          const image = await shot.frame(capturer, {
            frame,
            frames: shot.frames,
            seconds: frame / options.fps,
            total,
            written,
          });
          if (image) await sink.write(await stamped(image));
          written += 1;
          progress.update(written);
        }
        await shot.exit?.({ progress });
      }
      await plan.finish?.(async (data) => sink.write(await stamped(data)));
    };

    try {
      const gpu = plan.gpu ?? Boolean(spec.withCapturer);
      if (gpu) await spec.withCapturer(kernel, options, work);
      else await work(null);
    } finally {
      await runStage('finishing encode', () => sink.finish());
      await plan.cleanup?.();
    }
    progress.done('rendered frames');

    const metadataPath = await writeVideoSidecar(outputs[0].file, {
      ...plan.sidecar?.(),
      presets: plan.presets(),
      render: renderRecord(options),
    });
    process.stdout.write(
      `saved video: ${outputs.map(({ file }) => file).join(', ')}\n` +
        `saved metadata: ${metadataPath}\n`
    );
    return true;
  });
}
