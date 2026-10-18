/* eslint-disable no-param-reassign */
import { loadKernelModules, withRenderer } from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/iso-meter-pipeline.md.
const ENTRIES = { render: '/src/modules/isoMeterRender/index.js' };
const WINTERKAMMER_MAX_FRAMES = 600;
const MAX_SETTLE_PASSES = 400;
const BUILD_CHUNK = 2000;

const hexToRgb = (hex) => {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return [Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256];
};

function inkMaterials(THREE, materials, rgb) {
  const [r, g, b] = rgb;
  materials.outlines.color.setRGB(
    r / 255,
    g / 255,
    b / 255,
    THREE.SRGBColorSpace
  );
  materials.lines.color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

// The scene's voxel view, headless: the same meshes from @modules/isoMeterRender
// under an orthographic camera framed exactly as the scene frames it.
export async function createVoxelCapturer(kernel, options) {
  const { THREE, TSL, render } = await loadKernelModules(ENTRIES);
  const { isoMeter } = kernel;
  const size = {
    height: Math.round(options.height * options.pixelRatio),
    width: Math.round(options.width * options.pixelRatio),
  };
  const canvas = { height: options.height, width: options.width };
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      renderer.toneMapping = THREE.NoToneMapping;
    },
    ...size,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
  const pipeline = new THREE.RenderPipeline(headless.renderer);
  pipeline.outputNode =
    options.samples > 0
      ? TSL.pass(scene, camera, { samples: options.samples })
      : TSL.pass(scene, camera);
  let loaded = null;

  const lineScale = (fit) => fit.pxPerRef * options.pixelRatio;

  const clear = () => {
    if (!loaded) return;
    loaded.root.removeFromParent();
    loaded.dispose();
    loaded = null;
  };

  const backdrop = (piece) => {
    if (options.transparentBackground) {
      scene.background = null;
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
    const materials = render.createVoxelMaterials();
    const ink = config.paletteInk ? piece.ink : hexToRgb(config.inkColor);
    inkMaterials(THREE, materials, ink);
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
    const fit = render.blockFit(piece, canvas);
    const materials = blockMaterials(piece, config, fit);
    const { group } = render.buildBlockVoxels(piece, materials, {
      fill: config.fill,
    });
    placeBlock(group, piece);
    loaded = {
      dispose: () => {
        render.disposeObjects([...group.children]);
        render.disposeMaterials(materials);
      },
      fit,
      root: group,
    };
  }

  function loadBlockBuild(piece, config) {
    const fit = render.blockFit(piece, canvas);
    const materials = blockMaterials(piece, config, fit);
    const build = isoMeter.createBuild(piece, { record: true });
    const voxels = isoMeter.createVoxelSet();
    const chunks = render.createChunkGroup();
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
        render.disposeMaterials(materials);
      },
      fit,
      levels: piece.levels.length,
      root: chunks.group,
    };
  }

  function loadWinterkammer(piece, config, { animate = false } = {}) {
    const materials = {
      background: render.createVoxelMaterials(),
      tiles: render.createVoxelMaterials(),
    };
    inkMaterials(THREE, materials.tiles, piece.inks.final);
    inkMaterials(THREE, materials.background, piece.inks.background);
    const fit = render.stageFit(piece, canvas);
    const lineWidth = isoMeter.WINTERKAMMER_LINE_WIDTH * lineScale(fit);
    materials.tiles.outlines.linewidth =
      isoMeter.winterkammerOutlineWidth(piece.baseZoom) * lineScale(fit);
    materials.tiles.lines.linewidth = lineWidth;
    materials.background.outlines.linewidth = lineWidth;
    materials.background.lines.linewidth = lineWidth;
    const run = isoMeter.createWinterkammerRun(piece, { settleFrames: 1 });
    const stage = render.createWinterkammerStage(piece, materials);
    stage.layout(config.stackDepth, piece.aspect);
    render.stageMatrix(stage.stage.matrix, 1, piece);
    stage.stage.matrixWorldNeedsUpdate = true;
    const settle = () => {
      stage.sync();
      for (
        let pass = 0;
        pass < MAX_SETTLE_PASSES && stage.pending();
        pass += 1
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
        render.disposeMaterials(materials.tiles);
        render.disposeMaterials(materials.background);
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
    async capture({ azimuthOffset = 0, view = 'iso' } = {}) {
      aim(render.voxelFrame(loaded.fit, canvas, { azimuthOffset, view }));
      return headless.readFrame(() => pipeline.render());
    },
    dispose() {
      clear();
      pipeline.dispose?.();
      headless.dispose();
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

export const withVoxelCapturer = (kernel, options, work) =>
  withRenderer(options, () => createVoxelCapturer(kernel, options), work);
