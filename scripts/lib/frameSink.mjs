import { spawn } from 'node:child_process';

// A frame sequence written straight into ffmpeg's stdin as raw RGBA, instead of
// PNGs written to a temp directory and read back.
//
// Three costs go away at once: the PNG encode per frame, the write and the
// eventual delete, and ffmpeg's own decode of everything we just encoded. The
// fourth gain is the one that does not show up in a per-frame number — the
// encode now runs *while* the next frame renders, rather than as a second pass
// over the whole clip.
//
// It also removes the temp directory, and with it the 11GB a 900-frame clip at
// 1206x2622 would have occupied had the frames been written uncompressed.
//
// Stills montages do not come through here: they are a handful of images with a
// duration and a crossfade each, which is the concat demuxer's job, and their
// encode is not where any time goes.

// iOS hardware H.264 decode has no software fallback in Safari, and in
// practice refuses to touch a frame taller or wider than this regardless of
// what the H.264 level spec allows — a custom render above it played on every
// desktop browser but not a single iPhone.
const MAX_VIDEO_DIMENSION = 3840;

// yuv420p needs even dimensions, and the scale filter guards against an odd
// --width slipping through. The first scale only engages once a dimension
// clears MAX_VIDEO_DIMENSION, so ordinary renders pass through untouched.
export const SIZE_FILTER =
  `scale='min(iw,${MAX_VIDEO_DIMENSION})':'min(ih,${MAX_VIDEO_DIMENSION})':` +
  `force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;

const ENCODERS = {
  mp4: [
    '-c:v',
    'libx264',
    '-crf',
    '17',
    '-preset',
    'slow',
    // moov atom up front: iOS Safari refuses to play a progressively
    // fetched mp4 whose index is only written after encoding finishes.
    '-movflags',
    '+faststart',
  ],
  webm: [
    '-c:v',
    'libvpx-vp9',
    '-crf',
    '20',
    '-b:v',
    '0',
    '-row-mt',
    '1',
    '-deadline',
    'good',
    '-cpu-used',
    '2',
    // libvpx drops the alpha plane when alt-ref frames are on.
    '-auto-alt-ref',
    '0',
  ],
};

export const VIDEO_FORMATS = Object.keys(ENCODERS);

// `out` names the clip; each ticked video format is written beside it. A
// kernel without the format keys yet writes the MP4 alone.
export function videoOutputs(options, out) {
  const stem = out.replace(/\.(mp4|webm)$/u, '');
  const ticked = VIDEO_FORMATS.filter((format) => options[format]);
  const formats =
    ticked.length > 0 || VIDEO_FORMATS.some((format) => format in options)
      ? ticked
      : ['mp4'];
  return formats.map((format) => ({ file: `${stem}.${format}`, format }));
}

// One ffmpeg run per clip, split into every format asked for. A transparent
// clip keeps its alpha in WebM; MP4 has none, so it is laid over `background`.
function filterGraph({ background, fps, height, outputs, transparent, width }) {
  const chains = outputs.map(({ format }, index) => {
    const alpha = transparent && format === 'webm';
    const steps = `${SIZE_FILTER},format=${alpha ? 'yuva420p' : 'yuv420p'}`;
    if (!transparent || alpha) return `[i${index}]${steps}[o${index}]`;
    return (
      `color=c=${background}:s=${width}x${height}:r=${fps}[bg${index}];` +
      `[bg${index}][i${index}]overlay=shortest=1,${steps}[o${index}]`
    );
  });
  const split =
    outputs.length === 1
      ? '[0:v]null[i0]'
      : `[0:v]split=${outputs.length}${outputs.map((_, i) => `[i${i}]`).join('')}`;
  return [split, ...chains].join(';');
}

export default function createFrameSink({
  background = '#000000',
  fps,
  height,
  out,
  outputs = [{ file: out, format: 'mp4' }],
  transparent = false,
  width,
}) {
  const child = spawn(
    'ffmpeg',
    [
      '-y',
      '-f',
      'rawvideo',
      '-pixel_format',
      'rgba',
      '-video_size',
      `${width}x${height}`,
      '-framerate',
      String(fps),
      '-i',
      'pipe:0',
      '-filter_complex',
      filterGraph({ background, fps, height, outputs, transparent, width }),
      ...outputs.flatMap(({ file, format }, index) => [
        '-map',
        `[o${index}]`,
        ...ENCODERS[format],
        file,
      ]),
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] }
  );

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  // If ffmpeg exits early the pipe is broken, and every subsequent write raises
  // EPIPE from a place that has no idea what went wrong. Held here so `finish`
  // can report ffmpeg's own error instead.
  let failure = null;
  const closed = new Promise((resolve) => {
    child.on('error', (error) => {
      failure = failure ?? error;
      resolve(null);
    });
    child.on('close', (code) => resolve(code));
  });
  child.stdin.on('error', (error) => {
    failure = failure ?? error;
  });

  const expectedBytes = width * height * 4;

  return {
    async write(frame) {
      if (failure) return;
      if (frame.length !== expectedBytes) {
        throw new Error(
          `frame is ${frame.length} bytes, expected ${expectedBytes} for ${width}x${height} rgba`
        );
      }
      // Backpressure is real here: a frame is 12.6MB at 1206x2622, and x264 on
      // a slow preset will not always keep up with the renderer.
      if (!child.stdin.write(frame)) {
        await new Promise((resolve) => {
          child.stdin.once('drain', resolve);
        });
      }
    },

    async finish() {
      child.stdin.end();
      const code = await closed;
      if (failure) throw failure;
      if (code !== 0) {
        throw new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`);
      }
    },
  };
}

// Re-encodes a finished clip into another format, for encoders that write one
// file through ffmpeg filters of their own (Rorschach's montage).
export function transcodeVideo(from, to, format) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'ffmpeg',
      ['-y', '-i', from, '-vf', 'format=yuv420p', ...ENCODERS[format], to],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(to)
        : reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`))
    );
  });
}
