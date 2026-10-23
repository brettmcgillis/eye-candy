import {
  frameView,
  optionsFromConfig,
  resolveViews,
} from '@modules/trucheterie3d';
import {
  createTubeStage,
  fieldAt,
  rollArgs,
} from '@modules/trucheterie3dRender';
import {
  designFromJson,
  encodeDesign,
  isDesignCode,
} from '@modules/trucheterieBlob';

const DESIGNS = '/dev-api/trucheterie-designer/designs';

// The page's twin of the CLI's withResolvedDesign: a pinned saved-design
// name becomes its code, and its rotation is pinned unless typed.
async function resolveDesign(pinned) {
  if (!pinned.blobDesign || isDesignCode(pinned.blobDesign)) return pinned;
  const response = await fetch(
    `${DESIGNS}/${encodeURIComponent(pinned.blobDesign)}`
  );
  const body = await response.json();
  const design = body.ok ? designFromJson(body.design) : null;
  if (!design) throw new Error(`No usable design "${pinned.blobDesign}".`);
  const rotation = Number(body.design.rotation);
  const turned =
    Number.isFinite(rotation) && pinned.planeRotation === undefined
      ? { planeRotation: rotation }
      : {};
  return { ...pinned, blobDesign: encodeDesign(design), ...turned };
}

const trucheterie3dLive = {
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createTubeStage({
      height: options.height * options.pixelRatio,
      readFrame,
      renderer,
      shadows: options.shadows,
      transparent: options.transparent,
      width: options.width * options.pixelRatio,
    }),
  frame: ({ layout, options }) =>
    frameView({
      bounds: layout,
      options,
      view: resolveViews(options.views)[0] ?? 'hero',
    }),
  async generate({ options, pinned, seed }) {
    const roll = rollArgs({ options, typed: pinned });
    return fieldAt({
      baseSeed: options.blobSeed ?? seed,
      index: 0,
      roll: { ...roll, pinned: await resolveDesign(roll.pinned) },
    });
  },
  keep: (drawn) => optionsFromConfig(drawn.config),
  name: (drawn) => drawn.name,
};

export default trucheterie3dLive;
