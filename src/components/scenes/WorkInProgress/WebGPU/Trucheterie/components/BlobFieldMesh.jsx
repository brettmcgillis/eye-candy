import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import buildBlobField from '../utils/blobField';
import buildBlobColorNode from '../utils/blobShader';

// TurtleToy's pen is a fixed 0.25 units on its 200-unit canvas. Expressed in
// micro-cell units that reduces to a function of gridSize alone, so the line
// weight tracks the reference at any world canvas size.
const REFERENCE_CANVAS = 190;
const REFERENCE_PEN = 0.25;
// How far each quad is inflated past its cell, in pen half-widths, so a
// stroke on a cell edge can overhang instead of being sliced by the quad.
const MARGIN_PENS = 3;

const ATTRIBUTES = [
  ['instanceSize', 'sizes', 1],
  ['instanceCenter', 'centers', 2],
  ['instanceConn0', 'conn0', 2],
  ['instanceConn1', 'conn1', 2],
  ['instanceConnectors', 'connectorMask', 1],
];

// Standalone from useTileMesh: the blob field has no motif enum, no retile
// animation and no per-tile background, so it shares no instance attributes
// or uniforms with the square/triangular grids.
function BlobFieldMesh({ config }) {
  const {
    bgColor,
    blobCanvasSize,
    blobConnectivity,
    blobDebug,
    blobDistribution,
    blobGridSize,
    blobHoles,
    blobMeatballs,
    blobOneFill,
    blobPathsPerUnit,
    blobSeed,
    blobSizeFunction,
    strokeColor,
  } = config;

  const meshRef = useRef(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const field = useMemo(
    () =>
      buildBlobField({
        canvasSize: blobCanvasSize,
        connectivity: blobConnectivity,
        distributionCount: blobDistribution,
        gridSize: blobGridSize,
        holes: blobHoles,
        meatballs: blobMeatballs,
        oneFill: blobOneFill,
        seed: blobSeed,
        sizeFunction: blobSizeFunction,
      }),
    [
      blobCanvasSize,
      blobConnectivity,
      blobDistribution,
      blobGridSize,
      blobHoles,
      blobMeatballs,
      blobOneFill,
      blobSeed,
      blobSizeFunction,
    ]
  );

  const uniformsRef = useRef(null);
  if (!uniformsRef.current) {
    uniformsRef.current = {
      bgColorU: uniform(new THREE.Color(bgColor)),
      cellSizeU: uniform(field.cellSize),
      debugCellsU: uniform(0),
      debugConnectorsU: uniform(0),
      pathDivU: uniform(blobPathsPerUnit),
      penHalfWidthU: uniform(0),
      quadMarginU: uniform(0),
      referenceScaleU: uniform(1),
      strokeColorU: uniform(new THREE.Color(strokeColor)),
    };
  }

  const penHalfWidth = (REFERENCE_PEN / 2 / REFERENCE_CANVAS) * blobGridSize;
  const quadMargin = penHalfWidth * MARGIN_PENS;

  useEffect(() => {
    const u = uniformsRef.current;
    u.bgColorU.value.set(bgColor);
    u.strokeColorU.value.set(strokeColor);
    u.cellSizeU.value = field.cellSize;
    u.debugCellsU.value = blobDebug % 2;
    u.debugConnectorsU.value = Math.floor(blobDebug / 2) % 2;
    u.pathDivU.value = blobPathsPerUnit;
    u.penHalfWidthU.value = penHalfWidth;
    u.quadMarginU.value = quadMargin;
    u.referenceScaleU.value = REFERENCE_CANVAS / blobCanvasSize;
  }, [
    bgColor,
    blobCanvasSize,
    blobDebug,
    blobPathsPerUnit,
    field,
    penHalfWidth,
    quadMargin,
    strokeColor,
  ]);

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicNodeMaterial();
    mat.transparent = true;
    mat.depthWrite = false;
    mat.colorNode = buildBlobColorNode(uniformsRef.current);
    return mat;
  }, []);
  useEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    ATTRIBUTES.forEach(([name, key, itemSize]) => {
      const existing = mesh.geometry.getAttribute(name);
      if (existing && existing.array.length === field[key].length) {
        existing.array.set(field[key]);
        existing.needsUpdate = true;
      } else {
        mesh.geometry.setAttribute(
          name,
          new THREE.InstancedBufferAttribute(field[key], itemSize, false)
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
  }, [field, quadMargin]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(field.count, 1)]}
      frustumCulled={false}
    />
  );
}

export default memo(BlobFieldMesh);
