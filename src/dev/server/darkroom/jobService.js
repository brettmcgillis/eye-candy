import path from 'node:path';

import createRenderJobService, {
  RenderJobRequestError,
} from '../renderJobs/jobService';
import {
  WORKBENCH_ROOT,
  countFrames,
  sessionPath,
  sourcePath,
} from './storage';

const FPS = [24, 25, 30, 60];

async function prepare(rootDir, { kind, outputDirectory, payload }) {
  const fail = (message) =>
    new RenderJobRequestError(400, 'INVALID_OPTION', message);
  const frames = sessionPath(rootDir, String(payload.session ?? ''));
  const frameCount = await countFrames(frames);
  if (frameCount === 0) throw fail('The export session has no frames.');
  if (typeof payload.technique !== 'string' || !payload.technique) {
    throw fail('technique is required.');
  }
  const fps = Number(payload.fps ?? 30);
  if (kind === 'video' && !FPS.includes(fps)) {
    throw fail(`fps must be one of ${FPS.join(', ')}.`);
  }
  const audio =
    kind === 'video' && payload.audio && payload.source?.name
      ? sourcePath(rootDir, payload.source.name)
      : null;
  const audioStart = Math.max(0, Number(payload.audioStart) || 0);

  const recipe = {
    options: payload.options ?? {},
    source: payload.source ?? null,
    technique: payload.technique,
  };
  const options = {
    audio: Boolean(audio),
    fps,
    frameCount,
    height: payload.height,
    source: payload.source?.label ?? payload.source?.kind ?? null,
    technique: payload.technique,
    width: payload.width,
  };

  return {
    args: [
      path.join(rootDir, 'scripts', 'darkroom-encode.mjs'),
      '--kind',
      kind,
      '--frames',
      frames,
      '--out',
      outputDirectory,
      '--fps',
      String(fps),
      '--name',
      payload.technique,
      '--recipe',
      JSON.stringify(recipe),
      ...(audio ? ['--audio', audio, '--audioStart', String(audioStart)] : []),
    ],
    options,
  };
}

export default createRenderJobService({
  curatedRoot: path.join('public', 'images', 'darkroom'),
  curatedUrl: '/images/darkroom',
  kinds: ['still', 'video'],
  maxConcurrent: 1,
  outputRoot: path.join(WORKBENCH_ROOT, 'jobs'),
  prepare,
  tool: 'darkroom',
});
