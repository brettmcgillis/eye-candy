import * as THREE from 'three/webgpu';

import { meshEntry } from '@modules/renderStage';

import ensureSkinMasks from './furMask';

const box = new THREE.Box3();
const vertex = new THREE.Vector3();

const entryOf = (mesh) => ({
  ...meshEntry(mesh, mesh.matrixWorld),
  doubleSided: Boolean(mesh.userData.doubleSided),
});

// Per vertex, where no fur grows (eyes, teeth: the shell fur's own mask)
// and which of that is eye.
function skinWeights(mesh) {
  const { eye, fur } = ensureSkinMasks(mesh.geometry);
  return {
    bald: fur.array.map((value) => 1 - value),
    eye: Float32Array.from(eye.array),
  };
}

// Every plotted mesh under the arrows, split into the arrows proper and the
// ribbon wraps tied round them.
function arrowMeshes(groups = []) {
  const arrows = [];
  const wraps = [];
  groups.forEach((group) =>
    group?.traverseVisible((object) => {
      if (!object.isMesh || object.userData.plot === false) return;
      (object.userData.plotPart === 'ribbon' ? wraps : arrows).push(object);
    })
  );
  return { arrows, wraps };
}

function readGrass(grass, time) {
  if (!grass?.mesh) return null;
  const { mesh, pressers, uniforms } = grass;
  const { geometry } = mesh;
  return {
    count: geometry.instanceCount,
    data: Float32Array.from(geometry.attributes.instanceData.array),
    matrix: Array.from(mesh.matrixWorld.elements),
    offsets: Float32Array.from(geometry.attributes.instanceOffset.array),
    pressers: {
      count: pressers.count,
      points: pressers.points.map((p) => p.toArray()),
    },
    time,
    uniforms: Object.fromEntries(
      [
        'bladeHeight',
        'pressReach',
        'windScale',
        'windSpeed',
        'windStrength',
      ].map((key) => [key, uniforms[key].value])
    ),
  };
}

// The posed subject as the plot reads it: the rabbit skinned on the CPU
// exactly as the GPU skins him (with his own frame for the slices), each
// arrow and ribbon mesh in world space, and the grass as the instance data
// and uniforms its blades are drawn from at TSL `time`.
export function readSubject(handles, time = 0) {
  handles.subject.updateWorldMatrix(true, true);
  const { arrows, wraps } = arrowMeshes(handles.arrows);
  // eslint-disable-next-line no-param-reassign
  handles.skinWeights ??= skinWeights(handles.rabbit);
  return {
    arrows: arrows.map(entryOf),
    grass: readGrass(handles.grass, time),
    rabbit: {
      inverse: Array.from(
        handles.rabbitRoot.matrixWorld.clone().invert().elements
      ),
      meshes: [
        {
          ...entryOf(handles.rabbit),
          ...handles.skinWeights,
        },
      ],
    },
    ribbon: [...(handles.ribbon ?? []).filter(Boolean), ...wraps].map(entryOf),
  };
}

// The rabbit alone (his body, ink hull and fur), for the silhouette and
// shading mask.
export const rabbitOnly = (handles) => [handles.model.scene];

// Points on the posed subject for the framing to fit: the rabbit's skinned
// vertices, every arrow and ribbon mesh's box and the grass blades' roots
// and tops.
export function subjectPoints(handles) {
  handles.subject.updateWorldMatrix(true, true);
  const points = [];
  const { rabbit } = handles;
  const { count } = rabbit.geometry.attributes.position;
  for (let i = 0; i < count; i += 23) {
    rabbit.getVertexPosition(i, vertex).applyMatrix4(rabbit.matrixWorld);
    points.push(vertex.toArray());
  }
  const { arrows, wraps } = arrowMeshes(handles.arrows);
  [...arrows, ...wraps, ...(handles.ribbon ?? []).filter(Boolean)].forEach(
    (mesh) => {
      box.setFromObject(mesh);
      points.push(box.min.toArray(), box.max.toArray());
    }
  );
  const grass = handles.grass?.mesh;
  if (grass) {
    const { instanceCount, attributes } = grass.geometry;
    const offsets = attributes.instanceOffset.array;
    const top = handles.grass.uniforms.bladeHeight.value;
    for (let i = 0; i < instanceCount; i += 5) {
      vertex.fromArray(offsets, i * 3).applyMatrix4(grass.matrixWorld);
      points.push(vertex.toArray(), [vertex.x, vertex.y + top, vertex.z]);
    }
  }
  return points;
}

// Whether the stage has mounted everything a capture reads.
export const subjectReady = (handles) =>
  Boolean(
    handles.subject &&
    handles.rabbit &&
    handles.grass?.mesh &&
    handles.arrows?.length &&
    handles.arrows.every(Boolean)
  );
