/* eslint-disable no-param-reassign */
import {
  attribute,
  float,
  mix,
  normalWorld,
  output,
  positionGeometry,
  smoothstep,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { surfaceLook, threadLook, toneOutput } from './look';

// Draw-in: a vertex appears once `progress` passes its `reveal`, growing out
// of its tube's axis over the last `taper` of the way, so a growing wire ends
// in a rounded tip instead of an open pipe. Shells, whose centre is the
// vertex itself, are masked instead. The front runs to 1 + taper, so a
// finished draw is the whole exhibit.
function drawNodes(draw) {
  const reveal = attribute('aReveal', 'float');
  const centre = attribute('aCenter', 'vec3');
  const front = draw.progress.mul(draw.taper.add(1));
  const grow = smoothstep(reveal, reveal.add(draw.taper), front);
  return {
    mask: reveal.lessThanEqual(front),
    position: mix(centre, positionGeometry, grow),
  };
}

function createBodyMaterial(look, stage, draw, name) {
  const material = new THREE.MeshPhysicalNodeMaterial({
    side: THREE.DoubleSide,
  });
  const structure = attribute('aStructure', 'float');
  const surface = surfaceLook(
    look,
    positionGeometry,
    normalWorld,
    structure,
    name
  );
  const { mask, position } = drawNodes(draw);
  material.colorNode = surface.albedo;
  material.roughnessNode = surface.rough;
  material.metalnessNode = surface.metal;
  material.clearcoatNode = surface.clearcoat;
  material.clearcoatRoughnessNode = float(0.08);
  material.positionNode = position;
  material.maskNode = mask;
  material.outputNode = toneOutput(output, stage.exposure);
  return material;
}

function createThreadMaterial(look, stage, draw, colorNode) {
  const material = new THREE.MeshPhysicalNodeMaterial();
  const structure = attribute('aStructure', 'float');
  const { mask, position } = drawNodes(draw);
  material.colorNode = threadLook(look, colorNode, positionGeometry, structure);
  material.roughnessNode = float(0.85);
  material.metalnessNode = float(0);
  material.sheenNode = colorNode.mul(0.6);
  material.sheenRoughnessNode = float(0.5);
  material.positionNode = position;
  material.maskNode = mask;
  material.outputNode = toneOutput(output, stage.exposure);
  return material;
}

function toGeometry(part) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(part.positions, 3)
  );
  geometry.setAttribute('normal', new THREE.BufferAttribute(part.normals, 3));
  geometry.setAttribute('aCenter', new THREE.BufferAttribute(part.centers, 3));
  geometry.setAttribute('aReveal', new THREE.BufferAttribute(part.reveal, 1));
  geometry.setAttribute(
    'aStructure',
    new THREE.BufferAttribute(part.structure, 1)
  );
  geometry.setIndex(new THREE.BufferAttribute(part.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

// The mesh exhibit: one mesh per material role, its geometry swapped
// whenever the kernel rebuilds.
export default function createMeshLayer(look, stage) {
  const draw = { progress: uniform(1), taper: uniform(0.02) };
  const group = new THREE.Group();
  const bodies = new Map();
  const bodyFor = (name) => {
    if (!bodies.has(name)) {
      bodies.set(name, createBodyMaterial(look, stage, draw, name));
    }
    return bodies.get(name);
  };
  const roles = {
    body: bodyFor('plaster'),
    thread: createThreadMaterial(look, stage, draw, look.threadColor),
    thread2: createThreadMaterial(look, stage, draw, look.threadColor2),
  };
  const meshes = Object.fromEntries(
    Object.entries(roles).map(([role, material]) => {
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = false;
      group.add(mesh);
      return [role, mesh];
    })
  );

  return {
    draw,
    group,

    setMaterial(name) {
      meshes.body.material = bodyFor(name);
    },

    setParts(parts) {
      Object.entries(meshes).forEach(([role, mesh]) => {
        const part = parts?.[role];
        mesh.geometry.dispose();
        mesh.geometry =
          part && part.indices.length > 0
            ? toGeometry(part)
            : new THREE.BufferGeometry();
        mesh.visible = Boolean(part && part.indices.length > 0);
      });
    },

    dispose() {
      Object.values(meshes).forEach((mesh) => mesh.geometry.dispose());
      bodies.forEach((material) => material.dispose());
      meshes.thread.material.dispose();
      meshes.thread2.material.dispose();
    },
  };
}
