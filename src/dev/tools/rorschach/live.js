import * as kernel from '@modules/rorschach';
import { createRorschachStage } from '@modules/rorschachRender';

function asPathSvg(svg) {
  return svg.replace(
    /<polyline([^>]*) points="([^"]*)"\/>/gu,
    (_, attributes, points) =>
      `<path${attributes} d="M ${points.trim().replaceAll(' ', ' L ')}"/>`
  );
}

const rorschachLive = {
  configOf: (drawn) => drawn.config,
  async createStage({ options, readFrame, renderer }) {
    const stage = await createRorschachStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      samples: options.samples,
      width: options.width * options.pixelRatio,
    });
    const { capture } = stage;
    let current = null;
    return Object.assign(stage, {
      load(drawn) {
        current = drawn;
      },
      capture(view) {
        return capture({
          config: current.config,
          eye: view.eye,
          geometryHelpers: kernel,
          kernel,
          options,
          target: view.target,
          test: current.test,
        });
      },
      svg(view, render) {
        return asPathSvg(
          kernel.renderTestSvg({
            backgroundColor: current.config.backgroundColor,
            bundles: current.test.bundles,
            distance: render.distance,
            eye: view.eye,
            flatten: render.flattenEnabled ? render.flatten : 0,
            flattenAxis: render.flattenAxis,
            fov: render.fov,
            height: render.height,
            layered: true,
            scale: current.test.scale,
            simplifyPx: render.simplify,
            strokeWidth: render.stroke || Math.max(1, render.width / 900),
            styles: current.test.styles,
            target: view.target,
            width: render.width,
          })
        );
      },
    });
  },
  frame: ({ options }) => ({
    eye: kernel.viewEye('front', options.distance),
    fov: options.fov,
    target: [0, 0, 0],
  }),
  generate: ({ options, pinned, seed }) => {
    const roll = {
      pinned: Object.fromEntries(
        [...pinned]
          .filter((key) => kernel.rollableKeys().has(key))
          .map((key) => [key, options[key]])
      ),
      seeds: {
        ink: options.inkSeed,
        palette: options.paletteSeed,
        structure: options.structureSeed,
      },
    };
    const config = kernel.rollTestConfig(seed, roll);
    const settings = {
      ...options,
      ...config,
      overrides: kernel.buildOverridesFromControls(config),
    };
    const test = kernel.generateStructure(config.seed, settings);
    test.bundles.forEach((bundle) => kernel.growBundle(bundle, bundle.steps));
    return {
      config,
      name: config.seed,
      test: {
        ...test,
        styles: kernel.computeStyles(config.seed, config.bundleCount, settings),
      },
    };
  },
  keep: (drawn) => kernel.optionsFromPreset(drawn.config, 'still'),
  name: (drawn) => drawn.name,
};

export default rorschachLive;
