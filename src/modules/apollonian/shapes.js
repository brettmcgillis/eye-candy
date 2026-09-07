import { vec3 } from 'three/tsl';

export const sdBox = (p, b) => {
  const q = p.abs().sub(b);
  return q
    .max(vec3(0))
    .length()
    .add(q.x.max(q.y.max(q.z)).min(0));
};

export const sdSphere = (p, r) => p.length().sub(r);

export const sdPlane = (p, h) => p.y.sub(h);
