/* eslint-disable no-param-reassign */
import {
  Fn,
  attribute,
  clamp,
  cos,
  float,
  max,
  normalize,
  sin,
  transformNormalToView,
  varyingProperty,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import tubeFrame from './tubeFrame';

// A tube whose geometry is never rebuilt: positionNode sweeps a ring around
// `sampleCurve(progress)` and the radial direction it pushes each vertex along
// IS the surface normal. Only positionNode and normalNode are overridden, so
// lights, shadows, environment and PBR all keep working.
//
// `upAxis` may be a function of (spine point, progress), e.g. the normal of a surface
// the tube lies on, which is never parallel to it.
// `sampleCurve(t)` returns the spine point (vec3) for the current instance;
// `radius({ angle, point, progress, tangent })` returns its thickness there,
// which makes radius an animation channel — zero is a strand that is not there
// yet, with no transparency involved.
export default function createTubeMaterial({
  frameMode = 'fixed',
  material = new THREE.MeshStandardNodeMaterial(),
  radius,
  sampleCurve,
  tubularSegments,
  upAxis = vec3(0, 0, 1),
}) {
  const progress = attribute('progress', 'float');
  const angle = attribute('angle', 'float');
  const eps = 0.5 / tubularSegments;
  const tubeNormal = varyingProperty('vec3', 'vTubeNormal');

  material.positionNode = Fn(() => {
    const point = sampleCurve(progress).toVar();
    const next = sampleCurve(clamp(progress.add(eps), 0, 1));
    const prev = sampleCurve(clamp(progress.sub(eps), 0, 1));
    const delta = next.sub(prev);
    const tangent = delta.div(max(delta.length(), float(1e-6))).toVar();
    const up = typeof upAxis === 'function' ? upAxis(point, progress) : upAxis;
    const { binormal, normal } = tubeFrame(frameMode, tangent, up);
    const radial = normal.mul(cos(angle)).add(binormal.mul(sin(angle)));

    tubeNormal.assign(radial);
    return point.add(radial.mul(radius({ angle, point, progress, tangent })));
  })();

  material.normalNode = transformNormalToView(normalize(tubeNormal));

  return material;
}
