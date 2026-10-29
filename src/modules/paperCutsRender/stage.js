import {
  Box3,
  Color,
  Group,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  TextureLoader,
} from 'three';

import { createFrame, loadFrame } from '@elements/Paperframe';
import {
  SCENE_KEYS,
  configFrom,
  generate,
  renderSvg,
  rollConfig,
  seedFor,
} from '@modules/paperCuts';
import { aimCamera } from '@modules/renderStage';
import { textureFile } from '@utils/appUtils';

import createPaperRig from './rig';
import createStudio from './studio';

export function rollArgs({ options, typed }) {
  return {
    palettes: options.palettes ?? undefined,
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    pinned: {
      ...(options.paperDesign ? { paperDesign: options.paperDesign } : {}),
      ...Object.fromEntries(
        [...typed]
          .filter((key) => SCENE_KEYS.includes(key))
          .map((key) => [key, options[key]])
      ),
    },
  };
}
export function compositionAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = { ...rollConfig(name, roll), frame: 'generated' };
  return { name, config, frame: generate(config) };
}

export async function createPaperStage({
  renderer,
  readFrame,
  width,
  height,
  transparent = false,
  shadows = true,
}) {
  const [gltf, texture] = await Promise.all([
    loadFrame(),
    new TextureLoader().loadAsync(textureFile('watercolor.png')),
  ]);
  const scene = new Scene();
  const paper = createPaperRig();
  const frameGroup = new Group();
  scene.add(paper.group, frameGroup);
  const cameras = {
    orthographic: new OrthographicCamera(-1, 1, 1, -1, 0.01, 100),
    perspective: new PerspectiveCamera(35, width / height, 0.01, 100),
  };
  const studio = createStudio({ shadows });
  scene.add(studio.group);
  renderer.setClearAlpha(transparent ? 0 : 1);
  Object.assign(renderer.shadowMap, {
    enabled: shadows,
    type: PCFSoftShadowMap,
  });
  let current = null;
  let frameMesh = null;
  let expansion = 0;
  let seconds = 0;
  const aim = (view) => {
    const camera = cameras[view.projection];
    if (view.projection === 'orthographic')
      Object.assign(camera, {
        left: -view.halfWidth,
        right: view.halfWidth,
        top: view.halfHeight,
        bottom: -view.halfHeight,
      });
    aimCamera(camera, view, width / height);
    return camera;
  };
  return {
    load(drawn) {
      current = drawn;
      seconds = 0;
      expansion = 0;
      const { config } = drawn;
      paper.apply(drawn.frame, config, texture);
      frameMesh?.removeFromParent();
      frameMesh?.material.dispose();
      frameMesh = createFrame(gltf, config, texture);
      frameGroup.add(frameMesh);
      frameGroup.scale.setScalar(11);
      frameGroup.rotation.z = config.rotate ? 0 : -Math.PI / 4;
      frameGroup.position.z = -0.8;
      frameGroup.visible = config.frameVisible;
      studio.apply(config);
      scene.background = transparent ? null : new Color(config.backgroundColor);
      const bounds = new Box3().setFromObject(paper.group);
      if (bounds.isEmpty()) {
        bounds.min.set(-1, -1, -0.1);
        bounds.max.set(1, 1, 0.1);
      }
      if (config.frameVisible)
        bounds.union(new Box3().setFromObject(frameGroup));
      return { min: bounds.min.toArray(), max: bounds.max.toArray() };
    },
    step(delta) {
      seconds += delta;
    },
    capture(view, relief = 0, time = seconds) {
      expansion = relief;
      paper.update(expansion);
      paper.animate(time);
      const camera = aim(view);
      return readFrame(() => renderer.render(scene, camera));
    },
    svg(view, options) {
      return renderSvg({
        frame: current.frame,
        config: current.config,
        camera: view,
        options,
        expansion,
      });
    },
    dispose() {
      paper.dispose();
      frameMesh?.material.dispose();
      texture.dispose();
      studio.dispose();
    },
  };
}
