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

// yuv420p needs even dimensions, and the scale filter guards against an odd
// --width slipping through.
const SIZE_FILTER = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';

export default function createFrameSink({ fps, height, out, width }) {
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
      '-vf',
      `${SIZE_FILTER},format=yuv420p`,
      '-c:v',
      'libx264',
      '-crf',
      '17',
      '-preset',
      'slow',
      out,
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
