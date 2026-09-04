import { Fn, vec2 } from 'three/tsl';

// Grain homes are stored on the unit disc and the field texture covers the
// square that disc is inscribed in, so the mapping is a plain remap of
// [-1,1] to [0,1] — independent of the bed's world radius.
const unitToFieldUV = Fn(([x, z]) => {
  return vec2(x.mul(0.5).add(0.5), z.mul(0.5).add(0.5));
});

export default unitToFieldUV;
