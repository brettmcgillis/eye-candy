import {
  configFrom,
  optionsFromConfig,
  resolveViews,
  sliceFrame,
} from '@modules/apollian';
import {
  createApollianStage,
  framingFor,
  objectAt,
  rollArgs,
} from '@modules/apollianRender';
import { svgView } from '@modules/renderStage/svgStage';

const sliceLive = (options) => {
  const views = resolveViews(options.views);
  return views.length === 1 && views[0] === 'slice';
};

const aspectOf = (options) => options.width / options.height;

// Live's pan and zoom over svgView's frame, as the slice plane's own keys.
function slicePatch(config, options, view) {
  const { half } = sliceFrame(config, aspectOf(options));
  return {
    slicePanX: config.slicePanX + view.target[0] * half,
    slicePanY: config.slicePanY + view.target[1] * half,
    sliceZoom: config.sliceZoom / view.halfHeight,
  };
}

// Live orbits the object, or pans and zooms the 2D slice when Slice is the
// only view; the plot is the slice either way.
const apollianLive = {
  cameraKeys: ({ drawn, options, view }) =>
    sliceLive(options) ? slicePatch(drawn.config, options, view) : {},
  checks: [{ views: 'slice' }],
  configOf: (drawn) => configFrom(drawn.config),
  createStage: ({ options, readFrame, renderer }) => {
    const stage = createApollianStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    });
    if (!sliceLive(options)) return stage;
    let drawn = null;
    const aimAt = (view) =>
      stage.load({
        ...drawn,
        config: { ...drawn.config, ...slicePatch(drawn.config, options, view) },
      });
    return {
      ...stage,
      capture(view) {
        aimAt(view);
        return stage.capture(null);
      },
      load(next) {
        drawn = next;
        return stage.load(next);
      },
      svg(view, svgOptions) {
        aimAt(view);
        return stage.svg(null, svgOptions);
      },
    };
  },
  flat: sliceLive,
  frame: ({ drawn, options }) =>
    sliceLive(options)
      ? svgView(aspectOf(options))
      : framingFor(
          drawn.config,
          options,
          resolveViews(options.views).find((view) => view !== 'slice') ?? 'hero'
        ),
  generate: ({ options, pinned, seed }) =>
    objectAt({
      batch: seed,
      index: 0,
      options,
      roll: rollArgs({ options, typed: pinned }),
    }),
  hint: 'Slice as the only view for the 2D slice',
  keep: (drawn) => optionsFromConfig(configFrom(drawn.config)),
  name: (drawn) => drawn.name,
  stageKey: (options) =>
    JSON.stringify([
      aspectOf(options),
      options.samples,
      options.shadows,
      options.transparent,
      sliceLive(options),
    ]),
};

export default apollianLive;
