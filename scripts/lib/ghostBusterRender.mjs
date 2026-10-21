/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/ghostBuster/renderOptions.mjs';
import { createParseCli, withRenderer } from './generatorCli.mjs';
import {
  createHeadlessRenderer,
  loadThree,
  setClock,
  stubCanvas,
} from './headlessWebgpu.mjs';
import loadModules from './loadModules.mjs';
import {
  installGltfLoader,
  installTextureLoader,
  until,
} from './r3fHeadless.mjs';

// Barrels only — see docs/ghost-buster-pipeline.md.
const ENTRIES = {
  ghost: '/src/modules/ghostBuster/index.js',
  look: '/src/modules/ghostBusterRender/index.js',
};

const FPS = 60;

// R3F runs through Vite rather than as Node's CommonJS copy, so its
// `instanceof THREE.Color` checks see the same three the stage does; the
// GLTF and texture loaders read public/ directly.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  installTextureLoader(THREE);
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  installGltfLoader(GLTFLoader);
  const loaded = await loadModules(Object.values(ENTRIES), {
    noExternal: ['@react-three/fiber'],
  });
  return {
    THREE,
    TSL,
    ghost: loaded[ENTRIES.ghost],
    look: loaded[ENTRIES.look],
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { ghost, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  const skins = options.skins ?? look.SKIN_NAMES;
  const unknown = skins.filter((name) => !look.SKIN_NAMES.includes(name));
  if (unknown.length) {
    throw new Error(
      `Unknown skin ${unknown.join(', ')}; skins are ${look.SKIN_NAMES.join(', ')}.`
    );
  }
  return {
    base: options.base ? ghost.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
    skins,
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function ghostAt(kernel, { batch, index, roll }) {
  const { ghost, look } = kernel;
  const name = ghost.seedFor(batch, index);
  const config = ghost.rollGhostConfig(name, roll);
  if (!look.SKIN_NAMES.includes(config.skin)) {
    throw new Error(
      `Unknown skin "${config.skin}"; skins are ${look.SKIN_NAMES.join(', ')}.`
    );
  }
  return { config, name };
}

// One renderer and one R3F root per output size: the real GhostStudio stage
// (GhostCharacter, its cloth sim and GhostBuster's studio) mounted with no
// frame loop, stepped at 60 fps until the cloth settles, then captured.
export async function createGhostCapturer(
  kernel,
  { height, pixelRatio, width }
) {
  const { ghost, look } = kernel;
  const headless = await createHeadlessRenderer({
    configure(renderer, THREE) {
      /* eslint-disable no-param-reassign */
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      /* eslint-enable no-param-reassign */
    },
    height: height * pixelRatio,
    width: width * pixelRatio,
  });
  const { renderer, target } = headless;
  renderer.setOutputRenderTarget(target);
  const stage = await look.createStageRoot({
    canvas: stubCanvas(width * pixelRatio, height * pixelRatio),
    height,
    pixelRatio,
    renderer,
    width,
  });
  const captureDepth = look.createDepthCapture(renderer);
  const captureNormals = look.createNormalCapture(renderer);
  const ghostRef = { current: null };
  const stormRef = { current: null };
  let clock = 0;
  let current = null;

  // eslint-disable-next-line no-underscore-dangle
  const { nodeFrame } = renderer._nodes;

  // A settle step renders without a capture, so TSL `time` (the cloth's wind
  // noise) is set here; left alone it would hold the last capture's clock.
  const step = (seconds) => {
    nodeFrame.deltaTime = seconds - clock;
    nodeFrame.time = seconds;
    clock = seconds;
    setClock(seconds);
    stage.step(seconds);
  };

  async function frame(seconds) {
    setClock(seconds);
    const read = await headless.readFrame(() => {
      clock = seconds;
      stage.step(seconds);
    });
    return read;
  }

  return {
    // Mounts a generation and simulates its settle time; returns the clock it
    // settled at and the sphere round the drape, which frameGhost fits.
    async load(config) {
      current = config;
      ghostRef.current = null;
      stormRef.current = null;
      await stage.mount({ config, ghostRef, stormRef });
      await until(
        () => ghostRef.current?.sim && ghostRef.current?.mesh,
        'the ghost to mount'
      );
      await stage.flush();
      clock = 0;
      const frames = Math.max(1, Math.round(ghost.stillTime(config) * FPS));
      // The cloth steps in useFrame whether or not anything is drawn, so the
      // settle skips drawing full-size frames nobody reads.
      const { scene } = stage;
      scene.visible = false;
      for (let f = 1; f <= frames; f += 1) {
        step(f / FPS);
        if (f % 30 === 0) await new Promise(setImmediate);
      }
      scene.visible = true;
      const lattice = await look.readGhostLattice(
        renderer,
        ghostRef.current,
        config.skin
      );
      return {
        bounds: ghost.withStorm(
          ghost.animated(config)
            ? ghost.MOTION_BOUNDS
            : ghost.latticeBounds(lattice),
          stormRef.current?.extent()
        ),
        start: clock,
      };
    },

    // A still at the current clock, or the clip's next frame at `seconds`.
    async capture(view, seconds = clock) {
      look.aimCamera(stage.camera, view, width / height);
      return frame(seconds);
    },

    async svg(view, options) {
      look.aimCamera(stage.camera, view, width / height);
      const lattice = await look.readGhostLattice(
        renderer,
        ghostRef.current,
        current.skin
      );
      const pass = (capture) => (only) =>
        capture(
          stage.scene,
          stage.camera,
          width * pixelRatio,
          height * pixelRatio,
          only
        );
      const depthOf = pass(captureDepth);
      const depth = ghost.needsDepth(options)
        ? await depthOf(ghostRef.current.mesh)
        : null;
      const storm = options.svgStorm ? stormRef.current : null;
      // The rain shadow is only drawn on a visible frame, which a settle is not.
      const image =
        ghost.needsImage(options) || storm ? await frame(clock) : null;
      const stormPlot = storm
        ? await look.readStormPlot(renderer, storm, {
            depthOf,
            normalsOf: pass(captureNormals),
          })
        : null;
      return ghost.renderGhostSvg({
        ...ghost.plotArgs(options, look.resolveSkin(current.skin)),
        camera: view,
        coverage: depth,
        image: ghost.needsImage(options) ? image : null,
        lattice,
        storm: stormPlot,
        time: clock,
        visible: options.svgOcclusion
          ? look.depthProbe(
              ghost.unionOf(depth, stormPlot?.cloud?.coverage),
              pixelRatio
            )
          : null,
      });
    },

    // The settled cloth and the storm at the current clock, for the check.
    async readback() {
      return {
        lattice: await look.readGhostLattice(
          renderer,
          ghostRef.current,
          current.skin
        ),
        storm: (await stormRef.current?.snapshot(renderer)) ?? null,
      };
    },

    get clock() {
      return clock;
    },

    dispose() {
      stage.unmount();
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createGhostCapturer(kernel, {
        height: options.height,
        pixelRatio: options.pixelRatio,
        width: options.width,
      }),
    work
  );
