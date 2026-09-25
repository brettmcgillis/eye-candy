import { Fn, Loop, clamp, float, smoothstep, vec2, vec3 } from 'three/tsl';

// Capsules arrive as vec4 endpoint pairs: (a.xyz, radius), (b.xyz, unused).
// Returns (push.x, strength, push.z): the summed away-direction and the
// strongest nearness, 1 at the capsule surface fading to 0 at `reach`.
const capsulePress = Fn(([root, capsules, count, reach]) => {
  const push = vec2(0).toVar();
  const strength = float(0).toVar();
  Loop(count, ({ i }) => {
    const a = capsules.element(i.mul(2));
    const b = capsules.element(i.mul(2).add(1));
    const ab = b.xyz.sub(a.xyz);
    const along = clamp(
      root.sub(a.xyz).dot(ab).div(ab.dot(ab).max(1e-5)),
      0,
      1
    );
    const delta = root.sub(a.xyz.add(ab.mul(along)));
    const k = float(1).sub(smoothstep(0, reach, delta.length().sub(a.w)));
    push.addAssign(delta.xz.div(delta.xz.length().max(1e-4)).mul(k));
    strength.assign(strength.max(k));
  });
  return vec3(push.x, strength, push.y);
});

export default capsulePress;
