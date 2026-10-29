import { AmbientLight, DirectionalLight, Group } from 'three';

export default function createStudio({ shadows = true, scale = 1 } = {}) {
  const group = new Group();
  const key = new DirectionalLight('#ffffff', 2.5);
  key.position.set(-6 * scale, 8 * scale, 10 * scale);
  key.castShadow = shadows;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -10 * scale,
    right: 10 * scale,
    top: 10 * scale,
    bottom: -10 * scale,
    near: 0.1 * scale,
    far: 40 * scale,
  });
  key.shadow.normalBias = 0.01 * scale;
  key.shadow.bias = -0.0002;
  const fill = new AmbientLight('#ffffff', 1.5);
  group.add(key, key.target, fill);
  return {
    group,
    apply(config) {
      key.intensity = config.keyIntensity;
      fill.intensity = config.fillIntensity;
    },
    dispose() {
      key.shadow.dispose();
    },
  };
}
