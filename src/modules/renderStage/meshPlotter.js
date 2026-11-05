import { meshPlotSvg } from '@modules/plotKit';

import {
  createAlbedoCapture,
  createDepthCapture,
  depthProbe,
  readMeshes,
} from './capture';

// A stage's mesh plot (docs/render-workbench.md §0.3): the subject's depth
// (hidden lines, silhouette) and albedo (its inks) read back at the output
// size, its meshes read in world space, then plotKit's meshPlotSvg. The CLI
// and the Live tab call the same one; `advance` starts a fresh animation
// frame where the caller drives frames by hand (the headless renderer).
// `meshes` replaces the entries read off `subject` where the subject's
// vertices are placed in a shader, so a CPU mirror supplies the plotted ones.
// `plot` is meshPlotSvg's own tuning (minLength, outlineTolerance,
// contourTolerance) for a stage whose meshes need it.
export default function createMeshPlotter(renderer, { advance = null } = {}) {
  const captureDepth = createDepthCapture(renderer);
  const captureAlbedo = createAlbedoCapture(renderer);
  return async function meshPlot({
    camera,
    lines = [],
    meshes = null,
    occluders = null,
    options,
    plot = {},
    scene,
    subject,
    texture = null,
    view,
  }) {
    const { pixelRatio } = options;
    const width = Math.round(options.width * pixelRatio);
    const height = Math.round(options.height * pixelRatio);
    const list = Array.isArray(subject) ? subject : [subject];
    advance?.();
    const depth = occluders
      ? null
      : await captureDepth(scene, camera, width, height, list);
    advance?.();
    const albedo = await captureAlbedo(scene, camera, width, height, list);
    return meshPlotSvg({
      albedo,
      camera: view,
      coverage: depth,
      occluders,
      height: options.height,
      lines,
      meshes: meshes ?? list.flatMap((object) => readMeshes(object)),
      pixelRatio,
      stroke: options.svgStroke,
      texture,
      visible:
        options.svgOcclusion && depth
          ? depthProbe(depth, pixelRatio, 0.01)
          : null,
      width: options.width,
      ...plot,
    });
  };
}
