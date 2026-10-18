#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/networkTest/renderOptions.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  loadKernel,
  networkAt,
  padFor,
  parseCli,
  rollArgs,
  settledInstances,
  withCapturer,
} from './lib/networkTestRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  // An SVG-only batch needs no GPU at all.
  gpu: ({ formats }) => formats.length > 0,
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const { net } = kernel;
    const drawn = await step(`building network ${index + 1}`, () =>
      networkAt(kernel, { batch, index, roll })
    );
    capturer?.load(drawn);
    const pad = padFor(drawn);
    const instances = settledInstances(kernel, drawn, options.stillTime);
    const out = await save(drawn.name, {
      ...sidecarFor({ ...drawn, options }),
      stats: {
        edges: drawn.network.edges.length,
        placements: drawn.network.placements.map(
          ({ family, kind }) => `${family}:${kind}`
        ),
        points: drawn.network.count,
      },
    });
    await out.eachView(async (view) => {
      const framing = net.frameView({
        options,
        pad,
        points: drawn.network.positions,
        view,
      });
      await out.image(view, () => capturer.capture(framing, instances));
      if (options.svg) {
        await out.svg(
          view,
          net.renderNetworkTestSvg({
            camera: framing,
            config: drawn.config,
            depthPens: options.svgDepthPens,
            height: options.height,
            instances: net.buildInstances({
              config: drawn.config,
              network: drawn.network,
              stops: drawn.stops,
            }),
            minAlpha: options.svgMinAlpha,
            nodes: options.svgNodes,
            stroke: options.svgStroke,
            width: options.width,
          })
        );
      }
    });
  },
  kernelLabel: 'NetworkTest',
  loadKernel,
  nouns: 'networks',
  overlay: sceneIconFile('network-test'),
  parseCli,
  resolveViews,
  script: 'network-test',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.net.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'network test',
  usageFor,
  withCapturer,
});
