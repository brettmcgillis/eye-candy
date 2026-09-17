import createRenderJobPlugin from '../renderJobs/plugin';
import service from './jobService';
import writeScenePreset from './presetWriter';

export default function rorschachDevPlugin() {
  return createRenderJobPlugin({
    routes: [
      {
        handler: async (rootDir, body) => ({
          preset: await writeScenePreset(rootDir, body.preset),
        }),
        method: 'POST',
        path: '/presets',
      },
    ],
    service,
    tool: 'rorschach',
  });
}
