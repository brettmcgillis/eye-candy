import * as flora from '@modules/flora';
import { createFloraStage } from '@modules/floraRender';
import * as lights from '@modules/lightingRig';
import { penPx } from '@modules/plotKit';

const DEG = Math.PI / 180;
const kernel = { flora, lights };

function frame(bounds, options) {
  const [azimuth, elevation] = flora.VIEW_ANGLES[options.view] ?? [0, 4];
  const az = azimuth * DEG;
  const el = elevation * DEG;
  const direction = [
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ];
  const target = bounds.min.map(
    (value, axis) => (value + bounds.max[axis]) / 2
  );
  const radius =
    Math.hypot(...bounds.max.map((value, axis) => value - bounds.min[axis])) /
    2;
  const half = (options.fov * DEG) / 2;
  const horizontal = Math.atan(
    Math.tan(half) * (options.width / options.height)
  );
  const distance =
    (radius * (1 + options.margin)) / Math.sin(Math.min(half, horizontal));
  return {
    eye: target.map((value, axis) => value + direction[axis] * distance),
    fov: options.fov,
    target,
  };
}

const floraLive = {
  configOf: (drawn) => drawn.config,
  createStage({ options, readFrame, renderer }) {
    const stage = createFloraStage(kernel, {
      height: options.height * options.pixelRatio,
      pixelRatio: options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      shadows: options.shadows,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    });
    const { capture, load } = stage;
    let current = null;
    return Object.assign(stage, {
      load(drawn) {
        current = drawn;
        return load(drawn.flowers);
      },
      capture(view) {
        return capture({
          ...view,
          levels: (config) =>
            flora.levelsAt(config, flora.timeline(config).matured),
        });
      },
      async svg(view, render, visible) {
        const shaded = render.svgShading !== 'none';
        const coverage = shaded ? await stage.captureDepth(view) : null;
        const ornaments = shaded
          ? await stage.captureDepth(view, { ornamentsOnly: true })
          : null;
        const image = shaded
          ? await capture({
              ...view,
              levels: () => ({ growth: 1, bloom: 1, exit: 0 }),
            })
          : null;
        const albedo = await stage.captureAlbedo(view);
        return flora.renderFloraSvg({
          albedo,
          inks: render.svgColors,
          background: current.config.backgroundColor,
          camera: view,
          flowers: current.flowers.map((entry, index) => ({
            config: entry.config,
            matrix: stage.matrices()[index],
            specimen: entry.specimen,
          })),
          growth: 1,
          height: render.height,
          pen: penPx(render),
          plot:
            shaded || render.svgSilhouette
              ? (trace) =>
                  flora.floraPlotLayers({
                    ...trace,
                    coverage,
                    image,
                    options: render,
                    ornaments,
                  })
              : null,
          stroke: render.svgStroke,
          thin: render.svgThin,
          visible,
          width: render.width,
        });
      },
    });
  },
  frame: ({ layout, options }) => frame(layout, options),
  generate: ({ options, pinned, seed }) => {
    const roll = {
      paletteNames: ['None'],
      pinned: Object.fromEntries(
        [...pinned]
          .filter((key) => flora.rollableKeys().has(key))
          .map((key) => [key, options[key]])
      ),
      seeds: {
        form: options.formSeed,
        ornaments: options.ornamentsSeed,
        palette: options.paletteSeed,
      },
    };
    const config = flora.rollFloraConfig(seed, roll);
    return {
      config,
      flowers: [{ config, specimen: flora.buildSpecimen(config) }],
      name: config.seed,
    };
  },
  keep: (drawn) => flora.optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default floraLive;
