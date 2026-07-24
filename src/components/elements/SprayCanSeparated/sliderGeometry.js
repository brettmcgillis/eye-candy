import * as THREE from 'three';

// Bounding-box helpers for the SprayCanSeparated model's flat/track-shaped
// parts (slider panels, the color ring/label). Colocated with the element
// rather than under a scene's utils/, since both the interactive can (scene
// code) and the instanced/scattered can (also scene code, but needs the same
// math to give discarded cans a matching slider pose) consume it, and an
// element is the shared layer scenes are meant to pull generic model math
// from — see docs/scene-conventions.md.
export function getLocalBounds(geometry) {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const size = new THREE.Vector3().subVectors(max, min);
  const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
  return { min, max, size, center };
}

// Index (0/1/2 = x/y/z) of the smallest extent — the normal of a mostly-flat
// part like a slider panel or the label.
export function thinnestAxis(size) {
  const values = [size.x, size.y, size.z];
  return values.indexOf(Math.min(...values));
}

// Derives a slider's travel axis/range from its panel + knob geometry
// bounds (rather than hardcoding numbers no one has visually confirmed —
// see CanSlider.jsx). Returns the axis in the geometry's own local space,
// the travel length along it, and the position offset (from the knob's
// authored rest position) that puts it at the start of its travel (t=0).
export function computeSliderAxis({ axis, panelGeometry, sliderGeometry }) {
  const AXIS_INDEX = { x: 0, y: 1, z: 2 };
  const panelBounds = getLocalBounds(panelGeometry);
  const sliderBounds = getLocalBounds(sliderGeometry);
  const normalAxisIndex = axis
    ? AXIS_INDEX[axis]
    : thinnestAxis(panelBounds.size);
  const inPlaneAxes = [0, 1, 2].filter((i) => i !== normalAxisIndex);
  const slack = inPlaneAxes.map(
    (i) => panelBounds.size.getComponent(i) - sliderBounds.size.getComponent(i)
  );
  const axisIndex = slack[0] >= slack[1] ? inPlaneAxes[0] : inPlaneAxes[1];

  const axisVector = new THREE.Vector3().setComponent(axisIndex, 1);
  const margin = sliderBounds.size.getComponent(axisIndex) * 0.15;
  const travelMin =
    panelBounds.min.getComponent(axisIndex) +
    sliderBounds.size.getComponent(axisIndex) / 2 +
    margin;
  const travelMax =
    panelBounds.max.getComponent(axisIndex) -
    sliderBounds.size.getComponent(axisIndex) / 2 -
    margin;
  const localLength = Math.max(0.0001, travelMax - travelMin);
  const restCoordinate = sliderBounds.center.getComponent(axisIndex);

  return { axisVector, localLength, restOffset: travelMin - restCoordinate };
}
