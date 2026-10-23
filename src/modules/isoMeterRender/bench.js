/* eslint-disable no-param-reassign */
import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  OUTLINE_MODE_IDS,
  SCENE_KEYS,
  WINTERKAMMER_LINE_WIDTH,
  buildPiece,
  configFrom,
  createBuild,
  createSvgPainter,
  createVoxelSet,
  createWinterkammerRun,
  pieceFromConfig,
  renderSvg,
  rollConfig,
  seedFor,
  toHex,
  winterkammerOutlineWidth,
} from '@modules/isoMeter';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import buildBlockVoxels from './blockVoxels';
import { blockFit, stageFit, voxelFrame } from './framing';
import { stageMatrix } from './stage';
import {
  createChunkGroup,
  createVoxelMaterials,
  disposeMaterials,
  disposeObjects,
} from './voxelChunks';
import createWinterkammerStage from './winterkammerStage';

export const WINTERKAMMER_MAX_FRAMES = 600;
const MAX_SETTLE_PASSES = 400;
const BUILD_CHUNK = 2000;

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      PALETTE_NAMES.filter((name) => (getPaletteStops(name)?.length ?? 0) >= 2),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function pieceAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = rollConfig(name, roll);
  const stops =
    config.palette === 'None' ? null : getPaletteStops(config.palette);
  return { config, name, stops };
}

export const createPiece = ({ config, stops }, options) =>
  pieceFromConfig(config, { aspect: options.width / options.height, stops });

const canvasOf = (options) => ({
  height: options.height,
  width: options.width,
});

const inkOf = (piece, config) =>
  config.paletteInk ? toHex(piece.ink) : config.inkColor;

export function blockSvg(piece, build, config, options, style) {
  return renderSvg(piece, build, {
    background: !options.transparent,
    canvas: canvasOf(options),
    fill: config.fill,
    ink: inkOf(piece, config),
    lineWidth: config.lineWidth,
    outlineMode: OUTLINE_MODE_IDS[config.outlineMode],
    outlineWidth: config.outlineMode === 'none' ? 0 : config.outlineWidth,
    style,
  });
}

export const winterkammerPainter = (piece, options) =>
  createSvgPainter({
    ...canvasOf(options),
    mirroredX: piece.mirroredX,
    mirroredY: piece.mirroredY,
    refSize: piece.refSize,
  });

// The finished piece as SVG: a block built to the end, or Winterkammer's
// never-cleared canvas once every visible window has drawn.
export function pieceSvg(piece, config, options) {
  if (piece.name === 'winterkammer') {
    const painter = winterkammerPainter(piece, options);
    const run = createWinterkammerRun(piece, { settleFrames: 1 });
    while (!run.settled && run.frame < WINTERKAMMER_MAX_FRAMES) {
      run.step(painter);
    }
    return painter.toString();
  }
  return blockSvg(piece, buildPiece(piece), config, options, 'final');
}

const hexToRgb = (hex) => {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return [Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256];
};

