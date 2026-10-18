#!/usr/bin/env node
import { usageFor } from '../src/modules/hyperCubes/renderOptions.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  rollArgs,
  structureAt,
  withCapturer,
} from './lib/hyperCubesRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// A morph clip is one stage: every structure after the first keeps the
// first one's atmosphere, so only the cubes move.
function rollItems(kernel, { batch, options, roll }) {
  const { cubes } = kernel;
  const items = Array.from({ length: options.count }, (_, index) =>
    structureAt(kernel, { batch, index, roll })
  );
  if (options.mode !== 'morph') return items;
  const held = Object.fromEntries(
    cubes.keysInFacet('atmosphere').map((key) => [key, items[0].config[key]])
  );
  return items.map((item, index) =>
    index === 0 ? item : { ...item, config: { ...item.config, ...held } }
  );
}

// Each clip is a list of shots: a structure loaded for `frames` frames, and
// what those frames draw.
function planShots(kernel, items, options) {
  const { cubes } = kernel;
  const { fps } = options;
  if (options.mode === 'morph') {
    const clock = { ...items[0].config, holdSeconds: options.hold };
    const frames = Math.max(
      1,
      Math.round(cubes.morphClipSeconds(clock, items.length) * fps)
    );
    return [
      {
        drawn: items[0],
        frames,
        instancesAt: (frame) => {
          const { from, t, to } = cubes.morphAt(
            frame / fps,
            clock,
            items.length
          );
          const a = items[from];
          const b = items[to];
          return cubes.buildInstances({
            config: a.config,
            from: a.tree.root,
            stops: a.stops,
            t,
            to: b.tree.root,
            toConfig: b.config,
            toStops: b.stops,
          });
        },
      },
    ];
  }
  return items.map((drawn) => {
    if (options.mode === 'turntable') {
      return {
        drawn,
        frames: Math.max(1, Math.round(options.hold * fps)),
        instancesAt: () => null,
      };
    }
    const depth = cubes.treeDepth(drawn.tree.root);
    const grow = depth * drawn.config.growLevelSeconds;
    return {
      drawn,
      frames: Math.max(1, Math.round((grow + options.hold) * fps)),
      instancesAt: (frame) =>
        cubes.buildInstances({
          config: drawn.config,
          from: drawn.tree.root,
          grow: cubes.growAt(frame / fps, drawn.config, depth, { loop: false }),
          stops: drawn.stops,
        }),
    };
  });
}

const unionBounds = (boundsList) =>
  boundsList.reduce((all, b) => ({
    max: all.max.map((v, a) => Math.max(v, b.max[a])),
    min: all.min.map((v, a) => Math.min(v, b.min[a])),
  }));

runVideo({
  kernelLabel: 'HyperCubes',
  loadKernel,
  nouns: 'structures',
  overlay: sceneIconFile('hyper-cubes'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { cubes } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? cubes.randomSeed();
    const items = rollItems(kernel, { batch, options, roll });
    const stable = options.mode === 'turntable' || options.orbit !== 0;
    return {
      presets: () => items.map(({ config }) => config),
      shots: planShots(kernel, items, options).map(
        ({ drawn, frames, instancesAt }) => {
          let bounds = null;
          return {
            enter(capturer) {
              const loaded = capturer.load(drawn);
              bounds =
                options.mode === 'morph'
                  ? unionBounds([
                      loaded,
                      ...items.map(({ config }) => cubes.domainBounds(config)),
                    ])
                  : loaded;
            },
            frame: (capturer, clock) =>
              capturer.capture(
                cubes.frameView({
                  azimuthOffset: azimuthOffset(options, clock),
                  bounds,
                  options,
                  stable,
                  view: options.view,
                }),
                instancesAt(clock.frame)
              ),
            frames,
          };
        }
      ),
    };
  },
  script: 'hyper-cubes',
  title: 'hypercubes',
  usageFor,
  withCapturer,
});
