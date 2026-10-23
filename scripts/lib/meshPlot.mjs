import { advanceFrame } from './headlessWebgpu.mjs';

// The kernel entries a capturer adds to plot its subject's meshes.
export const MESH_PLOT_ENTRIES = {
  plot: '/src/modules/plotKit/index.js',
  stage: '/src/modules/renderStage/capture.js',
};

// A three-only capturer's mesh plot (docs/render-workbench.md §0.3): the
// subject's depth (hidden lines, silhouette) and albedo (its inks) read back
// at the output size, its meshes read in world space, then plotKit's
// meshPlotSvg. `subject` is the object (or list) the plot draws; `camera`
// is aimed at `view` already.
export function createMeshPlotter({ plot, renderer, stage }) {
  const captureDepth = stage.createDepthCapture(renderer);
  const captureAlbedo = stage.createAlbedoCapture(renderer);
  return async function meshPlot({
    camera,
    lines = [],
    options,
    scene,
    subject,
    texture = null,
    view,
  }) {
    const { pixelRatio } = options;
    const width = Math.round(options.width * pixelRatio);
    const height = Math.round(options.height * pixelRatio);
    const list = Array.isArray(subject) ? subject : [subject];
    advanceFrame();
    const depth = await captureDepth(scene, camera, width, height, list);
    advanceFrame();
    const albedo = await captureAlbedo(scene, camera, width, height, list);
    return plot.meshPlotSvg({
      albedo,
      camera: view,
      coverage: depth,
      height: options.height,
      lines,
      meshes: list.flatMap((object) => stage.readMeshes(object)),
      pixelRatio,
      stroke: options.svgStroke,
      texture,
      visible: options.svgOcclusion
        ? stage.depthProbe(depth, pixelRatio, 0.01)
        : null,
      width: options.width,
    });
  };
}
