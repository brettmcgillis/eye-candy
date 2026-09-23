import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import buildBlobColorNode from './blobShader';

// TurtleToy's pen is a fixed 0.25 units on its 200-unit canvas. Expressed in
// micro-cell units that reduces to a function of gridSize alone, so the line
// weight tracks the reference at any world canvas size.
export const REFERENCE_CANVAS = 190;
export const REFERENCE_PEN = 0.25;
// How far each quad is inflated past its cell, in pen half-widths, so a
// stroke tangent to a cell edge can overhang instead of being sliced by the
// quad. One half-width covers the pen itself; the rest is AA headroom.
export const MARGIN_PENS = 1.5;

// The connector mask and growth delay share one vec2: with position, normal,
// uv and the instance matrix, a seventh instanced attribute would take the
// material past WebGPU's eight vertex buffers and the pipeline would fail.
function connectorsAndDelay(field) {
  const packed = new Float32Array(field.count * 2);
  for (let i = 0; i < field.count; i += 1) {
    packed[i * 2] = field.connectorMask[i];
    packed[i * 2 + 1] = field.delays[i];
  }
  return packed;
}

export const ATTRIBUTES = [
  ['instanceSize', (field) => field.sizes, 1],
  ['instanceCenter', (field) => field.centers, 2],
  ['instanceConn0', (field) => field.conn0, 2],
  ['instanceConn1', (field) => field.conn1, 2],
  ['instanceMeta', connectorsAndDelay, 2],
];

export function penGeometry(blobGridSize) {
  const penHalfWidth = (REFERENCE_PEN / 2 / REFERENCE_CANVAS) * blobGridSize;
  return { penHalfWidth, quadMargin: penHalfWidth * MARGIN_PENS };
}

// One set of uniforms, reused across re-generations. The R3F scene and the
// headless capturer both build their material from these so the two draw
// with the literal same shader graph — see docs/flora-pipeline.md's rule 2.
export function createBlobUniforms(strokeColor) {
  return {
    cellSizeU: uniform(1),
    maxLanesU: uniform(1),
    debugCellsU: uniform(0),
    debugConnectorsU: uniform(0),
    // Above the highest possible reveal depth (1), so growth gating is a
    // no-op until a video explicitly drives it down — see setGrowth() in
    // scripts/lib/trucheterieBlobRender.mjs.
    growthU: uniform(2),
    spectrumU: uniform(0),
    spectrumBlendU: uniform(0),
    spectrumPhaseU: uniform(0),
    stopCountU: uniform(1),
    pathDivU: uniform(1),
    penHalfWidthU: uniform(0),
    quadMarginU: uniform(0),
    referenceScaleU: uniform(1),
    showStrokesU: uniform(1),
    strokeColorU: uniform(new THREE.Color(strokeColor)),
  };
}

export function createBlobMaterial(uniforms, laneTextures) {
  const material = new THREE.MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.colorNode = buildBlobColorNode({ ...uniforms, laneTextures });
  return material;
}

// Refreshes the uniforms for a field/config pair. `laneInfo` is
// laneTexture.js's `fillLaneTextures` result.
/* eslint-disable no-param-reassign */
export function syncBlobUniforms(
  uniforms,
  { blobCanvasSize, config, field, laneInfo }
) {
  const { penHalfWidth, quadMargin } = penGeometry(config.blobGridSize);
  uniforms.strokeColorU.value.set(config.strokeColor);
  uniforms.maxLanesU.value = laneInfo.maxLanes;
  uniforms.spectrumU.value = laneInfo.spectrum ? 1 : 0;
  uniforms.spectrumBlendU.value = laneInfo.exact ? 0 : 1;
  uniforms.stopCountU.value = laneInfo.stopCount;
  uniforms.cellSizeU.value = field.cellSize;
  uniforms.debugCellsU.value = config.blobDebug % 2;
  uniforms.debugConnectorsU.value = Math.floor(config.blobDebug / 2) % 2;
  uniforms.pathDivU.value = config.blobPathsPerUnit;
  uniforms.penHalfWidthU.value = penHalfWidth;
  uniforms.quadMarginU.value = quadMargin;
  uniforms.referenceScaleU.value = REFERENCE_CANVAS / blobCanvasSize;
  uniforms.showStrokesU.value = config.blobShowStrokes ? 1 : 0;
  return { penHalfWidth, quadMargin };
}
/* eslint-enable no-param-reassign */

// Uploads a field's instance attributes and matrices onto an existing
// InstancedMesh, reusing buffers where the instance count is unchanged.
/* eslint-disable no-param-reassign */
export function applyFieldToMesh(mesh, field, quadMargin) {
  ATTRIBUTES.forEach(([name, read, itemSize]) => {
    const data = read(field);
    const existing = mesh.geometry.getAttribute(name);
    if (existing && existing.array.length === data.length) {
      existing.array.set(data);
      existing.needsUpdate = true;
    } else {
      mesh.geometry.setAttribute(
        name,
        new THREE.InstancedBufferAttribute(data, itemSize, false)
      );
    }
  });

  const dummy = new THREE.Object3D();
  for (let i = 0; i < field.count; i += 1) {
    dummy.position.set(
      field.positions[i * 3 + 0],
      field.positions[i * 3 + 1],
      0
    );
    dummy.scale.setScalar((field.sizes[i] + quadMargin * 2) * field.cellSize);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = field.count;
}
/* eslint-enable no-param-reassign */
