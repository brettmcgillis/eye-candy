import * as THREE from 'three/webgpu';

import { GEOMETRIES, SEE_THROUGH } from '@modules/controlPanel';

import createCables from './cables';
import createStudio from './environment';
import createGeometry from './geometry';
import createLayer from './layer';
import createPartMaterial from './materials';

const bucket = (parts) => {
  const out = Object.fromEntries(GEOMETRIES.map((id) => [id, []]));
  parts.forEach((item) => out[item.g].push(item));
  return out;
};

// The panel as one imperative object, drawn by both the scene and the
// headless CLIs: `setStatics` lays out what never moves (rebuilt with the
// panel), `setMoving` what a pose returns each frame.
// Primitives turned on a lathe: their metal is spun, not brushed flat.
const ROUND = new Set(['cyl', 'knurl', 'cap', 'torus', 'dish']);

export default function createPanelRig() {
  const group = new THREE.Group();
  const studio = createStudio();
  const cables = createCables(group);
  const templates = Object.fromEntries(
    GEOMETRIES.map((id) => [id, createGeometry(id)])
  );
  const layerSet = () =>
    Object.fromEntries(
      GEOMETRIES.map((id) => [
        id,
        createLayer({
          buildMaterial: () =>
            createPartMaterial({
              doubleSided: id === 'dish',
              glow: id === 'glow',
              lens: id === 'lens',
              round: ROUND.has(id),
              rounded: id === 'rbox',
              torus: id === 'torus',
            }),
          group,
          shadows: !SEE_THROUGH.has(id),
          template: templates[id],
        }),
      ])
    );
  const statics = layerSet();
  const moving = layerSet();
  const fill = (layers, parts) => {
    const byShape = bucket(parts);
    GEOMETRIES.forEach((id) => layers[id].set(byShape[id]));
  };

  return {
    group,
    setCables: (patch, offsets, reveals = null) =>
      cables.update(patch, offsets, reveals),
    setMoving: (parts) => fill(moving, parts),
    setStatics: (parts) => fill(statics, parts),

    // The studio needs the renderer, so it is baked lazily.
    updateEnvironment(renderer, scene, config) {
      studio.update(renderer, config);
      /* eslint-disable no-param-reassign */
      scene.environment = studio.texture;
      scene.environmentIntensity = config.envIntensity;
      /* eslint-enable no-param-reassign */
    },

    setShadows(cast) {
      cables.setShadows(cast);
      [statics, moving].forEach((layers) =>
        Object.values(layers).forEach((layer) => layer.setShadows(cast))
      );
    },

    dispose() {
      [statics, moving].forEach((layers) =>
        Object.values(layers).forEach((layer) => layer.dispose())
      );
      Object.values(templates).forEach((template) => template.dispose());
      studio.dispose();
      cables.dispose();
    },
  };
}
