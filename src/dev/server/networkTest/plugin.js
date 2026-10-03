import createRenderJobPlugin from '../renderJobs/plugin';
import service from './jobService';
import writeScenePreset from './presetWriter';

export default function networkTestDevPlugin() {
  return createRenderJobPlugin({
    routes: [
      {
        handler: async (rootDir, body) => ({
          preset: await writeScenePreset(rootDir, body),
        }),
        method: 'POST',
        path: '/presets',
      },
    ],
    service,
    tool: 'networkTest',
  });
}
