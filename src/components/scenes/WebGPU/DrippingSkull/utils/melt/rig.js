import {
  IcosahedronGeometry,
  InstancedBufferGeometry,
  Matrix4,
  Mesh,
} from 'three/webgpu';

import createDropNodes from './dropNode';
import createMaterial from './materials';
import createPuddleNodes from './puddleNode';
import { createShape } from './shape.mjs';
import createSimulation from './simulation.mjs';
import createSurfaceNodes from './surfaceNode';

export default function createRig(geometry, { lite, floorY, seed, display }) {
  const shape = createShape(geometry, lite, display);
  const simulation = createSimulation(shape, {
    lite,
    floorY,
    seed,
  });
  const { field, pendants, drops, puddle, layout } = simulation;
  const surface = createSurfaceNodes(shape, field, pendants, layout, !lite);
  const dropNodes = createDropNodes(drops);
  const puddleNodes = createPuddleNodes(puddle);
  const bodyLook = createMaterial(surface);
  const dropLook = createMaterial(dropNodes, { wet: true });
  const puddleLook = createMaterial(puddleNodes, { wet: true });
  const dropGeometry = new InstancedBufferGeometry().copy(
    new IcosahedronGeometry(1, lite ? 2 : 3)
  );
  dropGeometry.instanceCount = 0;
  const dropMesh = new Mesh(dropGeometry, dropLook.material);
  dropMesh.frustumCulled = false;
  dropMesh.castShadow = true;
  const puddleMesh = new Mesh(puddle.createGeometry(), puddleLook.material);
  puddleMesh.frustumCulled = false;
  puddleMesh.receiveShadow = true;
  return {
    shape,
    userData: { melt: simulation, shutterMatrixWorld: new Matrix4() },
    simulation,
    surface,
    puddleNodes,
    dropMesh,
    puddleMesh,
    materials: [bodyLook, dropLook, puddleLook],
    dispose() {
      surface.dispose();
      puddleNodes.dispose();
      simulation.dispose();
      shape.dispose();
      dropGeometry.dispose();
      puddleMesh.geometry.dispose();
      [bodyLook, dropLook, puddleLook].forEach(({ material }) =>
        material.dispose()
      );
    },
  };
}
