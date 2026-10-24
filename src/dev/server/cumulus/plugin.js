import {
  RENDER_OPTIONS,
  configFrom,
  normalizeOptions,
} from '../../../modules/cumulus/renderOptions.mjs';
import appendPreset, { uniqueName } from '../renderJobs/presetFile';
import createSchemaToolPlugin from '../renderJobs/schemaTool';

export default function cumulusDevPlugin() {
  return createSchemaToolPlugin({
    normalizeOptions,
    options: RENDER_OPTIONS,
    slug: 'cumulus',
    tool: 'cumulus',
    writePreset(rootDir, { name, sidecar }) {
      const config = sidecar.config ?? sidecar.preset ?? configFrom(sidecar);
      const view = config.captureView;
      const vector = ([x, y, z]) => ({ x, y, z });
      const value = view
        ? {
            ...config,
            cameraMode: 'fixed',
            fixedCameraDesktopPosition: vector(view.eye),
            fixedCameraDesktopTarget: vector(view.target),
            fixedCameraDesktopFov: view.fov,
            fixedCameraMobilePosition: vector(view.eye),
            fixedCameraMobileTarget: vector(view.target),
            fixedCameraMobileFov: view.fov,
          }
        : config;
      return appendPreset(rootDir, {
        declaration: 'export const PRESETS = {',
        file: 'src/modules/cumulus/presets.js',
        nameFor: uniqueName(
          String(name ?? sidecar.name ?? `Cumulus ${config.haloSeed}`)
            .replace(/[^\w -]/gu, '')
            .trim()
        ),
        value,
      });
    },
  });
}
