import { spawn } from 'node:child_process';
import { stat, writeFile } from 'node:fs/promises';

export const ENCODING = {
  codec: 'libx264',
  crf: 17,
  pixelFormat: 'yuv420p',
  preset: 'slow',
};

function capture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${command} exited ${code}\n${stderr.slice(-2000)}`))
    );
  });
}

function parseRate(rate) {
  const [numerator, denominator] = String(rate).split('/').map(Number);
  return denominator ? numerator / denominator : numerator;
}

export async function probeVideo(file) {
  const stdout = await capture('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-count_frames',
    '-count_packets',
    '-show_entries',
    'stream=codec_name,profile,width,height,pix_fmt,avg_frame_rate,nb_frames,nb_read_frames,nb_read_packets,bit_rate:format=format_name,duration,size,bit_rate',
    '-of',
    'json',
    file,
  ]);
  const probe = JSON.parse(stdout);
  const stream = probe.streams?.[0] ?? {};
  const format = probe.format ?? {};
  const { size } = await stat(file);
  return {
    bitRate: Number(format.bit_rate || stream.bit_rate) || null,
    codec: stream.codec_name ?? null,
    durationSeconds: Number(format.duration) || null,
    fileSizeBytes: Number(format.size) || size,
    format: format.format_name ?? null,
    frameCount:
      Number(
        stream.nb_frames || stream.nb_read_frames || stream.nb_read_packets
      ) || null,
    frameRate: parseRate(stream.avg_frame_rate) || null,
    height: stream.height ?? null,
    pixelFormat: stream.pix_fmt ?? null,
    profile: stream.profile ?? null,
    width: stream.width ?? null,
  };
}

// The sidecar sits beside the clip under the same basename, which is how the
// workbench galleries pair a video with its recipe. `presets` and `render` are
// the recipe; `video` is measured after encoding.
export async function writeVideoSidecar(out, { presets, render, ...extra }) {
  const metadataPath = out.replace(/\.[^.]+$/u, '.json');
  const metadata = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    presets,
    render,
    ...extra,
    encoding: ENCODING,
    video: await probeVideo(out),
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return metadataPath;
}