function inkMaterials(materials, [r, g, b]) {
  materials.outlines.color.setRGB(
    r / 255,
    g / 255,
    b / 255,
    THREE.SRGBColorSpace
  );
  materials.lines.color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

// The scene's voxel view, for the CLI headlessly and the Live tab on a
// canvas: the same meshes under an orthographic camera framed exactly as the
// scene frames it. `width` / `height` are the layout canvas (CSS px).
export function createVoxelStage({
  height,
  pixelRatio = 1,
  readFrame,
  renderer,
  samples = 4,
  transparent = false,
  width,
}) {
  renderer.toneMapping = THREE.NoToneMapping;
  const canvas = { height, width };
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode =
    samples > 0 ? pass(scene, camera, { samples }) : pass(scene, camera);
  let loaded = null;

  const lineScale = (fit) => fit.pxPerRef * pixelRatio;

  const clear = () => {
    if (!loaded) return;
    loaded.root.removeFromParent();
    loaded.dispose();
    loaded = null;
  };

  const backdrop = (piece) => {
    if (transparent) {
      scene.background = null;
      renderer.setClearColor(0x000000, 0);
      return;
    }
    const [r, g, b] = piece.background;
    scene.background = new THREE.Color().setRGB(
      r / 255,
      g / 255,
      b / 255,
      THREE.SRGBColorSpace
    );
  };

  function blockMaterials(piece, config, fit) {
    const materials = createVoxelMaterials();
    const ink = config.paletteInk ? piece.ink : hexToRgb(config.inkColor);
    inkMaterials(materials, ink);
    const outline = config.outlineMode === 'none' ? 0 : config.outlineWidth;
    materials.outlines.linewidth = outline * lineScale(fit);
    materials.lines.linewidth = config.lineWidth * lineScale(fit);
    materials.outlines.visible = outline > 0;
    materials.lines.visible = config.lineWidth > 0;
    return materials;
  }

  function placeBlock(root, piece) {
    scene.add(root);
    backdrop(piece);
  }

  function loadBlock(piece, config) {
    const fit = blockFit(piece, canvas);
    const materials = blockMaterials(piece, config, fit);
    const { group } = buildBlockVoxels(piece, materials, { fill: config.fill });
    placeBlock(group, piece);
    loaded = {
      dispose: () => {
        disposeObjects([...group.children]);
        disposeMaterials(materials);
      },
      fit,
      root: group,
    };
  }

  function loadBlockBuild(piece, config) {
    const fit = blockFit(piece, canvas);
    const materials = blockMaterials(piece, config, fit);
    const build = createBuild(piece, { record: true });
    const voxels = createVoxelSet();
    const chunks = createChunkGroup();
    placeBlock(chunks.group, piece);
    let read = 0;
    let chunk = 0;
    let stepped = 0;
    let settled = false;
    const shade = (tri) => piece.shade(tri, build.heights());
    loaded = {
      advance(levels) {
        if (levels > stepped) {
          build.step(levels - stepped);
          stepped = levels;
        }
        const log = build.lattice.cubeLog;
        for (; read < log.length; read += 1) {
          voxels.add(log[read], chunk, { settled: false });
          if (read % BUILD_CHUNK === BUILD_CHUNK - 1) chunk += 1;
        }
        chunk += 1;
        if (build.done && !settled) {
          settled = true;
          voxels.markAll();
        }
        if (!voxels.dirtyCount) return;
        chunks.apply(voxels.flush(shade), materials, { fill: config.fill });
      },
      dispose: () => {
        chunks.clear();
        disposeMaterials(materials);
      },
      fit,
      levels: piece.levels.length,
      root: chunks.group,
    };
  }

  function loadWinterkammer(piece, config, { animate = false } = {}) {
    const materials = {
      background: createVoxelMaterials(),
      tiles: createVoxelMaterials(),
    };
    inkMaterials(materials.tiles, piece.inks.final);
    inkMaterials(materials.background, piece.inks.background);
    const fit = stageFit(piece, canvas);
    const lineWidth = WINTERKAMMER_LINE_WIDTH * lineScale(fit);
    materials.tiles.outlines.linewidth =
      winterkammerOutlineWidth(piece.baseZoom) * lineScale(fit);
    materials.tiles.lines.linewidth = lineWidth;
    materials.background.outlines.linewidth = lineWidth;
    materials.background.lines.linewidth = lineWidth;
    const run = createWinterkammerRun(piece, { settleFrames: 1 });
    const stage = createWinterkammerStage(piece, materials);
    stage.layout(config.stackDepth, piece.aspect);
    stageMatrix(stage.stage.matrix, 1, piece);
    stage.stage.matrixWorldNeedsUpdate = true;
    const settle = () => {
      stage.sync();
      for (
        let step = 0;
        step < MAX_SETTLE_PASSES && stage.pending();
        step += 1
      ) {
        stage.sync();
      }
    };
    if (!animate) {
      while (!run.settled && run.frame < WINTERKAMMER_MAX_FRAMES)
        run.step(null);
      settle();
    }
    placeBlock(stage.stage, piece);
    loaded = {
      advance(frames) {
        while (run.frame < frames && run.frame < WINTERKAMMER_MAX_FRAMES) {
          run.step(null);
        }
        stage.sync();
        if (run.settled) settle();
      },
      dispose: () => {
        stage.dispose();
        disposeMaterials(materials.tiles);
        disposeMaterials(materials.background);
      },
      fit,
      root: stage.stage,
      run,
    };
  }

  function aim(frame) {
    camera.left = -frame.halfWidth;
    camera.right = frame.halfWidth;
    camera.top = frame.halfHeight;
    camera.bottom = -frame.halfHeight;
    camera.near = frame.near;
    camera.far = frame.far;
    camera.up.set(...frame.up);
    camera.position.set(...frame.eye);
    camera.lookAt(...frame.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  return {
    // The scene's framing of the loaded piece from a named view.
    frameOf: ({ azimuthOffset = 0, view = 'iso' } = {}) => ({
      ...voxelFrame(loaded.fit, canvas, { azimuthOffset, view }),
      projection: 'orthographic',
    }),

    capture(frame) {
      aim(frame);
      return readFrame(() => pipeline.render());
    },

    dispose() {
      clear();
      pipeline.dispose?.();
    },

    get loaded() {
      return loaded;
    },

    // A finished piece; `animate` keeps it unbuilt so `loaded.advance` can
    // grow it frame by frame for video.
    load(piece, config, { animate = false } = {}) {
      clear();
      if (piece.name === 'winterkammer')
        loadWinterkammer(piece, config, { animate });
      else if (animate) loadBlockBuild(piece, config);
      else loadBlock(piece, config);
      return loaded;
    },
  };
}
