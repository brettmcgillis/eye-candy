import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const PLANE_FORWARD = new THREE.Vector3(0, 0, 1);

export const DEFAULT_BOLT_LAYERS = [
  {
    alpha: 0.18,
    color: '#4764e1',
    thickness: 0.34,
  },
  {
    alpha: 0.55,
    color: '#1072bd',
    thickness: 0.13,
  },
  {
    alpha: 1,
    color: '#aceeff',
    thickness: 0.038,
  },
];

const REFERENCE_BOLT_LENGTH = 15;
const MIN_BOLT_LENGTH_SCALE = 0.18;

function buildBoltRibbonGeometry(
  points,
  strikeOffset,
  thickness,
  alpha,
  color
) {
  const segments = points.length - 1;
  const vertexCount = segments * 4;
  const positions = new Float32Array(vertexCount * 3);
  const ratios = new Float32Array(vertexCount);
  const directions = new Float32Array(vertexCount * 3);
  const sides = new Float32Array(vertexCount);
  const strikeOffsets = new Float32Array(vertexCount).fill(strikeOffset);
  const thicknesses = new Float32Array(vertexCount).fill(thickness);
  const alphas = new Float32Array(vertexCount).fill(alpha);
  const colors = new Float32Array(vertexCount * 3);
  const indices = [];

  for (let index = 0; index < segments; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const startRatio = index / (points.length - 1);
    const endRatio = (index + 1) / (points.length - 1);
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const vertexIndex = index * 4;
    const vertices = [
      [start, startRatio, -0.5],
      [start, startRatio, 0.5],
      [end, endRatio, -0.5],
      [end, endRatio, 0.5],
    ];

    vertices.forEach(([point, ratio, side], vertexOffset) => {
      const attributeOffset = (vertexIndex + vertexOffset) * 3;
      positions[attributeOffset] = point.x;
      positions[attributeOffset + 1] = point.y;
      positions[attributeOffset + 2] = point.z;
      ratios[vertexIndex + vertexOffset] = ratio;
      directions[attributeOffset] = direction.x;
      directions[attributeOffset + 1] = direction.y;
      directions[attributeOffset + 2] = direction.z;
      sides[vertexIndex + vertexOffset] = side;
      colors[attributeOffset] = color.r;
      colors[attributeOffset + 1] = color.g;
      colors[attributeOffset + 2] = color.b;
    });

    indices.push(
      vertexIndex,
      vertexIndex + 1,
      vertexIndex + 2,
      vertexIndex + 1,
      vertexIndex + 3,
      vertexIndex + 2
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRatio', new THREE.BufferAttribute(ratios, 1));
  geometry.setAttribute('aDirection', new THREE.BufferAttribute(directions, 3));
  geometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1));
  geometry.setAttribute(
    'aStrikeOffset',
    new THREE.BufferAttribute(strikeOffsets, 1)
  );
  geometry.setAttribute(
    'aThickness',
    new THREE.BufferAttribute(thicknesses, 1)
  );
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function buildLightningBoltGeometry({
  coreColor,
  glowColor,
  layers = DEFAULT_BOLT_LAYERS,
  strands,
  thickness,
}) {
  const geometries = [];

  for (let index = 0; index < strands.length; index += 1) {
    const strand = strands[index];

    for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
      const layer = layers[layerIndex];
      const color = new THREE.Color(
        layer.color ?? (layer.colorKey === 'core' ? coreColor : glowColor)
      );
      const layerThickness =
        layer.thickness ?? thickness * layer.thicknessMultiplier;
      const layerAlpha = layer.alpha ?? layer.opacityMultiplier;

      geometries.push(
        buildBoltRibbonGeometry(
          strand.points,
          strand.strikeOffset ?? 0,
          layerThickness * strand.radiusMultiplier,
          strand.opacityMultiplier * layerAlpha,
          color
        )
      );
    }
  }

  const mergedGeometry = mergeGeometries(geometries);
  geometries.forEach((geometry) => geometry.dispose());
  return mergedGeometry;
}

export function getBoltLengthScale(source, target) {
  const strikeLength = source.distanceTo(target);

  return THREE.MathUtils.clamp(
    strikeLength / REFERENCE_BOLT_LENGTH,
    MIN_BOLT_LENGTH_SCALE,
    1
  );
}

export function getImpactTransform(target, normal, offset = 0.03) {
  const safeNormal = normal.clone().normalize();
  const position = target.clone().addScaledVector(safeNormal, offset);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    PLANE_FORWARD,
    safeNormal
  );

  return { position, quaternion };
}
