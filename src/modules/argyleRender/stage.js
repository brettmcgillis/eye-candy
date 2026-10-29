import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { renderSvg } from '@modules/argyle';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { setBackdrop } from '@modules/renderStage';

import LIGHTING from './lighting';
import createRig from './rig';

export default function createStage({
  renderer,
  readFrame,
  width,
  height,
  samples = 4,
  transparent = false,
}) {
  /* eslint-disable-next-line no-param-reassign */
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const rig = createRig();
  const lights = createSceneLights(
    buildSceneLightingRuntimeConfig({ controls: {}, lighting: LIGHTING })
  );
  scene.add(rig.group, lights);
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500),
    perspective: new THREE.PerspectiveCamera(35, width / height, 0.1, 500),
  };
  const pipelines = {};
  let elapsed = 0;
  let current = null;
  function aim(view) {
    const camera = cameras[view.projection];
    Object.assign(camera, { near: view.near, far: view.far });
    if (view.projection === 'orthographic')
      Object.assign(camera, {
        left: -view.halfWidth,
        right: view.halfWidth,
        top: view.halfHeight,
        bottom: -view.halfHeight,
      });
    else Object.assign(camera, { fov: view.fov, aspect: width / height });
    camera.position.set(...view.eye);
    camera.up.set(...view.up);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (!pipelines[view.projection]) {
      const pipeline = new THREE.RenderPipeline(renderer);
      pipeline.outputNode = pass(scene, camera, samples > 0 ? { samples } : {});
      pipelines[view.projection] = pipeline;
    }
    return pipelines[view.projection];
  }
  return {
    rig,
    load(drawn) {
      current = drawn;
      current.snapshot = { ...drawn.config };
      elapsed = 0;
      const bounds = rig.apply(drawn.config);
      setBackdrop({ renderer, scene }, drawn.config.background, transparent);
      return bounds;
    },
    step(delta) {
      elapsed += delta;
    },
    capture(view, seconds = elapsed) {
      const pipeline = aim(view);
      rig.update(seconds, cameras[view.projection]);
      current.snapshot.phase =
        (((current.config.phase + seconds / current.config.loopSeconds) % 1) +
          1) %
        1;
      return readFrame(() => pipeline.render());
    },
    svg(view, options) {
      return renderSvg(rig.field, view, options);
    },
    dispose() {
      rig.dispose();
      lights.clear();
      Object.values(pipelines).forEach((p) => p.dispose());
    },
    get config() {
      return current?.config;
    },
  };
}
