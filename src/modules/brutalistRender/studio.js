/* eslint-disable no-param-reassign */
import { mix, smoothstep, uniform, uv } from 'three/tsl';
import * as THREE from 'three/webgpu';

const ROOM_RADIUS = 12;
const ROOM_HEIGHT = 18;

export function createStudioUniforms() {
  const color = (hex) => uniform(new THREE.Color(hex));
  return {
    floor: color('#3a3a3a'),
    gradientEnd: uniform(0.8),
    gradientStart: uniform(0),
    plinth: color('#d8d4cc'),
    pool: color('#4a4a48'),
    wallHigh: color('#1a1a1a'),
    wallLow: color('#3a3a3a'),
  };
}

export function applyStudio(uniforms, config) {
  uniforms.floor.value.set(config.studioFloor);
  uniforms.pool.value.set(config.studioPool);
  uniforms.wallLow.value.set(config.studioWallLow);
  uniforms.wallHigh.value.set(config.studioWallHigh);
  uniforms.gradientStart.value = config.studioGradientStart;
  uniforms.gradientEnd.value = config.studioGradientEnd;
  uniforms.plinth.value.set(config.plinthColor);
}

// PetriDish's studio: a pooled floor disc inside an open-ended cyclorama
// that falls to black overhead, with a plinth for the model at its centre.
export function createStudio(uniforms) {
  const group = new THREE.Group();

  const floorMaterial = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 1,
  });
  floorMaterial.colorNode = mix(
    uniforms.pool,
    uniforms.floor,
    smoothstep(0.04, 0.42, uv().sub(0.5).length())
  );
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(ROOM_RADIUS * 1.02, 96),
    floorMaterial
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMaterial = new THREE.MeshBasicNodeMaterial({
    side: THREE.BackSide,
    toneMapped: false,
  });
  wallMaterial.colorNode = mix(
    uniforms.wallLow,
    uniforms.wallHigh,
    smoothstep(uniforms.gradientStart, uniforms.gradientEnd, uv().y)
  );
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(
      ROOM_RADIUS,
      ROOM_RADIUS,
      ROOM_HEIGHT,
      96,
      1,
      true
    ),
    wallMaterial
  );
  wall.position.y = ROOM_HEIGHT / 2;
  group.add(wall);

  const plinthMaterial = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.8,
  });
  plinthMaterial.colorNode = uniforms.plinth;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), plinthMaterial);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  return {
    group,

    // The plinth top spans the model's footprint plus a margin.
    fit(config, structure, scale) {
      const { max, min } = structure.bounds;
      const grow = 1 + config.plinthMargin * 2;
      const width = Math.max((max[0] - min[0]) * scale * grow, 0.2);
      const depth = Math.max((max[2] - min[2]) * scale * grow, 0.2);
      plinth.scale.set(width, config.plinthHeight, depth);
      plinth.position.set(
        ((max[0] + min[0]) / 2) * scale,
        config.plinthHeight / 2,
        ((max[2] + min[2]) / 2) * scale
      );
    },

    dispose() {
      [floor, wall, plinth].forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    },
  };
}
