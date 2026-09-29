import createRenderJobPlugin from '../renderJobs/plugin';
import service from './jobService';
import writeScenePreset from './presetWriter';
import { MAX_UPLOAD_BYTES, listSources, saveSource } from './sources';

export default function subdivisionDevPlugin() {
  return createRenderJobPlugin({
    routes: [
      {
        handler: async (rootDir, body) => ({
          preset: await writeScenePreset(rootDir, body),
        }),
        method: 'POST',
        path: '/presets',
      },
      { handler: listSources, method: 'GET', path: '/sources' },
      {
        handler: saveSource,
        maxBytes: MAX_UPLOAD_BYTES,
        method: 'POST',
        path: '/sources',
      },
    ],
    service,
    tool: 'subdivision',
  });
}
