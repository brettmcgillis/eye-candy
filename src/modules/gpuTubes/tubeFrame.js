import {
  abs,
  cross,
  mix,
  normalize,
  select,
  smoothstep,
  vec3,
} from 'three/tsl';

// No stateless frame is continuous for every tangent (hairy ball theorem); a
// mode only chooses where it breaks. `fixed` breaks at the two points where
// the curve runs parallel to `upAxis`, which is why it is the default. The
// others are kept because their failures are visual and only comparable side
// by side.
export const FRAME_MODES = ['fixed', 'duff', 'blend', 'leastAligned'];

function fixedFrame(tangent, upAxis) {
  const normal = normalize(cross(upAxis, tangent));
  return { binormal: cross(tangent, normal), normal };
}

// Duff et al. 2017. Its sign(t.z) flips the frame across the t.z = 0 plane,
// pinching the quad between the two rings that straddle it into a bow-tie.
function duffFrame(tangent) {
  const s = select(tangent.z.greaterThanEqual(0), 1, -1);
  const a = s.add(tangent.z).reciprocal().negate();
  const b = tangent.x.mul(tangent.y).mul(a);

  return {
    binormal: vec3(
      b,
      s.add(tangent.y.mul(tangent.y).mul(a)),
      tangent.y.negate()
    ),
    normal: vec3(
      s.mul(tangent.x).mul(tangent.x).mul(a).add(1),
      s.mul(b),
      s.mul(tangent.x).negate()
    ),
  };
}

// Collapses mid-blend where the blended axis passes through the tangent,
// which reads as scattered bright slivers rather than a clean artifact.
function blendFrame(tangent) {
  const up = normalize(
    mix(vec3(0, 1, 0), vec3(0, 0, 1), smoothstep(0.5, 1, abs(tangent.y)))
  );
  return fixedFrame(tangent, up);
}

// Never degenerate, but snaps wherever two tangent components tie.
function leastAlignedFrame(tangent) {
  const t = abs(tangent);
  const up = select(
    t.x.lessThanEqual(t.y).and(t.x.lessThanEqual(t.z)),
    vec3(1, 0, 0),
    select(t.y.lessThanEqual(t.z), vec3(0, 1, 0), vec3(0, 0, 1))
  );
  return fixedFrame(tangent, up);
}

export default function tubeFrame(mode, tangent, upAxis) {
  if (mode === 'duff') return duffFrame(tangent);
  if (mode === 'blend') return blendFrame(tangent);
  if (mode === 'leastAligned') return leastAlignedFrame(tangent);
  return fixedFrame(tangent, upAxis);
}
