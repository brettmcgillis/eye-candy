/* eslint-disable camelcase */
import {
  TWO_PI,
  attribute,
  clamp,
  float,
  floor,
  length,
  max,
  mix,
  mx_noise_float,
  normalGeometry,
  normalize,
  positionGeometry,
  pow,
  select,
  sin,
  smoothstep,
  transformNormalToView,
  varying,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// The 2D scene's split rule (see splitProgress in @modules/subdivision) with
// height: a split's children start as their parent's prism, at its height and
// in its colour, then over one level their gaps open, their colours move to
// their own and their tops rise or sink to their own height. Each cell is a
// unit cube or tri prism scaled into place; a down tri is the prism turned
// 180°, so its normals turn with it.
export default function createCellMaterial({ grow, motion }) {
  const material = new THREE.MeshStandardNodeMaterial();

  const span = attribute('aSpan');
  const shape = attribute('aShape');
  const orient = shape.z;
  const g = max(grow, 0);
  const depth = floor(span.x);
  const shown = g.greaterThanEqual(depth).and(g.lessThan(span.y));
  const t = smoothstep(0, 1, clamp(g.sub(depth), 0, 1));
  const scale = select(shown, motion.gap.mul(2).mul(t).oneMinus(), 0);
  const centre = span.zw;
  const placed = centre.add(
    positionGeometry.xy.mul(shape.xy).mul(orient).mul(scale)
  );

  const color = attribute('aColor');
  const parentColor = attribute('aParentColor');
  const fine = pow(
    clamp(depth.div(max(motion.maxDepth, 1)), 0, 1),
    motion.depthBias
  );
  const noise = mx_noise_float(
    vec3(centre.mul(motion.noiseScale), motion.noisePhase)
  );
  const origin = length(centre.sub(motion.waveOrigin));
  const wave = sin(
    origin.div(motion.waveLength).sub(motion.wavePhase).mul(TWO_PI)
  );
  const offset = motion.noiseAmount
    .mul(noise)
    .add(motion.waveAmount.mul(wave))
    .mul(mix(float(1), fine, motion.depth))
    .mul(motion.mix);
  const top = max(mix(parentColor.w, color.w, t).add(offset), motion.base);
  const z = select(shown, positionGeometry.z.mul(top), 0);

  material.positionNode = vec3(placed, z);
  material.colorNode = varying(
    mix(parentColor.rgb, color.rgb, t),
    'vCellColor'
  );
  material.normalNode = normalize(
    transformNormalToView(vec3(normalGeometry.xy.mul(orient), normalGeometry.z))
  );
  material.roughnessNode = motion.roughness;
  material.metalnessNode = float(0);
  return material;
}
