import { pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  PANEL_KEYS,
  PATCH_KEYS,
  SCENE_KEYS,
  STILL_TIME,
  buildPanel,
  configFrom,
  createPanelSession,
  patchBounds,
  patchPlotParts,
  renderPanelSvg,
  rollControlPanelConfig,
  seedFor,
  shadePanelSvg,
} from '@modules/controlPanel';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { createAlbedoCapture, setBackdrop } from '@modules/renderStage/capture';

import LIGHTING from './lighting';
import connectPanelPointer from './pointer';
import POST from './post';
import createPanelRig from './rig';

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    orientation: options.orientation ?? 'any',
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function panelAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = rollControlPanelConfig(name, roll);
  return { config, name, panel: buildPanel(config) };
}

// The panel stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene. A moment is `{ t, build }`: seconds of
// operation, and optionally seconds into a build-in.
export function createPanelStage({
  height,
  pixelRatio = 1,
  readFrame,
  renderer,
  samples = 4,
  shadows = true,
  transparent = false,
  width,
}) {
  /* eslint-disable no-param-reassign */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* eslint-enable no-param-reassign */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 400);
  const rig = createPanelRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let depthPipeline = null;
  let current = null;
  let lightGroup = null;
  let clock = STILL_TIME;
  let staticsBuilt = false;
  let session = null;
  let loadKey = null;
  let patchKey = null;
  let physicsTime = STILL_TIME;
  let disconnectPointer = null;
  const captureAlbedo = createAlbedoCapture(renderer);

  scene.add(rig.group);
  rig.setShadows(shadows);

  function pipeline() {
    const slots = buildScenePostRuntimeConfig(
      POST,
      current.config
    ).slots.filter((slot) => slot.enabled);
    const key = slots.map((slot) => slot.id).join('|') || 'plain';
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? createPostChain({ camera, passOptions, renderer, scene, slots })
          : null;
      let built = chain?.pipeline;
      if (!built) {
        built = new THREE.RenderPipeline(renderer);
        built.outputNode = pass(scene, camera, passOptions);
      }
      pipelines[key] = { chain, pipeline: built };
    }
    const entry = pipelines[key];
    entry.chain?.chain.forEach((link) => link.update(current.config, {}));
    return entry.pipeline;
  }

  // Linear depth over two 8-bit channels, fine enough to hide a tick mark
  // behind the knob in front of it.
  function depthPass() {
    if (depthPipeline) return depthPipeline;
    const scenePass = pass(scene, camera);
    const unit = scenePass.getLinearDepthNode().clamp(0, 1).mul(65535);
    const high = unit.div(256).floor();
    depthPipeline = new THREE.RenderPipeline(renderer);
    depthPipeline.outputColorTransform = false;
    depthPipeline.outputNode = vec4(
      high.div(255),
      unit.sub(high.mul(256)).floor().div(255),
      0,
      1
    );
    return depthPipeline;
  }

  function aim(view) {
    camera.fov = view.fov;
    camera.aspect = width / height;
    camera.near = view.near;
    camera.far = view.far;
    camera.up.set(...view.up);
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function pose({ build = null, t = clock } = {}) {
    const { config, panel } = current;
    if (build != null) {
      rig.setStatics(panel.chassis);
      staticsBuilt = false;
    } else if (!staticsBuilt) {
      rig.setStatics(panel.statics);
      staticsBuilt = true;
    }
    if (t < physicsTime) {
      session?.dispose();
      session = createPanelSession(panel, config);
      physicsTime = Math.min(STILL_TIME, t);
    }
    while (physicsTime + 1 / 120 < t) {
      session.step(1 / 120);
      physicsTime += 1 / 120;
    }
    session.step(0, { build, t });
    rig.setMoving(session.moving());
    rig.setCables(session.patch, session.offsets(), session.reveals());
  }

  return {
    // Sets the stage for a panel and returns the bounds views are framed on.
    load(drawn) {
      const nextKey = JSON.stringify(
        PANEL_KEYS.map((key) => drawn.config[key])
      );
      const nextPatch = JSON.stringify(
        PATCH_KEYS.map((key) => drawn.config[key])
      );
      current = drawn;
      if (nextKey !== loadKey) {
        clock = STILL_TIME;
        physicsTime = STILL_TIME;
        session?.dispose();
        session = createPanelSession(drawn.panel, drawn.config);
        loadKey = nextKey;
        patchKey = nextPatch;
      } else if (nextPatch !== patchKey) {
        session.repatch(drawn.config);
        patchKey = nextPatch;
      }
      session.step(0, { config: drawn.config, t: clock });
      staticsBuilt = false;
      const { config } = drawn;
      rig.updateEnvironment(renderer, scene, config);
      setBackdrop({ renderer, scene }, config.background, transparent);
      lightGroup?.removeFromParent();
      lightGroup = createSceneLights(
        buildSceneLightingRuntimeConfig({
          controls: config,
          lighting: LIGHTING,
        }),
        { shadows }
      );
      scene.add(lightGroup);
      pose();
      return patchBounds(drawn.panel, session.patch);
    },

    getSession: () => session,
    exportConfig: () => session.exportConfig(),
    getBounds: () => patchBounds(current.panel, session.patch),
    connectPointer(args) {
      disconnectPointer?.();
      disconnectPointer = connectPanelPointer({
        ...args,
        getSession: () => session,
      });
      return () => {
        disconnectPointer?.();
        disconnectPointer = null;
      };
    },
    step(delta) {
      clock += delta;
      pose();
    },

    setClock(t) {
      clock = t;
    },

    capture(view, moment = {}) {
      aim(view);
      pose(moment);
      return readFrame(() => pipeline().render());
    },

    async captureDepth(view, moment = {}) {
      aim(view);
      pose(moment);
      const frame = await readFrame(() => depthPass().render());
      const depths = new Float32Array(frame.width * frame.height);
      for (let i = 0; i < depths.length; i += 1) {
        const unit = (frame.data[i * 4] * 256 + frame.data[i * 4 + 1]) / 65535;
        depths[i] = view.near + unit * (view.far - view.near);
      }
      return { data: depths, height: frame.height, width: frame.width };
    },

    // A hidden-line test in output pixels: the farthest of a 3 × 3 patch, so
    // an edge is not hidden by the face it bounds.
    depthProbe(depth) {
      const clampTo = (v, max) => Math.min(Math.max(v, 0), max - 1);
      const visible = (x, y, z) => {
        const px = Math.round(x * pixelRatio);
        const py = Math.round(y * pixelRatio);
        let farthest = -Infinity;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const sx = clampTo(px + dx, depth.width);
            const sy = clampTo(py + dy, depth.height);
            farthest = Math.max(farthest, depth.data[sy * depth.width + sx]);
          }
        }
        return z <= farthest;
      };
      visible.cable = (x, y, z) => {
        const px = clampTo(Math.round(x * pixelRatio), depth.width);
        const py = clampTo(Math.round(y * pixelRatio), depth.height);
        return z <= depth.data[py * depth.width + px];
      };
      return visible;
    },

    async svg(view, options, visible, moment = {}) {
      aim(view);
      pose(moment);
      let svg = renderPanelSvg({
        camera: view,
        height: options.height,
        parts: [
          ...(moment.build != null
            ? current.panel.chassis
            : current.panel.statics),
          ...session.moving(),
        ],
        cables: patchPlotParts(session.patch, view, session.offsets()),
        stroke: options.svgStroke,
        visible,
        width: options.width,
      });
      if (options.svgShading !== 'none' || options.svgFill) {
        const image = await readFrame(() => pipeline().render());
        const albedo = await captureAlbedo(
          scene,
          camera,
          image.width,
          image.height,
          rig.group
        );
        svg = shadePanelSvg(svg, { image, albedo, options });
      }
      return svg;
    },

    dispose() {
      disconnectPointer?.();
      session?.dispose();
      captureAlbedo.dispose();
      rig.dispose();
      Object.values(pipelines).forEach(({ pipeline: p }) => p.dispose?.());
      depthPipeline?.dispose?.();
    },
  };
}
