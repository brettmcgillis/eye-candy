import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { mix, screenUV, vec3, vec4, wgslFn } from 'three/tsl';

import { aspectGrid, snapToGrid } from './maskOutputs';

// One arrow per grid cell, rotated into the cell's decoded flow direction and
// scaled up with direction/motion confidence. Shaft = box, head = triangle.
const arrowVectorMotion = wgslFn(/* wgsl */ `
  fn arrowVectorMotion(
    stateTexture: texture_2d<f32>,
    inputUv: vec2f,
    snappedUv: vec2f,
    grid: vec2f
  ) -> f32 {
    let cellUv = ((inputUv - snappedUv) * grid + vec2f(0.5)) * 2.0 - 1.0;
    let state = textureLoad(
      stateTexture,
      clamp(
        vec2i(snappedUv * vec2f(textureDimensions(stateTexture))),
        vec2i(0),
        vec2i(textureDimensions(stateTexture)) - vec2i(1)
      ),
      0
    );
    let motion = smoothstep(0.04, 0.18, state.a);
    let flow = state.gb * 2.0 - 1.0;
    let flowLength = length(flow);

    if (motion <= 0.0 || flowLength <= 0.001) {
      return 0.0;
    }

    let direction = flow / flowLength;
    let normal = vec2f(-direction.y, direction.x);
    let arrowUv = vec2f(dot(cellUv, direction), dot(cellUv, normal));
    let directionConfidence = smoothstep(0.08, 0.65, flowLength);
    let motionConfidence = smoothstep(0.04, 0.3, state.a);
    let scale = mix(0.45, 1.0, directionConfidence * motionConfidence);
    let arrowTail = -0.58;
    let arrowTip = 0.66;
    let shaftEnd = 0.1;
    let shaftHalfWidth = 0.065;
    let headStart = -0.20;
    let headBaseWidth = 0.42;
    let shaft = select(0.0, 1.0, arrowUv.x >= arrowTail * scale) *
      select(0.0, 1.0, arrowUv.x <= shaftEnd * scale) *
      select(0.0, 1.0, abs(arrowUv.y) <= shaftHalfWidth * scale);
    let headHalfWidth = max(
      (arrowTip * scale - arrowUv.x) * headBaseWidth,
      0.0
    );
    let head = select(0.0, 1.0, arrowUv.x >= headStart * scale) *
      select(0.0, 1.0, arrowUv.x <= arrowTip * scale) *
      select(0.0, 1.0, abs(arrowUv.y) <= headHalfWidth);

    return max(shaft, head) * motion;
  }
`);

export default function buildFlowOutput({ state, u }) {
  const grid = aspectGrid(u.arrowRows);
  const arrowPattern = arrowVectorMotion({
    stateTexture: state,
    inputUv: screenUV,
    snappedUv: snapToGrid(screenUV, grid),
    grid,
  });
  const base = vec4(mix(u.accentColor, u.lineColor, arrowPattern), 1);
  const glow = bloom(vec4(vec3(arrowPattern), 1), 0.75, 0.5, 0.5);
  return base.add(glow);
}
