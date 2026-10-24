import * as TSL from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createAlbedoCapture, setBackdrop } from '@modules/renderStage/capture';

import FLORA_LIGHTING from './lighting';
import placeFlower from './placement';
import createSpecimenRig from './specimenRig';

export function createFloraStage(
  kernel,
  {
    height,
    pixelRatio = 1,
    readFrame,
    renderer,
    samples = 4,
    shadows = true,
    transparent = false,
    width,
  }
) {
  const { flora, lights } = kernel;
  /* eslint-disable no-param-reassign */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* eslint-enable no-param-reassign */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 400);
  const post = new THREE.RenderPipeline(renderer);
  post.outputNode = TSL.pass(scene, camera, samples > 0 ? { samples } : {});
  const rigs = [];
  let lightGroup = null;
  let lightKey = null;
  let flowers = [];
  let extent = { radius: 10 };
  let depthPipeline = null;
  let readAlbedo = null;

  function aimCamera({ eye, fov, target }) {
    const distance = Math.hypot(
      ...eye.map((value, axis) => value - target[axis])
    );
    camera.near = Math.max(0.05, distance - extent.radius * 2);
    camera.far = distance + extent.radius * 2.5;
    camera.fov = fov;
    camera.position.set(...eye);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }

  function rigAt(index) {
    while (rigs.length <= index)
      rigs.push({ rig: createSpecimenRig(), specimen: null });
    return rigs[index];
  }

  function setLights(config, bounds) {
    const key = JSON.stringify([config.backgroundColor, bounds]);
    if (key === lightKey) return;
    lightKey = key;
    lightGroup?.removeFromParent();
    lightGroup = lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: FLORA_LIGHTING,
      }),
      { shadows }
    );
    const center = bounds.min.map(
      (value, axis) => (value + bounds.max[axis]) / 2
    );
    const radius =
      Math.hypot(...bounds.max.map((value, axis) => value - bounds.min[axis])) /
      2;
    lightGroup.children.forEach((light) => {
      if (!light.isDirectionalLight) return;
      const shift = new THREE.Vector3(...center).sub(light.target.position);
      light.target.position.add(shift);
      light.position.add(shift);
      if (!light.shadow) return;
      const half = Math.max(light.shadow.camera.right, radius * 1.15);
      Object.assign(light.shadow.camera, {
        bottom: -half,
        left: -half,
        right: half,
        top: half,
      });
      light.shadow.camera.updateProjectionMatrix();
    });
    scene.add(lightGroup);
    setBackdrop({ renderer, scene }, config.backgroundColor, transparent);
  }

  function depthPass() {
    if (depthPipeline) return depthPipeline;
    const unit = TSL.pass(scene, camera)
      .getLinearDepthNode()
      .clamp(0, 1)
      .mul(65535);
    const high = unit.div(256).floor();
    depthPipeline = new THREE.RenderPipeline(renderer);
    depthPipeline.outputColorTransform = false;
    depthPipeline.outputNode = TSL.vec4(
      high.div(255),
      unit.sub(high.mul(256)).floor().div(255),
      0,
      1
    );
    return depthPipeline;
  }

  return {
    load(entries) {
      flowers = entries;
      rigs.forEach(({ rig }, index) => {
        if (index >= entries.length) rig.group.removeFromParent();
      });
      const boxes = entries.map((entry, index) => {
        const slot = rigAt(index);
        if (slot.specimen !== entry.specimen) {
          slot.rig.load(entry.specimen);
          slot.specimen = entry.specimen;
        }
        slot.rig.setConfig({
          ...entry.config,
          minPixels: entry.config.minPixels * pixelRatio,
          ornamentMinPixels: entry.config.ornamentMinPixels * pixelRatio,
        });
        placeFlower(slot.rig.group, entry.placement);
        scene.add(slot.rig.group);
        const point = new THREE.Vector3();
        return flora.specimenBounds(entry.specimen, (position) =>
          point
            .set(...position)
            .applyMatrix4(slot.rig.group.matrixWorld)
            .toArray()
        );
      });
      const bounds = {
        max: [0, 1, 2].map((axis) =>
          Math.max(...boxes.map((box) => box.max[axis]))
        ),
        min: [0, 1, 2].map((axis) =>
          Math.min(...boxes.map((box) => box.min[axis]))
        ),
      };
      extent = {
        radius:
          Math.hypot(
            ...bounds.max.map((value, axis) => value - bounds.min[axis])
          ) / 2 || 1,
      };
      setLights(entries[0].config, bounds);
      return bounds;
    },
    async capture({ eye, fov, levels, target }) {
      flowers.forEach((entry, index) =>
        rigs[index].rig.setLevels(levels(entry.config))
      );
      aimCamera({ eye, fov, target });
      return readFrame(() => post.render());
    },
    async captureDepth(view, { ornamentsOnly = false } = {}) {
      aimCamera(view);
      const strands = rigs.map(({ rig }) => [
        rig.strandMesh,
        rig.strandMesh.visible,
      ]);
      let frame;
      try {
        if (ornamentsOnly)
          strands.forEach(([mesh]) => {
            Object.assign(mesh, { visible: false });
          });
        frame = await readFrame(() => depthPass().render());
      } finally {
        strands.forEach(([mesh, visible]) => {
          Object.assign(mesh, { visible });
        });
      }
      const depths = new Float32Array(frame.width * frame.height);
      const covered = new Uint8Array(depths.length);
      for (let index = 0; index < depths.length; index += 1) {
        const unit =
          (frame.data[index * 4] * 256 + frame.data[index * 4 + 1]) / 65535;
        depths[index] = camera.near + unit * (camera.far - camera.near);
        covered[index] = unit < 1 ? 1 : 0;
      }
      return {
        covered,
        data: depths,
        tolerance: ((camera.far - camera.near) * 2) / 65535,
        height: frame.height,
        width: frame.width,
      };
    },
    async captureAlbedo(view) {
      aimCamera(view);
      readAlbedo ??= createAlbedoCapture(renderer);
      let result;
      await readFrame(() => {
        result = readAlbedo(
          scene,
          camera,
          width,
          height,
          flowers.map((_, index) => rigs[index].rig.group)
        );
      });
      return result;
    },
    depthProbe(depth) {
      return (x, y, z) => {
        const px = Math.floor(x * pixelRatio);
        const py = Math.floor(y * pixelRatio);
        return (
          px < 0 ||
          py < 0 ||
          px >= depth.width ||
          py >= depth.height ||
          z <= depth.data[py * depth.width + px]
        );
      };
    },
    matrices() {
      return flowers.map((entry, index) =>
        Array.from(rigs[index].rig.group.matrixWorld.elements)
      );
    },
    dispose() {
      rigs.forEach(({ rig }) => rig.dispose());
      post.dispose();
      depthPipeline?.dispose();
      readAlbedo?.dispose();
    },
  };
}

export default createFloraStage;
