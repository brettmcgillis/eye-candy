import { Float32BufferAttribute } from 'three';

// Writes a per-vertex `prayerGradient` attribute (0 at the fingertips, 1 at the
// wrist) so the gradient hand materials (e.g. Black Blood) can fade tip→wrist.
// The wrist end is detected as the wider cross-section along the model's
// dominant axis, so it works regardless of which way a given hand model points.

const PRAYER_GRADIENT_ATTRIBUTE = 'prayerGradient';
const EDGE_SAMPLE_FRACTION = 0.1;

function getAxisValueFromBox(box, axisIndex, edge) {
  if (axisIndex === 0) return edge === 'min' ? box.min.x : box.max.x;
  if (axisIndex === 1) return edge === 'min' ? box.min.y : box.max.y;
  return edge === 'min' ? box.min.z : box.max.z;
}

function getPositionAxisValue(positionAttribute, vertexIndex, axisIndex) {
  if (axisIndex === 0) return positionAttribute.getX(vertexIndex);
  if (axisIndex === 1) return positionAttribute.getY(vertexIndex);
  return positionAttribute.getZ(vertexIndex);
}

function getPerpendicularAxisValues(positionAttribute, vertexIndex, axisIndex) {
  if (axisIndex === 0) {
    return [
      positionAttribute.getY(vertexIndex),
      positionAttribute.getZ(vertexIndex),
    ];
  }

  if (axisIndex === 1) {
    return [
      positionAttribute.getX(vertexIndex),
      positionAttribute.getZ(vertexIndex),
    ];
  }

  return [
    positionAttribute.getX(vertexIndex),
    positionAttribute.getY(vertexIndex),
  ];
}

function getDominantAxisIndex(box) {
  const spans = [
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z,
  ];

  if (spans[1] > spans[0] && spans[1] >= spans[2]) return 1;
  if (spans[2] > spans[0] && spans[2] > spans[1]) return 2;
  return 0;
}

function measureSliceArea(
  positionAttribute,
  axisIndex,
  edgeValue,
  sliceSpan,
  edge
) {
  let minA = Infinity;
  let maxA = -Infinity;
  let minB = Infinity;
  let maxB = -Infinity;
  let sampleCount = 0;

  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex += 1
  ) {
    const axisValue = getPositionAxisValue(
      positionAttribute,
      vertexIndex,
      axisIndex
    );
    const inSlice =
      edge === 'min'
        ? axisValue <= edgeValue + sliceSpan
        : axisValue >= edgeValue - sliceSpan;

    if (inSlice) {
      const [valueA, valueB] = getPerpendicularAxisValues(
        positionAttribute,
        vertexIndex,
        axisIndex
      );

      minA = Math.min(minA, valueA);
      maxA = Math.max(maxA, valueA);
      minB = Math.min(minB, valueB);
      maxB = Math.max(maxB, valueB);
      sampleCount += 1;
    }
  }

  if (!sampleCount) return 0;
  return Math.max(maxA - minA, 0) * Math.max(maxB - minB, 0);
}

export default function ensurePrayerGradientAttribute(geometry) {
  if (!geometry || geometry.getAttribute(PRAYER_GRADIENT_ATTRIBUTE)) {
    return geometry;
  }

  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) return geometry;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;

  const axisIndex = getDominantAxisIndex(box);
  const min = getAxisValueFromBox(box, axisIndex, 'min');
  const max = getAxisValueFromBox(box, axisIndex, 'max');
  const span = Math.max(max - min, 1e-6);
  const sliceSpan = Math.max(span * EDGE_SAMPLE_FRACTION, 1e-6);
  const minSliceArea = measureSliceArea(
    positionAttribute,
    axisIndex,
    min,
    sliceSpan,
    'min'
  );
  const maxSliceArea = measureSliceArea(
    positionAttribute,
    axisIndex,
    max,
    sliceSpan,
    'max'
  );
  const wristAtMin = minSliceArea > maxSliceArea;
  const gradientValues = new Float32Array(positionAttribute.count);

  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex += 1
  ) {
    const axisValue = getPositionAxisValue(
      positionAttribute,
      vertexIndex,
      axisIndex
    );
    const normalized = (axisValue - min) / span;

    gradientValues[vertexIndex] = wristAtMin ? 1 - normalized : normalized;
  }

  geometry.setAttribute(
    PRAYER_GRADIENT_ATTRIBUTE,
    new Float32BufferAttribute(gradientValues, 1)
  );

  return geometry;
}
